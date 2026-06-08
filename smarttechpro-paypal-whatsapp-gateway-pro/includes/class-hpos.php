<?php
/**
 * WooCommerce Custom Order Table Compatibility (HPOS) Helper
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_HPOS {

    /**
     * Declares custom orders table compatibility for the gateway
     */
    public static function declare_hpos_compatibility() {
        if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
                'custom_order_tables',
                dirname(__DIR__) . '/smarttechpro-paypal-whatsapp-gateway-pro.php',
                true
            );
        }
    }

    /**
     * Safe Order-Getter utilizing native WC APIs (No Query Posts directly!)
     *
     * @param int $order_id
     * @return WC_Order|false
     */
    public static function get_order($order_id) {
        if (!function_exists('wc_get_order')) {
            return false;
        }
        return wc_get_order($order_id);
    }
}

// Hook if needed
add_action('before_woocommerce_init', ['STPW_HPOS', 'declare_hpos_compatibility']);
