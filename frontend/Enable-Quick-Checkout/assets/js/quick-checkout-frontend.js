jQuery("body").on('wc-blocks_added_to_cart', function() {
    jQuery("body").trigger("update_checkout");
});
jQuery("body").on('added_to_cart', function() {
       jQuery("body").trigger("update_checkout"); 
});


jQuery(document).ready(function() {
    // Variable forms rendered inside checkout fragments need explicit re-init.
    sppcfw_init_variation_forms();

    jQuery(document.body).on('updated_checkout', function() {
        sppcfw_init_variation_forms();
    });

    // Listen to WooCommerce cart fragment refresh (triggered after AJAX add to cart)
    jQuery(document.body).on('wc_fragment_refresh', function() {
        // Load and display Quick Checkout template
        sppcfw_load_quick_checkout_template_modal();
    });
    
});

// Function to load and display Quick Checkout template via AJAX
function sppcfw_load_quick_checkout_template_modal() {
    jQuery.ajax({
        type: 'POST',
        url: sppcfw.ajaxUrl,
        data: {
            action: 'sppcfw_load_quick_checkout_template'
        },
        success: function(response) {
            if (response.success) {
                // Display modal with the template
                sppcfw_display_quick_checkout_modal(response.data.template_html, response.data.template_name);
            }
        },
        error: function(xhr, status, error) {
            console.log('Quick Checkout template load error:', error);
        }
    });
}

// Function to display Quick Checkout modal
function sppcfw_display_quick_checkout_modal(html, templateName) {
    // Remove existing modal if any
    jQuery('#sppcfw-qc-modal').remove();
    
    // Create modal HTML
    let modalHtml = `
        <div id="sppcfw-qc-modal" class="sppcfw-qc-modal">
            <div class="sppcfw-qc-modal-overlay" onclick="sppcfw_close_quick_checkout_modal()"></div>
            <div class="sppcfw-qc-modal-content">
                <button class="sppcfw-qc-close-btn" type="button" onclick="sppcfw_close_quick_checkout_modal()">×</button>
                <div class="sppcfw-qc-body">
                    ${html}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    jQuery('body').append(modalHtml);
    sppcfw_init_variation_forms();
    
    // Log for debugging
    console.log('Quick Checkout modal displayed with template:', templateName);
}

// Function to close Quick Checkout modal
function sppcfw_close_quick_checkout_modal() {
    jQuery('#sppcfw-qc-modal').fadeOut(300, function() {
        jQuery(this).remove();
    });
}

function sppcfw_init_variation_forms() {
    if (typeof jQuery.fn.wc_variation_form !== 'function') {
        return;
    }

    jQuery('form.variations_form').each(function() {
        var $form = jQuery(this);

        if (!$form.data('wc_variation_form')) {
            $form.wc_variation_form();
        }

        $form.trigger('check_variations');
        $form.find('select').first().trigger('change');
    });
}


