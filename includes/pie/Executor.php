<?php
declare(strict_types=1);

namespace DigitaVista\PIE\V1;

/**
 * Applies, compensates, recovers and undoes stored plans.
 *
 * Status flow: pending → applying → applied | rolled_back | partial_failure
 *              pending → cancelled | expired | stale
 *              applied → undoing → undone | undo_conflict
 */
final class Executor
{
    public const LEASE_SECONDS = 120;
    private const MAX_CAS_ATTEMPTS = 3;

    /** @param callable(): array{0: array, 1: array} $live returns [products, bindings] */
    public function __construct(private string $runtimeVersion, private $live)
    {
    }

    public function approve(string $planId, int $userId): array
    {
        $plan = PlanStore::get($planId);
        $denied = $this->ownership($plan, $userId, true);
        if ($denied !== null) {
            return $denied;
        }
        if ($plan['status'] !== 'pending') {
            return self::outcome($plan, true);
        }

        $now = time();
        if ($plan['expires_at'] <= $now) {
            $won = PlanStore::transition($planId, 'pending', 'expired', ['result' => ['reasons' => ['plan_expired']]]);

            return self::outcome(PlanStore::get($planId), !$won);
        }
        if (!hash_equals($plan['plan_hash'], hash('sha256', $plan['payload']))) {
            $won = PlanStore::transition($planId, 'pending', 'stale', ['result' => ['reasons' => ['plan_integrity_failed']]]);

            return self::outcome(PlanStore::get($planId), !$won);
        }

        [$products, $bindings] = ($this->live)();
        $payload = $plan['payload_data'];
        $reasons = Plan::revalidate($payload, $products, $bindings, $this->runtimeVersion);
        if ($reasons !== []) {
            $won = PlanStore::transition($planId, 'pending', 'stale', ['result' => ['reasons' => $reasons]]);

            return self::outcome(PlanStore::get($planId), !$won);
        }

        $journal = ['seq' => 1, 'options' => []];
        if (!PlanStore::transition($planId, 'pending', 'applying', ['lease_at' => $now, 'journal' => $journal], ['expires_after' => $now])) {
            return self::outcome(PlanStore::get($planId), true);
        }

        return $this->execute($planId, $payload, $journal);
    }

    public function cancel(string $planId, int $userId): array
    {
        $plan = PlanStore::get($planId);
        $denied = $this->ownership($plan, $userId, true);
        if ($denied !== null) {
            return $denied;
        }
        if ($plan['status'] === 'pending') {
            PlanStore::transition($planId, 'pending', 'cancelled', ['result' => ['reasons' => ['cancelled_by_user']]]);
        }

        return self::outcome(PlanStore::get($planId), $plan['status'] !== 'pending');
    }

    public function undo(string $planId, int $userId): array
    {
        $plan = PlanStore::get($planId);
        $denied = $this->ownership($plan, $userId, false);
        if ($denied !== null) {
            return $denied;
        }
        if ($plan['status'] !== 'applied') {
            return self::outcome($plan, true);
        }

        [$products, $bindings] = ($this->live)();
        $payload = $plan['payload_data'];
        $reasons = Plan::revalidate($payload, $products, $bindings, $this->runtimeVersion, false);
        if ($reasons !== []) {
            return ['status' => 'applied', 'reasons' => array_merge(['undo_blocked'], $reasons), 'replay' => false, 'plan_id' => $planId];
        }

        $journal = $plan['journal'];
        $journal['seq'] = (int) ($journal['seq'] ?? 0) + 1;
        $journal['undo_user_id'] = $userId;
        if (!PlanStore::transition($planId, 'applied', 'undoing', ['lease_at' => time(), 'journal' => $journal])) {
            return self::outcome(PlanStore::get($planId), true);
        }

        return $this->restoreAll($planId, $payload, $journal, 'undoing', 'undone', 'undo_conflict', ['undo_requested']);
    }

