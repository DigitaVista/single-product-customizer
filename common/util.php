<?php
// check product based customization enabled or disabled
function sppcfw_if_product_based_customization_enabled(){
    $return_val=0;
    if(isset(SPPCFW_ADVANCED['enable_customizer_for_product'])){
        if(SPPCFW_ADVANCED['enable_customizer_for_product']==='on'){
            $return_val=1;
        }
    }

    return $return_val;
}

// check category based customization enabled or disabled
function sppcfw_if_category_based_customization_enabled(){
    $return_val=0;
    if(isset(SPPCFW_ADVANCED['enable_customizer_for_category'])){
        if(SPPCFW_ADVANCED['enable_customizer_for_category']==='on'){
            $return_val=1;
        }
    }

    return $return_val;
}

function sppcfw_is_enable($key){
    $enable=0;

    global $SPPCFW_INDIVIDUAL;
    
    // priority high
    if(sppcfw_if_product_based_customization_enabled($key)===1){
        if(isset($SPPCFW_INDIVIDUAL[$key])){
            if($SPPCFW_INDIVIDUAL[$key]==='on'){
               $enable=1;
            }else{
               $enable=0;
            }                       
        }
        return $enable;
    }

    if(isset(SPPCFW_BASIC[$key])){
        if(SPPCFW_BASIC[$key]==='on'){
            $enable=1;
        }


        
    }

    if(isset(SPPCFW_ADVANCED[$key])){
        if(SPPCFW_ADVANCED[$key]==='on'){
            $enable=1;
        }


        if(isset($SPPCFW_INDIVIDUAL[$key])){
         if($SPPCFW_INDIVIDUAL[$key]==='on'){
            $enable=1;
         }else{
            $enable=0;
         }                       
        }
    }

    return $enable;
}

function sppcfw_return_values($elements){
    $data=array();
    global $SPPCFW_INDIVIDUAL;
    if(is_array($elements)){
        foreach($elements as $element){
            $key=$element;
            $value=(isset(SPPCFW_BASIC[$key])?SPPCFW_BASIC[$key]:(isset(SPPCFW_ADVANCED[$key])?SPPCFW_ADVANCED[$key]:''));
            $value=(isset($SPPCFW_INDIVIDUAL[$key])?$SPPCFW_INDIVIDUAL[$key]:$value);
            $data[$key]=$value;
        }
    }
    
    return $data;

}

function sppcfw_import_settings_from_category(){
    // phpcs:ignore
    $category_id=sanitize_text_field($_POST["category_id"]);

    $sppcfw_cat = get_term_meta($category_id, 'sppcfw_category_based_settings', true);

    wp_send_json($sppcfw_cat);

    exit();
}
add_action( 'wp_ajax_sppcfw_import_settings_from_category', 'sppcfw_import_settings_from_category' );
add_action( 'wp_ajax_nopriv_sppcfw_import_settings_from_category','sppcfw_import_settings_from_category');

function sppcfw_import_global_settings(){
    $sppcfw_basic=get_option('sppcfw_basic');
    if(!is_array($sppcfw_basic))$sppcfw_basic=array();
    $sppcfw_advanced=get_option('sppcfw_advanced');
    if(!is_array($sppcfw_advanced))$sppcfw_advanced=array();
    $sppcfw_global=array_merge($sppcfw_basic,$sppcfw_advanced);

    wp_send_json($sppcfw_global);

    exit();
}
add_action( 'wp_ajax_sppcfw_import_global_settings', 'sppcfw_import_global_settings' );
add_action( 'wp_ajax_nopriv_sppcfw_import_global_settings','sppcfw_import_global_settings');

function sppcfw_is_singular(){
    if(is_singular( 'product' )){
        return true;
    }else{
        return false;
    }
}

function sppcfw_get_product_category_id( $product_id = null ) {
    // Ensure a valid product ID is provided
    if ( ! $product_id ) {
        global $post;
        $product_id = $post->ID; // Fallback to global post ID
    }

    if ( ! $product_id ) {
        return 0; // Return 0 if no product ID is available
    }

    // Get the category terms associated with the product
    $terms = wc_get_product_term_ids( $product_id, 'product_cat' );

    // Get the first category ID or fallback to 0
    $product_cat = ! empty( $terms ) ? $terms[0] : 0;

    return $product_cat;
}


function sppcfw_min_max_is_enabled($product_id){
    
    $enabled=0;
    if(SPPCFW_PRO_ACTIVE){
        // check in product level
        if(sppcfw_if_product_based_customization_enabled()===1){
            $SPPCFW_INDIVIDUAL=get_post_meta($product_id,'sppcfw_product',true);
            if(isset($SPPCFW_INDIVIDUAL['enable_min_max_qty'])){
                if($SPPCFW_INDIVIDUAL['enable_min_max_qty']==='on'){
                   $enabled=1;
                }else{
                   $enabled=0;
                }                       
            }
    
            return $enabled;
        }

        // check in category level

        if(sppcfw_if_category_based_customization_enabled()===1){

            $product_cat = sppcfw_get_product_category_id( $product_id );


            if($product_cat>0){
                $sppcfw_cat = get_term_meta($product_cat, 'sppcfw_category_based_settings', true);
                
                if(isset($sppcfw_cat['enable_min_max_qty'])){
                    
                    if($sppcfw_cat['enable_min_max_qty']==='on'){
                        
                        $enabled=1;
                    }
                }
            }

            return $enabled;
        }

        if(isset(SPPCFW_ADVANCED['enable_min_max_qty'])){
            if(SPPCFW_ADVANCED['enable_min_max_qty']==='on'){
                $enabled=1;
            }
        }

    }
    return $enabled;
}

// Check if block theme is installed
function sppcfw_is_block_theme_active(){
    $theme = wp_get_theme();
    // Check if the theme supports block-based templates
    return $theme->is_block_theme();
}

// action hooks select options html
function sppcfw_wc_action_hooks_select_html($args=array()){
    global $sppcfw_available_hooks;
    $selected= isset($args['selected'])? sanitize_text_field($args['selected']):'';
    $id= isset($args['id'])? sanitize_text_field($args['id']):'';
    $class= isset($args['class'])? sanitize_text_field($args['class']):'';
    $name= isset($args['name'])? sanitize_text_field($args['name']):'';
    $html='<select name="'.esc_attr($name).'" class="'.esc_attr($class).'" id="'.esc_attr($id).'">';
    foreach($sppcfw_available_hooks as $value=>$option){
        $html.='<option value="'.esc_attr($value).'" '.($value===$selected?'selected':'').'>'.esc_html($option).'</option>';
    }
    $html.='</select>';
    return $html;
}