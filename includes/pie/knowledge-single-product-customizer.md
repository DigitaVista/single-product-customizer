# Single Product Customizer — assistant knowledge (version 1.1.1)

Facts verified against the Single Product Customizer 1.1.1 source code. Read the live settings with `single-product-customizer/get-settings` before proposing a change.

## Basic settings (global, apply to single product pages)
The list of settings, their types and defaults comes from the plugin's own definitions (`backend/basic/basic-settings.php`). It includes:
- Quantity plus/minus buttons.
- Texts: out-of-stock text, sale badge text, add-to-cart button text. An empty value means the WooCommerce or theme default.
- Remove or hide: product meta, related products section, rating, price, add-to-cart button, short description.

## Things to tell the store owner
- Hiding the price or the add-to-cart button means customers cannot buy from the product page. Always mention this before proposing it.
- Quantity buttons are not shown on products sold individually or with exactly one item in stock.
- With Single Product Customizer Pro, product-level and category-level settings can take precedence over these global settings.
- The theme can affect how the page looks; suggest checking a product page after applying.

## What the assistant can and cannot do
- Can propose: any basic setting above. Every proposal needs administrator approval and can be undone.
- Cannot: change Quick Checkout, the single product page builder, Pro-only settings, prices, stock or orders.
