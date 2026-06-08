<?php
/**
 * Plugin Name: SmartTechPro PayPal WhatsApp Gateway Pro
 * Plugin URI: https://smarttechpro.com/plugins/paypal-whatsapp-gateway-pro
 * Description: A manual PayPal payment workflow managed through WhatsApp support for WooCommerce. Allows customers to request instructions instantly on checkout.
 * Version: 1.0.0
 * Author: SmartTechPro
 * Author URI: https://smarttechpro.com
 * Text Domain: smarttechpro-paypal-whatsapp-gateway-pro
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * WC requires at least: 10.0
 * WC prefers at least: 10.0
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

// Constants
define('STPW_VERSION', '1.0.0');
define('STPW_PATH', plugin_dir_path(__FILE__));
define('STPW_URL', plugin_dir_url(__FILE__));
define('STPW_BASENAME', plugin_basename(__FILE__));

// Declare WooCommerce HPOS Compatibility
add_action('before_woocommerce_init', function() {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

// Autoload/Include all required classes
require_once STPW_PATH . 'includes/class-install.php';
require_once STPW_PATH . 'includes/class-hpos.php';
require_once STPW_PATH . 'includes/class-logger.php';
require_once STPW_PATH . 'includes/class-order-statuses.php';
require_once STPW_PATH . 'includes/class-whatsapp.php';
require_once STPW_PATH . 'includes/class-emails.php';
require_once STPW_PATH . 'includes/class-admin-dashboard.php';
require_once STPW_PATH . 'includes/class-admin-orders.php';
require_once STPW_PATH . 'includes/class-admin-logs.php';

// Activation & Deactivation Hooks
register_activation_hook(__FILE__, ['STPW_Install', 'activate']);
register_deactivation_hook(__FILE__, ['STPW_Install', 'deactivate']);

// Initialize Core Hooks
add_action('plugins_loaded', 'stpw_init_gateway_pro');

function stpw_init_gateway_pro() {
    // Ensure WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return;
    }

    // Load gateway class safely only after ensuring WooCommerce is active
    require_once STPW_PATH . 'includes/class-gateway.php';

    // Register WooCommerce Gateway Class
    add_filter('woocommerce_payment_gateways', 'stpw_add_gateway_class');
    
    // Load text domain
    load_plugin_textdomain('smarttechpro-paypal-whatsapp-gateway-pro', false, dirname(plugin_basename(__FILE__)) . '/languages');
}

/**
 * Register Gateway class in WooCommerce settings
 */
function stpw_add_gateway_class($methods) {
    $methods[] = 'STPW_Gateway';
    return $methods;
}
