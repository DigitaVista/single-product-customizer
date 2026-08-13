<?php
// Exit if accessed directly
if (! defined('ABSPATH')) {
    exit;
}

// Form submission is handled via AJAX (see ajax-handlers.php)

// Define available templates
$template_files = array(
    'template-1' => __('Template 1 - Modern Horizontal', 'single-product-customizer'),
    'template-2' => __('Template 2 - Classic Vertical', 'single-product-customizer'),
);

$sppcfw_theme          = wp_get_theme();
$sppcfw_is_block_theme = $sppcfw_theme->exists()
    && method_exists($sppcfw_theme, 'is_block_theme')
    && $sppcfw_theme->is_block_theme();

// Get current options (block themes force Quick Checkout off on init priority 11 before this admin view loads).
$sppcfw_enable_quick_checkout = (int) get_option('sppcfw_enable_quick_checkout', 0);
$sppcfw_current_template      = get_option('sppcfw_enable_qc', 'template-1');

// Force template-1 in admin (no other template selectable/savable from this screen).
$sppcfw_current_template = 'template-1';

// Template / extra rows only when Quick Checkout is on and a classic theme is active.
$show_template_selector = ! $sppcfw_is_block_theme && ! empty($sppcfw_enable_quick_checkout);

$sppcfw_qc_disabled_attr = $sppcfw_is_block_theme ? ' disabled="disabled"' : '';
?>

<div>
    <h1 class="sppcfw-heading-inline"><?php _e('Enable Quick Checkout', 'single-product-customizer'); ?></h1>
    <hr class="sppcfw-header-devider">
    <div class="sppcfw-quick-checkout-settings">
        <form method="post" action="">
            <?php wp_nonce_field('sppcfw_qc_nonce', 'nonce'); ?>

            <div class="sppcfw-quick-checkout-content">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="sppcfw_enable_quick_checkout">
                                <?php _e('Enable Quick Checkout', 'single-product-customizer'); ?>
                                <input type="checkbox" name="sppcfw_enable_quick_checkout" id="sppcfw_enable_quick_checkout" value="1" class="sppcfw-enable-quick-checkout-toggle" 
                                <?php echo $sppcfw_qc_disabled_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> 
                                <?php checked(! $sppcfw_is_block_theme && ! empty($sppcfw_enable_quick_checkout), 1); ?> />
                            </label>
                        </th>
                        <td>
                            <p class="description"><?php _e('Enable Quick Checkout feature for streamlined product purchase experience.', 'single-product-customizer'); ?></p>
                            <p class="description" style="color: #0073aa; font-weight: 500;">
                                <strong>ℹ️ <?php _e('Note:', 'single-product-customizer'); ?></strong>
                                <?php _e('Enabling this will automatically enable "AJAX add to cart buttons on archives" in WooCommerce settings. Disabling this will automatically disable that setting as well.', 'single-product-customizer'); ?>
                            </p>
                            <?php if ($sppcfw_is_block_theme) : ?>
                                <p class="description" style="color: #b32d2e;">
                                    <?php esc_html_e('Quick Checkout is saved as off while a block theme is active and cannot be changed here. Switch to a classic theme to enable and save Quick Checkout again.', 'single-product-customizer'); ?>
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr class="sppcfw_product_options_row" style="<?php echo !$show_template_selector ? 'display:none;' : ''; ?>">
                        <th scope="row">
                            <div class="sppcfw_product_options">
                                <label class="sppcfw_show_product_title" id="sppcfw_show_product_title" for="sppcfw_show_product_title">
                                    <?php _e('Show Product Title', 'single-product-customizer'); ?>
                                </label>
                                <label class="sppcfw_show_review" id="sppcfw_show_review" for="sppcfw_show_review">
                                    <?php _e('Show Review', 'single-product-customizer'); ?>
                                </label>
                                <label class="sppcfw_show_short_description" id="sppcfw_show_short_description" for="sppcfw_show_short_description">
                                    <?php _e('Show Short Description', 'single-product-customizer'); ?>
                                </label>
                            </div>
                        </th>
                        <td>
                            <div class="sppcfw_product_checkboxes">
                                <p class ="sppcfw_show_product_title">Pro Features </p>
                                <p class ="sppcfw_show_review">Pro Features</p>
                                <p class ="sppcfw_show_short_description">Pro Features</p>
                            </div>
                        </td>
                    </tr>
                    <tr class="sppcfw_quick_checkout_template_row" style="<?php echo !$show_template_selector ? 'display:none;' : ''; ?>">
                        <th scope="row">
                            <label for="sppcfw_enable_qc"><?php _e('Select Quick Checkout Template', 'single-product-customizer'); ?></label>
                        </th>
                        <td>
                            <div class="sppcfw-template-select-container">
                                <div class="sppcfw-template-left">
                                    <div class="sppcfw-fixed-template">
                                        <strong><?php esc_html_e('Selected template:', 'single-product-customizer'); ?></strong>
                                        <span><?php echo esc_html($template_files['template-1']); ?></span>
                                    </div>

                                    <!-- Always submit template-1 (cannot be changed) -->
                                    <input type="hidden" name="sppcfw_enable_qc" id="sppcfw_enable_qc" value="template-1" />

                                    <div class="sppcfw-template-image-selector sppcfw-template-preview-picker">
                                        <?php foreach ($template_files as $value => $label): ?>
                                            <div class="sppcfw-template-item <?php echo $value === 'template-1' ? 'is-active' : ''; ?>"
                                                role="button"
                                                tabindex="0"
                                                data-template="<?php echo esc_attr($value); ?>">
                                                <div class="sppcfw-template-thumb">
                                                    <img src="<?php echo plugin_dir_url(__FILE__) . '/assets/img/' . $value . '.png'; ?>" alt="<?php echo esc_attr($label); ?>">

                                                </div>
                                                <span class="sppcfw-template-title"><?php echo esc_html($label); ?></span>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>

                                <div class="sppcfw-selected-template-preview">
                                    <div class="sppcfw-select-template-thumb">
                                        <img id="sppcfw-selected-template-preview-img"
                                            src="<?php echo plugin_dir_url(__FILE__) . '/assets/img/' . $sppcfw_current_template . '.png'; ?>"
                                            alt="<?php echo esc_attr($template_files[$sppcfw_current_template]); ?>">
                                    </div>
                                </div>
                            </div>
                            <p class="description"><?php _e('Select a template to customize the Quick Checkout feature on product pages.', 'single-product-customizer'); ?></p>
                        </td>
                    </tr>

                </table>
            </div>

            <div style="margin-bottom: 0px;">
                <?php
                submit_button(
                    null,
                    'primary',
                    'submit_sppcfw_quick_checkout',
                    true,
                    $sppcfw_is_block_theme ? array('disabled' => 'disabled') : array()
                );
                ?>
            </div>
        </form>
    </div>
</div>