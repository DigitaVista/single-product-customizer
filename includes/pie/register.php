<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/SingleProductCustomizer.php';
require_once __DIR__ . '/SingleProductCustomizerBrain.php';

digitavista_pie_v1_offer('1.4.0', __DIR__);
SingleProductCustomizerBrain::boot();

add_action('digitavista_pie_register_products_v1', static function (CapabilityRegistry $registry): void {
    $registry->register(
        SingleProductCustomizer::PRODUCT,
        [SingleProductCustomizer::class, 'capabilities'],
        [SingleProductCustomizer::class, 'bindings']
    );
});
