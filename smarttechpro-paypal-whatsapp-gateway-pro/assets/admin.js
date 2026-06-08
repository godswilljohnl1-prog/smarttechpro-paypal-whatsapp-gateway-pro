/**
 * SmartTechPro PayPal WhatsApp Gateway Pro Admin JS Helpers
 */
jQuery(document).ready(function($) {
    'use strict';

    // Toggle reminder clicking log alerts dynamically
    $('.stpw-row-actions a[style*="background-color: #25D366"]').on('click', function(e) {
        // Let WooCommerce log the notification activity in background
        var $el = $(this);
        console.log('STPW: Sending WhatsApp reminder notification...');
    });
    
    // Auto-scroll log details if they overflow
    $('.stpw-table-log-msg').each(function() {
        var $msg = $(this);
        if ($msg[0].scrollHeight > $msg.innerHeight()) {
            $msg.attr('title', $msg.text());
        }
    });

    // Custom filtering behaviors
    $('select[name="order_status_filter"]').on('change', function() {
        $(this).closest('form').trigger('submit');
    });
});
