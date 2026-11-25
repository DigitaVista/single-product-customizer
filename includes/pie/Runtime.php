<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

if (!defined('ABSPATH')) {
    return;
}

if (!class_exists(Runtime::class, false)) {
    require_once __DIR__ . '/CapabilityRegistry.php';
    require_once __DIR__ . '/ChangePreview.php';
    require_once __DIR__ . '/OptionStore.php';
    require_once __DIR__ . '/Plan.php';
    require_once __DIR__ . '/PlanStore.php';
    require_once __DIR__ . '/Executor.php';

    final class Runtime
    {
        public const CONTRACT_VERSION = '1.1';
        private const PAGE = 'digitavista-assistant';

        private static bool $booted = false;
        private static string $version = '0.0.0';
        private static array $offers = [];

        public static function boot(string $version = '0.0.0', array $offers = []): void
        {
            if (self::$booted) {
                return;
            }

            self::$booted = true;
            self::$version = $version;
            self::$offers = $offers;
            add_action('admin_menu', [self::class, 'registerMenu']);
            add_action('rest_api_init', [self::class, 'registerRoutes']);
            foreach (['approve', 'cancel', 'undo'] as $action) {
                add_action('admin_post_digitavista_pie_' . $action, [self::class, 'handlePost']);
            }
        }

        public static function version(): string
        {
            return self::$version;
        }

        public static function registerMenu(): void
        {
            add_management_page(
                'DigitaVista Assistant',
                'DigitaVista Assistant',
                'manage_options',
                self::PAGE,
                [self::class, 'render']
            );
        }

        public static function registerRoutes(): void
        {
            $admin = static fn (): bool => current_user_can('manage_options');
            register_rest_route('digita-vista-pie/v1', '/capabilities', [
                'methods' => \WP_REST_Server::READABLE,
                'permission_callback' => $admin,
                'callback' => static function (): \WP_REST_Response {
                    [$products, $bindings] = self::live();
                    foreach ($products as $productId => &$product) {
                        foreach ($product['features'] as $featureId => &$feature) {
                            $feature['write_supported'] = isset($bindings[$productId][$featureId]);
                        }
                    }
                    unset($product, $feature);

                    return self::noStore([
                        'contract_version' => self::CONTRACT_VERSION,
                        'runtime' => ['version' => self::$version, 'offered_versions' => array_values(array_unique(self::$offers))],
                        'products' => (object) $products,
                    ]);
                },
            ]);
            register_rest_route('digita-vista-pie/v1', '/plans', [
                'methods' => \WP_REST_Server::CREATABLE,
                'permission_callback' => $admin,
                'args' => [
                    'changes' => ['type' => 'object', 'required' => true],
                ],
                'callback' => static function (\WP_REST_Request $request) {
                    $changes = $request->get_param('changes');
                    $plan = self::createPlan(is_array($changes) ? $changes : []);
                    if (is_wp_error($plan)) {
                        return $plan;
                    }

                    return self::noStore($plan === null ? ['plan' => null] : ['plan' => self::summary($plan)], 201);
                },
            ]);
            register_rest_route('digita-vista-pie/v1', '/plans/(?P<id>[0-9a-f]{32})', [
                'methods' => \WP_REST_Server::READABLE,
                'permission_callback' => $admin,
                'callback' => static function (\WP_REST_Request $request) {
                    self::executor()->recoverStale();
                    $plan = PlanStore::get((string) $request['id']);
                    if ($plan === null || $plan['blog_id'] !== get_current_blog_id() || $plan['user_id'] !== get_current_user_id()) {
                        return new \WP_Error('digitavista_pie_not_found', 'Plan not found.', ['status' => 404]);
                    }

                    return self::noStore(['plan' => self::summary($plan)]);
                },
            ]);
        }

        /**
         * Creates a pending plan for the current administrator.
         *
         * @return array|null|\WP_Error null when nothing needs to change.
         */
        public static function createPlan(array $requested)
        {
            PlanStore::install();
            [$products, $bindings] = self::live();
            try {
                $payload = Plan::build($products, $bindings, $requested, get_current_user_id(), self::$version);
            } catch (\InvalidArgumentException $error) {
                return new \WP_Error('digitavista_pie_invalid_request', 'The selection is invalid or the setting is unavailable.', [
                    'status' => 400,
                    'reason' => $error->getMessage(),
                ]);
            }

            return $payload === null ? null : PlanStore::create($payload, (int) $payload['expires_at']);
        }

        public static function executor(): Executor
        {
            PlanStore::install();

            return new Executor(self::$version, [self::class, 'live']);
        }

        /** @return array{0: array, 1: array} live products and write bindings */
        public static function live(): array
        {
            $registry = new CapabilityRegistry();
            do_action('digitavista_pie_register_products_v1', $registry);

            return [$registry->all(), $registry->bindings()];
        }

        public static function handlePost(): void
        {
            if (!current_user_can('manage_options')) {
                wp_die('You do not have permission to change these settings.', '', ['response' => 403]);
            }

            $action = substr((string) current_action(), strlen('admin_post_digitavista_pie_'));
            $planId = isset($_POST['plan_id']) ? sanitize_key(wp_unslash($_POST['plan_id'])) : '';
            check_admin_referer('digitavista_pie_' . $action . '_' . $planId);
            $outcome = self::dispatch($action, $planId);
            wp_safe_redirect(add_query_arg([
                'page' => self::PAGE,
                'plan' => $outcome['plan_id'] ?? '',
            ], admin_url('tools.php')));
            exit;
        }

        /** Runs an already authenticated, nonce-checked admin action. */
        public static function dispatch(string $action, string $planId): array
        {
            $executor = self::executor();
            $user = get_current_user_id();

            return match ($action) {
                'approve' => $executor->approve($planId, $user),
                'cancel' => $executor->cancel($planId, $user),
                'undo' => $executor->undo($planId, $user),
                default => ['status' => 'not_found', 'reasons' => ['unknown_action'], 'replay' => false, 'plan_id' => null],
            };
        }

        public static function render(): void
        {
            if (!current_user_can('manage_options')) {
                wp_die('You do not have permission to view the assistant.', '', ['response' => 403]);
            }

            PlanStore::install();
            self::executor()->recoverStale();
            echo '<div class="wrap"><h1>DigitaVista Assistant</h1>';
            [$products, $bindings] = self::live();
            $request = $_POST['digitavista_pie_desired'] ?? null;
            if (isset($_POST['digitavista_pie_preview'])) {
                check_admin_referer('digitavista_pie_preview');
                self::renderNewPlan(is_array($request) ? wp_unslash($request) : []);
            } elseif (isset($_GET['plan'])) {
                $plan = PlanStore::get(sanitize_key(wp_unslash($_GET['plan'])));
                if ($plan !== null && $plan['blog_id'] === get_current_blog_id() && $plan['user_id'] === get_current_user_id()) {
                    self::renderPlan($plan);
                }
            }

            echo '<p>Select the settings to include in a change preview. Nothing changes until you approve the preview.</p>';
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
                        if (!isset($bindings[$productId][$featureId])) {
                            echo ' ' . esc_html('(preview only)');
                        }
                    }
                    echo '</label></li>';
                }
                echo '</ul>';
            }

            echo '<p><button type="submit" name="digitavista_pie_preview" value="1" class="button button-primary">Preview changes</button></p>';
            echo '</form>';
            self::renderHistory();
            echo '</div>';
        }

        private static function renderNewPlan(array $request): void
        {
            [$products] = self::live();
            try {
                $changes = ChangePreview::build($products, $request);
            } catch (\InvalidArgumentException $error) {
                echo '<p role="alert">The selection is invalid or the setting is unavailable.</p>';

                return;
            }
            if ($changes === []) {
                echo '<h2>Proposed changes</h2><p>No settings need to change.</p>';

                return;
            }

            $plan = self::createPlan($request);
            if (is_wp_error($plan) || $plan === null) {
                echo '<h2>Proposed changes</h2><ul>';
                foreach ($changes as $change) {
                    echo '<li>' . esc_html($change['label'] . ': ' . self::onOff($change['before']) . ' → ' . self::onOff($change['after'])) . '</li>';
                }
                echo '</ul><p role="alert">This preview cannot be applied by the assistant. Use the product settings page instead.</p>';

                return;
            }

            self::renderPlan($plan);
        }

        private static function renderPlan(array $plan): void
        {
            $payload = $plan['payload_data'];
            echo '<div class="card" style="max-width:none"><h2>Proposed changes</h2>';
            echo '<table class="widefat striped"><thead><tr><th scope="col">Plugin</th><th scope="col">Setting</th><th scope="col">Scope</th><th scope="col">Current</th><th scope="col">Proposed</th></tr></thead><tbody>';
            foreach ($payload['changes'] as $change) {
                echo '<tr><td>' . esc_html($change['product_label']) . '</td><td>' . esc_html($change['label'])
                    . '</td><td>' . esc_html($change['scope']) . '</td><td>' . esc_html(self::onOff($change['from']))
                    . '</td><td>' . esc_html(self::onOff($change['to'])) . '</td></tr>';
            }
            echo '</tbody></table>';

            $notes = array_merge([], ...array_map(static fn (array $change): array => $change['notes'], $payload['changes']));
            foreach ($payload['changes'] as $change) {
                foreach ($change['also_sets'] ?? [] as $key => $value) {
                    array_unshift($notes, sprintf(
                        '%s: also saves "%s" = "%s". This setting has never been saved on this site and is required for the feature to work. Undo removes it again.',
                        $change['product_label'],
                        $key,
                        $value
                    ));
                }
            }
            if ($notes !== []) {
                echo '<h3>Dependencies and conflicts</h3><ul>';
                foreach (array_unique($notes) as $note) {
                    echo '<li>' . esc_html($note) . '</li>';
                }
                echo '</ul>';
            }

            echo '<p>Verification: the assistant reads the saved settings back after the change. It does not check the storefront.</p>';
            echo '<p role="status"><strong>Status:</strong> ' . esc_html(self::statusLabel($plan['status'])) . '</p>';
            if ($plan['status'] === 'applied' && Plan::drift($payload) !== []) {
                echo '<p role="alert">' . esc_html('A setting from this change has been modified since it was applied, possibly by a save in the product settings. Check the current values before using Undo.') . '</p>';
            }
            $reasons = $plan['result']['reasons'] ?? [];
            if ($reasons !== []) {
                echo '<p>' . esc_html('Details: ' . implode(', ', $reasons)) . '</p>';
            }

            if ($plan['status'] === 'pending' && $plan['expires_at'] > time()) {
                echo '<p>' . esc_html('This preview expires at ' . wp_date('H:i', $plan['expires_at']) . '.') . '</p>';
                self::actionButton('approve', $plan['id'], 'Approve and apply', 'button button-primary');
                self::actionButton('cancel', $plan['id'], 'Cancel', 'button');
            } elseif ($plan['status'] === 'applied') {
                self::actionButton('undo', $plan['id'], 'Undo this change', 'button');
            }
            echo '</div>';
        }

        private static function renderHistory(): void
        {
            $plans = PlanStore::recent(5);
            if ($plans === []) {
                return;
            }

            echo '<h2>Recent assistant changes</h2><ul>';
            foreach ($plans as $plan) {
                $labels = array_map(static fn (array $change): string => $change['label'] . ' → ' . self::onOff($change['to']), $plan['payload_data']['changes']);
                echo '<li>' . esc_html(wp_date('Y-m-d H:i', $plan['created_at']) . ' — ' . implode('; ', $labels) . ' — ' . self::statusLabel($plan['status']));
                if ($plan['status'] === 'applied') {
                    echo ' ';
                    self::actionButton('undo', $plan['id'], 'Undo', 'button button-small', true);
                }
                echo '</li>';
            }
            echo '</ul>';
        }

        private static function actionButton(string $action, string $planId, string $label, string $class, bool $inline = false): void
        {
            echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:' . ($inline ? 'inline' : 'inline-block') . ';margin-right:8px">';
            echo '<input type="hidden" name="action" value="' . esc_attr('digitavista_pie_' . $action) . '">';
            echo '<input type="hidden" name="plan_id" value="' . esc_attr($planId) . '">';
            wp_nonce_field('digitavista_pie_' . $action . '_' . $planId);
            echo '<button type="submit" class="' . esc_attr($class) . '">' . esc_html($label) . '</button></form>';
        }

        public static function summary(array $plan): array
        {
            $payload = $plan['payload_data'];

            return [
                'id' => $plan['id'],
                'hash' => $plan['plan_hash'],
                'status' => $plan['status'],
                'expires_at' => $plan['expires_at'],
                'changes' => array_map(static fn (array $change): array => [
                    'product_id' => $change['product_id'],
                    'feature_id' => $change['feature_id'],
                    'label' => $change['label'],
                    'scope' => $change['scope'],
                    'from' => $change['from'],
                    'to' => $change['to'],
                    'also_sets' => $change['also_sets'] ?? [],
                    'notes' => $change['notes'],
                ], $payload['changes']),
                'reasons' => $plan['result']['reasons'] ?? [],
                'verification' => $plan['result']['verification'] ?? null,
                'changed_since_apply' => $plan['status'] === 'applied' ? Plan::drift($payload) : [],
            ];
        }

        private static function statusLabel(string $status): string
        {
            return [
                'pending' => 'Waiting for your approval',
                'applying' => 'Applying',
                'applied' => 'Applied — saved settings verified, storefront not checked',
                'cancelled' => 'Cancelled — nothing changed',
                'expired' => 'Expired — nothing changed. Create a new preview.',
                'stale' => 'Not applied — something changed since the preview. Create a new preview.',
                'rolled_back' => 'Failed — earlier changes were rolled back',
                'partial_failure' => 'Partially failed — check the listed settings manually',
                'undoing' => 'Undoing',
                'undone' => 'Undone',
                'undo_conflict' => 'Undo incomplete — a setting was changed after the assistant applied it',
            ][$status] ?? 'Unknown';
        }

        private static function onOff(bool $value): string
        {
            return $value ? 'Enabled' : 'Disabled';
        }

        private static function noStore(array $data, int $status = 200): \WP_REST_Response
        {
            $response = new \WP_REST_Response($data, $status);
            $response->header('Cache-Control', 'private, no-store');

            return $response;
        }
    }
}
