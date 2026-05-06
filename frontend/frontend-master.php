<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Basic options
include('basic/enable-plus-minus-button/enable-plus-minus-button.php'); // ok
include('basic/out-of-stock/out-of-stock.php'); // ok
include('basic/change-sales-badge-text/change-sales-badge-text.php'); // ok
include('basic/change-add-to-cart-button-text/change-add-to-cart-button-text.php'); // ok
include('basic/remove-product-meta/remove-product-meta.php'); // ok
include('basic/remove-related-product-section/remove-related-product-section.php'); // ok
include('basic/remove-rating/remove-rating.php'); // ok
include('basic/hide-price/hide-price.php'); // ok
include('basic/hide-add-to-cart-button/hide-add-to-cart-button.php'); // ok
include('basic/hide-short-description/hide-short-description.php'); // ok

// Advanced options
include('advanced/related-products-title/related-products-title.php'); // OK
include('advanced/upsell-product-title/upsell-product-title.php'); // ok
include('advanced/backorder-text/backorder-text.php'); // ok
include('advanced/variation-reset-text/variation-reset-text.php'); // ok
include('advanced/enable-custom-message/enable-custom-message.php'); // ok
include('advanced/ajax-add-to-cart/ajax-add-to-cart.php'); // ok
include('advanced/change-tab-default-label/change-tab-default-label.php'); // ok
include('advanced/variation-switcher/variation-switcher.php'); // ok
include('advanced/show-variation-table/show-variation-table.php'); // ok

// Quick Checkout
include('Enable-Quick-Checkout/quick-checkout-frontend.php'); // ok