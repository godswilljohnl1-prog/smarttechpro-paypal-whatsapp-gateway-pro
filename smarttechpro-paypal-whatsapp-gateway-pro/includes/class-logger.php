<?php
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
}