    /** Resolves plans whose executing request was interrupted. Safe to call on every admin request. */
    public function recoverStale(): int
    {
        $recovered = 0;
        foreach (PlanStore::stale(['applying', 'undoing'], time() - self::LEASE_SECONDS) as $plan) {
            $journal = $plan['journal'];
            $journal['seq'] = (int) ($journal['seq'] ?? 0) + 1;
            $lease = time();
            if (!PlanStore::transition($plan['id'], $plan['status'], $plan['status'], ['lease_at' => $lease, 'journal' => $journal], ['lease_at' => $plan['lease_at']])) {
                continue;
            }
            if ($plan['status'] === 'applying') {
                $this->restoreAll($plan['id'], $plan['payload_data'], $journal, 'applying', 'rolled_back', 'partial_failure', ['interrupted']);
            } else {
                $this->restoreAll($plan['id'], $plan['payload_data'], $journal, 'undoing', 'undone', 'undo_conflict', ['undo_interrupted']);
            }
            ++$recovered;
        }

        return $recovered;
    }

    private function execute(string $planId, array $payload, array $journal): array
    {
        $targets = Plan::targets($payload);
        try {
            foreach ($targets as $option => $keys) {
                $snapshot = $payload['options'][$option];
                $journal['options'][$option] = ['state' => 'writing', 'intended' => $keys];
                $this->persist($planId, 'applying', $journal);

                $raw = OptionStore::readRaw($option);
                if (OptionStore::revision($raw) !== $snapshot['before_revision']) {
                    return $this->fail($planId, $payload, $journal, $option, 'concurrent_change');
                }

                $decoded = OptionStore::decode($raw, $option);
                if ($decoded === null) {
                    return $this->fail($planId, $payload, $journal, $option, 'unsupported_store_state');
                }
                $new = OptionStore::filterNewValue($option, OptionStore::applySnapshot($decoded['value'], $keys), $decoded['value']);
                if (!is_array($new) || OptionStore::keySnapshot($new, array_keys($keys)) !== $keys) {
                    return $this->fail($planId, $payload, $journal, $option, 'filtered_value_rejected');
                }

                $guard = apply_filters('digitavista_pie_v1_before_option_write', null, $option, $planId);
                if (is_wp_error($guard)) {
                    return $this->fail($planId, $payload, $journal, $option, 'write_blocked:' . $guard->get_error_code());
                }

                if (!OptionStore::compareAndSwap($option, $raw, $new)) {
                    return $this->fail($planId, $payload, $journal, $option, 'concurrent_change');
                }

                $journal['options'][$option]['state'] = 'written';
                $journal['options'][$option]['after_revision'] = OptionStore::revision(OptionStore::encode($option, $new));
                $this->persist($planId, 'applying', $journal);
            }
        } catch (\Throwable $error) {
            return $this->fail($planId, $payload, $journal, (string) ($option ?? ''), 'exception:' . get_class($error), false);
        }

        $verified = self::verifyKeys($targets);
        $status = $verified ? 'applied' : 'partial_failure';
        $result = [
            'reasons' => $verified ? [] : ['readback_mismatch'],
            'verification' => [
                'saved' => $verified ? 'verified' : 'failed',
                'storefront' => 'not_verified',
            ],
        ];
        $journal['seq'] = (int) $journal['seq'] + 1;
        PlanStore::transition($planId, 'applying', $status, ['journal' => $journal, 'result' => $result]);

        return self::outcome(PlanStore::get($planId), false);
    }

    private function fail(string $planId, array $payload, array $journal, string $option, string $reason, bool $notWritten = true): array
    {
        if ($notWritten && $option !== '' && ($journal['options'][$option]['state'] ?? null) === 'writing') {
            $journal['options'][$option]['state'] = 'not_written';
        }

        return $this->restoreAll($planId, $payload, $journal, 'applying', 'rolled_back', 'partial_failure', [$reason]);
    }

