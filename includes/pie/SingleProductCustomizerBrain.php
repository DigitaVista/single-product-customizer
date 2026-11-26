<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Single Product Customizer's AI brain: knowledge and typed abilities for the Abilities API and MCP.
 * The setting catalog is read from the plugin's own field definitions, so it always matches the
 * installed version. "propose-settings" never writes: it creates a pending plan for approval.
 */
final class SingleProductCustomizerBrain
{
    public const CATEGORY = 'single-product-customizer';
    /** Settings that stop customers from buying; the proposal carries a warning. */
    private const SALES_IMPACT = ['hide_product_price', 'hide_add_to_cart_button'];

    public static function boot(): void
    {
        add_action('wp_abilities_api_categories_init', [self::class, 'registerCategory']);
        add_action('wp_abilities_api_init', [self::class, 'registerAbilities']);
    }

    public static function writableRefs(): array
    {
        return ['/^sppcfw_basic$/'];
    }

    public static function registerCategory(): void
    {
        if (function_exists('wp_register_ability_category')) {
            wp_register_ability_category(self::CATEGORY, [
                'label' => 'Single Product Customizer',
                'description' => 'Single product page settings for WooCommerce: quantity buttons, texts, and hiding page elements.',
            ]);
        }
    }

    public static function registerAbilities(): void
    {
        if (!function_exists('wp_register_ability')) {
            return;
        }
        foreach (self::definitions() as $name => $definition) {
            wp_register_ability($name, $definition);
        }
    }

