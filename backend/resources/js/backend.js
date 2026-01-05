function opensppcfw(evt, cityName) {
    var i, tabcontent, tablinks;

    // Hide all tab content
    tabcontent = document.getElementsByClassName("tabcontent-sppcfw");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }

    // Remove active class from all tab buttons
    tablinks = document.getElementsByClassName("tablinks-sppcfw");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the current tab and add active class
    document.getElementById(cityName).classList.add("active");
    evt.currentTarget.classList.add("active");
}
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('defaultOpen')){
        document.getElementById('defaultOpen').click();
    }
});

jQuery(document).ready(function($) {
    $('select[name="sppcfw_advanced[custom_message_display_hook]"]').val(sppcfw_settings.custom_message_display_hook_dashboard);
});

jQuery(document).ready(function($) {
    $('select[name="sppcfw_advanced[variation_table_display_hook]"]').val(sppcfw_settings.variation_table_display_hook_dashboard);
});


// document.addEventListener('DOMContentLoaded', function () {
//     var img = document.createElement('img');
//     img.src = sppcfw_settings.logoUrl;
//     img.alt = "Site Logo";
//     img.style.width = "100%";

//     // Append it wherever you want, e.g., inside a div with ID "logo-container"
//     if (document.getElementById('logo-container-spc')){
//         document.getElementById('logo-container-spc').appendChild(img);
//     }
// });


jQuery(document).ready(function(){
    jQuery("#sppcfw_advanced_license form").on("submit",function(e){
        e.preventDefault();
        alert(jQuery(this).serialize());
        return false;
    });

    jQuery("input.checkbox").on('change',function(){
        let id = jQuery(this).attr("id");
        //alert(id);
        if(id==='wxspc-sppcfw_advanced[enable_min_max_qty]' || id==='sppcfw_cat[enable_min_max_qty]' || id==='sppcfw_product[enable_min_max_qty]'){
            sppcfw_min_max_enable_disable(this);
        }

        if(id==='wxspc-sppcfw_advanced[enable_custom_message]' || id==='sppcfw_cat[enable_custom_message]' || id==='sppcfw_product[enable_custom_message]'){
            sppcfw_custom_message_enable_disable(this);
            
        }

        if(id==='wxspc-sppcfw_advanced[enable_varition_table]' || id==='sppcfw_cat[enable_varition_table]' || id==='sppcfw_product[enable_varition_table]'){
            sppcfw_variation_table_enable_disable(this);
        }
        if(id==='wxspc-sppcfw_advanced[enable_change_tab_default_label]' || id==='sppcfw_cat[enable_change_tab_default_label]' || id==='sppcfw_product[enable_change_tab_default_label]'){
            sppcfw_tab_label_enable_disable(this);
        }
    });
});

/**
 * Tabbable JavaScript codes & Initiate Color Picker
 *
 * This code uses localstorage for displaying active tabs
 */
jQuery( document ).ready( function( $ ) {

    //Initiate Color Picker.
    $('.sppcfw-color-picker').iris();

    // Switches option sections
    $( '.sppcfw-group' ).hide();
    var activetab = '';
    /*if ( 'undefined' != typeof localStorage ) {
        activetab = localStorage.getItem( 'activetab' );
    }
	console.log(activetab);
    if ( '' != activetab){
        if($( activetab ).length){
            $( activetab ).fadeIn();
        }
    } else {
        $( '.sppcfw-group:first' ).fadeIn();
    }*/
    $( '.sppcfw-group .collapsed' ).each( function() {
        $( this )
            .find( 'input:checked' )
            .parent()
            .parent()
            .parent()
            .nextAll()
            .each( function() {
                if ( $( this ).hasClass( 'last' ) ) {
                    $( this ).removeClass( 'hidden' );
                    return false;
                }
                $( this )
                    .filter( '.hidden' )
                    .removeClass( 'hidden' );
            });
    });


    /*if( '' != activetab){
        if($( activetab + '-tab' ).length){
            $( activetab + '-tab' ).addClass( 'nav-tab-active' );
        }
    }else {
        $( '.nav-tab-wrapper a:first' ).addClass( 'nav-tab-active' );
    }
    $( '.nav-tab-wrapper a' ).click( function( evt ) {
        $( '.nav-tab-wrapper a' ).removeClass( 'nav-tab-active' );
        $( this )
            .addClass( 'nav-tab-active' )
            .blur();
        var clicked_group = $( this ).attr( 'href' );
        if ( 'undefined' != typeof localStorage ) {
            localStorage.setItem( 'activetab', $( this ).attr( 'href' ) );
        }
        $( '.group' ).hide();
        $( clicked_group ).fadeIn();
        evt.preventDefault();
    });*/

    $( '.wpsa-browse' ).on( 'click', function( event ) {
        event.preventDefault();

        var self = $( this );

        // Create the media frame.
        var file_frame = ( wp.media.frames.file_frame = wp.media({
            title: self.data( 'uploader_title' ),
            button: {
                text: self.data( 'uploader_button_text' )
            },
            multiple: false
        }) );

        file_frame.on( 'select', function() {
            attachment = file_frame
                .state()
                .get( 'selection' )
                .first()
                .toJSON();

            self
                .prev( '.wpsa-url' )
                .val( attachment.url )
                .change();
        });

        // Finally, open the modal
        file_frame.open();
    });

    $( 'input.wpsa-url' )
        .on( 'change keyup paste input', function() {
            var self = $( this );
            self
                .next()
                .parent()
                .children( '.wpsa-image-preview' )
                .children( 'img' )
                .attr( 'src', self.val() );
        })
        .change();
});
// WP_OSA ended.

