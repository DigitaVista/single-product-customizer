<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Guarded access to the stores the Assistant may change.
 *
 * Store references:
 * - "option_name"             array-valued option (keys are array keys)
 * - "option:option_name"      single option value   (one pseudo key "__value")
 * - "termmeta:<id>:<meta_key>" single term meta value (one pseudo key "__value")
 * - "postmeta:<id>:<meta_key>" single post meta value (one pseudo key "__value")
 *
 * Products save these with unguarded read-modify-write calls, so a PIE-side lock cannot serialise
 * them. Every PIE write is a single compare-and-swap statement that only succeeds when the stored
 * bytes still equal the bytes PIE read. A product save that commits first makes the PIE write fail
 * safely. A product save that read before PIE committed and writes afterwards can still overwrite
 * the PIE change; PIE detects that on readback (drift) and on undo.
 */
final class OptionStore
{
    public const ABSENT = 'absent';
    public const VALUE = '__value';
    /** Marker for a meta key stored in more than one row: never decodable, never matched. */
    private const MULTIPLE = "\0pie-multiple-rows\0";

    /** @return array{kind: string, name?: string, id?: int, key?: string}|null */
    public static function parseRef(string $ref): ?array
    {
        if (preg_match('/^[a-z0-9_]{1,128}$/', $ref)) {
            return ['kind' => 'option_array', 'name' => $ref];
        }
        if (preg_match('/^option:([a-z0-9_]{1,128})$/', $ref, $m)) {
            return ['kind' => 'option_scalar', 'name' => $m[1]];
        }
        if (preg_match('/^(termmeta|postmeta):([1-9][0-9]{0,19}):([A-Za-z0-9_]{1,64})$/', $ref, $m)) {
            return ['kind' => $m[1], 'id' => (int) $m[2], 'key' => $m[3]];
        }

        return null;
    }

    public static function isArrayStore(string $ref): bool
    {
        return (self::parseRef($ref)['kind'] ?? null) === 'option_array';
    }

    /** Fresh stored value bypassing every cache, or null when it does not exist. */
    public static function readRaw(string $ref): ?string
    {
        global $wpdb;
        $parsed = self::parseRef($ref);
        if ($parsed === null) {
            return self::MULTIPLE;
        }

        if ($parsed['kind'] === 'option_array' || $parsed['kind'] === 'option_scalar') {
            // get_row(), not get_var(): get_var() reports an empty-string value as null (missing row).
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s LIMIT 1",
                $parsed['name']
            ), ARRAY_N);

