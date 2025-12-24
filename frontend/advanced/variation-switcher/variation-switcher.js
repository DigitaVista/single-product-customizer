/* Variation switcher Frontend section */
jQuery(document).ready(function($){
    
    // Initialize on page load
    initVariationSwitcher();
    
    // Re-initialize on AJAX product load (for variable products)
    $(document).on('found_variation', 'form.variations_form', function(){
        setTimeout(initVariationSwitcher, 100);
    });
    
    // Re-initialize when variations are reset
    $(document).on('reset_data', 'form.variations_form', function(){
        setTimeout(initVariationSwitcher, 100);
    });
    
    // Re-initialize on variation change
    $(document).on('change', '.vairation_select', function(){
        setTimeout(initVariationSwitcher, 100);
    });
    
    function initVariationSwitcher() {
        // Set background colors for color buttons
        $('.webfwc_variation_button.color').each(function() {
            var bgColor = $(this).data('bg-color');  
            if (bgColor) {
                $(this).css('background-color', bgColor);
            }
        });
        
        // Handle button clicks
        $('button.webfwc_variation_button').off('click').on('click', function(){
            if ($(this).hasClass('webcfwc_btn_disable')) {
                return false;
            }
            
            let webcfwc_variation_button_val = $(this).data('val');
            let webcfwc_varation_attr = $(this).data('attr');
            let parentContainer = $(this).closest('.cu_button_el');
            
            // Update select value
            $('select#' + webcfwc_varation_attr).val(webcfwc_variation_button_val).trigger('change');
            
            // Update button states
            parentContainer.find('button.webfwc_variation_button.selected').removeClass('selected');
            $(this).addClass('selected');
            
            // Trigger WooCommerce variation change
            $(this).closest('form.variations_form').find('input[name="' + webcfwc_varation_attr + '"]').val(webcfwc_variation_button_val).trigger('change');
        });
        
        // Update button states based on selected values
        updateVariationButtons();
    }
    
    function updateVariationButtons() {
        $(".cu_button_el").each(function(){
            let $container = $(this);
            let attribute = $container.data('attribute');
            let selected_val = $container.find('select.vairation_select').val();
            
            // Update selected button
            $container.find("button.webfwc_variation_button.selected").removeClass("selected");
            if(selected_val) {               
                $container.find("button.webfwc_variation_button[data-val='" + selected_val + "']").addClass("selected");
            }
            
            // Get available options
            let all_variation_options = $container.find("option");
            let variation_all_buttons = $container.find(".webfwc_variation_button");
            let option_values = [];
            
            $.each(all_variation_options, function(){
                let option_val = $(this).attr("value");
                if(option_val) option_values.push(option_val);
            });
            
            // Update button states
            $.each(variation_all_buttons, function(){
                let btn_val = $(this).data("val");
                if(option_values.includes(btn_val)) {
                    $(this).removeClass('webcfwc_btn_disable');
                } else {
                    $(this).addClass('webcfwc_btn_disable');
                }
            });
        });
    }
    
    // Handle variation select changes
    $(document).on('change', '.vairation_select', function(){
        updateVariationButtons();
    });
    
    // Initial update
    updateVariationButtons();
});
/* Variation switcher Frontend section end*/