    /**
     * Restores every option the journal may have touched to its snapshot, preserving newer edits
     * to other keys and refusing to overwrite a key someone else changed after PIE wrote it.
     */
    private function restoreAll(string $planId, array $payload, array $journal, string $from, string $ok, string $conflict, array $reasons): array
    {
        $targets = Plan::targets($payload);
        $conflicts = [];
        foreach (array_reverse(array_keys($journal['options'] ?? []), false) as $option) {
            $entry = $journal['options'][$option];
            if (!in_array($entry['state'], ['writing', 'written', 'conflict'], true)) {
                continue;
            }

            $state = $this->restoreOption($option, $payload['options'][$option], $targets[$option] ?? []);
            $journal['options'][$option]['state'] = $state;
            if ($state === 'conflict') {
                $conflicts[] = 'restore_conflict:' . $option;
            }
            $this->persist($planId, $from, $journal);
        }

        $journal['seq'] = (int) $journal['seq'] + 1;
        $status = $conflicts === [] ? $ok : $conflict;
        $result = ['reasons' => array_merge($reasons, $conflicts)];
        PlanStore::transition($planId, $from, $status, ['journal' => $journal, 'result' => $result]);

        return self::outcome(PlanStore::get($planId), false);
    }

    /** @return string restored | unchanged | conflict */
    private function restoreOption(string $option, array $snapshot, array $written): string
    {
        $snapshotKeys = $snapshot['keys'];
        for ($attempt = 0; $attempt < self::MAX_CAS_ATTEMPTS; ++$attempt) {
            $raw = OptionStore::readRaw($option);
            $decoded = OptionStore::decode($raw, $option);
            if ($decoded === null) {
                return 'conflict';
            }

            $current = OptionStore::keySnapshot($decoded['value'], array_keys($snapshotKeys));
            if ($current === $snapshotKeys) {
                return 'unchanged';
            }
            if ($current !== $written) {
                return 'conflict';
            }

            $restored = OptionStore::applySnapshot($decoded['value'], $snapshotKeys);
            $new = $restored;
            if ($restored === [] && $snapshot['before_state'] === 'absent') {
                $new = null;
            } elseif ($restored === [] && $snapshot['before_state'] === 'empty') {
                $new = '';
            }

            if (OptionStore::compareAndSwap($option, $raw, $new)) {
                return 'restored';
            }
        }

        return 'conflict';
    }

    private static function verifyKeys(array $targets): bool
    {
        foreach ($targets as $option => $keys) {
            $decoded = OptionStore::decode(OptionStore::readRaw($option), $option);
            if ($decoded === null || OptionStore::keySnapshot($decoded['value'], array_keys($keys)) !== $keys) {
                return false;
            }

            $cached = OptionStore::readCached($option);
            if (!is_array($cached) || OptionStore::keySnapshot($cached, array_keys($keys)) !== $keys) {
                return false;
            }
        }

        return true;
    }

    private function persist(string $planId, string $status, array &$journal): void
    {
        $journal['seq'] = (int) $journal['seq'] + 1;
        if (!PlanStore::transition($planId, $status, $status, ['journal' => $journal])) {
            throw new \RuntimeException('journal_write_failed');
        }
    }

    private function ownership(?array $plan, int $userId, bool $ownerOnly): ?array
    {
        if ($plan === null || $plan['blog_id'] !== get_current_blog_id() || ($ownerOnly && $plan['user_id'] !== $userId)) {
            return ['status' => 'not_found', 'reasons' => ['plan_not_found'], 'replay' => false, 'plan_id' => null];
        }

        return null;
    }

    private static function outcome(?array $plan, bool $replay): array
    {
        if ($plan === null) {
            return ['status' => 'not_found', 'reasons' => ['plan_not_found'], 'replay' => $replay, 'plan_id' => null];
        }

        return [
            'status' => $plan['status'],
            'reasons' => $plan['result']['reasons'] ?? [],
            'verification' => $plan['result']['verification'] ?? null,
            'replay' => $replay,
            'plan_id' => $plan['id'],
        ];
    }
}
