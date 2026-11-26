# DigitaVista AI brains (runtime 1.4.0)

Status: pilot on the `codex/pie-embedded-pilot` branches; not released. Date: 2026-11-26.

Every DigitaVista product carries its own **brain** inside the plugin:

1. **Knowledge.** A short, code-verified description of how the plugin works (`includes/pie/knowledge-<product>.md`), exposed as an ability of MCP type *resource*.
2. **Read abilities.** Live, read-only state such as settings, attributes and colours.
3. **Propose abilities.** Typed actions that never write. They create a pending plan that an administrator approves in WordPress, and Undo is available afterwards.

All of these are registered with the **WordPress Abilities API** (core since WordPress 6.9; verified on 7.1.5). The **WordPress MCP Adapter** (official plugin, tested with 0.7.2) therefore exposes them to any MCP client (Claude Desktop, Claude Code, other agents) without a custom MCP server. The DigitaVista Assistant chat uses the same brains through the platform service.

## Abilities

| Ability | Type | What it does |
|---|---|---|
| `variation-monster/knowledge` | resource `digitavista://variation-monster/knowledge` | How swatches, display types, colours and overrides work |
| `variation-monster/get-swatch-settings` | read | Global swatch settings and whether swatches can render |
| `variation-monster/list-attributes` | read | Global attributes, display type, terms with colour and image flag |
| `variation-monster/get-product-swatches` | read | One product's attributes and swatch override |
| `variation-monster/propose-swatch-settings` | propose | Swatches on/off, dropdowns as buttons, variation table |
| `variation-monster/propose-attribute-swatches` | propose | An attribute's display type (select/button/color/image/radio) and term colours |
| `variation-monster/propose-product-swatches` | propose | A product's swatch override: on, off or inherit |
| `single-product-customizer/knowledge` | resource `digitavista://single-product-customizer/knowledge` | What the settings do, including the live setting list |
| `single-product-customizer/get-settings` | read | All basic settings with type, default and value, read from the plugin's own field definitions |
| `single-product-customizer/propose-settings` | propose | Any basic setting (checkboxes and texts), with a sales-impact warning for hiding the price or the cart button |

All abilities require `manage_options`. Read abilities are annotated `readonly: true`. Propose abilities are `readonly: false, destructive: false`.

## Safety model

- **Propose, never write.** Propose abilities call `Runtime::proposeOperations()`, which builds an immutable, hashed, expiring plan. Nothing is written until an administrator presses Approve (in the chat card, on the Assistant page, or at the URL the ability returns).
- **Stores are allowlisted per product.** Each adapter declares `writable_refs` patterns:
  - VM: `variable_all_checked`, `option:wc_attribute_display_type_<id>`, `termmeta:<id>:term_color|term_secondary_color`, `postmeta:<id>:_variation_swatches_meta`.
  - SPC: `sppcfw_basic`.
  - The runtime rejects anything else and never allows core-critical options. This is tested with `option:siteurl`, `active_plugins`, `termmeta:…:term_image`, `postmeta:…:_price`, and SPC's option from VM.
- **The same safe write engine for every store type** (array options, single options, term meta, post meta): compare-and-swap against the exact bytes read at proposal time, a journal, guarded rollback, lease recovery, and Undo that restores the exact previous bytes (including deleting rows that did not exist).
- **Model output is untrusted.** The platform only forwards calls to abilities the site offered. WordPress accepts only `<product>/propose-*` abilities of an active product, and the Abilities API validates the input against the ability's schema.

## Using the brains over MCP

1. On a site with WordPress 6.9+, install and activate the official **MCP Adapter** plugin (github.com/WordPress/mcp-adapter).
2. Connect an MCP client to `/wp-json/mcp/mcp-adapter-default-server`, authenticated as an administrator (for example with a WordPress application password), or use the adapter's WP-CLI STDIO transport. See the adapter's CLI usage guide.
3. The client discovers the 8 tool abilities through `mcp-adapter-discover-abilities`, runs them through `mcp-adapter-execute-ability`, and reads the 2 knowledge resources through `resources/read`.
4. Proposals made over MCP appear in the Assistant chat as cards and must be approved in WordPress.

Abilities are private by default in WordPress. These are opted in with `meta.mcp.public = true`. Unauthenticated MCP requests are refused (401, tested).

## Using the brains in the Assistant chat

For each message, WordPress sends the platform, per active product:
- the knowledge text (≤ 8 KB)
- the output of read abilities that need no input (≤ 12 KB)
- the list of propose abilities with their input schemas (≤ 10)

The platform turns every propose ability into a Claude tool (the schema is reduced to a safe subset) and returns the model's calls as `ability_calls`. WordPress runs them locally, and each becomes a card with Approve/Cancel. On WordPress older than 6.9 the brains are skipped and the chat falls back to the on/off settings.

## Tests

| Test | Where | Result 2026-11-26 |
|---|---|---|
| `tests/abilities/check.php` (VM repo) | pie.test, WP 7.1.5 + MCP Adapter 0.7.2 | 33/33 pass: registration, read abilities, approve, undo of term colours, display type, product override and global settings (exact bytes, removed rows), stale plan after a manual edit, invalid input, store allowlist, permissions, MCP discovery, resources, MCP propose stays pending, guests refused |
| `tests/pie-write-flow.blueprint.json` + MySQL harness | WP 6.5.5 (no Abilities API) | All phases pass, so older WordPress degrades cleanly |
| `tests/storefront/check.php` | Storefront and Twenty Twenty-Five | 0 failures |
| Platform `php artisan test` | MariaDB 11.8.9 | 20/20, including brain validation, ability tools, schema cleaning and hostile tool calls |
| Local end-to-end | pie.test → local platform (mock) | "Make red #b71c1c and blue #0d47a1" became a pending card for the two term colours; nothing changed before approval |

## Not done yet

- Deploy the platform update (brain contract) to pie.webcartisan.com and test with real Claude Haiku. Deploying needs the PO's go-ahead and the mobile hotspot.
- A multi-step read loop, where the model asks for more data during a conversation. Today it gets a fixed set of read-ability outputs with each message.
- Brains for Giveaway Lottery and the Gift Card product.
- Storefront verification after apply, done automatically.
- Image swatches (uploading term images) and creating attributes or products. These are intentionally not offered yet.
