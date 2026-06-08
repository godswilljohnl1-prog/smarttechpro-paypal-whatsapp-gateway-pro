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
}
