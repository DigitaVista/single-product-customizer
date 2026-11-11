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

// Render the header and footer template parts before wp_head(), like core's block template canvas does.
// Blocks in them (e.g. Navigation) enqueue script modules; rendering them after wp_head() leaves those
// modules out of the import map ("Failed to resolve module specifier @wordpress/interactivity").
ob_start();
block_header_area();
$sppcfw_block_header = ob_get_clean();

ob_start();
block_footer_area();
$sppcfw_block_footer = ob_get_clean();
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
	<?php echo $sppcfw_block_header; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered block markup ?>

	<?php do_action( 'woocommerce_before_main_content' ); ?>

	<?php
	while ( have_posts() ) :
		the_post();
		wc_get_template_part( 'content', 'single-product' );
	endwhile;
	?>

	<?php do_action( 'woocommerce_after_main_content' ); ?>

	<?php echo $sppcfw_block_footer; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered block markup ?>
</div>
<?php wp_footer(); ?>
</body>
</html>
