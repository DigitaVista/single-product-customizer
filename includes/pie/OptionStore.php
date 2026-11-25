<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Guarded access to array-valued options in the options table.
 *
 * Products save these options with unguarded read-modify-write calls, so a PIE-side lock cannot
 * serialise them. Instead every PIE write is a single compare-and-swap statement that only
 * succeeds when the stored bytes still equal the bytes PIE read. A product save that commits
 * first makes the PIE write fail safely. A product save that read before PIE committed and
 * writes afterwards can still overwrite the PIE change; PIE detects that on readback and undo.
 */
final class OptionStore
{
    public const ABSENT = 'absent';

    /** Fresh stored value bypassing every cache, or null when the row does not exist. */
    public static function readRaw(string $option): ?string
    {
        global $wpdb;
        // get_row(), not get_var(): get_var() reports an empty-string value as null (missing row).
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s LIMIT 1",
            $option
        ), ARRAY_N);

        return is_array($row) ? (string) $row[0] : null;
    }

    public static function revision(?string $raw): string
    {
        return $raw === null ? self::ABSENT : hash('sha256', $raw);
    }

    /**
     * @return array{state: string, value: array}|null state is absent, empty or array; null when unsupported.
     */
    public static function decode(?string $raw): ?array
    {
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
     * Mirrors the core update_option() filters so product sanitisation still applies.
     */
    public static function filterNewValue(string $option, array $new, array $old)
    {
        $filtered = sanitize_option($option, $new);
        $filtered = apply_filters("pre_update_option_{$option}", $filtered, $old, $option);

        return apply_filters('pre_update_option', $filtered, $option, $old);
    }

    /**
     * Atomically replaces $expectedRaw (null = row absent) with $new (null = delete row).
     *
     * @param array|string|null $new
     */
    public static function compareAndSwap(string $option, ?string $expectedRaw, $new): bool
    {
        global $wpdb;
        $newRaw = $new === null ? null : maybe_serialize($new);
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

    /** Drops every cached copy of the option so the next get_option() reads the database. */
    public static function flushCache(string $option): void
    {
        wp_cache_delete($option, 'options');
        wp_cache_delete('alloptions', 'options');
        $notOptions = wp_cache_get('notoptions', 'options');
        if (is_array($notOptions) && isset($notOptions[$option])) {
            unset($notOptions[$option]);
            wp_cache_set('notoptions', $notOptions, 'options');
        }
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
