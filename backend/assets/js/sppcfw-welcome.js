;(function($) {
    $(document).ready(function() {

        $(document).on('click', '#sppcfw_welcome_no_thanks, #sppcfw_welcome_subscribe', function (e) {
            e.preventDefault();

            const button = $(this);
            const originalText = button.html();
            const adminEmail = $('#sppcfw_admin_email').val();
            const actionType = button.attr('name') === 'sppcfw_welcome_subscribe' ? 'subscribe' : 'no_thanks';

            // Validate email for subscribe action
            if (actionType === 'subscribe' && (!adminEmail || !isValidEmail(adminEmail))) {
                alert('Please enter a valid email address to subscribe.');
                return;
            }

            // Show loading state
            button.html('<span class="spinner is-active" style="float: none; margin: 0;"></span> Processing...');
            button.prop('disabled', true);

            // Make AJAX call
            $.ajax({
                url: sppcfw_welcome_page.ajax_url,
                type: 'POST',
                data: {
                    action: 'sppcfw_welcome_api_call',
                    nonce: sppcfw_welcome_page.nonce,
                    admin_email: adminEmail,
                    type: actionType
                },
                success: function (response) {
                    if (response.success && response.data.url) {
                        window.location.href = response.data.url;
                    } else {
                        alert('There was an error. Please try again.');
                        button.html(originalText);
                        button.prop('disabled', false);
                    }
                },
                error: function() {
                    alert('There was an error. Please try again.');
                    button.html(originalText);
                    button.prop('disabled', false);
                }
            });
        });

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

    });
})(jQuery);