// min max options hide show
function sppcfw_min_max_enable_disable(data){
    if(jQuery(data).is(":checked")){
        jQuery(".sppcfw_min_max").removeClass("sppcfw_admin_hidden");
    }else{
        jQuery(".sppcfw_min_max").addClass("sppcfw_admin_hidden");
    }
}

// custom message options hide show

function sppcfw_custom_message_enable_disable(data){
    if(jQuery(data).is(":checked")){
        jQuery(".sppcfw_custom_message").removeClass("sppcfw_admin_hidden");
    }else{
        jQuery(".sppcfw_custom_message").addClass("sppcfw_admin_hidden");
    }
}

// variation table options hide show

function sppcfw_variation_table_enable_disable(data){
    if(jQuery(data).is(":checked")){
        jQuery(".sppcfw_variation_table").removeClass("sppcfw_admin_hidden");
    }else{
        jQuery(".sppcfw_variation_table").addClass("sppcfw_admin_hidden");
    }
}

// tab label options hide show

function sppcfw_tab_label_enable_disable(data){
    if(jQuery(data).is(":checked")){
        jQuery(".sppcfw_tab_label").removeClass("sppcfw_admin_hidden");
    }else{
        jQuery(".sppcfw_tab_label").addClass("sppcfw_admin_hidden");
    }
}

function openSPPCFWTab(evt, Tab,wrapper) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = jQuery('#'+wrapper+' .tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = jQuery('#'+wrapper+' .tablinks');
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Tab).style.display = "block";
    evt.currentTarget.className += " active";
}


function sppcfwCustomTab(evt, Tab) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = jQuery("#sppcfw_content_area2").find("div.tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = jQuery("#sppcfw_content_area2").find("button.tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Tab).style.display = "block";
    
    evt.currentTarget.className += " active";
    
}

function sppcfwCustomContent(evt, Tab) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = jQuery("#sppcfw_product_category_additonal_content").find("div.tabcontent2");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = jQuery("#sppcfw_product_category_additonal_content").find("button.tablinks2");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Tab).style.display = "block";
    
    evt.currentTarget.className += " active";
    
}


function sppcfwCustomContentProduct(evt, Tab) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = jQuery("#sppcfw_aditional_content_area").find("div.tabcontent2");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = jQuery("#sppcfw_aditional_content_area").find("button.tablinks2");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Tab).style.display = "block";
    
    evt.currentTarget.className += " active";
    
}

