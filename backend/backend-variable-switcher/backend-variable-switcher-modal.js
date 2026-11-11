jQuery(document).ready(function ($) {
    const modal = jQuery('#icon-dox-modal');
    const closeModal = jQuery('.icon-dox-close');
    const insertButton = jQuery('.insert-icon-button');
    const iconContainer = jQuery('#icon-dox-icons');
    const tabs = jQuery('.icon-dox-tabs li');
    const searchInput = jQuery('.icon-dox-search');
    const previewContainer = jQuery('#webcfwc_variation_add_icon');
    const selectElement = jQuery('#webcfwc_variation_icon');

    let icons = [];
    let selectedIcon = null;
    let currentLibrary = null;
    let currentStyle = 'all'; // Default to 'all' icons

    // Open Modal
    selectElement.on('change', function () {
        const library = selectElement.val();
        currentLibrary = library;
        modal.show();
        previewContainer.show();
        modal.find('h2').text(`${library.toUpperCase()} ICON LIBRARY`);
        fetchIcons(currentLibrary);
        toggleTabsVisibility(library, currentStyle);
    });

    // Close Modal
    closeModal.on('click', function () {
        modal.hide();
        selectedIcon = null;
    });

    // Handle tab switching
    tabs.on('click', function () {
        tabs.removeClass('active');
        jQuery(this).addClass('active');
        currentStyle = jQuery(this).data('style');
        fetchIcons(currentLibrary);
    });

    // Fetch Icons
    function fetchIcons(library) {
        iconContainer.html(''); // Clear previous icons
        let ajaxURL;

        try {
            if (library === 'fontawesome') {
                ajaxURL = iconDoxAjax.fontawesome_jsonUrl;
            } else if (library === 'iconsmind') {
                ajaxURL = iconDoxAjax.iconsmind_json_url;
            } else if (library === 'linea') {
                ajaxURL = iconDoxAjax.linea_json_url;
            } else if (library === 'linecon') {
                ajaxURL = iconDoxAjax.linecon_json_url;
            } else if (library === 'steadysets') {
                ajaxURL = iconDoxAjax.steadysets_json_url;
            }

            $.ajax({
                url: ajaxURL,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    console.log(data);
                    icons = library === 'fontawesome' ? parseFontAwesomeData(data) : parseRandomIconsData(data);
                    renderIcons(); // Render icons based on the current style
                },
                error: function (xhr) {
                    console.error('Error fetching icons:', xhr.statusText);
                    iconContainer.html('<p>' + wp.i18n.__( 'Error loading icons. Please try again later.', 'single-product-customizer' ) + '</p>');
                }
            });
        } catch (error) {
            console.error('Error fetching icons:', error);
            iconContainer.html('<p>' + wp.i18n.__( 'Error loading icons. Please try again later.', 'single-product-customizer' ) + '</p>');
        }
    }

    // Icons data parsing methods 
    function parseFontAwesomeData(data) {
        return Object.keys(data).map(key => ({
            name: key,
            class: key,
            styles: data[key].styles,
            unicode: data[key].unicode
        }));
    }

    function parseRandomIconsData(data) {
        return data.map(icon => ({
            name: icon.title,
            class: icon.class,
            attrs: icon["data-fip-value"]
        }));
    }

    // Render Icons
    function renderIcons() {
        let filteredIcons = currentStyle === 'all' ? icons : icons.filter(icon => icon.styles.includes(currentStyle));

        if (filteredIcons.length === 0) {
            iconContainer.html('<p>' + wp.i18n.__( 'No icons found.', 'single-product-customizer' ) + '</p>');
            return;
        }

        filteredIcons.forEach(icon => {
            const divElement = jQuery('<div>', { class: 'iconItem', 'data-name': icon.name });
            const iconElement = jQuery('<i>');
            const spanElement = jQuery('<span>').text(formatIconName(icon.name));

            if (currentLibrary === 'fontawesome') {
                const prefix = icon.styles && icon.styles.includes('brands') ? 'fab' : 'fa';
                iconElement.addClass(`${prefix} fa-${icon.name}`);
            } else {
                iconElement.addClass(icon.class);
            }

            divElement.append(iconElement).append(spanElement).attr('title', formatIconName(icon.name));
            iconContainer.append(divElement);

            // Icon selection
            divElement.on('click', function () {
                jQuery('.iconItem', iconContainer).removeClass('selected');
                jQuery(this).addClass('selected');
                selectedIcon = icon.name;
            });
        });
    }

    // Format Icon Name
    function formatIconName(icon) {
        let result = icon.replace(/(fab|fas|fa|fa-|iconsmind|icon-arrows|icon-basic|linecon|steadysets)/gi, '').trim();
        result = result.replace(/-/i, ' ').trim();
        return result.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Insert Selected Icon
    insertButton.on('click', function () {
        if (selectedIcon) {
            const selectedIconData = icons.find(icon => icon.class === selectedIcon);
            const otherLibraries = ['iconsmind', 'linea', 'linecon', 'steadysets'];

            if (currentLibrary === 'fontawesome') {
                const prefix = selectedIconData.styles.includes('brands') ? 'fab' : 'fa';
                previewContainer.val(`${prefix} fa-${selectedIcon}`);
            } else if (otherLibraries.includes(currentLibrary)) {
                previewContainer.val(selectedIconData.class);
            }

            modal.hide();
            selectedIcon = null;
        } else {
            alert(wp.i18n.__( 'Please select an icon before inserting.', 'single-product-customizer' ));
        }
    });

    // Filter Icons
    searchInput.on('input', function () {
        const filter = jQuery(this).val().toLowerCase();
        jQuery('#icon-dox-icons .iconItem').each(function () {
            const iconName = jQuery(this).attr('title').toLowerCase();
            jQuery(this).toggle(iconName.includes(filter));
        });
    });

    // Toggle Tabs Visibility
    function toggleTabsVisibility(library) {
        tabs.each(function () {
            const tab = jQuery(this);
            const dataStyle = tab.data('style');

            if (library === 'fontawesome' || dataStyle === 'all') {
                tab.show();
            } else {
                tab.hide();
            }
        });

        const allTab = jQuery('.icon-dox-tabs li[data-style="all"]');
        if (allTab.length) {
            allTab.addClass('active').siblings().removeClass('active');
            currentStyle = 'all';
        }
    }
});


