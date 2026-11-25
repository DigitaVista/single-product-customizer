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
| VM `tests/storefront/setup.php` + `check.php` | MySQL dev site | Storefront matrix (see below). |
| VM `tests/mysql/run.sh` | MySQL | The same phases (except election) as separate PHP CLI processes, plus N rounds of real parallel processes: two approvals and one product-style save racing. |
| SPC `tests/pie-embedded.blueprint.json`, VM `tests/pie-cross-plugin.blueprint.json` | SQLite | Original 1.0 smoke and cross-plugin preview, still passing. |

Run Playground with `MSYS_NO_PATHCONV=1` on Git Bash for Windows, and mount both checkouts plus `/out`. Pass markers include the versions actually used.

## Dependent keys (`defaults_when_on`, runtime 1.1.1)

The first storefront check showed the swatches setting saved correctly while the storefront still showed plain dropdowns. VM 1.1.9 (`Inc/Variable.php::handle_variation_display()`) renders swatches only when `selectVariationTemplateOnOff` is exactly `'false'`. That key exists only after the VM dashboard has been saved once. A binding may therefore declare `defaults_when_on` (key → value). When the toggle is turned on and the key is missing, the plan discloses it (`also_sets`, shown under "Dependencies and conflicts"), applies it with the same compare-and-swap, and undo removes it again. A key that already has a value, such as `'true'` (variation table on), is never overridden. The conflict is shown instead. Runtime 1.1.0 ignores `defaults_when_on`, so copies offer 1.1.1 and the election picks it.

## Storefront verification (step 3A.4)

`tests/storefront/setup.php` creates synthetic products on a disposable dev site. They are a variable product with a colour attribute (display type `color`, `term_color` meta) and a size attribute (select), a variable product with a custom attribute, a variable product with the VM product override `_variation_swatches_meta = 'false'`, a simple product, a sold-individually product and a product with stock 1. `tests/storefront/check.php <theme>` switches the theme, then moves through baseline (both off, table key never saved) → PIE approve → manual variation table `'true'` → PIE undo. In each state it fetches the pages as a guest over HTTP and asserts the server-rendered markup inside the product's own cart form:

- SPC: `.sppcfw_minus_button` and `.sppcfw_plus_button` inside `.quantity` on the simple and variable products only when on. They are never shown on sold-individually or stock-1 products.
- VM: colour swatches (`.custom-wc-colors .custom-color-button`) only on the colour attribute. Other taxonomy and custom attributes render as buttons (`.custom-wc-buttons`, because the VM default `dropdownsToButton` is on). Native selects are hidden. The product override keeps the plain select. With the variation table on, `.variation-list-template-one` replaces the swatches.
- Undo restores the exact saved bytes and the baseline markup.

Results on 2026-11-25, on the Laragon dev site pie.test with WordPress 7.1.5, PHP 8.1.10, WooCommerce 9.0.2, SPC 1.1.1, VM 1.1.9 and runtime 1.1.1: 34/34 checks passed on each of Storefront 4.6.2 (classic), Twenty Twenty-Five (block) and Twenty Twenty-Four (block).

Browser check in Chrome on Storefront:
- + twice took the quantity from 1 to 3, and − brought it back to 2.
- At the minimum, − stays at 1. At the maximum (stock 10), + stays at 10.
- Clicking the Red swatch and the Large button selected variation 28 and enabled Add to cart. No cart, order or email was created.

Carts and real orders are outside the pilot.

## Runtime 1.2.0: optional cloud assistant (Section B)

`includes/pie/Cloud.php` adds an opt-in chat that talks to the DigitaVista platform API v1 (repository `DigitaVista/pie-platform`; contract in its `docs/api/`). The contract version stays 1.1 because every addition is backward compatible. Copies now offer 1.2.0.

- **Off by default.** Nothing leaves the site until an administrator ticks the consent box. The consent is recorded with its version (`2026-11-pilot`), the user and the time, in `digitavista_pie_v1_cloud` (not autoloaded). The consent wording is a draft and needs Product Owner approval before release. The existing Appsero tracking opt-in is separate and unchanged.
- **Credentials.** The service address must be HTTPS. Plain HTTP is accepted only for localhost and `*.test` development hosts. The connection key is stored in the same option and is never rendered back. The constants `DIGITAVISTA_PIE_ENDPOINT` and `DIGITAVISTA_PIE_TOKEN` in wp-config.php take precedence.
- **What is sent.** Only the administrator's message and an allowlisted snapshot: product and feature IDs, labels, availability, on/off state and `write_supported`. Option names, keys, orders, customers, license data and the site URL are not sent. The user agent is `DigitaVista-Assistant/<version>`, not WordPress's default, which contains the site URL. Redirects are not followed and the timeout is 25 s.
- **What comes back is untrusted.** The reply is stored and shown as plain text. Proposals for features without a local write binding are dropped. The rest go through `Runtime::createPlan()`, so the same allowlist, revision snapshot and local Approve/Cancel apply as for the manual preview. The cloud cannot approve anything.
- **Degradation.** If the service is unreachable, returns an error or hits its quota, the chat shows a short message. The manual preview, approvals, undo and the products' own settings pages are unaffected. An expired conversation is recreated once.
- **Discoverability.** Adapters may list their settings-page slugs in `admin_pages` (VM: `variation-monster`; SPC: `sppcfw-single-product-customizer`). On those pages only, administrators see one dismissible notice linking to Tools → DigitaVista Assistant. Verified over HTTP on pie.test on 2026-11-25.
- **Deletion and opt-out.** "Delete my conversations from the service" calls `DELETE /v1/installation/data` and clears the local chat history (user meta `digitavista_pie_v1_chat`). Unticking consent stops all requests.

Tests:
- The `cloud` phase of `tests/pie-write-flow.php` (Playground and MySQL harness) fakes the platform with `pre_http_request` and asserts 38 checks: opt-in, validation, the request body and headers, dropping untrusted proposals, the local approve/undo, the 404 retry, outage and quota handling, authorization and nonces, deletion and opt-out.
- End-to-end on 2026-11-25: pie.test (WP 7.1.5) talked over real HTTP to the Laravel platform (mock provider, MariaDB 11.8.9). The chat produced a pending plan for both settings, then approve reported saved and verified, then undo.
- Not verified: the chat UI in a real browser (Chrome could not reach pie.test at that moment), any call to Claude with a real key, and accessibility review with assistive technology.

## Not done / not verified

- Automatic storefront verification inside the runtime. The plan result stays `storefront: not_verified`. Storefront behaviour is verified by the test matrix below, not at apply time on customer sites. That would be the opt-in diagnostics of Section C.
- JS behaviour on block themes and on other classic themes (Astra, OceanWP, Kadence, which SPC special-cases) has not been browser-checked. Only the server markup was checked there.
- Behaviour when SPC's admin-only `sanitize_option_sppcfw_basic` callback is registered. The tests run without `admin_init`.
- Pro license valid/expired integration. Only a fixture product exercised the entitlement recheck.
- Multisite, persistent object cache, plan table cleanup and uninstall, plan retention.
