<?php
// Security check
if (!defined('ABSPATH')) {
    exit;
}

$sppcfw_sidebar_menus  = apply_filters( 'sppcfw_sidebar_menu_items', [
    [
        'type'       => 'link',
        'tab'        => 'basic',
        'icon'       => 'dashicons-admin-generic',
        'label'      => __('Basic Settings', 'single-product-customizer'),
    ],
    [
        'type'       => 'link',
        'tab'        => 'advance',
        'icon'       => 'dashicons-admin-settings',
        'label'      => __('Advance Settings', 'single-product-customizer'),
    ],
    [
        'type'       => 'link',
        'tab'        => 'our_products',
        'icon'       => 'dashicons-products',
        'label'      => __('Our Products', 'single-product-customizer'),
    ],
    [
        'type'       => 'link',
        'tab'        => 'quick_checkout',
        'icon'       => 'dashicons-cart',
        'label'      => __('Enable Quick Checkout', 'single-product-customizer'),
    ],
    [
        'type'       => 'link',
        'tab'        => 'support',
        'icon'       => 'dashicons-admin-site',
        'label'      => __('Support', 'single-product-customizer'),
    ],
    [
        'type'       => 'static',
        'icon'       => 'dashicons-admin-collapse',
        'label'      => __('Collapse', 'single-product-customizer'),
    ],
]);

if ( ! function_exists( 'sppcfw_sidebar_tab_url' ) ) {
    function sppcfw_sidebar_tab_url($tab) {
        return add_query_arg(
            [
                'page' => 'sppcfw-single-product-customizer',
                'tab'  => $tab,
            ],
            admin_url( 'admin.php' )
        );
    }
}

$active_tab_current = isset( $active_tab ) ? $active_tab : 'basic';
?>
<div class="sppcfw_panel_sidebar">
    <div class="sppcfw_sidebar_header">
        <a href="<?php echo esc_url(sppcfw_sidebar_tab_url('basic')); ?>" class="plugin_logo">
            <span class="logo_text"><?php esc_html_e( 'Single Product Customizer', 'single-product-customizer' ); ?></span>
        </a>
    </div>

    <div class="sppcfw_sidebar_menu_wrapper">
        <ul class="sppcfw_sidebar_menu">
            <?php foreach ($sppcfw_sidebar_menus as $menu): ?>
                <?php if ($menu['type'] === 'link'): ?>
                    <li class="menu-item<?php echo ( $active_tab_current === $menu['tab'] ) ? ' active-item' : ''; ?>" data-tab="<?php echo esc_attr($menu['tab']); ?>">
                        <a href="<?php echo esc_url(sppcfw_sidebar_tab_url($menu['tab'])); ?>" class="item-link" onclick="opensppcfw(event, '<?php echo esc_js($menu['tab']); ?>')">
                            <span class="dashicons <?php echo esc_attr($menu['icon']); ?>"></span>
                            <span class="name"><?php echo esc_html($menu['label']); ?></span>
                        </a>
                    </li>
                <?php elseif ($menu['type'] === 'submenu'): ?>
                    <li class="menu-item<?php echo ! empty( $menu['pro_section'] ) ? ' menu-item--pro-section' : ''; ?>">
                        <a href="#" class="item-link">
                            <span class="dashicons <?php echo esc_attr($menu['icon']); ?>"></span>
                            <span class="name"><?php echo esc_html($menu['label']); ?></span>
                            <?php if ( ! empty( $menu['pro_section'] ) ) : ?>
                                <span class="sppcfw-label pro"><?php esc_html_e( 'Pro', 'single-product-customizer' ); ?></span>
                            <?php endif; ?>
                            <span class="dashicons dashicons-arrow-down-alt2 arrow-icon"></span>
                        </a>
                        <ul class="sppcfw_panel_submenu">
                            <?php foreach ($menu['sub_items'] as $sppcfw_sub): ?>
                                <?php
                                $sppcfw_sub_href = ! empty( $sppcfw_sub['href'] )
                                    ? $sppcfw_sub['href']
                                    : sppcfw_sidebar_tab_url( $sppcfw_sub['tab'] ?? 'basic' );
                                $sppcfw_sub_tab   = isset( $sppcfw_sub['tab'] ) ? (string) $sppcfw_sub['tab'] : '';
                                ?>
                                <li class="submenu-item">
                                    <a href="<?php echo esc_url( $sppcfw_sub_href ); ?>" class="item-link"<?php echo '' !== $sppcfw_sub_tab ? ' data-tab="' . esc_attr( $sppcfw_sub_tab ) . '"' : ''; ?> onclick="opensppcfw(event, '<?php echo esc_js($sppcfw_sub_tab); ?>')">
                                        <?php echo esc_html( $sppcfw_sub['label'] ); ?>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </li>
                <?php elseif ($menu['type'] === 'static'): ?>
                    <li class="menu-item collapse-item">
                        <a href="#" class="item-link">
                            <span class="dashicons <?php echo esc_attr($menu['icon']); ?>"></span>
                            <span class="name"><?php echo esc_html($menu['label']); ?></span>
                        </a>
                    </li>
                <?php endif; ?>
            <?php endforeach; ?>
        </ul>
    </div>
</div>
