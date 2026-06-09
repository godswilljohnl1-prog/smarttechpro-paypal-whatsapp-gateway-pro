<?php
/**
 * Gateway Setting Fields Definition
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

class STPW_Settings {

    /**
     * Get forms settings definitions for gateway
     *
     * @return array
     */
    public static function get_fields() {
        return [
            'enabled' => [
                'title'       => __('Enable Gateway', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Enable SmartTechPro PayPal WhatsApp Gateway Pro', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'no'
            ],
            'title' => [
                'title'       => __('Gateway Title', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('Title shown to customers during WooCommerce checkout.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Pay via PayPal (WhatsApp Support)', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'description' => [
                'title'       => __('Gateway Description', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Description shown to customers during WooCommerce checkout.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Request PayPal payment instructions through WhatsApp directly to complete your purchase manually with support.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'support_name' => [
                'title'       => __('Support Representative Name', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('Name of support representative (binds to {support_name}).', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Support Desk', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'support_whatsapp_number' => [
                'title'       => __('Support WhatsApp Number', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('WhatsApp phone number (include international calling code, e.g., +2348012345678). Used for redirecting chat.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => '',
                'desc_tip'    => true,
            ],
            'paypal_email' => [
                'title'       => __('PayPal Email Address', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'email',
                'description' => __('Your PayPal account email for compiling instructions (binds to {paypal_email}).', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => get_option('admin_email'),
                'desc_tip'    => true,
            ],
            'thank_you_message' => [
                'title'       => __('Thank You Page Message', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Extra guidelines printed on checkout thank-you page.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => __('Thank you for your order! Please use the WhatsApp button below to request PayPal payment instructions if your browser did not redirect automatically.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'desc_tip'    => true,
            ],
            'custom_whatsapp_template' => [
                'title'       => __('Custom WhatsApp Template', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'textarea',
                'description' => __('Configure output template text sent to support. You can use tags: {order_id}, {customer_name}, {customer_email}, {customer_phone}, {order_total}, {currency}, {product_list}, {paypal_email}, {support_name}, {site_name}', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => STPW_WhatsApp::get_default_template(),
                'desc_tip'    => true,
            ],
            'enable_logging' => [
                'title'       => __('Enable DB Logging', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Log gateway activities and transaction audit steps to custom table', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'enable_customer_emails' => [
                'title'       => __('Enable Customer Emails', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Send customers transactional alerts (Review, Confirmations, Failures)', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'enable_admin_emails' => [
                'title'       => __('Enable Admin Emails', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Alert shop administrators for new PayPal requests and manual transitions', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'enable_paypal_qr' => [
                'title'       => __('Enable PayPal.Me QR Code', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'checkbox',
                'label'       => __('Instantly generate and showcase a scan-to-pay PayPal.Me QR code on checkout and support redirect alerts', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'yes'
            ],
            'paypal_me_username' => [
                'title'       => __('PayPal.Me Username', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'type'        => 'text',
                'description' => __('Your PayPal.Me custom handle / username (e.g., "mybrand" or "smarttechpro"). Used to render scan-to-pay links.', 'smarttechpro-paypal-whatsapp-gateway-pro'),
                'default'     => 'smarttechpro',
                'desc_tip'    => true,
            ],
        ];
    }
}
