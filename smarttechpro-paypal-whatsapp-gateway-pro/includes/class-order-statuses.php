<?php
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

STPW_Order_Statuses::init();
