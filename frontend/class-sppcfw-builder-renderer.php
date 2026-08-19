<?php
/**
 * Single Product Page Builder Frontend Renderer
 *
 * @package Single_Product_Customizer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'SPPCFW_Builder_Renderer' ) ) {

	class SPPCFW_Builder_Renderer {

		/**
		 * Constructor.
		 */
		public function __construct() {
			add_action( 'wp', array( $this, 'sppcfw_maybe_init_frontend_override' ) );
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
		public function sppcfw_maybe_init_frontend_override() {
			if ( is_admin() || ! is_singular( 'product' ) ) {
				return;
			}

			$matched = $this->sppcfw_get_matching_template( get_the_ID() );

			if ( empty( $matched ) || empty( $matched['layout'] ) ) {
				return;
			}

			$this->matched_template = $matched;

			add_action( 'wp_enqueue_scripts', array( $this, 'sppcfw_enqueue_frontend_builder_styles' ) );

			// Hook into WooCommerce single product summary to render builder layout
			add_action( 'woocommerce_before_single_product_summary', array( $this, 'sppcfw_render_builder_template' ), 5 );
			// Remove default WooCommerce single product hooks to avoid duplication when custom template is active
			remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_title', 5 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_price', 10 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );
			remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_sharing', 50 );
			remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_product_data_tabs', 10 );
			remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_upsell_display', 15 );
			remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20 );
		}

		/**
		 * Find best matching template from registry for product ID.
		 *
		 * @param int $product_id Product ID.
		 * @return array Template array.
		 */
		private function sppcfw_get_matching_template( $product_id ) {
			$templates = get_option( 'sppcfw_builder_templates', array() );

			if ( empty( $templates ) ) {
				$legacy = get_option( 'sppcfw_builder_template', array() );
				if ( ! empty( $legacy ) && ! empty( $legacy['layout'] ) ) {
					return $legacy;
				}
				return array();
			}

			$product_cats = wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'ids' ) );

			$product_match  = array();
			$category_match = array();
			$entire_match   = array();

			foreach ( $templates as $tpl ) {
				if ( empty( $tpl['layout'] ) || ( isset( $tpl['status'] ) && 'draft' === $tpl['status'] ) ) {
					continue;
				}

				$conditions = isset( $tpl['conditions'] ) ? $tpl['conditions'] : array();
				$scope      = isset( $conditions['scope'] ) ? $conditions['scope'] : 'entire';

				if ( 'product' === $scope ) {
					$selected_prods = isset( $conditions['product_ids'] ) ? (array) $conditions['product_ids'] : array();
					if ( in_array( $product_id, $selected_prods, true ) ) {
						$product_match = $tpl;
						break;
					}
				} elseif ( 'category' === $scope ) {
					$selected_cats = isset( $conditions['category_ids'] ) ? (array) $conditions['category_ids'] : array();
					if ( ! empty( array_intersect( $selected_cats, $product_cats ) ) ) {
						$category_match = $tpl;
					}
				} elseif ( 'entire' === $scope ) {
					$entire_match = $tpl;
				}
			}

			if ( ! empty( $product_match ) ) {
				return $product_match;
			}
			if ( ! empty( $category_match ) ) {
				return $category_match;
			}
			if ( ! empty( $entire_match ) ) {
				return $entire_match;
			}

			return array();
		}

		/**
		 * Enqueue frontend dynamic styles for builder widgets & containers.
		 *
		 * @return void
		 */
		public function sppcfw_enqueue_frontend_builder_styles() {
			$layout = isset( $this->matched_template['layout'] ) ? $this->matched_template['layout'] : array();

			$custom_css = '
				.sppcfw-builder-section { width: 100%; box-sizing: border-box; }
				.sppcfw-container-boxed { margin-left: auto !important; margin-right: auto !important; }
				.sppcfw-container-full { width: 100% !important; }
				.sppcfw-flex-row { display: flex; flex-wrap: wrap; }
				.sppcfw-column { box-sizing: border-box; }
			';

			if ( ! empty( $layout ) && is_array( $layout ) ) {
				$custom_css .= $this->sppcfw_generate_recursive_styles( $layout );
			}

			wp_register_style( 'sppcfw-builder-frontend-inline', false );
			wp_enqueue_style( 'sppcfw-builder-frontend-inline' );
			wp_add_inline_style( 'sppcfw-builder-frontend-inline', $custom_css );
		}

		/**
		 * Generate dynamic CSS recursively.
		 *
		 * @param array $elements Elements array.
		 * @return string CSS string.
		 */
		private function sppcfw_generate_recursive_styles( $elements ) {
			$css = '';
			foreach ( $elements as $el ) {
				$id     = isset( $el['id'] ) ? esc_attr( $el['id'] ) : '';
				$styles = isset( $el['styles'] ) ? $el['styles'] : array();

				if ( $id && ! empty( $styles ) ) {
					$css .= ".sppcfw-el-{$id} {";
					if ( ! empty( $styles['text_color'] ) ) {
						$css .= 'color: ' . esc_attr( $styles['text_color'] ) . ' !important;';
					}
					if ( ! empty( $styles['bg_color'] ) ) {
						$css .= 'background-color: ' . esc_attr( $styles['bg_color'] ) . ' !important;';
					}
					if ( ! empty( $styles['font_size'] ) ) {
						$css .= 'font-size: ' . esc_attr( $styles['font_size'] ) . ' !important;';
					}
					if ( ! empty( $styles['font_family'] ) ) {
						$css .= 'font-family: ' . esc_attr( $styles['font_family'] ) . ', sans-serif !important;';
					}
					if ( ! empty( $styles['border_color'] ) ) {
						$css .= 'border-color: ' . esc_attr( $styles['border_color'] ) . ' !important;';
					}
					if ( ! empty( $styles['border_width'] ) ) {
						$css .= 'border-style: solid; border-width: ' . esc_attr( $styles['border_width'] ) . ' !important;';
					}
					if ( ! empty( $styles['border_radius'] ) ) {
						$css .= 'border-radius: ' . esc_attr( $styles['border_radius'] ) . ' !important;';
					}
					if ( ! empty( $styles['padding_top'] ) ) {
						$css .= 'padding-top: ' . esc_attr( $styles['padding_top'] ) . ' !important;';
						$css .= 'padding-bottom: ' . esc_attr( $styles['padding_top'] ) . ' !important;';
					}
					if ( ! empty( $styles['margin_bottom'] ) ) {
						$css .= 'margin-bottom: ' . esc_attr( $styles['margin_bottom'] ) . ' !important;';
					}
					$css .= '}';
				}

				if ( ! empty( $el['children'] ) && is_array( $el['children'] ) ) {
					$css .= $this->sppcfw_generate_recursive_styles( $el['children'] );
				}
			}
			return $css;
		}

		/**
		 * Render frontend builder layout output.
		 *
		 * @return void
		 */
		public function sppcfw_render_builder_template() {
			$elements = isset( $this->matched_template['layout'] ) ? $this->matched_template['layout'] : array();

			if ( empty( $elements ) ) {
				return;
			}

			echo '<div class="sppcfw-builder-frontend-wrapper">';
			$this->sppcfw_render_elements_recursive( $elements );
			echo '</div>';
		}

		/**
		 * Render elements tree recursively.
		 *
		 * @param array $elements List of elements.
		 * @return void
		 */
		private function sppcfw_render_elements_recursive( $elements ) {
			if ( empty( $elements ) || ! is_array( $elements ) ) {
				return;
			}

			foreach ( $elements as $el ) {
				$type       = isset( $el['type'] ) ? $el['type'] : '';
				$id         = isset( $el['id'] ) ? esc_attr( $el['id'] ) : '';
				$settings   = isset( $el['settings'] ) ? $el['settings'] : array();
				$advanced   = isset( $el['advanced'] ) ? $el['advanced'] : array();
				$css_class  = ! empty( $advanced['custom_class'] ) ? esc_attr( $advanced['custom_class'] ) : '';

				if ( 'container' === $type ) {
					$width_mode  = isset( $settings['width_mode'] ) && 'full' === $settings['width_mode'] ? 'full' : 'boxed';
					$boxed_width = isset( $settings['boxed_width'] ) ? esc_attr( $settings['boxed_width'] ) : '1140px';
					$gap         = isset( $settings['gap'] ) ? esc_attr( $settings['gap'] ) : '16px';
					$max_w_style = 'boxed' === $width_mode ? "max-width: {$boxed_width}; margin: 0 auto 24px auto;" : 'width: 100%; margin-bottom: 24px;';

					echo '<div class="sppcfw-builder-section sppcfw-container-' . esc_attr( $width_mode ) . ' sppcfw-el-' . $id . ' ' . $css_class . '" style="' . $max_w_style . '">';
					echo '<div class="sppcfw-flex-row" style="display: flex; flex-wrap: wrap; gap: ' . $gap . ';">';
					if ( ! empty( $el['children'] ) ) {
						$this->render_elements_recursive( $el['children'] );
					}
					echo '</div>';
					echo '</div>';
				} elseif ( 'column' === $type ) {
					$flex_width = isset( $settings['flex_width'] ) ? esc_attr( $settings['flex_width'] ) : '100%';
					echo '<div class="sppcfw-column sppcfw-el-' . $id . ' ' . $css_class . '" style="flex: 1 1 calc(' . $flex_width . ' - 16px); min-width: 250px;">';
					if ( ! empty( $el['children'] ) ) {
						$this->render_elements_recursive( $el['children'] );
					}
					echo '</div>';
				} else {
					// Render Widget
					echo '<div class="sppcfw-widget-item sppcfw-el-' . $id . ' ' . $css_class . '">';
					$this->render_single_widget( $el );
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
		private function render_single_widget( $el ) {
			global $product;

			if ( ! $product ) {
				$product = wc_get_product( get_the_ID() );
			}

			if ( ! $product ) {
				return;
			}

			$type = isset( $el['type'] ) ? $el['type'] : '';

			switch ( $type ) {
				case 'product_title':
					woocommerce_template_single_title();
					break;
				case 'product_price':
					woocommerce_template_single_price();
					break;
				case 'product_gallery':
					woocommerce_show_product_images();
					break;
				case 'product_add_to_cart':
					woocommerce_template_single_add_to_cart();
					break;
				case 'product_rating':
					woocommerce_template_single_rating();
					break;
				case 'product_short_desc':
					woocommerce_template_single_excerpt();
					break;
				case 'product_description':
					woocommerce_output_product_data_tabs();
					break;
				case 'product_meta':
					woocommerce_template_single_meta();
					break;
				case 'product_meta_item':
					$meta_key = isset( $el['metaKey'] ) ? $el['metaKey'] : '';
					if ( $meta_key ) {
						$label = isset( $el['label'] ) ? esc_html( $el['label'] ) : $meta_key;
						$val   = get_post_meta( $product->get_id(), $meta_key, true );
						if ( empty( $val ) && 0 === strpos( $meta_key, '_' ) ) {
							// Check WC getter methods if standard meta empty
							if ( '_sku' === $meta_key ) {
								$val = $product->get_sku();
							} elseif ( '_stock_status' === $meta_key ) {
								$val = $product->get_stock_status();
							} elseif ( '_weight' === $meta_key ) {
								$val = $product->get_weight();
							} elseif ( '_dimensions' === $meta_key ) {
								$val = function_exists( 'wc_format_dimensions' ) ? wc_format_dimensions( $product->get_dimensions( false ) ) : '';
							}
						}
						if ( ! empty( $val ) ) {
							echo '<div class="sppcfw-custom-meta-field p-2 bg-gray-50 border rounded my-2">';
							echo '<strong>' . esc_html( $label ) . ': </strong>';
							echo '<span>' . esc_html( is_array( $val ) ? implode( ', ', $val ) : $val ) . '</span>';
							echo '</div>';
						}
					}
					break;
				case 'custom_message':
					echo '<div class="sppcfw-custom-message-banner p-3 bg-indigo-100 text-indigo-800 rounded font-semibold my-2">';
					echo esc_html__( 'Special Offer: Free Shipping on all orders!', 'single-product-customizer' );
					echo '</div>';
					break;
				case 'plus_minus_buttons':
					echo '<div class="sppcfw-stepper-widget my-2">';
					woocommerce_quantity_input( array( 'input_value' => 1 ) );
					echo '</div>';
					break;
				case 'related_products':
					woocommerce_output_related_products();
					break;
				case 'upsell_products':
					woocommerce_upsell_display();
					break;
				default:
					break;
			}
		}
	}

	new SPPCFW_Builder_Renderer();
}
