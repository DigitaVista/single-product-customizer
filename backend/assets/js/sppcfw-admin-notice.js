/**
 * Single Product Customizer — Black Friday 2026 Admin Notice
 */
(function () {
	'use strict';

	function initNotice() {
		var box = document.getElementById('sppcfw-bf-notice') || document.getElementById('gl-bf-notice');
		if (!box) {
			return;
		}

		// Countdown (uses the seconds left from the server, so the site timezone is respected).
		var left = parseInt(box.getAttribute('data-seconds'), 10) || 0;
		var started = Date.now();
		var el = {};
		['d', 'h', 'm', 's'].forEach(function (u) {
			el[u] = box.querySelector('[data-u="' + u + '"]');
		});

		function pad(n) {
			return (n < 10 ? '0' : '') + n;
		}

		function tick() {
			var s = Math.max(0, left - Math.floor((Date.now() - started) / 1000));
			if (s <= 0) {
				if (box.parentNode) {
					box.parentNode.removeChild(box);
				}
				return;
			}
			if (el.d) { el.d.textContent = pad(Math.floor(s / 86400)); }
			if (el.h) { el.h.textContent = pad(Math.floor((s % 86400) / 3600)); }
			if (el.m) { el.m.textContent = pad(Math.floor((s % 3600) / 60)); }
			if (el.s) { el.s.textContent = pad(s % 60); }
		}

		tick();
		var timer = setInterval(tick, 1000);

		// Close = snooze 1 day.
		var closeBtn = box.querySelector('.sppcfw-bf-close, .gl-bf-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', function () {
				clearInterval(timer);

				var ajaxUrl = (typeof sppcfwBlackFridayNotice !== 'undefined' && sppcfwBlackFridayNotice.ajax_url)
					? sppcfwBlackFridayNotice.ajax_url
					: box.getAttribute('data-ajax');
				var action = (typeof sppcfwBlackFridayNotice !== 'undefined' && sppcfwBlackFridayNotice.action)
					? sppcfwBlackFridayNotice.action
					: (box.getAttribute('data-action') || 'sppcfw_dismiss_black_friday_notice');
				var nonce = (typeof sppcfwBlackFridayNotice !== 'undefined' && sppcfwBlackFridayNotice.nonce)
					? sppcfwBlackFridayNotice.nonce
					: box.getAttribute('data-nonce');

				if (ajaxUrl) {
					var body = new URLSearchParams();
					body.append('action', action);
					body.append('nonce', nonce);
					fetch(ajaxUrl, {
						method: 'POST',
						credentials: 'same-origin',
						body: body
					});
				}

				box.style.transition = 'opacity .2s';
				box.style.opacity = '0';
				setTimeout(function () {
					if (box.parentNode) {
						box.parentNode.removeChild(box);
					}
				}, 220);
			});
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initNotice);
	} else {
		initNotice();
	}
})();
