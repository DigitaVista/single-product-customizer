<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

final class CapabilityRegistry
{
    /** Options the runtime never writes, whatever an adapter declares. */
    private const PROTECTED_OPTIONS = [
        'siteurl', 'home', 'active_plugins', 'active_sitewide_plugins', 'users_can_register',
        'default_role', 'admin_email', 'new_admin_email', 'template', 'stylesheet', 'cron',
        'rewrite_rules', 'permalink_structure', 'upload_path', 'upload_url_path', 'auth_key',
        'auth_salt', 'logged_in_key', 'logged_in_salt', 'nonce_key', 'nonce_salt', 'secure_auth_key',
        'secure_auth_salt', 'recently_activated', 'uninstall_plugins', 'db_version',
    ];

    /** @var array<string, callable(): array> */
    private array $products = [];

    /** @var array<string, callable(): array> */
    private array $bindingReaders = [];

    /**
     * @param callable(): array      $read     Returns the product capability document.
     * @param null|callable(): array $bindings Returns feature ID => write binding (contract 1.1).
     */
    public static function isProtectedOption(string $option): bool
    {
        return in_array($option, self::PROTECTED_OPTIONS, true) || str_starts_with($option, '_') || str_ends_with($option, 'user_roles');
    }

    public function register(string $productId, callable $read, ?callable $bindings = null): void
    {
        if (isset($this->products[$productId])) {
            throw new \LogicException('duplicate_product');
        }

        $this->products[$productId] = $read;
        if ($bindings !== null) {
            $this->bindingReaders[$productId] = $bindings;
        }
    }

    public function all(): array
    {
        $products = $this->products;
        ksort($products);
        $capabilities = [];
        foreach ($products as $productId => $read) {
            $capabilities[$productId] = $read();
        }

        return $capabilities;
    }

    /**
     * Validated write bindings, product ID => feature ID => binding. Invalid declarations are dropped.
     */
    public function bindings(): array
    {
        $result = [];
        $readers = $this->bindingReaders;
        ksort($readers);
        foreach ($readers as $productId => $read) {
            $declared = $read();
            if (!is_array($declared)) {
                continue;
            }
            foreach ($declared as $featureId => $binding) {
                $valid = self::validBinding($featureId, $binding);
                if ($valid !== null) {
                    $result[$productId][$featureId] = $valid;
                }
            }
        }

        return $result;
    }

    private static function validBinding($featureId, $binding): ?array
    {
        if (!is_string($featureId) || !preg_match('/^[a-z0-9_]{1,64}$/', $featureId) || !is_array($binding)) {
            return null;
        }

        $option = $binding['option'] ?? null;
        $key = $binding['key'] ?? null;
        $on = $binding['on'] ?? null;
        $off = array_key_exists('off', $binding) ? $binding['off'] : false;
        $entitlement = $binding['entitlement'] ?? null;
        if (($binding['kind'] ?? null) !== 'option_array_toggle'
            || !is_string($option) || !preg_match('/^[a-z0-9_]{1,128}$/', $option)
            || in_array($option, self::PROTECTED_OPTIONS, true) || str_starts_with($option, '_')
            || str_ends_with($option, 'user_roles')
            || !is_string($key) || !preg_match('/^[A-Za-z0-9_]{1,64}$/', $key)
            || !is_string($on) || $on === '' || strlen($on) > 32
            || !($off === null || (is_string($off) && strlen($off) <= 32 && $off !== $on))
            || !in_array($entitlement, ['free', 'pro'], true)) {
            return null;
        }

        // Keys the product requires to exist when the toggle is on; saved only if never saved before.
        $defaults = $binding['defaults_when_on'] ?? [];
        if (!is_array($defaults) || count($defaults) > 4) {
            return null;
        }
        foreach ($defaults as $defaultKey => $defaultValue) {
            if (!is_string($defaultKey) || !preg_match('/^[A-Za-z0-9_]{1,64}$/', $defaultKey) || $defaultKey === $key
                || !is_string($defaultValue) || strlen($defaultValue) > 32) {
                return null;
            }
        }
        ksort($defaults);

        return [
            'kind' => 'option_array_toggle',
            'option' => $option,
            'key' => $key,
            'on' => $on,
            'off' => $off,
            'entitlement' => $entitlement,
            'defaults_when_on' => $defaults,
        ];
    }
}
