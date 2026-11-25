<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

final class SingleProductCustomizer
{
    public const PRODUCT = 'single-product-customizer';

    public static function capabilities(): array
    {
        $free = defined('SPPCFW_VERSION') ? SPPCFW_VERSION : null;
        $pro = defined('SPPCFW_PRO_VERSION') ? SPPCFW_PRO_VERSION : null;
        $supported = $free === '1.1.1' && class_exists('WooCommerce');
        $licensed = $supported && $pro === '1.0.6'
            && function_exists('sppcfw_pro_license_is_active')
            && sppcfw_pro_license_is_active();

        $basic = $supported ? get_option('sppcfw_basic', []) : [];
        $advanced = $supported ? get_option('sppcfw_advanced', []) : [];
        $basic = is_array($basic) ? $basic : [];
        $advanced = is_array($advanced) ? $advanced : [];

        $override = $licensed && (
            self::enabled($advanced, 'enable_customizer_for_product')
            || self::enabled($advanced, 'enable_customizer_for_category')
        );
        $freeStatus = $supported ? 'available' : 'unsupported_environment';
        $proStatus = match (true) {
            !$supported => 'unsupported_environment',
            $pro === null => 'pro_not_loaded',
            $pro !== '1.0.6', !function_exists('sppcfw_pro_license_is_active') => 'unknown',
            !$licensed => 'not_entitled',
            default => 'available',
        };

        return [
            'contract_version' => '1.1',
            'product_id' => self::PRODUCT,
            'label' => 'Single Product Customizer',
            'versions' => ['free' => $free, 'pro' => $pro],
            'scope' => 'global',
            'admin_pages' => ['sppcfw-single-product-customizer'],
            'scoped_overrides_enabled' => $override,
            'features' => [
                'quantity_buttons' => [
                    'preview_supported' => true,
                    'availability' => $freeStatus,
                    'configured' => $supported ? self::enabled($basic, 'enable_plus_minus_button') : null,
                    'notes' => [
                        'Product-level and category-level Single Product Customizer settings take precedence over this global setting where they are configured.',
                        'Products sold individually do not show quantity buttons.',
                    ],
                ],
                'hide_product_meta' => [
                    'availability' => $freeStatus,
                    'configured' => $supported ? self::enabled($basic, 'remove_product_meta') : null,
                ],
                'quantity_limits' => [
                    'availability' => $proStatus,
                    'configured' => $licensed ? self::enabled($advanced, 'enable_min_max_qty') : null,
                ],
            ],
        ];
    }

    /** Allowlisted write operations (contract 1.1). Only the global quantity buttons toggle is writable. */
    public static function bindings(): array
    {
        if (!defined('SPPCFW_VERSION') || SPPCFW_VERSION !== '1.1.1' || !class_exists('WooCommerce')) {
            return [];
        }

        return [
            'quantity_buttons' => [
                'kind' => 'option_array_toggle',
                'option' => 'sppcfw_basic',
                'key' => 'enable_plus_minus_button',
                'on' => 'on',
                'off' => null,
                'entitlement' => 'free',
            ],
        ];
    }

    private static function enabled(array $settings, string $key): bool
    {
        return ($settings[$key] ?? null) === 'on';
    }
}
