<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Durable change plans. Status changes are conditional UPDATE statements, so a plan can be
 * claimed by exactly one request (one-time, replay-safe approval).
 */
final class PlanStore
{
    public const SCHEMA_VERSION = '1';
    private const SCHEMA_OPTION = 'digitavista_pie_v1_schema';

    public static function table(): string
    {
        global $wpdb;

        return $wpdb->prefix . 'digitavista_pie_plans';
    }

    public static function install(): void
    {
        if (get_option(self::SCHEMA_OPTION) === self::SCHEMA_VERSION) {
            return;
        }

        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
  id char(32) NOT NULL,
  blog_id bigint(20) unsigned NOT NULL,
  user_id bigint(20) unsigned NOT NULL,
  plan_hash char(64) NOT NULL,
  action varchar(32) NOT NULL,
  status varchar(20) NOT NULL,
  payload longtext NOT NULL,
  journal longtext NOT NULL,
  result longtext NOT NULL,
  created_at bigint(20) unsigned NOT NULL,
  expires_at bigint(20) unsigned NOT NULL,
  updated_at bigint(20) unsigned NOT NULL,
  lease_at bigint(20) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY  (id),
  KEY status_lease (status, lease_at),
  KEY user_created (user_id, created_at)
) {$charset};");
        update_option(self::SCHEMA_OPTION, self::SCHEMA_VERSION, false);
    }

    public static function create(array $payload, int $expiresAt): array
    {
        global $wpdb;
        $id = bin2hex(random_bytes(16));
        $payload['plan_id'] = $id;
        $canonical = Plan::canonicalJson($payload);
        $now = time();
        $row = [
            'id' => $id,
            'blog_id' => get_current_blog_id(),
            'user_id' => (int) $payload['user_id'],
            'plan_hash' => hash('sha256', $canonical),
            'action' => (string) $payload['action'],
            'status' => 'pending',
            'payload' => $canonical,
            'journal' => '{}',
            'result' => '{}',
            'created_at' => $now,
            'expires_at' => $expiresAt,
            'updated_at' => $now,
            'lease_at' => 0,
        ];
        if ($wpdb->insert(self::table(), $row) !== 1) {
            throw new \RuntimeException('plan_store_failed');
        }

        return self::get($id);
    }

    public static function get(string $id): ?array
    {
        global $wpdb;
        if (!preg_match('/^[0-9a-f]{32}$/', $id)) {
            return null;
        }

        $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::table() . ' WHERE id = %s', $id), ARRAY_A);
        if (!is_array($row)) {
            return null;
        }

        foreach (['blog_id', 'user_id', 'created_at', 'expires_at', 'updated_at', 'lease_at'] as $field) {
            $row[$field] = (int) $row[$field];
        }
        $row['payload_data'] = json_decode($row['payload'], true);
        $row['journal'] = json_decode($row['journal'], true) ?: [];
        $row['result'] = json_decode($row['result'], true) ?: [];

        return $row;
    }

    /**
     * Moves the plan from one status to another only if it is still in $from.
     *
     * @param array<string, mixed> $fields journal/result arrays are JSON-encoded.
     * @param array<string, int>   $where  Extra integer conditions such as expires_at > now (key "expires_after").
     */
    public static function transition(string $id, string $from, string $to, array $fields = [], array $where = []): bool
    {
        global $wpdb;
        $sets = ['status = %s', 'updated_at = %d'];
        $args = [$to, time()];
        foreach ($fields as $field => $value) {
            if (!in_array($field, ['journal', 'result', 'lease_at'], true)) {
                throw new \InvalidArgumentException('unknown_plan_field');
            }
            $sets[] = $field . ($field === 'lease_at' ? ' = %d' : ' = %s');
            $args[] = $field === 'lease_at' ? (int) $value : wp_json_encode($value);
        }

        $conditions = ['id = %s', 'status = %s'];
        $args[] = $id;
        $args[] = $from;
        if (isset($where['expires_after'])) {
            $conditions[] = 'expires_at > %d';
            $args[] = (int) $where['expires_after'];
        }
        if (isset($where['lease_at'])) {
            $conditions[] = 'lease_at = %d';
            $args[] = (int) $where['lease_at'];
        }

        $sql = 'UPDATE ' . self::table() . ' SET ' . implode(', ', $sets) . ' WHERE ' . implode(' AND ', $conditions);
        $rows = $wpdb->query($wpdb->prepare($sql, $args));

        return $rows === 1;
    }

    /** Plans stuck in an executing status whose lease is older than $before. */
    public static function stale(array $statuses, int $before): array
    {
        global $wpdb;
        $placeholders = implode(', ', array_fill(0, count($statuses), '%s'));
        $args = array_merge($statuses, [$before, get_current_blog_id()]);
        $ids = $wpdb->get_col($wpdb->prepare(
            'SELECT id FROM ' . self::table() . " WHERE status IN ({$placeholders}) AND lease_at < %d AND blog_id = %d LIMIT 20",
            $args
        ));

        return array_values(array_filter(array_map([self::class, 'get'], $ids)));
    }

    public static function recent(int $limit = 10): array
    {
        global $wpdb;
        $ids = $wpdb->get_col($wpdb->prepare(
            'SELECT id FROM ' . self::table() . " WHERE blog_id = %d AND status NOT IN ('pending', 'cancelled', 'expired') ORDER BY created_at DESC LIMIT %d",
            get_current_blog_id(),
            $limit
        ));

        return array_values(array_filter(array_map([self::class, 'get'], $ids)));
    }
}
