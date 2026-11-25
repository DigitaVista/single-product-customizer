<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

if (!defined('ABSPATH')) {
    return;
}

if (!class_exists(Runtime::class, false)) {
    require_once __DIR__ . '/CapabilityRegistry.php';

    final class Runtime
    {
        private static bool $booted = false;

        public static function boot(): void
        {
            if (self::$booted) {
                return;
            }

            self::$booted = true;
            add_action('admin_menu', [self::class, 'registerMenu']);
            add_action('rest_api_init', [self::class, 'registerRoutes']);
        }

        public static function registerMenu(): void
        {
            add_management_page(
                'DigitaVista Assistant',
                'DigitaVista Assistant',
                'manage_options',
                'digitavista-assistant',
                [self::class, 'render']
            );
        }

        public static function registerRoutes(): void
        {
            register_rest_route('digita-vista-pie/v1', '/capabilities', [
                'methods' => \WP_REST_Server::READABLE,
                'permission_callback' => static fn (): bool => current_user_can('manage_options'),
                'callback' => static function (): \WP_REST_Response {
                    $response = new \WP_REST_Response([
                        'contract_version' => '1.0',
                        'products' => (object) self::products(),
                    ]);
                    $response->header('Cache-Control', 'private, no-store');

                    return $response;
                },
            ]);
        }

        public static function render(): void
        {
            if (!current_user_can('manage_options')) {
                wp_die('You do not have permission to view the assistant.', '', ['response' => 403]);
            }

            echo '<div class="wrap"><h1>DigitaVista Assistant</h1>';
            echo '<p>Preview of saved plugin settings. Chat and changes are unavailable in this build.</p>';

            foreach (self::products() as $productId => $product) {
                echo '<h2>' . esc_html($product['label'] ?? $productId) . '</h2><ul>';
                foreach ($product['features'] as $featureId => $feature) {
                    $label = $feature['label'] ?? ucwords(str_replace('_', ' ', $featureId));
                    $status = match ($feature['availability']) {
                        'available' => $feature['configured'] ? 'Enabled' : 'Disabled',
                        'pro_not_loaded' => 'Pro required',
                        'not_entitled' => 'Active Pro license required',
                        default => 'Unavailable',
                    };
                    echo '<li>' . esc_html($label . ' — ' . $status) . '</li>';
                }
                echo '</ul>';
            }

            echo '</div>';
        }

        private static function products(): array
        {
            $registry = new CapabilityRegistry();
            do_action('digitavista_pie_register_products_v1', $registry);

            return $registry->all();
        }
    }
}
