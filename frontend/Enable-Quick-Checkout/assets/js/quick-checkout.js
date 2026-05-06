/**
 * WooCommerce Custom Product Templates JavaScript
 */
(function ($) {
  "use strict";

  $(document).ready(function () {
    /**
     * Refresh checkout when product added to cart
     */
    $("body").on("added_to_cart", function () {
      $("body").trigger("update_checkout");
    });

    /**
     * Quantity change handler
     */
    var quantityUpdateTimeout;
    $(document).on("change input", ".sppcfw-checkout-quantity", function () {
      var $input = $(this);
      var cartItemKey = $input.data("cart-item-key");
      var quantity = parseInt($input.val()) || 1;
      var min = parseInt($input.attr("min")) || 1;
      var max = parseInt($input.attr("max")) || 0;
      if (quantity < min) {
        $input.val(min);
        quantity = min;
      }

      if (max > 0 && quantity > max) {
        $input.val(max);
        quantity = max;
      }
      var $row = $input.closest("tr");
      $row.addClass("sppcfw-updating");

      clearTimeout(quantityUpdateTimeout);
      quantityUpdateTimeout = setTimeout(function () {
        updateCartQuantity(cartItemKey, quantity, $row);
      }, 300);
    });

    /**
     * Update Cart Quantity via AJAX
     */
    function updateCartQuantity(cartItemKey, quantity, $row) {
      $.ajax({
        url: sppcfw.ajaxUrl,
        type: "POST",
        data: {
          action: "sppcfw_update_cart_quantity",
          cart_item_key: cartItemKey,
          quantity: quantity,
          nonce: sppcfw.nonce,
        },
        success: function (response) {
          $row.removeClass("sppcfw-updating");

          if (response.success) {
            $("body").trigger("update_checkout");
          } else {
            showMessage(response.data.message || sppcfw.strings.error, "error");
          }
        },
        error: function () {
          $row.removeClass("sppcfw-updating");
          showMessage(sppcfw.strings.error, "error");
        },
      });
    }

    /**
     * Message display function
     */
    function showMessage(message, type) {
      var $messages = $(".sppcfw-messages");
      $messages
        .removeClass("sppcfw-success sppcfw-error")
        .addClass("sppcfw-" + type)
        .text(message)
        .show();
    }

    /**
     * Remove cart item
     */
    $(document).on("click", ".sppcfw-remove-item", function (e) {
      e.preventDefault();

      var $button = $(this);
      var cartItemKey = $button.data("cart-item-key");
      var $row = $button.closest("tr");

      if (!cartItemKey) return;

      if (
        !confirm(
          sppcfw.strings.confirmRemove ||
            "Are you sure you want to remove this item?",
        )
      ) {
        return;
      }

      $row.addClass("sppcfw-updating");

      $.ajax({
        url: sppcfw.ajaxUrl,
        type: "POST",
        data: {
          action: "sppcfw_remove_cart_item",
          cart_item_key: cartItemKey,
          nonce: sppcfw.nonce,
        },
        success: function (response) {
          $row.removeClass("sppcfw-updating");
          if (response.success) {
            $("body").trigger("update_checkout");
          } else {
            showMessage(response.data.message || sppcfw.strings.error, "error");
          }
        },
        error: function () {
          $row.removeClass("sppcfw-updating");
          showMessage(sppcfw.strings.error, "error");
        },
      });
    });

    /**
     * Initialize checkout scripts
     */
    if ($(".sppcfw-checkout-wrapper").is(":visible")) {
      if (typeof wc_checkout_form !== "undefined") {
        wc_checkout_form.init();
      }
      $("body").trigger("init_checkout");
    }
  });
})(jQuery);
