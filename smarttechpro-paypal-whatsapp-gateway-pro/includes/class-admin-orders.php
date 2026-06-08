<?php
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
}

// Hook Ajax action for reminder tracking
add_action('wp_ajax_stpw_log_reminder', function() {
    check_ajax_referer('stpw_admin_nonce', 'security');
    
    $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
    if ($order_id > 0) {
        STPW_Logger::log($order_id, 'Reminder Sent', __('WhatsApp reminder notification re-launched manually by admin.', 'smarttechpro-paypal-whatsapp-gateway-pro'), get_current_user_id());
    }
    wp_send_json_success();
});
