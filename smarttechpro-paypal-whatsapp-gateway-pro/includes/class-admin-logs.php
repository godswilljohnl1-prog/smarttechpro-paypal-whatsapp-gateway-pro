<?php
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
                            <?php foreach ($unique_actions as $action_name) : ?>
                                <option value="<?php echo esc_attr($action_name); ?>" <?php selected($filter_action, $action_name); ?>>
                                    <?php echo esc_html($action_name); ?>
                                </option>
                            <?php end0; ?>
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
}