function sppcfw_vertical_tabs(evt, Tab,wrapper_id){
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = jQuery("#"+wrapper_id+"").find("div.tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = jQuery("#"+wrapper_id+"").find("button.tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Tab).style.display = "block";
    
    evt.currentTarget.className += " active";
}



jQuery(document).ajaxSuccess(function(e, request, settings){
    var object = deparam(settings.data);
    if(object.action === 'add-tag'){
        if(object.taxonomy === 'product_cat'){
            let sppcfw_basic = sppcfw_settings.sppcfw_basic;
            jQuery("#sppcfw_cat_out_of_stock_text").val(sppcfw_basic.out_of_stock_text);
            jQuery("#sppcfw_cat_sale_badge_text").val(sppcfw_basic.sale_badge_text);
            jQuery("#sppcfw_cat_add_to_cart_button_text").val(sppcfw_basic.add_to_cart_button_text);

            jQuery("#sppcfw_cat_out_of_stock_text").val(sppcfw_basic.out_of_stock_text);
            jQuery("#sppcfw_cat_out_of_stock_text").val(sppcfw_basic.out_of_stock_text);
            jQuery("#sppcfw_cat_out_of_stock_text").val(sppcfw_basic.out_of_stock_text);

            let sppcfw_advanced = sppcfw_settings.sppcfw_advanced;
            jQuery("#sppcfw_cat_min_max_qty_global_min_value").val(sppcfw_advanced.min_max_qty_global_min_value);
            jQuery("#sppcfw_cat_min_qty_validation_text").val(sppcfw_advanced.min_qty_validation_text);
            jQuery("#sppcfw_cat_min_max_qty_global_max_value").val(sppcfw_advanced.min_max_qty_global_max_value);
            jQuery("#sppcfw_cat_max_qty_validation_text").val(sppcfw_advanced.max_qty_validation_text);

            jQuery("#sppcfw_cat_plus_minus_button_qty_change_global_setp").val(sppcfw_advanced.plus_minus_button_qty_change_global_setp);
            jQuery("#sppcfw_cat_custom_message_text").val(sppcfw_advanced.custom_message_text);
            jQuery("#sppcfw_cat_description_tab_label").val(sppcfw_advanced.description_tab_label);
            jQuery("#sppcfw_cat_additional_information_tab_label").val(sppcfw_advanced.additional_information_tab_label);
            jQuery("#sppcfw_cat_review_tab_label").val(sppcfw_advanced.review_tab_label);
            jQuery("#sppcfw_cat_related_products_title").val(sppcfw_advanced.related_products_title);
            jQuery("#sppcfw_cat_upsell_products_title").val(sppcfw_advanced.upsell_products_title);
            jQuery("#sppcfw_cat_change_clear_text").val(sppcfw_advanced.change_clear_text);
            jQuery("#sppcfw_cat_change_backorder_text").val(sppcfw_advanced.change_backorder_text);
        }
    }
});

jQuery(document).ready(function(){
    jQuery("#sppcfw_import_settings_from_category,#sppcfw_import_global_settings").on('click',function(){
        let action = jQuery(this).attr("id");
        let category_id=0;
        let category_name='';
        if(action==='sppcfw_import_settings_from_category'){
            jQuery('input[name^="tax_input[product_cat]"]:checked').each(function() {
                category_id = jQuery(this).val();             
                category_name = jQuery(this).parent().text();
                return false;
            });

            data = {action:action,category_id:category_id};
        }else{
            category_id=1;
            data = {action:action,category_id:category_id};
        }

        if(category_id>0){
            let element=jQuery("#sppcfw_add_product_meta_box_id");
            element.block({ message: 'Please wait... it\'s importing settings', overlayCSS: { background: '#fff', opacity: 0.6 } });
            jQuery.post(sppcfw_settings.ajaxurl,data,function(obj){
                if(obj.hasOwnProperty('enable_plus_minus_button')){
                    console.log(obj.hasOwnProperty('enable_plus_minus_button'));
                    if(obj.enable_plus_minus_button==='on'){
                        jQuery("#sppcfw_product_enable_plus_minus_button").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_enable_plus_minus_button").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_enable_plus_minus_button").prop("checked",false); 
                }

                if(obj.hasOwnProperty('out_of_stock_text')){
                    jQuery("#sppcfw_product_out_of_stock_text").val(obj.out_of_stock_text);
                }else{
                    jQuery("#sppcfw_product_out_of_stock_text").val(''); 
                }

                if(obj.hasOwnProperty('sale_badge_text')){
                    jQuery("#sppcfw_product_sale_badge_text").val(obj.sale_badge_text);
                }else{
                    jQuery("#sppcfw_product_sale_badge_text").val(''); 
                }

                if(obj.hasOwnProperty('sale_badge_text')){
                    jQuery("#sppcfw_product_add_to_cart_button_text").val(obj.add_to_cart_button_text);
                }else{
                    jQuery("#sppcfw_product_add_to_cart_button_text").val(''); 
                }

                if(obj.hasOwnProperty('remove_product_meta')){
                    if(obj.remove_product_meta==='on'){
                        jQuery("#sppcfw_product_remove_product_meta").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_remove_product_meta").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_remove_product_meta").prop("checked",false); 
                }

                if(obj.hasOwnProperty('remove_related_product_section')){
                    if(obj.remove_related_product_section==='on'){
                        jQuery("#sppcfw_product_remove_related_product_section").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_remove_related_product_section").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_remove_related_product_section").prop("checked",false); 
                }

                if(obj.hasOwnProperty('remove_product_rating')){
                    if(obj.remove_product_rating==='on'){
                        jQuery("#sppcfw_product_remove_product_rating").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_remove_product_rating").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_remove_product_rating").prop("checked",false); 
                }

                if(obj.hasOwnProperty('hide_product_price')){
                    if(obj.hide_product_price==='on'){
                        jQuery("#sppcfw_product_hide_product_price").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_hide_product_price").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_hide_product_price").prop("checked",false); 
                }

                if(obj.hasOwnProperty('hide_add_to_cart_button')){
                    if(obj.hide_add_to_cart_button==='on'){
                        jQuery("#sppcfw_product_hide_add_to_cart_button").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_hide_add_to_cart_button").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_hide_add_to_cart_button").prop("checked",false); 
                }

                if(obj.hasOwnProperty('hide_short_description')){
                    if(obj.hide_short_description==='on'){
                        jQuery("#sppcfw_product_hide_short_description").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product_hide_short_description").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product_hide_short_description").prop("checked",false); 
                }

                // advanced settings
                if(obj.hasOwnProperty('enable_ajax_add_to_cart')){
                    if(obj.enable_ajax_add_to_cart==='on'){
                        jQuery("#sppcfw_product\\[enable_ajax_add_to_cart\\]").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product\\[enable_ajax_add_to_cart\\]").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_ajax_add_to_cart\\]").prop("checked",false); 
                }

                if(obj.hasOwnProperty('enable_min_max_qty')){
                    if(obj.enable_min_max_qty==='on'){
                        jQuery("#sppcfw_product\\[enable_min_max_qty\\]").prop("checked",true).trigger('change');
                        jQuery("#sppcfw_product_min_max_qty_global_min_value").val(obj.min_max_qty_global_min_value);
                        jQuery("#sppcfw_product_min_qty_validation_text").val(obj.min_qty_validation_text);
                        jQuery("#sppcfw_product_min_max_qty_global_max_value").val(obj.min_max_qty_global_max_value);
                        jQuery("#sppcfw_product_max_qty_validation_text").val(obj.max_qty_validation_text);
                        jQuery("#sppcfw_product_plus_minus_button_qty_change_global_setp").val(obj.plus_minus_button_qty_change_global_setp);

                    }else{
                        jQuery("#sppcfw_product\\[enable_min_max_qty\\]").prop("checked",false).trigger('change');
                        jQuery("#sppcfw_product_min_max_qty_global_min_value").val('');
                        jQuery("#sppcfw_product_min_qty_validation_text").val('');
                        jQuery("#sppcfw_product_min_max_qty_global_max_value").val('');
                        jQuery("#sppcfw_product_max_qty_validation_text").val('');
                        jQuery("#sppcfw_product_plus_minus_button_qty_change_global_setp").val('');
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_min_max_qty\\]").prop("checked",false).trigger('change');
                    jQuery("#sppcfw_product_min_max_qty_global_min_value").val('');
                    jQuery("#sppcfw_product_min_qty_validation_text").val('');
                    jQuery("#sppcfw_product_min_max_qty_global_max_value").val('');
                    jQuery("#sppcfw_product_max_qty_validation_text").val('');
                    jQuery("#sppcfw_product_plus_minus_button_qty_change_global_setp").val('');
                }

                if(obj.hasOwnProperty('enable_custom_message')){
                    if(obj.enable_custom_message==='on'){
                        jQuery("#sppcfw_product\\[enable_custom_message\\]").prop("checked",true).trigger('change');
                        jQuery("#sppcfw_product_custom_message_text").val(obj.custom_message_text);
                        jQuery("#sppcfw_product\\[custom_message_display_hook\\]").val(obj.custom_message_display_hook);

                    }else{
                        jQuery("#sppcfw_product\\[enable_custom_message\\]").prop("checked",false).trigger('change');
                        jQuery("#sppcfw_product_custom_message_text").val('');
                        jQuery("#sppcfw_product\\[custom_message_display_hook\\]").val('');
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_custom_message\\]").prop("checked",false).trigger('change');
                    jQuery("#sppcfw_product_custom_message_text").val('');
                    jQuery("#sppcfw_product\\[custom_message_display_hook\\]").val('');
                }

                if(obj.hasOwnProperty('enable_varition_table')){
                    if(obj.enable_varition_table==='on'){
                        jQuery("#sppcfw_product\\[enable_varition_table\\]").prop("checked",true).trigger('change');
                        jQuery("#sppcfw_product\\[variation_table_display_hook\\]").val(obj.variation_table_display_hook);

                    }else{
                        jQuery("#sppcfw_product\\[enable_varition_table\\]").prop("checked",false).trigger('change');
                        jQuery("#sppcfw_product\\[variation_table_display_hook\\]").val('');
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_varition_table\\]").prop("checked",false).trigger('change');
                    jQuery("#sppcfw_product\\[variation_table_display_hook\\]").val('');
                }

                if(obj.hasOwnProperty('enable_change_tab_default_label')){
                    if(obj.enable_change_tab_default_label==='on'){
                        jQuery("#sppcfw_product\\[enable_change_tab_default_label\\]").prop("checked",true).trigger('change');
                        jQuery("#sppcfw_product_description_tab_label").val(obj.description_tab_label);
                        jQuery("#sppcfw_product_additional_information_tab_label").val(obj.additional_information_tab_label);
                        jQuery("#sppcfw_product_review_tab_label").val(obj.review_tab_label);

                    }else{
                        jQuery("#sppcfw_product\\[enable_change_tab_default_label\\]").prop("checked",false).trigger('change');
                        jQuery("#sppcfw_product_description_tab_label").val('');
                        jQuery("#sppcfw_product_additional_information_tab_label").val('');
                        jQuery("#sppcfw_product_review_tab_label").val('');
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_change_tab_default_label\\]").prop("checked",false).trigger('change');
                    jQuery("#sppcfw_product_description_tab_label").val('');
                    jQuery("#sppcfw_product_additional_information_tab_label").val('');
                    jQuery("#sppcfw_product_review_tab_label").val('');
                }

                if(obj.hasOwnProperty('enable_layout_switcher')){
                    if(obj.enable_layout_switcher==='on'){
                        jQuery("#sppcfw_product\\[enable_layout_switcher\\]").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product\\[enable_layout_switcher\\]").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_layout_switcher\\]").prop("checked",false); 
                }

                if(obj.hasOwnProperty('related_products_title')){
                    jQuery("#sppcfw_product_related_products_title").val(obj.related_products_title);
                }else{
                    jQuery("#sppcfw_product_related_products_title").val(''); 
                }

                if(obj.hasOwnProperty('upsell_products_title')){
                    jQuery("#sppcfw_product_upsell_products_title").val(obj.upsell_products_title);
                }else{
                    jQuery("#sppcfw_product_upsell_products_title").val(''); 
                }

                if(obj.hasOwnProperty('related_products_title')){
                    jQuery("#sppcfw_product_related_products_title").val(obj.related_products_title);
                }else{
                    jQuery("#sppcfw_product_related_products_title").val(''); 
                }

                if(obj.hasOwnProperty('change_clear_text')){
                    jQuery("#sppcfw_product_change_clear_text").val(obj.change_clear_text);
                }else{
                    jQuery("#sppcfw_product_change_clear_text").val(''); 
                }

                if(obj.hasOwnProperty('change_backorder_text')){
                    jQuery("#sppcfw_product_change_backorder_text").val(obj.change_backorder_text);
                }else{
                    jQuery("#sppcfw_product_change_backorder_text").val(''); 
                }

                if(obj.hasOwnProperty('enable_quick_cart')){
                    if(obj.enable_quick_cart==='on'){
                        jQuery("#sppcfw_product\\[enable_quick_cart\\]").prop("checked",true);
                    }else{
                        jQuery("#sppcfw_product\\[enable_quick_cart\\]").prop("checked",false); 
                    }
                }else{
                    jQuery("#sppcfw_product\\[enable_quick_cart\\]").prop("checked",false); 
                }

                element.unblock();
            });
        }else{
            alert('There is no product category checked yet!');
        }
    });
});



/* Add new div on single product tab sesction */

jQuery(document).ready(function($){



});


function sppcfw_add_new_additional_content_tab_item(data){
    let i = parseInt(jQuery(data).attr("data-next"));

    let tab_button_html =`<button type="button" id="sppcfw_custom_tab_button_text_${i}" data-index="${i}" class="tablinks2 active" onclick="sppcfwCustomContent(event, 'sppcfw_custom_tab_content_${i}')">Content</button>`;
    let additional_content_display_hooks=`<select name="sppcfw_cat[sppcfw_custom_additional_content_display_hook][]">`;
    let hooks=sppcfw_settings.sppcfw_wc_action_hooks;
    //console.log(hooks);
    for(let x in hooks){
        additional_content_display_hooks+=`<option value="${x}">${hooks[x]}</option>`;
        //console.log(hooks[x]);
    }
    additional_content_display_hooks+=`</select>`;
    let tab_content_html=`<div id="sppcfw_custom_tab_content_${i}" class="tabcontent2" style="display:block;">
        <div class="sppcfw_tab_title_input_area"><input type="text" value="Content" id="sppcfw_custom_tab_title_input_${i}" name="sppcfw_cat[sppcfw_custom_additional_content_title][]" data-index="${i}" onkeyup="sppcfw_update_content_title_text(this)" placeholder="Content name"><button class="button button-remove" onclick="sppcfw_backend_remove_content(this)" data-index="${i}" type="button">Remove</button></div>
        <br/><br/>
        `+additional_content_display_hooks+`<br/><br/>
        <div style="clear:both" class="wp-media-buttons"><button type="button" id="custom_tab_media_button_${i}" class="button insert-media add_media" data-editor="sppcfw_custom_tab_title_textarea_${i}"><span class="wp-media-buttons-icon"></span> Add Media</button></div>
        <textarea id="sppcfw_custom_tab_title_textarea_${i}" class="wp-editor-area" name="sppcfw_cat[sppcfw_custom_additional_content][]"></textarea>
        
    </div>`;

    jQuery("#sppcfw_cat_additional_tab_items button.tablinks2.active").removeClass('active');
    jQuery("#sppcfw_single_product_tabcontent_main div.tabcontent2").hide();

    jQuery("#sppcfw_cat_additional_tab_items").append(tab_button_html);
    jQuery("#sppcfw_single_product_tabcontent_main").append(tab_content_html);
    if ( tinymce !== 'undefined'){

        var settings = {
            tinymce: {
                branding: false,
                theme: 'modern',
                skin: 'lightgray',
                language: 'en',
                formats: {
                    alignleft: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'left' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignleft' }
                    ],
                    aligncenter: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'center' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'aligncenter' }
                    ],
                    alignright: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'right' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignright' }
                    ],
                    strikethrough: { inline: 'del' }
                },
                relative_urls: false,
                remove_script_host: false,
                convert_urls: false,
                browser_spellcheck: true,
                fix_list_elements: true,
                entities: '38,amp,60,lt,62,gt',
                entity_encoding: 'raw',
                keep_styles: false,
                paste_webkit_styles: 'font-weight font-style color',
                preview_styles: 'font-family font-size font-weight font-style text-decoration text-transform',
                end_container_on_empty_block: true,
                wpeditimage_disable_captions: false,
                wpeditimage_html5_captions: true,
                plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
                menubar: false,
                wpautop: true,
                indent: false,
                resize: true,
                theme_advanced_resizing: true,
                theme_advanced_resize_horizontal: false,
                statusbar: true,
                toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_adv',
                toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                toolbar3: '',
                toolbar4: '',
                tabfocus_elements: ':prev,:next',
                height:400,
                width: '100%',
                // body_class: 'id post-type-post post-status-publish post-format-standard',
                setup: function( editor ) {
                    editor.on( 'init', function() {
                        this.getBody().style.fontFamily = 'Georgia, "Times New Roman", "Bitstream Charter", Times, serif';
                        this.getBody().style.fontSize = '16px';
                        this.getBody().style.color = '#333';
                    });
                },
            },
            quicktags: {
                buttons:"strong,em,link,block,del,ins,img,ul,ol,li,code,more,close"
            }
        }
        wp.editor.initialize( "sppcfw_custom_tab_title_textarea_"+i+"", settings );
    }
    //jQuery("button#sppcfw_custom_tab_button_text_"+i+"").click();
    jQuery(data).attr("data-next",(i+1));
}

