jQuery(document).ready(function() {
    jQuery('form.cart').on('submit', function(e) {
        e.preventDefault();

        if ( ! window.sppcfw_ajax_add_to_cart || ! sppcfw_ajax_add_to_cart.ajaxurl ) {
            return;
        }

        let form = jQuery(this);
        let submitBtn = form.find('button[type=submit], input[type=submit]').first();
        let item_input = submitBtn.attr('name');
        let item_value = submitBtn.attr('value');

        if ( typeof form.block === 'function' ) {
            form.block({ message: null, overlayCSS: { background: '#fff', opacity: 0.6 } });
        }

        if ( item_input && typeof item_value !== 'undefined' ) {
            // Remove any existing input for this submit key, then add a clean hidden field.
            // Only do this when we can also read the submit's `value` attribute.
            form.find('input[name="' + item_input + '"]').remove();

            form.append(
                jQuery("<input type='hidden'>").attr({
                    name: item_input,
                    value: item_value
                })
            );
        }

        form.find('input[name=action]').remove();
        form.append(
            jQuery("<input type='hidden'>").attr({
                name: 'action',
                value: 'sppcfw_ajax_add_to_cart'
            })
        );

        let formData = form.serialize();
        let urlForm = sppcfw_ajax_add_to_cart.ajaxurl;

        jQuery.ajax({
            type: 'POST',
            url: urlForm,
            data: formData,
            success: function(response) {
                jQuery("body").trigger("update_checkout");
                jQuery(document.body).trigger('wc_fragment_refresh');

                if ( typeof form.unblock === 'function' ) {
                    form.unblock();
                }

                jQuery('.woocommerce-notices-wrapper').html('').html(response);
            },
            error: function() {
                if ( typeof form.unblock === 'function' ) {
                    form.unblock();
                }
                jQuery('.woocommerce-notices-wrapper').html('').html(
                    '<div class="woocommerce-error">Unable to add to cart. Please try again.</div>'
                );
            }
        });

    });
});