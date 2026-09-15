<?php 
if (!defined('ABSPATH')) {
    exit;
}

if( !class_exists("Sppcfw_Frontend_Enable_Plus_Minus_Button")){
    
    class Sppcfw_Frontend_Enable_Plus_Minus_Button{
        
        public function __construct(){
              add_action("wp_enqueue_scripts",[$this,"sppcfw_plus_minus_button_assets"], 999);  
              add_action("woocommerce_before_quantity_input_field",[$this,"sppcfw_add_minus_button"]);  
              add_action("woocommerce_after_quantity_input_field",[$this,"sppcfw_add_plus_button"]);  
              add_filter("woocommerce_quantity_input_classes",[$this,"sppcfw_add_quantity_input_classes"], 999, 2);
        }

        public function sppcfw_add_quantity_input_classes($classes, $product = null){
            if(sppcfw_is_singular() && $this->is_enabled()===1){
                $classes[] = 'buttons_added';
                $classes[] = 'spinners-added';
            }
            return $classes;
        }

        public function sppcfw_plus_minus_button_assets(){
            if(sppcfw_is_singular() && $this->is_enabled()===1){
                // Disable theme quantity button scripts if present
                wp_dequeue_script('astra-add-to-cart-quantity-btn');
                wp_dequeue_script('kadence-shop-spinner');

                wp_enqueue_script(
                    'sppcfw-enable-plus-minus-button-js',
                    plugin_dir_url(__FILE__).'enable-plus-minus-button.js',
                    array('jquery'),
                    (defined('SPPCFW_VERSION') ? SPPCFW_VERSION : false),
                    true
                );

                // Add small inline style to ensure quantity wrapper displays as flex and buttons are touch-friendly
                wp_register_style('sppcfw-plus-minus-inline', false, array(), (defined('SPPCFW_VERSION') ? SPPCFW_VERSION : '1.0.0'));
                wp_enqueue_style('sppcfw-plus-minus-inline');
                $css = '.quantity{display:inline-flex !important; align-items:center; justify-content:center; gap:4px;} '
                     . '.quantity .sppcfw_minus_button, .quantity .sppcfw_plus_button{display:inline-flex !important; align-items:center; justify-content:center; min-width:38px; min-height:38px; height:38px; padding:0 10px !important; margin:0 !important; cursor:pointer; user-select:none; -webkit-user-select:none; touch-action:manipulation; line-height:1; font-size:16px; box-sizing:border-box;} '
                     . '.quantity .qty{text-align:center; min-width:48px; height:38px; padding:0 6px !important; margin:0 !important; box-sizing:border-box;} '
                     . '@media (max-width: 768px){ .quantity .sppcfw_minus_button, .quantity .sppcfw_plus_button{min-width:42px; min-height:42px; height:42px; font-size:18px;} .quantity .qty{min-width:52px; height:42px; font-size:16px;} } '
                     . '/* Hide theme-injected quantity buttons so only plugin version remains active */ '
                     . '.quantity .minus:not(.sppcfw_minus_button), .quantity .plus:not(.sppcfw_plus_button), '
                     . '.quantity > a.minus, .quantity > a.plus, .quantity > input.minus, .quantity > input.plus, '
                     . '.quantity .oceanwp-qty-btn, .quantity .ast-qty-btn { display:none !important; visibility:hidden !important; pointer-events:none !important; }';
                wp_add_inline_style('sppcfw-plus-minus-inline', $css);
            }
        }

        public function sppcfw_add_minus_button(){
            $product = function_exists('sppcfw_get_current_product') ? sppcfw_get_current_product() : null;

            if ($product instanceof WC_Product) {
                if ($product->is_sold_individually()) {
                    return;
                }
                if ($product->get_stock_quantity() === 1) {
                    return;
                }
            }

            if(sppcfw_is_singular() && $this->is_enabled()===1){
                // Mark parent quantity wrapper so themes (OceanWP, Astra, Kadence) skip adding their buttons
                echo '<script>if(document.currentScript&&document.currentScript.parentElement){document.currentScript.parentElement.classList.add("buttons_added","spinners-added");}</script>';
                echo '<button type="button" class="button sppcfw_minus_button" aria-label="' . esc_attr__('Decrease quantity', 'single-product-customizer') . '">-</button>';
            }
        }

        public function sppcfw_add_plus_button(){
            $product = function_exists('sppcfw_get_current_product') ? sppcfw_get_current_product() : null;

            if ($product instanceof WC_Product) {
                if ($product->is_sold_individually()) {
                    return;
                }
                if ($product->get_stock_quantity() === 1) {
                    return;
                }
            }

            if(sppcfw_is_singular() && $this->is_enabled()===1){
                echo '<button type="button" class="button sppcfw_plus_button" aria-label="' . esc_attr__('Increase quantity', 'single-product-customizer') . '">+</button>';
            }
        }

        public function is_enabled(){
            $enabled=0;
            if(sppcfw_is_pro_active()){
                // check in product level
                if(sppcfw_if_product_based_customization_enabled()===1){
                    global $SPPCFW_INDIVIDUAL;
                    if(isset($SPPCFW_INDIVIDUAL['enable_plus_minus_button'])){
                        if($SPPCFW_INDIVIDUAL['enable_plus_minus_button']==='on'){
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
                        
                        if(isset($sppcfw_cat['enable_plus_minus_button'])){
                            if($sppcfw_cat['enable_plus_minus_button']==='on'){
                                $enabled=1;
                            }
                        }
                    }

                    return $enabled;
                }

            }

            if(isset(SPPCFW_BASIC['enable_plus_minus_button'])){
                if(SPPCFW_BASIC['enable_plus_minus_button']==='on'){
                    $enabled=1;
                }
            }

            return $enabled;
        }

    } // end class

    new Sppcfw_Frontend_Enable_Plus_Minus_Button();
}