function sppcfw_add_new_additional_content_tab_item_for_product(data){
    let i = parseInt(jQuery(data).attr("data-next"));

    let tab_button_html =`<button type="button" id="sppcfw_custom_addi_content_button_text_${i}" data-index="${i}" class="tablinks2 active" onclick="sppcfwCustomContentProduct(event, 'sppcfw_custom_addi_content_${i}')">Content</button>`;
    let additional_content_display_hooks=`<select name="sppcfw_custom_additional_content_display_hook[]">`;
    let hooks=sppcfw_settings.sppcfw_wc_action_hooks;
    //console.log(hooks);
    for(let x in hooks){
        additional_content_display_hooks+=`<option value="${x}">${hooks[x]}</option>`;
        //console.log(hooks[x]);
    }
    additional_content_display_hooks+=`</select>`;
    let tab_content_html=`<div id="sppcfw_custom_addi_content_${i}" class="tabcontent2" style="display:block;">
        <div class="sppcfw_tab_title_input_area"><input type="text" value="Content" id="sppcfw_custom_addi_content_title_input_${i}" name="sppcfw_custom_additional_content_title[]" data-index="${i}" onkeyup="sppcfw_update_product_addi_content_title_text(this)" placeholder="Content name"><button class="button button-remove" onclick="sppcfw_backend_remove_content_product_addi_content(this)" data-index="${i}" type="button">Remove</button></div>
        <br/><br/>
        `+additional_content_display_hooks+`<br/><br/>
        <div style="clear:both" class="wp-media-buttons"><button type="button" id="custom_addi_content_media_button_${i}" class="button insert-media add_media" data-editor="sppcfw_custom_addi_content_textarea_${i}"><span class="wp-media-buttons-icon"></span> Add Media</button></div>
        <textarea id="sppcfw_custom_addi_content_textarea_${i}" class="wp-editor-area" name="sppcfw_custom_additional_content[]"></textarea>
        
    </div>`;

    jQuery("#sppcfw_custom_additional_content_tab_items button.tablinks2.active").removeClass('active');
    jQuery("#sppcfw_single_product_additional_content_main div.tabcontent2").hide();

    jQuery("#sppcfw_custom_additional_content_tab_items").append(tab_button_html);
    jQuery("#sppcfw_single_product_additional_content_main").append(tab_content_html);
    if ( tinymce !== 'undefined'){

        var settings = {
            tinymce: {
                branding: false,
                theme: 'modern',
                skin: 'lightgray',
                language: 'en',
                formats: {
                    alignleft: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'left' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignleft' }
                    ],
                    aligncenter: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'center' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'aligncenter' }
                    ],
                    alignright: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'right' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignright' }
                    ],
                    strikethrough: { inline: 'del' }
                },
                relative_urls: false,
                remove_script_host: false,
                convert_urls: false,
                browser_spellcheck: true,
                fix_list_elements: true,
                entities: '38,amp,60,lt,62,gt',
                entity_encoding: 'raw',
                keep_styles: false,
                paste_webkit_styles: 'font-weight font-style color',
                preview_styles: 'font-family font-size font-weight font-style text-decoration text-transform',
                end_container_on_empty_block: true,
                wpeditimage_disable_captions: false,
                wpeditimage_html5_captions: true,
                plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
                menubar: false,
                wpautop: true,
                indent: false,
                resize: true,
                theme_advanced_resizing: true,
                theme_advanced_resize_horizontal: false,
                statusbar: true,
                toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_adv',
                toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                toolbar3: '',
                toolbar4: '',
                tabfocus_elements: ':prev,:next',
                height:400,
                width: '100%',
                // body_class: 'id post-type-post post-status-publish post-format-standard',
                setup: function( editor ) {
                    editor.on( 'init', function() {
                        this.getBody().style.fontFamily = 'Georgia, "Times New Roman", "Bitstream Charter", Times, serif';
                        this.getBody().style.fontSize = '16px';
                        this.getBody().style.color = '#333';
                    });
                },
            },
            quicktags: {
                buttons:"strong,em,link,block,del,ins,img,ul,ol,li,code,more,close"
            }
        }
        wp.editor.initialize( "sppcfw_custom_addi_content_textarea_"+i+"", settings );
    }
    //jQuery("button#sppcfw_custom_tab_button_text_"+i+"").click();
    jQuery(data).attr("data-next",(i+1));
}


