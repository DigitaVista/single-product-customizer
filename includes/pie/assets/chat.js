/* DigitaVista Assistant chat widget. No dependencies; all text is inserted with textContent. */
(function () {
	'use strict';

	var cfg = window.digitavistaPieChat;
	if (!cfg || !window.fetch) {
		return;
	}

	function api(path, method, body) {
		return fetch(cfg.rest + path, {
			method: method || 'GET',
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': cfg.nonce, 'Content-Type': 'application/json', Accept: 'application/json' },
			body: body ? JSON.stringify(body) : undefined
		}).then(function (response) {
			return response.json().catch(function () { return {}; }).then(function (data) {
				if (!response.ok && !data.messages) {
					throw new Error(data.error || data.message || 'The assistant could not be reached. Please try again.');
				}
				return data;
			});
		});
	}

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) { node.className = className; }
		if (text !== undefined && text !== null) { node.textContent = text; }
		return node;
	}

	function button(label, className, onClick) {
		var b = el('button', 'dvp-btn ' + (className || ''), label);
		b.type = 'button';
		b.addEventListener('click', onClick);
		return b;
	}

	function onOff(value) {
		var badge = el('span', 'dvp-badge ' + (value ? 'dvp-on' : 'dvp-off'), value ? 'On' : 'Off');
		return badge;
	}

	function Widget(root) {
		this.root = root;
		this.floating = root.getAttribute('data-mode') === 'floating';
		this.state = null;
		this.busy = false;
		this.view = 'chat';
		this.build();
		this.load();
	}

	Widget.prototype.build = function () {
		var self = this;
		this.panel = el('section', 'dvp-panel' + (this.floating ? ' dvp-floating' : ' dvp-inline'));
		this.panel.setAttribute('aria-label', 'DigitaVista Assistant');

		var header = el('header', 'dvp-header');
		var titles = el('div', 'dvp-titles');
		titles.appendChild(el('h2', 'dvp-title', 'DigitaVista Assistant'));
		this.subtitle = el('p', 'dvp-subtitle', 'Loading…');
		titles.appendChild(this.subtitle);
		header.appendChild(titles);
		var tools = el('div', 'dvp-tools');
		this.newChatBtn = button('New chat', 'dvp-ghost', function () { self.reset(); });
		this.settingsBtn = button('Settings', 'dvp-ghost', function () { self.toggleSettings(); });
		tools.appendChild(this.newChatBtn);
		tools.appendChild(this.settingsBtn);
		if (this.floating) {
			var expand = el('a', 'dvp-btn dvp-ghost', 'Open full page');
			expand.href = cfg.pageUrl;
			tools.appendChild(expand);
			tools.appendChild(button('Close', 'dvp-ghost', function () { self.close(); }));
		}
		header.appendChild(tools);
		this.panel.appendChild(header);

		this.log = el('div', 'dvp-log');
		this.log.setAttribute('role', 'log');
		this.log.setAttribute('aria-live', 'polite');
		this.panel.appendChild(this.log);

		this.form = el('form', 'dvp-composer');
		var label = el('label', 'screen-reader-text', 'Message to the assistant');
		label.htmlFor = 'dvp-input-' + Math.random().toString(36).slice(2);
		this.input = el('textarea', 'dvp-input');
		this.input.id = label.htmlFor;
		this.input.rows = 1;
		this.input.maxLength = 2000;
		this.input.placeholder = 'Describe what you want to change…';
		this.input.addEventListener('keydown', function (event) {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				self.submit();
			}
		});
		this.sendBtn = el('button', 'dvp-btn dvp-primary', 'Send');
		this.sendBtn.type = 'submit';
		this.form.appendChild(label);
		this.form.appendChild(this.input);
		this.form.appendChild(this.sendBtn);
		this.form.addEventListener('submit', function (event) { event.preventDefault(); self.submit(); });
		this.panel.appendChild(this.form);
		this.panel.appendChild(el('p', 'dvp-footnote', 'The assistant only proposes changes. Nothing changes until you approve it.'));

		if (this.floating) {
			this.launcher = button('Ask Assistant', 'dvp-launcher', function () { self.open(); });
			this.launcher.setAttribute('aria-expanded', 'false');
			this.panel.hidden = true;
			this.root.appendChild(this.launcher);
			document.addEventListener('keydown', function (event) {
				if (event.key === 'Escape' && !self.panel.hidden) { self.close(); }
			});
		} else {
			var fallbacks = document.querySelectorAll('.digitavista-pie-fallback');
			for (var i = 0; i < fallbacks.length; i++) { fallbacks[i].hidden = true; }
		}
		this.root.appendChild(this.panel);
	};

	Widget.prototype.open = function () {
		this.panel.hidden = false;
		this.launcher.setAttribute('aria-expanded', 'true');
		this.launcher.hidden = true;
		this.scroll();
		this.input.focus();
	};

	Widget.prototype.close = function () {
		this.panel.hidden = true;
		this.launcher.hidden = false;
		this.launcher.setAttribute('aria-expanded', 'false');
		this.launcher.focus();
	};

	Widget.prototype.load = function () {
		var self = this;
		api('chat').then(function (state) { self.setState(state); }).catch(function (error) { self.fatal(error.message); });
	};

	Widget.prototype.setState = function (state) {
		this.state = state;
		this.view = state.configured ? (this.view === 'settings' ? 'settings' : 'chat') : 'onboarding';
		this.render();
	};

	Widget.prototype.fatal = function (message) {
		this.subtitle.textContent = 'Unavailable';
		this.log.textContent = '';
		this.log.appendChild(el('div', 'dvp-msg dvp-system', message));
	};

	Widget.prototype.render = function () {
		var s = this.state;
		this.subtitle.textContent = s.configured ? 'Connected · replies by Claude' : 'Not connected yet';
		this.form.hidden = this.view !== 'chat';
		this.newChatBtn.hidden = this.view !== 'chat';
		this.settingsBtn.hidden = !s.configured;
		this.settingsBtn.textContent = this.view === 'settings' ? 'Back to chat' : 'Settings';
		this.log.textContent = '';

		if (this.view === 'onboarding') {
			this.log.appendChild(this.onboardingCard());
		} else if (this.view === 'settings') {
			this.log.appendChild(this.settingsCard());
		} else {
			this.renderChat();
		}
		this.setBusy(this.busy);
		this.scroll();
	};

	Widget.prototype.renderChat = function () {
		var self = this;
		var s = this.state;
		if (!s.messages.length) {
			this.log.appendChild(el('div', 'dvp-msg dvp-assistant', 'Hi! Tell me what you would like to change in your DigitaVista plugins. I will prepare the change for you to review, and nothing is applied until you approve it.'));
		}
		s.messages.forEach(function (message) {
			var bubble = el('div', 'dvp-msg ' + (message.role === 'user' ? 'dvp-user' : 'dvp-assistant'), message.text);
			self.log.appendChild(bubble);
			if (message.plan) {
				self.log.appendChild(self.planCard(message.plan));
			}
		});
		if (s.suggestions && s.suggestions.length && s.messages.length < 2) {
			var chips = el('div', 'dvp-chips');
			chips.setAttribute('aria-label', 'Suggestions');
			s.suggestions.forEach(function (text) {
				chips.appendChild(button(text, 'dvp-chip', function () { self.input.value = text; self.submit(); }));
			});
			this.log.appendChild(chips);
		}
	};

	Widget.prototype.planCard = function (plan) {
		var self = this;
		var card = el('div', 'dvp-card dvp-status-' + plan.status);
		var head = el('div', 'dvp-card-head');
		head.appendChild(el('strong', '', plan.changes.length > 1 ? 'Proposed changes' : 'Proposed change'));
		head.appendChild(el('span', 'dvp-pill', plan.status_label));
		card.appendChild(head);

		var list = el('ul', 'dvp-changes');
		plan.changes.forEach(function (change) {
			var item = el('li');
			var name = el('span', 'dvp-change-name');
			name.appendChild(el('span', 'dvp-plugin', change.plugin));
			name.appendChild(el('span', 'dvp-setting', change.setting));
			item.appendChild(name);
			var values = el('span', 'dvp-values');
			values.appendChild(onOff(change.from));
			values.appendChild(el('span', 'dvp-arrow', '→'));
			values.appendChild(onOff(change.to));
			item.appendChild(values);
			list.appendChild(item);
		});
		card.appendChild(list);

		if (plan.notes && plan.notes.length) {
			var details = el('details', 'dvp-notes');
			details.appendChild(el('summary', '', 'Good to know (' + plan.notes.length + ')'));
			var notes = el('ul');
			plan.notes.forEach(function (note) { notes.appendChild(el('li', '', note)); });
			details.appendChild(notes);
			card.appendChild(details);
		}
		if (plan.changed_since_apply) {
			card.appendChild(el('p', 'dvp-warning', 'A setting from this change was modified afterwards, possibly in the plugin settings. Check it before using Undo.'));
		}
		if (plan.reasons && plan.reasons.length && plan.status !== 'applied' && plan.status !== 'pending') {
			card.appendChild(el('p', 'dvp-reasons', 'Details: ' + plan.reasons.join(', ')));
		}

		var actions = el('div', 'dvp-actions');
		function act(action, labelBusy) {
			return function (event) {
				var target = event.currentTarget;
				var buttons = actions.querySelectorAll('button');
				for (var i = 0; i < buttons.length; i++) { buttons[i].disabled = true; }
				target.textContent = labelBusy;
				api('plans/' + plan.id + '/' + action, 'POST').then(function (data) {
					card.replaceWith(self.planCard(data.plan));
					self.refreshSuggestionsLater();
				}).catch(function (error) {
					target.textContent = 'Try again';
					for (var j = 0; j < buttons.length; j++) { buttons[j].disabled = false; }
					card.appendChild(el('p', 'dvp-warning', error.message));
				});
			};
		}
		if (plan.can_approve) {
			actions.appendChild(button('Approve and apply', 'dvp-primary', act('approve', 'Applying…')));
			actions.appendChild(button('Cancel', 'dvp-secondary', act('cancel', 'Cancelling…')));
		} else if (plan.can_undo) {
			actions.appendChild(button('Undo', 'dvp-secondary', act('undo', 'Undoing…')));
		}
		if (actions.childNodes.length) {
			card.appendChild(actions);
		}
		return card;
	};

	Widget.prototype.refreshSuggestionsLater = function () {
		var self = this;
		api('chat').then(function (state) { self.state = state; }).catch(function () {});
	};

	Widget.prototype.onboardingCard = function () {
		var self = this;
		var s = this.state;
		var card = el('div', 'dvp-card dvp-onboarding');
		card.appendChild(el('strong', '', 'Turn on the cloud assistant'));
		card.appendChild(el('p', '', cfg.consentText));
		var privacy = el('a', '', 'Privacy policy');
		privacy.href = cfg.privacyUrl;
		privacy.target = '_blank';
		privacy.rel = 'noopener noreferrer';
		card.appendChild(privacy);

		var endpoint = null;
		var token = null;
		if (!s.credentials_from_constants) {
			var connection = el('details', 'dvp-connection');
			connection.open = !s.endpoint || !s.has_token;
			connection.appendChild(el('summary', '', 'Connection details'));
			endpoint = this.field(connection, 'Service address', 'url', s.endpoint || 'https://pie.webcartisan.com');
			token = this.field(connection, 'Connection key', 'password', '');
			token.placeholder = s.has_token ? 'Saved — leave empty to keep' : 'pie_…';
			token.autocomplete = 'off';
			card.appendChild(connection);
		}

		var agree = el('label', 'dvp-agree');
		var box = el('input');
		box.type = 'checkbox';
		agree.appendChild(box);
		agree.appendChild(document.createTextNode(' I agree to send this information to the DigitaVista Assistant service.'));
		card.appendChild(agree);
		var status = el('p', 'dvp-warning');
		status.hidden = true;
		card.appendChild(status);
		var connect = button('Connect', 'dvp-primary', function () {
			if (!box.checked) {
				status.hidden = false;
				status.textContent = 'Please tick the box to agree first.';
				return;
			}
			connect.disabled = true;
			connect.textContent = 'Connecting…';
			var body = { consent: true };
			if (endpoint) { body.endpoint = endpoint.value; body.token = token.value; }
			api('chat/settings', 'POST', body).then(function (state) {
				self.setState(state);
			}).catch(function (error) {
				connect.disabled = false;
				connect.textContent = 'Connect';
				status.hidden = false;
				status.textContent = error.message;
			});
		});
		card.appendChild(el('div', 'dvp-actions')).appendChild(connect);
		return card;
	};

	Widget.prototype.settingsCard = function () {
		var self = this;
		var card = el('div', 'dvp-card');
		card.appendChild(el('strong', '', 'Assistant settings and privacy'));
		card.appendChild(el('p', '', cfg.consentText));
		var privacy = el('a', '', 'Privacy policy');
		privacy.href = cfg.privacyUrl;
		privacy.target = '_blank';
		privacy.rel = 'noopener noreferrer';
		card.appendChild(privacy);
		var status = el('p', 'dvp-reasons');
		status.hidden = true;
		var actions = el('div', 'dvp-actions');
		actions.appendChild(button('Delete my conversations from the service', 'dvp-secondary', function (event) {
			event.currentTarget.disabled = true;
			api('chat/delete-data', 'POST').then(function (state) {
				self.state = state;
				status.hidden = false;
				status.textContent = 'Your conversations were deleted from the service.';
			}).catch(function (error) { status.hidden = false; status.textContent = error.message; });
		}));
		actions.appendChild(button('Turn off cloud assistant', 'dvp-secondary', function () {
			api('chat/settings', 'POST', { consent: false }).then(function (state) { self.view = 'chat'; self.setState(state); })
				.catch(function (error) { status.hidden = false; status.textContent = error.message; });
		}));
		card.appendChild(actions);
		card.appendChild(status);
		return card;
	};

	Widget.prototype.field = function (parent, labelText, type, value) {
		var id = 'dvp-f-' + Math.random().toString(36).slice(2);
		var label = el('label', 'dvp-field-label', labelText);
		label.htmlFor = id;
		var input = el('input', 'dvp-field');
		input.type = type;
		input.id = id;
		input.value = value;
		parent.appendChild(label);
		parent.appendChild(input);
		return input;
	};

	Widget.prototype.toggleSettings = function () {
		this.view = this.view === 'settings' ? 'chat' : 'settings';
		this.render();
	};

	Widget.prototype.reset = function () {
		var self = this;
		if (this.busy) { return; }
		api('chat/reset', 'POST').then(function (state) { self.setState(state); self.input.focus(); });
	};

	Widget.prototype.submit = function () {
		var self = this;
		var text = this.input.value.trim();
		if (!text || this.busy) {
			return;
		}
		this.input.value = '';
		this.log.querySelectorAll('.dvp-chips').forEach(function (chips) { chips.remove(); });
		this.log.appendChild(el('div', 'dvp-msg dvp-user', text));
		var typing = el('div', 'dvp-msg dvp-assistant dvp-typing');
		typing.setAttribute('aria-label', 'The assistant is thinking');
		typing.appendChild(el('span'));
		typing.appendChild(el('span'));
		typing.appendChild(el('span'));
		this.log.appendChild(typing);
		this.setBusy(true);
		this.scroll();
		api('chat', 'POST', { message: text }).then(function (state) {
			self.busy = false;
			self.setState(state);
		}).catch(function (error) {
			self.busy = false;
			typing.remove();
			self.log.appendChild(el('div', 'dvp-msg dvp-system', error.message));
			self.input.value = text;
			self.setBusy(false);
			self.scroll();
		});
	};

	Widget.prototype.setBusy = function (busy) {
		this.busy = busy;
		this.input.disabled = busy;
		this.sendBtn.disabled = busy;
		this.sendBtn.textContent = busy ? '…' : 'Send';
		if (!busy && this.view === 'chat' && (!this.floating || !this.panel.hidden)) {
			this.input.focus({ preventScroll: true });
		}
	};

	Widget.prototype.scroll = function () {
		this.log.scrollTop = this.log.scrollHeight;
	};

	function boot() {
		var roots = document.querySelectorAll('.digitavista-pie-chat-root');
		for (var i = 0; i < roots.length; i++) {
			if (!roots[i].getAttribute('data-ready')) {
				roots[i].setAttribute('data-ready', '1');
				new Widget(roots[i]);
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
