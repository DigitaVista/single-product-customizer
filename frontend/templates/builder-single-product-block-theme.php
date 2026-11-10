<?php
/**
 * Single product page for the Page Builder on block (FSE) themes.
 *
 * WooCommerce's classic single-product.php calls get_header()/get_footer(), which block themes do not have
 * (it triggers a "Theme without header.php is deprecated" notice and drops the theme header/footer).
 * This wrapper prints the block theme's header and footer template parts instead and runs the same
 * WooCommerce hooks, so the Builder layout renders inside the normal site chrome.
 *
 * @package Single_Product_Customizer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="wp-site-blocks">
	<?php block_header_area(); ?>

	<?php do_action( 'woocommerce_before_main_content' ); ?>

	<?php
	while ( have_posts() ) :
		the_post();
		wc_get_template_part( 'content', 'single-product' );
	endwhile;
	?>

	<?php do_action( 'woocommerce_after_main_content' ); ?>

	<?php block_footer_area(); ?>
</div>
<?php wp_footer(); ?>
</body>
</html>
