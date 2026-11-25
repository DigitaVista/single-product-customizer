<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Chat experience: REST endpoints for the admin chat widget, assets and container markup.
 * REST calls use WordPress cookie authentication with the wp_rest nonce and require
 * manage_options. Approve/Cancel/Undo go through the same Executor checks as the forms.
 */
final class Chat
{
    public const NS = 'digita-vista-pie/v1';
    public const PRIVACY_URL = 'https://www.webcartisan.com/privacy-policy/';

    public static function boot(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
        add_action('admin_enqueue_scripts', [self::class, 'enqueue']);
    }

    public static function registerRoutes(): void
    {
        $admin = static fn (): bool => current_user_can('manage_options');
        register_rest_route(self::NS, '/chat', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'permission_callback' => $admin,
                'callback' => static fn (): \WP_REST_Response => self::json(self::state()),
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'permission_callback' => $admin,
                'args' => ['message' => ['type' => 'string', 'required' => true]],
                'callback' => [self::class, 'send'],
            ],
        ]);
        register_rest_route(self::NS, '/chat/reset', [
            'methods' => \WP_REST_Server::CREATABLE,
            'permission_callback' => $admin,
            'callback' => static function (): \WP_REST_Response {
                Cloud::resetConversation(get_current_user_id());

                return self::json(self::state());
            },
        ]);
        register_rest_route(self::NS, '/chat/settings', [
            'methods' => \WP_REST_Server::CREATABLE,
            'permission_callback' => $admin,
            'callback' => static function (\WP_REST_Request $request): \WP_REST_Response {
                $input = [];
                foreach (['consent', 'endpoint', 'token'] as $field) {
                    $value = $request->get_param($field);
                    if (is_string($value) || is_bool($value)) {
                        $input[$field] = is_bool($value) ? ($value ? '1' : '') : $value;
                    }
                }
                $error = Cloud::saveSettings($input);

                return self::json(['error' => $error] + self::state(), $error === null ? 200 : 400);
            },
        ]);
        register_rest_route(self::NS, '/chat/delete-data', [
            'methods' => \WP_REST_Server::CREATABLE,
            'permission_callback' => $admin,
            'callback' => static function (): \WP_REST_Response {
                $result = Cloud::deleteRemoteData();

                return self::json(['error' => $result['error'] ?? null] + self::state(), isset($result['error']) ? 502 : 200);
            },
        ]);
        register_rest_route(self::NS, '/plans/(?P<id>[0-9a-f]{32})/(?P<action>approve|cancel|undo)', [
            'methods' => \WP_REST_Server::CREATABLE,
            'permission_callback' => $admin,
            'callback' => static function (\WP_REST_Request $request) {
                $outcome = Runtime::dispatch((string) $request['action'], (string) $request['id']);
                $plan = PlanStore::get((string) $request['id']);
                if ($plan === null || $plan['blog_id'] !== get_current_blog_id() || $outcome['status'] === 'not_found') {
                    return new \WP_Error('digitavista_pie_not_found', 'This change is not available.', ['status' => 404]);
                }

                return self::json(['plan' => Runtime::planView($plan), 'replay' => $outcome['replay']]);
            },
        ]);
    }

    public static function send(\WP_REST_Request $request): \WP_REST_Response
    {
        $message = trim(sanitize_textarea_field((string) $request->get_param('message')));
        if ($message === '' || mb_strlen($message) > 2000) {
            return self::json(['error' => 'Type a message of up to 2,000 characters.'], 400);
        }
        if (!Cloud::configured()) {
            return self::json(['error' => 'Connect the assistant first.'] + self::state(), 409);
        }

        Runtime::chatTurn($message);

        return self::json(self::state());
    }

    /** Everything the widget needs: connection state, transcript with live plan cards, suggestions. */
    public static function state(): array
    {
        $messages = [];
        foreach (Cloud::history(get_current_user_id()) as $item) {
            $plan = !empty($item['plan']) ? PlanStore::get((string) $item['plan']) : null;
            $messages[] = [
                'role' => $item['role'],
                'text' => (string) $item['text'],
                'at' => (int) ($item['at'] ?? 0),
                'plan' => $plan !== null && $plan['blog_id'] === get_current_blog_id() ? Runtime::planView($plan) : null,
            ];
        }

        $settings = Cloud::settings();

        return [
            'configured' => Cloud::configured(),
            'consented' => Cloud::consented(),
            'credentials_from_constants' => Cloud::credentialsFromConstants(),
            'endpoint' => Cloud::credentialsFromConstants() ? '' : $settings['endpoint'],
            'has_token' => Cloud::token() !== '',
            'messages' => $messages,
            'suggestions' => self::suggestions(),
        ];
    }

    /** Starter prompts from features that are writable on this site right now. */
    public static function suggestions(): array
    {
        [$products, $bindings] = Runtime::live();
        $suggestions = [];
        foreach ($bindings as $productId => $features) {
            foreach ($features as $featureId => $binding) {
                $feature = $products[$productId]['features'][$featureId] ?? null;
                if (!is_array($feature) || ($feature['availability'] ?? null) !== 'available' || !is_bool($feature['configured'] ?? null)) {
                    continue;
                }
                $label = (string) ($feature['label'] ?? ucwords(str_replace('_', ' ', $featureId)));
                $label = preg_replace('/^Global /i', '', $label) ?? $label;
                $label = preg_replace('/ setting$/i', '', $label) ?? $label;
                $suggestions[] = ($feature['configured'] ? 'Turn off ' : 'Turn on ') . strtolower($label);
            }
        }

        return array_slice($suggestions, 0, 4);
    }

    public static function enqueue(): void
    {
        if (!current_user_can('manage_options') || !self::onAssistantScreen()) {
            return;
        }

        $base = plugin_dir_url(__FILE__) . 'assets/';
        $dir = __DIR__ . '/assets/';
        wp_enqueue_style('digitavista-pie-chat', $base . 'chat.css', [], (string) filemtime($dir . 'chat.css'));
        wp_enqueue_script('digitavista-pie-chat', $base . 'chat.js', [], (string) filemtime($dir . 'chat.js'), true);
        wp_localize_script('digitavista-pie-chat', 'digitavistaPieChat', [
            'rest' => esc_url_raw(rest_url(self::NS . '/')),
            'nonce' => wp_create_nonce('wp_rest'),
            'privacyUrl' => self::PRIVACY_URL,
            'consentText' => self::consentText(),
            'pageUrl' => admin_url('tools.php?page=digitavista-assistant'),
        ]);
    }

    public static function consentText(): string
    {
        return 'When turned on, your question and the list of supported DigitaVista settings on this site (setting names and whether each is on or off) are sent to the DigitaVista Assistant service, which uses Anthropic Claude to reply. Orders, customer data, license keys and passwords are never sent. Conversations are deleted from the service after 30 days, or immediately on request. The plugin settings pages keep working without this feature.';
    }

    /** Inline chat (Tools page) or floating launcher (product settings pages). */
    public static function container(string $mode): string
    {
        return '<div class="digitavista-pie-chat-root" data-mode="' . esc_attr($mode === 'floating' ? 'floating' : 'inline') . '"></div>';
    }

    public static function onAssistantScreen(): bool
    {
        $page = isset($_GET['page']) && is_string($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
        if ($page === '') {
            return false;
        }
        if ($page === 'digitavista-assistant') {
            return true;
        }
        foreach (Runtime::live()[0] as $product) {
            if (in_array($page, is_array($product['admin_pages'] ?? null) ? $product['admin_pages'] : [], true)) {
                return true;
            }
        }

        return false;
    }

    private static function json(array $data, int $status = 200): \WP_REST_Response
    {
        $response = new \WP_REST_Response($data, $status);
        $response->header('Cache-Control', 'private, no-store');

        return $response;
    }
}
