<?php

/**
 * Single Product Page Builder Frontend Renderer
 *
 * @package Single_Product_Customizer
 */
if (!defined('ABSPATH')) {
	exit;
}

if (!class_exists('SPPCFW_Builder_Renderer')) {
	class SPPCFW_Builder_Renderer
	{
		/**
		 * Constructor.
		 */
		public function __construct()
		{
			add_action('wp', array($this, 'sppcfw_maybe_init_frontend_override'), 5);
			add_filter('woocommerce_has_block_template', array($this, 'sppcfw_disable_block_template_for_builder'), 999, 2);
		}

		/**
		 * Disable WooCommerce block template in Full Site Editing (FSE) block themes
		 * so the single product builder template renders cleanly without duplicate block elements.
		 *
		 * @param bool   $has_template  Whether template exists.
		 * @param string $template_name Template name.
		 * @return bool
		 */
		public function sppcfw_disable_block_template_for_builder($has_template, $template_name)
		{
			if ('single-product' === $template_name) {
				$is_preview = isset($_GET['sppcfw_preview']) && isset($_GET['template_id']) && current_user_can('manage_options');
				$enable_builder = (int) get_option('sppcfw_enable_single_product_builder', 0);
				$enable_quick_checkout = (int) get_option('sppcfw_enable_quick_checkout', 0);

				if ($is_preview || (!empty($enable_builder) && empty($enable_quick_checkout))) {
					return false;
				}
			}
			return $has_template;
		}

		/**
		 * Active matching template instance.
		 *
		 * @var array
		 */
		private $matched_template = array();

		/**
		 * Check conditions and initialize template override.
		 *
		 * @return void
		 */
		public function sppcfw_maybe_init_frontend_override()
		{
			if (is_admin() || !is_singular('product')) {
				return;
			}

			$is_preview = isset($_GET['sppcfw_preview']) && isset($_GET['template_id']) && current_user_can('manage_options');

			if (!$is_preview) {
				// Suppress builder designs if Quick Checkout is enabled
				$sppcfw_enable_quick_checkout = (int) get_option('sppcfw_enable_quick_checkout', 0);
				if (!empty($sppcfw_enable_quick_checkout)) {
					return;
				}

				// Suppress builder designs if Single Product Builder toggle is disabled
				$sppcfw_enable_builder = (int) get_option('sppcfw_enable_single_product_builder', 0);
				if (empty($sppcfw_enable_builder)) {
					return;
				}
			}

			$matched = $this->sppcfw_get_matching_template(get_the_ID());

			if (empty($matched) || empty($matched['layout'])) {
				return;
			}

			$this->matched_template = $matched;

			add_action('wp_enqueue_scripts', array($this, 'sppcfw_enqueue_frontend_builder_styles'));

			// Hook into WooCommerce single product summary to render builder layout
			add_action('woocommerce_before_single_product_summary', array($this, 'sppcfw_render_builder_template'), 5);

			// 1. Core WooCommerce hooks & Summary cleanup
			remove_action('woocommerce_before_main_content', 'woocommerce_breadcrumb', 20);
			remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar', 10);
			remove_action('woocommerce_before_single_product_summary', 'woocommerce_show_product_sale_flash', 10);
			remove_action('woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_title', 5);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_price', 10);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40);
			remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_sharing', 50);
			remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_product_data_tabs', 10);
			remove_action('woocommerce_after_single_product_summary', 'woocommerce_upsell_display', 15);
			remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20);
			remove_all_actions('woocommerce_single_product_summary');
			remove_all_actions('woocommerce_after_single_product_summary');

			// 2. Astra Theme Compatibility
			add_filter('astra_woo_single_product_structure', '__return_empty_array', 999);
			add_filter('astra_woo_related_products', '__return_false', 999);
			add_filter('astra_page_layout', function () {
				return 'no-sidebar';
			}, 999);
			remove_action('woocommerce_single_product_summary', 'woocommerce_breadcrumb', 2);
			remove_all_actions('astra_woo_single_title_before');
			remove_all_actions('astra_woo_single_title_after');
			remove_all_actions('astra_woo_single_price_before');
			remove_all_actions('astra_woo_single_price_after');
			remove_all_actions('astra_woo_single_rating_before');
			remove_all_actions('astra_woo_single_rating_after');
			remove_all_actions('astra_woo_single_short_description_before');
			remove_all_actions('astra_woo_single_short_description_after');
			remove_all_actions('astra_woo_single_add_to_cart_before');
			remove_all_actions('astra_woo_single_add_to_cart_after');
			remove_all_actions('astra_woo_single_category_before');
			remove_all_actions('astra_woo_single_category_after');

			// 3. Kadence Theme Compatibility
			add_filter('kadence_single_product_elements', '__return_empty_array', 999);
			add_filter('kadence_sidebar', '__return_false', 999);
			remove_all_actions('kadence_single_product_navigation');
			remove_all_actions('kadence_single_product_before');
			remove_all_actions('kadence_single_product_after');

			// 4. OceanWP Theme Compatibility
			add_filter('ocean_woo_summary_elements_positioning', '__return_empty_array', 999);
			add_filter('ocean_display_upsells', '__return_false', 999);
			add_filter('ocean_display_related_products', '__return_false', 999);
			add_filter('ocean_post_layout_class', function () {
				return 'full-width';
			}, 999);
			add_filter('ocean_post_layout_meta_value', function () {
				return 'full-width';
			}, 999);
			remove_action('ocean_after_primary', 'oceanwp_display_sidebar');
			remove_action('ocean_before_primary', 'oceanwp_display_sidebar');
			remove_action('woocommerce_before_single_product_summary', 'oceanwp_product_next_prev_nav', 10);
			remove_action('woocommerce_before_single_product_summary', 'oceanwp_woo_single_product_floating_bar', 10);
			remove_all_actions('ocean_before_single_product');
			remove_all_actions('ocean_after_single_product');
			remove_all_actions('ocean_before_single_product_summary');
			remove_all_actions('ocean_after_single_product_summary');
			remove_all_actions('ocean_before_single_product_title');
			remove_all_actions('ocean_after_single_product_title');

			// 5. Storefront Theme Compatibility
			add_filter('storefront_sidebar', '__return_false', 999);
			remove_action('woocommerce_before_single_product_summary', 'storefront_single_product_pagination', 5);
			remove_action('storefront_after_footer', 'storefront_sticky_single_add_to_cart', 999);
			remove_action('woocommerce_after_single_product_summary', 'storefront_single_product_pagination', 30);

			// 6. EnvoThemes Compatibility (envo-one, envo-storefront, envo-ecommerce)
			remove_action('woocommerce_before_main_content', 'envo_one_wrapper_start', 10);
			remove_action('woocommerce_after_main_content', 'envo_one_wrapper_end', 10);
			remove_all_actions('envo_one_sidebar');
			add_filter('get_post_metadata', function ($value, $object_id, $meta_key, $single) {
				if ('envo_hide_sidebar' === $meta_key) {
					return 'on';
				}
				return $value;
			}, 10, 4);

			// 7. Flatsome Theme Compatibility
			remove_all_actions('flatsome_single_product_summary_top');
			remove_all_actions('flatsome_single_product_summary_middle');
			remove_all_actions('flatsome_single_product_summary_bottom');

			// 8. Woodmart Theme Compatibility
			remove_all_actions('woodmart_before_single_product_summary');
			remove_all_actions('woodmart_after_single_product_summary');

			// 9. Generic Sidebar Suppression on Single Product Builder
			add_filter('is_active_sidebar', function ($is_active, $sidebar_id) {
				if (is_singular('product') && in_array($sidebar_id, array('envo-one-right-sidebar', 'sidebar-1', 'sidebar-right', 'shop-sidebar', 'sidebar', 'primary-sidebar', 'secondary-sidebar'), true)) {
					return false;
				}
				return $is_active;
			}, 999, 2);
		}

		/**
		 * Find best matching template from registry for product ID.
		 *
		 * @param int $product_id Product ID.
		 * @return array Template array.
		 */
		private function sppcfw_get_matching_template($product_id)
		{
			$templates = get_option('sppcfw_builder_templates', array());

			if (isset($_GET['sppcfw_preview']) && isset($_GET['template_id']) && current_user_can('manage_options')) {
				$preview_id = sanitize_text_field($_GET['template_id']);
				if (isset($templates[$preview_id]) && !empty($templates[$preview_id]['layout'])) {
					return $templates[$preview_id];
				}
			}

			if (empty($templates)) {
				$legacy = get_option('sppcfw_builder_template', array());
				if (!empty($legacy) && !empty($legacy['layout'])) {
					return $legacy;
				}
				return array();
			}

			$product_cats = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'ids'));

			$product_match = array();
			$category_match = array();
			$entire_match = array();

			foreach ($templates as $tpl) {
				if (empty($tpl['layout']) || (isset($tpl['status']) && in_array(strtolower($tpl['status']), array('draft', 'trash'), true))) {
					continue;
				}

				$conditions = isset($tpl['conditions']) ? $tpl['conditions'] : array();
				$scope = isset($conditions['scope']) ? $conditions['scope'] : 'entire';

				$tpl_prod_id = isset($tpl['selected_product_id']) ? $tpl['selected_product_id'] : (isset($tpl['page_settings']['selected_product_id']) ? $tpl['page_settings']['selected_product_id'] : '');
				if (!empty($tpl_prod_id) && (int) $tpl_prod_id === (int) $product_id) {
					$product_match = $tpl;
					break;
				}

				if ('product' === $scope) {
					$selected_prods = isset($conditions['product_ids']) ? array_map('intval', (array) $conditions['product_ids']) : array();
					if (in_array((int) $product_id, $selected_prods, true)) {
						$product_match = $tpl;
						break;
					}
				} elseif ('category' === $scope) {
					$selected_cats = isset($conditions['category_ids']) ? array_map('intval', (array) $conditions['category_ids']) : array();
					$int_product_cats = array_map('intval', (array) $product_cats);
					if (!empty(array_intersect($selected_cats, $int_product_cats))) {
						$category_match = $tpl;
					}
				} elseif ('entire' === $scope) {
					$entire_match = $tpl;
				}
			}

			if (!empty($product_match)) {
				return $product_match;
			}
			if (!empty($category_match)) {
				return $category_match;
			}
			if (!empty($entire_match)) {
				return $entire_match;
			}

			return array();
		}

		/**
		 * Helper to find variation display type in layout tree.
		 */
		private function sppcfw_find_var_display_type($elements)
		{
			if (!is_array($elements)) {
				return null;
			}
			foreach ($elements as $el) {
				if (isset($el['type'])) {
					if ($el['type'] === 'product_add_to_cart') {
						return isset($el['settings']['variation_display_type']) ? $el['settings']['variation_display_type'] : 'swatches';
					}
					if ($el['type'] === 'variation_swatches') {
						return 'swatches';
					}
				}
				if (!empty($el['children']) && is_array($el['children'])) {
					$found = $this->sppcfw_find_var_display_type($el['children']);
					if ($found !== null) {
						return $found;
					}
				}
			}
			return null;
		}

		/**
		 * Enqueue frontend dynamic styles for builder widgets & containers.
		 *
		 * @return void
		 */
		public function sppcfw_enqueue_frontend_builder_styles()
		{
			$layout = isset($this->matched_template['layout']) ? $this->matched_template['layout'] : array();

			// Ensure WooCommerce single product script and jQuery are enqueued
			if (function_exists('is_singular') && is_singular('product')) {
				wp_enqueue_script('wc-single-product');
				wp_enqueue_script('jquery');

				// Built-in Tab Switcher JS for Block Themes & Custom Themes
				wp_add_inline_script('jquery', '
					(function() {
						function sppcfwInitTabs() {
							var tabWrappers = document.querySelectorAll(".woocommerce-tabs, .wc-tabs-wrapper, .sppcfw-tabs-wrapper");
							tabWrappers.forEach(function(wrapper) {
								var tabLinks = wrapper.querySelectorAll("ul.tabs li a, ul.wc-tabs li a");
								var panels = wrapper.querySelectorAll(".woocommerce-Tabs-panel, .panel.entry-content, .wc-tab");
								
								if (!tabLinks.length || !panels.length) return;

								function activateTab(targetId) {
									tabLinks.forEach(function(link) {
										var href = link.getAttribute("href");
										if (href === targetId || ("#" + href) === targetId) {
											link.parentElement.classList.add("active");
										} else {
											link.parentElement.classList.remove("active");
										}
									});

									panels.forEach(function(panel) {
										var pId = "#" + panel.id;
										if (pId === targetId || panel.id === targetId.replace("#", "")) {
											panel.style.setProperty("display", "block", "important");
											panel.classList.add("sppcfw-active-tab");
										} else {
											panel.style.setProperty("display", "none", "important");
											panel.classList.remove("sppcfw-active-tab");
										}
									});
								}

								var activeLink = wrapper.querySelector("ul.tabs li.active a, ul.wc-tabs li.active a");
								var initialTarget = activeLink ? activeLink.getAttribute("href") : null;
								if (!initialTarget && tabLinks.length > 0) {
									initialTarget = tabLinks[0].getAttribute("href");
								}

								if (initialTarget) {
									activateTab(initialTarget);
								}

								tabLinks.forEach(function(link) {
									link.addEventListener("click", function(e) {
										e.preventDefault();
										var targetSelector = this.getAttribute("href");
										if (!targetSelector) return;
										activateTab(targetSelector);
									});
								});
							});

							// Rating link -> Switch to Reviews tab
							var reviewLinks = document.querySelectorAll(".woocommerce-review-link, .sppcfw-rating-link, a[href=\"#reviews\"], a[href=\"#tab-reviews\"]");
							reviewLinks.forEach(function(rLink) {
								rLink.addEventListener("click", function() {
									var reviewTabLink = document.querySelector(".woocommerce-tabs ul.tabs li.reviews_tab a, .woocommerce-tabs a[href=\"#tab-reviews\"], .sppcfw-tabs-wrapper a[href=\"#tab-reviews\"]");
									if (reviewTabLink) {
										reviewTabLink.click();
									}
								});
							});
						}

						if (document.readyState === "loading") {
							document.addEventListener("DOMContentLoaded", sppcfwInitTabs);
						} else {
							sppcfwInitTabs();
						}
					})();
				');
			}

			// Ensure variation switcher assets are enqueued if template uses swatches
			$var_type = $this->sppcfw_find_var_display_type($layout);
			if ('swatches' === $var_type || (null === $var_type && isset(SPPCFW_ADVANCED['enable_variation_switcher']) && 'on' === SPPCFW_ADVANCED['enable_variation_switcher'])) {
				wp_enqueue_script(
					'sppcfw-variation-switcher-js',
					SPPCFW_DIR_URL . 'frontend/advanced/variation-switcher/variation-switcher.js',
					array('jquery'),
					SPPCFW_VERSION,
					true
				);
				wp_enqueue_style(
					'variation-switcher-css',
					SPPCFW_DIR_URL . 'frontend/advanced/variation-switcher/variation-switcher.css',
					null,
					SPPCFW_VERSION,
					'all'
				);
			}

			$custom_css = '
				.sppcfw-builder-frontend-wrapper { width: 100% !important; max-width: 100% !important; float: none !important; clear: both !important; box-sizing: border-box !important; }
				.sppcfw-builder-section { width: 100%; box-sizing: border-box; }
				.sppcfw-container-boxed { margin-left: auto !important; margin-right: auto !important; }
				.sppcfw-container-full { width: 100% !important; max-width: 100% !important; }
				.sppcfw-flex-row { display: flex; flex-wrap: wrap; width: 100%; box-sizing: border-box; }
				.sppcfw-column { box-sizing: border-box; }
				.sppcfw-widget-item { width: 100% !important; box-sizing: border-box !important; }

				/* WooCommerce Tabs Base Styling for Block Themes & Custom Themes */
				.woocommerce-tabs,
				.sppcfw-tabs-wrapper {
					width: 100% !important;
					margin-top: 24px !important;
					margin-bottom: 24px !important;
					box-sizing: border-box !important;
				}

				.woocommerce-tabs ul.tabs,
				.sppcfw-tabs-wrapper ul.tabs {
					display: flex !important;
					flex-wrap: wrap !important;
					gap: 8px !important;
					list-style: none !important;
					padding: 0 !important;
					margin: 0 0 20px 0 !important;
					border-bottom: 1px solid #e5e7eb !important;
				}

				.woocommerce-tabs ul.tabs li,
				.sppcfw-tabs-wrapper ul.tabs li {
					display: inline-block !important;
					margin: 0 !important;
					padding: 0 !important;
					background: transparent !important;
					border: none !important;
				}

				.woocommerce-tabs ul.tabs li a,
				.sppcfw-tabs-wrapper ul.tabs li a {
					display: block !important;
					padding: 10px 18px !important;
					font-size: 15px !important;
					font-weight: 600 !important;
					color: #4b5563 !important;
					text-decoration: none !important;
					border-bottom: 2px solid transparent !important;
					transition: all 0.2s ease-in-out !important;
					border-radius: 4px 4px 0 0 !important;
				}

				.woocommerce-tabs ul.tabs li:hover a,
				.sppcfw-tabs-wrapper ul.tabs li:hover a {
					color: #111827 !important;
				}

				.woocommerce-tabs ul.tabs li.active a,
				.sppcfw-tabs-wrapper ul.tabs li.active a {
					color: #4f46e5 !important;
					border-bottom: 2px solid #4f46e5 !important;
				}

				/* Hide inactive tab panels by default */
				.woocommerce-tabs .woocommerce-Tabs-panel,
				.woocommerce-tabs .panel.entry-content,
				.woocommerce-tabs .wc-tab,
				.sppcfw-tabs-wrapper .woocommerce-Tabs-panel,
				.sppcfw-tabs-wrapper .panel.entry-content,
				.sppcfw-tabs-wrapper .wc-tab {
					display: none;
					width: 100% !important;
					box-sizing: border-box !important;
					line-height: 1.7 !important;
					color: #374151 !important;
				}

				.woocommerce-tabs .woocommerce-Tabs-panel.sppcfw-active-tab,
				.sppcfw-tabs-wrapper .woocommerce-Tabs-panel.sppcfw-active-tab,
				.woocommerce-tabs .panel.entry-content.sppcfw-active-tab,
				.sppcfw-tabs-wrapper .panel.entry-content.sppcfw-active-tab,
				.woocommerce-tabs .wc-tab.sppcfw-active-tab,
				.sppcfw-tabs-wrapper .wc-tab.sppcfw-active-tab {
					display: block !important;
				}

				/* Additional Information Table in Block Themes */
				.woocommerce-tabs table.shop_attributes,
				.sppcfw-tabs-wrapper table.shop_attributes {
					width: 100% !important;
					border-collapse: collapse !important;
					margin: 16px 0 !important;
					border: 1px solid #e5e7eb !important;
					border-radius: 6px !important;
					overflow: hidden !important;
				}

				.woocommerce-tabs table.shop_attributes th,
				.sppcfw-tabs-wrapper table.shop_attributes th {
					width: 30% !important;
					padding: 10px 16px !important;
					background: #f9fafb !important;
					font-weight: 600 !important;
					color: #111827 !important;
					border-bottom: 1px solid #e5e7eb !important;
					text-align: left !important;
				}

				.woocommerce-tabs table.shop_attributes td,
				.sppcfw-tabs-wrapper table.shop_attributes td {
					padding: 10px 16px !important;
					color: #4b5563 !important;
					border-bottom: 1px solid #e5e7eb !important;
				}

				/* Reviews in Block Themes */
				.woocommerce-tabs #reviews,
				.sppcfw-tabs-wrapper #reviews {
					width: 100% !important;
				}

				.woocommerce-tabs #reviews ol.commentlist,
				.sppcfw-tabs-wrapper #reviews ol.commentlist {
					list-style: none !important;
					padding: 0 !important;
					margin: 0 0 24px 0 !important;
				}

				.woocommerce-tabs #reviews ol.commentlist li,
				.sppcfw-tabs-wrapper #reviews ol.commentlist li {
					border: 1px solid #e5e7eb !important;
					border-radius: 8px !important;
					padding: 16px !important;
					margin-bottom: 16px !important;
					background: #ffffff !important;
				}

				.woocommerce-tabs #reviews .comment-form textarea,
				.sppcfw-tabs-wrapper #reviews .comment-form textarea {
					width: 100% !important;
					border: 1px solid #d1d5db !important;
					border-radius: 6px !important;
					padding: 8px 12px !important;
					margin-top: 4px !important;
					margin-bottom: 12px !important;
					box-sizing: border-box !important;
				}

				/* Ensure outer theme containers do not cap max-width on custom single product layouts */
				.woocommerce-page #primary,
				.woocommerce #primary,
				.woocommerce-page .content-area,
				.woocommerce .content-area,
				.woocommerce-page main.site-main,
				.woocommerce main.site-main,
				.woocommerce-page #main,
				.woocommerce #main,
				.woocommerce-page #content,
				.woocommerce #content,
				.woocommerce-page .entry-content,
				.woocommerce .entry-content,
				.woocommerce-page .site-content,
				.woocommerce .site-content,
				.woocommerce div.product,
				.woocommerce-page div.product,
				body.single-product .envo-content,
				body.single-product article.woo-content {
					width: 100% !important;
					max-width: 100% !important;
					flex: 0 0 100% !important;
					box-sizing: border-box !important;
				}

				/* Suppress leftover theme sidebars on single product builder pages */
				body.single-product #sidebar,
				body.single-product aside#sidebar,
				body.single-product .widget-area,
				body.single-product #secondary,
				body.single-product .sidebar-area,
				body.single-product .col-md-3#sidebar,
				body.single-product .col-sm-3#sidebar {
					display: none !important;
				}

				/* Hide empty summary container from native WooCommerce template */
				.woocommerce div.product > .summary.entry-summary:empty,
				.woocommerce-page div.product > .summary.entry-summary:empty,
				div.product > .summary:empty { display: none !important; width: 0 !important; float: none !important; margin: 0 !important; padding: 0 !important; }

				/* Hide default breadcrumb outside builder layout */
				.woocommerce .woocommerce-breadcrumb,
				.woocommerce-page .woocommerce-breadcrumb,
				main.site-main > .woocommerce-breadcrumb,
				#main > .woocommerce-breadcrumb { display: none !important; }

				/* Full width product gallery override matching builder edit canvas */
				.woocommerce div.product .sppcfw-builder-frontend-wrapper div.images,
				.woocommerce-page div.product .sppcfw-builder-frontend-wrapper div.images,
				.woocommerce div.product .sppcfw-builder-frontend-wrapper .woocommerce-product-gallery,
				.woocommerce-page div.product .sppcfw-builder-frontend-wrapper .woocommerce-product-gallery,
				.sppcfw-builder-frontend-wrapper .woocommerce-product-gallery,
				.sppcfw-builder-frontend-wrapper div.product div.images,
				.sppcfw-builder-frontend-wrapper div.images,
				.sppcfw-builder-frontend-wrapper .images,
				.sppcfw-product-gallery-frontend-wrapper,
				.sppcfw-product-gallery-frontend-wrapper .woocommerce-product-gallery,
				.sppcfw-product-gallery-frontend-wrapper div.images {
					float: none !important;
					width: 100% !important;
					max-width: 100% !important;
					margin-left: 0 !important;
					margin-right: 0 !important;
					margin-bottom: 0 !important;
					opacity: 1 !important;
					box-sizing: border-box !important;
				}

				/* Product Price Base Styles */
				.sppcfw-price-wrapper {
					width: 100% !important;
					box-sizing: border-box !important;
				}
				.sppcfw-price-wrapper .price {
					margin: 0 !important;
					padding: 0 !important;
					display: flex !important;
					align-items: center !important;
					flex-wrap: wrap !important;
					gap: 8px !important;
				}
				.sppcfw-price-wrapper .price del {
					opacity: 0.65 !important;
					text-decoration: line-through !important;
				}
				.sppcfw-price-wrapper .price ins {
					text-decoration: none !important;
					font-weight: inherit !important;
				}
				.sppcfw-price-wrapper .price .woocommerce-Price-amount {
					display: inline-block !important;
				}

				/* Product Rating Component Base Styles */
				.sppcfw-rating-wrapper {
					width: 100% !important;
					box-sizing: border-box !important;
				}
				.sppcfw-rating-wrapper .woocommerce-product-rating {
					display: flex !important;
					align-items: center !important;
					flex-wrap: wrap !important;
					margin: 0 !important;
					line-height: 1 !important;
				}
				.sppcfw-rating-wrapper .star-rating {
					overflow: hidden !important;
					position: relative !important;
					height: 1.2em !important;
					line-height: 1.2 !important;
					font-size: 16px;
					width: 5.4em !important;
					font-family: star, WooCommerce, sans-serif !important;
					display: inline-block !important;
					vertical-align: middle !important;
					letter-spacing: 0.1em !important;
					margin: 0 !important;
				}
				.sppcfw-rating-wrapper .star-rating::before {
					content: "\73\73\73\73\73" !important;
					color: #d1d5db;
					float: left !important;
					top: 0 !important;
					left: 0 !important;
					position: absolute !important;
				}
				.sppcfw-rating-wrapper .star-rating span {
					overflow: hidden !important;
					float: left !important;
					top: 0 !important;
					left: 0 !important;
					position: absolute !important;
					padding-top: 1.5em !important;
				}
				.sppcfw-rating-wrapper .star-rating span::before {
					content: "\53\53\53\53\53" !important;
					top: 0 !important;
					position: absolute !important;
					left: 0 !important;
					color: #f59e0b;
				}
				.sppcfw-rating-wrapper .woocommerce-review-link {
					text-decoration: none !important;
					color: #6b7280;
					font-size: 14px;
					display: inline-block !important;
					line-height: 1 !important;
					transition: color 0.2s ease !important;
				}
				.sppcfw-rating-wrapper .woocommerce-review-link:hover {
					text-decoration: underline !important;
				}

				/* Gallery Component Styles */
				.sppcfw-product-gallery-frontend-wrapper {
					position: relative !important;
					width: 100% !important;
					max-width: 100% !important;
					box-sizing: border-box !important;
				}

				.sppcfw-gallery-main-container {
					position: relative !important;
					width: 100% !important;
					display: block !important;
				}

				.sppcfw-gallery-main-frame {
					position: relative !important;
					overflow: hidden !important;
					border-radius: inherit !important;
					width: 100% !important;
					cursor: default;
				}

				.sppcfw-gallery-main-frame img.sppcfw-gallery-main-img {
					width: 100% !important;
					height: auto !important;
					display: block !important;
					border-radius: inherit !important;
					transition: opacity 0.2s ease, transform 0.25s ease !important;
				}

				.sppcfw-gallery-sale-badge {
					position: absolute !important;
					top: 10px !important;
					left: 10px !important;
					z-index: 10 !important;
					background: #ef4444 !important;
					color: #ffffff !important;
					padding: 4px 10px !important;
					font-size: 11px !important;
					font-weight: 700 !important;
					border-radius: 9999px !important;
					text-transform: uppercase !important;
					box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
					line-height: 1 !important;
					min-height: auto !important;
				}

				/* Hide WooCommerce native gallery trigger so it does not conflict or duplicate */
				.woocommerce-product-gallery__trigger {
					display: none !important;
					opacity: 0 !important;
					visibility: hidden !important;
					pointer-events: none !important;
				}

				.sppcfw-gallery-actions-bar {
					position: absolute !important;
					top: 12px !important;
					right: 12px !important;
					z-index: 20 !important;
					display: flex !important;
					align-items: center !important;
					gap: 6px !important;
					opacity: 0.8 !important;
					transition: opacity 0.2s ease !important;
					pointer-events: auto !important;
				}

				.sppcfw-gallery-actions-bar:hover {
					opacity: 1 !important;
				}

				.sppcfw-gallery-action-badge,
				.sppcfw-gallery-lightbox-btn {
					position: relative !important;
					top: auto !important;
					right: auto !important;
					left: auto !important;
					bottom: auto !important;
					background: rgba(255, 255, 255, 0.9) !important;
					backdrop-filter: blur(4px) !important;
					-webkit-backdrop-filter: blur(4px) !important;
					border: 1px solid rgba(0, 0, 0, 0.08) !important;
					border-radius: 9999px !important;
					width: 28px !important;
					height: 28px !important;
					min-width: 28px !important;
					min-height: 28px !important;
					max-width: 28px !important;
					max-height: 28px !important;
					padding: 0 !important;
					margin: 0 !important;
					display: inline-flex !important;
					align-items: center !important;
					justify-content: center !important;
					cursor: pointer !important;
					color: #374151 !important;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
					line-height: 1 !important;
					transition: all 0.2s ease !important;
					box-sizing: border-box !important;
					outline: none !important;
					appearance: none !important;
					-webkit-appearance: none !important;
				}

				.sppcfw-gallery-action-badge:hover,
				.sppcfw-gallery-lightbox-btn:hover {
					background: #ffffff !important;
					color: #111827 !important;
					box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
					transform: scale(1.05) !important;
				}

				.sppcfw-gallery-action-badge svg,
				.sppcfw-gallery-lightbox-btn svg {
					width: 14px !important;
					height: 14px !important;
					display: block !important;
					stroke: currentColor !important;
					fill: none !important;
				}

				.sppcfw-gallery-carousel-wrapper {
					position: relative !important;
					display: flex !important;
					align-items: center !important;
					gap: 6px !important;
					margin-top: 10px !important;
					width: 100% !important;
					user-select: none !important;
					box-sizing: border-box !important;
				}

				.sppcfw-gallery-carousel-track {
					display: flex !important;
					gap: 8px !important;
					overflow-x: auto !important;
					scroll-behavior: smooth !important;
					scrollbar-width: none !important;
					-ms-overflow-style: none !important;
					width: 100% !important;
					padding: 4px 1px !important;
					box-sizing: border-box !important;
				}

				.sppcfw-gallery-carousel-track::-webkit-scrollbar {
					display: none !important;
				}

				.sppcfw-carousel-nav {
					background: #ffffff !important;
					border: 1px solid #e5e7eb !important;
					color: #374151 !important;
					width: 28px !important;
					height: 28px !important;
					min-width: 28px !important;
					border-radius: 50% !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					cursor: pointer !important;
					box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
					transition: all 0.15s ease !important;
					z-index: 5 !important;
					font-size: 13px !important;
					line-height: 1 !important;
					padding: 0 !important;
				}

				.sppcfw-carousel-nav:hover {
					background: #f3f4f6 !important;
					color: #111827 !important;
					border-color: #d1d5db !important;
				}

				.sppcfw-gallery-carousel-slide,
				.sppcfw-gallery-grid-thumb {
					border: 2px solid #e5e7eb !important;
					border-radius: 6px !important;
					overflow: hidden !important;
					cursor: pointer !important;
					transition: all 0.2s ease !important;
					padding: 2px !important;
					background: #ffffff !important;
					box-sizing: border-box !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
				}

				.sppcfw-gallery-carousel-slide:hover,
				.sppcfw-gallery-grid-thumb:hover {
					border-color: #9333ea !important;
				}

				.sppcfw-gallery-carousel-slide.is-active,
				.sppcfw-gallery-grid-thumb.is-active {
					border-color: #9333ea !important;
					box-shadow: 0 0 0 1px #9333ea !important;
				}

				.sppcfw-gallery-carousel-slide img,
				.sppcfw-gallery-grid-thumb img {
					width: 100% !important;
					height: auto !important;
					max-height: 70px !important;
					object-fit: contain !important;
					display: block !important;
					border-radius: 4px !important;
					pointer-events: none !important;
				}

				/* Lightbox Modal */
				.sppcfw-lightbox-modal {
					position: fixed !important;
					inset: 0 !important;
					z-index: 999999 !important;
					background: rgba(0, 0, 0, 0.85) !important;
					backdrop-filter: blur(8px) !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					padding: 24px !important;
					opacity: 0;
					visibility: hidden;
					transition: opacity 0.25s ease, visibility 0.25s ease !important;
				}

				.sppcfw-lightbox-modal.is-open {
					opacity: 1 !important;
					visibility: visible !important;
				}

				.sppcfw-lightbox-content {
					position: relative !important;
					max-width: 90vw !important;
					max-height: 90vh !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
				}

				.sppcfw-lightbox-content img {
					max-width: 90vw !important;
					max-height: 90vh !important;
					object-fit: contain !important;
					border-radius: 8px !important;
					box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
				}

				.sppcfw-lightbox-close {
					position: absolute !important;
					top: -40px !important;
					right: 0 !important;
					background: transparent !important;
					border: none !important;
					color: #ffffff !important;
					font-size: 28px !important;
					cursor: pointer !important;
					padding: 4px 8px !important;
					line-height: 1 !important;
				}

				/* Related & Upsell Products Cards & Layout */
				.sppcfw-related-wrapper,
				.sppcfw-upsell-wrapper {
					width: 100% !important;
					max-width: 100% !important;
					box-sizing: border-box !important;
					margin-top: 16px !important;
					margin-bottom: 24px !important;
					clear: both !important;
				}
				.sppcfw-related-heading {
					font-size: 18px !important;
					font-weight: 700 !important;
					color: #111827 !important;
					margin: 0 0 16px 0 !important;
					line-height: 1.3 !important;
					text-align: left !important;
				}
				.sppcfw-products-grid {
					display: grid !important;
					gap: 16px !important;
					width: 100% !important;
					box-sizing: border-box !important;
				}
				.sppcfw-card-product {
					background: #ffffff !important;
					border: 1px solid #e5e7eb !important;
					border-radius: 8px !important;
					padding: 10px !important;
					box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
					display: flex !important;
					flex-direction: column !important;
					justify-content: space-between !important;
					position: relative !important;
					box-sizing: border-box !important;
					transition: transform 0.2s ease, box-shadow 0.2s ease !important;
					overflow: hidden !important;
				}
				.sppcfw-card-product:hover {
					box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
					transform: translateY(-2px) !important;
				}
				.sppcfw-card-thumb-link {
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					width: 100% !important;
					background: #f3f4f6 !important;
					border-radius: 6px !important;
					overflow: hidden !important;
					position: relative !important;
					text-decoration: none !important;
				}
				.sppcfw-card-thumb-link img {
					width: 100% !important;
					height: 100% !important;
					object-fit: cover !important;
					display: block !important;
					transition: transform 0.3s ease !important;
				}
				.sppcfw-card-product:hover .sppcfw-card-thumb-link img {
					transform: scale(1.04) !important;
				}
				.sppcfw-card-sale-badge {
					position: absolute !important;
					top: 8px !important;
					left: 8px !important;
					background: #ef4444 !important;
					color: #ffffff !important;
					font-size: 10px !important;
					font-weight: 700 !important;
					padding: 2px 8px !important;
					border-radius: 9999px !important;
					text-transform: uppercase !important;
					z-index: 2 !important;
					line-height: 1.2 !important;
				}
				.sppcfw-card-info {
					padding: 8px 0 0 0 !important;
					flex-grow: 1 !important;
				}
				.sppcfw-card-title {
					font-size: 13px !important;
					font-weight: 600 !important;
					color: #111827 !important;
					margin: 0 0 4px 0 !important;
					line-height: 1.3 !important;
					text-decoration: none !important;
					display: -webkit-box !important;
					-webkit-line-clamp: 2 !important;
					-webkit-box-orient: vertical !important;
					overflow: hidden !important;
				}
				.sppcfw-card-title:hover {
					color: #9333ea !important;
				}
				.sppcfw-card-price {
					font-size: 13px !important;
					font-weight: 700 !important;
					color: #9333ea !important;
					margin: 0 0 8px 0 !important;
					line-height: 1.2 !important;
				}
				.sppcfw-card-price del {
					opacity: 0.6 !important;
					font-weight: normal !important;
					margin-right: 4px !important;
					text-decoration: line-through !important;
				}
				.sppcfw-card-price ins {
					text-decoration: none !important;
				}
				.sppcfw-card-button {
					background: #f3f4f6 !important;
					color: #374151 !important;
					font-size: 11px !important;
					font-weight: 700 !important;
					text-align: center !important;
					border-radius: 6px !important;
					padding: 8px 12px !important;
					width: 100% !important;
					display: block !important;
					text-decoration: none !important;
					border: 1px solid #e5e7eb !important;
					box-sizing: border-box !important;
					transition: all 0.15s ease !important;
					cursor: pointer !important;
					margin-top: auto !important;
				}
				.sppcfw-card-button:hover {
					background: #9333ea !important;
					color: #ffffff !important;
					border-color: #9333ea !important;
				}

				@media (max-width: 767px) {
					.sppcfw-products-grid {
						grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
						gap: 10px !important;
					}
				}
			';

			if (!empty($layout) && is_array($layout)) {
				$custom_css .= '
					@media (min-width: 1025px) {
						.sppcfw-hide-desktop { display: none !important; }
					}
					@media (min-width: 768px) and (max-width: 1024px) {
						.sppcfw-hide-tablet { display: none !important; }
					}
					@media (max-width: 767px) {
						.sppcfw-hide-mobile { display: none !important; }
					}
				';
				$custom_css .= $this->sppcfw_generate_recursive_styles($layout, 'desktop');
				$tablet_css = $this->sppcfw_generate_recursive_styles($layout, 'tablet');
				if (!empty($tablet_css)) {
					$custom_css .= " @media (max-width: 1024px) { {$tablet_css} }";
				}
				$mobile_css = $this->sppcfw_generate_recursive_styles($layout, 'mobile');
				if (!empty($mobile_css)) {
					$custom_css .= " @media (max-width: 767px) { {$mobile_css} }";
				}
			}

			wp_register_style('sppcfw-builder-frontend-inline', false);
			wp_enqueue_style('sppcfw-builder-frontend-inline');
			wp_add_inline_style('sppcfw-builder-frontend-inline', $custom_css);

			$gallery_js = "
				document.addEventListener('DOMContentLoaded', function() {
					function initSppcfwGalleries() {
						document.querySelectorAll('.sppcfw-gallery-container').forEach(function(gallery) {
							var mainImg = gallery.querySelector('.sppcfw-gallery-main-img');
							var mainFrame = gallery.querySelector('.sppcfw-gallery-main-frame');
							var thumbs = gallery.querySelectorAll('.sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb');
							var track = gallery.querySelector('.sppcfw-gallery-carousel-track');
							var prevBtn = gallery.querySelector('.sppcfw-carousel-prev');
							var nextBtn = gallery.querySelector('.sppcfw-carousel-next');
							var lightboxBtn = gallery.querySelector('.sppcfw-gallery-lightbox-btn');
							var zoomEnabled = gallery.getAttribute('data-zoom') === 'true';

							thumbs.forEach(function(thumb) {
								thumb.addEventListener('click', function(e) {
									e.preventDefault();
									thumbs.forEach(function(t) { t.classList.remove('is-active'); });
									thumb.classList.add('is-active');

									var newMain = thumb.getAttribute('data-main-src');
									var newFull = thumb.getAttribute('data-full-src');
									if (mainImg && newMain) {
										mainImg.style.opacity = '0.4';
										setTimeout(function() {
											mainImg.src = newMain;
											if (newFull) {
												mainImg.setAttribute('data-zoom-src', newFull);
												mainImg.setAttribute('data-full-src', newFull);
											}
											mainImg.style.opacity = '1';
										}, 100);
									}
								});
							});

							if (track && prevBtn && nextBtn) {
								prevBtn.addEventListener('click', function(e) {
									e.preventDefault();
									var scrollAmount = track.clientWidth * 0.75;
									track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
								});
								nextBtn.addEventListener('click', function(e) {
									e.preventDefault();
									var scrollAmount = track.clientWidth * 0.75;
									track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
								});
							}

							if (zoomEnabled && mainFrame && mainImg) {
								mainFrame.addEventListener('mousemove', function(e) {
									var rect = mainFrame.getBoundingClientRect();
									var x = ((e.clientX - rect.left) / rect.width) * 100;
									var y = ((e.clientY - rect.top) / rect.height) * 100;
									mainImg.style.transformOrigin = x + '% ' + y + '%';
									mainImg.style.transform = 'scale(1.5)';
								});
								mainFrame.addEventListener('mouseleave', function() {
									mainImg.style.transformOrigin = 'center center';
									mainImg.style.transform = 'scale(1)';
								});
							}

							if (lightboxBtn && mainImg) {
								lightboxBtn.addEventListener('click', function(e) {
									e.preventDefault();
									var fullSrc = mainImg.getAttribute('data-full-src') || mainImg.src;
									var modal = document.querySelector('.sppcfw-lightbox-modal');
									if (!modal) {
										modal = document.createElement('div');
										modal.className = 'sppcfw-lightbox-modal';
										modal.innerHTML = '<div class=\"sppcfw-lightbox-content\"><button type=\"button\" class=\"sppcfw-lightbox-close\" aria-label=\"Close\">&times;</button><img src=\"\" alt=\"Full size image\" /></div>';
										document.body.appendChild(modal);

										modal.querySelector('.sppcfw-lightbox-close').addEventListener('click', function() {
											modal.classList.remove('is-open');
										});
										modal.addEventListener('click', function(evt) {
											if (evt.target === modal) {
												modal.classList.remove('is-open');
											}
										});
										document.addEventListener('keydown', function(evt) {
											if (evt.key === 'Escape' && modal.classList.contains('is-open')) {
												modal.classList.remove('is-open');
											}
										});
									}
									modal.querySelector('img').src = fullSrc;
									modal.classList.add('is-open');
								});
							}
						});
					}
					initSppcfwGalleries();

					// Sync variation selection with product gallery
					if (typeof jQuery !== 'undefined') {
						jQuery(document).on('found_variation', 'form.variations_form', function(event, variation) {
							if (variation && variation.image && (variation.image.full_src || variation.image.src || variation.image.url)) {
								var newMain = variation.image.full_src || variation.image.src || variation.image.url;
								var mainImgs = document.querySelectorAll('.sppcfw-gallery-main-img');
								var thumbs = document.querySelectorAll('.sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb');
								mainImgs.forEach(function(img) {
									img.style.opacity = '0.3';
									setTimeout(function() {
										img.src = newMain;
										img.setAttribute('data-zoom-src', newMain);
										img.setAttribute('data-full-src', newMain);
										img.style.opacity = '1';
									}, 60);
								});
								thumbs.forEach(function(t) {
									t.classList.remove('is-active');
									var mSrc = t.getAttribute('data-main-src') || '';
									var fSrc = t.getAttribute('data-full-src') || '';
									if (mSrc === newMain || fSrc === newMain || (variation.image.thumb_src && mSrc === variation.image.thumb_src)) {
										t.classList.add('is-active');
									}
								});
							}
						});

						jQuery(document).on('reset_data', 'form.variations_form', function() {
							var thumbs = document.querySelectorAll('.sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb');
							var mainImgs = document.querySelectorAll('.sppcfw-gallery-main-img');
							var first = thumbs[0];
							if (first) {
								thumbs.forEach(function(t) { t.classList.remove('is-active'); });
								first.classList.add('is-active');
								var origMain = first.getAttribute('data-main-src');
								var origFull = first.getAttribute('data-full-src');
								if (origMain) {
									mainImgs.forEach(function(img) {
										img.src = origMain;
										if (origFull) {
											img.setAttribute('data-zoom-src', origFull);
											img.setAttribute('data-full-src', origFull);
										}
									});
								}
							}
						});
					}
				});
			";
			wp_register_script('sppcfw-builder-frontend-gallery', '', array(), false, true);
			wp_enqueue_script('sppcfw-builder-frontend-gallery');
			wp_add_inline_script('sppcfw-builder-frontend-gallery', $gallery_js);
		}

		/**
		 * Helper to get responsive property.
		 */
		private function sppcfw_get_device_prop($array, $key, $device = 'desktop', $default = '')
		{
			if (!is_array($array)) {
				return $default;
			}
			if ('mobile' === $device) {
				if (isset($array[$key . '_mobile']) && '' !== $array[$key . '_mobile'] && null !== $array[$key . '_mobile']) {
					return $array[$key . '_mobile'];
				}
				if (isset($array[$key . '_tablet']) && '' !== $array[$key . '_tablet'] && null !== $array[$key . '_tablet']) {
					return $array[$key . '_tablet'];
				}
				if (isset($array[$key]) && '' !== $array[$key] && null !== $array[$key]) {
					return $array[$key];
				}
				return $default;
			}
			if ('tablet' === $device) {
				if (isset($array[$key . '_tablet']) && '' !== $array[$key . '_tablet'] && null !== $array[$key . '_tablet']) {
					return $array[$key . '_tablet'];
				}
				if (isset($array[$key]) && '' !== $array[$key] && null !== $array[$key]) {
					return $array[$key];
				}
				return $default;
			}
			if (isset($array[$key]) && '' !== $array[$key] && null !== $array[$key]) {
				return $array[$key];
			}
			return $default;
		}

		/**
		 * Generate dynamic CSS recursively.
		 *
		 * @param array $elements Elements array.
		 * @param string $device Device mode.
		 * @return string CSS string.
		 */
		private function sppcfw_generate_recursive_styles($elements, $device = 'desktop')
		{
			$css = '';
			foreach ($elements as $el) {
				$type = isset($el['type']) ? $el['type'] : '';
				$id = isset($el['id']) ? esc_attr($el['id']) : '';
				$settings = isset($el['settings']) ? $el['settings'] : array();
				$styles = isset($el['styles']) ? $el['styles'] : array();
				$advanced = isset($el['advanced']) ? $el['advanced'] : array();

				// Helper to resolve property from $advanced first, falling back to $styles
				$get_prop = function ($key, $default = '') use ($styles, $advanced, $device) {
					$val = $this->sppcfw_get_device_prop($advanced, $key, $device, null);
					if (null !== $val && '' !== $val) {
						return $val;
					}
					return $this->sppcfw_get_device_prop($styles, $key, $device, $default);
				};

				if ($id) {
					// Responsive Visibility Rules
					$hide_desktop = !empty($advanced['hide_on_desktop']);
					$hide_tablet = !empty($advanced['hide_on_tablet']);
					$hide_mobile = !empty($advanced['hide_on_mobile']);

					if ('desktop' === $device) {
						if ($hide_desktop) {
							$css .= ".sppcfw-el-{$id} { display: none !important; }";
						}
					} elseif ('tablet' === $device) {
						if ($hide_tablet) {
							$css .= ".sppcfw-el-{$id} { display: none !important; }";
						} elseif ($hide_desktop && !$hide_tablet) {
							if ('container' === $type) {
								$css .= ".sppcfw-el-{$id} { display: block !important; }";
							} elseif ('column' === $type) {
								$css .= ".sppcfw-el-{$id} { display: flex !important; }";
							} else {
								$css .= ".sppcfw-el-{$id} { display: block !important; }";
							}
						}
					} elseif ('mobile' === $device) {
						if ($hide_mobile) {
							$css .= ".sppcfw-el-{$id} { display: none !important; }";
						} elseif (($hide_desktop || $hide_tablet) && !$hide_mobile) {
							if ('container' === $type) {
								$css .= ".sppcfw-el-{$id} { display: block !important; }";
							} elseif ('column' === $type) {
								$css .= ".sppcfw-el-{$id} { display: flex !important; }";
							} else {
								$css .= ".sppcfw-el-{$id} { display: block !important; }";
							}
						}
					}

					$css .= ".sppcfw-el-{$id} {";
					if ('container' === $type) {
						$width_mode = $this->sppcfw_get_device_prop($settings, 'width_mode', $device, 'boxed');
						$boxed_width = esc_attr($this->sppcfw_get_device_prop($settings, 'boxed_width', $device, '1140px'));
						$adv_width_mode = $this->sppcfw_get_device_prop($advanced, 'width_mode', $device, '');

						$is_full_width = ('full' === $width_mode || '100%' === $boxed_width || 'Full Width (100%)' === $adv_width_mode);
						if ($is_full_width) {
							$css .= 'width: 100% !important; max-width: 100% !important;';
						} else {
							$css .= "width: 100% !important; max-width: {$boxed_width} !important; margin-left: auto !important; margin-right: auto !important;";
						}
					} elseif ('column' === $type) {
						$flex_width = esc_attr($this->sppcfw_get_device_prop($settings, 'flex_width', $device, '100%'));
						$flex_direction = esc_attr($this->sppcfw_get_device_prop($settings, 'flex_direction', $device, 'column'));
						$justify_content = esc_attr($this->sppcfw_get_device_prop($settings, 'justify_content', $device, 'flex-start'));
						$align_items = esc_attr($this->sppcfw_get_device_prop($settings, 'align_items', $device, 'stretch'));
						$gap = esc_attr($this->sppcfw_get_device_prop($settings, 'gap', $device, '12px'));
						$min_height = esc_attr($this->sppcfw_get_device_prop($settings, 'min_height', $device, '0px'));

						if ('100%' === $flex_width) {
							$css .= "flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; display: flex !important; flex-direction: {$flex_direction} !important; justify-content: {$justify_content} !important; align-items: {$align_items} !important; gap: {$gap} !important; min-height: {$min_height} !important;";
						} else {
							$css .= "flex: 1 1 calc({$flex_width} - 16px) !important; min-width: 200px !important; display: flex !important; flex-direction: {$flex_direction} !important; justify-content: {$justify_content} !important; align-items: {$align_items} !important; gap: {$gap} !important; min-height: {$min_height} !important;";
						}
					}

					$text_color = $this->sppcfw_get_device_prop($styles, 'text_color', $device, '');
					if (!empty($text_color)) {
						$css .= 'color: ' . esc_attr($text_color) . ' !important;';
						$css .= ".sppcfw-el-{$id} h1, .sppcfw-el-{$id} h2, .sppcfw-el-{$id} h3, .sppcfw-el-{$id} h4, .sppcfw-el-{$id} h5, .sppcfw-el-{$id} h6, .sppcfw-el-{$id} .product_title, .sppcfw-el-{$id} .sppcfw-custom-heading, .sppcfw-el-{$id} a { color: " . esc_attr($text_color) . ' !important; }';
					}

					// Product Rating specific styles
					if ('product_rating' === $type) {
						$star_color = $this->sppcfw_get_device_prop($styles, 'star_color', $device, '');
						if (empty($star_color)) {
							$star_color = $this->sppcfw_get_device_prop($styles, 'text_color', $device, '#f59e0b');
						}
						$empty_star_color = $this->sppcfw_get_device_prop($styles, 'empty_star_color', $device, '#d1d5db');
						$star_size = $this->sppcfw_get_device_prop($styles, 'star_size', $device, '');
						$review_count_color = $this->sppcfw_get_device_prop($styles, 'review_count_color', $device, '');
						$review_font_size = $this->sppcfw_get_device_prop($styles, 'review_font_size', $device, '');
						$review_font_weight = $this->sppcfw_get_device_prop($styles, 'review_font_weight', $device, '');
						$gap = $this->sppcfw_get_device_prop($styles, 'gap', $device, '');
						$alignment = $this->sppcfw_get_device_prop($styles, 'alignment', $device, '');

						if (!empty($alignment)) {
							$justify_map = array(
								'left' => 'flex-start',
								'center' => 'center',
								'right' => 'flex-end',
							);
							$justify_val = isset($justify_map[$alignment]) ? $justify_map[$alignment] : 'flex-start';
							$css .= ".sppcfw-el-{$id} .sppcfw-product-rating-container, .sppcfw-el-{$id} .woocommerce-product-rating, .sppcfw-el-{$id} .sppcfw-rating-wrapper, .sppcfw-el-{$id} { justify-content: {$justify_val} !important; text-align: {$alignment} !important; }";
						}

						if (!empty($gap)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-product-rating-container, .sppcfw-el-{$id} .woocommerce-product-rating, .sppcfw-el-{$id} .sppcfw-rating-wrapper { gap: " . esc_attr($gap) . ' !important; }';
						}

						if (!empty($star_color)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-stars-filled, .sppcfw-el-{$id} .star-rating span::before, .sppcfw-el-{$id} .star-rating span { color: " . esc_attr($star_color) . ' !important; }';
						}

						if (!empty($empty_star_color)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-stars-empty, .sppcfw-el-{$id} .star-rating::before { color: " . esc_attr($empty_star_color) . ' !important; }';
						}

						if (!empty($star_size)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-stars-box, .sppcfw-el-{$id} .star-rating { font-size: " . esc_attr($star_size) . ' !important; }';
						}

						if (!empty($review_count_color)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-review-link, .sppcfw-el-{$id} .woocommerce-review-link, .sppcfw-el-{$id} a.woocommerce-review-link, .sppcfw-el-{$id} .woocommerce-review-link .count { color: " . esc_attr($review_count_color) . ' !important; }';
						}

						if (!empty($review_font_size)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-review-link, .sppcfw-el-{$id} .woocommerce-review-link { font-size: " . esc_attr($review_font_size) . ' !important; }';
						}

						if (!empty($review_font_weight) && 'Default' !== $review_font_weight) {
							$css .= ".sppcfw-el-{$id} .sppcfw-review-link, .sppcfw-el-{$id} .woocommerce-review-link { font-weight: " . esc_attr($review_font_weight) . ' !important; }';
						}
					}

					if ('product_add_to_cart' !== $type) {
						$bg_type = $this->sppcfw_get_device_prop($styles, 'bg_type', $device, 'classic');
						if ('gradient' === $bg_type) {
							$c1 = $this->sppcfw_get_device_prop($styles, 'bg_gradient_color1', $device, '#9333ea');
							$c2 = $this->sppcfw_get_device_prop($styles, 'bg_gradient_color2', $device, '#3b82f6');
							$g_type = strtolower((string) $this->sppcfw_get_device_prop($styles, 'bg_gradient_type', $device, 'linear'));
							$angle = (string) $this->sppcfw_get_device_prop($styles, 'bg_gradient_angle', $device, '180deg');
							if (false === strpos($angle, 'deg')) {
								$angle .= 'deg';
							}
							if ('radial' === $g_type) {
								$css .= 'background-image: radial-gradient(circle, ' . esc_attr($c1) . ', ' . esc_attr($c2) . ') !important;';
							} else {
								$css .= 'background-image: linear-gradient(' . esc_attr($angle) . ', ' . esc_attr($c1) . ', ' . esc_attr($c2) . ') !important;';
							}
						} else {
							$bg_color = $this->sppcfw_get_device_prop($styles, 'bg_color', $device, '');
							if (!empty($bg_color) && 'transparent' !== $bg_color) {
								$css .= 'background-color: ' . esc_attr($bg_color) . ' !important;';
							}
							$bg_image = $this->sppcfw_get_device_prop($styles, 'bg_image', $device, '');
							if (!empty($bg_image)) {
								$css .= 'background-image: url("' . esc_url($bg_image) . '") !important;';
								$bg_pos = $this->sppcfw_get_device_prop($styles, 'bg_position', $device, 'Center Center');
								if ('Custom' === $bg_pos) {
									$pos_x = $this->sppcfw_get_device_prop($styles, 'bg_pos_x', $device, '50%');
									$pos_y = $this->sppcfw_get_device_prop($styles, 'bg_pos_y', $device, '50%');
									$css .= 'background-position: ' . esc_attr($pos_x) . ' ' . esc_attr($pos_y) . ' !important;';
								} elseif (!empty($bg_pos) && 'Default' !== $bg_pos) {
									$css .= 'background-position: ' . esc_attr(strtolower($bg_pos)) . ' !important;';
								} else {
									$css .= 'background-position: center center !important;';
								}

								$bg_att = $this->sppcfw_get_device_prop($styles, 'bg_attachment', $device, '');
								if (!empty($bg_att) && 'Default' !== $bg_att) {
									$css .= 'background-attachment: ' . esc_attr(strtolower($bg_att)) . ' !important;';
								}

								$bg_rep = $this->sppcfw_get_device_prop($styles, 'bg_repeat', $device, 'No-repeat');
								if (!empty($bg_rep) && 'Default' !== $bg_rep) {
									$css .= 'background-repeat: ' . esc_attr(strtolower($bg_rep)) . ' !important;';
								} else {
									$css .= 'background-repeat: no-repeat !important;';
								}

								$bg_size = $this->sppcfw_get_device_prop($styles, 'bg_size', $device, 'Cover');
								if ('Custom' === $bg_size) {
									$custom_size = $this->sppcfw_get_device_prop($styles, 'bg_custom_size', $device, '100%');
									$css .= 'background-size: ' . esc_attr($custom_size) . ' !important;';
								} elseif (!empty($bg_size) && 'Default' !== $bg_size) {
									$css .= 'background-size: ' . esc_attr(strtolower($bg_size)) . ' !important;';
								} else {
									$css .= 'background-size: cover !important;';
								}
							}
						}

						$bg_hover_trans = $this->sppcfw_get_device_prop($styles, 'bg_hover_transition', $device, '');
						if (!empty($bg_hover_trans)) {
							$css .= 'transition: all ' . esc_attr($bg_hover_trans) . ' ease !important;';
						}

						$font_size = $this->sppcfw_get_device_prop($styles, 'font_size', $device, '');
						if (!empty($font_size)) {
							$css .= 'font-size: ' . esc_attr($font_size) . ' !important;';
							$css .= ".sppcfw-el-{$id} h1, .sppcfw-el-{$id} h2, .sppcfw-el-{$id} h3, .sppcfw-el-{$id} h4, .sppcfw-el-{$id} h5, .sppcfw-el-{$id} h6, .sppcfw-el-{$id} .product_title, .sppcfw-el-{$id} .sppcfw-custom-heading { font-size: " . esc_attr($font_size) . ' !important; }';
							$css .= ".sppcfw-el-{$id} .price, .sppcfw-el-{$id} .price .amount, .sppcfw-el-{$id} .woocommerce-Price-amount { font-size: " . esc_attr($font_size) . ' !important; }';
						}

						$font_family = $this->sppcfw_get_device_prop($styles, 'font_family', $device, '');
						if (!empty($font_family) && 'Inherit' !== $font_family) {
							$css .= 'font-family: ' . esc_attr($font_family) . ', sans-serif !important;';
							$css .= ".sppcfw-el-{$id} h1, .sppcfw-el-{$id} h2, .sppcfw-el-{$id} h3, .sppcfw-el-{$id} h4, .sppcfw-el-{$id} h5, .sppcfw-el-{$id} h6, .sppcfw-el-{$id} .product_title, .sppcfw-el-{$id} .sppcfw-custom-heading { font-family: " . esc_attr($font_family) . ', sans-serif !important; }';
						}

						$font_weight = $this->sppcfw_get_device_prop($styles, 'font_weight', $device, '');
						if (!empty($font_weight) && 'Default' !== $font_weight) {
							$css .= 'font-weight: ' . esc_attr($font_weight) . ' !important;';
							$css .= ".sppcfw-el-{$id} h1, .sppcfw-el-{$id} h2, .sppcfw-el-{$id} h3, .sppcfw-el-{$id} h4, .sppcfw-el-{$id} h5, .sppcfw-el-{$id} h6, .sppcfw-el-{$id} .product_title, .sppcfw-el-{$id} .sppcfw-custom-heading, .sppcfw-el-{$id} a { font-weight: " . esc_attr($font_weight) . ' !important; }';
							$css .= ".sppcfw-el-{$id} .price, .sppcfw-el-{$id} .price .amount, .sppcfw-el-{$id} .woocommerce-Price-amount { font-weight: " . esc_attr($font_weight) . ' !important; }';
						}

						$line_height = $this->sppcfw_get_device_prop($styles, 'line_height', $device, '');
						if (!empty($line_height)) {
							$css .= 'line-height: ' . esc_attr($line_height) . ' !important;';
							$css .= ".sppcfw-el-{$id} h1, .sppcfw-el-{$id} h2, .sppcfw-el-{$id} h3, .sppcfw-el-{$id} h4, .sppcfw-el-{$id} h5, .sppcfw-el-{$id} h6, .sppcfw-el-{$id} .product_title, .sppcfw-el-{$id} .sppcfw-custom-heading { line-height: " . esc_attr($line_height) . ' !important; }';
						}

						// Border: Only generate when border_type is set and not None
						$border_type = strtolower((string) $this->sppcfw_get_device_prop($styles, 'border_type', $device, ''));
						$border_width = $this->sppcfw_get_device_prop($styles, 'border_width', $device, '');
						$border_color = $this->sppcfw_get_device_prop($styles, 'border_color', $device, '');

						$has_active_border = !empty($border_type) && 'none' !== $border_type;
						if ($has_active_border && !empty($border_width) && '0px' !== $border_width && '0' !== $border_width) {
							$border_style_val = in_array($border_type, array('solid', 'dashed', 'dotted', 'double'), true) ? $border_type : 'solid';
							$css .= 'border-style: ' . esc_attr($border_style_val) . '; border-width: ' . esc_attr($border_width) . ' !important;';
							if (!empty($border_color) && 'transparent' !== $border_color) {
								$css .= 'border-color: ' . esc_attr($border_color) . ' !important;';
							}
						}

						$border_radius = $this->sppcfw_get_device_prop($styles, 'border_radius', $device, '');
						$rad_t = $this->sppcfw_get_device_prop($styles, 'border_radius_top', $device, '');
						$rad_r = $this->sppcfw_get_device_prop($styles, 'border_radius_right', $device, '');
						$rad_b = $this->sppcfw_get_device_prop($styles, 'border_radius_bottom', $device, '');
						$rad_l = $this->sppcfw_get_device_prop($styles, 'border_radius_left', $device, '');

						if ('' !== $rad_t || '' !== $rad_r || '' !== $rad_b || '' !== $rad_l) {
							$t = ('' !== $rad_t && null !== $rad_t) ? $rad_t : (!empty($border_radius) ? $border_radius : '0px');
							$r = ('' !== $rad_r && null !== $rad_r) ? $rad_r : (!empty($border_radius) ? $border_radius : '0px');
							$b = ('' !== $rad_b && null !== $rad_b) ? $rad_b : (!empty($border_radius) ? $border_radius : '0px');
							$l = ('' !== $rad_l && null !== $rad_l) ? $rad_l : (!empty($border_radius) ? $border_radius : '0px');
							$css .= "border-radius: {$t} {$r} {$b} {$l} !important;";
						} elseif (!empty($border_radius) && '0px' !== $border_radius && '0' !== $border_radius) {
							$css .= 'border-radius: ' . esc_attr($border_radius) . ' !important;';
						}

						// Padding: Check $advanced first, then $styles
						$padding_top = $get_prop('padding_top', '');
						if ('' !== $padding_top && null !== $padding_top && '0px' !== $padding_top && '0' !== $padding_top) {
							$css .= 'padding-top: ' . esc_attr($padding_top) . ' !important;';
						}

						$padding_right = $get_prop('padding_right', '');
						if ('' !== $padding_right && null !== $padding_right && '0px' !== $padding_right && '0' !== $padding_right) {
							$css .= 'padding-right: ' . esc_attr($padding_right) . ' !important;';
						}

						$padding_bottom = $get_prop('padding_bottom', '');
						if ('' !== $padding_bottom && null !== $padding_bottom && '0px' !== $padding_bottom && '0' !== $padding_bottom) {
							$css .= 'padding-bottom: ' . esc_attr($padding_bottom) . ' !important;';
						}

						$padding_left = $get_prop('padding_left', '');
						if ('' !== $padding_left && null !== $padding_left && '0px' !== $padding_left && '0' !== $padding_left) {
							$css .= 'padding-left: ' . esc_attr($padding_left) . ' !important;';
						}
					} else {
						// For product_add_to_cart, ensure outer container is clean and transparent
						$css .= 'background: transparent !important; background-color: transparent !important; border: none !important; padding: 0 !important;';
					}

					// Margin: Check $advanced first, then $styles
					$margin_top = $get_prop('margin_top', '');
					if ('' !== $margin_top && null !== $margin_top && '0px' !== $margin_top && '0' !== $margin_top) {
						$css .= 'margin-top: ' . esc_attr($margin_top) . ' !important;';
					}

					$margin_right = $get_prop('margin_right', '');
					if ('' !== $margin_right && null !== $margin_right && '0px' !== $margin_right && '0' !== $margin_right) {
						if ('container' !== $type || (isset($is_full_width) && $is_full_width)) {
							$css .= 'margin-right: ' . esc_attr($margin_right) . ' !important;';
						}
					}

					$margin_bottom = $get_prop('margin_bottom', '');
					if ('' !== $margin_bottom && null !== $margin_bottom && '0px' !== $margin_bottom && '0' !== $margin_bottom) {
						$css .= 'margin-bottom: ' . esc_attr($margin_bottom) . ' !important;';
					}

					$margin_left = $get_prop('margin_left', '');
					if ('' !== $margin_left && null !== $margin_left && '0px' !== $margin_left && '0' !== $margin_left) {
						if ('container' !== $type || (isset($is_full_width) && $is_full_width)) {
							$css .= 'margin-left: ' . esc_attr($margin_left) . ' !important;';
						}
					}

					$adv_width_mode = $this->sppcfw_get_device_prop($advanced, 'width_mode', $device, '');
					if ('Inline (auto)' === $adv_width_mode) {
						$css .= 'width: auto !important; display: inline-block !important;';
					}

					$width = $get_prop('width', '');
					if (!empty($width)) {
						$css .= 'width: ' . esc_attr($width) . ' !important;';
					}

					$max_width = $get_prop('max_width', '');
					if (!empty($max_width)) {
						$css .= 'max-width: ' . esc_attr($max_width) . ' !important;';
					}

					$z_index = $this->sppcfw_get_device_prop($advanced, 'z_index', $device, '');
					if ('' !== $z_index && null !== $z_index) {
						$css .= 'z-index: ' . esc_attr($z_index) . ' !important;';
					}

					$opacity = $this->sppcfw_get_device_prop($styles, 'opacity', $device, '');
					if ('' !== $opacity && null !== $opacity) {
						$css .= 'opacity: ' . esc_attr($opacity) . ' !important;';
					}

					$alignment = $this->sppcfw_get_device_prop($styles, 'alignment', $device, '');
					if (!empty($alignment)) {
						$css .= 'text-align: ' . esc_attr($alignment) . ' !important;';
						$align_justify = ('center' === $alignment ? 'center' : ('right' === $alignment ? 'flex-end' : 'flex-start'));
						$css .= ".sppcfw-el-{$id} .sppcfw-price-wrapper, .sppcfw-el-{$id} .price { text-align: " . esc_attr($alignment) . " !important; justify-content: {$align_justify} !important; }";
					}
					$css .= '}';

					// Hover background rule for non-cart elements
					if ('product_add_to_cart' !== $type) {
						$bg_hover_color = $this->sppcfw_get_device_prop($styles, 'bg_hover_color', $device, '');
						$bg_hover_image = $this->sppcfw_get_device_prop($styles, 'bg_hover_image', $device, '');
						if ((!empty($bg_hover_color) && 'transparent' !== $bg_hover_color) || !empty($bg_hover_image)) {
							$css .= ".sppcfw-el-{$id}:hover {";
							if (!empty($bg_hover_color) && 'transparent' !== $bg_hover_color) {
								$css .= 'background-color: ' . esc_attr($bg_hover_color) . ' !important;';
							}
							if (!empty($bg_hover_image)) {
								$css .= 'background-image: url("' . esc_url($bg_hover_image) . '") !important;';
							}
							$css .= '}';
						}
					}

					// Product Price specific styling rules (isolated and matching canvas preview)
					if ('product_price' === $type) {
						$price_color = $this->sppcfw_get_device_prop($styles, 'price_color', $device, '');
						if (empty($price_color)) {
							$price_color = $this->sppcfw_get_device_prop($styles, 'text_color', $device, '#9333ea');
						}
						$sale_price_color = $this->sppcfw_get_device_prop($styles, 'sale_price_color', $device, '#ef4444');
						$reg_price_color = $this->sppcfw_get_device_prop($styles, 'regular_price_color', $device, '#9ca3af');
						$price_font_size = $this->sppcfw_get_device_prop($styles, 'font_size', $device, '24px');
						$price_font_weight = $this->sppcfw_get_device_prop($styles, 'font_weight', $device, '800');
						$price_align = $this->sppcfw_get_device_prop($styles, 'alignment', $device, 'left');
						$price_justify = ('center' === $price_align ? 'center' : ('right' === $price_align ? 'flex-end' : 'flex-start'));

						$css .= ".sppcfw-el-{$id} .sppcfw-price-wrapper, .sppcfw-el-{$id} .price, .sppcfw-el-{$id} p.price { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 8px !important; margin: 0 !important; padding: 0 !important; line-height: 1.2 !important; justify-content: {$price_justify} !important; text-align: {$price_align} !important; }";

						// Main Price Color (Standard prices & variable price ranges)
						$css .= ".sppcfw-el-{$id} .price, .sppcfw-el-{$id} .price *, .sppcfw-el-{$id} .woocommerce-Price-amount, .sppcfw-el-{$id} .woocommerce-Price-amount *, .sppcfw-el-{$id} .sppcfw-price-wrapper, .sppcfw-el-{$id} .sppcfw-price-wrapper * { color: " . esc_attr($price_color) . " !important; font-size: " . esc_attr($price_font_size) . " !important; font-weight: " . esc_attr($price_font_weight) . " !important; }";

						// Regular Price (del - strikethrough)
						$show_reg = !isset($settings['show_regular_price']) || true === $settings['show_regular_price'] || 'true' === $settings['show_regular_price'] || 1 === $settings['show_regular_price'] || '1' === $settings['show_regular_price'] || 'on' === $settings['show_regular_price'];
						if (isset($settings['show_regular_price']) && (false === $settings['show_regular_price'] || 'false' === $settings['show_regular_price'] || 0 === $settings['show_regular_price'] || '0' === $settings['show_regular_price'] || 'off' === $settings['show_regular_price'])) {
							$show_reg = false;
						}

						if (!$show_reg) {
							$css .= ".sppcfw-el-{$id} .price del, .sppcfw-el-{$id} del { display: none !important; }";
						} else {
							$css .= ".sppcfw-el-{$id} .price del, .sppcfw-el-{$id} .price del *, .sppcfw-el-{$id} del, .sppcfw-el-{$id} del * { color: " . esc_attr($reg_price_color) . " !important; font-size: calc(" . esc_attr($price_font_size) . " * 0.8) !important; font-weight: 400 !important; opacity: 0.75 !important; text-decoration: line-through !important; -webkit-text-decoration-line: line-through !important; }";
						}

						// Sale Price (ins)
						$css .= ".sppcfw-el-{$id} .price ins, .sppcfw-el-{$id} .price ins *, .sppcfw-el-{$id} ins, .sppcfw-el-{$id} ins * { color: " . esc_attr($sale_price_color) . " !important; font-size: " . esc_attr($price_font_size) . " !important; font-weight: " . esc_attr($price_font_weight) . " !important; text-decoration: none !important; -webkit-text-decoration-line: none !important; }";

						// Sale Badge styling
						$css .= ".sppcfw-el-{$id} .sppcfw-price-sale-badge { background-color: " . esc_attr($sale_price_color) . " !important; color: #ffffff !important; font-size: 11px !important; padding: 2px 8px !important; border-radius: 4px !important; font-weight: 700 !important; text-transform: uppercase !important; display: inline-block !important; line-height: 1.2 !important; margin-left: 4px !important; }";
					}

					// Specific element component style rules (Add to Cart / Buttons)
					if ('product_add_to_cart' === $type) {
						$btn_bg = $this->sppcfw_get_device_prop($styles, 'btn_bg_color', $device, '');
						if (empty($btn_bg)) {
							$btn_bg = $this->sppcfw_get_device_prop($styles, 'bg_color', $device, '');
						}
						if ('transparent' === $btn_bg) {
							$btn_bg = '';
						}
						$btn_color = $this->sppcfw_get_device_prop($styles, 'btn_text_color', $device, '');
						if (empty($btn_color)) {
							$btn_color = $this->sppcfw_get_device_prop($styles, 'text_color', $device, '');
						}
						$btn_hover_bg = $this->sppcfw_get_device_prop($styles, 'btn_hover_bg_color', $device, '');
						$btn_hover_color = $this->sppcfw_get_device_prop($styles, 'btn_hover_text_color', $device, '');
						$btn_font_size = $this->sppcfw_get_device_prop($styles, 'btn_font_size', $device, '');
						if (empty($btn_font_size)) {
							$btn_font_size = $this->sppcfw_get_device_prop($styles, 'font_size', $device, '');
						}
						$btn_font_weight = $this->sppcfw_get_device_prop($styles, 'font_weight', $device, '');
						$btn_font_family = $this->sppcfw_get_device_prop($styles, 'font_family', $device, '');

						// Quantity element styles
						$qty_bg = $this->sppcfw_get_device_prop($styles, 'qty_bg_color', $device, '#ffffff');
						$qty_bg = !empty($qty_bg) ? $qty_bg : '#ffffff';
						$qty_color = $this->sppcfw_get_device_prop($styles, 'qty_text_color', $device, '#111827');
						$qty_color = !empty($qty_color) ? $qty_color : '#111827';
						$qty_border = $this->sppcfw_get_device_prop($styles, 'qty_border_color', $device, '#d1d5db');
						$qty_border = !empty($qty_border) ? $qty_border : '#d1d5db';
						$qty_btn_bg = $this->sppcfw_get_device_prop($styles, 'qty_btn_bg', $device, '#f3f4f6');
						$qty_btn_bg = !empty($qty_btn_bg) ? $qty_btn_bg : '#f3f4f6';
						$qty_btn_color = $this->sppcfw_get_device_prop($styles, 'qty_btn_color', $device, '#374151');
						$qty_btn_color = !empty($qty_btn_color) ? $qty_btn_color : '#374151';
						$qty_btn_hover_bg = $this->sppcfw_get_device_prop($styles, 'qty_btn_hover_bg', $device, '#e5e7eb');
						$qty_btn_hover_bg = !empty($qty_btn_hover_bg) ? $qty_btn_hover_bg : '#e5e7eb';
						$gap_val = $this->sppcfw_get_device_prop($styles, 'gap', $device, '12px');

						// 4-box or single border radius
						$btn_rad_top = $this->sppcfw_get_device_prop($styles, 'btn_border_radius_top', $device, '');
						$btn_rad_right = $this->sppcfw_get_device_prop($styles, 'btn_border_radius_right', $device, '');
						$btn_rad_bottom = $this->sppcfw_get_device_prop($styles, 'btn_border_radius_bottom', $device, '');
						$btn_rad_left = $this->sppcfw_get_device_prop($styles, 'btn_border_radius_left', $device, '');
						$btn_radius = $this->sppcfw_get_device_prop($styles, 'btn_border_radius', $device, '');
						if (empty($btn_radius)) {
							$btn_radius = $this->sppcfw_get_device_prop($styles, 'border_radius', $device, '');
						}
						if ('' !== $btn_rad_top || '' !== $btn_rad_right || '' !== $btn_rad_bottom || '' !== $btn_rad_left) {
							$btn_radius_css = ($btn_rad_top ? $btn_rad_top : '0px') . ' ' . ($btn_rad_right ? $btn_rad_right : '0px') . ' ' . ($btn_rad_bottom ? $btn_rad_bottom : '0px') . ' ' . ($btn_rad_left ? $btn_rad_left : '0px');
						} elseif (!empty($btn_radius)) {
							$btn_radius_css = $btn_radius;
						} else {
							$btn_radius_css = '';
						}

						// 4-box button padding
						$btn_pad_top = $this->sppcfw_get_device_prop($styles, 'btn_padding_top', $device, '');
						$btn_pad_right = $this->sppcfw_get_device_prop($styles, 'btn_padding_right', $device, '');
						$btn_pad_bottom = $this->sppcfw_get_device_prop($styles, 'btn_padding_bottom', $device, '');
						$btn_pad_left = $this->sppcfw_get_device_prop($styles, 'btn_padding_left', $device, '');
						$btn_padding = $this->sppcfw_get_device_prop($styles, 'btn_padding', $device, '');
						if ('' !== $btn_pad_top || '' !== $btn_pad_right || '' !== $btn_pad_bottom || '' !== $btn_pad_left) {
							$btn_padding_css = ($btn_pad_top ? $btn_pad_top : '0px') . ' ' . ($btn_pad_right ? $btn_pad_right : '0px') . ' ' . ($btn_pad_bottom ? $btn_pad_bottom : '0px') . ' ' . ($btn_pad_left ? $btn_pad_left : '0px');
						} elseif (!empty($btn_padding)) {
							$btn_padding_css = $btn_padding;
						} else {
							$btn_padding_css = '';
						}

						// Alignment for Cart Form & Add to Cart Wrapper
						$cart_align = $this->sppcfw_get_device_prop($styles, 'alignment', $device, 'left');
						$justify = 'center' === $cart_align ? 'center' : ('right' === $cart_align ? 'flex-end' : 'flex-start');
						$align_text = 'center' === $cart_align ? 'center' : ('right' === $cart_align ? 'right' : 'left');

						$css .= ".sppcfw-el-{$id}.sppcfw-add-to-cart-wrapper, .sppcfw-el-{$id} { background: transparent !important; background-color: transparent !important; border: none !important; padding: 0 !important; width: 100% !important; text-align: {$align_text} !important; }";
						$css .= ".sppcfw-el-{$id} form.cart, .sppcfw-el-{$id} .variations_form { display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: {$gap_val} !important; margin: 0 !important; padding: 0 !important; background: transparent !important; background-color: transparent !important; border: none !important; justify-content: {$justify} !important; }";
						$css .= ".sppcfw-el-{$id} form.cart table.variations { width: 100% !important; border-collapse: separate !important; border-spacing: 0 8px !important; margin-bottom: 12px !important; background: transparent !important; }";
						$css .= ".sppcfw-el-{$id} form.cart table.variations tr { background: #f9fafb !important; border-radius: 6px !important; }";
						$css .= ".sppcfw-el-{$id} form.cart table.variations th.label, .sppcfw-el-{$id} form.cart table.variations .label { text-align: left !important; padding: 10px 14px !important; font-weight: 700 !important; font-size: 13px !important; color: #111827 !important; width: 130px !important; vertical-align: middle !important; border: none !important; }";
						$css .= ".sppcfw-el-{$id} form.cart table.variations td.value { padding: 10px 14px !important; vertical-align: middle !important; border: none !important; }";
						$css .= ".sppcfw-el-{$id} .single_variation_wrap { width: 100% !important; }";
						$css .= ".sppcfw-el-{$id} .single_variation_wrap .woocommerce-variation-add-to-cart, .sppcfw-el-{$id} form.cart:not(.variations_form) { display: flex !important; align-items: center !important; gap: {$gap_val} !important; justify-content: {$justify} !important; }";
						$css .= ".sppcfw-el-{$id} .single_variation_wrap a.reset_variations { display: inline-block !important; margin-bottom: 10px !important; color: #4b5563 !important; font-size: 12px !important; text-decoration: none !important; }";
						$css .= ".sppcfw-el-{$id} .single_variation_wrap a.reset_variations:hover { color: #9333ea !important; text-decoration: underline !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation.single_variation { margin-bottom: 12px !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-price { font-size: 18px !important; font-weight: 800 !important; color: #111827 !important; margin-bottom: 4px !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-price del { opacity: 0.6 !important; font-weight: normal !important; margin-right: 8px !important; text-decoration: line-through !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-price ins { text-decoration: none !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-availability { font-size: 13px !important; font-weight: 600 !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-availability .stock.in-stock, .sppcfw-el-{$id} .woocommerce-variation-availability p.in-stock { color: #16a34a !important; }";
						$css .= ".sppcfw-el-{$id} .woocommerce-variation-availability .stock.out-of-stock, .sppcfw-el-{$id} .woocommerce-variation-availability p.out-of-stock { color: #ef4444 !important; }";
						$css .= ".sppcfw-el-{$id}.sppcfw-var-display-table form.cart table.variations, .sppcfw-el-{$id} .sppcfw-var-display-table form.cart table.variations, .sppcfw-el-{$id}.sppcfw-var-display-table .single_variation_wrap .woocommerce-variation-price, .sppcfw-el-{$id}.sppcfw-var-display-table .single_variation_wrap .woocommerce-variation-availability { display: none !important; }";

						// Quantity wrapper & buttons styling (isolated from Add to Cart button styles)
						$css .= ".sppcfw-el-{$id} form.cart .quantity, .sppcfw-el-{$id} .variations_form .quantity, .sppcfw-el-{$id} .quantity, .sppcfw-el-{$id} .quantity.buttons_added { display: inline-flex !important; align-items: center !important; margin: 0 !important; float: none !important; border: 1px solid {$qty_border} !important; border-color: {$qty_border} !important; border-radius: 4px !important; overflow: hidden !important; background-color: {$qty_bg} !important; background: {$qty_bg} !important; height: 42px !important; box-sizing: border-box !important; gap: 0 !important; }";
						$css .= ".sppcfw-el-{$id} .quantity .qty, .sppcfw-el-{$id} .quantity input.qty, .sppcfw-el-{$id} .quantity input[type=\"number\"], .sppcfw-el-{$id} form.cart .quantity .qty, .sppcfw-el-{$id} form.cart .quantity input.qty { height: 40px !important; min-height: 40px !important; width: 50px !important; text-align: center !important; border: none !important; font-size: 14px !important; font-weight: 700 !important; color: {$qty_color} !important; background: {$qty_bg} !important; background-color: {$qty_bg} !important; padding: 0 !important; margin: 0 !important; outline: none !important; box-shadow: none !important; border-radius: 0 !important; }";
						$css .= ".sppcfw-el-{$id} .quantity .sppcfw_minus_button, .sppcfw-el-{$id} .quantity .sppcfw_plus_button, .sppcfw-el-{$id} .quantity button.sppcfw_minus_button, .sppcfw-el-{$id} .quantity button.sppcfw_plus_button, .sppcfw-el-{$id} .quantity .minus, .sppcfw-el-{$id} .quantity .plus, .sppcfw-el-{$id} .quantity button.minus, .sppcfw-el-{$id} .quantity button.plus, .sppcfw-el-{$id} .quantity input.minus, .sppcfw-el-{$id} .quantity input.plus, .sppcfw-el-{$id} form.cart .quantity .sppcfw_minus_button, .sppcfw-el-{$id} form.cart .quantity .sppcfw_plus_button, .sppcfw-el-{$id} form.cart .quantity button.sppcfw_minus_button, .sppcfw-el-{$id} form.cart .quantity button.sppcfw_plus_button { height: 40px !important; width: 34px !important; min-width: 34px !important; max-width: 34px !important; border: none !important; background-color: {$qty_btn_bg} !important; background: {$qty_btn_bg} !important; color: {$qty_btn_color} !important; font-weight: bold !important; font-size: 16px !important; cursor: pointer !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; margin: 0 !important; line-height: 1 !important; text-decoration: none !important; box-shadow: none !important; border-radius: 0 !important; }";
						$css .= ".sppcfw-el-{$id} .quantity .sppcfw_minus_button, .sppcfw-el-{$id} .quantity button.sppcfw_minus_button, .sppcfw-el-{$id} .quantity .minus, .sppcfw-el-{$id} .quantity button.minus, .sppcfw-el-{$id} .quantity input.minus, .sppcfw-el-{$id} form.cart .quantity .sppcfw_minus_button, .sppcfw-el-{$id} form.cart .quantity button.sppcfw_minus_button { border-right: 1px solid {$qty_border} !important; border-left: none !important; }";
						$css .= ".sppcfw-el-{$id} .quantity .sppcfw_plus_button, .sppcfw-el-{$id} .quantity button.sppcfw_plus_button, .sppcfw-el-{$id} .quantity .plus, .sppcfw-el-{$id} .quantity button.plus, .sppcfw-el-{$id} .quantity input.plus, .sppcfw-el-{$id} form.cart .quantity .sppcfw_plus_button, .sppcfw-el-{$id} form.cart .quantity button.sppcfw_plus_button { border-right: none !important; border-left: 1px solid {$qty_border} !important; }";
						$css .= ".sppcfw-el-{$id} .quantity .sppcfw_minus_button:hover, .sppcfw-el-{$id} .quantity .sppcfw_plus_button:hover, .sppcfw-el-{$id} .quantity button.sppcfw_minus_button:hover, .sppcfw-el-{$id} .quantity button.sppcfw_plus_button:hover, .sppcfw-el-{$id} .quantity .minus:hover, .sppcfw-el-{$id} .quantity .plus:hover, .sppcfw-el-{$id} .quantity button.minus:hover, .sppcfw-el-{$id} .quantity button.plus:hover, .sppcfw-el-{$id} .quantity input.minus:hover, .sppcfw-el-{$id} .quantity input.plus:hover, .sppcfw-el-{$id} form.cart .quantity .sppcfw_minus_button:hover, .sppcfw-el-{$id} form.cart .quantity .sppcfw_plus_button:hover { background-color: {$qty_btn_hover_bg} !important; background: {$qty_btn_hover_bg} !important; }";

						// Strict selector for Add to Cart Button only (excludes quantity buttons)
						$btn_sel = ".sppcfw-el-{$id} .single_add_to_cart_button, .sppcfw-el-{$id} button.single_add_to_cart_button, .sppcfw-el-{$id} button[name=\"add-to-cart\"], .sppcfw-el-{$id} input[name=\"add-to-cart\"], .sppcfw-el-{$id} form.cart > button.button, .sppcfw-el-{$id} .sppcfw-add-to-cart-wrapper .single_add_to_cart_button";

						$css .= "{$btn_sel} {";
						$css .= 'display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; text-decoration: none !important; outline: none !important; transition: all 0.2s ease-in-out !important; line-height: 1.2 !important; min-height: 42px !important; float: none !important; margin: 0 !important; box-sizing: border-box !important; border: none !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;';
						if (!empty($btn_bg)) {
							$css .= 'background-color: ' . esc_attr($btn_bg) . ' !important; background: ' . esc_attr($btn_bg) . ' !important;';
						}
						if (!empty($btn_color)) {
							$css .= 'color: ' . esc_attr($btn_color) . ' !important;';
						}
						if (!empty($btn_font_size)) {
							$css .= 'font-size: ' . esc_attr($btn_font_size) . ' !important;';
						}
						if (!empty($btn_font_weight) && 'Default' !== $btn_font_weight) {
							$css .= 'font-weight: ' . esc_attr($btn_font_weight) . ' !important;';
						}
						if (!empty($btn_font_family) && 'Inherit' !== $btn_font_family) {
							$css .= 'font-family: ' . esc_attr($btn_font_family) . ', sans-serif !important;';
						}
						if (!empty($btn_radius_css)) {
							$css .= 'border-radius: ' . esc_attr($btn_radius_css) . ' !important;';
						}
						if (!empty($btn_padding_css)) {
							$css .= 'padding: ' . esc_attr($btn_padding_css) . ' !important;';
						}
						$css .= '}';

						if (!empty($btn_hover_bg) || !empty($btn_hover_color)) {
							$btn_hover_sel = ".sppcfw-el-{$id} .single_add_to_cart_button:hover, .sppcfw-el-{$id} button.single_add_to_cart_button:hover, .sppcfw-el-{$id} button[name=\"add-to-cart\"]:hover, .sppcfw-el-{$id} input[name=\"add-to-cart\"]:hover, .sppcfw-el-{$id} form.cart > button.button:hover";
							$css .= "{$btn_hover_sel} {";
							if (!empty($btn_hover_bg)) {
								$css .= 'background-color: ' . esc_attr($btn_hover_bg) . ' !important; background: ' . esc_attr($btn_hover_bg) . ' !important;';
							}
							if (!empty($btn_hover_color)) {
								$css .= 'color: ' . esc_attr($btn_hover_color) . ' !important;';
							}
							$css .= 'opacity: 0.95 !important;';
							$css .= '}';
						}

						// Variation Swatches & Attributes styling
						$var_label_color = $this->sppcfw_get_device_prop($styles, 'var_label_color', $device, '');
						$var_label_size = $this->sppcfw_get_device_prop($styles, 'var_label_size', $device, '');
						$swatch_size = $this->sppcfw_get_device_prop($styles, 'swatch_size', $device, '');
						$swatch_border_radius = $this->sppcfw_get_device_prop($styles, 'swatch_border_radius', $device, '');
						$active_swatch_color = $this->sppcfw_get_device_prop($styles, 'active_swatch_color', $device, '');
						$swatch_gap = $this->sppcfw_get_device_prop($styles, 'swatch_gap', $device, '');

						if (!empty($var_label_color)) {
							$css .= ".sppcfw-el-{$id} table.variations label, .sppcfw-el-{$id} table.variations .label, .sppcfw-el-{$id} table.variations th { color: " . esc_attr($var_label_color) . ' !important; }';
						}
						if (!empty($var_label_size)) {
							$css .= ".sppcfw-el-{$id} table.variations label, .sppcfw-el-{$id} table.variations .label, .sppcfw-el-{$id} table.variations th { font-size: " . esc_attr($var_label_size) . ' !important; }';
						}
						if (!empty($active_swatch_color)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-swatch-item.selected, .sppcfw-el-{$id} .sppcfw-swatch-item.active, .sppcfw-el-{$id} button.webfwc_variation_button.selected { border-color: " . esc_attr($active_swatch_color) . ' !important; box-shadow: 0 0 0 2px ' . esc_attr($active_swatch_color) . ' !important; outline-color: ' . esc_attr($active_swatch_color) . ' !important; }';
							$css .= ".sppcfw-el-{$id} button.webfwc_variation_button:hover { border-color: " . esc_attr($active_swatch_color) . ' !important; box-shadow: 0 0 0 1px ' . esc_attr($active_swatch_color) . ' !important; }';
						}
						if (!empty($swatch_size)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-swatch-item, .sppcfw-el-{$id} button.webfwc_variation_button.color { width: " . esc_attr($swatch_size) . ' !important; height: ' . esc_attr($swatch_size) . ' !important; min-width: ' . esc_attr($swatch_size) . ' !important; min-height: ' . esc_attr($swatch_size) . ' !important; }';
							$css .= ".sppcfw-el-{$id} button.webfwc_variation_button.button { min-height: " . esc_attr($swatch_size) . ' !important; }';
						}
						if (!empty($swatch_border_radius)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-swatch-item, .sppcfw-el-{$id} button.webfwc_variation_button, .sppcfw-el-{$id} button.webfwc_variation_button.color, .sppcfw-el-{$id} button.webfwc_variation_button.button { border-radius: " . esc_attr($swatch_border_radius) . ' !important; }';
						} else {
							// Swatch shape classes fallback when no custom border radius is set
							$css .= ".sppcfw-el-{$id}.sppcfw-swatch-shape-circle button.webfwc_variation_button.color, .sppcfw-el-{$id} .sppcfw-swatch-shape-circle button.webfwc_variation_button.color { border-radius: 50% !important; }";
							$css .= ".sppcfw-el-{$id}.sppcfw-swatch-shape-circle button.webfwc_variation_button.button, .sppcfw-el-{$id} .sppcfw-swatch-shape-circle button.webfwc_variation_button.button { border-radius: 9999px !important; }";
							$css .= ".sppcfw-el-{$id}.sppcfw-swatch-shape-rounded button.webfwc_variation_button, .sppcfw-el-{$id} .sppcfw-swatch-shape-rounded button.webfwc_variation_button { border-radius: 6px !important; }";
							$css .= ".sppcfw-el-{$id}.sppcfw-swatch-shape-square button.webfwc_variation_button, .sppcfw-el-{$id} .sppcfw-swatch-shape-square button.webfwc_variation_button { border-radius: 2px !important; }";
						}
						if (!empty($swatch_gap)) {
							$css .= ".sppcfw-el-{$id} .sppcfw-swatches-container, .sppcfw-el-{$id} .cu_button_el, .sppcfw-el-{$id} table.variations td.value { gap: " . esc_attr($swatch_gap) . ' !important; }';
						}

						// Show/hide labels & reset link
						$css .= ".sppcfw-el-{$id}.sppcfw-hide-var-labels table.variations th.label, .sppcfw-el-{$id}.sppcfw-hide-var-labels table.variations label, .sppcfw-el-{$id} .sppcfw-hide-var-labels table.variations th.label { display: none !important; }";
						$css .= ".sppcfw-el-{$id}.sppcfw-hide-var-reset a.reset_variations, .sppcfw-el-{$id} .sppcfw-hide-var-reset a.reset_variations { display: none !important; }";
					}


					$star_color = $this->sppcfw_get_device_prop($styles, 'star_color', $device, '');
					$star_size = $this->sppcfw_get_device_prop($styles, 'star_size', $device, '');
					$review_count_color = $this->sppcfw_get_device_prop($styles, 'review_count_color', $device, '');
					if (!empty($star_color)) {
						$css .= ".sppcfw-el-{$id} .star-rating span::before, .sppcfw-el-{$id} .star-rating::before { color: " . esc_attr($star_color) . ' !important; }';
					}
					if (!empty($star_size)) {
						$css .= ".sppcfw-el-{$id} .star-rating { font-size: " . esc_attr($star_size) . ' !important; }';
					}
					if (!empty($review_count_color)) {
						$css .= ".sppcfw-el-{$id} .woocommerce-review-link { color: " . esc_attr($review_count_color) . ' !important; }';
					}

					$active_tab_color = $this->sppcfw_get_device_prop($styles, 'active_tab_color', $device, '');
					if (!empty($active_tab_color)) {
						$css .= ".sppcfw-el-{$id} .woocommerce-tabs ul.tabs li.active a { color: " . esc_attr($active_tab_color) . ' !important; border-bottom-color: ' . esc_attr($active_tab_color) . ' !important; }';
					}

					$label_color = $this->sppcfw_get_device_prop($styles, 'label_color', $device, '');
					if (!empty($label_color)) {
						$css .= ".sppcfw-el-{$id} strong, .sppcfw-el-{$id} .meta-label { color: " . esc_attr($label_color) . ' !important; }';
					}

					if ('container' === $type) {
						$gap = esc_attr($this->sppcfw_get_device_prop($settings, 'gap', $device, '16px'));
						$flex_direction = esc_attr($this->sppcfw_get_device_prop($settings, 'flex_direction', $device, 'row'));
						$css .= ".sppcfw-el-{$id} > .sppcfw-flex-row { gap: {$gap} !important; flex-direction: {$flex_direction} !important; }";
					}

					if ('product_gallery' === $type) {
						$cols = !empty($settings['gallery_columns']) ? intval($settings['gallery_columns']) : 4;
						if ($cols < 2 || $cols > 8) {
							$cols = 4;
						}
						$align = $this->sppcfw_get_device_prop($styles, 'alignment', $device, (!empty($settings['alignment']) ? $settings['alignment'] : 'center'));
						$justify = 'center';
						if ('left' === $align) {
							$justify = 'flex-start';
						} elseif ('right' === $align) {
							$justify = 'flex-end';
						}
						$css .= ".sppcfw-el-{$id} .sppcfw-gallery-thumbs-grid { grid-template-columns: repeat({$cols}, minmax(0, 1fr)) !important; }";
						$css .= ".sppcfw-el-{$id} .sppcfw-gallery-carousel-slide { flex: 0 0 calc((100% - (" . ($cols - 1) . " * 8px)) / {$cols}) !important; }";
						$css .= ".sppcfw-el-{$id} .sppcfw-gallery-main-container { justify-content: {$justify} !important; }";
					}

					if ('related_products' === $type || 'upsell_products' === $type) {
						$default_cols = ('mobile' === $device ? 2 : ('tablet' === $device ? 3 : 4));
						$cols = intval($this->sppcfw_get_device_prop($settings, 'columns', $device, $default_cols));
						if ($cols < 1 || $cols > 6) {
							$cols = $default_cols;
						}
						$css .= ".sppcfw-el-{$id} .sppcfw-products-grid, .sppcfw-el-{$id}.sppcfw-products-block .sppcfw-products-grid, .sppcfw-el-{$id} ul.products, .sppcfw-el-{$id} .products { display: grid !important; grid-template-columns: repeat({$cols}, minmax(0, 1fr)) !important; gap: 16px !important; }";
						$css .= ".sppcfw-el-{$id} .sppcfw-card-product, .sppcfw-el-{$id} ul.products li.product, .sppcfw-el-{$id} .products .product { width: 100% !important; margin: 0 !important; float: none !important; }";
					}
				}

				if (!empty($el['children']) && is_array($el['children'])) {
					$css .= $this->sppcfw_generate_recursive_styles($el['children'], $device);
				}
			}
			return $css;
		}

		/**
		 * Render frontend builder layout output.
		 *
		 * @return void
		 */
		public function sppcfw_render_builder_template()
		{
			$elements = isset($this->matched_template['layout']) ? $this->matched_template['layout'] : array();

			if (empty($elements)) {
				return;
			}

			echo '<div class="sppcfw-builder-frontend-wrapper">';
			$this->sppcfw_render_elements_recursive($elements);
			echo '</div>';
		}

		/**
		 * Render elements tree recursively.
		 *
		 * @param array $elements List of elements.
		 * @return void
		 */
		private function sppcfw_render_elements_recursive($elements)
		{
			if (empty($elements) || !is_array($elements)) {
				return;
			}

			foreach ($elements as $el) {
				$type = isset($el['type']) ? $el['type'] : '';
				$id = isset($el['id']) ? esc_attr($el['id']) : '';
				$settings = isset($el['settings']) ? $el['settings'] : array();
				$advanced = isset($el['advanced']) ? $el['advanced'] : array();
				$custom_classes = !empty($advanced['custom_class']) ? esc_attr($advanced['custom_class']) : (!empty($advanced['css_classes']) ? esc_attr($advanced['css_classes']) : '');
				$custom_id = !empty($advanced['css_id']) ? ' id="' . esc_attr($advanced['css_id']) . '"' : '';

				$hide_classes = '';
				if (!empty($advanced['hide_on_desktop'])) {
					$hide_classes .= ' sppcfw-hide-desktop';
				}
				if (!empty($advanced['hide_on_tablet'])) {
					$hide_classes .= ' sppcfw-hide-tablet';
				}
				if (!empty($advanced['hide_on_mobile'])) {
					$hide_classes .= ' sppcfw-hide-mobile';
				}

				$combined_class = ' sppcfw-el-' . $id . $hide_classes . (!empty($custom_classes) ? ' ' . $custom_classes : '');

				if ('container' === $type) {
					$is_full_width = (isset($settings['width_mode']) && 'full' === $settings['width_mode']) || (isset($settings['boxed_width']) && '100%' === $settings['boxed_width']) || (isset($advanced['width_mode']) && 'Full Width (100%)' === $advanced['width_mode']);
					$width_mode = $is_full_width ? 'full' : 'boxed';

					echo '<div' . $custom_id . ' class="sppcfw-builder-section sppcfw-container-' . esc_attr($width_mode) . $combined_class . '">';
					echo '<div class="sppcfw-flex-row">';
					if (!empty($el['children'])) {
						$this->sppcfw_render_elements_recursive($el['children']);
					}
					echo '</div>';
					echo '</div>';
				} elseif ('column' === $type) {
					echo '<div' . $custom_id . ' class="sppcfw-column' . $combined_class . '">';
					if (!empty($el['children'])) {
						$this->sppcfw_render_elements_recursive($el['children']);
					}
					echo '</div>';
				} else {
					// Render Widget
					echo '<div' . $custom_id . ' class="sppcfw-widget-item' . $combined_class . '">';
					$this->sppcfw_render_single_widget($el);
					echo '</div>';
				}
			}
		}

		/**
		 * Render individual widget output.
		 *
		 * @param array $el Widget element data.
		 * @return void
		 */
		private function sppcfw_render_single_widget($el)
		{
			global $product;

			if (!$product) {
				$product = wc_get_product(get_the_ID());
			}

			if (!$product) {
				return;
			}

			$type = isset($el['type']) ? $el['type'] : '';
			$id = isset($el['id']) ? esc_attr($el['id']) : '';
			$el_class = !empty($id) ? ' sppcfw-el-' . $id : '';
			$settings = isset($el['settings']) && is_array($el['settings']) ? $el['settings'] : array();
			$styles = isset($el['styles']) && is_array($el['styles']) ? $el['styles'] : array();
			$advanced = isset($el['advanced']) && is_array($el['advanced']) ? $el['advanced'] : array();

			switch ($type) {
				case 'product_title':
					$tag = !empty($settings['html_tag']) ? sanitize_key($settings['html_tag']) : 'h1';
					$valid_tags = array('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p');
					if (!in_array($tag, $valid_tags, true)) {
						$tag = 'h1';
					}
					$title_text = $product->get_name();
					$link_to_product = !empty($settings['link_to_product']);
					if ($link_to_product) {
						$title_html = '<a href="' . esc_url(get_permalink($product->get_id())) . '" class="sppcfw-product-title-link">' . esc_html($title_text) . '</a>';
					} else {
						$title_html = esc_html($title_text);
					}
					echo '<' . $tag . ' class="product_title entry-title' . $el_class . '">' . $title_html . '</' . $tag . '>';
					break;
				case 'heading':
					$tag = !empty($settings['html_tag']) ? sanitize_key($settings['html_tag']) : 'h2';
					$valid_tags = array('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p');
					if (!in_array($tag, $valid_tags, true)) {
						$tag = 'h2';
					}
					$text = isset($settings['text']) && '' !== $settings['text'] ? esc_html($settings['text']) : esc_html__('Add Your Heading Text Here', 'single-product-customizer');
					$link_url = !empty($settings['link_url']) ? esc_url($settings['link_url']) : '';
					$target = !empty($settings['link_target_blank']) ? ' target="_blank" rel="noopener noreferrer"' : '';

					echo '<' . $tag . ' class="sppcfw-custom-heading' . $el_class . '">';
					if (!empty($link_url)) {
						echo '<a href="' . $link_url . '"' . $target . '>' . $text . '</a>';
					} else {
						echo $text;
					}
					echo '</' . $tag . '>';
					break;
				case 'text_editor':
					$tag = !empty($settings['html_tag']) ? sanitize_key($settings['html_tag']) : 'div';
					$valid_tags = array('div', 'p', 'span');
					if (!in_array($tag, $valid_tags, true)) {
						$tag = 'div';
					}
					$content = isset($settings['text_content']) && '' !== $settings['text_content'] ? wp_kses_post($settings['text_content']) : esc_html__('Add your custom description or paragraph content here...', 'single-product-customizer');
					echo '<' . $tag . ' class="sppcfw-custom-text-block' . $el_class . '">' . nl2br($content) . '</' . $tag . '>';
					break;
				case 'html_code':
				case 'custom_html':
				case 'html':
					$html = isset($settings['html_content']) ? $settings['html_content'] : (isset($settings['code']) ? $settings['code'] : '');
					$css = isset($settings['custom_css']) ? $settings['custom_css'] : '';
					$js = isset($settings['custom_js']) ? $settings['custom_js'] : '';

					echo '<div class="sppcfw-custom-html-wrapper' . $el_class . '">';
					if (!empty($css)) {
						echo '<style type="text/css">' . $css . '</style>';
					}
					if (!empty($html)) {
						echo do_shortcode($html);
					}
					if (!empty($js)) {
						echo '<script type="text/javascript">' . $js . '</script>';
					}
					echo '</div>';
					break;
				case 'product_price':
					$basic = get_option('sppcfw_basic', array());
					$is_price_hidden = (is_array($basic) && isset($basic['hide_product_price']) && 'on' === $basic['hide_product_price']);
					if ($is_price_hidden) {
						break;
					}

					$settings = isset($el['settings']) ? $el['settings'] : array();
					$show_reg = !isset($settings['show_regular_price']) || true === $settings['show_regular_price'] || 'true' === $settings['show_regular_price'] || 1 === $settings['show_regular_price'] || '1' === $settings['show_regular_price'] || 'on' === $settings['show_regular_price'];
					if (isset($settings['show_regular_price']) && (false === $settings['show_regular_price'] || 'false' === $settings['show_regular_price'] || 0 === $settings['show_regular_price'] || '0' === $settings['show_regular_price'] || 'off' === $settings['show_regular_price'])) {
						$show_reg = false;
					}

					$show_badge = !isset($settings['show_sale_badge']) || true === $settings['show_sale_badge'] || 'true' === $settings['show_sale_badge'] || 1 === $settings['show_sale_badge'] || '1' === $settings['show_sale_badge'] || 'on' === $settings['show_sale_badge'];
					if (isset($settings['show_sale_badge']) && (false === $settings['show_sale_badge'] || 'false' === $settings['show_sale_badge'] || 0 === $settings['show_sale_badge'] || '0' === $settings['show_sale_badge'] || 'off' === $settings['show_sale_badge'])) {
						$show_badge = false;
					}

					echo '<div class="sppcfw-price-wrapper' . $el_class . '">';
					if (!$show_reg && $product && $product->is_on_sale()) {
						$sale_price = $product->get_sale_price();
						if ($sale_price !== '' && false !== $sale_price) {
							echo '<p class="price"><ins><span class="woocommerce-Price-amount amount">' . wc_price($sale_price) . '</span></ins></p>';
						} else {
							woocommerce_template_single_price();
						}
					} else {
						woocommerce_template_single_price();
					}

					if ($show_badge && $product && $product->is_on_sale()) {
						echo '<span class="sppcfw-price-sale-badge">' . esc_html__('Sale', 'single-product-customizer') . '</span>';
					}
					echo '</div>';
					break;
				case 'product_gallery':
					$settings = isset($el['settings']) ? $el['settings'] : array();
					$styles = isset($el['styles']) ? $el['styles'] : array();

					$show_thumbnails = !isset($settings['show_thumbnails']) || true === $settings['show_thumbnails'] || 'true' === $settings['show_thumbnails'] || 1 === $settings['show_thumbnails'] || '1' === $settings['show_thumbnails'];
					if (isset($settings['show_thumbnails']) && (false === $settings['show_thumbnails'] || 'false' === $settings['show_thumbnails'] || 0 === $settings['show_thumbnails'] || '0' === $settings['show_thumbnails'])) {
						$show_thumbnails = false;
					}

					$thumbs_layout = !empty($settings['thumbs_layout']) ? sanitize_key($settings['thumbs_layout']) : 'grid';
					$cols = !empty($settings['gallery_columns']) ? intval($settings['gallery_columns']) : 4;
					if ($cols < 2 || $cols > 8) {
						$cols = 4;
					}

					$show_carousel_arrows = !isset($settings['show_carousel_arrows']) || false !== $settings['show_carousel_arrows'];
					if (isset($settings['show_carousel_arrows']) && (false === $settings['show_carousel_arrows'] || 'false' === $settings['show_carousel_arrows'] || 0 === $settings['show_carousel_arrows'] || '0' === $settings['show_carousel_arrows'])) {
						$show_carousel_arrows = false;
					}

					$enable_lightbox = !isset($settings['enable_lightbox']) || false !== $settings['enable_lightbox'];
					if (isset($settings['enable_lightbox']) && (false === $settings['enable_lightbox'] || 'false' === $settings['enable_lightbox'] || 0 === $settings['enable_lightbox'] || '0' === $settings['enable_lightbox'])) {
						$enable_lightbox = false;
					}

					$enable_zoom = !isset($settings['enable_zoom']) || false !== $settings['enable_zoom'];
					if (isset($settings['enable_zoom']) && (false === $settings['enable_zoom'] || 'false' === $settings['enable_zoom'] || 0 === $settings['enable_zoom'] || '0' === $settings['enable_zoom'])) {
						$enable_zoom = false;
					}

					$alignment = isset($styles['alignment']) ? $styles['alignment'] : (isset($settings['alignment']) ? $settings['alignment'] : 'center');
					$align_class = 'sppcfw-justify-center sppcfw-text-center';
					if ('left' === $alignment) {
						$align_class = 'sppcfw-justify-start sppcfw-text-left';
					} elseif ('right' === $alignment) {
						$align_class = 'sppcfw-justify-end sppcfw-text-right';
					}

					$post_thumbnail_id = $product->get_image_id();
					$attachment_ids = $product->get_gallery_image_ids();

					$all_images = array();
					if ($post_thumbnail_id) {
						$full_src = wp_get_attachment_image_url($post_thumbnail_id, 'full');
						$large_src = wp_get_attachment_image_url($post_thumbnail_id, 'woocommerce_single');
						if (!$large_src) {
							$large_src = $full_src;
						}
						$thumb_src = wp_get_attachment_image_url($post_thumbnail_id, 'woocommerce_gallery_thumbnail');
						if (!$thumb_src) {
							$thumb_src = wp_get_attachment_image_url($post_thumbnail_id, 'thumbnail');
						}
						if (!$thumb_src) {
							$thumb_src = $full_src;
						}
						$alt = get_post_meta($post_thumbnail_id, '_wp_attachment_image_alt', true);
						if (empty($alt)) {
							$alt = $product->get_name();
						}

						$all_images[] = array(
							'id' => $post_thumbnail_id,
							'full' => $full_src,
							'main' => $large_src,
							'thumb' => $thumb_src,
							'alt' => $alt,
						);
					}

					if (!empty($attachment_ids)) {
						foreach ($attachment_ids as $att_id) {
							$full_src = wp_get_attachment_image_url($att_id, 'full');
							$large_src = wp_get_attachment_image_url($att_id, 'woocommerce_single');
							if (!$large_src) {
								$large_src = $full_src;
							}
							$thumb_src = wp_get_attachment_image_url($att_id, 'woocommerce_gallery_thumbnail');
							if (!$thumb_src) {
								$thumb_src = wp_get_attachment_image_url($att_id, 'thumbnail');
							}
							if (!$thumb_src) {
								$thumb_src = $full_src;
							}
							$alt = get_post_meta($att_id, '_wp_attachment_image_alt', true);
							if (empty($alt)) {
								$alt = $product->get_name();
							}

							$all_images[] = array(
								'id' => $att_id,
								'full' => $full_src,
								'main' => $large_src,
								'thumb' => $thumb_src,
								'alt' => $alt,
							);
						}
					}

					if (empty($all_images)) {
						$placeholder = wc_placeholder_img_src('woocommerce_single');
						$all_images[] = array(
							'id' => 0,
							'full' => $placeholder,
							'main' => $placeholder,
							'thumb' => $placeholder,
							'alt' => $product->get_name(),
						);
					}

					$first_image = $all_images[0];
					$is_on_sale = $product->is_on_sale();

					echo '<div class="sppcfw-product-gallery-frontend-wrapper' . $el_class . ' sppcfw-gallery-container ' . esc_attr($align_class) . '" data-zoom="' . ($enable_zoom ? 'true' : 'false') . '" data-lightbox="' . ($enable_lightbox ? 'true' : 'false') . '">';

					// Main Featured Image Container
					echo '<div class="sppcfw-gallery-main-container" style="position:relative; display:inline-block; max-width:100%;">';

					if ($is_on_sale) {
						echo '<span class="onsale sppcfw-gallery-sale-badge">' . esc_html__('Sale!', 'woocommerce') . '</span>';
					}

					echo '<div class="sppcfw-gallery-main-frame' . ($enable_zoom ? ' sppcfw-zoom-enabled' : '') . '">';
					echo '<img src="' . esc_url($first_image['main']) . '" data-zoom-src="' . esc_url($first_image['full']) . '" data-full-src="' . esc_url($first_image['full']) . '" alt="' . esc_attr($first_image['alt']) . '" class="sppcfw-gallery-main-img" style="max-width:100%;height:auto;display:block;" />';

					if ($enable_zoom || $enable_lightbox) {
						echo '<div class="sppcfw-gallery-actions-bar">';
						if ($enable_zoom) {
							echo '<span class="sppcfw-gallery-action-badge" title="' . esc_attr__('Zoom', 'single-product-customizer') . '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><line x1="21" y1="21" x2="15.8" y2="15.8"/><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></svg></span>';
						}
						if ($enable_lightbox) {
							echo '<button type="button" class="sppcfw-gallery-lightbox-btn" title="' . esc_attr__('Lightbox', 'single-product-customizer') . '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>';
						}
						echo '</div>';
					}

					echo '</div>';  // close sppcfw-gallery-main-frame
					echo '</div>';  // close sppcfw-gallery-main-container

					// Thumbnails Row
					if ($show_thumbnails && count($all_images) > 1) {
						if ('carousel' === $thumbs_layout) {
							echo '<div class="sppcfw-gallery-carousel-wrapper" data-cols="' . esc_attr($cols) . '">';
							if ($show_carousel_arrows) {
								echo '<button type="button" class="sppcfw-carousel-nav sppcfw-carousel-prev" aria-label="Previous thumbnails">&#10094;</button>';
							}
							echo '<div class="sppcfw-gallery-carousel-track">';
							foreach ($all_images as $idx => $img) {
								$active_class = (0 === $idx) ? ' is-active' : '';
								echo '<div class="sppcfw-gallery-carousel-slide' . $active_class . '" data-main-src="' . esc_url($img['main']) . '" data-full-src="' . esc_url($img['full']) . '" data-index="' . esc_attr($idx) . '" style="flex:0 0 calc((100% - (' . ($cols - 1) . ' * 8px)) / ' . $cols . '); min-width:40px; box-sizing:border-box;">';
								echo '<img src="' . esc_url($img['thumb']) . '" alt="' . esc_attr($img['alt']) . '" class="sppcfw-thumb-img" />';
								echo '</div>';
							}
							echo '</div>';  // close sppcfw-gallery-carousel-track
							if ($show_carousel_arrows) {
								echo '<button type="button" class="sppcfw-carousel-nav sppcfw-carousel-next" aria-label="Next thumbnails">&#10095;</button>';
							}
							echo '</div>';  // close sppcfw-gallery-carousel-wrapper
						} else {
							// Grid mode
							echo '<div class="sppcfw-gallery-thumbs-grid" style="display:grid; grid-template-columns:repeat(' . esc_attr($cols) . ', minmax(0, 1fr)); gap:8px; margin-top:10px;">';
							foreach ($all_images as $idx => $img) {
								$active_class = (0 === $idx) ? ' is-active' : '';
								echo '<div class="sppcfw-gallery-grid-thumb' . $active_class . '" data-main-src="' . esc_url($img['main']) . '" data-full-src="' . esc_url($img['full']) . '" data-index="' . esc_attr($idx) . '">';
								echo '<img src="' . esc_url($img['thumb']) . '" alt="' . esc_attr($img['alt']) . '" class="sppcfw-thumb-img" />';
								echo '</div>';
							}
							echo '</div>';
						}
					}

					echo '</div>';  // close sppcfw-product-gallery-frontend-wrapper
					break;
				case 'image':
					$settings = isset($el['settings']) ? $el['settings'] : array();
					$styles = isset($el['styles']) ? $el['styles'] : array();
					$img_src = !empty($settings['custom_image_url']) ? $settings['custom_image_url'] : (!empty($settings['image_url']) ? $settings['image_url'] : '');

					if (!empty($img_src)) {
						$alt = !empty($settings['alt_text']) ? esc_attr($settings['alt_text']) : esc_attr($product->get_name());
						$link_to = isset($settings['link_to']) ? $settings['link_to'] : 'none';
						$custom_link = isset($settings['custom_link']) ? esc_url($settings['custom_link']) : '';
						$target = !empty($settings['link_target_blank']) ? ' target="_blank" rel="noopener noreferrer"' : '';
						if (!empty($settings['link_rel_nofollow'])) {
							$target = !empty($target) ? ' target="_blank" rel="noopener noreferrer nofollow"' : ' rel="nofollow"';
						}
						$caption_type = isset($settings['caption_type']) ? $settings['caption_type'] : 'none';
						$custom_caption = isset($settings['custom_caption']) ? esc_html($settings['custom_caption']) : '';
						$alignment = isset($styles['alignment']) ? $styles['alignment'] : (isset($settings['alignment']) ? $settings['alignment'] : 'center');
						$align_class = 'text-center';
						if ('left' === $alignment) {
							$align_class = 'text-left';
						} elseif ('right' === $alignment) {
							$align_class = 'text-right';
						}

						echo '<div class="sppcfw-custom-image-wrapper' . $el_class . ' ' . esc_attr($align_class) . '">';
						if ('file' === $link_to) {
							echo '<a href="' . esc_url($img_src) . '"' . $target . ' class="sppcfw-image-link inline-block">';
						} elseif ('custom' === $link_to && !empty($custom_link)) {
							echo '<a href="' . $custom_link . '"' . $target . ' class="sppcfw-image-link inline-block">';
						}

						echo '<img src="' . esc_url($img_src) . '" alt="' . $alt . '" class="sppcfw-custom-image-el inline-block" style="max-width:100%;height:auto;" />';

						if ('file' === $link_to || ('custom' === $link_to && !empty($custom_link))) {
							echo '</a>';
						}

						if ('custom' === $caption_type && !empty($custom_caption)) {
							echo '<figcaption class="sppcfw-image-caption text-xs text-gray-500 mt-1.5">' . $custom_caption . '</figcaption>';
						}
						echo '</div>';
					}
					break;
				case 'variation_swatches':
					if ($product->is_type('variable')) {
						echo '<div class="sppcfw-swatches-wrapper' . $el_class . '">';
						woocommerce_variable_add_to_cart();
						echo '</div>';
					}
					break;
				case 'product_add_to_cart':
					$custom_class = !empty($advanced['custom_class']) ? ' ' . esc_attr($advanced['custom_class']) : '';
					$var_display_type = !empty($settings['variation_display_type']) ? $settings['variation_display_type'] : 'swatches';
					$swatch_shape = !empty($settings['swatch_shape']) ? $settings['swatch_shape'] : 'circle';
					$show_labels = isset($settings['show_attribute_labels']) && false === $settings['show_attribute_labels'] ? ' sppcfw-hide-var-labels' : '';
					$show_reset = empty($settings['show_variation_reset']) ? ' sppcfw-hide-var-reset' : '';
					$cart_btn_text = '';
					$basic = get_option('sppcfw_basic', array());
					if (is_array($basic) && !empty($basic['add_to_cart_button_text'])) {
						$cart_btn_text = $basic['add_to_cart_button_text'];
					} elseif (!empty($settings['button_text'])) {
						$cart_btn_text = $settings['button_text'];
					}

					$var_classes = ' sppcfw-var-display-' . esc_attr($var_display_type) . ' sppcfw-swatch-shape-' . esc_attr($swatch_shape) . $show_labels . $show_reset;

					echo '<div class="sppcfw-add-to-cart-wrapper sppcfw-el-' . $id . $var_classes . $custom_class . '">';

					if ('table' === $var_display_type && $product && $product->is_type('variable')) {
						$available_variations = $product->get_available_variations();
						if (!empty($available_variations)) {
							echo '<div class="sppcfw-variation-table-container sppcfw-mb-4" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px;">';
							echo '<table class="sppcfw-variation-table-grid" style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">';
							echo '<thead style="background:#f9fafb;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">';
							echo '<tr>';
							echo '<th style="padding:10px 12px;">' . esc_html__('Variation', 'single-product-customizer') . '</th>';
							echo '<th style="padding:10px 12px;">' . esc_html__('Price', 'single-product-customizer') . '</th>';
							echo '<th style="padding:10px 12px;">' . esc_html__('Stock', 'single-product-customizer') . '</th>';
							echo '<th style="padding:10px 12px;text-align:center;">' . esc_html__('Select', 'single-product-customizer') . '</th>';
							echo '</tr>';
							echo '</thead>';
							echo '<tbody style="background:#ffffff;">';
							foreach ($available_variations as $idx => $var) {
								$attr_labels = array();
								if (!empty($var['attributes'])) {
									foreach ($var['attributes'] as $attr_k => $attr_v) {
										$clean_slug = str_replace('attribute_', '', $attr_k);
										$term_name = $attr_v;
										if (taxonomy_exists($clean_slug)) {
											$term = get_term_by('slug', $attr_v, $clean_slug);
											if ($term && !is_wp_error($term)) {
												$term_name = $term->name;
											}
										}
										$attr_labels[] = $term_name ? $term_name : $attr_v;
									}
								}
								$var_name = !empty($attr_labels) ? implode(' / ', $attr_labels) : __('Variation', 'single-product-customizer') . ' #' . $var['variation_id'];
								$price_html = !empty($var['price_html']) ? $var['price_html'] : wc_price($var['display_price']);
								$is_in_stock = $var['is_in_stock'];
								$stock_text = $is_in_stock ? __('In Stock', 'single-product-customizer') : __('Out of Stock', 'single-product-customizer');
								$stock_color = $is_in_stock ? '#10b981' : '#ef4444';
								$is_first = (0 === $idx);
								$row_bg = $is_first ? 'background:#faf5ff;' : '';
								$attr_json = esc_attr(wp_json_encode($var['attributes']));

								echo '<tr class="sppcfw-var-grid-row' . ($is_first ? ' is-selected' : '') . '" data-variation-id="' . esc_attr($var['variation_id']) . '" data-attributes="' . $attr_json . '" style="border-bottom:1px solid #f3f4f6;cursor:pointer;' . $row_bg . '">';
								echo '<td style="padding:10px 12px;font-weight:500;color:#111827;">' . esc_html($var_name) . '</td>';
								echo '<td style="padding:10px 12px;font-weight:bold;color:#9333ea;">' . wp_kses_post($price_html) . '</td>';
								echo '<td style="padding:10px 12px;font-weight:500;color:' . esc_attr($stock_color) . ';">' . esc_html($stock_text) . '</td>';
								echo '<td style="padding:10px 12px;text-align:center;"><input type="radio" name="sppcfw_var_radio_' . esc_attr($id) . '" class="sppcfw-var-radio" value="' . esc_attr($var['variation_id']) . '" ' . checked($is_first, true, false) . ' style="accent-color:#9333ea;cursor:pointer;" /></td>';
								echo '</tr>';
							}
							echo '</tbody>';
							echo '</table>';
							echo '</div>';

							// Script to sync table selection with WooCommerce variations form
							echo '<script>
							(function() {
								function initVarTableSync() {
									var wrapper = document.querySelector(".sppcfw-el-' . esc_js($id) . '");
									if (!wrapper) return;
									var form = wrapper.querySelector("form.variations_form");
									var rows = wrapper.querySelectorAll(".sppcfw-var-grid-row");
									if (!form || !rows.length) return;

									function selectRow(row) {
										rows.forEach(function(r) {
											r.classList.remove("is-selected");
											r.style.backgroundColor = "";
											var rad = r.querySelector("input.sppcfw-var-radio");
											if (rad) rad.checked = false;
										});
										row.classList.add("is-selected");
										row.style.backgroundColor = "#faf5ff";
										var radio = row.querySelector("input.sppcfw-var-radio");
										if (radio) radio.checked = true;

										var attrData = row.getAttribute("data-attributes");
										if (attrData) {
											try {
												var attrs = JSON.parse(attrData);
												for (var k in attrs) {
													var select = form.querySelector(\'select[name="\' + k + \'"]\');
													if (select) {
														select.value = attrs[k];
														if (typeof jQuery !== "undefined") {
															jQuery(select).trigger("change");
														} else {
															select.dispatchEvent(new Event("change", { bubbles: true }));
														}
													}
												}
											} catch(e) {}
										}
									}

									rows.forEach(function(row) {
										row.addEventListener("click", function(e) {
											selectRow(row);
										});
									});

									// Initial trigger for first row
									var first = rows[0];
									if (first) {
										setTimeout(function() { selectRow(first); }, 150);
									}
								}
								if (document.readyState === "loading") {
									document.addEventListener("DOMContentLoaded", initVarTableSync);
								} else {
									initVarTableSync();
								}
							})();
							</script>';
						}
					}

					ob_start();
					woocommerce_template_single_add_to_cart();
					$cart_html = ob_get_clean();

					if (!empty($cart_btn_text)) {
						// Ensure button text is updated to configured "Change add to cart button text"
						$cart_html = preg_replace_callback('/(<button[^>]*class=["\'][^"\']*single_add_to_cart_button[^"\']*["\'][^>]*>)(.*?)(<\/button>)/is', function ($matches) use ($cart_btn_text) {
							return $matches[1] . esc_html($cart_btn_text) . $matches[3];
						}, $cart_html);
					}

					echo $cart_html;
					echo '</div>';
					break;
				case 'product_rating':
					$rating_val = $product ? (float) $product->get_average_rating() : 5.0;
					if ($rating_val <= 0) {
						$rating_val = 5.0;
					}
					$rating_count = $product ? (int) $product->get_rating_count() : 1;
					if ($rating_count <= 0) {
						$rating_count = 1;
					}
					$width_percent = ($rating_val / 5) * 100;
					$star_color = $this->sppcfw_get_device_prop($styles, 'star_color', 'desktop', '');
					if (empty($star_color)) {
						$star_color = $this->sppcfw_get_device_prop($styles, 'text_color', 'desktop', '#f59e0b');
					}
					$empty_star_color = $this->sppcfw_get_device_prop($styles, 'empty_star_color', 'desktop', '#d1d5db');
					$star_size = $this->sppcfw_get_device_prop($styles, 'star_size', 'desktop', '18px');
					$review_count_color = $this->sppcfw_get_device_prop($styles, 'review_count_color', 'desktop', '#6b7280');
					$review_font_size = $this->sppcfw_get_device_prop($styles, 'review_font_size', 'desktop', '14px');
					$review_font_weight = $this->sppcfw_get_device_prop($styles, 'review_font_weight', 'desktop', '400');
					$gap = $this->sppcfw_get_device_prop($styles, 'gap', 'desktop', '8px');
					$alignment = $this->sppcfw_get_device_prop($styles, 'alignment', 'desktop', 'left');
					$justify_val = ('center' === $alignment) ? 'center' : (('right' === $alignment) ? 'flex-end' : 'flex-start');

					echo '<div class="sppcfw-rating-wrapper' . $el_class . '">';
					echo '<div class="sppcfw-product-rating-container" style="display:flex; align-items:center; justify-content:' . esc_attr($justify_val) . '; gap:' . esc_attr($gap) . ';">';
					echo '<div class="sppcfw-stars-box" style="position:relative; display:inline-flex; align-items:center; line-height:1; letter-spacing:2px; font-size:' . esc_attr($star_size) . '; user-select:none;">';
					echo '<span class="sppcfw-stars-empty" style="color:' . esc_attr($empty_star_color) . ';">★★★★★</span>';
					echo '<span class="sppcfw-stars-filled" style="position:absolute; top:0; left:0; overflow:hidden; white-space:nowrap; width:' . esc_attr($width_percent) . '%; color:' . esc_attr($star_color) . ';">★★★★★</span>';
					echo '</div>';
					echo '<a href="#reviews" class="sppcfw-review-link woocommerce-review-link" style="color:' . esc_attr($review_count_color) . '; font-size:' . esc_attr($review_font_size) . '; font-weight:' . esc_attr($review_font_weight) . '; text-decoration:none; line-height:1;">';
					echo '(' . esc_html($rating_count) . ' ' . esc_html(_n('reviews', 'reviews', $rating_count, 'woocommerce')) . ')';
					echo '</a>';
					echo '</div>';
					echo '</div>';
					break;
				case 'product_short_desc':
					echo '<div class="sppcfw-short-desc-wrapper' . $el_class . '">';
					woocommerce_template_single_excerpt();
					echo '</div>';
					break;
				case 'product_description':
					echo '<div class="sppcfw-tabs-wrapper' . $el_class . '">';
					woocommerce_output_product_data_tabs();
					echo '</div>';
					break;
				case 'product_meta':
					echo '<div class="sppcfw-meta-wrapper' . $el_class . '">';
					woocommerce_template_single_meta();
					echo '</div>';
					break;
				case 'product_meta_item':
					$meta_key = isset($el['metaKey']) ? $el['metaKey'] : '';
					if ($meta_key) {
						$label = isset($el['label']) ? esc_html($el['label']) : $meta_key;
						$val = get_post_meta($product->get_id(), $meta_key, true);
						if (empty($val) && 0 === strpos($meta_key, '_')) {
							// Check WC getter methods if standard meta empty
							if ('_sku' === $meta_key) {
								$val = $product->get_sku();
							} elseif ('_stock_status' === $meta_key) {
								$val = $product->get_stock_status();
							} elseif ('_weight' === $meta_key) {
								$val = $product->get_weight();
							} elseif ('_dimensions' === $meta_key) {
								$val = function_exists('wc_format_dimensions') ? wc_format_dimensions($product->get_dimensions(false)) : '';
							}
						}
						if (!empty($val)) {
							echo '<div class="sppcfw-custom-meta-field' . $el_class . ' p-2 bg-gray-50 border rounded my-2">';
							echo '<strong>' . esc_html($label) . ': </strong>';
							echo '<span>' . esc_html(is_array($val) ? implode(', ', $val) : $val) . '</span>';
							echo '</div>';
						}
					}
					break;
				case 'custom_message':
					echo '<div class="sppcfw-custom-message-banner' . $el_class . ' p-3 bg-indigo-100 text-indigo-800 rounded font-semibold my-2">';
					echo esc_html__('Special Offer: Free Shipping on all orders!', 'single-product-customizer');
					echo '</div>';
					break;
				case 'plus_minus_buttons':
					echo '<div class="sppcfw-stepper-widget' . $el_class . ' my-2">';
					woocommerce_quantity_input(array('input_value' => 1));
					echo '</div>';
					break;
				case 'related_products':
				case 'upsell_products':
					$is_related = ('related_products' === $type);
					$settings = isset($el['settings']) ? $el['settings'] : array();
					$columns = !empty($settings['columns']) ? intval($settings['columns']) : 4;
					if ($columns < 1 || $columns > 6) {
						$columns = 4;
					}
					$posts_per_page = !empty($settings['posts_per_page']) ? intval($settings['posts_per_page']) : $columns;
					if (!empty($settings['posts_per_page_tablet'])) {
						$posts_per_page = max($posts_per_page, intval($settings['posts_per_page_tablet']));
					}
					if (!empty($settings['posts_per_page_mobile'])) {
						$posts_per_page = max($posts_per_page, intval($settings['posts_per_page_mobile']));
					}
					$default_title = $is_related ? __('Related products', 'woocommerce') : __('You may also like…', 'woocommerce');
					$title = isset($settings['title']) ? $settings['title'] : $default_title;

					$product_id = $product->get_id();
					if ($is_related) {
						$item_ids = wc_get_related_products($product_id, $posts_per_page, $product->get_upsell_ids());
					} else {
						$item_ids = $product->get_upsell_ids();
						if (!empty($item_ids) && count($item_ids) > $posts_per_page) {
							$item_ids = array_slice($item_ids, 0, $posts_per_page);
						}
					}

					// Fallback query if no related products configured
					if (empty($item_ids)) {
						$cat_ids = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'ids'));
						$query_args = array(
							'post_type'      => 'product',
							'post_status'    => 'publish',
							'posts_per_page' => $posts_per_page,
							'post__not_in'   => array($product_id),
							'fields'         => 'ids',
							'orderby'        => !empty($settings['orderby']) ? sanitize_key($settings['orderby']) : 'rand',
						);
						if (!empty($cat_ids) && !is_wp_error($cat_ids)) {
							$query_args['tax_query'] = array(
								array(
									'taxonomy' => 'product_cat',
									'field'    => 'term_id',
									'terms'    => $cat_ids,
								),
							);
						}
						$fallback_query = new WP_Query($query_args);
						$item_ids = $fallback_query->posts;
					}

					$wrapper_class = $is_related ? 'sppcfw-related-wrapper' : 'sppcfw-upsell-wrapper';

					echo '<div class="' . esc_attr($wrapper_class) . $el_class . ' sppcfw-products-block" data-cols="' . esc_attr($columns) . '">';
					if (!empty($title)) {
						echo '<h2 class="sppcfw-related-heading">' . esc_html($title) . '</h2>';
					}

					if (!empty($item_ids)) {
						echo '<div class="sppcfw-products-grid sppcfw-cols-' . esc_attr($columns) . '">';
						foreach ($item_ids as $item_id) {
							$item_prod = wc_get_product($item_id);
							if (!$item_prod || !$item_prod->is_visible()) {
								continue;
							}
							$item_url = $item_prod->get_permalink();
							$item_name = $item_prod->get_name();
							$item_img_id = $item_prod->get_image_id();
							$item_img_url = $item_img_id ? wp_get_attachment_image_url($item_img_id, 'woocommerce_thumbnail') : wc_placeholder_img_src('woocommerce_thumbnail');
							$item_price_html = $item_prod->get_price_html();
							$item_is_sale = $item_prod->is_on_sale();

							echo '<div class="sppcfw-card-product">';
							echo '<a href="' . esc_url($item_url) . '" class="sppcfw-card-thumb-link">';
							if ($item_is_sale) {
								echo '<span class="sppcfw-card-sale-badge">' . esc_html__('Sale!', 'woocommerce') . '</span>';
							}
							echo '<img src="' . esc_url($item_img_url) . '" alt="' . esc_attr($item_name) . '" loading="lazy" />';
							echo '</a>';

							echo '<div class="sppcfw-card-info">';
							echo '<a href="' . esc_url($item_url) . '" class="sppcfw-card-title">' . esc_html($item_name) . '</a>';
							if (!empty($item_price_html)) {
								echo '<div class="sppcfw-card-price">' . wp_kses_post($item_price_html) . '</div>';
							}
							echo '</div>';

							// Add to cart / View product button
							$btn_text = $item_prod->add_to_cart_text();
							$btn_url = $item_prod->add_to_cart_url();
							$btn_class = 'sppcfw-card-button';
							if ($item_prod->is_type('simple') && $item_prod->is_purchasable() && $item_prod->is_in_stock()) {
								$btn_class .= ' ajax_add_to_cart add_to_cart_button';
								echo '<a href="' . esc_url($btn_url) . '" data-quantity="1" data-product_id="' . esc_attr($item_id) . '" data-product_sku="' . esc_attr($item_prod->get_sku()) . '" class="' . esc_attr($btn_class) . '" rel="nofollow">' . esc_html($btn_text) . '</a>';
							} else {
								echo '<a href="' . esc_url($item_url) . '" class="' . esc_attr($btn_class) . '">' . esc_html($btn_text) . '</a>';
							}

							echo '</div>'; // close sppcfw-card-product
						}
						echo '</div>'; // close sppcfw-products-grid
					}

					echo '</div>'; // close wrapper
					break;
				default:
					break;
			}
		}
	}

	new SPPCFW_Builder_Renderer();
}
