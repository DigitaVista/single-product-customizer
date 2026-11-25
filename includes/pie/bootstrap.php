<?php
/**
 * DigitaVista Assistant runtime election (protocol v1).
 *
 * Every product that bundles the runtime includes this file and offers its copy.
 * The first included copy defines these two functions, so their behaviour is a
 * frozen contract: never change it within the v1 namespace. The highest offered
 * runtime version is loaded once, after all active plugins are included, which
 * makes the result independent of activation and load order.
 */
declare(strict_types=1);

if (!defined('ABSPATH')) {
    return;
}

if (!function_exists('digitavista_pie_v1_offer')) {
    function digitavista_pie_v1_offer(string $version, string $dir): void
    {
        if (!preg_match('/^\d+\.\d+\.\d+$/', $version)) {
            return;
        }

        $GLOBALS['digitavista_pie_v1_offers'][$dir] = $version;
        if (did_action('plugins_loaded')) {
            digitavista_pie_v1_elect();
        } elseif (!has_action('plugins_loaded', 'digitavista_pie_v1_elect')) {
            add_action('plugins_loaded', 'digitavista_pie_v1_elect', 1);
        }
    }

    function digitavista_pie_v1_elect(): void
    {
        if (class_exists('DigitaVista\\PIE\\V1\\Runtime', false)) {
            return;
        }

        $offers = $GLOBALS['digitavista_pie_v1_offers'] ?? [];
        if (!is_array($offers) || $offers === []) {
            return;
        }

        $selectedDir = null;
        $selectedVersion = null;
        ksort($offers, SORT_STRING);
        foreach ($offers as $dir => $version) {
            if ($selectedVersion === null || version_compare($version, $selectedVersion, '>')) {
                $selectedDir = $dir;
                $selectedVersion = $version;
            }
        }

        require_once $selectedDir . '/Runtime.php';
        if (class_exists('DigitaVista\\PIE\\V1\\Runtime', false)) {
            \DigitaVista\PIE\V1\Runtime::boot($selectedVersion, $offers);
        }
    }
}
