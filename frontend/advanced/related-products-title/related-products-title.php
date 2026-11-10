<?php 
if (!defined('ABSPATH')) {
    exit;
}

if( ! class_exists('Sppcfw_Frontend_Related_Product_Title')){
    class Sppcfw_Frontend_Related_Product_Title{

        public function __construct(){
            add_filter("woocommerce_product_related_products_heading",[$this, "sppcfw_display_related_products_title"], 999, 1);
            // Block themes: the heading lives inside the woocommerce/related-products block, not in the classic template filter.
            add_filter('render_block', [$this, 'sppcfw_filter_related_products_block_heading'], 20, 2);
        }
    
        function sppcfw_display_related_products_title($related_prducts_title){

            if($this->is_enabled()===1){
                $sppcfw_product_title=$this->sppcfw_get_related_products_title();
                if(!empty($sppcfw_product_title)){
                    $related_prducts_title=$sppcfw_product_title;
                }
            }
            
            return $related_prducts_title;
        }

        public function sppcfw_filter_related_products_block_heading($block_content, $block){
            if(empty($block['blockName']) || '' === $block_content || !function_exists('is_product') || !is_product()){
                return $block_content;
            }
            $name = $block['blockName'];
            // Block themes put the section heading in a core/heading block next to the woocommerce/related-products block.
            if('core/heading' !== $name && 'woocommerce/related-products' !== $name){
                return $block_content;
            }
            $title = $this->sppcfw_get_related_products_title();
            if('' === $title){
                return $block_content;
            }
            $default_labels = array_unique(array(
                'Related products',
                __('Related products', 'woocommerce'),
                __('Related products', 'single-product-customizer'),
            ));
            return preg_replace_callback('/(<h[1-6]\b[^>]*>)(.*?)(<\/h[1-6]>)/is', function($m) use ($title, $default_labels){
                $text = trim(wp_strip_all_tags($m[2]));
                if(!in_array($text, $default_labels, true)){
                    return $m[0];
                }
                return $m[1] . esc_html($title) . $m[3];
            }, $block_content, 1);
        }

        public function sppcfw_get_related_products_title(){
            $related_prducts_title='';

            if(isset(SPPCFW_ADVANCED['related_products_title'])){
                if(!empty(SPPCFW_ADVANCED['related_products_title'])){
                    $related_prducts_title=SPPCFW_ADVANCED['related_products_title'];
                }
            }

            if(sppcfw_is_pro_active()){
                if(sppcfw_if_category_based_customization_enabled()===1){
                    $product_cat=sppcfw_get_product_category_id();    
                    if($product_cat>0){
                        $sppcfw_cat = get_term_meta($product_cat, 'sppcfw_category_based_settings', true);
                        
                        if(isset($sppcfw_cat['related_products_title'])){
                            if(!empty($sppcfw_cat['related_products_title'])){
                                $related_prducts_title=$sppcfw_cat['related_products_title'];
                            }
                        }
                    }
                }

                if(sppcfw_if_product_based_customization_enabled()===1){
                    global $SPPCFW_INDIVIDUAL;
                    if(isset($SPPCFW_INDIVIDUAL['related_products_title'])){
                        if(!empty($SPPCFW_INDIVIDUAL['related_products_title'])){
                            $related_prducts_title=$SPPCFW_INDIVIDUAL['related_products_title'];
                        }                      
                    }
                }
            }

            return $related_prducts_title;
        }
        public function is_enabled(){
            $enabled=0;
            if(!empty($this->sppcfw_get_related_products_title())){
                $enabled=1;
            }
            return $enabled;
        }
    }

    new Sppcfw_Frontend_Related_Product_Title();
}







