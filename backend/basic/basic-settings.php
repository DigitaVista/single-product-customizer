<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Section: Basic Settings.
$sppcfw_back_ui_obj->add_section(
    array(
        'id'    => 'sppcfw_basic',
        'title' => __( 'Basic Settings', 'single-product-customizer' ),
        'class'=>'test-class'
    )
);

$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'        => 'enable_plus_minus_button',
        'type'      => 'checkbox',
        'name'      => __( 'Enable plus/minus button for quantity change', 'single-product-customizer' ),
        'desc'      => '',
        'class'     =>'sppcfw_basic_enable_plus_minus_button',
        'help_link' =>'https://www.youtube.com/watch?v=T_fbESRC2uw'
    )
);




// Field: Text.
$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'      => 'out_of_stock_text',
        'type'    => 'text',
        'name'    => __( 'Out of stock text', 'single-product-customizer' ),
        'desc'    => '',
        'default' => __('Out of stock','single-product-customizer'),
        'class'   =>'sppcfw_basic_out_of_stock_text',
        'help_link' =>'https://www.youtube.com/watch?v=T_fbESRC2uw'
    )
);


$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'                => 'sale_badge_text',
        'type'              => 'text',
        'name'              => __( 'Change sales badge text', 'single-product-customizer' ),
        'desc'              => '',
        'default'           => __( 'Sale!', 'single-product-customizer' ),
        'help_link' =>'https://www.youtube.com/watch?v=T_fbESRC2uw'
    )
);
$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'                => 'add_to_cart_button_text',
        'type'              => 'text',
        'name'              => __( 'Change add to cart button text', 'single-product-customizer' ),
        'desc'              => '',
        'default'           => __( 'Add to cart', 'single-product-customizer' ),
    )
);

$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'remove_product_meta',
        'type' => 'checkbox',
        'name' => __( 'Remove product meta', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_product_meta',
        'help_link' =>'https://www.youtube.com/watch?v=T_fbESRC2uw'
    )
);


$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'remove_related_product_section',
        'type' => 'checkbox',
        'name' => __( 'Remove related product section', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_remove_related_product_section'
    )
);

$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'remove_product_rating',
        'type' => 'checkbox',
        'name' => __( 'Remove Rating', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_remove_product_rating'
    )
);
$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'hide_product_price',
        'type' => 'checkbox',
        'name' => __( 'Hide price', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_hide_price'
    )
);
$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'hide_add_to_cart_button',
        'type' => 'checkbox',
        'name' => __( 'Hide add to cart button', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_hide_add_to_cart_button'
    )
);

$sppcfw_back_ui_obj->add_field(
    'sppcfw_basic',
    array(
        'id'   => 'hide_short_description',
        'type' => 'checkbox',
        'name' => __( 'Hide short description', 'single-product-customizer' ),
        'desc' => '',
        'class'=>'sppcfw_basic_hide_short_description'
    )
);