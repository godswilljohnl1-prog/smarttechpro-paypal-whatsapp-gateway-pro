<?php
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
}
