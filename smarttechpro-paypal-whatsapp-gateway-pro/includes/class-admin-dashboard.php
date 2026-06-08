<?php
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

STPW_Admin_Dashboard::init();