            return is_array($row) ? (string) $row[0] : null;
        }

        [$table, $column] = self::metaTable($parsed['kind']);
        $rows = $wpdb->get_col($wpdb->prepare(
            "SELECT meta_value FROM {$table} WHERE {$column} = %d AND meta_key = %s LIMIT 2",
            $parsed['id'],
            $parsed['key']
        ));
        if (count($rows) > 1) {
            return self::MULTIPLE;
        }

        return $rows === [] ? null : (string) $rows[0];
    }

    public static function revision(?string $raw): string
    {
        return $raw === null ? self::ABSENT : hash('sha256', $raw);
    }

    /**
     * @return array{state: string, value: array}|null state is absent, empty, array or scalar; null when unsupported.
     */
    public static function decode(?string $raw, string $ref = ''): ?array
    {
        if ($raw === self::MULTIPLE) {
            return null;
        }
        if ($ref !== '' && !self::isArrayStore($ref)) {
            if ($raw === null) {
                return ['state' => 'absent', 'value' => []];
            }
            // Scalar stores hold plain strings; serialized data is left to the product's own UI.
            return is_serialized($raw) ? null : ['state' => 'scalar', 'value' => [self::VALUE => $raw]];
        }
        if ($raw === null) {
            return ['state' => 'absent', 'value' => []];
        }
        if ($raw === '') {
            return ['state' => 'empty', 'value' => []];
        }
        if (!is_serialized($raw)) {
            return null;
        }

        $value = @unserialize($raw, ['allowed_classes' => false]);
        if (!is_array($value)) {
            return null;
        }

        return ['state' => 'array', 'value' => $value];
    }

    /** Stored bytes for a new value, or null when the row should not exist. */
    public static function encode(string $ref, $new): ?string
    {
        if ($new === null) {
            return null;
        }
        if (!self::isArrayStore($ref)) {
            if (!is_array($new) || !array_key_exists(self::VALUE, $new)) {
                return null;
            }

            return (string) $new[self::VALUE];
        }

        return maybe_serialize($new);
    }

    /** Snapshot of the given keys: key => [present, value]. */
    public static function keySnapshot(array $value, array $keys): array
    {
        $snapshot = [];
        foreach ($keys as $key) {
            $snapshot[$key] = array_key_exists($key, $value)
                ? ['present' => true, 'value' => $value[$key]]
                : ['present' => false, 'value' => null];
        }
        ksort($snapshot);

        return $snapshot;
    }

    public static function applySnapshot(array $value, array $snapshot): array
    {
        foreach ($snapshot as $key => $entry) {
            if ($entry['present']) {
                $value[$key] = $entry['value'];
            } else {
                unset($value[$key]);
            }
        }

        return $value;
    }

    /**
     * Mirrors the core update_option() filters for array options so product sanitisation still
     * applies. Scalar and meta stores are validated by the product ability that proposed them.
     */
    public static function filterNewValue(string $ref, array $new, array $old)
    {
        if (!self::isArrayStore($ref)) {
            return $new;
        }
        $filtered = sanitize_option($ref, $new);
        $filtered = apply_filters("pre_update_option_{$ref}", $filtered, $old, $ref);

        return apply_filters('pre_update_option', $filtered, $ref, $old);
    }

    /** Value as WordPress APIs (and their caches) currently return it, decoded like decode(). */
    public static function readCached(string $ref): ?array
    {
        $parsed = self::parseRef($ref);
        if ($parsed === null) {
            return null;
        }
        if ($parsed['kind'] === 'option_array') {
            $value = get_option($parsed['name'], []);

            return is_array($value) ? $value : ($value === '' || $value === false ? [] : null);
        }
        if ($parsed['kind'] === 'option_scalar') {
            $value = get_option($parsed['name'], null);

            return $value === null || $value === false ? [] : [self::VALUE => (string) $value];
        }
        $type = $parsed['kind'] === 'termmeta' ? 'term' : 'post';
        if (!metadata_exists($type, $parsed['id'], $parsed['key'])) {
            return [];
        }

        return [self::VALUE => (string) get_metadata($type, $parsed['id'], $parsed['key'], true)];
    }

    /**
     * Atomically replaces $expectedRaw (null = absent) with $new (null = remove).
     *
     * @param array|string|null $new
     */
    public static function compareAndSwap(string $ref, ?string $expectedRaw, $new): bool
    {
        $parsed = self::parseRef($ref);
        if ($parsed === null || $expectedRaw === self::MULTIPLE) {
            return false;
        }
        if ($parsed['kind'] === 'option_array' || $parsed['kind'] === 'option_scalar') {
            $newRaw = $parsed['kind'] === 'option_array'
                ? ($new === null ? null : maybe_serialize($new))
                : self::encode($ref, $new);

            return self::swapOption($parsed['name'], $expectedRaw, $newRaw, $new);
        }

        return self::swapMeta($parsed, $expectedRaw, self::encode($ref, $new));
    }

    /** Drops every cached copy so the next read goes to the database. */
    public static function flushCache(string $ref): void
    {
        $parsed = self::parseRef($ref);
        if ($parsed === null) {
            return;
        }
        if ($parsed['kind'] === 'termmeta') {
            wp_cache_delete($parsed['id'], 'term_meta');

            return;
        }
        if ($parsed['kind'] === 'postmeta') {
            wp_cache_delete($parsed['id'], 'post_meta');
            clean_post_cache($parsed['id']);

            return;
        }

        $option = $parsed['name'];
        wp_cache_delete($option, 'options');
        wp_cache_delete('alloptions', 'options');
        $notOptions = wp_cache_get('notoptions', 'options');
        if (is_array($notOptions) && isset($notOptions[$option])) {
            unset($notOptions[$option]);
            wp_cache_set('notoptions', $notOptions, 'options');
        }
    }

    private static function swapOption(string $option, ?string $expectedRaw, ?string $newRaw, $new): bool
    {
        global $wpdb;
        if ($newRaw === $expectedRaw) {
            return true;
        }

        $old = $expectedRaw === null ? false : maybe_unserialize($expectedRaw);
        $binary = self::isMysql() ? 'BINARY ' : '';
        if ($expectedRaw === null) {
            do_action('add_option', $option, $new);
            $suppress = $wpdb->suppress_errors(true);
            $rows = $wpdb->query($wpdb->prepare(
                "INSERT INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, %s)",
                $option,
                $newRaw,
                self::autoloadValue($option, $new)
            ));
            $wpdb->suppress_errors($suppress);
        } elseif ($newRaw === null) {
            do_action('delete_option', $option);
            $rows = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name = %s AND {$binary}option_value = %s",
                $option,
                $expectedRaw
            ));
        } else {
            do_action('update_option', $option, $old, $new);
            $rows = $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND {$binary}option_value = %s",
                $newRaw,
                $option,
                $expectedRaw
            ));
        }

        self::flushCache($option);
        if ($rows !== 1) {
            return false;
        }

        if ($expectedRaw === null) {
            do_action("add_option_{$option}", $option, $new);
            do_action('added_option', $option, $new);
        } elseif ($newRaw === null) {
            do_action("delete_option_{$option}", $option);
            do_action('deleted_option', $option);
        } else {
            do_action("update_option_{$option}", $old, $new, $option);
            do_action('updated_option', $option, $old, $new);
        }

        return true;
    }

    private static function swapMeta(array $parsed, ?string $expectedRaw, ?string $newRaw): bool
    {
        global $wpdb;
        if ($newRaw === $expectedRaw) {
            return true;
        }

        [$table, $column] = self::metaTable($parsed['kind']);
        $binary = self::isMysql() ? 'BINARY ' : '';
        if ($expectedRaw === null) {
            // Insert only while no row exists for this object and key.
            $rows = $wpdb->query($wpdb->prepare(
                "INSERT INTO {$table} ({$column}, meta_key, meta_value) SELECT %d, %s, %s FROM (SELECT 1 AS one) AS pie_one "
                . "WHERE NOT EXISTS (SELECT 1 FROM {$table} WHERE {$column} = %d AND meta_key = %s)",
                $parsed['id'],
                $parsed['key'],
                $newRaw,
                $parsed['id'],
                $parsed['key']
            ));
        } elseif ($newRaw === null) {
            $rows = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$table} WHERE {$column} = %d AND meta_key = %s AND {$binary}meta_value = %s",
                $parsed['id'],
                $parsed['key'],
                $expectedRaw
            ));
        } else {
            $rows = $wpdb->query($wpdb->prepare(
                "UPDATE {$table} SET meta_value = %s WHERE {$column} = %d AND meta_key = %s AND {$binary}meta_value = %s",
                $newRaw,
                $parsed['id'],
                $parsed['key'],
                $expectedRaw
            ));
        }

        self::flushCache($parsed['kind'] . ':' . $parsed['id'] . ':' . $parsed['key']);

        return $rows === 1;
    }

    /** @return array{0: string, 1: string} table and object-id column */
    private static function metaTable(string $kind): array
    {
        global $wpdb;

        return $kind === 'termmeta' ? [$wpdb->termmeta, 'term_id'] : [$wpdb->postmeta, 'post_id'];
    }

    private static function isMysql(): bool
    {
        global $wpdb;

        return !(defined('DB_ENGINE') && DB_ENGINE === 'sqlite') && !($wpdb instanceof \WP_SQLite_DB);
    }

    private static function autoloadValue(string $option, $value): string
    {
        if (function_exists('wp_determine_option_autoload_value')) {
            return (string) wp_determine_option_autoload_value($option, $value, maybe_serialize($value), null);
        }

        return 'yes';
    }
}