    public static function definitions(): array
    {
        $admin = static fn (): bool => current_user_can('manage_options');
        $read = ['readonly' => true, 'destructive' => false, 'idempotent' => true];
        $propose = ['readonly' => false, 'destructive' => false, 'idempotent' => false];
        $properties = [];
        foreach (self::catalog() as $id => $field) {
            $properties[$id] = $field['type'] === 'checkbox'
                ? ['type' => 'boolean', 'description' => $field['label']]
                : ['type' => 'string', 'maxLength' => 100, 'description' => $field['label'] . ' (empty = default)'];
        }

        return [
            'single-product-customizer/knowledge' => [
                'label' => 'Single Product Customizer knowledge',
                'description' => 'What the Single Product Customizer settings do, their side effects, and what the assistant can change.',
                'category' => self::CATEGORY,
                'output_schema' => ['type' => 'string'],
                'execute_callback' => [self::class, 'knowledge'],
                'permission_callback' => $admin,
                'meta' => [
                    'show_in_rest' => true,
                    'annotations' => $read,
                    'mcp' => ['public' => true, 'type' => 'resource', 'uri' => 'digitavista://single-product-customizer/knowledge', 'mimeType' => 'text/markdown'],
                ],
            ],
            'single-product-customizer/get-settings' => [
                'label' => 'Get single product page settings',
                'description' => 'Returns every basic Single Product Customizer setting with its type, default and current value.',
                'category' => self::CATEGORY,
                'output_schema' => ['type' => 'object'],
                'execute_callback' => [self::class, 'getSettings'],
                'permission_callback' => $admin,
                'meta' => ['show_in_rest' => true, 'annotations' => $read, 'mcp' => ['public' => true]],
            ],
            'single-product-customizer/propose-settings' => [
                'label' => 'Propose single product page settings',
                'description' => 'Prepares changes to basic Single Product Customizer settings for administrator approval. Nothing changes until approved.',
                'category' => self::CATEGORY,
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'settings' => [
                            'type' => 'object',
                            'properties' => $properties,
                            'additionalProperties' => false,
                            'minProperties' => 1,
                        ],
                    ],
                    'required' => ['settings'],
                    'additionalProperties' => false,
                ],
                'output_schema' => ['type' => 'object'],
                'execute_callback' => [self::class, 'proposeSettings'],
                'permission_callback' => $admin,
                'meta' => ['show_in_rest' => true, 'annotations' => $propose, 'mcp' => ['public' => true]],
            ],
        ];
    }

    /**
     * Basic setting definitions read from the plugin's own settings file.
     *
     * @return array<string, array{label: string, type: string, default: string}>
     */
    public static function catalog(): array
    {
        static $catalog = null;
        if ($catalog !== null) {
            return $catalog;
        }
        $file = dirname(__DIR__, 2) . '/backend/basic/basic-settings.php';
        $collector = new class () {
            public array $fields = [];

            public function add_section(array $section): void
            {
            }

            public function add_field(string $section, array $field): void
            {
                if ($section === 'sppcfw_basic' && is_string($field['id'] ?? null) && in_array($field['type'] ?? null, ['checkbox', 'text'], true)) {
                    $this->fields[$field['id']] = [
                        'label' => wp_strip_all_tags((string) ($field['name'] ?? $field['id'])),
                        'type' => $field['type'],
                        'default' => (string) ($field['default'] ?? ''),
                    ];
                }
            }
        };
        if (is_readable($file)) {
            (static function () use ($file, $collector): void {
                $sppcfw_back_ui_obj = $collector; // Variable name used by the settings file.
                include $file;
            })();
        }

        return $catalog = $collector->fields;
    }

    public static function knowledge(): string
    {
        $file = __DIR__ . '/knowledge-single-product-customizer.md';
        $text = is_readable($file) ? (string) file_get_contents($file) : '';
        $lines = [];
        foreach (self::catalog() as $id => $field) {
            $lines[] = '- `' . $id . '` (' . $field['type'] . '): ' . $field['label'] . ($field['default'] !== '' ? ' — default "' . $field['default'] . '"' : '');
        }

        return $text . "\n## Live setting list\n" . implode("\n", $lines) . "\n";
    }

    public static function getSettings(): array
    {
        $basic = get_option('sppcfw_basic', []);
        $basic = is_array($basic) ? $basic : [];
        $settings = [];
        foreach (self::catalog() as $id => $field) {
            $value = $basic[$id] ?? null;
            $settings[] = [
                'id' => $id,
                'label' => $field['label'],
                'type' => $field['type'],
                'value' => $field['type'] === 'checkbox' ? $value === 'on' : (is_string($value) ? $value : ''),
                'default' => $field['default'],
            ];
        }
        $capabilities = SingleProductCustomizer::capabilities();

        return [
            'settings' => $settings,
            'pro_overrides_active' => (bool) ($capabilities['scoped_overrides_enabled'] ?? false),
        ];
    }

    public static function proposeSettings($input = null)
    {
        $requested = is_array($input['settings'] ?? null) ? $input['settings'] : [];
        $catalog = self::catalog();
        $basic = get_option('sppcfw_basic', []);
        $basic = is_array($basic) ? $basic : [];
        $ops = [];
        $notes = [];
        foreach ($requested as $id => $value) {
            $field = $catalog[$id] ?? null;
            if ($field === null) {
                return new \WP_Error('digitavista_pie_invalid_input', 'Unknown setting "' . sanitize_key((string) $id) . '".', ['status' => 400]);
            }
            $current = $basic[$id] ?? null;
            if ($field['type'] === 'checkbox') {
                if (!is_bool($value)) {
                    return new \WP_Error('digitavista_pie_invalid_input', $field['label'] . ' needs true or false.', ['status' => 400]);
                }
                $ops[] = [
                    'ref' => 'sppcfw_basic',
                    'key' => $id,
                    'value' => $value ? 'on' : null,
                    'setting' => $field['label'],
                    'from_text' => $current === 'on' ? 'on' : 'off',
                    'to_text' => $value ? 'on' : 'off',
                ];
                if ($value && in_array($id, self::SALES_IMPACT, true)) {
                    $notes[] = $field['label'] . ': customers will not be able to buy from the product page while this is on.';
                }
                continue;
            }
            if (!is_string($value) || mb_strlen($value) > 100) {
                return new \WP_Error('digitavista_pie_invalid_input', $field['label'] . ' needs a text of up to 100 characters.', ['status' => 400]);
            }
            $clean = sanitize_text_field($value);
            $ops[] = [
                'ref' => 'sppcfw_basic',
                'key' => $id,
                'value' => $clean === '' ? null : $clean,
                'setting' => $field['label'],
                'from_text' => is_string($current) && $current !== '' ? $current : 'default',
                'to_text' => $clean === '' ? 'default' : $clean,
            ];
        }
        if ($ops === []) {
            return new \WP_Error('digitavista_pie_invalid_input', 'Say which setting to change.', ['status' => 400]);
        }
        if ((SingleProductCustomizer::capabilities()['scoped_overrides_enabled'] ?? false) === true) {
            $notes[] = 'Pro product or category settings are active and can take precedence over these global settings.';
        }

        return Runtime::proposeOperations(SingleProductCustomizer::PRODUCT, 'single-product-customizer/propose-settings', 'Single Product Customizer settings', $ops, $notes);
    }
}
