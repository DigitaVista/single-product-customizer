<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

if (!defined('ABSPATH')) {
    return;
}

if (!class_exists(Runtime::class, false)) {
    require_once __DIR__ . '/CapabilityRegistry.php';
    require_once __DIR__ . '/ChangePreview.php';

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
            echo '<p>Select the settings to include in a change preview.</p>';
            $products = self::products();
            $request = $_POST['digitavista_pie_desired'] ?? null;
            if (isset($_POST['digitavista_pie_preview'])) {
                check_admin_referer('digitavista_pie_preview');
                self::renderPreview($products, is_array($request) ? wp_unslash($request) : []);
            }

            echo '<form method="post">';
            wp_nonce_field('digitavista_pie_preview');
            foreach ($products as $productId => $product) {
                echo '<h2>' . esc_html($product['label'] ?? $productId) . '</h2><ul>';
                foreach ($product['features'] as $featureId => $feature) {
                    $label = $feature['label'] ?? ucwords(str_replace('_', ' ', $featureId));
                    $status = match ($feature['availability']) {
                        'available' => $feature['configured'] ? 'Enabled' : 'Disabled',
                        'pro_not_loaded' => 'Pro required',
                        'not_entitled' => 'Active Pro license required',
                        default => 'Unavailable',
                    };
                    echo '<li><label>' . esc_html($label . ' — ' . $status);
                    if ($feature['availability'] === 'available' && !empty($feature['preview_supported'])) {
                        $inputName = 'digitavista_pie_desired[' . $productId . '][' . $featureId . ']';
                        echo ' <select name="' . esc_attr($inputName) . '">';
                        echo '<option value="">Keep current</option><option value="on">Enable</option><option value="off">Disable</option>';
                        echo '</select>';
                    }
                    echo '</label></li>';
                }
                echo '</ul>';
            }

            echo '<p><button type="submit" name="digitavista_pie_preview" value="1" class="button button-primary">Preview changes</button></p>';
            echo '</form></div>';
        }

        private static function renderPreview(array $products, array $request): void
        {
            try {
                $changes = ChangePreview::build($products, $request);
            } catch (\InvalidArgumentException $error) {
                echo '<p role="alert">The selection is invalid or the setting is unavailable.</p>';

                return;
            }

            echo '<h2>Proposed changes</h2>';
            if ($changes === []) {
                echo '<p>No settings need to change.</p>';

                return;
            }

            echo '<ul>';
            foreach ($changes as $change) {
                echo '<li>' . esc_html($change['label'] . ': ' . ($change['before'] ? 'Enabled' : 'Disabled')
                    . ' → ' . ($change['after'] ? 'Enabled' : 'Disabled')) . '</li>';
            }
            echo '</ul><p>This preview uses saved global settings. Product overrides and storefront behavior may differ.</p>';
        }

        private static function products(): array
        {
            $registry = new CapabilityRegistry();
            do_action('digitavista_pie_register_products_v1', $registry);

            return $registry->all();
        }
    }
}
