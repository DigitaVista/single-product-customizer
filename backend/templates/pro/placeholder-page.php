<?php
/**
 * Pro feature placeholder screen (WordPress admin submenu).
 *
 * @var string $sppcfw_pro_placeholder_title
 * @var string $sppcfw_pro_placeholder_description
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$sppcfw_pro_cta_url = SPPCFW_Pro_Admin_Placeholders::sppcfw_get_cta_url();

if ( ! function_exists( 'is_plugin_active' ) ) {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

if ( is_plugin_active( 'single-product-customizer-pro/single-product-customizer-pro.php' ) ) {
	$sppcfw_pro_cta_label = __( 'Activate your Pro license', 'single-product-customizer' );
} else {
	$sppcfw_pro_cta_label = __( 'Get Product Page Customizer Pro', 'single-product-customizer' );
}
?>
<div class="wrap sppcfw-pro-placeholder-screen">
	<h1>
		<?php echo esc_html( $sppcfw_pro_placeholder_title ); ?>
		<span class="sppcfw-label pro sppcfw-pro-badge"><?php esc_html_e( 'PRO', 'single-product-customizer' ); ?></span>
	</h1>

	<div class="sppcfw-pro-placeholder-card">
		<p><?php echo esc_html( $sppcfw_pro_placeholder_description ); ?></p>
		<p class="description">
			<?php esc_html_e( 'This feature is part of Product Page Customizer Pro. Install and activate a valid license to use it on this site.', 'single-product-customizer' ); ?>
		</p>
		<p>
			<a href="<?php echo esc_url( $sppcfw_pro_cta_url ); ?>" class="button button-primary">
				<?php echo esc_html( $sppcfw_pro_cta_label ); ?>
			</a>
			<a href="<?php echo esc_url( SPPCFW_Pro_Admin_Placeholders::sppcfw_get_purchase_url() ); ?>" class="button" target="_blank" rel="noopener noreferrer">
				<?php esc_html_e( 'View Pro plans', 'single-product-customizer' ); ?>
			</a>
		</p>
	</div>
</div>
