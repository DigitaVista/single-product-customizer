# DigitaVista Assistant runtime 1.1 — approval, write and recovery

Status: pilot, not released. Applies to the runtime files in `includes/pie/` (identical in Single Product Customizer and Variation Monster).

## What 1.1 adds

- **Runtime election.** Each product includes `includes/pie/bootstrap.php` and calls `digitavista_pie_v1_offer('<version>', __DIR__)`. On `plugins_loaded` (priority 1) the highest offered `x.y.z` version is loaded once. Ties pick the lexicographically first directory. Malformed versions are ignored. The result does not depend on activation or load order. The two functions in `bootstrap.php` are a frozen protocol: whichever copy is included first defines them, so they must never change inside v1.
- **Write bindings (contract 1.1).** `CapabilityRegistry::register($id, $read, $bindings)` takes an optional third callable. It returns feature ID → `option_array_toggle` binding (`option`, `key`, `on`, `off` (null = remove key), `entitlement`). Bindings come only from product PHP code, never from a request. The registry drops malformed bindings and any binding that targets core-critical options (`active_plugins`, `*user_roles`, `siteurl`, …).
- **Writable features in this pilot:** SPC `quantity_buttons` → `sppcfw_basic['enable_plus_minus_button']` (`'on'` / key removed, which matches the settings form's save). VM `variation_swatches` → `variable_all_checked['variationSelectOnOff']` (`'true'` / `'false'`, which matches the dashboard's save). Everything else stays read-only.

### Interoperability

| Copies active on a site | Result |
|---|---|
| All 1.1.x | Highest 1.1.x is elected. Adapters from every product work with it. |
| 1.1.x plus a future 1.y (y > 1) | 1.y is elected. It must accept every 1.1 call (`register()` with two or three arguments, binding format, hook name). |
| Any copy of the unreleased 1.0 pilot (commits `15c36f2`/`92f86a6`, `9fc6570`/`f67e23b`) | Not interoperable: 1.0 defines `Runtime` when its file is included and does not take part in the election. 1.0 was never released, so do not ship it. |
| Incompatible change | Needs a new namespace and hook (`V2`, `digitavista_pie_register_products_v2`) and a coordinated migration. |

Variation Monster still loads the runtime only on PHP 8.1+. Its PHP 7.4 product code is unaffected.

## Flow

1. **Preview → plan.** The admin page (Tools → DigitaVista Assistant) or `POST /wp-json/digita-vista-pie/v1/plans` (`manage_options`, REST cookie nonce) validates the selection against the live capabilities and bindings. It stores an immutable plan in `{prefix}digitavista_pie_plans`. The plan records the canonical JSON payload and its SHA-256 hash, site (`blog_id`, `home`), administrator, runtime version, each product's versions, binding, from/to values, notes, a per-option revision (SHA-256 of the stored bytes, or `absent`), a minimal key snapshot including missing keys, and an expiry of 15 minutes.
2. **Approve / Cancel** are local admin-post forms with a per-plan nonce (`digitavista_pie_{action}_{plan_id}`). They are not exposed over REST, so model output or a chat message cannot approve a plan. Only the administrator who created a plan can approve or cancel it.
3. **Apply** rechecks the following. Ownership, status and expiry. Payload integrity. Runtime version. Site. Each product is still active with the same versions. Each feature is still `available`, which covers the Pro entitlement through the product's own local API. Each binding is unchanged. Every option revision is unchanged. A conditional `UPDATE … WHERE status='pending'` then claims the plan, so approval is one-time and replay-safe. A second or concurrent submission gets the recorded outcome (`replay: true`) and executes nothing.
4. **Write.** For each option: the journal is persisted first. The bytes are re-read and must still match the plan revision. The new value is computed from those bytes, changing only the bound keys, and passed through `sanitize_option` and the `pre_update_option*` filters. The write is a single compare-and-swap statement: `UPDATE … WHERE option_name = %s AND BINARY option_value = %s` (plain `=` on SQLite, which compares bytes by default). For a missing row it is an `INSERT`, and for restoring a missing row a guarded `DELETE`. After the write, PIE invalidates the option, `alloptions` and `notoptions` caches and fires the core `update_option`/`updated_option`/`update_option_{name}` hooks (and the add/delete equivalents).
5. **Readback.** It reads the database and `get_option()`. The result separates `saved: verified|failed` from `storefront: not_verified`. Storefront behaviour is never claimed. An applied plan is re-checked whenever it is shown. If a later save changed a key, the page warns about it and `changed_since_apply` lists the option.
6. **Failure.** If any option write fails, the options already written are compensated in reverse order. A key is restored only while it still holds the value PIE wrote. Newer edits to other keys are kept. A key that someone else changed is left alone and reported (`restore_conflict:<option>`). Final status is `rolled_back` or `partial_failure`.
7. **Interruption.** Plans left in `applying`/`undoing` with a lease older than 120 s are resolved on the next assistant page or plan read, using the same guarded restore (status `rolled_back` with reason `interrupted`).
8. **Undo** is a separate authenticated action (`manage_options`, per-plan nonce). It rechecks that the products are active and available, claims `applied → undoing`, and restores the snapshot keys with the same guards. Missing options and empty-string options are restored exactly. Results are `undone` or `undo_conflict`.

