<?php
/**
 * Run in a disposable WordPress install with WooCommerce and this plugin active.
 */
if (!defined('DIGITAVISTA_PIE_DISPOSABLE_TEST')) {
    exit;
}

require '/wordpress/wp-load.php';

function pie_check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function pie_request(string $method = 'GET'): WP_REST_Response
{
    return rest_do_request(new WP_REST_Request($method, '/digita-vista-pie/v1/capabilities'));
}

pie_check(pie_request()->get_status() === 401, 'Guest denied');
$subscriber = wp_insert_user([
    'user_login' => 'pie-subscriber',
    'user_pass' => wp_generate_password(),
    'role' => 'subscriber',
]);
pie_check(is_int($subscriber), 'Subscriber created');
wp_set_current_user($subscriber);
pie_check(pie_request()->get_status() === 403, 'Subscriber denied');
wp_set_current_user(1);
pie_check(pie_request('POST')->get_status() === 404, 'No write route');

$plugin = WP_PLUGIN_DIR . '/single-product-customizer';
$copy = '/tmp/pie-embedded-runtime-copy.php';
copy($plugin . '/includes/pie/Runtime.php', $copy);
require $copy;
\DigitaVista\PIE\V1\Runtime::boot();
$restCallbacks = $GLOBALS['wp_filter']['rest_api_init']->callbacks[10];
$menuCallbacks = $GLOBALS['wp_filter']['admin_menu']->callbacks[10];
pie_check(count(array_filter($restCallbacks, static fn ($item) => $item['function'] === [
    \DigitaVista\PIE\V1\Runtime::class, 'registerRoutes',
])) === 1, 'One REST registration');
pie_check(count(array_filter($menuCallbacks, static fn ($item) => $item['function'] === [
    \DigitaVista\PIE\V1\Runtime::class, 'registerMenu',
])) === 1, 'One assistant menu registration');

$fixture = static function (string $id): Closure {
    return static function (\DigitaVista\PIE\V1\CapabilityRegistry $registry) use ($id): void {
        $registry->register($id, static fn (): array => [
            'label' => '<script>' . $id,
            'features' => [],
        ]);
    };
};
$hook = 'digitavista_pie_register_products_v1';
$ids = ['giveaway-lottery', 'variation-monster', 'gift-card'];
for ($combination = 0; $combination < 8; ++$combination) {
    $active = [];
    $expected = ['single-product-customizer'];
    foreach ($ids as $index => $id) {
        if (($combination & (1 << $index)) !== 0) {
            $active[$id] = $fixture($id);
            add_action($hook, $active[$id]);
            $expected[] = $id;
        }
    }

    $response = pie_request();
    $products = (array) $response->get_data()['products'];
    sort($expected);
    pie_check(array_keys($products) === $expected, 'Correct active products for combination ' . $combination);
    pie_check($response->get_status() === 200, 'Admin can read');
    pie_check($products['single-product-customizer']['features']['quantity_buttons']['configured'], 'Reads real SPC setting');
    ob_start();
    \DigitaVista\PIE\V1\Runtime::render();
    $page = ob_get_clean();
    pie_check(substr_count($page, '<h1>DigitaVista Assistant</h1>') === 1, 'One assistant interface');
    pie_check(!str_contains($page, '<script>'), 'Product labels escaped');
    foreach ($active as $callback) {
        remove_action($hook, $callback);
    }
}
pie_check(array_keys((array) pie_request()->get_data()['products']) === ['single-product-customizer'], 'Removed integrations disappear');
file_put_contents('/out/pie-embedded-passed', get_bloginfo('version') . ' / ' . PHP_VERSION . ' / ' . WC_VERSION);
