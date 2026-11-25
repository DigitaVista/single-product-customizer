<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/Runtime.php';
require_once __DIR__ . '/SingleProductCustomizer.php';

Runtime::boot();

add_action('digitavista_pie_register_products_v1', static function (CapabilityRegistry $registry): void {
    $registry->register(SingleProductCustomizer::PRODUCT, [SingleProductCustomizer::class, 'capabilities']);
});
