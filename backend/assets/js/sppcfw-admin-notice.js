/**
 * Single Product Customizer Campaign Admin Notice Handler
 */
jQuery(document).ready(function ($) {
    'use strict';

    $(document).on('click', '.sppcfw-campaign-notice .notice-dismiss', function () {
        var $notice = $(this).closest('.sppcfw-campaign-notice');

        var noticeConfig = typeof SPPCFWNotice !== 'undefined' ? SPPCFWNotice : (typeof sppcfwNotice !== 'undefined' ? sppcfwNotice : null);

        if (noticeConfig && noticeConfig.ajax_url) {
            $.ajax({
                url: noticeConfig.ajax_url,
                type: 'POST',
                data: {
                    action: 'sppcfw_dismiss_notice',
                    dismiss_action: 'later',
                    nonce: noticeConfig.nonce
                }
            });
        }

        $notice.fadeTo(100, 0, function () {
            $notice.slideUp(100, function () {
                $notice.remove();
            });
        });
    });
});