## Concurrency contract (verified on MySQL 8.0.30 and SQLite)

Every writer of `sppcfw_basic` (SPC settings form, builder, quick checkout) and `variable_all_checked` (VM dashboard AJAX, and the VM bootstrap that adds missing defaults on every request) does an unguarded read-modify-write `update_option()`. A lock inside PIE cannot serialise them.

What PIE guarantees:
- PIE never overwrites a value that changed after it read it. The compare-and-swap fails and PIE rolls back.
- Exactly one request executes a plan.

What PIE cannot guarantee:
- A product save that read the option before PIE committed and writes afterwards silently reverts PIE's key. That is the product's own lost update. In 20 parallel race rounds this happened often. PIE reports it as `partial_failure`/`readback_mismatch` when it happens before readback, and as drift on the applied plan afterwards. Closing this gap needs the products' own saves to use a guarded write, which is a change to each product's settings code.
- No PIE lock is held across requests or network calls.
- With a persistent object cache, a concurrent request can re-cache stale `alloptions` between the DB write and the cache delete. This is the same window core has. It has not been tested with Redis/Memcached.

## Tests

| Entry point | Engine | Covers |
|---|---|---|
| VM `tests/pie-write-flow.blueprint.json` (Playground CLI 3.1.66) | SQLite | Both load orders. Unauthorized user, invalid nonce, foreign administrator. Unknown key, product or value, preview-only feature, protected option. Authorized cross-plugin apply, replay, undo, undo replay, undo preserving newer edits, undo conflict, expiry, cancel. Stale revision, tampered payload, product version change, lost entitlement. Missing-option and empty-string undo. VM `'false'` disable path. Second-write failure, CAS race, rollback conflict, double submission. Legacy preview UI, owner-only REST. Interruption after the first write and inside it (real process exit), then lease-based recovery. Deactivation between preview and apply (real separate requests). Runtime election with lower, malformed and higher offers. |
| VM `tests/mysql/run.sh` | MySQL | The same phases (except election) as separate PHP CLI processes, plus N rounds of real parallel processes: two approvals and one product-style save racing. |
| SPC `tests/pie-embedded.blueprint.json`, VM `tests/pie-cross-plugin.blueprint.json` | SQLite | Original 1.0 smoke and cross-plugin preview, still passing. |

Run Playground with `MSYS_NO_PATHCONV=1` on Git Bash for Windows, and mount both checkouts plus `/out`. Pass markers include the versions actually used.

## Not done / not verified

- Storefront verification on classic and block themes with real variable products (step 3A.4). Saved state only.
- Behaviour when SPC's admin-only `sanitize_option_sppcfw_basic` callback is registered. The tests run without `admin_init`.
- Pro license valid/expired integration. Only a fixture product exercised the entitlement recheck.
- Multisite, persistent object cache, plan table cleanup and uninstall, plan retention.
- Cloud chat. The `POST /plans` route exists for a future client, but approval stays local.
