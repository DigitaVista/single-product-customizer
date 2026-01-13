/* Variation switcher Frontend section */
jQuery(function ($) {
  initVariationSwitcher();

  $(document)
    .on("found_variation reset_data", "form.variations_form", function () {
      setTimeout(initVariationSwitcher, 100);
    })
    .on("change", ".vairation_select", function () {
      setTimeout(initVariationSwitcher, 100);
    })
    .on("show_variation hide_variation", function () {
      setTimeout(updateVariationButtons, 50);
    });

  function initVariationSwitcher() {
    $(".webfwc_variation_button.color").each(function () {
      let bgColor = $(this).data("bg-color");
      if (bgColor) $(this).css("background-color", bgColor);
    });

    $("button.webfwc_variation_button")
      .off("click")
      .on("click", function () {
        if ($(this).hasClass("webcfwc_btn_disable")) return false;

        let btnVal = $(this).data("val");
        let $parent = $(this).closest(".cu_button_el");
        let $select = $parent.find("select.vairation_select");

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
          .find("button.webfwc_variation_button.selected")
          .removeClass("selected");
        $(this).addClass("selected");
      });

    updateVariationButtons();
  }

  function updateVariationButtons() {
    $(".cu_button_el").each(function () {
      let $container = $(this);
      let selectedVal = $container.find("select.vairation_select").val();

      $container
        .find("button.webfwc_variation_button.selected")
        .removeClass("selected");
      if (selectedVal) {
        $container
          .find(
            "button.webfwc_variation_button[data-val='" + selectedVal + "']"
          )
          .addClass("selected");
      }

      let $buttons = $container.find(".webfwc_variation_button");
      let $form = $container.closest("form.variations_form");
      let variations =
        $form.data("product_variations") || $form.data("variations");

      if (variations && Array.isArray(variations)) {
        let selections = {};
        $form.find("select.vairation_select").each(function () {
          let name = $(this).attr("name");
          if (name) selections[name] = $(this).val();
        });

        let thisName = $container.find("select.vairation_select").attr("name");

        $buttons.each(function () {
          let $btn = $(this),
            btnVal = $btn.data("val");

          if (!btnVal) {
            $btn.addClass("webcfwc_btn_disable");
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

          $btn.toggleClass("webcfwc_btn_disable", !matchExists);
        });
        return;
      }

      let enabledOptions = [];
      $container.find("option:not(:disabled)").each(function () {
        let optionVal = $(this).val();
        if (optionVal) enabledOptions.push(optionVal.toString());
      });

      if ($container.find("option:disabled").length === 0) {
        $buttons.removeClass("webcfwc_btn_disable");
        return;
      }

      $buttons.each(function () {
        let btnVal = $(this).data("val");
        $btn = $(this);
        if (btnVal && enabledOptions.includes(btnVal.toString())) {
          $btn.removeClass("webcfwc_btn_disable");
        } else {
          $btn.addClass("webcfwc_btn_disable");
        }
      });
    });
  }
});
/* Variation switcher Frontend section end*/
