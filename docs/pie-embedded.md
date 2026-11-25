# Embedded DigitaVista Assistant pilot

Activating this plugin registers the pilot under Tools → DigitaVista Assistant. The versioned runtime registers one menu and one read-only REST route per site. The page reports stored global configuration and Pro availability. Nothing in the pilot changes plugin settings or calls a cloud service.

Each supported product bundles the same v1 runtime and contributes its adapter on `digitavista_pie_register_products_v1`. Call `Runtime::boot()` before adding the product registration hook. The runtime collects products when the admin page or endpoint is requested, after active plugins have loaded. It sorts results by product ID. The first runtime copy loaded owns the v1 implementation, so all bundled copies must preserve the same v1 contract and behavior in any activation order. An incompatible implementation requires a new contract version and a coordinated migration.

Each product has one canonical registration. The Single Product Customizer Free adapter contributes its Pro capability from the add-on's existing local entitlement API. Register hooks only during active plugin bootstrap. Giveaway Lottery, Variation Monster and Gift Card still need product-specific adapters.

Run the disposable WordPress integration test with WordPress Playground CLI 3.1.66. Mount this checkout at `/wordpress/wp-content/plugins/single-product-customizer` and an empty writable directory at `/out`, then run `run-blueprint --blueprint tests/pie-embedded.blueprint.json`. Check the `pie-embedded-passed` marker for the versions actually used. The smoke test exercises the real SPC adapter and uses fixture adapters to check multiple product combinations.

AI chat, approved changes, rollback, and compatibility across future SDK versions are separate implementation work. Production release requires Product Owner approval.
