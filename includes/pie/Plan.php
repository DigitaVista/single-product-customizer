<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Builds and revalidates immutable change plans for allowlisted toggle bindings.
 */
final class Plan
{
    public const SCHEMA = 'digitavista.pie.plan/1';
    public const ACTION = 'settings.toggle';
    public const TTL = 900;

    public static function canonicalJson(array $payload): string
    {
        return (string) wp_json_encode(self::sortKeys($payload), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @throws \InvalidArgumentException when the request is not an allowlisted, currently valid change.
     */
    public static function build(array $products, array $bindings, array $requested, int $userId, string $runtimeVersion): ?array
    {
        $changes = ChangePreview::build($products, $requested);
        if ($changes === []) {
            return null;
        }

        $options = [];
        $planned = [];
        foreach ($changes as $change) {
            $productId = $change['product_id'];
            $featureId = $change['feature_id'];
            $binding = $bindings[$productId][$featureId] ?? null;
            if ($binding === null) {
                throw new \InvalidArgumentException('feature_not_writable');
            }

            $option = $binding['option'];
            if (!isset($options[$option])) {
                $raw = OptionStore::readRaw($option);
                $decoded = OptionStore::decode($raw, $option);
                if ($decoded === null) {
                    throw new \InvalidArgumentException('unsupported_option_state');
                }
                $options[$option] = [
                    'before_revision' => OptionStore::revision($raw),
                    'before_state' => $decoded['state'],
                    'decoded' => $decoded['value'],
                    'keys' => [],
                ];
            }
            if (isset($options[$option]['keys'][$binding['key']])) {
                throw new \InvalidArgumentException('duplicate_binding_key');
            }

            $current = ($options[$option]['decoded'][$binding['key']] ?? null) === $binding['on'];
            if ($current !== $change['before']) {
                throw new \InvalidArgumentException('adapter_state_mismatch');
            }

            $options[$option]['keys'][$binding['key']] = true;
            $alsoSets = [];
            if ($change['after']) {
                foreach ($binding['defaults_when_on'] ?? [] as $defaultKey => $defaultValue) {
                    if (!array_key_exists($defaultKey, $options[$option]['decoded'])) {
                        if (isset($options[$option]['keys'][$defaultKey])) {
                            throw new \InvalidArgumentException('duplicate_binding_key');
                        }
                        $options[$option]['keys'][$defaultKey] = true;
                        $alsoSets[$defaultKey] = $defaultValue;
                    }
                }
            }
            $feature = $products[$productId]['features'][$featureId];
            $planned[] = [
                'product_id' => $productId,
                'product_label' => (string) ($products[$productId]['label'] ?? $productId),
                'product_versions' => $products[$productId]['versions'] ?? [],
                'feature_id' => $featureId,
                'label' => $change['label'],
                'scope' => (string) ($products[$productId]['scope'] ?? 'global'),
                'binding' => $binding,
                'from' => $change['before'],
                'to' => $change['after'],
                'also_sets' => $alsoSets,
                'notes' => self::notes($feature),
                'verification' => 'saved_setting_readback',
            ];
        }

        $snapshots = [];
        foreach ($options as $option => $info) {
            $snapshots[$option] = [
                'before_revision' => $info['before_revision'],
                'before_state' => $info['before_state'],
                'keys' => OptionStore::keySnapshot($info['decoded'], array_keys($info['keys'])),
            ];
        }
        ksort($snapshots);
        $now = time();

        return [
            'schema' => self::SCHEMA,
            'action' => self::ACTION,
            'runtime_version' => $runtimeVersion,
            'site' => ['blog_id' => get_current_blog_id(), 'home' => home_url()],
            'user_id' => $userId,
            'created_at' => $now,
            'expires_at' => $now + self::TTL,
            'changes' => $planned,
            'options' => $snapshots,
        ];
    }

    /**
     * Rechecks a stored plan against the live site. Returns a list of reason codes; empty means valid.
     */
    public static function revalidate(array $payload, array $products, array $bindings, string $runtimeVersion, bool $checkRevisions = true): array
    {
        $reasons = [];
        if (($payload['schema'] ?? null) !== self::SCHEMA || ($payload['action'] ?? null) !== self::ACTION) {
            return ['unsupported_plan'];
        }
        if (($payload['runtime_version'] ?? null) !== $runtimeVersion) {
            $reasons[] = 'runtime_version_changed';
        }
        if (($payload['site']['blog_id'] ?? null) !== get_current_blog_id() || ($payload['site']['home'] ?? null) !== home_url()) {
            $reasons[] = 'site_changed';
        }

        foreach ($payload['changes'] as $change) {
            $product = $products[$change['product_id']] ?? null;
            $feature = $product['features'][$change['feature_id']] ?? null;
            if ($product === null) {
                $reasons[] = 'product_inactive:' . $change['product_id'];
                continue;
            }
            if (!self::same($product['versions'] ?? [], $change['product_versions'])) {
                $reasons[] = 'product_version_changed:' . $change['product_id'];
            }
            if (($change['kind'] ?? 'toggle') === 'operations') {
                foreach (array_keys($change['ops']) as $ref) {
                    if (!self::refAllowed((string) $ref, $product['writable_refs'] ?? [])) {
                        $reasons[] = 'store_not_allowed:' . $ref;
                    }
                }
                continue;
            }
            if (!is_array($feature) || ($feature['availability'] ?? null) !== 'available') {
                $reasons[] = 'feature_unavailable:' . $change['feature_id'];
                continue;
            }
            if (!self::same($bindings[$change['product_id']][$change['feature_id']] ?? null, $change['binding'])) {
                $reasons[] = 'binding_changed:' . $change['feature_id'];
            }
        }

        if ($checkRevisions) {
            foreach ($payload['options'] as $option => $snapshot) {
                if (OptionStore::revision(OptionStore::readRaw($option)) !== $snapshot['before_revision']) {
                    $reasons[] = 'setting_changed_since_preview:' . $option;
                }
            }
        }

        return array_values(array_unique($reasons));
    }

    /**
     * Options whose saved keys no longer match what the plan applied, for example because a
     * product save that read the option before PIE committed wrote its older copy afterwards.
     */
    public static function drift(array $payload): array
    {
        $drifted = [];
        foreach (self::targets($payload) as $option => $keys) {
            $decoded = OptionStore::decode(OptionStore::readRaw($option), $option);
            if ($decoded === null || OptionStore::keySnapshot($decoded['value'], array_keys($keys)) !== $keys) {
                $drifted[] = $option;
            }
        }

        return $drifted;
    }

    /** Intended key state per option after the plan is applied. */
    public static function targets(array $payload): array
    {
        $targets = [];
        foreach ($payload['changes'] as $change) {
            if (($change['kind'] ?? 'toggle') === 'operations') {
                foreach ($change['ops'] as $ref => $keys) {
                    foreach ($keys as $key => $entry) {
                        $targets[$ref][$key] = $entry;
                    }
                }
                continue;
            }
            $binding = $change['binding'];
            $value = $change['to'] ? $binding['on'] : $binding['off'];
            $targets[$binding['option']][$binding['key']] = $value === null
                ? ['present' => false, 'value' => null]
                : ['present' => true, 'value' => $value];
            foreach ($change['also_sets'] ?? [] as $key => $alsoValue) {
                $targets[$binding['option']][$key] = ['present' => true, 'value' => $alsoValue];
            }
        }
        foreach ($targets as &$keys) {
            ksort($keys);
        }
        ksort($targets);

        return $targets;
    }

    /**
     * Builds a plan from typed operations that a product ability validated.
     *
     * @param list<array{ref: string, key?: string, value: ?string, setting: string, from_text: string, to_text: string}> $ops
     *        key defaults to the single-value key; value null removes the key or meta row.
     * @throws \InvalidArgumentException
     */
    public static function buildOperations(string $productId, string $abilityName, string $label, array $ops, array $notes, array $products, int $userId, string $runtimeVersion): ?array
    {
        $product = $products[$productId] ?? null;
        if ($product === null) {
            throw new \InvalidArgumentException('product_inactive');
        }
        if ($ops === [] || count($ops) > 50) {
            throw new \InvalidArgumentException('invalid_operation_count');
        }

        $stores = [];
        $targetOps = [];
        $display = [];
        foreach ($ops as $op) {
            $ref = (string) ($op['ref'] ?? '');
            $key = (string) ($op['key'] ?? OptionStore::VALUE);
            $value = $op['value'] ?? null;
            if (!self::refAllowed($ref, $product['writable_refs'] ?? []) || ($value !== null && !is_string($value))
                || (!OptionStore::isArrayStore($ref) && $key !== OptionStore::VALUE) || strlen((string) $value) > 1000) {
                throw new \InvalidArgumentException('operation_not_allowed');
            }
            if (!isset($stores[$ref])) {
                $raw = OptionStore::readRaw($ref);
                $decoded = OptionStore::decode($raw, $ref);
                if ($decoded === null) {
                    throw new \InvalidArgumentException('unsupported_store_state');
                }
                $stores[$ref] = ['raw' => $raw, 'decoded' => $decoded, 'keys' => []];
            }
            if (isset($stores[$ref]['keys'][$key])) {
                throw new \InvalidArgumentException('duplicate_operation');
            }
            $current = $stores[$ref]['decoded']['value'];
            $unchanged = $value === null
                ? !array_key_exists($key, $current)
                : (array_key_exists($key, $current) && $current[$key] === $value);
            if ($unchanged) {
                continue;
            }
            $stores[$ref]['keys'][$key] = true;
            $targetOps[$ref][$key] = $value === null ? ['present' => false, 'value' => null] : ['present' => true, 'value' => $value];
            $display[] = [
                'setting' => substr((string) ($op['setting'] ?? $key), 0, 160),
                'from_text' => substr((string) ($op['from_text'] ?? ''), 0, 80),
                'to_text' => substr((string) ($op['to_text'] ?? ''), 0, 80),
            ];
        }
        if ($targetOps === []) {
            return null;
        }

        $snapshots = [];
        foreach ($targetOps as $ref => $keys) {
            ksort($targetOps[$ref]);
            $snapshots[$ref] = [
                'before_revision' => OptionStore::revision($stores[$ref]['raw']),
                'before_state' => $stores[$ref]['decoded']['state'],
                'keys' => OptionStore::keySnapshot($stores[$ref]['decoded']['value'], array_keys($keys)),
            ];
        }
        ksort($targetOps);
        ksort($snapshots);
        $now = time();
        $cleanNotes = array_values(array_slice(array_filter(array_map(
            static fn ($note): string => is_string($note) ? substr($note, 0, 300) : '',
            $notes
        )), 0, 10));

        return [
            'schema' => self::SCHEMA,
            'action' => self::ACTION,
            'runtime_version' => $runtimeVersion,
            'site' => ['blog_id' => get_current_blog_id(), 'home' => home_url()],
            'user_id' => $userId,
            'created_at' => $now,
            'expires_at' => $now + self::TTL,
            'changes' => [[
                'kind' => 'operations',
                'product_id' => $productId,
                'product_label' => (string) ($product['label'] ?? $productId),
                'product_versions' => $product['versions'] ?? [],
                'feature_id' => $abilityName,
                'label' => substr($label, 0, 160),
                'scope' => 'site',
                'ops' => $targetOps,
                'display' => $display,
                'notes' => $cleanNotes,
                'verification' => 'saved_setting_readback',
            ]],
            'options' => $snapshots,
        ];
    }

    /** A product may only write stores matching its declared patterns; core-critical options never. */
    public static function refAllowed(string $ref, $patterns): bool
    {
        $parsed = OptionStore::parseRef($ref);
        if ($parsed === null || !is_array($patterns)) {
            return false;
        }
        if (isset($parsed['name']) && CapabilityRegistry::isProtectedOption($parsed['name'])) {
            return false;
        }
        foreach ($patterns as $pattern) {
            if (is_string($pattern) && @preg_match($pattern, $ref) === 1) {
                return true;
            }
        }

        return false;
    }

    private static function same($left, $right): bool
    {
        return self::canonicalJson(['v' => $left]) === self::canonicalJson(['v' => $right]);
    }

    private static function notes(array $feature): array
    {
        $notes = $feature['notes'] ?? [];
        if (!is_array($notes)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn ($note): string => is_string($note) ? substr($note, 0, 300) : '',
            $notes
        )));
    }

    private static function sortKeys($value)
    {
        if (!is_array($value)) {
            return $value;
        }
        if (!array_is_list($value)) {
            ksort($value, SORT_STRING);
        }

        return array_map([self::class, 'sortKeys'], $value);
    }
}