function sppcfw_add_new_custom_tab_item(data){
    let i = parseInt(jQuery(data).attr("data-next"));

    let tab_button_html =`<button type="button" id="sppcfw_custom_tab_button_text_${i}" data-index="${i}" class="tablinks active" onclick="sppcfwCustomTab(event, 'sppcfw_custom_tab_content_${i}')">Tab title</button>`;
    let tab_content_html=`<div id="sppcfw_custom_tab_content_${i}" class="tabcontent" style="display:block;">
        <div class="sppcfw_tab_title_input_area"><input type="text" value="Tab title" id="sppcfw_custom_tab_title_input_${i}" name="sppcfw_custom_tab_title[]" data-index="${i}" onkeyup="sppcfw_update_tab_title_text(this)" placeholder="Tab title"><button class="button button-remove" onclick="sppcfw_backend_remove_tab(this)" data-index="${i}" type="button">Remove this tab</button></div>
        <br/><br/>
        <div style="clear:both" class="wp-media-buttons"><button type="button" id="custom_tab_media_button_${i}" class="button insert-media add_media" data-editor="sppcfw_custom_tab_title_textarea_${i}"><span class="wp-media-buttons-icon"></span> Add Media</button></div>
        <textarea id="sppcfw_custom_tab_title_textarea_${i}" class="wp-editor-area" name="sppcfw_custom_tab_content[]"></textarea>
        
    </div>`;

    jQuery("#sppcfw_content_area2 button.tablinks.active").removeClass('active');
    jQuery("#sppcfw_single_product_tabcontent_main div.tabcontent").hide();

    jQuery("#sppcfw_single_product_custom_tab_items").append(tab_button_html);
    jQuery("#sppcfw_single_product_tabcontent_main").append(tab_content_html);
    if ( tinymce !== 'undefined'){
        //console.log(tinymce);
        var settings = {
            tinymce: {
                branding: false,
                theme: 'modern',
                skin: 'lightgray',
                language: 'en',
                formats: {
                    alignleft: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'left' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignleft' }
                    ],
                    aligncenter: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'center' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'aligncenter' }
                    ],
                    alignright: [
                        { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign:'right' } },
                        { selector: 'img,table,dl.wp-caption', classes: 'alignright' }
                    ],
                    strikethrough: { inline: 'del' }
                },
                relative_urls: false,
                remove_script_host: false,
                convert_urls: false,
                browser_spellcheck: true,
                fix_list_elements: true,
                entities: '38,amp,60,lt,62,gt',
                entity_encoding: 'raw',
                keep_styles: false,
                paste_webkit_styles: 'font-weight font-style color',
                preview_styles: 'font-family font-size font-weight font-style text-decoration text-transform',
                end_container_on_empty_block: true,
                wpeditimage_disable_captions: false,
                wpeditimage_html5_captions: true,
                plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
                menubar: false,
                wpautop: true,
                indent: false,
                resize: true,
                theme_advanced_resizing: true,
                theme_advanced_resize_horizontal: false,
                statusbar: true,
                toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_adv',
                toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                toolbar3: '',
                toolbar4: '',
                tabfocus_elements: ':prev,:next',
                height:400,
                width: '100%',
                // body_class: 'id post-type-post post-status-publish post-format-standard',
                setup: function( editor ) {
                    editor.on( 'init', function() {
                        this.getBody().style.fontFamily = 'Georgia, "Times New Roman", "Bitstream Charter", Times, serif';
                        this.getBody().style.fontSize = '16px';
                        this.getBody().style.color = '#333';
                    });
                },
            },
            quicktags: {
                buttons:"strong,em,link,block,del,ins,img,ul,ol,li,code,more,close"
            }
        }
        wp.editor.initialize( "sppcfw_custom_tab_title_textarea_"+i+"", settings );
    }
    //jQuery("button#sppcfw_custom_tab_button_text_"+i+"").click();
    jQuery(data).attr("data-next",(i+1));
}

