<?php
/**
 * Single Product Page Builder Admin Screen View
 *
 * @package Single_Product_Customizer
 */

if (!defined('ABSPATH')) {
	exit;
}
?>
<style>
	#wpcontent, #wpbody-content {
		padding: 0 !important;
		margin: 0 !important;
	}
	#wpadminbar, #adminmenumain, #wpfooter {
		display: none !important;
	}
	#wpcontent {
		margin-left: 0 !important;
	}
	html.wp-toolbar {
		padding-top: 0 !important;
	}
	body {
		overflow: hidden !important;
	}
	.notice, .updated, .error, .is-dismissible, .notice-warning, .notice-info, .notice-error, .notice-success, #wpbody-content > div.notice, #wpbody-content > div.updated, .sppcfw_sreview_notices, #sppcfw-review-notice, .sales-campaign-notice, .sppcfw-setup-notice, div[class*="notice"], div[id*="notice"] {
		display: none !important;
	}
</style>
<div id="sppcfw-builder-root" class="dark sppcfw-h-screen sppcfw-w-screen sppcfw-overflow-hidden sppcfw-text-on-background"></div>
