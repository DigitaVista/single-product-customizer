/*sp plus minus button section*/

(function($) {
    function sppcfwDisableThemeQuantityButtons() {
        $('.quantity').each(function() {
            var $wrapper = $(this);
            $wrapper.addClass('buttons_added spinners-added');
            // If plugin buttons exist, remove theme-injected duplicate buttons
            if ($wrapper.find('.sppcfw_minus_button, .sppcfw_plus_button').length > 0) {
                $wrapper.find('.minus:not(.sppcfw_minus_button), .plus:not(.sppcfw_plus_button)').remove();
                $wrapper.find('a.minus, a.plus, input.minus, input.plus').remove();
            }
        });
    }

    // Run on load and after AJAX events
    sppcfwDisableThemeQuantityButtons();
    $(document).ready(sppcfwDisableThemeQuantityButtons);
    $(window).on('load', sppcfwDisableThemeQuantityButtons);
    $(document).ajaxComplete(sppcfwDisableThemeQuantityButtons);
    $(document.body).on('wc_fragments_refreshed updated_cart_totals updated_checkout', sppcfwDisableThemeQuantityButtons);
})(jQuery);

jQuery(document).on('click', 'button.sppcfw_plus_button, button.sppcfw_minus_button', function(e) {
    e.preventDefault();

    var $btn = jQuery(this);
    var $qty = $btn.closest('.quantity').find('.qty');
    if (!$qty.length) {
        return;
    }

    var val = parseFloat($qty.val());
    var max = parseFloat($qty.attr('max'));
    var min = parseFloat($qty.attr('min'));
    var step = parseFloat($qty.attr('step'));

    if (isNaN(step) || step <= 0) {
        step = 1;
    }
    if (isNaN(min)) {
        min = 1;
    }
    if (isNaN(val)) {
        val = min;
    }

    // Determine precision based on step decimal places
    var stepStr = step.toString();
    var precision = stepStr.indexOf('.') >= 0 ? stepStr.split('.')[1].length : 0;

    var newVal = val;

    if ($btn.hasClass('sppcfw_plus_button')) {
        if (!isNaN(max) && val >= max) {
            newVal = max;
        } else {
            newVal = parseFloat((val + step).toFixed(precision));
            if (!isNaN(max) && newVal > max) {
                newVal = max;
            }
        }
    } else {
        if (!isNaN(min) && val <= min) {
            newVal = min;
        } else {
            newVal = parseFloat((val - step).toFixed(precision));
            if (!isNaN(min) && newVal < min) {
                newVal = min;
            }
        }
    }

    $qty.val(newVal).trigger('change').trigger('input');
});
   
/*sp plus minus button section end*/