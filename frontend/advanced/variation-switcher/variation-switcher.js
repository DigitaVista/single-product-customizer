/* Variation switcher Frontend section */
jQuery(function ($) {
  initVariationSwitcher();
  setTimeout(setVariationsFromURL, 50);

  $(document)
    .on("found_variation", "form.variations_form", function (event, variation) {
      setTimeout(initVariationSwitcher, 50);
      if (variation && variation.image && (variation.image.full_src || variation.image.src)) {
        let imgUrl = variation.image.full_src || variation.image.src;
        let $mainImgs = $(".sppcfw-gallery-main-img");
        if ($mainImgs.length) {
          $mainImgs.css("opacity", "0.3");
          setTimeout(function() {
            $mainImgs.attr("src", imgUrl).attr("data-zoom-src", imgUrl).attr("data-full-src", imgUrl).css("opacity", "1");
          }, 60);
        }
        $(".sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb").removeClass("is-active").filter(function () {
          return $(this).attr("data-main-src") === imgUrl || $(this).attr("data-full-src") === imgUrl;
        }).addClass("is-active");
      }
    })
    .on("reset_data", "form.variations_form", function () {
      setTimeout(initVariationSwitcher, 50);
      let $firstThumb = $(".sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb").first();
      if ($firstThumb.length) {
        $(".sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb").removeClass("is-active");
        $firstThumb.addClass("is-active");
        let origSrc = $firstThumb.attr("data-main-src") || $firstThumb.attr("data-full-src");
        if (origSrc) {
          $(".sppcfw-gallery-main-img").attr("src", origSrc).attr("data-zoom-src", origSrc).attr("data-full-src", origSrc);
        }
      }
    })
    .on("change", ".vairation_select", function () {
      setTimeout(initVariationSwitcher, 50);
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
      .on("click", function (e) {
        e.preventDefault();
        if ($(this).hasClass("webcfwc_btn_disable")) return false;

        let btnVal = $(this).data("val");
        let $parent = $(this).closest(".cu_button_el");
        let $select = $parent.find("select.vairation_select");
        let $form = $(this).closest("form.variations_form");

        let isAlreadySelected = $(this).hasClass("selected");
        if (isAlreadySelected) {
          $select.val("").trigger("change");
          $(this).removeClass("selected");
        } else {
          $select.val(btnVal).trigger("change");
          $parent
            .find("button.webfwc_variation_button.selected")
            .removeClass("selected");
          $(this).addClass("selected");
        }

        let selectName = $select.attr("name");
        if (selectName) {
          $form
            .find('input[name="' + selectName + '"]')
            .val(isAlreadySelected ? "" : btnVal)
            .trigger("change");
        }

        if ($form.length) {
          $form.trigger("check_variations");
          $form.trigger("woocommerce_variation_select_change");
        }

        // Fast instant image sync if variation match found
        let variations = $form.data("product_variations") || $form.data("variations");
        if (variations && Array.isArray(variations)) {
          let selections = {};
          $form.find("select.vairation_select, select[name^='attribute_']").each(function () {
            let name = $(this).attr("name");
            if (name && $(this).val()) selections[name] = $(this).val().toString();
          });

          let matched = variations.find(function (v) {
            if (!v.attributes) return false;
            return Object.keys(v.attributes).every(function (k) {
              let chosen = selections[k] || selections[k.replace(/_/g, "-")] || selections[k.replace(/-/g, "_")];
              if (!chosen || v.attributes[k] === "") return true;
              return v.attributes[k].toString() === chosen.toString();
            }) && Object.keys(selections).every(function (k) {
              let vVal = v.attributes[k] || v.attributes[k.replace(/_/g, "-")] || v.attributes[k.replace(/-/g, "_")];
              if (typeof vVal === "undefined" || vVal === "") return true;
              return vVal.toString() === selections[k].toString();
            });
          });

          if (matched && matched.image && (matched.image.full_src || matched.image.src)) {
            let imgUrl = matched.image.full_src || matched.image.src;
            let $mainImgs = $(".sppcfw-gallery-main-img");
            if ($mainImgs.length) {
              $mainImgs.attr("src", imgUrl).attr("data-zoom-src", imgUrl).attr("data-full-src", imgUrl);
            }
            $(".sppcfw-gallery-carousel-slide, .sppcfw-gallery-grid-thumb").removeClass("is-active").filter(function () {
              return $(this).attr("data-main-src") === imgUrl || $(this).attr("data-full-src") === imgUrl;
            }).addClass("is-active");
          }
        }
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
