<?php
/**
 * Single Product Customizer — Black Friday 2026 Admin Notice.
 *
 * Shows from 10 Nov 2026 to 30 Nov 2026 23:59:59 (site time), only for admins
 * who don't have Single Product Customizer Pro active.
 *
 * Preview before the start date: add ?sppcfw_bf_preview=1 to any admin URL.
 *
 * @package single-product-customizer
 */

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'SPPCFW_Black_Friday_Notice' ) ) {

	/**
	 * Black Friday admin notice.
	 */
	class SPPCFW_Black_Friday_Notice {

		/** Sale window (site time). */
		const START = '2026-11-10 00:00:00';
		const END   = '2026-11-30 23:59:59';

		/** Discount shown in the banner. */
		const DISCOUNT = 40;

		/** Option key for dismiss state. */
		const OPTION = 'sppcfw_black_friday_2026_notice';

		/** AJAX action and nonce. */
		const AJAX  = 'sppcfw_dismiss_black_friday_notice';
		const NONCE = 'sppcfw_black_friday_notice_nonce';

		/**
		 * Deal page URL.
		 *
		 * @var string
		 */
		private $deal_url = 'https://www.webcartisan.com/black-friday-2026/';

		/**
		 * Flag to ensure notice renders only once per page.
		 *
		 * @var bool
		 */
		private $rendered = false;

		/**
		 * Constructor.
		 */
		public function __construct() {
			// in_admin_header prints the banner at the top of the page, above the page title.
			add_action( 'in_admin_header', array( $this, 'render' ) );
			// Fallback to admin_notices in case in_admin_header is not fired on certain admin screens.
			add_action( 'admin_notices', array( $this, 'render' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'wp_ajax_' . self::AJAX, array( $this, 'ajax_dismiss' ) );
		}

		/**
		 * Current site-time timestamp.
		 *
		 * @return int
		 */
		private function now() {
			return (int) current_time( 'timestamp' ); // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested -- compared with site-time dates.
		}

		/**
		 * Site-time timestamp for a Y-m-d H:i:s string.
		 *
		 * @param string $datetime Date.
		 * @return int
		 */
		private function ts( $datetime ) {
			return (int) strtotime( $datetime );
		}

		/**
		 * Check if Single Product Customizer Pro is currently active.
		 *
		 * Checks active state only (does NOT block if Pro is merely installed/deactivated).
		 *
		 * @return bool
		 */
		private function is_pro_active() {
			// 1. Pro runtime constant.
			if ( defined( 'SPPCFW_PRO_ACTIVE' ) && SPPCFW_PRO_ACTIVE ) {
				return true;
			}

			// 2. Pro version/file constants or classes.
			if ( defined( 'SPPCFW_PRO_VERSION' ) || defined( 'SPPCFW_PRO_PLUGIN_FILE' ) || class_exists( 'SPPCFW_Pro' ) ) {
				return true;
			}

			// 3. Free plugin helper function.
			if ( function_exists( 'sppcfw_is_pro_active' ) && sppcfw_is_pro_active() ) {
				return true;
			}

			// 4. WordPress active plugins option.
			$active_plugins = (array) get_option( 'active_plugins', array() );
			foreach ( $active_plugins as $plugin ) {
				if ( false !== strpos( $plugin, 'single-product-customizer-pro.php' ) ) {
					return true;
				}
			}

			// 5. Multisite active sitewide plugins.
			if ( is_multisite() ) {
				$network_active = (array) get_site_option( 'active_sitewide_plugins', array() );
				foreach ( array_keys( $network_active ) as $plugin ) {
					if ( false !== strpos( $plugin, 'single-product-customizer-pro.php' ) ) {
						return true;
					}
				}
			}

			return false;
		}

		/**
		 * Should the banner show?
		 *
		 * @return bool
		 */
		private function should_show() {
			if ( ! current_user_can( 'manage_options' ) ) {
				return false;
			}

			$now     = $this->now();
			$preview = ( isset( $_GET['sppcfw_bf_preview'] ) && '1' === $_GET['sppcfw_bf_preview'] )
				|| ( isset( $_GET['gl_bf_preview'] ) && '1' === $_GET['gl_bf_preview'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only preview flag.

			if ( ! $preview ) {
				// Hide if Pro is currently active.
				if ( $this->is_pro_active() ) {
					return false;
				}

				// Never after the sale ends or before the sale starts.
				if ( $now > $this->ts( self::END ) || $now < $this->ts( self::START ) ) {
					return false;
				}

				$status = get_option( self::OPTION, array() );
				if ( ! empty( $status['dismissed_until'] ) && $now < (int) $status['dismissed_until'] ) {
					return false;
				}
			} else {
				// In preview mode, allow viewing up to the sale end date.
				if ( $now > $this->ts( self::END ) ) {
					return false;
				}
			}

			return true;
		}

		/**
		 * Enqueue notice scripts and styles.
		 *
		 * @return void
		 */
		public function enqueue_scripts() {
			if ( ! $this->should_show() ) {
				return;
			}

			$version = defined( 'SPPCFW_VERSION' ) ? SPPCFW_VERSION : '1.1.1';

			wp_enqueue_style(
				'sppcfw-sales-campaign-notice',
				SPPCFW_DIR_URL . 'backend/assets/css/sales-campaign-notice.css',
				array(),
				$version
			);

			wp_enqueue_script(
				'sppcfw-sales-campaign-notice',
				SPPCFW_DIR_URL . 'backend/assets/js/sppcfw-admin-notice.js',
				array(),
				$version,
				true
			);

			wp_localize_script(
				'sppcfw-sales-campaign-notice',
				'sppcfwBlackFridayNotice',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( self::NONCE ),
					'action'   => self::AJAX,
				)
			);
		}

		/**
		 * Print the banner.
		 *
		 * @return void
		 */
		public function render() {
			if ( $this->rendered ) {
				return;
			}

			if ( ! $this->should_show() ) {
				return;
			}

			$this->rendered = true;

			$end_ts    = $this->ts( self::END );
			$seconds   = max( 0, $end_ts - $this->now() );
			$days_left = (int) floor( $seconds / DAY_IN_SECONDS );
			$url       = add_query_arg(
				array(
					'utm_source'   => 'single-product-customizer-free',
					'utm_medium'   => 'admin-notice',
					'utm_campaign' => 'black-friday-2026',
				),
				$this->deal_url
			);
			$discount  = (int) self::DISCOUNT;
			?>
			<div class="sppcfw-bf sales-campaign-notice" id="sppcfw-bf-notice" role="region" aria-label="<?php esc_attr_e( 'Black Friday Sale', 'single-product-customizer' ); ?>" data-seconds="<?php echo esc_attr( (string) $seconds ); ?>" data-ajax="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" data-action="<?php echo esc_attr( self::AJAX ); ?>" data-nonce="<?php echo esc_attr( wp_create_nonce( self::NONCE ) ); ?>">
				<button type="button" class="sppcfw-bf-close" aria-label="<?php esc_attr_e( 'Dismiss this notice for 1 day.', 'single-product-customizer' ); ?>">&times;</button>

				<div class="sppcfw-bf-badge" aria-hidden="true">
					<span class="sppcfw-bf-badge-num"><?php echo esc_html( $discount ); ?><small>%</small></span>
					<span class="sppcfw-bf-badge-off"><?php esc_html_e( 'OFF', 'single-product-customizer' ); ?></span>
				</div>

				<div class="sppcfw-bf-body">
					<div class="sppcfw-bf-eyebrow">
						<span class="sppcfw-bf-dot" aria-hidden="true"></span>
						<?php esc_html_e( 'Black Friday Sale', 'single-product-customizer' ); ?>
						<span class="sppcfw-bf-sep" aria-hidden="true">·</span>
						<?php esc_html_e( 'Ends 30 November', 'single-product-customizer' ); ?>
					</div>
					<h3 class="sppcfw-bf-title">
						<?php
						/* translators: %d: discount percentage. */
						printf( esc_html__( 'Get %d%% OFF Single Product Customizer Pro', 'single-product-customizer' ), $discount ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- int.
						?>
					</h3>
					<p class="sppcfw-bf-text">
						<?php esc_html_e( 'Upgrade your WooCommerce store with Single Product Customizer Pro! Unlock advanced product layout builder, custom tabs, variation tables, and min/max quantities.', 'single-product-customizer' ); ?>
					</p>
				</div>

				<div class="sppcfw-bf-side">
					<div class="sppcfw-bf-timer" aria-live="off">
						<span class="sppcfw-bf-timer-label"><?php esc_html_e( 'Deal ends in', 'single-product-customizer' ); ?></span>
						<span class="sppcfw-bf-timer-units">
							<span><b data-u="d"><?php echo esc_html( str_pad( (string) $days_left, 2, '0', STR_PAD_LEFT ) ); ?></b><i><?php esc_html_e( 'Days', 'single-product-customizer' ); ?></i></span>
							<span><b data-u="h">00</b><i><?php esc_html_e( 'Hrs', 'single-product-customizer' ); ?></i></span>
							<span><b data-u="m">00</b><i><?php esc_html_e( 'Min', 'single-product-customizer' ); ?></i></span>
							<span><b data-u="s">00</b><i><?php esc_html_e( 'Sec', 'single-product-customizer' ); ?></i></span>
						</span>
					</div>
					<a class="sppcfw-bf-cta" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer">
						<?php
						/* translators: %d: discount percentage. */
						printf( esc_html__( 'Claim %d%% OFF', 'single-product-customizer' ), $discount ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- int.
						?>
						<span aria-hidden="true">→</span>
					</a>
				</div>
			</div>
			<?php
		}

		/**
		 * AJAX: snooze for 1 day.
		 *
		 * @return void
		 */
		public function ajax_dismiss() {
			check_ajax_referer( self::NONCE, 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Unauthorized', 'single-product-customizer' ) ), 403 );
			}

			update_option( self::OPTION, array( 'dismissed_until' => $this->now() + DAY_IN_SECONDS ), false );
			wp_send_json_success();
		}
	}

	new SPPCFW_Black_Friday_Notice();
}
