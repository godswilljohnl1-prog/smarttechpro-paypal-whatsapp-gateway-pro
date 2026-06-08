<?php
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
            __("Hello Administrator,\n\nA new order has been placed requesting manual PayPal payment instructions via WhatsApp.\n\nOrder ID: #%s\nCustomer: %s\nTotal: %s %s\n\nPlease log in to review the request and coordinate payment manual settings.\n\nDashboard: %s\n", 'smarttechpro-paypal-whatsapp-gateway-pro'),
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

STPW_Emails::init();
