<?php 
if (!defined('ABSPATH')) {
    exit;
}

if( ! class_exists('Sppcfw_Frontend_Variation_Table')){
    class Sppcfw_Frontend_Variation_Table{
        private $hook;
        public function __construct(){
            add_action('wp',[$this,'initialization']);
        }

        public function initialization(){
            // Only for single product page
            if( ! is_product() ) {
                return;
            }
            
            if($this->is_enabled()===1){
                
                $this->hook=$this->sppcfw_get_variation_table_show_hook();
                if(!empty($this->hook)){
                    add_action($this->hook,[$this,"sppcfw_show_variation_table"]);
                }
            }
        }

        public function sppcfw_get_variation_table_show_hook(){
            $hook='';
            if(sppcfw_is_pro_active()){
                // check in product level
                if(sppcfw_if_product_based_customization_enabled()===1){
                    global $SPPCFW_INDIVIDUAL;

                    if(isset($SPPCFW_INDIVIDUAL['variation_table_display_hook'])){
                        if(!empty($SPPCFW_INDIVIDUAL['enable_varition_table'])){
                            $hook=$SPPCFW_INDIVIDUAL['variation_table_display_hook'];  
                        }                       
                    }
                   return $hook;
                }

                // check in category level
                if(sppcfw_if_category_based_customization_enabled()===1){
                    $product_cat=sppcfw_get_product_category_id();
                    if($product_cat>0){
                        $sppcfw_cat = get_term_meta($product_cat, 'sppcfw_category_based_settings', true);
                        
                        if(isset($sppcfw_cat['variation_table_display_hook'])){
                            if(!empty($sppcfw_cat['enable_varition_table'])){
                                $hook=$sppcfw_cat['variation_table_display_hook'];
                            }                       
                        }
                    }
                    return $hook;
                }
            }

            if(isset(SPPCFW_ADVANCED['variation_table_display_hook'])){
                if(!empty(SPPCFW_ADVANCED['enable_varition_table'])){
                    $hook=SPPCFW_ADVANCED['variation_table_display_hook'];
                }
            }

            return $hook;
        }


        public function sppcfw_entry_terms($taxonomy) {
            $terms = get_terms( array(
                'taxonomy'   => $taxonomy
            ) );
            $entry_terms='';
            if ( ! is_wp_error( $terms ) ) {
                    foreach ( $terms as $term ) {
                        $entry_terms .= $term->name . ', ';
                    }
                    $entry_terms = rtrim( $entry_terms, ', ' );
            }
            return $entry_terms;
        }

        public function sppcfw_show_variation_table(){
            $product = function_exists('sppcfw_get_current_product') ? sppcfw_get_current_product() : null;
            if ( ! ($product instanceof WC_Product) ) {
                global $post;
                if ( isset($post->ID) && !empty($post->ID) && function_exists('wc_get_product') ) {
                    $product = wc_get_product($post->ID);
                }
            }

            if ( ! ($product instanceof WC_Product) ) {
                return;
            }

            if( 'variable' === $product->get_type() ) {
                $variations=$product->get_children();
                $attrs=$product->get_attributes();
            
            ?>
            <div class="sppcfw_variation_table_wrapper">
            <table class="sppcfw_variation_table">
                <thead>
                    <tr>
                        <th><?php echo esc_html_e("SKU","single-product-customizer");?></th>
                        <?php
                            foreach($attrs as $attr){
                                echo '<th>'.wp_kses_post(wc_attribute_label( $attr->get_name() )).'</th>';
                            }
                        ?>
                        <th><?php echo esc_html_e("Price","single-product-customizer");?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    foreach( $variations as $variation_id ){
                        $variation = wc_get_product( $variation_id );
                        if (!$variation) continue;
                        $sku = $variation->get_sku();
                        $price = $variation->get_price_html();
                        $var_attrs = $variation->get_attributes();
                        ?>
                        <tr>
                            <td><?php echo esc_html( $sku ); ?></td>
                            <?php
                            foreach( $attrs as $attr ){
                                $attr_name = $attr->get_name();
                                $attr_val = isset( $var_attrs[ $attr_name ] ) ? $var_attrs[ $attr_name ] : '';
                                if( taxonomy_exists( $attr_name ) ){
                                    $term = get_term_by( 'slug', $attr_val, $attr_name );
                                    $attr_val = $term ? $term->name : $attr_val;
                                }
                                echo '<td>'.esc_html( $attr_val ).'</td>';
                            }
                            ?>
                            <td><?php echo wp_kses_post( $price ); ?></td>
                        </tr>
                        <?php
                    }
                    ?>
                </tbody>
            </table>
            </div>
            <?php
            }
        }

        public function is_enabled(){
            $enabled=0;
            if(sppcfw_is_pro_active()){
                // check in product level
                if(sppcfw_if_product_based_customization_enabled()===1){
                    global $SPPCFW_INDIVIDUAL;
                    if(isset($SPPCFW_INDIVIDUAL['enable_varition_table'])){
                        if($SPPCFW_INDIVIDUAL['enable_varition_table']==='on'){
                            return 1;
                        }else{
                            return 0;
                        }                       
                    }
                }

                // check in category level
                if(sppcfw_if_category_based_customization_enabled()===1){
                    $product_cat=sppcfw_get_product_category_id();
                    if($product_cat>0){
                        $sppcfw_cat = get_term_meta($product_cat, 'sppcfw_category_based_settings', true);
                        
                        if(isset($sppcfw_cat['enable_varition_table'])){
                            if($sppcfw_cat['enable_varition_table']==='on'){
                                return 1;
                            }
                        }
                    }
                    return $enabled;
                }
            }

            if(isset(SPPCFW_ADVANCED['enable_varition_table'])){
                if(SPPCFW_ADVANCED['enable_varition_table']==='on'){
                    $enabled=1;
                }
            }

            return $enabled;
        }
    }

    new Sppcfw_Frontend_Variation_Table();
}