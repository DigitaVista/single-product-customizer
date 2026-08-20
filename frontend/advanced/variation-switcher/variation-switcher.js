/* Variation switcher Frontend section */
jQuery(function ($) {
  initVariationSwitcher();
  setTimeout(setVariationsFromURL, 50);

  $(document)
    .on("found_variation reset_data", "form.variations_form", function () {
      setTimeout(initVariationSwitcher, 100);
    })
    .on("change", ".sppcfw-variation-select", function () {
      setTimeout(initVariationSwitcher, 100);
    })
    .on("show_variation hide_variation", function () {
      setTimeout(updateVariationButtons, 50);
    });

  function initVariationSwitcher() {
    $(".sppcfw-variation-button.color").each(function () {
      let bgColor = $(this).data("bg-color");
      if (bgColor) $(this).css("background-color", bgColor);
    });

    $("button.sppcfw-variation-button")
      .off("click")
      .on("click", function () {
        if ($(this).hasClass("sppcfw-btn-disable")) return false;

        let btnVal = $(this).data("val");
        let $parent = $(this).closest(".sppcfw-cu-button-el");
        let $select = $parent.find("select.sppcfw-variation-select");

        $select.val(btnVal).trigger("change");

        let selectName = $select.attr("name");
        if (selectName) {
          $parent
            .closest("form.variations_form")
            .find('input[name="' + selectName + '"]')
            .val(btnVal)
            .trigger("change");
        }

        $parent
          .find("button.sppcfw-variation-button.selected")
          .removeClass("selected");
        $(this).addClass("selected");
      });

    updateVariationButtons();
  }

  function updateVariationButtons() {
    $(".sppcfw-cu-button-el").each(function () {
      let $container = $(this);
      let selectedVal = $container.find("select.sppcfw-variation-select").val();

      $container
        .find("button.sppcfw-variation-button.selected")
        .removeClass("selected");
      if (selectedVal) {
        $container
          .find(
            "button.sppcfw-variation-button[data-val='" + selectedVal + "']"
          )
          .addClass("selected");
      }

      let $buttons = $container.find(".sppcfw-variation-button");
      let $form = $container.closest("form.variations_form");
      let variations =
        $form.data("product_variations") || $form.data("variations");

      if (variations && Array.isArray(variations)) {
        let selections = {};
        $form.find("select.sppcfw-variation-select").each(function () {
          let name = $(this).attr("name");
          if (name) selections[name] = $(this).val();
        });

        let thisName = $container.find("select.sppcfw-variation-select").attr("name");

        $buttons.each(function () {
          let $btn = $(this),
            btnVal = $btn.data("val");

          if (!btnVal) {
            $btn.addClass("sppcfw-btn-disable");
            return;
          }

          let candidate = Object.assign({}, selections);
          if (thisName) candidate[thisName] = btnVal.toString();

          let matchExists = variations.some(
            (variation) =>
              variation.attributes &&
              Object.keys(candidate).every((attributeKey) => {
                let candidateValue = candidate[attributeKey];
                if (!candidateValue) return true;

                let variationValue = variation.attributes[attributeKey];
                if (typeof variationValue === "undefined") {
                  variationValue =
                    variation.attributes[attributeKey.replace(/-/g, "_")];
                }
                if (typeof variationValue === "undefined") {
                  variationValue =
                    variation.attributes[attributeKey.replace(/_/g, "-")];
                }

                // If variation's attribute is an empty string, treat it as a wildcard (doesn't restrict this attribute)
                if (variationValue === "") return true;

                return variationValue.toString() === candidateValue.toString();
              })
          );

          $btn.toggleClass("sppcfw-btn-disable", !matchExists);
        });
        return;
      }

      let enabledOptions = [];
      $container.find("option:not(:disabled)").each(function () {
        let optionVal = $(this).val();
        if (optionVal) enabledOptions.push(optionVal.toString());
      });

      if ($container.find("option:disabled").length === 0) {
        $buttons.removeClass("sppcfw-btn-disable");
        return;
      }

      $buttons.each(function () {
        let btnVal = $(this).data("val");
        $btn = $(this);
        if (btnVal && enabledOptions.includes(btnVal.toString())) {
          $btn.removeClass("sppcfw-btn-disable");
        } else {
          $btn.addClass("sppcfw-btn-disable");
        }
      });
    });
  }


  function setVariationsFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (!params.toString()) return;

  let hasSet = false;

  params.forEach(function (value, key) {
    if (!key.startsWith("attribute_")) return;

    const $select = $('select[name="' + key + '"]');
    if ($select.length) {
      $select.val(value);
      hasSet = true;
    }
  });

  if (hasSet) {
    // Let WooCommerce handle variation matching
    $('form.variations_form').trigger('check_variations');
    $('form.variations_form select').trigger('change');
  }
}

});
/* Variation switcher Frontend section end*/
