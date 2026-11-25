<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Optional cloud assistant (platform API v1). Off until an administrator explicitly opts in.
 * Sends only the administrator's message and an allowlisted capability snapshot. The cloud may
 * only propose; every proposal becomes a local plan that is revalidated and needs local approval.
 */
final class Cloud
{
    public const OPTION = 'digitavista_pie_v1_cloud';
    /** Consent text version; must be accepted by the platform (config pie.consent_versions). */
    public const CONSENT_VERSION = '2026-11-pilot';
    public const CHAT_META = 'digitavista_pie_v1_chat';
    private const HISTORY = 10;
    private const TIMEOUT = 25;

    public static function settings(): array
    {
        $stored = get_option(self::OPTION, []);
        $stored = is_array($stored) ? $stored : [];

        return [
            'enabled' => !empty($stored['enabled']),
            'consent_version' => is_string($stored['consent_version'] ?? null) ? $stored['consent_version'] : '',
            'consented_by' => (int) ($stored['consented_by'] ?? 0),
            'consented_at' => (int) ($stored['consented_at'] ?? 0),
            'endpoint' => is_string($stored['endpoint'] ?? null) ? $stored['endpoint'] : '',
            'token' => is_string($stored['token'] ?? null) ? $stored['token'] : '',
        ];
    }

    /** wp-config constants take precedence so hosts can keep the credential out of the database. */
    public static function endpoint(): string
    {
        return defined('DIGITAVISTA_PIE_ENDPOINT') ? (string) DIGITAVISTA_PIE_ENDPOINT : self::settings()['endpoint'];
    }

    public static function token(): string
    {
        return defined('DIGITAVISTA_PIE_TOKEN') ? (string) DIGITAVISTA_PIE_TOKEN : self::settings()['token'];
    }

    public static function credentialsFromConstants(): bool
    {
        return defined('DIGITAVISTA_PIE_ENDPOINT') && defined('DIGITAVISTA_PIE_TOKEN');
    }

    public static function consented(): bool
    {
        $settings = self::settings();

        return $settings['enabled'] && $settings['consent_version'] === self::CONSENT_VERSION;
    }

    public static function configured(): bool
    {
        return self::consented() && self::validEndpoint(self::endpoint()) && self::validToken(self::token());
    }

    public static function validEndpoint(string $url): bool
    {
        $parts = wp_parse_url($url);
        if (!is_array($parts) || empty($parts['host']) || isset($parts['user']) || isset($parts['query']) || isset($parts['fragment'])) {
            return false;
        }
        $host = strtolower($parts['host']);
        $local = in_array($host, ['localhost', '127.0.0.1'], true) || str_ends_with($host, '.test') || str_ends_with($host, '.localhost');

        return ($parts['scheme'] ?? '') === 'https' || (($parts['scheme'] ?? '') === 'http' && $local);
    }

    public static function validToken(string $token): bool
    {
        return preg_match('/^pie_[0-9A-HJKMNP-TV-Z]{26}_[A-Za-z0-9]{40}$/', $token) === 1;
    }

    /**
     * @param array{consent?: mixed, endpoint?: mixed, token?: mixed} $input already unslashed
     * @return string|null error message, null on success
     */
    public static function saveSettings(array $input): ?string
    {
        $settings = self::settings();
        if (empty($input['consent'])) {
            $settings['enabled'] = false;
            update_option(self::OPTION, $settings, false);

            return null;
        }

        if (!self::credentialsFromConstants()) {
            $endpoint = untrailingslashit(esc_url_raw(trim((string) ($input['endpoint'] ?? ''))));
            $token = trim((string) ($input['token'] ?? ''));
            if (!self::validEndpoint($endpoint)) {
                return 'Enter the assistant service address (https://…).';
            }
            if ($token !== '' && !self::validToken($token)) {
                return 'The connection key format is not valid.';
            }
            $settings['endpoint'] = $endpoint;
            if ($token !== '') {
                $settings['token'] = $token;
            }
            if (!self::validToken($settings['token'])) {
                return 'Enter the connection key you received from DigitaVista.';
            }
        }

        $settings['enabled'] = true;
        $settings['consent_version'] = self::CONSENT_VERSION;
        $settings['consented_by'] = get_current_user_id();
        $settings['consented_at'] = time();
        update_option(self::OPTION, $settings, false);

        return null;
    }

    /** Allowlisted capability snapshot (schema docs/api/schemas/capabilities.json in pie-platform). */
    public static function snapshot(array $products, array $bindings): array
    {
        $availability = ['available', 'unavailable', 'pro_not_loaded', 'not_entitled', 'unsupported_environment', 'unknown'];
        $result = [];
        foreach ($products as $productId => $product) {
            if (!is_string($productId) || !preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', $productId) || count($result) >= 20) {
                continue;
            }
            $features = [];
            foreach (($product['features'] ?? []) as $featureId => $feature) {
                if (!is_string($featureId) || !preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/', $featureId) || count($features) >= 30) {
                    continue;
                }
                $label = self::label($feature['label'] ?? ucwords(str_replace('_', ' ', $featureId)), 120);
                $features[$featureId] = [
                    'label' => $label,
                    'availability' => in_array($feature['availability'] ?? null, $availability, true) ? $feature['availability'] : 'unknown',
                    'configured' => is_bool($feature['configured'] ?? null) ? $feature['configured'] : null,
                    'write_supported' => isset($bindings[$productId][$featureId]),
                ];
            }
            $result[$productId] = [
                'label' => self::label($product['label'] ?? $productId, 80),
                'features' => (object) $features,
            ];
        }

        return ['products' => (object) $result];
    }

