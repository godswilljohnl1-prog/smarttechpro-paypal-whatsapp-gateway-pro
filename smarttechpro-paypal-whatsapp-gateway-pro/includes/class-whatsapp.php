<?php
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
        return "Hello {support_name},\n\nI would like to pay via PayPal.\n\nOrder ID: #{order_id}\n\nCustomer: {customer_name}\nEmail: {customer_email}\nPhone: {customer_phone}\n\nProducts:\n{product_list}\n\nTotal: {currency} {order_total}\n\nPlease send PayPal payment instructions.";
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
        $product_list = implode("\n", $product_lines);

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
}
