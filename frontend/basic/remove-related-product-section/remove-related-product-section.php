<?php 
if (!defined('ABSPATH')) {
    exit;
}

if( !class_exists("Sppcfw_Frontend_Remove_Related_Product_Section")){
    class Sppcfw_Frontend_Remove_Related_Product_Section{

        public function __construct(){
            add_action("woocommerce_after_single_product_summary",[$this, "sppcfw_remove_related_product_section"], 1 );
            // Suppress related products at data level for any theme
            add_filter("woocommerce_product_related_posts", [$this, "sppcfw_empty_related_posts"], 999, 3);
            add_filter("woocommerce_related_products_args", [$this, "sppcfw_zero_related_products"], 999, 1);
            // Theme compatibility: Disable OceanWP & Astra related products
            add_filter("ocean_woo_related_products", [$this, "sppcfw_disable_theme_related"], 999);
            add_filter("astra_woo_related_products", [$this, "sppcfw_disable_theme_related"], 999);
            add_action("wp_head", [$this, "sppcfw_hide_related_css"]);
        }

        public function sppcfw_empty_related_posts($related_posts, $product_id, $args) {
            if ($this->is_enabled() === 1) {
                return array();
            }
            return $related_posts;
        }

        public function sppcfw_zero_related_products($args) {
            if ($this->is_enabled() === 1 && is_array($args)) {
                $args['posts_per_page'] = 0;
            }
            return $args;
        }

        public function sppcfw_disable_theme_related($show) {
            return ($this->is_enabled() === 1) ? false : $show;
        }

        public function sppcfw_hide_related_css() {
            if ($this->is_enabled() === 1 && is_product()) {
                echo '<style id="sppcfw-hide-related-css">.related.products, .single-product .related-products, section.related{display:none !important;}</style>';
            }
        }

        public function sppcfw_remove_related_product_section(){
            if($this->is_enabled()===1){
                remove_action("woocommerce_after_single_product_summary","woocommerce_output_related_products",20 );
            }
        }

        public function is_enabled(){
            $enabled=0;
            if(sppcfw_is_pro_active()){
                // check in product level
                if(sppcfw_if_product_based_customization_enabled()===1){
                    global $SPPCFW_INDIVIDUAL;
                    
                    if(isset($SPPCFW_INDIVIDUAL['remove_related_product_section'])){
                        if($SPPCFW_INDIVIDUAL['remove_related_product_section']==='on'){
                           $enabled=1;
                        }else{
                           $enabled=0;
                        }                       
                    }
            
                    return $enabled;
                }

                // check in category level
                
                if(sppcfw_if_category_based_customization_enabled()===1){

                    $product_cat=sppcfw_get_product_category_id();
                    if($product_cat>0){
                        $sppcfw_cat = get_term_meta($product_cat, 'sppcfw_category_based_settings', true);
                        
                        if(isset($sppcfw_cat['remove_related_product_section'])){
                            if($sppcfw_cat['remove_related_product_section']==='on'){
                                $enabled=1;
                            }
                        }
                    }

                    return $enabled;
                }

            }

            if(isset(SPPCFW_BASIC['remove_related_product_section'])){
                if(SPPCFW_BASIC['remove_related_product_section']==='on'){
                    $enabled=1;
                }
            }

            return $enabled;
        }
    }
    new Sppcfw_Frontend_Remove_Related_Product_Section();
}





