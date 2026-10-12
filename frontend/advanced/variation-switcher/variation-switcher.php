<?php
if (!defined('ABSPATH')) {
    exit;
}

if( !class_exists("Sppcfw_Variation_Switcher")){
    
    class Sppcfw_Variation_Switcher{

        public function __construct(){
            add_action("wp_enqueue_scripts",[$this, "sppcfw_variation_switcher_assets"]);
            add_filter("woocommerce_dropdown_variation_attribute_options_html",[$this,"sppcfw_display_variation_switcher"],10,2);
        }

        public function sppcfw_variation_switcher_assets(){
            if($this->is_enabled()===1){
                wp_enqueue_script(
                    'sppcfw-variation-switcher-js',
                    plugin_dir_url(__FILE__).'variation-switcher.js',
                    array( 'jquery'),
                    SPPCFW_VERSION,
                    true
                );

                wp_enqueue_style(
                    'variation-switcher-css',
                    plugin_dir_url(__FILE__).'variation-switcher.css',
                    null,
                    SPPCFW_VERSION,
                    'all'
                );

                // ... rest of your CSS enqueues remain the same
            }           
        }

        public function is_enabled(){
            // 1. Check if Single Product Customizer builder template is active for this product or preview
            $product_id = get_the_ID();
            if (!$product_id && isset($_GET['product_id'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $product_id = absint($_GET['product_id']); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            }
            if (!$product_id && isset($GLOBALS['product']) && is_object($GLOBALS['product'])) {
                $product_id = $GLOBALS['product']->get_id();
            }

            if ($product_id) {
                $matched = null;
                $templates = get_option('sppcfw_builder_templates', array());

                if (isset($_GET['sppcfw_preview']) && isset($_GET['template_id']) && current_user_can('manage_options')) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                    $preview_id = sanitize_text_field(wp_unslash($_GET['template_id'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                    if (isset($templates[$preview_id]) && !empty($templates[$preview_id]['layout'])) {
                        $matched = $templates[$preview_id];
                    }
                }

                if (empty($matched)) {
                    if (empty($templates)) {
                        $legacy = get_option('sppcfw_builder_template', array());
                        if (!empty($legacy) && !empty($legacy['layout'])) {
                            $matched = $legacy;
                        }
                    } else {
                        $product_cats = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'ids'));
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
                                $matched = $tpl;
                                break;
                            }

                            if ('product' === $scope) {
                                $selected_prods = isset($conditions['product_ids']) ? (array) $conditions['product_ids'] : array();
                                if (in_array($product_id, $selected_prods, true) || in_array((string) $product_id, $selected_prods, true)) {
                                    $matched = $tpl;
                                    break;
                                }
                            } elseif ('category' === $scope) {
                                $selected_cats = isset($conditions['category_ids']) ? (array) $conditions['category_ids'] : array();
                                if (!empty(array_intersect($selected_cats, $product_cats))) {
                                    $category_match = $tpl;
                                }
                            } elseif ('entire' === $scope) {
                                $entire_match = $tpl;
                            }
                        }

                        if (empty($matched)) {
                            if (!empty($category_match)) {
                                $matched = $category_match;
                            } elseif (!empty($entire_match)) {
                                $matched = $entire_match;
                            }
                        }
                    }
                }

                if (!empty($matched) && !empty($matched['layout'])) {
                    $display_type = $this->find_variation_display_type_in_layout($matched['layout']);
                    if ($display_type !== null) {
                        return ('swatches' === $display_type) ? 1 : 0;
                    }
                }
            }

            // 2. Global setting fallback
            $enabled=0;
            if(isset(SPPCFW_ADVANCED['enable_variation_switcher'])){
                if(SPPCFW_ADVANCED['enable_variation_switcher']==='on'){
                    $enabled=1;
                }
            }
            return $enabled;
        }

        private function find_variation_display_type_in_layout($elements) {
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
                    $found = $this->find_variation_display_type_in_layout($el['children']);
                    if ($found !== null) {
                        return $found;
                    }
                }
            }
            return null;
        }

        public function sppcfw_get_attribute_type($attribute_name){
            // Check if it's a taxonomy attribute
            if (taxonomy_exists('pa_' . $attribute_name)) {
                global $wpdb;
                $table_name = $wpdb->prefix."woocommerce_attribute_taxonomies";
                // phpcs:ignore
                $result = $wpdb->get_results($wpdb->prepare("SELECT attribute_type FROM $table_name where attribute_name=%s", $attribute_name));
                
                if($result && count($result)>0 && isset($result[0]->attribute_type)){
                    return $result[0]->attribute_type;
                }
            }
            
            // For custom attributes, return default 'button' type or get from product meta
            return 'button'; // Default type for custom attributes
        }

        public function sppcfw_get_attribute_type_meta_value($slug, $taxonomy, $product_id = null){
            // For taxonomy attributes
            if (taxonomy_exists($taxonomy)) {
                $term = get_term_by('slug', $slug, $taxonomy, 'ARRAY_A');
                if(is_array($term) && isset($term["term_id"])){      
                    return get_term_meta($term["term_id"], 'webcfwc_variation_meta', true);
                }
            }
            
            // For custom attributes, try to get from product meta
            if ($product_id) {
                // You might need to adjust this based on how you store custom attribute meta
                $product = wc_get_product($product_id);
                if ($product) {
                    $attributes = $product->get_attributes();
                    $taxonomy = wc_attribute_taxonomy_name($taxonomy);
                    
                    if (isset($attributes[$taxonomy])) {
                        $attribute = $attributes[$taxonomy];
                        if ($attribute && !$attribute->is_taxonomy()) {
                            // Custom attribute - get options
                            $options = $attribute->get_options();
                            foreach ($options as $option) {
                                if (sanitize_title($option) === $slug) {
                                    // Return option name as label for custom attributes
                                    return $option;
                                }
                            }
                        }
                    }
                }
            }
            
            return '';
        }

        public function sppcfw_display_variation_switcher($html, $args)
        {
            if ($this->is_enabled() === 1) {
                $options = $args['options'];
                $product = $args['product'];
                $attribute = $args['attribute']; // pa_size, pa_color, or custom attribute slug
                
                // Get product ID for custom attribute handling
                $product_id = $product ? $product->get_id() : null;

                // Check if options array is empty
                if (empty($options) && $product && taxonomy_exists($attribute)) {
                    $terms = wc_get_product_terms($product->get_id(), $attribute, array('fields' => 'slugs'));
                    $options = $terms;
                }
                
                // Handle custom attributes
                if (empty($options) && $product && !taxonomy_exists($attribute)) {
                    $attributes = $product->get_attributes();
                    if (isset($attributes[$attribute])) {
                        $attr_obj = $attributes[$attribute];
                        if ($attr_obj && !$attr_obj->is_taxonomy()) {
                            $options = $attr_obj->get_options();
                        }
                    }
                }

                // Return original HTML if no options
                if (empty($options)) {
                    return $html;
                }

                // Determine if this is a taxonomy attribute
                $is_taxonomy = taxonomy_exists($attribute);
                $attribute_name = $is_taxonomy ? ltrim($attribute, 'pa_') : $attribute;
                $attributes_type = $this->sppcfw_get_attribute_type($attribute_name);

                $attribute_name_field = 'attribute_' . sanitize_title($attribute);
                $select = '<select id="' . esc_attr($attribute) . '" class="vairation_select" data-attribute_name="' . esc_attr($attribute_name_field) . '" name="' . esc_attr($attribute_name_field) . '">';
                $select .= '<option value="">' . esc_html__("Choose one", "single-product-customizer") . '</option>';
                $button = '';

                $color_map = array(
                    'black'   => '#111827',
                    'white'   => '#ffffff',
                    'red'     => '#ef4444',
                    'blue'    => '#3b82f6',
                    'green'   => '#10b981',
                    'yellow'  => '#f59e0b',
                    'purple'  => '#9333ea',
                    'pink'    => '#ec4899',
                    'orange'  => '#f97316',
                    'gray'    => '#6b7280',
                    'grey'    => '#6b7280',
                    'navy'    => '#1e3a8a',
                    'brown'   => '#78350f',
                    'gold'    => '#eab308',
                    'silver'  => '#9ca3af',
                    'teal'    => '#14b8a6',
                    'olive'   => '#84cc16',
                    'maroon'  => '#881337',
                    'cyan'    => '#06b6d4',
                    'beige'   => '#f5f5dc',
                );

                foreach ($options as $option) {
                    // Get option slug and label
                    $option_slug = '';
                    $option_label = '';
                    
                    if ($is_taxonomy) {
                        // Taxonomy attribute
                        $term = is_object($option) ? $option : get_term_by('slug', $option, $attribute);
                        $option_slug = is_object($term) ? $term->slug : $option;
                        $option_label = is_object($term) ? $term->name : $option;
                    } else {
                        // Custom attribute: use raw option value to match WooCommerce default
                        $option_slug = $option;
                        $option_label = $option;
                    }
                    
                    if (empty($option_slug)) continue;

                    $select .= '<option value="' . esc_attr($option_slug) . '">' . esc_html($option_label) . '</option>';
                    
                    // Get meta value for the attribute type
                    $option_meta = $this->sppcfw_get_attribute_type_meta_value($option_slug, $attribute, $product_id);

                    $curr_type = $attributes_type;
                    $is_color_attr = (stripos($attribute, 'color') !== false || stripos($attribute_name, 'color') !== false);
                    if ($curr_type === 'color' || $is_color_attr) {
                        if (empty($option_meta)) {
                            $slug_clean = strtolower(sanitize_title($option_slug));
                            if (isset($color_map[$slug_clean])) {
                                $option_meta = $color_map[$slug_clean];
                            } elseif (preg_match('/^#[a-f0-9]{3,6}$/i', $option_slug)) {
                                $option_meta = $option_slug;
                            }
                        }
                        if (!empty($option_meta)) {
                            $curr_type = 'color';
                        }
                    }

                    switch ($curr_type) {
                        case 'color':
                            $bg_style = !empty($option_meta) ? ' style="background-color:' . esc_attr($option_meta) . ';"' : '';
                            $button .= '<button data-val="' . esc_attr($option_slug) . '" class="webfwc_variation_button color" data-bg-color="' . esc_attr($option_meta) . '"' . $bg_style . ' type="button" data-attr="' . esc_attr($attribute) . '" title="' . esc_attr($option_label) . '"></button>';
                            break;

                        case 'icon':
                            $button .= '<button data-val="' . esc_attr($option_slug) . '" class="webfwc_variation_button icon" type="button" data-attr="' . esc_attr($attribute) . '" title="' . esc_attr($option_label) . '">
                                <i class="' . esc_attr($option_meta) . '"></i>
                            </button>';
                            break;
                        case 'image':
                            $img = '';
                            if ($option_meta > 0) {
                                $img = wp_get_attachment_image($option_meta, 'thumbnail');
                            }
                            $button .= '<button data-val="' . esc_attr($option_slug) . '" class="webfwc_variation_button image" type="button" data-attr="' . esc_attr($attribute) . '" title="' . esc_attr($option_label) . '">
                                ' . $img . '
                            </button>';
                            break;
                        default:
                            $button .= '<button data-val="' . esc_attr($option_slug) . '" class="webfwc_variation_button button" type="button" data-attr="' . esc_attr($attribute) . '">' . esc_html($option_label) . '</button>';
                    }
                }

                $select .= '</select>';

                return '<div class="cu_button_el" data-attribute="' . esc_attr($attribute) . '" data-is-taxonomy="' . ($is_taxonomy ? '1' : '0') . '">' . $select . $button . '</div>';
            }

            return $html;
        }
    }

    new Sppcfw_Variation_Switcher();
}