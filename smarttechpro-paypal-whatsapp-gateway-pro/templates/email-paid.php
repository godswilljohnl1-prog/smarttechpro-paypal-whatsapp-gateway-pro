<?php
/**
 * Email content template for 'Paid' status.
 *
 * @package SmartTechProPayPalWhatsAppGatewayPro
 */

defined('ABSPATH') || exit;

if (empty($order)) {
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo esc_html(__("Payment Confirmed!", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { text-align: center; border-bottom: 2px solid #00c853; padding-bottom: 20px; }
        .header h1 { color: #00c853; font-size: 22px; margin: 0; }
        .content { padding: 20px 0; line-height: 1.6; }
        .details-box { background: #fafafa; border: 1px solid #ededed; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .footer { font-size: 11px; text-align: center; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1><?php echo esc_html(__("PayPal Payment Cleared", "smarttechpro-paypal-whatsapp-gateway-pro")); ?></h1>
        </div>
        <div class="content">
            <p><?php printf(esc_html__("Hello %s,", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_billing_first_name())); ?></p>
            <p><?php echo esc_html__("Great news! We have successfully validated your manual PayPal payment. Your order has been marked as fully Paid and is currently proceeding to fulfillment.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
            
            <div class="details-box">
                <strong><?php echo esc_html__("Order & Payment Summary:", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></strong><br>
                <span><?php printf(esc_html__("Order ID: #%s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_order_number())); ?></span><br>
                <span><?php printf(esc_html__("Total Amount: %s %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html($order->get_total()), esc_html($order->get_currency())); ?></span><br>
                <span><?php printf(esc_html__("Transaction Status: %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(__("PayPal Paid - Confirmed", "smarttechpro-paypal-whatsapp-gateway-pro"))); ?></span>
            </div>

            <p><?php echo esc_html__("Our shipping staff is preparing your items. You will receive tracking alerts shortly as parcels dispatch.", "smarttechpro-paypal-whatsapp-gateway-pro"); ?></p>
        </div>
        <div class="footer">
            <p><?php printf(esc_html__("Thank you for shopping with %s", "smarttechpro-paypal-whatsapp-gateway-pro"), esc_html(get_bloginfo('name'))); ?></p>
        </div>
    </div>
</body>
</html>
