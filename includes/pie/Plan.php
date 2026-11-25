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
                $decoded = OptionStore::decode($raw);
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
            $decoded = OptionStore::decode(OptionStore::readRaw($option));
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