function sppcfw_update_tab_title_text(data){
    let value = jQuery(data).val().trim();
    let index = jQuery(data).attr("data-index");
    let tab_title = 'Tab '+index;
    if(value) tab_title=value;
    jQuery("#sppcfw_custom_tab_button_text_"+index+"").text(tab_title);
}

function sppcfw_update_content_title_text(data){
    let value = jQuery(data).val().trim();
    let index = jQuery(data).attr("data-index");
    let tab_title = 'Content '+index;
    if(value) tab_title=value;
    jQuery("#sppcfw_custom_tab_button_text_"+index+"").text(tab_title);
}

function sppcfw_update_product_addi_content_title_text(data){
    let value = jQuery(data).val().trim();
    let index = jQuery(data).attr("data-index");
    let tab_title = 'Content '+index;
    if(value) tab_title=value;
    jQuery("#sppcfw_custom_addi_content_button_text_"+index+"").text(tab_title);
}

function sppcfw_backend_remove_tab(data){
    if(confirm('Are you sure?')){

        let index = jQuery(data).attr("data-index");
        tinymce.get("sppcfw_custom_tab_title_textarea_"+index+"").remove();
        jQuery("#sppcfw_single_product_custom_tab_items").find("button#sppcfw_custom_tab_button_text_"+index+"").remove();
        jQuery("#sppcfw_single_product_tabcontent_main").find("div#sppcfw_custom_tab_content_"+index+"").remove();

        
        let first_tab=jQuery("#sppcfw_single_product_custom_tab_items button:first");
        if(first_tab.length>0){
            jQuery(first_tab).addClass("active");
            let target_index=jQuery(first_tab).attr("data-index");
            jQuery("div#sppcfw_custom_tab_content_"+target_index+"").show();
        }
    }
}


