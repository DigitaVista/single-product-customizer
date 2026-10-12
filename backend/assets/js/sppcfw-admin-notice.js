/**
 * Single Product Customizer — Halloween Deal Admin Notice
 */
jQuery(document).ready(function ($) {
    'use strict';

    function dismissHalloweenNotice($notice, dismissAction) {
        if (typeof sppcfwHalloweenNotice !== 'undefined' && sppcfwHalloweenNotice.ajax_url) {
            $.ajax({
                url: sppcfwHalloweenNotice.ajax_url,
                type: 'POST',
                data: {
                    action: 'sppcfw_dismiss_halloween_notice',
                    dismiss_action: dismissAction,
                    nonce: sppcfwHalloweenNotice.nonce
                }
            });
        }

        $notice.fadeTo(150, 0, function () {
            $notice.slideUp(180, function () {
                $notice.remove();
            });
        });
    }

    // X button = snooze 3 days
    $(document).on('click', '.sppcfw-halloween-notice .vm-hw-close, .sppcfw-halloween-notice .sppcfw-hw-close', function (e) {
        e.preventDefault();
        dismissHalloweenNotice($(this).closest('.sppcfw-halloween-notice'), 'later');
    });
});
