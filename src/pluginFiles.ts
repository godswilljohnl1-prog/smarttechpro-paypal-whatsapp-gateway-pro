export interface PluginFile {
  path: string;
  name: string;
  content: string;
  language: string;
  category: "core" | "include" | "template" | "asset";
}

export const PLUGIN_FILES: PluginFile[] = [
  {
    path: "smarttechpro-paypal-whatsapp-gateway-pro.php",
    name: "smarttechpro-paypal-whatsapp-gateway-pro.php",
    language: "php",
    category: "core",
    content: `<?php
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
    if (class_exists(\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::class)) {
         \\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

// Autoload/Include all required classes
require_once STPW_PATH . 'includes/class-install.php';
require_once STPW_PATH . 'includes/class-hpos.php';
require_once STPW_PATH . 'includes/class-logger.php';
require_once STPW_PATH . 'includes/class-order-statuses.php';
require_once STPW_PATH . 'includes/class-whatsapp.php';
require_once STPW_PATH . 'includes/class-gateway.php';
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
}`
  },
  {
    path: "includes/class-install.php",
    name: "class-install.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Plugin Installer / Database Creator
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Install {

    /**
     * Cache the table name
     */
    private static function get_table_name() {
        global $wpdb;
        return $wpdb->prefix . 'stpw_logs';
    }

    /**
     * Run installer routines on plugin activation
     */
    public static function activate() {
        global $wpdb;

        $table_name = self::get_table_name();
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            order_id bigint(20) NOT NULL,
            action varchar(100) NOT NULL,
            message text NOT NULL,
            user_id bigint(20) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (id),
            KEY order_id (order_id),
            KEY action (action)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);

        // Track gateway enabled / plugin installed initial log
        $current_user_id = get_current_user_id();
        STPW_Logger::log(0, 'Gateway Installed', 'SmartTechPro PayPal WhatsApp Gateway Pro activated successfully.', $current_user_id);
    }

    /**
     * Deactivation routine
     */
    public static function deactivate() {
        $current_user_id = get_current_user_id();
        STPW_Logger::log(0, 'Gateway Disabled', 'SmartTechPro PayPal WhatsApp Gateway Pro deactivated.', $current_user_id);
    }
}`
  },
  {
    path: "includes/class-logger.php",
    name: "class-logger.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Database Logging Handler
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Logger {

    /**
     * Store logs in wp_stpw_logs table
     *
     * @param int|string $order_id WC Order ID or 0 for system
     * @param string $action Tracking tag (e.g. Gateway Enabled, WhatsApp Redirect, Paid, Failed)
     * @param string $message Descriptions of details
     * @param int $user_id WP User ID representing the action executor
     */
    public static function log($order_id, $action, $message, $user_id = 0) {
        global $wpdb;

        if (empty($user_id)) {
            $user_id = get_current_user_id();
        }

        $table_name = $wpdb->prefix . 'stpw_logs';

        $raw_data = [
            'order_id'   => intval($order_id),
            'action'     => sanitize_text_field($action),
            'message'    => sanitize_textarea_field($message),
            'user_id'    => intval($user_id),
            'created_at' => current_time('mysql'),
        ];

        // Format declarations to ensure types
        $format = ['%d', '%s', '%s', '%d', '%s'];

        $wpdb->insert($table_name, $raw_data, $format);
    }
}`
  },
  {
    path: "includes/class-hpos.php",
    name: "class-hpos.php",
    language: "php",
    category: "include",
    content: `<?php
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
        if (class_exists(\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::class)) {
            \\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility(
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
add_action('before_woocommerce_init', ['STPW_HPOS', 'declare_hpos_compatibility']);`
  },
  {
    path: "includes/class-order-statuses.php",
    name: "class-order-statuses.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Register and manages custom order statuses
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Order_Statuses {

    public static function init() {
        add_action('init', [__CLASS__, 'register_statuses']);
        add_filter('wc_order_statuses', [__CLASS__, 'add_statuses_to_list']);
        add_filter('woocommerce_reports_order_statuses', [__CLASS__, 'include_in_reports'], 10, 2);
        add_filter('bulk_actions-edit-shop_order', [__CLASS__, 'add_bulk_actions']);
        add_filter('handle_bulk_actions-edit-shop_order', [__CLASS__, 'handle_bulk_actions'], 10, 3);
        
        // Let WooCommerce Order Lists hook filter selection correctly
        add_filter('woocommerce_analytics_order_statuses', [__CLASS__, 'analytics_statuses']);
    }

    /**
     * Register Custom WooCommerce Post Statuses
     */
    public static function register_statuses() {
        register_post_status('wc-awaiting-paypal', [
            'label'                     => _x('Awaiting PayPal', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            'label_count'               => _n_noop('Awaiting PayPal <span class="count">(%s)</span>', 'Awaiting PayPal <span class="count">(%s)</span>', 'smarttechpro-paypal-whatsapp-gateway-pro'),
        ]);

        register_post_status('wc-paypal-review', [
            'label'                     => _x('PayPal Review', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            'label_count'               => _n_noop('PayPal Review <span class="count">(%s)</span>', 'PayPal Review <span class="count">(%s)</span>', 'smarttechpro-paypal-whatsapp-gateway-pro'),
        ]);

        register_post_status('wc-paypal-paid', [
            'label'                     => _x('PayPal Paid', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            'label_count'               => _n_noop('PayPal Paid <span class="count">(%s)</span>', 'PayPal Paid <span class="count">(%s)</span>', 'smarttechpro-paypal-whatsapp-gateway-pro'),
        ]);

        register_post_status('wc-paypal-failed', [
            'label'                     => _x('PayPal Failed', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            'label_count'               => _n_noop('PayPal Failed <span class="count">(%s)</span>', 'PayPal Failed <span class="count">(%s)</span>', 'smarttechpro-paypal-whatsapp-gateway-pro'),
        ]);
    }

    /**
     * Add Custom Statuses list representing WC Status Keys
     */
    public static function add_statuses_to_list($order_statuses) {
        $new_statuses = [];

        foreach ($order_statuses as $key => $label) {
            $new_statuses[$key] = $label;

            // Insert Awaiting right after pending payment
            if ('wc-pending' === $key) {
                $new_statuses['wc-awaiting-paypal'] = _x('Awaiting PayPal', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro');
                $new_statuses['wc-paypal-review']   = _x('PayPal Review', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro');
                $new_statuses['wc-paypal-paid']     = _x('PayPal Paid', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro');
                $new_statuses['wc-paypal-failed']   = _x('PayPal Failed', 'Order status', 'smarttechpro-paypal-whatsapp-gateway-pro');
            }
        }

        return $new_statuses;
    }

    /**
     * Include customs in WooCommerce reports sales numbers
     */
    public static function include_in_reports($statuses) {
        $statuses[] = 'wc-awaiting-paypal';
        $statuses[] = 'wc-paypal-review';
        $statuses[] = 'wc-paypal-paid';
        return $statuses;
    }

    /**
     * Bulk actions in orders list table
     */
    public static function add_bulk_actions($actions) {
        $actions['mark_stpw_review'] = __('Change status to PayPal Review', 'smarttechpro-paypal-whatsapp-gateway-pro');
        $actions['mark_stpw_paid']   = __('Change status to PayPal Paid', 'smarttechpro-paypal-whatsapp-gateway-pro');
        $actions['mark_stpw_failed'] = __('Change status to PayPal Failed', 'smarttechpro-paypal-whatsapp-gateway-pro');
        return $actions;
    }

    /**
     * Process order bulk action selection
     */
    public static function handle_bulk_actions($redirect_to, $action, $post_ids) {
        if (!in_array($action, ['mark_stpw_review', 'mark_stpw_paid', 'mark_stpw_failed'], true)) {
            return $redirect_to;
        }

        $new_status = '';
        $log_tag = '';
        if ($action === 'mark_stpw_review') {
            $new_status = 'paypal-review';
            $log_tag = 'Review';
        } elseif ($action === 'mark_stpw_paid') {
            $new_status = 'paypal-paid';
            $log_tag = 'Paid';
        } elseif ($action === 'mark_stpw_failed') {
            $new_status = 'paypal-failed';
            $log_tag = 'Failed';
        }

        $changed = 0;
        foreach ($post_ids as $order_id) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order->update_status($new_status, sprintf(__('Status updated via orders list bulk action.', 'smarttechpro-paypal-whatsapp-gateway-pro')));
                STPW_Logger::log($order_id, $log_tag, 'Order status changed via Admin bulk actions.', get_current_user_id());
                $changed++;
            }
        }

        $redirect_to = add_query_arg([
            'stpw_bulk_changed' => $changed,
            'stpw_bulk_action'  => $log_tag
        ], $redirect_to);

        return $redirect_to;
    }

    /**
     * Analytics Compatibility
     */
    public static function analytics_statuses($statuses) {
        $statuses[] = 'wc-awaiting-paypal';
        $statuses[] = 'wc-paypal-review';
        $statuses[] = 'wc-paypal-paid';
        $statuses[] = 'wc-paypal-failed';
        return $statuses;
    }
}

STPW_Order_Statuses::init();`
  },
  {
    path: "includes/class-whatsapp.php",
    name: "class-whatsapp.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * WhatsApp Template Parser and Link Dispatcher
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_WhatsApp {

    /**
     * Default message template to fall back on if empty
     */
    public static function get_default_template() {
        return "Hello {support_name},\\n\\nI would like to pay via PayPal.\\n\\nOrder ID: #{order_id}\\n\\nCustomer: {customer_name}\\nEmail: {customer_email}\\nPhone: {customer_phone}\\n\\nProducts:\\n{product_list}\\n\\nTotal: {currency} {order_total}\\n\\nPlease send PayPal payment instructions.";
    }

    /**
     * Process tags and compile output string
     *
     * @param WC_Order $order WooCommerce Order Instance
     * @return string Compiled details
     */
    public static function compile_message($order) {
        if (!$order) {
            return '';
        }

        // Fetch settings or defaults
        $gateway_settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        $template = !empty($gateway_settings['custom_whatsapp_template']) ? $gateway_settings['custom_whatsapp_template'] : self::get_default_template();
        
        $support_name = !empty($gateway_settings['support_name']) ? $gateway_settings['support_name'] : 'Support';
        $paypal_email = !empty($gateway_settings['paypal_email']) ? $gateway_settings['paypal_email'] : get_option('admin_email');
        $site_name = get_bloginfo('name');

        // Extract products
        $product_lines = [];
        foreach ($order->get_items() as $item_id => $item) {
            $product_name  = $item->get_name();
            $quantity      = $item->get_quantity();
            $product_lines[] = "- " . $product_name . " x" . $quantity;
        }
        $product_list = implode("\\n", $product_lines);

        // Map variables
        $replacements = [
            '{order_id}'       => $order->get_order_number(),
            '{customer_name}'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            '{customer_email}' => $order->get_billing_email(),
            '{customer_phone}' => $order->get_billing_phone(),
            '{order_total}'    => $order->get_total(),
            '{currency}'       => $order->get_currency(),
            '{product_list}'   => $product_list,
            '{paypal_email}'   => $paypal_email,
            '{support_name}'   => $support_name,
            '{site_name}'      => $site_name,
        ];

        $compiled = str_replace(
            array_keys($replacements),
            array_values($replacements),
            $template
        );

        return $compiled;
    }

    /**
     * Craft the safe formatted wa.me action redirect
     *
     * @param WC_Order $order
     * @return string Escape URL
     */
    public static function get_redirect_url($order) {
        $gateway_settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        $phone = !empty($gateway_settings['support_whatsapp_number']) ? $gateway_settings['support_whatsapp_number'] : '';
        
        // Sanitize phone number (digits only, optionally containing plus in some integrations, but wa.me prefers digits only)
        $phone_sanitized = preg_replace('/[^0-9]/', '', $phone);
        
        $message = self::compile_message($order);
        
        $encoded_message = rawurlencode($message);

        return 'https://wa.me/' . $phone_sanitized . '?text=' . $encoded_message;
    }
}`
  },
  {
    path: "includes/class-settings.php",
    name: "class-settings.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Gateway Setting Fields Definition
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Settings {

    /**
     * Get forms settings definitions for gateway
     *
     * @return array
     */
    public static function get_fields() {
        return [
            'enabled' => [
                'title'       => __('Enable Gateway', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Enable SmartTechPro PayPal WhatsApp Gateway Pro', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'no'
            ],
            'title' => [
                'title'       => __('Gateway Title', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('Title shown to customers during WooCommerce checkout.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Pay via PayPal (WhatsApp Support)', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'description' => [
                'title'       => __('Gateway Description', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Description shown to customers during WooCommerce checkout.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Request PayPal payment instructions through WhatsApp directly to complete your purchase manually with support.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'support_name' => [
                'title'       => __('Support Representative Name', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('Name of support representative (binds to {support_name}).', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Support Desk', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'support_whatsapp_number' => [
                'title'       => __('Support WhatsApp Number', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('WhatsApp phone number (include international calling code, e.g., +2348012345678). Used for redirecting chat.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => '',
                'desc_tip'    => true,
            ],
            'paypal_email' => [
                'title'       => __('PayPal Email Address', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'email',
                'description' => __('Your PayPal account email for compiling instructions (binds to {paypal_email}).', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => get_option('admin_email'),
                'desc_tip'    => true,
            ],
            'thank_you_message' => [
                'title'       => __('Thank You Page Message', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Extra guidelines printed on checkout thank-you page.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Thank you for your order! Please use the WhatsApp button below to request PayPal payment instructions if your browser did not redirect automatically.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'custom_whatsapp_template' => [
                'title'       => __('Custom WhatsApp Template', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Configure output template text sent to support. You can use tags: {order_id}, {customer_name}, {customer_email}, {customer_phone}, {order_total}, {currency}, {product_list}, {paypal_email}, {support_name}, {site_name}', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => STPW_WhatsApp::get_default_template(),
                'desc_tip'    => true,
            ],
            'enable_logging' => [
                'title'       => __('Enable DB Logging', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Log gateway activities and transaction audit steps to custom table', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'enable_customer_emails' => [
                'title'       => __('Enable Customer Emails', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Send customers transactional alerts (Review, Confirmations, Failures)', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'enable_admin_emails' => [
                'title'       => __('Enable Admin Emails', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Alert shop administrators for new PayPal requests and manual transitions', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
        ];
    }
}`
  },
  {
    path: "includes/class-gateway.php",
    name: "class-gateway.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * WooCommerce Custom Payment Gateway Implementation
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Gateway extends WC_Payment_Gateway {

    /**
     * Constructor for the gateway.
     */
    public function __construct() {
        $this->id                 = 'stpw_paypal_whatsapp';
        $this->icon               = apply_filters('woocommerce_stpw_icon', STPW_URL . 'assets/paypal-whatsapp-icon.png');
        $this->has_fields         = false;
        $this->method_title       = __('SmartTechPro PayPal WhatsApp', 'smarttechpro-paypal-whatsapp-gateway-pro');
        $this->method_description = __('Automates support messaging to coordinate manual PayPal checkout via customer WhatsApp chats.', 'smarttechpro-paypal-whatsapp-gateway-pro');

        // Load settings schemas
        $this->init_form_fields();
        $this->init_settings();

        // Bind options configurations
        $this->title        = $this->get_option('title');
        $this->description  = $this->get_option('description');
        $this->enabled      = $this->get_option('enabled');

        // Save settings hook
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);

        // Extra UI helpers on Order Thank You Page
        add_action('woocommerce_thankyou_' . $this->id, [$this, 'thankyou_page_output']);
        add_action('woocommerce_email_before_order_table', [$this, 'email_instructions'], 10, 3);
    }

    /**
     * Register Gateway Config form fields from settings helper
     */
    public function init_form_fields() {
        if (class_exists('STPW_Settings')) {
            $this->form_fields = STPW_Settings::get_fields();
        }
    }

    /**
     * Process checkout transaction action
     *
     * @param int $order_id
     * @return array Array payload containing redirect and status success.
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);

        if (!$order) {
            return [
                'result'   => 'failure',
                'redirect' => '',
            ];
        }

        // Set status to Awaiting PayPal
        $order->update_status('awaiting-paypal', __('Checkout finished with PayPal WhatsApp payment method.', 'smarttechpro-paypal-whatsapp-gateway-pro'));

        // Clear cart
        WC()->cart->empty_cart();

        // Fetch WhatsApp redirect URL
        $whatsapp_url = STPW_WhatsApp::get_redirect_url($order);

        // Audit check
        STPW_Logger::log(
            $order_id,
            'WhatsApp Redirect',
            sprintf(__('Customer launched manual WhatsApp checkout flow. Redirect URL: %s', 'smarttechpro-paypal-whatsapp-gateway-pro'), $whatsapp_url)
        );

        // Track order created event
        STPW_Logger::log(
            $order_id,
            'Order Created',
            __('Manual payment order generated.', 'smarttechpro-paypal-whatsapp-gateway-pro')
        );

        // Return order status page or wa.me redirect
        // For standard automatic redirect, returning wa.me URL works instantly!
        return [
            'result'   => 'success',
            'redirect' => $whatsapp_url,
        ];
    }

    /**
     * Render manual backup actions on thank you screen
     *
     * @param int $order_id
     */
    public function thankyou_page_output($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $whatsapp_url = STPW_WhatsApp::get_redirect_url($order);
        $message      = $this->get_option('thank_you_message');
        ?>
        <div class="stpw-whatsapp-thankyou-box" style="margin: 25px 0; padding: 20px; border: 2px dashed #00a884; border-radius: 8px; background-color: #f0fdf4; text-align: center;">
            <h3 style="color: #00a884; font-weight: bold; margin-bottom: 10px;">
                <span class="dashicons dashicons-whatsapp"></span> <?php esc_html_e('PayPal WhatsApp Order Pending', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>
            </h3>
            <p><?php echo esc_html($message); ?></p>
            <div style="margin-top: 15px;">
                <a href="<?php echo esc_url($whatsapp_url); ?>" target="_blank" rel="noopener noreferrer" class="button alt" style="background-color: #25d366; border-color: #25d366; color: #fff; padding: 12px 24px; font-weight: bold; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style="width: 20px; height: 20px;" alt="WhatsApp" />
                    <?php esc_html_e('Send WhatsApp Payment Request Now', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>
                </a>
            </div>
        </div>
        <?php
    }

    /**
     * Email instruction hook addition
     */
    public function email_instructions($order, $sent_to_admin, $plain_text = false) {
        if ($order->get_payment_method() !== $this->id) {
            return;
        }
        
        if ($order->get_status() === 'awaiting-paypal') {
            echo '<p style="color: #333; margin-top: 20px;">' . esc_html__('You chose Manual PayPal via WhatsApp. Please ensure you have requested instructions from support using WhatsApp.', 'smarttechpro-paypal-whatsapp-gateway-pro') . '</p>';
        }
    }
}`
  },
  {
    path: "includes/class-emails.php",
    name: "class-emails.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Transactional Email Dispatcher and Alert System
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Emails {

    public static function init() {
        // Hooks to fire on order transitions
        add_action('woocommerce_order_status_pending_to_awaiting-paypal_notification', [__CLASS__, 'trigger_new_request_admin_notification'], 10, 2);
        add_action('woocommerce_order_status_awaiting-paypal_to_paypal-review_notification', [__CLASS__, 'trigger_review_notification'], 10, 2);
        add_action('woocommerce_order_status_paypal-review_to_paypal-paid_notification', [__CLASS__, 'trigger_paid_notification'], 10, 2);
        add_action('woocommerce_order_status_paypal-review_to_paypal-failed_notification', [__CLASS__, 'trigger_failed_notification'], 10, 2);

        // General status transitions fallback if updated from other statuses
        add_action('woocommerce_order_status_changed', [__CLASS__, 'handle_status_changed_fallback'], 10, 4);
    }

    /**
     * Handle fallback transitions if not captured by default transitions
     */
    public static function handle_status_changed_fallback($order_id, $from_status, $to_status, $order) {
        $settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        
        // Prevent double triggers
        if (did_action('stpw_email_triggered_' . $order_id . '_' . $to_status)) {
            return;
        }

        if ($to_status === 'paypal-review') {
            self::trigger_review_notification($order_id, $order);
        } elseif ($to_status === 'paypal-paid') {
            self::trigger_paid_notification($order_id, $order);
        } elseif ($to_status === 'paypal-failed') {
            self::trigger_failed_notification($order_id, $order);
        }
    }

    /**
     * Admin: New PayPal Request
     */
    public static function trigger_new_request_admin_notification($order_id, $order = false) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order) {
            return;
        }

        $settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        if (empty($settings['enable_admin_emails']) || $settings['enable_admin_emails'] === 'no') {
            return;
        }

        do_action('stpw_email_triggered_' . $order_id . '_awaiting-paypal');

        STPW_Logger::log($order_id, 'Admin Email Sent', __('Admin notification sent for new WhatsApp PayPal request.', 'smarttechpro-paypal-whatsapp-gateway-pro'));

        $to = get_option('admin_email');
        $subject = sprintf(__('[New Request] PayPal WhatsApp Order #%s Awaiting Instructions', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
        
        $message = sprintf(
            __("Hello Administrator,\\n\\nA new order has been placed requesting manual PayPal payment instructions via WhatsApp.\\n\\nOrder ID: #%s\\nCustomer: %s\\nTotal: %s %s\\n\\nPlease log in to review the request and coordinate payment manual settings.\\n\\nDashboard: %s\\n", 'smarttechpro-paypal-whatsapp-gateway-pro'),
            $order->get_order_number(),
            $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            $order->get_currency(),
            $order->get_total(),
            admin_url('admin.php?page=stpw-dashboard')
        );

        wp_mail($to, $subject, $message);
    }

    /**
     * Customer: Your PayPal Payment Is Being Reviewed
     */
    public static function trigger_review_notification($order_id, $order = false) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order) {
            return;
        }

        $settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        if (empty($settings['enable_customer_emails']) || $settings['enable_customer_emails'] === 'no') {
            return;
        }

        do_action('stpw_email_triggered_' . $order_id . '_paypal-review');

        STPW_Logger::log($order_id, 'Customer Email Sent', __('Customer email sent: Payment in review state.', 'smarttechpro-paypal-whatsapp-gateway-pro'));

        $to = $order->get_billing_email();
        $subject = __('Your PayPal Payment Is Being Reviewed', 'smarttechpro-paypal-whatsapp-gateway-pro');

        ob_start();
        include STPW_PATH . 'templates/email-review.php';
        $message = ob_get_clean();

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        wp_mail($to, $subject, $message, $headers);

        // Notify Admin of manual review
        if (!empty($settings['enable_admin_emails']) && $settings['enable_admin_emails'] !== 'no') {
            $admin_to = get_option('admin_email');
            $admin_subj = sprintf(__('[Reviewed] Order #%s marked under review', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            $admin_msg = sprintf(__('Order #%s has been marked as Under Review for PayPal verification.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            wp_mail($admin_to, $admin_subj, $admin_msg);
        }
    }

    /**
     * Customer: Payment Confirmed
     */
    public static function trigger_paid_notification($order_id, $order = false) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order) {
            return;
        }

        $settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        if (empty($settings['enable_customer_emails']) || $settings['enable_customer_emails'] === 'no') {
            return;
        }

        do_action('stpw_email_triggered_' . $order_id . '_paypal-paid');

        STPW_Logger::log($order_id, 'Customer Email Sent', __('Customer email sent: Payment manual confirmation approved.', 'smarttechpro-paypal-whatsapp-gateway-pro'));

        $to = $order->get_billing_email();
        $subject = __('Payment Confirmed', 'smarttechpro-paypal-whatsapp-gateway-pro');

        ob_start();
        include STPW_PATH . 'templates/email-paid.php';
        $message = ob_get_clean();

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        wp_mail($to, $subject, $message, $headers);

        // Notify Admin of approval
        if (!empty($settings['enable_admin_emails']) && $settings['enable_admin_emails'] !== 'no') {
            $admin_to = get_option('admin_email');
            $admin_subj = sprintf(__('[Payment Paid] Order #%s confirmed', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            $admin_msg = sprintf(__('Excelent! Order #%s has been paid successfully via manual PayPal flow.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            wp_mail($admin_to, $admin_subj, $admin_msg);
        }
    }

    /**
     * Customer: Payment Verification Failed
     */
    public static function trigger_failed_notification($order_id, $order = false) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        if (!$order) {
            return;
        }

        $settings = get_option('woocommerce_stpw_paypal_whatsapp_settings', []);
        if (empty($settings['enable_customer_emails']) || $settings['enable_customer_emails'] === 'no') {
            return;
        }

        do_action('stpw_email_triggered_' . $order_id . '_paypal-failed');

        STPW_Logger::log($order_id, 'Customer Email Sent', __('Customer email sent: Verification rejected. Payment Failed.', 'smarttechpro-paypal-whatsapp-gateway-pro'));

        $to = $order->get_billing_email();
        $subject = __('Payment Verification Failed', 'smarttechpro-paypal-whatsapp-gateway-pro');

        ob_start();
        include STPW_PATH . 'templates/email-failed.php';
        $message = ob_get_clean();

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        wp_mail($to, $subject, $message, $headers);

        // Notify Admin of failure
        if (!empty($settings['enable_admin_emails']) && $settings['enable_admin_emails'] !== 'no') {
            $admin_to = get_option('admin_email');
            $admin_subj = sprintf(__('[Payment Failed] Order #%s manual check failed', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            $admin_msg = sprintf(__('Manual check of PayPal payment for Order #%s has been marked as Failed.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_order_number());
            wp_mail($admin_to, $admin_subj, $admin_msg);
        }
    }
}

STPW_Emails::init();`
  },
  {
    path: "includes/class-admin-dashboard.php",
    name: "class-admin-dashboard.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Admin Dashboard Panel and Analytics
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Admin_Dashboard {

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'register_menus']);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
    }

    /**
     * Enqueue CSS styling and JavaScript controllers
     */
    public static function enqueue_assets($hook) {
        // Only load on plugin custom menus
        if (strpos($hook, 'stpw-') === false) {
            return;
        }

        wp_enqueue_style('stpw-admin-css', STPW_URL . 'assets/admin.css', [], STPW_VERSION);
        wp_enqueue_script('stpw-admin-js', STPW_URL . 'assets/admin.js', ['jquery'], STPW_VERSION, true);

        // Security nonce mapping
        wp_localize_script('stpw-admin-js', 'stpw_vars', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('stpw_admin_nonce')
        ]);
    }

    /**
     * Register Admin Menus
     */
    public static function register_menus() {
        add_menu_page(
            __('PayPal WhatsApp Gateway', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('SmartTechPro', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'manage_woocommerce',
            'stpw-dashboard',
            [__CLASS__, 'render_dashboard_page'],
            'dashicons-whatsapp',
            55
        );

        add_submenu_page(
            'stpw-dashboard',
            __('Dashboard Analytics', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Dashboard', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'manage_woocommerce',
            'stpw-dashboard',
            [__CLASS__, 'render_dashboard_page']
        );

        add_submenu_page(
            'stpw-dashboard',
            __('PayPal WhatsApp Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('PayPal Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'manage_woocommerce',
            'stpw-orders',
            ['STPW_Admin_Orders', 'render_orders_page']
        );

        add_submenu_page(
            'stpw-dashboard',
            __('Transction Activity Logs', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Logs', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'manage_woocommerce',
            'stpw-logs',
            ['STPW_Admin_Logs', 'render_logs_page']
        );

        add_submenu_page(
            'stpw-dashboard',
            __('Gateway Core Settings', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Settings', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            'manage_woocommerce',
            'stpw-settings',
            [__CLASS__, 'render_settings_redirect']
        );
    }

    /**
     * Redirect directly to WooCommerce core payments settings block mapping
     */
    public static function render_settings_redirect() {
        wp_safe_redirect(admin_url('admin.php?page=wc-settings&tab=checkout&section=stpw_paypal_whatsapp'));
        exit;
    }

    /**
     * Compile Sales Metrics Counters
     */
    public static function get_metrics() {
        if (!class_exists('WooCommerce')) {
            return [];
        }

        // Safe status count retrievals
        $awaiting_query = wc_get_orders(['status' => 'wc-awaiting-paypal', 'limit' => -1, 'return' => 'ids']);
        $review_query   = wc_get_orders(['status' => 'wc-paypal-review', 'limit' => -1, 'return' => 'ids']);
        $paid_query     = wc_get_orders(['status' => 'wc-paypal-paid', 'limit' => -1, 'return' => 'ids']);
        $failed_query   = wc_get_orders(['status' => 'wc-paypal-failed', 'limit' => -1, 'return' => 'ids']);

        $awaiting_count = count($awaiting_query);
        $review_count   = count($review_query);
        $paid_count     = count($paid_query);
        $failed_count   = count($failed_query);

        // Calculate Revenue from paid orders
        $revenue = 0;
        foreach ($paid_query as $order_id) {
            $order = wc_get_order($order_id);
            if ($order) {
                $revenue += floatval($order->get_total());
            }
        }

        // Calculate Conversion rate (Paid vs total placed)
        $total_attempts = $awaiting_count + $review_count + $paid_count + $failed_count;
        $conversion = ($total_attempts > 0) ? round(($paid_count / $total_attempts) * 100, 1) : 0;

        return [
            'awaiting'   => $awaiting_count,
            'review'     => $review_count,
            'paid'       => $paid_count,
            'failed'     => $failed_count,
            'total_att'  => $total_attempts,
            'revenue'    => $revenue,
            'conversion' => $conversion
        ];
    }

    /**
     * Render beautiful custom WP dashboard template wrapper
     */
    public static function render_dashboard_page() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Insufficient permissions.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        $metrics = self::get_metrics();
        global $wpdb;
        $logs_table = $wpdb->prefix . 'stpw_logs';
        
        // Fetch up to 5 recent logs
        $recent_logs = $wpdb->get_results("SELECT * FROM $logs_table ORDER BY id DESC LIMIT 5");

        // Fetch up to 5 recent PayPal orders
        $recent_order_ids = wc_get_orders([
            'limit' => 5,
            'status' => ['wc-awaiting-paypal', 'wc-paypal-review', 'wc-paypal-paid', 'wc-paypal-failed'],
            'orderby' => 'date',
            'order' => 'DESC'
        ]);

        ?>
        <div class="wrap stpw-admin-wrap">
            <h1 class="stpw-admin-title"><?php echo esc_html(__('SmartTechPro PayPal WhatsApp Dashboard', 'smarttechpro-paypal-whatsapp-gateway-pro')); ?></h1>
            <p class="description"><?php echo esc_html(__('Monitor orders requesting payment manual coordinates through the WhatsApp gateway workflows.', 'smarttechpro-paypal-whatsapp-gateway-pro')); ?></p>

            <!-- Metrics Cards Grid -->
            <div class="stpw-stat-grid">
                <div class="stpw-card bg-orange">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-clock"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Awaiting PayPal', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo intval($metrics['awaiting']); ?></p>
                    </div>
                </div>
                <div class="stpw-card bg-blue">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-visibility"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Under Review', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo intval($metrics['review']); ?></p>
                    </div>
                </div>
                <div class="stpw-card bg-green">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-yes-alt"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Paid Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo intval($metrics['paid']); ?></p>
                    </div>
                </div>
                <div class="stpw-card bg-red">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-dismiss"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Failed Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo intval($metrics['failed']); ?></p>
                    </div>
                </div>
                <div class="stpw-card bg-teal">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-chart-area"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Revenue', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo wc_price($metrics['revenue']); ?></p>
                    </div>
                </div>
                <div class="stpw-card bg-purple">
                    <div class="stpw-card-icon"><span class="dashicons dashicons-percent"></span></div>
                    <div class="stpw-card-info">
                        <h3><?php _e('Conversion Rate', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h3>
                        <p class="stpw-stat-val"><?php echo floatval($metrics['conversion']); ?>%</p>
                    </div>
                </div>
            </div>

            <!-- Dashboard Columns Layout -->
            <div class="stpw-two-col">
                <!-- Recent PayPal Orders Table -->
                <div class="stpw-card-block">
                    <h2><?php _e('Recent PayPal Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h2>
                    <?php if (empty($recent_order_ids)) : ?>
                        <div class="stpw-empty-state">
                            <span class="dashicons dashicons-cart"></span>
                            <p><?php _e('No orders requesting PayPal manual payments yet.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></p>
                        </div>
                    <?php else : ?>
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th><?php _e('Order', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                                    <th><?php _e('Customer', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                                    <th><?php _e('Amount', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                                    <th><?php _e('Status', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                                    <th><?php _e('Date', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_order_ids as $order_id) :
                                    $order = wc_get_order($order_id);
                                    if (!$order) continue;
                                    ?>
                                    <tr>
                                        <td><strong><a href="<?php echo admin_url('post.php?post=' . $order_id . '&action=edit'); ?>">#<?php echo esc_html($order->get_order_number()); ?></a></strong></td>
                                        <td><?php echo esc_html($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()); ?></td>
                                        <td><?php echo wc_price($order->get_total()); ?></td>
                                        <td><span class="stpw-badge badge-<?php echo esc_attr($order->get_status()); ?>"><?php echo esc_html(wc_get_order_status_name($order->get_status())); ?></span></td>
                                        <td><?php echo date_i18n(get_option('date_format'), strtotime($order->get_date_created())); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                        <p><a href="<?php echo admin_url('admin.php?page=stpw-orders'); ?>" class="button button-primary"><?php _e('View All PayPal Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a></p>
                    <?php endif; ?>
                </div>

                <!-- Recent Logs Activities Section -->
                <div class="stpw-card-block">
                    <h2><?php _e('Recent Activity Log', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h2>
                    <?php if (empty($recent_logs)) : ?>
                        <div class="stpw-empty-state">
                            <span class="dashicons dashicons-admin-tools"></span>
                            <p><?php _e('Safety logs are empty.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></p>
                        </div>
                    <?php else : ?>
                        <ul class="stpw-log-list">
                            <?php foreach ($recent_logs as $log) : 
                                $user = get_userdata($log->user_id);
                                $username = $user ? $user->user_login : __('System', 'smarttechpro-paypal-whatsapp-gateway-pro');
                                ?>
                                <li class="stpw-log-item">
                                    <span class="stpw-log-time"><?php echo esc_html(mysql2date(get_option('date_format') . ' H:i', $log->created_at)); ?></span>
                                    <span class="stpw-log-action action-<?php echo sanitize_key(str_replace(' ', '-', $log->action)); ?>"><?php echo esc_html($log->action); ?></span>
                                    <span class="stpw-log-msg"><?php echo esc_html($log->message); ?></span>
                                    <span class="stpw-log-user font-mono">(By: <?php echo esc_html($username); ?>)</span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                        <p><a href="<?php echo admin_url('admin.php?page=stpw-logs'); ?>" class="button button-secondary"><?php _e('View Audit Logs', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
    }
}

STPW_Admin_Dashboard::init();`
  },
  {
    path: "includes/class-admin-orders.php",
    name: "class-admin-orders.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Admin PayPal Orders Management Controller
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Admin_Orders {

    /**
     * Render PayPal Orders Page and process actions
     */
    public static function render_orders_page() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Insufficient permissions.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        // Process Inline Actions
        self::process_orders_actions();

        // Safe HPOS query utilizing wc_get_orders
        $paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
        $orders_per_page = 15;

        // Filtering options
        $status_filter = isset($_GET['order_status_filter']) ? sanitize_text_field($_GET['order_status_filter']) : '';
        $search_query = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';

        $query_args = [
            'limit' => $orders_per_page,
            'page' => $paged,
            'status' => ['wc-awaiting-paypal', 'wc-paypal-review', 'wc-paypal-paid', 'wc-paypal-failed'],
            'orderby' => 'date',
            'order' => 'DESC',
            'paginate' => true,
        ];

        if (!empty($status_filter)) {
            $query_args['status'] = [$status_filter];
        }

        if (!empty($search_query)) {
            // Find order by ID/number or keyword in HPOS
            $query_args['billing_last_name'] = $search_query;
        }

        $results = wc_get_orders($query_args);
        $orders = $results->orders;
        $total_pages = $results->max_num_pages;

        ?>
        <div class="wrap stpw-admin-wrap">
            <h1 class="wp-heading-inline"><?php _e('PayPal WhatsApp Orders', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h1>
            <p class="description"><?php _e('List of orders that used the WhatsApp PayPal Gateway. Perform manual checks and record updates here.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></p>

            <!-- Status filter bar -->
            <div class="tablenav top stpw-tabnav">
                <form method="get" action="">
                    <input type="hidden" name="page" value="stpw-orders" />
                    
                    <div class="alignleft actions">
                        <select name="order_status_filter">
                            <option value=""><?php _e('All PayPal Statuses', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                            <option value="wc-awaiting-paypal" <?php selected($status_filter, 'wc-awaiting-paypal'); ?>><?php _e('Awaiting PayPal', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                            <option value="wc-paypal-review" <?php selected($status_filter, 'wc-paypal-review'); ?>><?php _e('PayPal Review', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                            <option value="wc-paypal-paid" <?php selected($status_filter, 'wc-paypal-paid'); ?>><?php _e('PayPal Paid', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                            <option value="wc-paypal-failed" <?php selected($status_filter, 'wc-paypal-failed'); ?>><?php _e('PayPal Failed', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                        </select>

                        <input type="text" name="s" value="<?php echo esc_attr($search_query); ?>" placeholder="<?php _e('Customer Last Name...', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>" />
                        
                        <input type="submit" class="button" value="<?php _e('Filter', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>" />
                    </div>
                </form>

                <div class="alignright">
                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=stpw-orders&stpw_export=1'), 'stpw_export_orders'); ?>" class="button button-secondary"><?php _e('Export Orders CSV', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                </div>
            </div>

            <!-- Main Listing Table -->
            <table class="wp-list-table widefat fixed striped table-view-list">
                <thead>
                    <tr>
                        <th class="manage-column column-order-id"><?php _e('Order ID', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-customer"><?php _e('Customer Name', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-phone"><?php _e('Phone Number', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-email"><?php _e('Email Address', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-amount"><?php _e('Total Amount', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-date"><?php _e('Order Date', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-status"><?php _e('Status', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="manage-column column-actions" style="text-align: right;"><?php _e('Payment Actions', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($orders)) : ?>
                        <tr>
                            <td colspan="8" class="stpw-empty-table"><?php _e('No matching orders found.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($orders as $order) : 
                            $order_id = $order->get_id();
                            $billing_phone = $order->get_billing_phone();
                            ?>
                            <tr>
                                <td>
                                    <strong><a href="<?php echo admin_url('post.php?post=' . $order_id . '&action=edit'); ?>">#<?php echo esc_html($order->get_order_number()); ?></a></strong>
                                </td>
                                <td><?php echo esc_html($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()); ?></td>
                                <td>
                                    <?php if ($billing_phone) : ?>
                                        <a href="https://wa.me/<?php echo preg_replace('/[^0-9]/', '', $billing_phone); ?>" target="_blank" rel="noopener noreferrer" class="stpw-phone-whatsapp font-mono">
                                            <?php echo esc_html($billing_phone); ?>
                                        </a>
                                    <?php else: ?>
                                        <span class="muted">-</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($order->get_billing_email()); ?></td>
                                <td><strong><?php echo wc_price($order->get_total()); ?></strong></td>
                                <td><?php echo date_i18n(get_option('date_format') . ' H:i', strtotime($order->get_date_created())); ?></td>
                                <td>
                                    <span class="stpw-badge badge-<?php echo esc_attr($order->get_status()); ?>">
                                        <?php echo esc_html(wc_get_order_status_name($order->get_status())); ?>
                                    </span>
                                </td>
                                <td style="text-align: right;" class="stpw-row-actions">
                                    <!-- Review Action -->
                                    <?php if ($order->get_status() === 'awaiting-paypal') : ?>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=stpw-orders&stpw_action=review&order_id=' . $order_id), 'stpw_order_action_' . $order_id); ?>" class="button button-small" title="<?php _e('Mark as Under Review', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>"><?php _e('Review', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                                    <?php endif; ?>

                                    <!-- Paid Action -->
                                    <?php if ($order->get_status() === 'paypal-review' || $order->get_status() === 'awaiting-paypal') : ?>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=stpw-orders&stpw_action=paid&order_id=' . $order_id), 'stpw_order_action_' . $order_id); ?>" class="button button-small button-primary bg-primary-green" title="<?php _e('Approve - Marked Paid', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>"><?php _e('Mark Paid', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                                    <?php endif; ?>

                                    <!-- Failed Action -->
                                    <?php if ($order->get_status() === 'paypal-review' || $order->get_status() === 'awaiting-paypal') : ?>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=stpw-orders&stpw_action=failed&order_id=' . $order_id), 'stpw_order_action_' . $order_id); ?>" class="button button-small" title="<?php _e('Reject - Payment Failed', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>"><?php _e('Mark Failed', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                                    <?php endif; ?>

                                    <!-- Reminder Link -->
                                    <?php if ($order->get_status() === 'awaiting-paypal' && $billing_phone) : ?>
                                        <?php 
                                        $reminder_text = sprintf(__('Hi %s, we noticed you chose to pay via PayPal but haven\'t finalized it yet. Please ping us back here to get payment checkout coordinates for Order #%s!', 'smarttechpro-paypal-whatsapp-gateway-pro'), $order->get_billing_first_name(), $order->get_order_number());
                                        $reminder_whatsapp = 'https://wa.me/' . preg_replace('/[^0-9]/', '', $billing_phone) . '?text=' . rawurlencode($reminder_text);
                                        ?>
                                        <a href="<?php echo esc_url($reminder_whatsapp); ?>" target="_blank" rel="noopener noreferrer" class="button button-small" style="background-color: #25D366; color: white; border-color: #128C7E;" onclick="jQuery.post(ajaxurl, {action: 'stpw_log_reminder', order_id: <?php echo $order_id; ?>, security: stpw_vars.nonce});" title="<?php _e('Send SMS / Chat reminder', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>">
                                            <?php _e('Reminder', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>
                                        </a>
                                    <?php endif; ?>

                                    <a href="<?php echo admin_url('post.php?post=' . $order_id . '&action=edit'); ?>" class="button button-small button-secondary"><?php _e('View Order', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <!-- Pagination tabs -->
            <?php if ($total_pages > 1) : ?>
                <div class="tablenav bottom">
                    <div class="tablenav-pages">
                        <span class="displaying-num"><?php printf(_n('%s items', '%s items', count($orders), 'smarttechpro-paypal-whatsapp-gateway-pro'), count($orders)); ?></span>
                        <span class="pagination-links">
                            <?php echo paginate_links([
                                'base'      => add_query_arg('paged', '%#%'),
                                'format'    => '',
                                'prev_text' => '&larr;',
                                'next_text' => '&rarr;',
                                'total'     => $total_pages,
                                'current'   => $paged,
                            ]); ?>
                        </span>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Parse and respond to action triggers on orders
     */
    private static function process_orders_actions() {
        if (!isset($_GET['stpw_action']) || !isset($_GET['order_id'])) {
            // Check for export trigger
            if (isset($_GET['stpw_export'])) {
                self::export_csv_list();
            }
            return;
        }

        $action   = sanitize_text_field($_GET['stpw_action']);
        $order_id = intval($_GET['order_id']);

        // Check Nonce Security
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'stpw_order_action_' . $order_id)) {
            wp_die(__('Security verification failed.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $current_user_id = get_current_user_id();

        switch ($action) {
            case 'review':
                $order->update_status('paypal-review', __('Manual review initiated by admin.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
                STPW_Logger::log($order_id, 'Review', __('PayPal payment status set to PayPal Review manual verification state.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $current_user_id);
                break;
                
            case 'paid':
                $order->update_status('paypal-paid', __('Manual payment confirmation validated by administrator.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
                STPW_Logger::log($order_id, 'Paid', __('Manual payment cleared via PayPal. Order approved.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $current_user_id);
                break;

            case 'failed':
                $order->update_status('paypal-failed', __('Manual payment verification failed or rejected by admin.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
                STPW_Logger::log($order_id, 'Failed', __('Action marked: manual PayPal transaction verification failed.', 'smarttechpro-paypal-whatsapp-gateway-pro'), $current_user_id);
                break;
        }

        // Redirect safely
        wp_safe_redirect(remove_query_arg(['stpw_action', 'order_id', '_wpnonce']));
        exit;
    }

    /**
     * Export Orders table into CSV format on-the-fly
     */
    private static function export_csv_list() {
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'stpw_export_orders')) {
            wp_die(__('Verification error during CSV downloads.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        // Query all gateway orders
        $results = wc_get_orders([
            'limit' => -1,
            'status' => ['wc-awaiting-paypal', 'wc-paypal-review', 'wc-paypal-paid', 'wc-paypal-failed'],
            'orderby' => 'date',
            'order' => 'DESC'
        ]);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=stpw-paypal-orders-' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');
        
        // Write Headers
        fputcsv($output, [
            __('Order ID', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Customer Name', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Phone Number', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Email Address', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Total Amount', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Currency', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Order Status', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Created Date', 'smarttechpro-paypal-whatsapp-gateway-pro')
        ]);

        foreach ($results as $order) {
            fputcsv($output, [
                $order->get_order_number(),
                $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                $order->get_billing_phone(),
                $order->get_billing_email(),
                $order->get_total(),
                $order->get_currency(),
                $order->get_status(),
                $order->get_date_created()
            ]);
        }

        fclose($output);
        exit;
    }
}`
  },
  {
    path: "includes/class-admin-logs.php",
    name: "class-admin-logs.php",
    language: "php",
    category: "include",
    content: `<?php
/**
 * Admin Logs Viewer and Export Controller
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Admin_Logs {

    /**
     * Render the DB Logs custom table view with filters & exports
     */
    public static function render_logs_page() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(__('Insufficient permissions.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        global $wpdb;
        $logs_table = $wpdb->prefix . 'stpw_logs';

        // Listen for export
        if (isset($_GET['stpw_export_logs_nonce'])) {
            self::export_csv_logs();
        }

        // Action or Order ID searches and filter parameters
        $filter_action   = isset($_GET['filter_action']) ? sanitize_text_field($_GET['filter_action']) : '';
        $filter_order_id = isset($_GET['filter_order_id']) ? intval($_GET['filter_order_id']) : 0;
        $search_term     = isset($_GET['s_msg']) ? sanitize_text_field($_GET['s_msg']) : '';

        // Pagination setup
        $paged  = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
        $limit  = 20;
        $offset = ($paged - 1) * $limit;

        // Build database query
        $where      = ['1=1'];
        $where_vals = [];

        if (!empty($filter_action)) {
            $where[]      = "action = %s";
            $where_vals[] = $filter_action;
        }

        if ($filter_order_id > 0) {
            $where[]      = "order_id = %d";
            $where_vals[] = $filter_order_id;
        }

        if (!empty($search_term)) {
            $where[]      = "message LIKE %s";
            $where_vals[] = '%' . $wpdb->esc_like($search_term) . '%';
        }

        $where_clause = implode(' AND ', $where);
        
        // Execute queries
        $count_sql = "SELECT COUNT(*) FROM $logs_table WHERE $where_clause";
        $data_sql  = "SELECT * FROM $logs_table WHERE $where_clause ORDER BY id DESC LIMIT %d OFFSET %d";

        if (!empty($where_vals)) {
            $total_items = $wpdb->get_var($wpdb->prepare($count_sql, $where_vals));
            
            // Append limit & offset parameter values
            $query_vals   = $where_vals;
            $query_vals[] = $limit;
            $query_vals[] = $offset;
            $logs         = $wpdb->get_results($wpdb->prepare($data_sql, $query_vals));
        } else {
            $total_items = $wpdb->get_var($count_sql);
            $logs         = $wpdb->get_results($wpdb->prepare($data_sql, [$limit, $offset]));
        }

        $total_pages = ceil($total_items / $limit);

        // Fetch unique action statuses for filter option mappings
        $unique_actions = $wpdb->get_col("SELECT DISTINCT action FROM $logs_table");

        ?>
        <div class="wrap stpw-admin-wrap">
            <h1 class="wp-heading-inline"><?php _e('PayPal WhatsApp Logs', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></h1>
            <p class="description"><?php _e('Deep audit logs recording every step in the transaction checkout redirect, payment reviews, triggers, and status changes.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></p>

            <!-- Filters form -->
            <div class="tablenav top stpw-tabnav">
                <form method="get" action="">
                    <input type="hidden" name="page" value="stpw-logs" />

                    <div class="alignleft actions">
                        <select name="filter_action">
                            <option value=""><?php _e('Filter by Action', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></option>
                            <?php foreach ($unique_actions as $act) : ?>
                                <option value="<?php echo esc_attr($act); ?>" <?php selected($filter_action, $act); ?>><?php echo esc_html($act); ?></option>
                            <?php endforeach; ?>
                        </select>

                        <input type="number" name="filter_order_id" value="<?php echo $filter_order_id > 0 ? $filter_order_id : ''; ?>" placeholder="<?php _e('Order ID...', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>" style="width: 130px;" />

                        <input type="text" name="s_msg" value="<?php echo esc_attr($search_term); ?>" placeholder="<?php _e('Message contains...', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>" />

                        <input type="submit" class="button" value="<?php _e('Search & Filter', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>" />
                        
                        <?php if (!empty($filter_action) || $filter_order_id > 0 || !empty($search_term)) : ?>
                            <a href="<?php echo admin_url('admin.php?page=stpw-logs'); ?>" class="button button-secondary"><?php _e('Reset', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                        <?php endif; ?>
                    </div>
                </form>

                <div class="alignright">
                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=stpw-logs&stpw_export_logs_nonce=1'), 'stpw_export_logs'); ?>" class="button button-secondary"><?php _e('Export Logs CSV', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></a>
                </div>
            </div>

            <!-- Logs Listing Grid -->
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th class="column-date" style="width: 15%;"><?php _e('Date & Time', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="column-order-id" style="width: 10%;"><?php _e('Order ID', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="column-action" style="width: 15%;"><?php _e('Action Tracked', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="column-message" style="width: 48%;"><?php _e('Details Message', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                        <th class="column-user" style="width: 12%;"><?php _e('Initiator', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($logs)) : ?>
                        <tr>
                            <td colspan="5" class="stpw-empty-table"><?php _e('No logged records matching parameters.', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($logs as $log) : 
                            $user = get_userdata($log->user_id);
                            $username = $user ? $user->user_login : __('System', 'smarttechpro-paypal-whatsapp-gateway-pro');
                            ?>
                            <tr>
                                <td><span class="font-mono"><?php echo esc_html(mysql2date(get_option('date_format') . ' H:i:s', $log->created_at)); ?></span></td>
                                <td>
                                    <?php if ($log->order_id > 0) : ?>
                                        <strong><a href="<?php echo admin_url('post.php?post=' . $log->order_id . '&action=edit'); ?>">#<?php echo esc_html($log->order_id); ?></a></strong>
                                    <?php else : ?>
                                        <span class="muted"><?php _e('Global', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td><span class="stpw-log-action action-<?php echo sanitize_key(str_replace(' ', '-', $log->action)); ?>"><?php echo esc_html($log->action); ?></span></td>
                                <td><p class="stpw-table-log-msg"><?php echo esc_html($log->message); ?></p></td>
                                <td><span class="font-mono"><?php echo esc_html($username); ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <!-- Pagination tabs -->
            <?php if ($total_pages > 1) : ?>
                <div class="tablenav bottom">
                    <div class="tablenav-pages">
                        <span class="displaying-num"><?php printf(_n('%s entries', '%s entries', $total_items, 'smarttechpro-paypal-whatsapp-gateway-pro'), $total_items); ?></span>
                        <span class="pagination-links">
                            <?php echo paginate_links([
                                'base'      => add_query_arg('paged', '%#%'),
                                'format'    => '',
                                'prev_text' => '&larr;',
                                'next_text' => '&rarr;',
                                'total'     => $total_pages,
                                'current'   => $paged
                            ]); ?>
                        </span>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Export all logs into standardized CSV files
     */
    private static function export_csv_logs() {
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'stpw_export_logs')) {
            wp_die(__('Verification error during CSV downloads.', 'smarttechpro-paypal-whatsapp-gateway-pro'));
        }

        global $wpdb;
        $logs_table = $wpdb->prefix . 'stpw_logs';

        // Query all logs database logs
        $results = $wpdb->get_results("SELECT * FROM $logs_table ORDER BY id DESC");

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=stpw-gateway-logs-' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');

        // Headers
        fputcsv($output, [
            __('Log ID', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Date & Time', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Order ID', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Action', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('Message Description', 'smarttechpro-paypal-whatsapp-gateway-pro'),
            __('WP User ID', 'smarttechpro-paypal-whatsapp-gateway-pro')
        ]);

        foreach ($results as $log) {
            fputcsv($output, [
                $log->id,
                $log->created_at,
                $log->order_id,
                $log->action,
                $log->message,
                $log->user_id
            ]);
        }

        fclose($output);
        exit;
    }
}`
  },
  {
    path: "templates/email-review.php",
    name: "email-review.php",
    language: "php",
    category: "template",
    content: `<?php
/**
 * Email content template for 'Review' status.
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

if (empty($order)) {
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo esc_html(__("Your PayPal Payment Is Being Reviewed", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { text-align: center; border-bottom: 2px solid #00a884; padding-bottom: 20px; }
        .header h1 { color: #00a884; font-size: 22px; margin: 0; }
        .content { padding: 20px 0; line-height: 1.6; }
        .details-box { background: #fafafa; border: 1px solid #ededed; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .footer { font-size: 11px; text-align: center; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1><?php echo esc_html(__("PayPal Payment Reviewing", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></h1>
        </div>
        <div class="content">
            <p><?php printf(esc_html__("Hello %s,", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_billing_first_name())); ?></p>
            <p><?php echo esc_html__("We are currently reviewing your manual PayPal payment submission for authentication. Our administration is checking the matching transaction record details.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
            
            <div class="details-box">
                <strong><?php echo esc_html__("Order Summary:", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></strong><br>
                <span><?php printf(esc_html__("Order ID: #%s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_order_number())); ?></span><br>
                <span><?php printf(esc_html__("Total Amount: %s %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_total()), esc_html($order->get_currency())); ?></span><br>
                <span><?php printf(esc_html__("Transaction Status: %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(__("Being Reviewed", "smarttechpro-paypal-whatsapp-gateway-pro"))); ?></span>
            </div>

            <p><?php echo esc_html__("You will receive a notification as soon as our confirmation checks finalize. If you need immediate updates, please send support a direct ping on WhatsApp quoting your Order ID.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
        </div>
        <div class="footer">
            <p><?php printf(esc_html__("Thank you for shopping with %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(get_bloginfo('name'))); ?></p>
        </div>
    </div>
</body>
</html>`
  },
  {
    path: "templates/email-paid.php",
    name: "email-paid.php",
    language: "php",
    category: "template",
    content: `<?php
/**
 * Email content template for 'Paid' status.
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

if (empty($order)) {
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo esc_html(__("Payment Confirmed!", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { text-align: center; border-bottom: 2px solid #00c853; padding-bottom: 20px; }
        .header h1 { color: #00c853; font-size: 22px; margin: 0; }
        .content { padding: 20px 0; line-height: 1.6; }
        .details-box { background: #fafafa; border: 1px solid #ededed; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .footer { font-size: 11px; text-align: center; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1><?php echo esc_html(__("PayPal Payment Cleared", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></h1>
        </div>
        <div class="content">
            <p><?php printf(esc_html__("Hello %s,", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_billing_first_name())); ?></p>
            <p><?php echo esc_html__("Great news! We have successfully validated your manual PayPal payment. Your order has been marked as fully Paid and is currently proceeding to fulfillment.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
            
            <div class="details-box">
                <strong><?php echo esc_html__("Order & Payment Summary:", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></strong><br>
                <span><?php printf(esc_html__("Order ID: #%s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_order_number())); ?></span><br>
                <span><?php printf(esc_html__("Total Amount: %s %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_total()), esc_html($order->get_currency())); ?></span><br>
                <span><?php printf(esc_html__("Transaction Status: %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(__("PayPal Paid - Confirmed", "smarttechpro-paypal-whatsapp-gateway-pro"))); ?></span>
            </div>

            <p><?php echo esc_html__("Our shipping staff is preparing your items. You will receive tracking alerts shortly as parcels dispatch.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
        </div>
        <div class="footer">
            <p><?php printf(esc_html__("Thank you for shopping with %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(get_bloginfo('name'))); ?></p>
        </div>
    </div>
</body>
</html>`
  },
  {
    path: "templates/email-failed.php",
    name: "email-failed.php",
    language: "php",
    category: "template",
    content: `<?php
/**
 * Email content template for 'Failed' status.
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

if (empty($order)) {
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo esc_html(__("PayPal Payment Verification Failed", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { text-align: center; border-bottom: 2px solid #d32f2f; padding-bottom: 20px; }
        .header h1 { color: #d32f2f; font-size: 22px; margin: 0; }
        .content { padding: 20px 0; line-height: 1.6; }
        .details-box { background: #fafafa; border: 1px solid #ededed; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .footer { font-size: 11px; text-align: center; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1><?php echo esc_html(__("Payment Verification Failed", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></h1>
        </div>
        <div class="content">
            <p><?php printf(esc_html__("Hello %s,", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_billing_first_name())); ?></p>
            <p><?php echo esc_html__("We were unable to verify your manual PayPal payment for this order. This might have occurred due to a transaction mismatch, canceled payment, or unrecognized reference number.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
            
            <div class="details-box">
                <strong><?php echo esc_html__("Unverified Order Details:", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></strong><br>
                <span><?php printf(esc_html__("Order ID: #%s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_order_number())); ?></span><br>
                <span><?php printf(esc_html__("Total Amount: %s %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_total()), esc_html($order->get_currency())); ?></span><br>
                <span><?php printf(esc_html__("Transaction Status: %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(__("PayPal Failed / Rejected", "smarttechpro-paypal-whatsapp-gateway-pro"))); ?></span>
            </div>

            <p style="color: #d32f2f; font-weight: bold;"><?php echo esc_html__("What can you do now?", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
            <p><?php echo esc_html__("Please reach out to our active chat team by sending a support request via WhatsApp. Be sure to send your exact transaction receipt (SS/ID) so our admins can execute manual verification overrides.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
        </div>
        <div class="footer">
            <p><?php printf(esc_html__("Regards, %s Team", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(get_bloginfo('name'))); ?></p>
        </div>
    </div>
</body>
</html>`
  },
  {
    path: "assets/admin.css",
    name: "admin.css",
    language: "css",
    category: "asset",
    content: `/**
 * SmartTechPro PayPal WhatsApp Gateway Pro Admin UI styles
 */

.stpw-admin-wrap {
    margin: 20px 20px 0 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

/* Dashboard stat grid */
.stpw-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin: 20px 0 30px 0;
}

/* Card */
.stpw-card {
    background: #fff;
    border: 1px solid #e5e5e1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    border-radius: 6px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    position: relative;
    overflow: hidden;
}

.stpw-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
}

.stpw-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: #fff;
}

.stpw-card-icon .dashicons {
    font-size: 24px;
    width: 24px;
    height: 24px;
}

.stpw-card-info h3 {
    margin: 0;
    font-size: 13px;
    color: #646970;
    font-weight: 500;
}

.stpw-stat-val {
    margin: 4px 0 0 0;
    font-size: 24px;
    font-weight: 700;
    color: #1d2327;
    line-height: 1.2;
}

/* Accent Colors */
.bg-orange::before { background-color: #f59e0b; }
.bg-orange .stpw-card-icon { background-color: #f59e0b; }

.bg-blue::before { background-color: #3b82f6; }
.bg-blue .stpw-card-icon { background-color: #3b82f6; }

.bg-green::before { background-color: #10b981; }
.bg-green .stpw-card-icon { background-color: #10b981; }

.bg-red::before { background-color: #ef4444; }
.bg-red .stpw-card-icon { background-color: #ef4444; }

.bg-teal::before { background-color: #0d9488; }
.bg-teal .stpw-card-icon { background-color: #0d9488; }

.bg-purple::before { background-color: #8b5cf6; }
.bg-purple .stpw-card-icon { background-color: #8b5cf6; }

/* Multi-column layout */
.stpw-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-top: 25px;
}

@media (max-width: 960px) {
    .stpw-two-col {
        grid-template-columns: 1fr;
    }
}

.stpw-card-block {
    background: #fff;
    border: 1px solid #e5e5e1;
    border-radius: 6px;
    padding: 24px;
}

.stpw-card-block h2 {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1d2327;
    border-bottom: 1px solid #f0f0f1;
    padding-bottom: 12px;
}

/* Badges */
.stpw-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9999px;
    text-transform: uppercase;
}

.badge-awaiting-paypal {
    background-color: #fef3c7;
    color: #d97706;
}

.badge-paypal-review {
    background-color: #dbeafe;
    color: #2563eb;
}

.badge-paypal-paid {
    background-color: #d1fae5;
    color: #059669;
}

.badge-paypal-failed {
    background-color: #fee2e2;
    color: #dc2626;
}

/* Status helper row action color buttons */
.stpw-row-actions a.button-small {
    margin-right: 4px;
}

.bg-primary-green {
    background-color: #059669 !important;
    border-color: #059669 !important;
    color: white !important;
    text-shadow: none !important;
}

.bg-primary-green:hover {
    background-color: #047857 !important;
    border-color: #047857 !important;
}

/* Logging list styling */
.stpw-log-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.stpw-log-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f1;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    font-size: 13px;
    gap: 8px;
}

.stpw-log-item:last-child {
    border-bottom: none;
}

.stpw-log-time {
    color: #8c8f94;
    font-size: 11px;
    width: 105px;
    flex-shrink: 0;
}

.stpw-log-action {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    display: inline-block;
    letter-spacing: 0.5px;
}

/* Log type badges */
.action-Gateway-Enabled { background-color: #e0f2fe; color: #0369a1; }
.action-Gateway-Disabled { background-color: #f3f4f6; color: #374151; }
.action-WhatsApp-Redirect { background-color: #dcfce7; color: #15803d; }
.action-Order-Created { background-color: #fef8c3; color: #a16207; }
.action-Review { background-color: #e0e7ff; color: #4338ca; }
.action-Paid { background-color: #d1fae5; color: #065f46; }
.action-Failed { background-color: #fee2e2; color: #991b1b; }
.action-Reminder-Sent { background-color: #fae8ff; color: #86198f; }
.action-Customer-Email-Sent { background-color: #f3e8ff; color: #6b21a8; }
.action-Admin-Email-Sent { background-color: #fed7aa; color: #9a3412; }

.stpw-log-msg {
    color: #3c434a;
    flex-grow: 1;
}

.stpw-log-user {
    color: #8c8f94;
    font-size: 11px;
}

/* Filter layouts */
.stpw-tabnav {
    margin-bottom: 15px;
    background: #fff;
    padding: 10px 15px;
    border: 1px solid #e5e5e1;
    border-radius: 6px;
}

.stpw-tabnav select, .stpw-tabnav input[type="text"], .stpw-tabnav input[type="number"] {
    margin-right: 10px;
}

.stpw-empty-state, .stpw-empty-table {
    text-align: center !important;
    padding: 40px !important;
    color: #8c8f94;
}

.stpw-empty-state .dashicons {
    font-size: 40px;
    width: 40px;
    height: 40px;
    margin-bottom: 15px;
}

/* Phone style Link */
.stpw-phone-whatsapp {
    color: #059669;
    text-decoration: none;
    font-weight: 500;
}
.stpw-phone-whatsapp:hover {
    text-decoration: underline;
}

.stpw-table-log-msg {
    margin: 0;
    max-height: 80px;
    overflow-y: auto;
    font-size: 12px;
}`
  },
  {
    path: "assets/admin.js",
    name: "admin.js",
    language: "js",
    category: "asset",
    content: `/**
 * SmartTechPro PayPal WhatsApp Gateway Pro Admin JS Helpers
 */
jQuery(document).ready(function($) {
    'use strict';

    // Toggle reminder clicking log alerts dynamically
    $('.stpw-row-actions a[style*="background-color: #25D366"]').on('click', function(e) {
        // Let WooCommerce log the notification activity in background
        console.log('STPW: Sending WhatsApp reminder notification...');
    });
    
    // Auto-scroll log details if they overflow
    $('.stpw-table-log-msg').each(function() {
        var $msg = $(this);
        if ($msg[0].scrollHeight > $msg.innerHeight()) {
            $msg.attr('title', $msg.text());
        }
    });

    // Custom filtering behaviors
    $('select[name="order_status_filter"]').on('change', function() {
        $(this).closest('form').trigger('submit');
    });
});`
  }
];
