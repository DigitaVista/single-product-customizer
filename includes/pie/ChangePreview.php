<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

final class ChangePreview
{
    public static function build(array $products, array $requested): array
    {
        $changes = [];
        foreach ($requested as $productId => $features) {
            if (!isset($products[$productId]) || !is_array($features)) {
                throw new \InvalidArgumentException('unknown_product');
            }

            $product = $products[$productId];
            foreach ($features as $featureId => $value) {
                $feature = $product['features'][$featureId] ?? [];
                if (empty($feature['preview_supported']) || ($feature['availability'] ?? null) !== 'available'
                    || !is_bool($feature['configured'] ?? null) || !in_array($value, ['', 'on', 'off'], true)) {
                    throw new \InvalidArgumentException('invalid_feature_selection');
                }
                if ($value === '' || ($value === 'on') === $feature['configured']) {
                    continue;
                }

                $changes[] = [
                    'product_id' => $productId,
                    'feature_id' => $featureId,
                    'label' => $product['label'] . ' / '
                        . ($feature['label'] ?? ucwords(str_replace('_', ' ', $featureId))),
                    'before' => $feature['configured'],
                    'after' => $value === 'on',
                ];
            }
        }

        return $changes;
    }
}
