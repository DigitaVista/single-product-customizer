<?php
/**
 * Single Product Page Builder - All Templates List View
 *
 * @package Single_Product_Customizer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$templates = get_option( 'sppcfw_builder_templates', array() );

// Migrate legacy single template if present
if ( empty( $templates ) ) {
	$legacy = get_option( 'sppcfw_builder_template', array() );
	if ( ! empty( $legacy ) && ! empty( $legacy['layout'] ) ) {
		$default_id = 'template_default';
		$templates[ $default_id ] = array(
			'id'         => $default_id,
			'title'      => __( 'Default Single Product Template', 'single-product-customizer' ),
			'layout'     => $legacy['layout'],
			'conditions' => isset( $legacy['conditions'] ) ? $legacy['conditions'] : array( 'scope' => 'entire' ),
			'status'     => 'published',
			'updated_at' => isset( $legacy['updated_at'] ) ? $legacy['updated_at'] : current_time( 'mysql' ),
		);
		update_option( 'sppcfw_builder_templates', $templates );
	}
}

// Handle template deletion via GET action if nonce valid
if ( isset( $_GET['action'] ) && 'delete' === $_GET['action'] && isset( $_GET['template_id'] ) && isset( $_GET['_wpnonce'] ) ) {
	if ( wp_verify_nonce( $_GET['_wpnonce'], 'sppcfw_delete_template_' . $_GET['template_id'] ) ) {
		$del_id = sanitize_text_field( $_GET['template_id'] );
		unset( $templates[ $del_id ] );
		update_option( 'sppcfw_builder_templates', $templates );
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Template deleted successfully.', 'single-product-customizer' ) . '</p></div>';
	}
}

// Handle template duplication via GET action if nonce valid
if ( isset( $_GET['action'] ) && 'duplicate' === $_GET['action'] && isset( $_GET['template_id'] ) && isset( $_GET['_wpnonce'] ) ) {
	if ( wp_verify_nonce( $_GET['_wpnonce'], 'sppcfw_duplicate_template_' . $_GET['template_id'] ) ) {
		$dup_id = sanitize_text_field( $_GET['template_id'] );
		if ( isset( $templates[ $dup_id ] ) ) {
			$new_id = 'template_' . time();
			$copied = $templates[ $dup_id ];
			$copied['id']         = $new_id;
			$copied['title']      = $copied['title'] . ' ' . __( '(Copy)', 'single-product-customizer' );
			$copied['updated_at'] = current_time( 'mysql' );
			$templates[ $new_id ] = $copied;
			update_option( 'sppcfw_builder_templates', $templates );
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Template duplicated successfully.', 'single-product-customizer' ) . '</p></div>';
		}
	}
}

$new_template_url = admin_url( 'admin.php?page=sppcfw-single-page-builder&template_id=new' );
?>

<div class="wrap sppcfw-templates-wrap" style="max-width: 1200px; margin: 20px auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
	<div style="display: flex; justify-content: space-between; items-center; margin-bottom: 24px; border-b: 1px solid #e2e8f0; padding-bottom: 16px;">
		<div>
			<h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">
				<?php esc_html_e( 'Single Product Page Templates', 'single-product-customizer' ); ?>
			</h1>
			<p style="font-size: 13px; color: #64748b; margin: 0;">
				<?php esc_html_e( 'Manage your WooCommerce single product layout templates and display conditions.', 'single-product-customizer' ); ?>
			</p>
		</div>
		<div>
			<a href="<?php echo esc_url( $new_template_url ); ?>" class="button button-primary" style="background: #9333ea; border-color: #7e22ce; font-weight: 700; padding: 6px 18px; height: auto; font-size: 13px; display: inline-flex; items-center; gap: 6px; box-shadow: 0 2px 4px rgba(147,51,234,0.3);">
				<span class="dashicons dashicons-plus-alt2" style="font-size: 16px; margin-top: 2px;"></span>
				<?php esc_html_e( 'Add New Template', 'single-product-customizer' ); ?>
			</a>
		</div>
	</div>

	<?php if ( empty( $templates ) ) : ?>
		<div style="background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 48px; text-align: center; margin-top: 20px;">
			<span class="dashicons dashicons-layout" style="font-size: 48px; width: 48px; height: 48px; color: #9333ea; margin-bottom: 12px;"></span>
			<h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;"><?php esc_html_e( 'No Templates Found', 'single-product-customizer' ); ?></h3>
			<p style="font-size: 13px; color: #64748b; max-width: 400px; margin: 0 auto 20px auto;"><?php esc_html_e( 'Create your first custom WooCommerce single product page template with drag-and-drop container layouts.', 'single-product-customizer' ); ?></p>
			<a href="<?php echo esc_url( $new_template_url ); ?>" class="button button-primary" style="background: #9333ea; border-color: #7e22ce; font-weight: 700; padding: 8px 24px; height: auto; font-size: 14px;">
				<?php esc_html_e( 'Create First Template', 'single-product-customizer' ); ?>
			</a>
		</div>
	<?php else : ?>
		<table class="wp-list-table widefat fixed striped table-view-list" style="border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
			<thead>
				<tr style="background: #f8fafc;">
					<th style="font-weight: 700; color: #334155; padding: 12px 16px;"><?php esc_html_e( 'Template Name', 'single-product-customizer' ); ?></th>
					<th style="font-weight: 700; color: #334155; padding: 12px 16px; width: 220px;"><?php esc_html_e( 'Display Scope', 'single-product-customizer' ); ?></th>
					<th style="font-weight: 700; color: #334155; padding: 12px 16px; width: 120px;"><?php esc_html_e( 'Status', 'single-product-customizer' ); ?></th>
					<th style="font-weight: 700; color: #334155; padding: 12px 16px; width: 160px;"><?php esc_html_e( 'Last Updated', 'single-product-customizer' ); ?></th>
					<th style="font-weight: 700; color: #334155; padding: 12px 16px; width: 180px; text-align: right;"><?php esc_html_e( 'Actions', 'single-product-customizer' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $templates as $t_id => $tpl ) : ?>
					<?php
					$edit_url = admin_url( 'admin.php?page=sppcfw-single-page-builder&template_id=' . esc_attr( $t_id ) );
					$dup_url  = wp_nonce_url( admin_url( 'admin.php?page=sppcfw-builder-all-templates&action=duplicate&template_id=' . esc_attr( $t_id ) ), 'sppcfw_duplicate_template_' . $t_id );
					$del_url  = wp_nonce_url( admin_url( 'admin.php?page=sppcfw-builder-all-templates&action=delete&template_id=' . esc_attr( $t_id ) ), 'sppcfw_delete_template_' . $t_id );

					$scope = isset( $tpl['conditions']['scope'] ) ? $tpl['conditions']['scope'] : 'entire';
					$scope_label = 'entire' === $scope ? __( 'Entire Website', 'single-product-customizer' ) : ( 'category' === $scope ? __( 'Specific Category', 'single-product-customizer' ) : __( 'Specific Product', 'single-product-customizer' ) );
					$scope_bg    = 'entire' === $scope ? '#dbeafe' : ( 'category' === $scope ? '#fef3c7' : '#e0e7ff' );
					$scope_color = 'entire' === $scope ? '#1e40af' : ( 'category' === $scope ? '#92400e' : '#3730a3' );

					$status       = isset( $tpl['status'] ) ? $tpl['status'] : 'published';
					$status_label = 'published' === $status ? __( 'Published', 'single-product-customizer' ) : __( 'Draft', 'single-product-customizer' );
					$status_bg    = 'published' === $status ? '#dcfce7' : '#f1f5f9';
					$status_color = 'published' === $status ? '#166534' : '#475569';
					?>
					<tr>
						<td style="padding: 14px 16px; vertical-align: middle;">
							<strong style="font-size: 14px;">
								<a href="<?php echo esc_url( $edit_url ); ?>" style="color: #0f172a; text-decoration: none;" onmouseover="this.style.color='#9333ea'" onmouseout="this.style.color='#0f172a'">
									<?php echo esc_html( ! empty( $tpl['title'] ) ? $tpl['title'] : __( 'Untitled Template', 'single-product-customizer' ) ); ?>
								</a>
							</strong>
							<div class="row-actions" style="margin-top: 4px; font-size: 11px;">
								<span class="edit"><a href="<?php echo esc_url( $edit_url ); ?>" style="color: #9333ea; font-weight: 600;"><?php esc_html_e( 'Edit in Builder', 'single-product-customizer' ); ?></a> | </span>
								<span class="duplicate"><a href="<?php echo esc_url( $dup_url ); ?>" style="color: #2563eb;"><?php esc_html_e( 'Duplicate', 'single-product-customizer' ); ?></a> | </span>
								<span class="delete"><a href="<?php echo esc_url( $del_url ); ?>" style="color: #dc2626;" onclick="return confirm('<?php esc_attr_e( 'Are you sure you want to delete this template?', 'single-product-customizer' ); ?>')"><?php esc_html_e( 'Delete', 'single-product-customizer' ); ?></a></span>
							</div>
						</td>
						<td style="padding: 14px 16px; vertical-align: middle;">
							<span style="background: <?php echo esc_attr( $scope_bg ); ?>; color: <?php echo esc_attr( $scope_color ); ?>; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-block;">
								<?php echo esc_html( $scope_label ); ?>
							</span>
						</td>
						<td style="padding: 14px 16px; vertical-align: middle;">
							<span style="background: <?php echo esc_attr( $status_bg ); ?>; color: <?php echo esc_attr( $status_color ); ?>; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
								<?php echo esc_html( $status_label ); ?>
							</span>
						</td>
						<td style="padding: 14px 16px; vertical-align: middle; color: #64748b; font-size: 12px; font-mono;">
							<?php echo esc_html( isset( $tpl['updated_at'] ) ? $tpl['updated_at'] : 'N/A' ); ?>
						</td>
						<td style="padding: 14px 16px; vertical-align: middle; text-align: right;">
							<a href="<?php echo esc_url( $edit_url ); ?>" class="button button-secondary" style="font-size: 12px; font-weight: 600; border-color: #9333ea; color: #9333ea;">
								<span class="dashicons dashicons-edit" style="font-size: 14px; margin-top: 3px;"></span>
								<?php esc_html_e( 'Edit', 'single-product-customizer' ); ?>
							</a>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>
</div>