function sppcfw_backend_remove_content(data){
    if(confirm('Are you sure?')){

        let index = jQuery(data).attr("data-index");
        tinymce.get("sppcfw_custom_tab_title_textarea_"+index+"").remove();
        jQuery("#sppcfw_product_category_additonal_content").find("button#sppcfw_custom_tab_button_text_"+index+"").remove();
        jQuery("#sppcfw_product_category_additonal_content").find("div#sppcfw_custom_tab_content_"+index+"").remove();

        
        let first_tab=jQuery("#sppcfw_cat_additional_tab_items button:first");
        if(first_tab.length>0){
            jQuery(first_tab).addClass("active");
            let target_index=jQuery(first_tab).attr("data-index");
            jQuery("div#sppcfw_custom_tab_content_"+target_index+"").show();
        }
    }
}


function sppcfw_backend_remove_content_product_addi_content(data){
    if(confirm('Are you sure?')){

        let index = jQuery(data).attr("data-index");
        tinymce.get("sppcfw_custom_addi_content_textarea_"+index+"").remove();
        jQuery("#sppcfw_product_additonal_content").find("button#sppcfw_custom_addi_content_button_text_"+index+"").remove();
        jQuery("#sppcfw_product_additonal_content").find("div#sppcfw_custom_addi_content_"+index+"").remove();

        
        let first_tab=jQuery("#sppcfw_custom_additional_content_tab_items button:first");
        if(first_tab.length>0){
            jQuery(first_tab).addClass("active");
            let target_index=jQuery(first_tab).attr("data-index");
            jQuery("div#sppcfw_custom_addi_content_"+target_index+"").show();
        }
    }
}

function sppcfw_tab_re_indexing(){

}


function generate_custom_link(element) {
    const targetUrl = element.dataset.url;

    if (targetUrl) {
        window.open(targetUrl, '_blank');
    }
}



