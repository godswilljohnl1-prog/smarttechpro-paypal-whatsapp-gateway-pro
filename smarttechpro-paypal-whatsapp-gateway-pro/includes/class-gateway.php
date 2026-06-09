<?php
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
        $enable_qr    = $this->get_option('enable_paypal_qr', 'yes') === 'yes';
        $paypal_user  = $this->get_option('paypal_me_username', 'smarttechpro');
        ?>
        <div class="stpw-whatsapp-thankyou-box" style="margin: 25px 0; padding: 20px; border: 2px dashed #00a884; border-radius: 8px; background-color: #f0fdf4; text-align: center;">
            <h3 style="color: #00a884; font-weight: bold; margin-bottom: 10px;">
                <span class="dashicons dashicons-whatsapp"></span> <?php esc_html_e('PayPal WhatsApp Order Pending', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>
            </h3>
            <p><?php echo esc_html($message); ?></p>
            
            <?php if ($enable_qr && !empty($paypal_user)) : 
                $total         = $order->get_total();
                $currency      = $order->get_currency();
                $paypal_me_url = "https://www.paypal.me/" . esc_attr($paypal_user) . "/" . esc_attr($total) . esc_attr($currency);
                $qr_api_url    = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($paypal_me_url);
                ?>
                <div class="stpw-paypal-qr-box" style="margin: 20px auto; max-width: 320px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fff; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <span style="font-weight: bold; font-size: 13px; color: #003087; display: block; margin-bottom: 8px; font-family: sans-serif;">
                        <span class="dashicons dashicons-qr"></span> <?php esc_html_e('Scan & Pay via PayPal QR', 'smarttechpro-paypal-whatsapp-gateway-pro'); ?>
                    </span>
                    <img src="<?php echo esc_url($qr_api_url); ?>" style="width: 150px; height: 150px; display: block; margin: 10px auto;" alt="PayPal Pay QR" />
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #555; line-height: 1.3; font-family: sans-serif;">
                        <?php echo sprintf(esc_html__('PayPallink: %s', 'smarttechpro-paypal-whatsapp-gateway-pro'), '<a href="' . esc_url($paypal_me_url) . '" target="_blank" style="color: #0070ba; font-weight: bold;">paypal.me/' . esc_html($paypal_user) . '/' . esc_html($total) . esc_html($currency) . '</a>'); ?>
                    </p>
                </div>
            <?php endif; ?>

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
}