    /**
     * Sends one message. Returns ['reply' => string, 'proposals' => list] or ['error' => string].
     */
    public static function chat(string $message, array $snapshot): array
    {
        $userId = get_current_user_id();
        for ($attempt = 0; $attempt < 2; ++$attempt) {
            $conversation = self::conversation($userId, $attempt > 0);
            if (isset($conversation['error'])) {
                return $conversation;
            }

            $response = self::request('POST', '/v1/conversations/' . $conversation['id'] . '/messages', [
                'message' => $message,
                'capabilities' => $snapshot,
            ]);
            if ($response['status'] === 404 && $attempt === 0) {
                continue;
            }
            if (isset($response['error'])) {
                return $response;
            }

            $data = $response['data'];
            if (!is_string($data['reply'] ?? null) || !is_array($data['proposals'] ?? null)) {
                return ['error' => 'The assistant service returned an unexpected response.'];
            }

            $proposals = [];
            foreach (array_slice($data['proposals'], 0, 5) as $proposal) {
                if (is_array($proposal) && is_string($proposal['product_id'] ?? null) && is_string($proposal['feature_id'] ?? null)
                    && in_array($proposal['value'] ?? null, ['on', 'off'], true)) {
                    $proposals[] = ['product_id' => $proposal['product_id'], 'feature_id' => $proposal['feature_id'], 'value' => $proposal['value']];
                }
            }

            return ['reply' => mb_substr(wp_strip_all_tags($data['reply']), 0, 2000), 'proposals' => $proposals];
        }

        return ['error' => 'The assistant service is unavailable.'];
    }

    /** Deletes every conversation of this installation on the platform and the local chat history. */
    public static function deleteRemoteData(): array
    {
        $response = self::configured() || (self::validEndpoint(self::endpoint()) && self::validToken(self::token()))
            ? self::request('DELETE', '/v1/installation/data', null)
            : ['error' => 'The assistant service is not configured.'];
        delete_metadata('user', 0, self::CHAT_META, '', true);

        return $response;
    }

    /** Starts a fresh conversation for this user (local transcript and conversation ID only). */
    public static function resetConversation(int $userId): void
    {
        delete_user_meta($userId, self::CHAT_META);
    }

    public static function history(int $userId): array
    {
        $chat = get_user_meta($userId, self::CHAT_META, true);

        return is_array($chat['history'] ?? null) ? $chat['history'] : [];
    }

    public static function remember(int $userId, string $role, string $text, ?string $planId = null): void
    {
        $chat = get_user_meta($userId, self::CHAT_META, true);
        $chat = is_array($chat) ? $chat : [];
        $history = is_array($chat['history'] ?? null) ? $chat['history'] : [];
        $history[] = ['role' => $role === 'user' ? 'user' : 'assistant', 'text' => mb_substr($text, 0, 2000), 'plan' => $planId, 'at' => time()];
        $chat['history'] = array_slice($history, -self::HISTORY);
        update_user_meta($userId, self::CHAT_META, $chat);
    }

    private static function conversation(int $userId, bool $fresh): array
    {
        $chat = get_user_meta($userId, self::CHAT_META, true);
        $chat = is_array($chat) ? $chat : [];
        if (!$fresh && is_string($chat['conversation'] ?? null) && (int) ($chat['expires'] ?? 0) > time() + 60) {
            return ['id' => $chat['conversation']];
        }

        $response = self::request('POST', '/v1/conversations', ['consent_version' => self::CONSENT_VERSION]);
        if (isset($response['error'])) {
            return $response;
        }
        $id = $response['data']['id'] ?? null;
        $expires = strtotime((string) ($response['data']['expires_at'] ?? ''));
        if (!is_string($id) || !preg_match('/^[0-9a-z]{26}$/', $id)) {
            return ['error' => 'The assistant service returned an unexpected response.'];
        }
        $chat['conversation'] = $id;
        $chat['expires'] = $expires ?: time() + DAY_IN_SECONDS;
        update_user_meta($userId, self::CHAT_META, $chat);

        return ['id' => $id];
    }

    /** @return array{status: int, data?: array, error?: string} */
    private static function request(string $method, string $path, ?array $body): array
    {
        if (!self::validEndpoint(self::endpoint()) || !self::validToken(self::token())) {
            return ['status' => 0, 'error' => 'The assistant service is not configured.'];
        }

        $args = [
            'method' => $method,
            'timeout' => self::TIMEOUT,
            'redirection' => 0,
            // A neutral user agent: the WordPress default would reveal the site URL.
            'user-agent' => 'DigitaVista-Assistant/' . Runtime::version(),
            'headers' => [
                'Authorization' => 'Bearer ' . self::token(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ];
        if ($body !== null) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request(untrailingslashit(self::endpoint()) . '/api' . $path, $args);
        if (is_wp_error($response)) {
            return ['status' => 0, 'error' => 'The assistant service could not be reached. Your plugin settings pages keep working.'];
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $data = json_decode((string) wp_remote_retrieve_body($response), true);
        if ($status >= 200 && $status < 300 && is_array($data)) {
            return ['status' => $status, 'data' => $data];
        }

        $message = is_string($data['error']['message'] ?? null) ? mb_substr($data['error']['message'], 0, 300) : 'The assistant service returned an error.';

        return ['status' => $status, 'error' => $message];
    }

    private static function label(mixed $value, int $max): string
    {
        $text = is_string($value) ? trim(preg_replace('/[\x00-\x1F<>]/', '', $value) ?? '') : '';

        return $text === '' ? 'Untitled' : mb_substr($text, 0, $max);
    }
}
