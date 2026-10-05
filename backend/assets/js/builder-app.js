/**
 * Single Product Page Builder React App
 * Built with React (wp.element) & Tailwind CSS
 * Features: Left-side Edit Container Inspector, Atomic Elements Drawer, Live Widget Search, Floating Structure Panel, Multi-template Management
 *
 * @package Single_Product_Customizer
 */

(function () {
	'use strict';

	const { createElement: h, useState, useEffect, useRef, Component } = window.wp.element;

	// Helper for AJAX post
	function apiPost(action, data) {
		const config = window.SPPCFWBuilderConfig || {};
		const formData = new FormData();
		formData.append('action', action);
		formData.append('nonce', config.nonce || '');
		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
			}
		}
		return fetch(config.ajax_url || '/wp-admin/admin-ajax.php', {
			method: 'POST',
			body: formData,
		}).then(res => res.json());
	}

	// Static Visual Sample Data for Edit Canvas
	const CANVAS_STATIC_DATA = {
		title: 'Single Product Title',
		price: '$49.99',
		regular_price: '$59.99',
		sale_price: '$49.99',
		on_sale: true,
		sku: 'SAMPLE-SKU-123',
		stock_text: 'In Stock',
		rating_count: 5,
		image_url: window.SPPCFWBuilderConfig ? window.SPPCFWBuilderConfig.plugin_url + 'backend/resources/images/features-img.webp' : '',
		short_description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		description: 'Full product description placeholder detailing extensive technical specifications and features.',
		categories: 'Clothing, Featured',
		tags: 'Customizer, Premium',
		variations: [
			{ name: 'pa_color', label: 'Color', options: ['Black', 'Purple', 'Blue'] },
			{ name: 'pa_size', label: 'Size', options: ['S', 'M', 'L', 'XL'] }
		],
		related_products: [
			{ id: 1, title: 'Demo Related Product 1', price: '$19.99', image_url: '' },
			{ id: 2, title: 'Demo Related Product 2', price: '$29.99', image_url: '' },
			{ id: 3, title: 'Demo Related Product 3', price: '$39.99', image_url: '' },
			{ id: 4, title: 'Demo Related Product 4', price: '$49.99', image_url: '' }
		],
		upsell_products: [
			{ id: 1, title: 'Demo Upsell Product 1', price: '$24.99', image_url: '' },
			{ id: 2, title: 'Demo Upsell Product 2', price: '$34.99', image_url: '' },
			{ id: 3, title: 'Demo Upsell Product 3', price: '$44.99', image_url: '' },
			{ id: 4, title: 'Demo Upsell Product 4', price: '$54.99', image_url: '' }
		]
	};

	// Atomic Elements Definitions (Image 1)
	const ATOMIC_ELEMENTS = [
		{ type: 'column', name: 'Column', preset: 'column', icon: 'view_column', desc: 'Add a new column into container' },
		{ type: 'div_block', name: 'Div block', preset: 'div_block', icon: 'crop_square', desc: 'Simple full width div container' },
		{ type: 'flexbox', name: 'Flexbox', preset: '1_container', icon: 'grid_view', desc: 'Flexbox layout container' },
		{ type: 'grid', name: 'Grid', preset: 'grid_2x2', icon: 'apps', desc: '2x2 grid container' },
		{ type: 'tabs', name: 'Tabs', preset: 'product_description', icon: 'folder', desc: 'Tabs container widget' },
	];

	// Core Single Product Widget Definitions
	const CORE_WIDGETS = [
		{ type: 'product_title', name: 'Product Title', icon: 'title' },
		{ type: 'heading', name: 'Heading', icon: 'format_size' },
		{ type: 'text_editor', name: 'Text Editor', icon: 'edit_note' },
		{ type: 'product_price', name: 'Product Price', icon: 'payments' },
		{ type: 'product_gallery', name: 'Product Gallery', icon: 'collections' },
		{ type: 'image', name: 'Image', icon: 'image' },
		{ type: 'html_code', name: 'HTML Element', icon: 'code' },
		{ type: 'product_add_to_cart', name: 'Add to Cart', icon: 'shopping_cart' },
		{ type: 'product_rating', name: 'Rating Stars', icon: 'star' },
		{ type: 'product_short_desc', name: 'Short Description', icon: 'description' },
		{ type: 'product_description', name: 'Full Description & Tabs', icon: 'toc' },
		{ type: 'product_meta', name: 'Product Meta', icon: 'inventory_2' },
		{ type: 'custom_message', name: 'Custom Message', icon: 'campaign' },
		{ type: 'plus_minus_buttons', name: 'Plus/Minus Stepper', icon: 'exposure' },
		{ type: 'related_products', name: 'Related Products', icon: 'grid_on' },
		{ type: 'upsell_products', name: 'Upsell Products', icon: 'auto_awesome' },
	];

	// Preset Layout Generator
	function createContainerStructure(presetType) {
		const timestamp = Date.now();
		const containerId = 'container-' + timestamp;

		let children = [];
		let settings = {
			width_mode: 'boxed',
			boxed_width: '1140px',
			flex_direction: 'row',
			justify_content: 'flex-start',
			align_items: 'stretch',
			grid_columns: '2',
			gap: '16px',
			row_gap: '16px',
			gaps_linked: true,
			flex_wrap: 'nowrap',
			min_height: '0px',
			alignment: 'left',
		};

		switch (presetType) {
			case 'flex_col':
				settings.flex_direction = 'column';
				children = [
					{
						id: 'col-' + timestamp + '-1',
						type: 'column',
						label: 'Column 1 (100%)',
						settings: { flex_width: '100%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
				];
				break;
			case '1_container':
			case 'flexbox':
			case 'flex_row':
				settings.flex_direction = 'row';
				children = [
					{
						id: 'col-' + timestamp + '-1',
						type: 'column',
						label: 'Column 1 (100%)',
						settings: { flex_width: '100%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
				];
				break;
			case '2_col_50_50':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (50%)', settings: { flex_width: '50%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (50%)', settings: { flex_width: '50%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '2_col_33_66':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (33%)', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (67%)', settings: { flex_width: '66.66%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '2_col_66_33':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (67%)', settings: { flex_width: '66.66%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (33%)', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '3_col_33_33_33':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (33%)', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (33%)', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Column 3 (33%)', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '3_col_25_50_25':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (50%)', settings: { flex_width: '50%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Column 3 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '4_col_25_25_25_25':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Column 3 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-4', type: 'column', label: 'Column 4 (25%)', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'grid_2x2':
			case 'grid':
				settings.flex_direction = 'grid';
				settings.grid_columns = '2';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Grid Box 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Grid Box 2', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Grid Box 3', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-4', type: 'column', label: 'Grid Box 4', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'grid_3x3':
				settings.flex_direction = 'grid';
				settings.grid_columns = '3';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Grid Box 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Grid Box 2', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Grid Box 3', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-4', type: 'column', label: 'Grid Box 4', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-5', type: 'column', label: 'Grid Box 5', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-6', type: 'column', label: 'Grid Box 6', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-7', type: 'column', label: 'Grid Box 7', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-8', type: 'column', label: 'Grid Box 8', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-9', type: 'column', label: 'Grid Box 9', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'grid_1_2':
				settings.flex_direction = 'grid';
				settings.grid_columns = '2';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Grid Box 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Grid Box 2', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Grid Box 3', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'grid_2_1':
				settings.flex_direction = 'grid';
				settings.grid_columns = '2';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Grid Box 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Grid Box 2', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Grid Box 3', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'div_block':
				settings.width_mode = 'full';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Div Content', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			default:
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
		}

		return {
			id: containerId,
			type: 'container',
			label: presetType === 'div_block' ? 'Div Container' : presetType.indexOf('grid') === 0 ? 'Grid Container' : 'Flexbox Container',
			settings: settings,
			children: children,
			styles: {
				bg_color: 'transparent',
				border_type: 'None',
				border_color: 'transparent',
				border_width: '0px',
				border_radius: '0px',
				padding_top: '10px',
				padding_right: '10px',
				padding_bottom: '10px',
				padding_left: '10px',
				margin_top: '0px',
				margin_right: '0px',
				margin_bottom: '0px',
				margin_left: '0px',
			},
			advanced: {
				custom_class: '',
				z_index: '1',
				margin_top: '0px',
				margin_right: '0px',
				margin_bottom: '0px',
				margin_left: '0px',
				padding_top: '10px',
				padding_right: '10px',
				padding_bottom: '10px',
				padding_left: '10px',
			},
		};
	}

	// Syntax Validation Utility Functions for Code Studio
	function validateHtmlSyntax(htmlStr) {
		if (!htmlStr || typeof htmlStr !== 'string' || !htmlStr.trim()) return null;

		// 1. Check for unclosed script or style tags
		const scriptOpenCount = (htmlStr.match(/<script\b[^>]*>/gi) || []).length;
		const scriptCloseCount = (htmlStr.match(/<\/script>/gi) || []).length;
		if (scriptOpenCount !== scriptCloseCount) {
			return `Unclosed <script> tag detected (${scriptOpenCount} opened, ${scriptCloseCount} closed).`;
		}

		const styleOpenCount = (htmlStr.match(/<style\b[^>]*>/gi) || []).length;
		const styleCloseCount = (htmlStr.match(/<\/style>/gi) || []).length;
		if (styleOpenCount !== styleCloseCount) {
			return `Unclosed <style> tag detected (${styleOpenCount} opened, ${styleCloseCount} closed).`;
		}

		// 2. Strip comments, script, and style blocks before tag hierarchy validation
		let sanitized = htmlStr
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

		// 3. Void tags and SVG self-closing elements that don't need closing tag
		const voidTags = new Set([
			'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype',
			'path', 'circle', 'rect', 'polygon', 'polyline', 'line', 'ellipse', 'use', 'stop'
		]);

		const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*?)?(\/?)>/g;
		const stack = [];
		let match;

		while ((match = tagRegex.exec(sanitized)) !== null) {
			const fullTag = match[0];
			const tagName = match[1].toLowerCase();
			const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>') || voidTags.has(tagName);
			const isClosing = fullTag.startsWith('</');

			if (voidTags.has(tagName)) {
				continue;
			}

			if (isClosing) {
				if (stack.length === 0) {
					return `Unexpected closing tag </${tagName}> without matching opening tag.`;
				}
				const lastTag = stack.pop();
				if (lastTag !== tagName) {
					return `Mismatched tag: expected </${lastTag}> but found </${tagName}>.`;
				}
			} else if (!isSelfClosing) {
				stack.push(tagName);
			}
		}

		if (stack.length > 0) {
			return `Unclosed tag(s) detected: <${stack.join('>, <')}>. Please close all HTML tags.`;
		}

		// 4. Check for unclosed shortcode brackets e.g. [shortcode
		const openShortcodeCount = (htmlStr.match(/\[[a-zA-Z0-9_\-]+(?:\s+[^\]]*)?/g) || []).length;
		const closeShortcodeCount = (htmlStr.match(/\]/g) || []).length;
		if (openShortcodeCount > closeShortcodeCount) {
			return `Unclosed WordPress shortcode bracket detected (missing "]").`;
		}

		return null;
	}

	function validateCssSyntax(cssStr) {
		if (!cssStr || typeof cssStr !== 'string' || !cssStr.trim()) return null;

		let braceCount = 0;
		let inComment = false;
		let inSingleQuote = false;
		let inDoubleQuote = false;

		for (let i = 0; i < cssStr.length; i++) {
			const char = cssStr[i];
			const nextChar = cssStr[i + 1];

			if (inComment) {
				if (char === '*' && nextChar === '/') {
					inComment = false;
					i++;
				}
				continue;
			}
			if (char === '/' && nextChar === '*') {
				inComment = true;
				i++;
				continue;
			}
			if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
			if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;

			if (!inSingleQuote && !inDoubleQuote) {
				if (char === '{') braceCount++;
				if (char === '}') braceCount--;
				if (braceCount < 0) {
					return 'Unexpected closing brace "}" without opening "{"';
				}
			}
		}

		if (inComment) return 'Unclosed comment block "/*" (missing "*/")';
		if (inSingleQuote || inDoubleQuote) return 'Unclosed quote string in CSS rules';
		if (braceCount > 0) return `Missing ${braceCount} closing brace(s) "}" in CSS`;

		return null;
	}

	function validateJsSyntax(jsStr) {
		if (!jsStr || typeof jsStr !== 'string' || !jsStr.trim()) return null;

		try {
			new Function('container', 'widgetId', jsStr);
			return null;
		} catch (err) {
			return err.message || 'JavaScript Syntax Error';
		}
	}

	function validateAllElements(elementList) {
		const errors = [];
		function traverse(nodes) {
			if (!Array.isArray(nodes)) return;
			nodes.forEach(node => {
				if (node.type === 'html_code' || node.type === 'custom_html' || node.type === 'html') {
					const settings = node.settings || {};
					const html = settings.html_content !== undefined ? settings.html_content : (settings.code || '');
					const css = settings.custom_css || '';
					const js = settings.custom_js || '';

					const htmlErr = validateHtmlSyntax(html);
					if (htmlErr) errors.push(`HTML Error in "${node.label || 'HTML Element'}": ${htmlErr}`);

					const cssErr = validateCssSyntax(css);
					if (cssErr) errors.push(`CSS Error in "${node.label || 'HTML Element'}": ${cssErr}`);

					const jsErr = validateJsSyntax(js);
					if (jsErr) errors.push(`JavaScript Error in "${node.label || 'HTML Element'}": ${jsErr}`);
				}
				if (node.children && Array.isArray(node.children)) {
					traverse(node.children);
				}
			});
		}
		traverse(elementList);
		return errors;
	}

	// Interactive Step-by-Step Layout Structure Selector Component (Matching Image 1 & 2)
	function LayoutStructureChooser({ onSelectPreset, onClose }) {
		const [step, setStep] = useState('type_selection'); // 'type_selection' | 'preset_selection'
		const [layoutType, setLayoutType] = useState('flexbox'); // 'flexbox' | 'grid'

		function handleTypeSelect(type) {
			setLayoutType(type);
			setStep('preset_selection');
		}

		function handlePresetSelect(presetKey) {
			onSelectPreset(presetKey);
		}

		return h(
			'div',
			{ className: 'sppcfw-w-full sppcfw-max-w-3xl sppcfw-mx-auto sppcfw-my-6 sppcfw-p-8 sppcfw-border sppcfw-border-dashed sppcfw-border-[#cbd5e1] sppcfw-rounded-xl sppcfw-bg-white sppcfw-text-[#334155] sppcfw-shadow-sm sppcfw-relative sppcfw-select-none sppcfw-animate-in sppcfw-fade-in sppcfw-duration-200' },

			// Top Action Navigation Bar
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-justify-between sppcfw-items-center sppcfw-mb-6' },
				step === 'preset_selection'
					? h(
							'button',
							{
								className: 'sppcfw-text-gray-400 hover:sppcfw-text-gray-700 sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-text-xl sppcfw-p-1 sppcfw-font-bold',
								onClick: () => setStep('type_selection'),
								title: 'Back to layout type',
							},
							'‹'
					  )
					: h('div', { className: 'sppcfw-w-6' }),
				h(
					'h3',
					{ className: 'sppcfw-text-base sppcfw-font-semibold sppcfw-text-gray-700 sppcfw-text-center' },
					step === 'type_selection' ? 'Which layout would you like to use?' : 'Select your structure'
				),
				onClose
					? h(
							'button',
							{
								className: 'sppcfw-text-gray-400 hover:sppcfw-text-gray-700 sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-text-base sppcfw-p-1 sppcfw-font-bold',
								onClick: onClose,
								title: 'Close',
							},
							'✕'
					  )
					: h('div', { className: 'sppcfw-w-6' })
			),

			// STEP 1: Layout Type Selection (Flexbox vs Grid - Image 1)
			step === 'type_selection' &&
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-justify-center sppcfw-items-center sppcfw-gap-8 sppcfw-py-6' },

					// Flexbox Card
					h(
						'div',
						{
							className: 'sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-3 sppcfw-cursor-pointer sppcfw-tab-group',
							onClick: () => handleTypeSelect('flexbox'),
						},
						h(
							'div',
							{ className: 'sppcfw-w-24 sppcfw-h-24 sppcfw-bg-[#94a3b8]/20 group-hover:sppcfw-bg-[#9333ea]/10 sppcfw-border-2 sppcfw-border-transparent group-hover:sppcfw-border-[#9333ea] sppcfw-rounded-lg sppcfw-p-2.5 sppcfw-flex sppcfw-gap-1.5 sppcfw-transition-all sppcfw-shadow-sm' },
							h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#cbd5e1] group-hover:sppcfw-bg-[#a855f7] sppcfw-rounded-sm' }),
							h(
								'div',
								{ className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-flex sppcfw-flex-col sppcfw-gap-1.5' },
								h('div', { className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-bg-[#cbd5e1] group-hover:sppcfw-bg-[#a855f7] sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-bg-[#cbd5e1] group-hover:sppcfw-bg-[#a855f7] sppcfw-rounded-sm' })
							)
						),
						h('span', { className: 'sppcfw-text-sm sppcfw-font-medium sppcfw-text-gray-600 group-hover:sppcfw-text-[#9333ea]' }, 'Flexbox')
					),

					// Grid Card
					h(
						'div',
						{
							className: 'sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-3 sppcfw-cursor-pointer sppcfw-tab-group',
							onClick: () => handleTypeSelect('grid'),
						},
						h(
							'div',
							{ className: 'sppcfw-w-24 sppcfw-h-24 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#94a3b8] group-hover:sppcfw-border-[#9333ea] sppcfw-rounded-lg sppcfw-p-2 sppcfw-grid sppcfw-grid-cols-2 sppcfw-gap-1.5 sppcfw-transition-all sppcfw-shadow-sm group-hover:sppcfw-bg-[#9333ea]/10' },
							h('div', { className: 'sppcfw-border sppcfw-border-dashed sppcfw-border-[#94a3b8] group-hover:sppcfw-border-[#a855f7] sppcfw-rounded-sm' }),
							h('div', { className: 'sppcfw-border sppcfw-border-dashed sppcfw-border-[#94a3b8] group-hover:sppcfw-border-[#a855f7] sppcfw-rounded-sm' }),
							h('div', { className: 'sppcfw-border sppcfw-border-dashed sppcfw-border-[#94a3b8] group-hover:sppcfw-border-[#a855f7] sppcfw-rounded-sm' }),
							h('div', { className: 'sppcfw-border sppcfw-border-dashed sppcfw-border-[#94a3b8] group-hover:sppcfw-border-[#a855f7] sppcfw-rounded-sm' })
						),
						h('span', { className: 'sppcfw-text-sm sppcfw-font-medium sppcfw-text-gray-600 group-hover:sppcfw-text-[#9333ea]' }, 'Grid')
					)
				),

			// STEP 2: Structure Preset Selection (Flexbox or Grid options - Image 2)
			step === 'preset_selection' &&
				(layoutType === 'flexbox'
					? h(
							'div',
							{ className: 'sppcfw-grid sppcfw-grid-cols-6 sppcfw-gap-4 sppcfw-py-4 sppcfw-max-w-2xl sppcfw-mx-auto' },

							// 1. Column ↓
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] hover:sppcfw-text-white sppcfw-text-gray-600 sppcfw-rounded-md sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-font-bold sppcfw-text-lg',
									onClick: () => handlePresetSelect('flex_col'),
									title: 'Single Column (Vertical)',
								},
								'↓'
							),

							// 2. Row →
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] hover:sppcfw-text-white sppcfw-text-gray-600 sppcfw-rounded-md sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-font-bold sppcfw-text-lg',
									onClick: () => handlePresetSelect('flex_row'),
									title: 'Single Row (Horizontal)',
								},
								'→'
							),

							// 3. 50 / 50
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('2_col_50_50'),
									title: '50% / 50%',
								},
								h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 4. 33 / 67
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('2_col_33_66'),
									title: '33% / 67%',
								},
								h('div', { className: 'sppcfw-w-1/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-2/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 5. 4 Columns (25/25/25/25)
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('4_col_25_25_25_25'),
									title: '25% / 25% / 25% / 25%',
								},
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 6. 3 Columns (33/33/33)
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('3_col_33_33_33'),
									title: '33% / 33% / 33%',
								},
								h('div', { className: 'sppcfw-w-1/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 7. 25 / 50 / 25
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('3_col_25_50_25'),
									title: '25% / 50% / 25%',
								},
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/4 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 8. 67 / 33
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('2_col_66_33'),
									title: '67% / 33%',
								},
								h('div', { className: 'sppcfw-w-2/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-w-1/3 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							)
					  )
					: h(
							'div',
							{ className: 'sppcfw-grid sppcfw-grid-cols-4 sppcfw-gap-4 sppcfw-py-4 sppcfw-max-w-lg sppcfw-mx-auto' },

							// 1. Grid 2x2
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-grid sppcfw-grid-cols-2 sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('grid_2x2'),
									title: 'Grid 2x2',
								},
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 2. Grid 3x3
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1 sppcfw-grid sppcfw-grid-cols-3 sppcfw-gap-0.5 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('grid_3x3'),
									title: 'Grid 3x3',
								},
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h('div', { className: 'sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							),

							// 3. Grid 1 Top 2 Bottom
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-flex-col sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('grid_1_2'),
									title: 'Grid 1 Top, 2 Bottom',
								},
								h('div', { className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
								h(
									'div',
									{ className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-flex sppcfw-gap-1' },
									h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
									h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
								)
							),

							// 4. Grid 2 Top 1 Bottom
							h(
								'div',
								{
									className: 'sppcfw-w-full sppcfw-h-16 sppcfw-bg-[#cbd5e1]/60 hover:sppcfw-bg-[#9333ea] sppcfw-rounded-md sppcfw-p-1.5 sppcfw-flex sppcfw-flex-col sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-shadow-sm sppcfw-tab-group',
									onClick: () => handlePresetSelect('grid_2_1'),
									title: 'Grid 2 Top, 1 Bottom',
								},
								h(
									'div',
									{ className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-flex sppcfw-gap-1' },
									h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' }),
									h('div', { className: 'sppcfw-w-1/2 sppcfw-h-full sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
								),
								h('div', { className: 'sppcfw-w-full sppcfw-h-1/2 sppcfw-bg-[#94a3b8] group-hover:sppcfw-bg-white/80 sppcfw-rounded-sm' })
							)
					  ))
		);
	}

	// Responsive property helpers (desktop, tablet, mobile)
	function getDeviceKey(key, deviceView) {
		if (deviceView === 'tablet') return key + '_tablet';
		if (deviceView === 'mobile') return key + '_mobile';
		return key;
	}

	function getResponsiveProp(obj, key, deviceView) {
		if (!obj) return undefined;
		if (deviceView === 'mobile') {
			if (obj[key + '_mobile'] !== undefined && obj[key + '_mobile'] !== '') return obj[key + '_mobile'];
			if (obj[key + '_tablet'] !== undefined && obj[key + '_tablet'] !== '') return obj[key + '_tablet'];
			return obj[key];
		}
		if (deviceView === 'tablet') {
			if (obj[key + '_tablet'] !== undefined && obj[key + '_tablet'] !== '') return obj[key + '_tablet'];
			return obj[key];
		}
		return obj[key];
	}

	// Helpers for nested element tree
	function findElementInTree(tree, targetId) {
		for (const el of tree) {
			if (el.id === targetId) return el;
			if (el.children && Array.isArray(el.children)) {
				const found = findElementInTree(el.children, targetId);
				if (found) return found;
			}
		}
		return null;
	}

	function findParentInTree(tree, targetId, parent = null) {
		for (const el of tree) {
			if (el.id === targetId) return parent;
			if (el.children && Array.isArray(el.children)) {
				const found = findParentInTree(el.children, targetId, el);
				if (found) return found;
			}
		}
		return null;
	}

	function findRootContainer(tree, targetId) {
		for (const cont of tree) {
			if (cont.id === targetId) return cont;
			if (findElementInTree([cont], targetId)) return cont;
		}
		return null;
	}

	function isDescendantOf(tree, ancestorId, targetId) {
		const ancestor = findElementInTree(tree, ancestorId);
		if (!ancestor || !ancestor.children) return false;
		return !!findElementInTree(ancestor.children, targetId);
	}

	function isElementHiddenOnDevice(el, deviceView) {
		if (!el || !el.advanced) return false;
		const adv = el.advanced;
		if (deviceView === 'desktop' && (adv.hide_on_desktop === true || adv.hide_on_desktop === 'true' || adv.hide_on_desktop === 1 || adv.hide_on_desktop === '1')) return true;
		if (deviceView === 'tablet' && (adv.hide_on_tablet === true || adv.hide_on_tablet === 'true' || adv.hide_on_tablet === 1 || adv.hide_on_tablet === '1')) return true;
		if (deviceView === 'mobile' && (adv.hide_on_mobile === true || adv.hide_on_mobile === 'true' || adv.hide_on_mobile === 1 || adv.hide_on_mobile === '1')) return true;
		return false;
	}

	function updateElementInTree(tree, targetId, updateFn) {
		return tree.map(el => {
			if (el.id === targetId) {
				return updateFn(el);
			}
			if (el.children && Array.isArray(el.children)) {
				return {
					...el,
					children: updateElementInTree(el.children, targetId, updateFn),
				};
			}
			return el;
		});
	}

	function removeElementFromTree(tree, targetId) {
		return tree
			.filter(el => el.id !== targetId)
			.map(el => {
				if (el.children && Array.isArray(el.children)) {
					return {
						...el,
						children: removeElementFromTree(el.children, targetId),
					};
				}
				return el;
			});
	}

	function insertChildInTree(tree, parentId, newChild, targetIndex) {
		if (!parentId) {
			const copy = [...tree];
			if (typeof targetIndex === 'number' && targetIndex >= 0) {
				copy.splice(targetIndex, 0, newChild);
			} else {
				copy.push(newChild);
			}
			return copy;
		}

		return tree.map(el => {
			if (el.id === parentId) {
				const children = el.children ? [...el.children] : [];
				if (typeof targetIndex === 'number' && targetIndex >= 0) {
					children.splice(targetIndex, 0, newChild);
				} else {
					children.push(newChild);
				}
				return { ...el, children };
			}
			if (el.children && Array.isArray(el.children)) {
				return {
					...el,
					children: insertChildInTree(el.children, parentId, newChild, targetIndex),
				};
			}
			return el;
		});
	}

	function moveElementInTree(tree, sourceId, targetParentId, targetSlot) {
		const elementToMove = findElementInTree(tree, sourceId);
		if (!elementToMove) return tree;

		// Guard: Flexbox container can NEVER be nested inside another container or column
		if (elementToMove.type === 'container') {
			targetParentId = null;
		}

		// Guard: Column can NEVER be nested inside another column or widget
		if (elementToMove.type === 'column') {
			if (targetParentId) {
				const targetParentEl = findElementInTree(tree, targetParentId);
				if (targetParentEl && targetParentEl.type === 'column') {
					const parentContainer = findParentInTree(tree, targetParentId);
					targetParentId = parentContainer ? parentContainer.id : null;
				}
			}
		}

		// Guard: Prevent moving an element into its own descendant
		if (targetParentId && isDescendantOf(tree, sourceId, targetParentId)) {
			return tree;
		}

		const sourceParent = findParentInTree(tree, sourceId);
		const sourceParentId = sourceParent ? sourceParent.id : null;

		let adjustedTargetIndex = targetSlot;

		// If moving within the same parent (nested or at root level)
		if (sourceParentId === targetParentId && typeof targetSlot === 'number') {
			const siblings = sourceParent ? sourceParent.children : tree;
			if (Array.isArray(siblings)) {
				const sourceIndex = siblings.findIndex(c => c.id === sourceId);
				if (sourceIndex !== -1) {
					// Dropped in the slot immediately before or after itself: position is unchanged
					if (targetSlot === sourceIndex || targetSlot === sourceIndex + 1) {
						return tree;
					}
					// If moving downward (top to bottom), removing the source shifts subsequent target indices left by 1
					if (sourceIndex < targetSlot) {
						adjustedTargetIndex = targetSlot - 1;
					}
				}
			}
		}

		const cleanedTree = removeElementFromTree(tree, sourceId);
		return insertChildInTree(cleanedTree, targetParentId, elementToMove, adjustedTargetIndex);
	}

	// Searchable Product Select Dropdown Component
	function SearchableProductSelect({ products = [], selectedProductId, onChange, placeholder = 'Search products...' }) {
		const [isOpen, setIsOpen] = useState(false);
		const [searchTerm, setSearchTerm] = useState('');
		const containerRef = useRef(null);

		// Close dropdown on outside click
		useEffect(() => {
			function handleClickOutside(event) {
				if (containerRef.current && !containerRef.current.contains(event.target)) {
					setIsOpen(false);
				}
			}
			if (isOpen) {
				document.addEventListener('mousedown', handleClickOutside);
			}
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [isOpen]);

		const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
		const displayLabel = selectedProduct ? selectedProduct.title : 'Default (All Products)';

		const filteredProducts = products.filter(p => {
			if (!searchTerm.trim()) return true;
			const term = searchTerm.toLowerCase();
			const titleMatch = (p.title || '').toLowerCase().includes(term);
			const idMatch = String(p.id).includes(term);
			return titleMatch || idMatch;
		});

		function handleSelect(id) {
			onChange({ target: { value: id } });
			setIsOpen(false);
			setSearchTerm('');
		}

		return h(
			'div',
			{ className: 'sppcfw-relative sppcfw-w-full', ref: containerRef },

			// Trigger Button
			h(
				'button',
				{
					type: 'button',
					className: `sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-bg-[#111827] sppcfw-border sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-transition-all sppcfw-cursor-pointer ${
						isOpen ? 'sppcfw-border-[#9333ea] sppcfw-ring-1 sppcfw-ring-[#9333ea]' : 'sppcfw-border-[#374151] hover:sppcfw-border-gray-500'
					}`,
					onClick: () => setIsOpen(!isOpen),
				},
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-overflow-hidden sppcfw-pr-2' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#9333ea]' }, selectedProductId ? 'shopping_bag' : 'auto_awesome'),
					h('span', { className: 'sppcfw-truncate sppcfw-text-white sppcfw-font-medium' }, displayLabel)
				),
				h('span', { className: `sppcfw-text-[10px] sppcfw-text-gray-400 sppcfw-transition-transform ${isOpen ? 'sppcfw-rotate-180' : ''}` }, '▼')
			),

			// Dropdown Panel
			isOpen &&
				h(
					'div',
					{
						className: 'sppcfw-absolute sppcfw-top-full sppcfw-left-0 sppcfw-w-full sppcfw-mt-1 sppcfw-bg-[#1f2937] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-lg sppcfw-shadow-2xl sppcfw-z-50 sppcfw-overflow-hidden sppcfw-flex sppcfw-flex-col sppcfw-max-h-72',
					},

					// Search Input Header
					h(
						'div',
						{ className: 'sppcfw-p-2 sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#111827]' },
						h(
							'div',
							{ className: 'sppcfw-relative' },
							h('span', { className: 'material-symbols-outlined sppcfw-absolute sppcfw-right-2 sppcfw-top-1/2 sppcfw--translate-y-1/2 sppcfw-text-xs sppcfw-text-gray-400' }, 'search'),
							h('input', {
								type: 'text',
								autoFocus: true,
								value: searchTerm,
								placeholder: placeholder,
								onChange: e => setSearchTerm(e.target.value),
								className: 'sppcfw-w-full sppcfw-bg-[#1f2937] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-pl-7 sppcfw-pr-6 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-placeholder-gray-400 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							}),
							searchTerm &&
								h(
									'button',
									{
										type: 'button',
										className: 'sppcfw-absolute sppcfw-right-1.5 sppcfw-top-1/2 sppcfw--translate-y-1/2 sppcfw-text-gray-400 hover:sppcfw-text-white sppcfw-text-xs sppcfw-cursor-pointer',
										onClick: () => setSearchTerm(''),
									},
									'✕'
								)
						)
					),

					// Options List
					h(
						'div',
						{ className: 'sppcfw-overflow-y-auto custom-scrollbar sppcfw-flex-1 sppcfw-p-1 sppcfw-space-y-0.5' },

						// "Default (All Products)" Option
						h(
							'button',
							{
								type: 'button',
								className: `sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-p-2 sppcfw-rounded sppcfw-text-left sppcfw-transition-colors sppcfw-cursor-pointer ${
									!selectedProductId ? 'sppcfw-bg-[#9333ea] sppcfw-text-white' : 'hover:sppcfw-bg-[#111827] sppcfw-text-gray-200'
								}`,
								onClick: () => handleSelect(''),
							},
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5' },
								h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-opacity-80' }, 'auto_awesome'),
								h(
									'div',
									null,
									h('div', { className: 'sppcfw-text-xs sppcfw-font-semibold' }, 'Default (All Products)'),
									h('div', { className: 'sppcfw-text-[10px] sppcfw-opacity-70' }, 'Demo sample preview')
								)
							),
							!selectedProductId && h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-font-bold' }, 'check')
						),

						// Products List
						filteredProducts.length > 0
							? filteredProducts.map(prod => {
									const isSelected = String(selectedProductId) === String(prod.id);
									return h(
										'button',
										{
											key: prod.id,
											type: 'button',
											className: `sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-p-2 sppcfw-rounded sppcfw-text-left sppcfw-transition-colors sppcfw-cursor-pointer ${
												isSelected ? 'sppcfw-bg-[#9333ea] sppcfw-text-white' : 'hover:sppcfw-bg-[#111827] sppcfw-text-gray-200'
											}`,
											onClick: () => handleSelect(prod.id),
										},
										h(
											'div',
											{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-overflow-hidden' },
											prod.image_url
												? h('img', { src: prod.image_url, alt: '', className: 'sppcfw-w-6 sppcfw-h-6 sppcfw-rounded sppcfw-object-cover sppcfw-bg-[#111827]' })
												: h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-opacity-60' }, 'image'),
											h(
												'div',
												{ className: 'sppcfw-overflow-hidden' },
												h('div', { className: 'sppcfw-text-xs sppcfw-font-medium sppcfw-truncate' }, prod.title),
												h('div', { className: 'sppcfw-text-[10px] sppcfw-opacity-70 font-mono' }, `ID: #${prod.id}`)
											)
										),
										isSelected && h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-font-bold' }, 'check')
									);
							  })
							: h(
									'div',
									{ className: 'sppcfw-py-4 sppcfw-text-center sppcfw-text-gray-400 sppcfw-text-xs' },
									'No products found matching "',
									searchTerm,
									'"'
							  )
					)
				)
		);
	}

	// Main App Component
	function BuilderApp() {
		const initialTplId = window.SPPCFWBuilderConfig ? window.SPPCFWBuilderConfig.template_id || 'template_default' : 'template_default';
		const [templateId, setTemplateId] = useState(initialTplId);
		const [templateTitle, setTemplateTitle] = useState('Single Product Template');
		const [enablePlusMinus, setEnablePlusMinus] = useState(() => {
			return !!(window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.enable_plus_minus_button === 'on');
		});
		const [addToCartBtnText, setAddToCartBtnText] = useState(() => {
			return (window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.add_to_cart_button_text) || 'Add to cart';
		});
		const [hidePrice, setHidePrice] = useState(() => {
			return !!(window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.hide_product_price === 'on');
		});

		function handleToggleHidePrice(val) {
			const isChecked = !!val;
			setHidePrice(isChecked);
			apiPost('sppcfw_update_builder_basic_setting', {
				key: 'hide_product_price',
				value: isChecked ? 'on' : '',
			});
			if (window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings) {
				window.SPPCFWBuilderConfig.basic_settings.hide_product_price = isChecked ? 'on' : '';
			}
		}

		const [products, setProducts] = useState([]);
		const [categories, setCategories] = useState([]);
		const [selectedProductId, setSelectedProductId] = useState('');
		const [productData, setProductData] = useState(null);

		const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
		const [activeLeftTab, setActiveLeftTab] = useState('widgets'); // 'widgets' | 'structure'
		const [activeSubTab, setActiveSubTab] = useState('widgets'); // 'widgets' | 'components' | 'globals'
		const [searchQuery, setSearchQuery] = useState('');

		const [elements, setElements] = useState([]);
		const [selectedElementId, setSelectedElementId] = useState(null);

		const [isStructureOpen, setIsStructureOpen] = useState(true);
		const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
		const [displayConditions, setDisplayConditions] = useState({
			scope: 'entire',
			category_ids: [],
			product_ids: [],
		});

		const [pageSettings, setPageSettings] = useState({
			status: 'published',
			pageLayout: 'Default',
			bgColor: '#091421',
			customCss: '',
		});

		const [allTemplates, setAllTemplates] = useState([]);
		const [isSaving, setIsSaving] = useState(false);
		const [statusMessage, setStatusMessage] = useState('');

		function fetchTemplatesList() {
			apiPost('sppcfw_get_builder_templates', {}).then(res => {
				if (res && res.success && Array.isArray(res.data.templates)) {
					setAllTemplates(res.data.templates);
				}
			});
		}

		function applyLoadedTemplateData(tpl) {
			if (tpl.id) setTemplateId(tpl.id);
			if (tpl.title) setTemplateTitle(tpl.title);
			if (tpl.layout && Array.isArray(tpl.layout)) {
				setElements(tpl.layout);
			} else {
				setElements([]);
			}
			if (tpl.conditions) {
				setDisplayConditions(tpl.conditions);
			} else {
				setDisplayConditions({ scope: 'entire', category_ids: [], product_ids: [] });
			}

			const loadedProdId = (tpl.page_settings && tpl.page_settings.selected_product_id) || tpl.selected_product_id || '';
			setSelectedProductId(loadedProdId);
			fetchProductData(loadedProdId);

			if (tpl.page_settings) {
				const st = (tpl.page_settings.status || tpl.status || 'published').toLowerCase();
				setPageSettings({ ...tpl.page_settings, status: st, selected_product_id: loadedProdId });
			} else if (tpl.status) {
				setPageSettings(prev => ({ ...prev, status: tpl.status.toLowerCase(), selected_product_id: loadedProdId }));
			} else {
				setPageSettings({ status: 'published', pageLayout: 'Default', bgColor: '#091421', customCss: '', selected_product_id: loadedProdId });
			}
		}

		function switchTemplate(targetId) {
			apiPost('sppcfw_load_builder_template', { template_id: targetId }).then(res => {
				if (res && res.success && res.data && res.data.template) {
					const tpl = res.data.template;
					applyLoadedTemplateData(tpl);
					if (res.data.basic_settings) {
						if (res.data.basic_settings.enable_plus_minus_button !== undefined) {
							setEnablePlusMinus(res.data.basic_settings.enable_plus_minus_button === 'on');
						}
						if (res.data.basic_settings.add_to_cart_button_text !== undefined) {
							setAddToCartBtnText(res.data.basic_settings.add_to_cart_button_text || 'Add to cart');
						}
						if (res.data.basic_settings.hide_product_price !== undefined) {
							setHidePrice(res.data.basic_settings.hide_product_price === 'on');
						}
					}
					if (window.history && window.history.pushState) {
						const newUrl = new URL(window.location.href);
						newUrl.searchParams.set('template_id', tpl.id || targetId);
						window.history.pushState(null, '', newUrl.toString());
					}
				}
			});
		}

		// Initial Data Load
		useEffect(() => {
			fetchTemplatesList();

			apiPost('sppcfw_get_builder_products_and_categories', {}).then(res => {
				if (res && res.success) {
					setProducts(res.data.products || []);
					setCategories(res.data.categories || []);
				}
			});

			apiPost('sppcfw_load_builder_template', { template_id: initialTplId }).then(res => {
				if (res && res.success && res.data && res.data.template) {
					const tpl = res.data.template;
					applyLoadedTemplateData(tpl);
					if (res.data.basic_settings) {
						if (res.data.basic_settings.enable_plus_minus_button !== undefined) {
							setEnablePlusMinus(res.data.basic_settings.enable_plus_minus_button === 'on');
						}
						if (res.data.basic_settings.add_to_cart_button_text !== undefined) {
							setAddToCartBtnText(res.data.basic_settings.add_to_cart_button_text || 'Add to cart');
						}
						if (res.data.basic_settings.hide_product_price !== undefined) {
							setHidePrice(res.data.basic_settings.hide_product_price === 'on');
						}
					}
				} else {
					fetchProductData(0);
				}
			});
		}, []);

		function fetchProductData(productId) {
			if (!productId) {
				setProductData(null);
				return;
			}
			apiPost('sppcfw_get_builder_product_data', { product_id: productId }).then(res => {
				if (res && res.success && res.data && res.data.product) {
					setProductData(res.data.product);
				} else {
					setProductData(null);
				}
			});
		}

		function handleProductChange(e) {
			const id = e.target.value;
			setSelectedProductId(id);
			setPageSettings(prev => ({ ...prev, selected_product_id: id }));
			fetchProductData(id);
		}

		// Add Layout Structure to Canvas
		function addContainerPreset(presetType) {
			const newContainer = createContainerStructure(presetType);
			setElements(prev => [...prev, newContainer]);
			setSelectedElementId(newContainer.id);
		}

		// Add Column to specified Container
		function addColumnToContainer(targetContainerId, flexWidth) {
			const timestamp = Date.now();
			let resolvedContainerId = targetContainerId || selectedElementId;

			if (!resolvedContainerId && elements.length > 0) {
				resolvedContainerId = elements[elements.length - 1].id;
			}

			if (elements.length === 0) {
				const autoContainer = createContainerStructure('1_container');
				setElements([autoContainer]);
				setSelectedElementId(autoContainer.children[0].id);
				return;
			}

			const targetNode = findElementInTree(elements, resolvedContainerId);
			let containerId = targetNode && targetNode.type === 'container' ? targetNode.id : null;
			if (!containerId && targetNode && targetNode.type === 'column') {
				const parent = findParentInTree(elements, targetNode.id);
				if (parent) containerId = parent.id;
			}

			if (!containerId && elements.length > 0) {
				containerId = elements[0].id;
			}

			if (!containerId) return;

			const containerNode = findElementInTree(elements, containerId);
			const currentColsCount = containerNode && containerNode.children ? containerNode.children.length : 0;
			const newCount = currentColsCount + 1;

			let defaultWidth = '100%';
			if (newCount === 2) defaultWidth = '50%';
			else if (newCount === 3) defaultWidth = '33.33%';
			else if (newCount === 4) defaultWidth = '25%';
			else defaultWidth = flexWidth || (100 / newCount).toFixed(2) + '%';

			const newColId = 'col-' + timestamp + '-' + Math.floor(Math.random() * 1000);
			const newColumn = {
				id: newColId,
				type: 'column',
				label: 'Column ' + newCount + ' (' + (flexWidth || defaultWidth) + ')',
				settings: { flex_width: flexWidth || defaultWidth },
				children: [],
				styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
			};

			setElements(prev => {
				return updateElementInTree(prev, containerId, container => {
					const children = container.children ? [...container.children] : [];
					return {
						...container,
						children: [...children, newColumn],
					};
				});
			});

			setSelectedElementId(newColId);
		}

		// Duplicate Column and its contents
		function duplicateColumn(columnId) {
			const targetId = columnId || selectedElementId;
			const colToDuplicate = findElementInTree(elements, targetId);
			if (!colToDuplicate || colToDuplicate.type !== 'column') return;

			const parentContainer = findParentInTree(elements, targetId);
			if (!parentContainer) return;

			const timestamp = Date.now();
			const newColId = 'col-' + timestamp + '-' + Math.floor(Math.random() * 1000);

			const duplicatedCol = JSON.parse(JSON.stringify(colToDuplicate));
			duplicatedCol.id = newColId;
			duplicatedCol.label = (colToDuplicate.label || 'Column') + ' (Copy)';

			function reassignIds(item) {
				item.id = 'el-' + item.type + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
				if (item.children && Array.isArray(item.children)) {
					item.children.forEach(reassignIds);
				}
			}
			if (duplicatedCol.children) {
				duplicatedCol.children.forEach(reassignIds);
			}

			setElements(prev => {
				return updateElementInTree(prev, parentContainer.id, container => {
					const children = container.children ? [...container.children] : [];
					const idx = children.findIndex(c => c.id === targetId);
					if (idx >= 0) {
						children.splice(idx + 1, 0, duplicatedCol);
					} else {
						children.push(duplicatedCol);
					}
					return { ...container, children };
				});
			});

			setSelectedElementId(newColId);
		}

		// Add Widget to specified Parent Column/Container
		function addWidgetToTarget(widgetType, name, metaKey, targetParentId, targetIndex) {
			if (['column'].includes(widgetType) || (name && name.toLowerCase() === 'column')) {
				addColumnToContainer(targetParentId);
				return;
			}

			// If adding preset layout directly from atomic cards
			if (['div_block', '1_container', 'flexbox', 'grid_2x2', 'grid'].includes(widgetType)) {
				addContainerPreset(widgetType);
				return;
			}

			// If canvas has no containers yet, automatically create a default flexbox container
			let currentElements = elements;
			let resolvedParentId = targetParentId;

			if (currentElements.length === 0 && !resolvedParentId) {
				const autoContainer = createContainerStructure('1_container');
				currentElements = [autoContainer];
				resolvedParentId = autoContainer.children[0].id;
			}

			const newId = 'el-' + widgetType + '-' + Date.now();
			let initialSettings = {
				scope: 'global',
				alignment: 'left',
			};

			if (widgetType === 'html_code' || widgetType === 'custom_html') {
				initialSettings = {
					scope: 'global',
					alignment: 'left',
					html_content: '<div class="sppcfw-promo-banner">\n  <div class="sppcfw-promo-icon">⚡</div>\n  <div class="sppcfw-promo-text">\n    <h4>Special Limited Time Offer</h4>\n    <p>Enjoy free expedited shipping &amp; 30-day money-back guarantee.</p>\n  </div>\n</div>',
					custom_css: '/* Custom HTML Element Styles */\n.sppcfw-promo-banner {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  background: linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%);\n  border: 1px solid #c4b5fd;\n  border-radius: 8px;\n  padding: 14px 18px;\n  box-shadow: 0 1px 3px rgba(0,0,0,0.05);\n}\n.sppcfw-promo-icon {\n  font-size: 24px;\n  line-height: 1;\n}\n.sppcfw-promo-text h4 {\n  margin: 0 0 4px 0;\n  font-size: 14px;\n  font-weight: 700;\n  color: #581c87;\n}\n.sppcfw-promo-text p {\n  margin: 0;\n  font-size: 12px;\n  color: #4b5563;\n  line-height: 1.4;\n}',
					custom_js: '// Custom JavaScript for this element\n// This script runs automatically on page load\nconsole.log("SPPCFW Custom HTML element loaded.");',
				};
			}

			const newElement = {
				id: newId,
				type: widgetType,
				label: name || widgetType,
				metaKey: metaKey || null,
				settings: initialSettings,
				styles: {
					font_family: 'Inter',
					font_size: '16px',
					font_weight: '400',
					line_height: '1.5',
					text_color: '#111827',
					bg_color: 'transparent',
					border_color: '#e5e7eb',
					border_width: '0px',
					border_radius: '0px',
					padding_top: '0px',
					padding_right: '0px',
					padding_bottom: '0px',
					padding_left: '0px',
					margin_top: '0px',
					margin_right: '0px',
					margin_bottom: '16px',
					margin_left: '0px',
				},
				advanced: {
					custom_class: '',
					z_index: '1',
				},
			};

			setElements(() => {
				if (!resolvedParentId) {
					const lastContainer = currentElements[currentElements.length - 1];
					if (lastContainer && lastContainer.children && lastContainer.children[0]) {
						resolvedParentId = lastContainer.children[0].id;
					} else if (lastContainer) {
						resolvedParentId = lastContainer.id;
					}
				}
				return insertChildInTree(currentElements, resolvedParentId, newElement, targetIndex);
			});

			setSelectedElementId(newId);
		}

		function removeElement(id) {
			setElements(prev => removeElementFromTree(prev, id));
			if (selectedElementId === id) {
				setSelectedElementId(null);
			}
		}

		function saveTemplate() {
			const validationErrors = validateAllElements(elements);
			if (validationErrors.length > 0) {
				setIsSaving(false);
				const firstErr = validationErrors[0];
				setStatusMessage('⚠️ ' + firstErr);
				alert('Cannot save or publish template due to syntax errors:\n\n' + validationErrors.join('\n\n') + '\n\nPlease fix the errors in your HTML / CSS / JS code before saving.');
				return;
			}

			setIsSaving(true);
			const currentStatus = (pageSettings && pageSettings.status) ? pageSettings.status.toLowerCase() : 'published';
			const isDraft = currentStatus === 'draft';
			setStatusMessage(isDraft ? 'Saving draft...' : 'Publishing template...');

			const updatedPageSettings = {
				...pageSettings,
				selected_product_id: selectedProductId || '',
			};

			apiPost('sppcfw_save_builder_template', {
				template_id: templateId,
				template_title: templateTitle,
				status: currentStatus,
				selected_product_id: selectedProductId || '',
				enable_plus_minus_button: enablePlusMinus ? 'on' : '',
				add_to_cart_button_text: addToCartBtnText || '',
				hide_product_price: hidePrice ? 'on' : '',
				page_settings: JSON.stringify(updatedPageSettings),
				layout: JSON.stringify(elements),
				conditions: JSON.stringify(displayConditions),
			}).then(res => {
				setIsSaving(false);
				if (res && res.success) {
					if (res.data && res.data.template_id) {
						setTemplateId(res.data.template_id);
					}
					setStatusMessage(res.data.message || (isDraft ? 'Draft saved successfully!' : 'Published successfully!'));
					fetchTemplatesList();
					setTimeout(() => setStatusMessage(''), 4000);
				} else {
					setStatusMessage('Failed to save template.');
				}
			});
		}

		const selectedElement = findElementInTree(elements, selectedElementId);

		function updateElementProperties(updatedElement) {
			setElements(prev => updateElementInTree(prev, updatedElement.id, () => updatedElement));
		}

		// Helper to open Elements panel from header + icon button
		function openElementsTab() {
			setActiveLeftTab('widgets');
			setSelectedElementId(null);
			setSearchQuery('');
		}

		// Helper to open Page Settings (Post Settings) panel button
		function openPageSettings() {
			setActiveLeftTab('settings');
			setSelectedElementId(null);
		}

		// Helper to open live product preview in a new browser tab with auto-save
		function handlePreview() {
			const validationErrors = validateAllElements(elements);
			if (validationErrors.length > 0) {
				const firstErr = validationErrors[0];
				setStatusMessage('⚠️ ' + firstErr);
				alert('Cannot preview template due to syntax errors:\n\n' + validationErrors.join('\n\n') + '\n\nPlease fix the errors before previewing.');
				return;
			}

			let targetProduct = null;
			if (selectedProductId && Array.isArray(products)) {
				targetProduct = products.find(p => String(p.id) === String(selectedProductId));
			}
			if (!targetProduct && Array.isArray(products) && products.length > 0) {
				targetProduct = products[0];
			}

			let previewUrl = targetProduct && targetProduct.url ? targetProduct.url : window.location.origin;
			const sep = previewUrl.includes('?') ? '&' : '?';
			previewUrl += sep + 'sppcfw_preview=1&template_id=' + encodeURIComponent(templateId);

			const previewWindow = window.open('about:blank', '_blank');

			const currentStatus = (pageSettings && pageSettings.status) ? pageSettings.status.toLowerCase() : 'published';
			const updatedPageSettings = {
				...pageSettings,
				selected_product_id: selectedProductId || '',
			};

			apiPost('sppcfw_save_builder_template', {
				template_id: templateId,
				template_title: templateTitle,
				status: currentStatus,
				selected_product_id: selectedProductId || '',
				enable_plus_minus_button: enablePlusMinus ? 'on' : '',
				add_to_cart_button_text: addToCartBtnText || '',
				hide_product_price: hidePrice ? 'on' : '',
				page_settings: JSON.stringify(updatedPageSettings),
				layout: JSON.stringify(elements),
				conditions: JSON.stringify(displayConditions),
			}).then(res => {
				if (res && res.success && res.data && res.data.template_id) {
					setTemplateId(res.data.template_id);
				}
				if (previewWindow) {
					previewWindow.location.href = previewUrl;
				}
			}).catch(() => {
				if (previewWindow) {
					previewWindow.location.href = previewUrl;
				}
			});
		}

		const [activeCanvasImage, setActiveCanvasImage] = useState(null);
		const [activeVariationAttrs, setActiveVariationAttrs] = useState({});

		useEffect(() => {
			setActiveVariationAttrs({});
			setActiveCanvasImage(null);
		}, [selectedProductId]);

		const effectiveSampleData = {
			...((selectedProductId && productData) ? { ...CANVAS_STATIC_DATA, ...productData } : CANVAS_STATIC_DATA),
			activeCanvasImage: activeCanvasImage,
			activeVariationAttrs: activeVariationAttrs,
			onSelectVariationOption: (attrKey, optValue) => {
				const nextAttrs = { ...activeVariationAttrs, [attrKey]: optValue };
				setActiveVariationAttrs(nextAttrs);

				const currentProd = (selectedProductId && productData) ? productData : CANVAS_STATIC_DATA;
				const availVars = (currentProd && currentProd.available_variations) || [];

				let matchedVar = null;
				for (const v of availVars) {
					if (v.attributes) {
						let match = true;
						for (const k in v.attributes) {
							const cleanK = k.replace('attribute_', '').replace('pa_', '').toLowerCase();
							const vVal = (v.attributes[k] || '').toLowerCase();
							if (vVal === '') continue; // wildcard

							const chosen = (nextAttrs[cleanK] || nextAttrs['attribute_' + cleanK] || nextAttrs['pa_' + cleanK] || nextAttrs[k] || '').toLowerCase();
							if (chosen && vVal !== chosen) {
								match = false;
								break;
							}
						}
						if (match) {
							matchedVar = v;
							break;
						}
					}
				}

				if (matchedVar && matchedVar.image_url) {
					setActiveCanvasImage(matchedVar.image_url);
				} else {
					// Fallback: check if any gallery image contains the color/option name
					const gUrls = (currentProd && currentProd.gallery_urls) || [];
					const optLower = String(optValue).toLowerCase();
					const matchG = gUrls.find(u => u.toLowerCase().includes(optLower));
					if (matchG) {
						setActiveCanvasImage(matchG);
					}
				}
			},
			onSelectCanvasImage: (imgUrl) => {
				setActiveCanvasImage(imgUrl);
			},
			onResetVariation: () => {
				setActiveVariationAttrs({});
				setActiveCanvasImage(null);
			}
		};

		return h(
			'div',
			{ className: 'sppcfw-builder-layout sppcfw-flex sppcfw-flex-col sppcfw-h-screen sppcfw-w-screen sppcfw-overflow-hidden sppcfw-text-[#d9e3f6]' },

			// Top Bar Navigation
			h(TopBar, {
				templateTitle,
				setTemplateTitle,
				deviceView,
				setDeviceView,
				saveTemplate,
				isSaving,
				statusMessage,
				openElementsTab,
				openPageSettings,
				activeLeftTab,
				pageSettings,
				isStructureOpen,
				setIsStructureOpen,
				openConditionsModal: () => setIsConditionsModalOpen(true),
				allTemplates,
				templateId,
				switchTemplate,
				handlePreview,
			}),

			// Main Workspace Grid
			h(
				'div',
				{ className: 'sppcfw-builder-workspace sppcfw-flex sppcfw-flex-1 sppcfw-overflow-hidden sppcfw-relative' },

				// Left Rail Navigation Icons
				h(LeftRail, {
					activeLeftTab,
					setActiveLeftTab,
					openElementsTab,
				}),

				// Left Sidebar Panel (Renders Inspector on left when element selected, Post Settings when settings active, or Elements Library)
				h(LeftPanel, {
					deviceView,
					selectedElement,
					updateElementProperties,
					activeLeftTab,
					activeSubTab,
					setActiveSubTab,
					searchQuery,
					setSearchQuery,
					products,
					categories,
					selectedProductId,
					handleProductChange,
					productData,
					sampleData: effectiveSampleData,
					addWidgetToTarget,
					addContainerPreset,
					addColumnToContainer,
					duplicateColumn,
					removeElement,
					elements,
					setElements,
					selectedElementId,
					setSelectedElementId,
					templateTitle,
					setTemplateTitle,
					pageSettings,
					setPageSettings,
					openElementsTab,
					enablePlusMinus,
					setEnablePlusMinus,
					addToCartBtnText,
					setAddToCartBtnText,
					hidePrice,
					setHidePrice,
					handleToggleHidePrice,
				}),

				// Central Canvas Workspace
				h(CentralCanvas, {
					deviceView,
					elements,
					setElements,
					selectedElementId,
					setSelectedElementId,
					sampleData: effectiveSampleData,
					pageSettings,
					removeElement,
					addWidgetToTarget,
					addColumnToContainer,
					duplicateColumn,
					openElementsTab,
					isStructureOpen,
					setIsStructureOpen,
				}),

				// Right Floating Dockable Structure Panel (Image 2 )
				isStructureOpen &&
					h(FloatingStructurePanel, {
						elements,
						setElements,
						selectedElementId,
						setSelectedElementId,
						removeElement,
						openElementsTab,
						closeStructure: () => setIsStructureOpen(false),
						deviceView,
					})
			),

			// Display Conditions Modal
			isConditionsModalOpen &&
				h(DisplayConditionsModal, {
					displayConditions,
					setDisplayConditions,
					categories,
					products,
					closeModal: () => setIsConditionsModalOpen(false),
					saveTemplate,
				})
		);
	}

	// 1. Top Navigation Bar Component (Positioned: Left)
	function TopBar({ templateTitle, setTemplateTitle, deviceView, setDeviceView, saveTemplate, isSaving, statusMessage, openElementsTab, openPageSettings, activeLeftTab, pageSettings, isStructureOpen, setIsStructureOpen, openConditionsModal, allTemplates, templateId, switchTemplate, handlePreview }) {
		const [isMenuOpen, setIsMenuOpen] = useState(false);
		const menuRef = useRef(null);

		const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
		const templateMenuRef = useRef(null);

		// Close dropdowns when clicking outside
		useEffect(() => {
			function handleClickOutside(event) {
				if (menuRef.current && !menuRef.current.contains(event.target)) {
					setIsMenuOpen(false);
				}
				if (templateMenuRef.current && !templateMenuRef.current.contains(event.target)) {
					setIsTemplateMenuOpen(false);
				}
			}
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}, []);

		const currentStatus = (pageSettings && pageSettings.status) ? pageSettings.status.toLowerCase() : 'published';
		let publishLabel = 'Publish';
		if (isSaving) {
			publishLabel = currentStatus === 'draft' ? 'Saving...' : 'Publishing...';
		} else if (currentStatus === 'draft') {
			publishLabel = 'Save Draft';
		} else if (currentStatus === 'pending' || currentStatus === 'pending review' || currentStatus === 'private') {
			publishLabel = 'Save (' + currentStatus + ')';
		} else {
			publishLabel = 'Publish';
		}

		return h(
			'header',
			{ className: 'sppcfw-bg-[#111111] sppcfw-border-b sppcfw-border-[#262626] sppcfw-h-12 sppcfw-top-0 sppcfw-left-0 sppcfw-right-0 sppcfw-z-50 sppcfw-flex sppcfw-justify-between sppcfw-items-center sppcfw-px-3 sppcfw-select-none sppcfw-text-white sppcfw-text-xs font-sans sppcfw-relative' },

			// 1. LEFT SECTION: History
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-relative sppcfw-z-10', ref: menuRef },

				// History Button
				h(
					'button',
					{
						className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-rounded-full sppcfw-bg-white sppcfw-text-black sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-shadow hover:sppcfw-bg-gray-100 sppcfw-transition-all sppcfw-font-bold focus:sppcfw-outline-none sppcfw-cursor-pointer',
						onClick: () => setIsMenuOpen(!isMenuOpen),
						title: 'Menu',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-lg sppcfw-leading-none sppcfw-font-bold' }, 'menu')
				),

				//   Dropdown Menu (Image 2: Popover containing only "Exit to Builder")
				isMenuOpen &&
					h(
						'div',
						{ className: 'sppcfw-absolute sppcfw-top-9 sppcfw-left-0 sppcfw-w-60 sppcfw-bg-[#1e1e1e] sppcfw-border sppcfw-border-[#333333] sppcfw-rounded-lg sppcfw-shadow-2xl sppcfw-py-2 sppcfw-px-1 sppcfw-z-50 sppcfw-text-white sppcfw-animate-in sppcfw-fade-in sppcfw-slide-in-from-top-1 sppcfw-duration-150' },
						h(
							'button',
							{
								className: 'sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-gap-3 sppcfw-px-3 sppcfw-py-2 sppcfw-text-left hover:sppcfw-bg-[#2d2d2d] sppcfw-rounded sppcfw-transition-colors sppcfw-text-xs sppcfw-font-medium sppcfw-text-gray-200 hover:sppcfw-text-white sppcfw-cursor-pointer',
								onClick: () => {
									setIsMenuOpen(false);
									window.location.href = 'admin.php?page=sppcfw-single-page-builder';
								},
							},
							h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-text-gray-300' }, 'logout'),
							'Exit to Builder'
						)
					),

				//Square Plus Button (+)
				h(
					'button',
					{
						className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-bg-[#262626] hover:sppcfw-bg-[#333333] sppcfw-border sppcfw-border-[#3a3a3a] sppcfw-text-white sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer',
						onClick: openElementsTab,
						title: 'Add Elements',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'add')
				),

				// Document with Gear Icon Button (Post Settings)
				h(
					'button',
					{
						className: `sppcfw-w-7 sppcfw-h-7 sppcfw-bg-[#262626] hover:sppcfw-bg-[#333333] sppcfw-border sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${
							activeLeftTab === 'settings' ? 'sppcfw-border-[#9333ea] sppcfw-text-white sppcfw-bg-[#333333]' : 'sppcfw-border-[#3a3a3a] sppcfw-text-white'
						}`,
						onClick: openPageSettings,
						title: 'Page Settings',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'article')
				),

				// History Icon Button
				h(
					'button',
					{
						className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-text-gray-300 hover:sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer',
						title: 'Revision History',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'history')
				),

			),

			// 2. CENTER SECTION:(Template Dropdown + Viewport Device Switcher)
			h(
				'div',
				{ className: 'sppcfw-absolute sppcfw-left-1/2 sppcfw--translate-x-1/2 sppcfw-flex sppcfw-items-center sppcfw-gap-3 sppcfw-z-10' },

				// Template Dropdown Selector ("home ∨")
				h(
					'div',
					{ className: 'sppcfw-relative', ref: templateMenuRef },
					h(
						'button',
						{
							type: 'button',
							className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-cursor-pointer sppcfw-text-gray-300 hover:sppcfw-text-white sppcfw-font-medium sppcfw-text-xs sppcfw-bg-transparent sppcfw-border-none focus:sppcfw-outline-none sppcfw-py-1 sppcfw-px-2 sppcfw-rounded hover:sppcfw-bg-[#262626] sppcfw-transition-colors',
							onClick: () => setIsTemplateMenuOpen(!isTemplateMenuOpen),
							title: 'Switch Template',
						},
						h('span', { className: 'sppcfw-font-semibold sppcfw-max-w-[140px] sppcfw-truncate' }, templateTitle || 'home'),
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'expand_more')
					),

					// Template Selection Popover Dropdown
					isTemplateMenuOpen &&
						h(
							'div',
							{ className: 'sppcfw-absolute sppcfw-top-9 sppcfw-left-1/2 sppcfw--translate-x-1/2 sppcfw-w-64 sppcfw-bg-[#1e1e1e] sppcfw-border sppcfw-border-[#333333] sppcfw-rounded-lg sppcfw-shadow-2xl sppcfw-z-50 sppcfw-py-2 sppcfw-text-white sppcfw-animate-in sppcfw-fade-in sppcfw-slide-in-from-top-1 sppcfw-duration-150' },
							h('div', { className: 'sppcfw-px-3 sppcfw-py-1 sppcfw-text-[10px] sppcfw-uppercase sppcfw-font-bold sppcfw-text-gray-400 sppcfw-border-b sppcfw-border-[#2d2d2d] sppcfw-mb-1 sppcfw-flex sppcfw-justify-between sppcfw-items-center' },
								h('span', null, 'Page Templates'),
								h('span', { className: 'sppcfw-text-[9px] sppcfw-bg-[#2d2d2d] sppcfw-text-gray-300 sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded' }, (allTemplates ? allTemplates.length : 0) + ' Total')
							),
							h(
								'div',
								{ className: 'sppcfw-max-h-60 sppcfw-overflow-y-auto custom-scrollbar sppcfw-space-y-0.5 sppcfw-px-1' },
								allTemplates && allTemplates.length > 0
									? allTemplates.map(tpl => {
											const isActive = tpl.id === templateId;
											return h(
												'button',
												{
													key: tpl.id,
													className: `sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-left sppcfw-rounded sppcfw-transition-colors sppcfw-text-xs sppcfw-font-medium sppcfw-cursor-pointer ${
														isActive ? 'sppcfw-bg-[#9333ea]/20 sppcfw-text-purple-200 sppcfw-font-bold sppcfw-border sppcfw-border-[#9333ea]/50' : 'hover:sppcfw-bg-[#2d2d2d] sppcfw-text-gray-200 hover:sppcfw-text-white'
													}`,
													onClick: () => {
														setIsTemplateMenuOpen(false);
														if (!isActive) {
															switchTemplate(tpl.id);
														}
													},
												},
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-overflow-hidden' },
													isActive && h('span', { className: 'sppcfw-text-purple-400 sppcfw-text-xs sppcfw-font-bold' }, '✓'),
													h('span', { className: 'sppcfw-truncate sppcfw-max-w-[140px]' }, tpl.title || 'Untitled Template')
												),
												h(
													'span',
													{
														className: `sppcfw-text-[9px] sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded sppcfw-uppercase font-mono ${
															(tpl.status || '').toLowerCase() === 'draft' ? 'sppcfw-bg-amber-900/60 sppcfw-text-amber-300 sppcfw-border sppcfw-border-amber-500/30' : 'sppcfw-bg-emerald-900/60 sppcfw-text-emerald-300 sppcfw-border sppcfw-border-emerald-500/30'
														}`,
													},
													tpl.status || 'Published'
												)
											);
									  })
									: h('div', { className: 'sppcfw-px-3 sppcfw-py-2 sppcfw-text-xs sppcfw-text-gray-400 sppcfw-italic sppcfw-text-center' }, 'No saved templates found')
							),
							h('div', { className: 'sppcfw-border-t sppcfw-border-[#2d2d2d] sppcfw-mt-1 sppcfw-pt-1 sppcfw-px-1' },
								h(
									'button',
									{
										className: 'sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-px-2 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-[#a855f7] hover:sppcfw-text-purple-300 hover:sppcfw-bg-[#2d2d2d] sppcfw-rounded sppcfw-transition-colors sppcfw-font-bold sppcfw-cursor-pointer',
										onClick: () => {
											setIsTemplateMenuOpen(false);
											switchTemplate('new');
										},
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'add'),
									'Create New Template'
								)
							)
						)
				),

				// Viewport Switcher Icons (Desktop, Tablet, Mobile)
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-3 sppcfw-text-gray-400' },
					h(
						'button',
						{
							className: `hover:sppcfw-text-white sppcfw-transition-colors sppcfw-py-0.5 sppcfw-cursor-pointer ${
								deviceView === 'desktop' ? 'sppcfw-text-white sppcfw-border-b-2 sppcfw-border-white' : ''
							}`,
							onClick: () => setDeviceView('desktop'),
							title: 'Desktop View',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'desktop_windows')
					),
					h(
						'button',
						{
							className: `hover:sppcfw-text-white sppcfw-transition-colors sppcfw-py-0.5 sppcfw-cursor-pointer ${
								deviceView === 'tablet' ? 'sppcfw-text-white sppcfw-border-b-2 sppcfw-border-white' : ''
							}`,
							onClick: () => setDeviceView('tablet'),
							title: 'Tablet View',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'tablet_mac')
					),
					h(
						'button',
						{
							className: `hover:sppcfw-text-white sppcfw-transition-colors sppcfw-py-0.5 sppcfw-cursor-pointer ${
								deviceView === 'mobile' ? 'sppcfw-text-white sppcfw-border-b-2 sppcfw-border-white' : ''
							}`,
							onClick: () => setDeviceView('mobile'),
							title: 'Mobile View',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'smartphone')
					)
				)
			),

			// 3. RIGHT SECTION:(Publish & Canvas Actions Group) + Utilities
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-3 sppcfw-z-10' },

				//Group (Layers, Eye, Badge, Publish Button)
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5' },
					statusMessage &&
						h(
							'span',
							{
								className: `sppcfw-text-xs sppcfw-font-medium ${
									statusMessage.includes('⚠️') || statusMessage.includes('Failed') || statusMessage.includes('Cannot') || statusMessage.includes('Error')
										? 'sppcfw-text-red-400 sppcfw-font-bold'
										: 'sppcfw-text-[#10b981]'
								}`,
							},
							statusMessage
						),

					// Layers / Structure Icon Button
					h(
						'button',
						{
							className: `sppcfw-w-7 sppcfw-h-7 sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${
								isStructureOpen ? 'sppcfw-bg-[#262626] sppcfw-text-white sppcfw-border sppcfw-border-[#3a3a3a]' : 'sppcfw-text-gray-400 hover:sppcfw-text-white'
							}`,
							onClick: () => setIsStructureOpen(!isStructureOpen),
							title: 'Structure Panel',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'layers')
					),

					// Preview Eye Icon Button
					h(
						'button',
						{
							className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-text-gray-400 hover:sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer',
							onClick: handlePreview,
							title: 'Preview designed page in new tab',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'visibility')
					),

					// Publish Button with Dropdown Chevron Arrow
					h(
						'div',
						{ className: 'sppcfw-relative sppcfw-flex sppcfw-items-center' },
						h(
							'button',
							{
								className: 'sppcfw-h-7 sppcfw-px-3 sppcfw-bg-[#1e1a29] sppcfw-border sppcfw-border-[#a855f7]/50 sppcfw-text-white hover:sppcfw-bg-[#2b1f3d] sppcfw-rounded sppcfw-text-xs sppcfw-font-semibold sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-transition-all sppcfw-shadow-sm sppcfw-cursor-pointer',
								onClick: saveTemplate,
								disabled: isSaving,
							},
							publishLabel,
							h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-purple-300', onClick: (e) => { e.stopPropagation(); openConditionsModal(); } }, 'expand_more')
						)
					)
				)
			)
		);
	}

	// 2. Left Rail Navigation Component
	function LeftRail({ activeLeftTab, setActiveLeftTab, openElementsTab }) {
		return h(
			'nav',
			{ className: 'sppcfw-bg-[#16202e] sppcfw-border-r sppcfw-border-[#4d4354] sppcfw-w-[64px] sppcfw-fixed sppcfw-left-0 sppcfw-top-12 sppcfw-bottom-0 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-py-4 sppcfw-z-40 sppcfw-select-none' },
			h(
				'button',
				{
					className: `sppcfw-w-12 sppcfw-h-12 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-gap-1 sppcfw-mb-4 sppcfw-rounded sppcfw-transition-all ${
						activeLeftTab === 'widgets' ? 'sppcfw-text-[#ddb8ff] sppcfw-border-l-2 sppcfw-border-[#9333ea] sppcfw-bg-[#2b3544]' : 'sppcfw-text-[#cfc2d7] hover:sppcfw-bg-[#212b39]'
					}`,
					onClick: openElementsTab,
					title: 'Elements Drawer',
				},
				h('span', { className: 'material-symbols-outlined sppcfw-text-xl' }, 'add_box'),
				h('span', { className: 'sppcfw-text-[9px] sppcfw-uppercase sppcfw-font-bold sppcfw-tracking-wider' }, 'Elements')
			)
		);
	}

	// 3. Left Panel (Renders LeftInspector when element selected, Post Settings when settings tab active, or Elements Library)
	function LeftPanel({
		deviceView = 'desktop',
		selectedElement,
		updateElementProperties,
		activeLeftTab,
		activeSubTab,
		setActiveSubTab,
		searchQuery,
		setSearchQuery,
		products,
		categories,
		selectedProductId,
		handleProductChange,
		productData,
		sampleData,
		addWidgetToTarget,
		addContainerPreset,
		addColumnToContainer,
		duplicateColumn,
		removeElement,
		elements,
		setElements,
		selectedElementId,
		setSelectedElementId,
		templateTitle,
		setTemplateTitle,
		pageSettings,
		setPageSettings,
		openElementsTab,
		enablePlusMinus,
		setEnablePlusMinus,
		addToCartBtnText,
		setAddToCartBtnText,
		hidePrice,
		setHidePrice,
		handleToggleHidePrice,
	}) {
		// If an element or container is selected, render the LEFT-SIDE "Edit Container" / "Edit Element" Inspector
		if (selectedElement) {
			return h(LeftInspector, {
				deviceView,
				selectedElement,
				updateElementProperties,
				closeInspector: () => setSelectedElementId(null),
				categories,
				products,
				sampleData,
				addColumnToContainer,
				duplicateColumn,
				removeElement,
				enablePlusMinus,
				setEnablePlusMinus,
				addToCartBtnText,
				setAddToCartBtnText,
				hidePrice,
				setHidePrice,
				handleToggleHidePrice,
			});
		}

		// If activeLeftTab is 'settings', render the Post Settings panel
		if (activeLeftTab === 'settings') {
			return h(PageSettingsPanel, {
				templateTitle,
				setTemplateTitle,
				pageSettings,
				setPageSettings,
				closePanel: openElementsTab,
				products,
				selectedProductId,
				handleProductChange,
			});
		}

		// Otherwise, render the Left Elements Panel
		return h(LeftElementsPanel, {
			activeSubTab,
			setActiveSubTab,
			searchQuery,
			setSearchQuery,
			products,
			selectedProductId,
			handleProductChange,
			productData,
			addWidgetToTarget,
			addContainerPreset,
			elements,
		});
	}

	// 3c. Page Settings (Post Settings) Panel Component
	function PageSettingsPanel({ templateTitle, setTemplateTitle, pageSettings, setPageSettings, closePanel, products = [], selectedProductId, handleProductChange }) {
		const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'style' | 'advanced'
		const [isGeneralOpen, setIsGeneralOpen] = useState(true);

		function handlePageSettingChange(key, value) {
			setPageSettings(prev => ({ ...prev, [key]: value }));
		}

		return h(
			'aside',
			{ className: 'sppcfw-w-[340px] sppcfw-bg-[#1f2937] sppcfw-border-r sppcfw-border-[#374151] sppcfw-flex sppcfw-flex-col sppcfw-ml-[64px] sppcfw-z-30 sppcfw-h-full sppcfw-overflow-hidden sppcfw-shadow-md sppcfw-select-none sppcfw-text-[#d9e3f6]' },

			// Header Title "Post Settings"
			h(
				'div',
				{ className: 'sppcfw-p-3 sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#121c2a] sppcfw-flex sppcfw-justify-between sppcfw-items-center' },
				h('h2', { className: 'sppcfw-text-sm sppcfw-font-extrabold sppcfw-text-white sppcfw-text-center sppcfw-flex-1' }, 'Post Settings'),
				h(
					'button',
					{
						className: 'sppcfw-text-gray-400 hover:sppcfw-text-white sppcfw-text-xs sppcfw-font-bold sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded hover:sppcfw-bg-[#212b39]',
						onClick: closePanel,
						title: 'Close',
					},
					'✕'
				)
			),

			// Top Sub-Tabs Bar: Settings (wrench) | Style (contrast) | Advanced (gear)
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#16202e] sppcfw-text-xs sppcfw-font-semibold' },
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-1 sppcfw-border-b-2 sppcfw-transition-colors ${
							activeTab === 'settings' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-gray-400 hover:sppcfw-text-white'
						}`,
						onClick: () => setActiveTab('settings'),
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'build'),
					'Settings'
				),
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-1 sppcfw-border-b-2 sppcfw-transition-colors ${
							activeTab === 'style' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-gray-400 hover:sppcfw-text-white'
						}`,
						onClick: () => setActiveTab('style'),
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'contrast'),
					'Style'
				),
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-1 sppcfw-border-b-2 sppcfw-transition-colors ${
							activeTab === 'advanced' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-gray-400 hover:sppcfw-text-white'
						}`,
						onClick: () => setActiveTab('advanced'),
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'settings'),
					'Advanced'
				)
			),

			// Scrollable Panel Content
			h(
				'div',
				{ className: 'sppcfw-p-4 sppcfw-overflow-y-auto custom-scrollbar sppcfw-flex-1 sppcfw-space-y-4 sppcfw-text-xs' },

				// TAB 1: Settings
				activeTab === 'settings' &&
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },

						// Accordion: General Settings
						h(
							'div',
							{ className: 'sppcfw-border-b sppcfw-border-[#374151] sppcfw-pb-4' },
							h(
								'div',
								{
									className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-cursor-pointer sppcfw-mb-3 sppcfw-select-none',
									onClick: () => setIsGeneralOpen(!isGeneralOpen),
								},
								h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-gap-2' }, h('span', { className: 'sppcfw-text-[10px]' }, isGeneralOpen ? '▼' : '▶'), 'General Settings')
							),

							isGeneralOpen &&
								h(
									'div',
									{ className: 'sppcfw-space-y-4 sppcfw-pt-1' },

									// Title Field
									h(
										'div',
										{ className: 'sppcfw-space-y-1.5' },
										h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Title'),
										h('input', {
											type: 'text',
											className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-[#9333ea] sppcfw-rounded sppcfw-px-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-placeholder-gray-500 focus:sppcfw-outline-none',
											value: templateTitle,
											onChange: e => setTemplateTitle(e.target.value),
											placeholder: 'Page title...',
										})
									),

									// Status Field
									h(
										'div',
										{ className: 'sppcfw-space-y-1.5' },
										h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Status'),
										h(
											'select',
											{
												className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-[#9333ea] sppcfw-rounded sppcfw-px-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none sppcfw-cursor-pointer',
												value: (pageSettings.status || 'published').toLowerCase(),
												onChange: e => handlePageSettingChange('status', e.target.value.toLowerCase()),
											},
											h('option', { value: 'published' }, 'Published'),
											h('option', { value: 'draft' }, 'Draft'),
											h('option', { value: 'private' }, 'Private'),
											h('option', { value: 'pending review' }, 'Pending Review')
										)
									),

									// Preview Product Data Field
									h(
										'div',
										{ className: 'sppcfw-space-y-1.5' },
										h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Preview Product Data'),
										h(SearchableProductSelect, {
											products,
											selectedProductId,
											onChange: handleProductChange,
										})
									),

									// Page Layout Field
									h(
										'div',
										{ className: 'sppcfw-space-y-1.5 sppcfw-pt-1' },
										h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Page Layout'),
										h(
											'select',
											{
												className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-[#9333ea] sppcfw-rounded sppcfw-px-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none sppcfw-cursor-pointer',
												value: pageSettings.pageLayout || 'Default',
												onChange: e => handlePageSettingChange('pageLayout', e.target.value),
											},
											h('option', { value: 'Default' }, 'Default'),
											h('option', { value: 'Canvas' }, 'Canvas'),
											h('option', { value: 'Full Width' }, 'Full Width')
										),
										h('p', { className: 'sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-italic font-sans' }, 'The default page template as defined in Panel → Hamburger Menu → Site Settings.')
									)
								)
						)
					),

				// TAB 2: Style
				activeTab === 'style' &&
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-uppercase sppcfw-tracking-wider sppcfw-mb-2' }, 'Page Background & Style'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Background Color'),
							h('input', {
								type: 'color',
								className: 'sppcfw-w-full sppcfw-h-8 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-cursor-pointer',
								value: pageSettings.bgColor || '#091421',
								onChange: e => handlePageSettingChange('bgColor', e.target.value),
							})
						)
					),

				// TAB 3: Advanced
				activeTab === 'advanced' &&
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-uppercase sppcfw-tracking-wider sppcfw-mb-2' }, 'Custom CSS & Scripts'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-font-semibold sppcfw-text-gray-200 sppcfw-block' }, 'Custom CSS'),
							h('textarea', {
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-p-2 sppcfw-text-xs font-mono sppcfw-text-white sppcfw-h-32 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
								placeholder: '/* Add custom CSS for this page template */',
								value: pageSettings.customCss || '',
								onChange: e => handlePageSettingChange('customCss', e.target.value),
							})
						)
					)
			)
		);
	}

	// 3a. Left Elements Panel Component (Search Box, Layout Section, Widgets)
	function LeftElementsPanel({
		activeSubTab,
		setActiveSubTab,
		searchQuery,
		setSearchQuery,
		products,
		selectedProductId,
		handleProductChange,
		productData,
		addWidgetToTarget,
		addContainerPreset,
		elements,
	}) {
		const [isLayoutOpen, setIsLayoutOpen] = useState(true);

		function handleDragStart(e, widgetType, name, metaKey) {
			e.dataTransfer.setData('application/json', JSON.stringify({ type: widgetType, name: name, metaKey: metaKey || null }));
		}

		// Filter elements based on Search Query
		const query = (searchQuery || '').trim().toLowerCase();

		const filteredCore = CORE_WIDGETS.filter(w => !query || w.name.toLowerCase().includes(query) || w.type.toLowerCase().includes(query));

		const filteredMetaGroups = productData && productData.meta_groups
			? productData.meta_groups.map(group => ({
					...group,
					items: group.items.filter(m => !query || m.label.toLowerCase().includes(query) || m.key.toLowerCase().includes(query)),
			  })).filter(g => g.items.length > 0)
			: [];

		return h(
			'aside',
			{ className: 'sppcfw-w-[340px] sppcfw-bg-[#1f2937] sppcfw-border-r sppcfw-border-[#374151] sppcfw-flex sppcfw-flex-col sppcfw-ml-[64px] sppcfw-z-30 sppcfw-h-full sppcfw-overflow-hidden sppcfw-shadow-md sppcfw-select-none' },

			// Header Title "Elements" + Preview Product Data
			h(
				'div',
				{ className: 'sppcfw-p-3 sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#121c2a] sppcfw-space-y-2' },
				h('div', { className: 'sppcfw-flex sppcfw-justify-between sppcfw-items-center' }, h('h2', { className: 'sppcfw-text-sm sppcfw-font-extrabold sppcfw-text-[#d9e3f6] sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' }, h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-text-[#9333ea]' }, 'widgets'), 'Elements'), h('span', { className: 'sppcfw-text-[10px] sppcfw-text-[#9ca3af] font-mono' }, `${elements.length} items on canvas`)),

				h('label', { className: 'inspector-label sppcfw-text-[10px]' }, 'Preview Product Data'),
				h(SearchableProductSelect, {
					products,
					selectedProductId,
					onChange: handleProductChange,
				})
			),

			// Sub-tabs Bar: Widgets | Components | Globals
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#16202e] sppcfw-text-xs sppcfw-font-semibold' },
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2 sppcfw-text-center sppcfw-border-b-2 sppcfw-transition-colors ${
							activeSubTab === 'widgets' ? 'sppcfw-border-[#9333ea] sppcfw-text-[#ddb8ff] sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
						}`,
						onClick: () => setActiveSubTab('widgets'),
					},
					'Widgets'
				),
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2 sppcfw-text-center sppcfw-border-b-2 sppcfw-transition-colors ${
							activeSubTab === 'components' ? 'sppcfw-border-[#9333ea] sppcfw-text-[#ddb8ff] sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
						}`,
						onClick: () => setActiveSubTab('components'),
					},
					'Components'
				),
				h(
					'button',
					{
						className: `sppcfw-flex-1 sppcfw-py-2 sppcfw-text-center sppcfw-border-b-2 sppcfw-transition-colors ${
							activeSubTab === 'globals' ? 'sppcfw-border-[#9333ea] sppcfw-text-[#ddb8ff] sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
						}`,
						onClick: () => setActiveSubTab('globals'),
					},
					'Globals'
				)
			),

			// Search Widget Input
			h(
				'div',
				{ className: 'sppcfw-p-3 sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#111827]' },
				h(
					'div',
					{ className: 'sppcfw-relative sppcfw-flex sppcfw-items-center' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-absolute sppcfw-right-2.5 sppcfw-text-[#9ca3af]' }, 'search'),
					h('input', {
						type: 'text',
						className: 'sppcfw-w-full sppcfw-bg-[#091421] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-[#9333ea] sppcfw-rounded sppcfw-pl-8 sppcfw-pr-7 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-[#d9e3f6] sppcfw-placeholder-[#6b7280] focus:sppcfw-outline-none',
						placeholder: 'Search Widget...',
						value: searchQuery,
						onChange: e => setSearchQuery(e.target.value),
					}),
					searchQuery &&
						h(
							'button',
							{
								className: 'sppcfw-absolute sppcfw-right-2 sppcfw-text-[#9ca3af] hover:sppcfw-text-white sppcfw-text-xs sppcfw-font-bold',
								onClick: () => setSearchQuery(''),
							},
							'✕'
						)
				)
			),

			// Scrollable Elements List
			h(
				'div',
				{ className: 'sppcfw-p-3 sppcfw-overflow-y-auto custom-scrollbar sppcfw-flex-1 sppcfw-space-y-4' },

				// Image 1: Layout Section (Container & Grid Cards)
				h(
					'div',
					{ className: 'sppcfw-border-b sppcfw-border-[#374151] sppcfw-pb-4' },
					h(
						'div',
						{
							className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-cursor-pointer sppcfw-mb-2 sppcfw-select-none',
							onClick: () => setIsLayoutOpen(!isLayoutOpen),
						},
						h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#d9e3f6] sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' }, h('span', { className: 'sppcfw-text-[10px]' }, isLayoutOpen ? '▼' : '▶'), 'Layout')
					),

					isLayoutOpen &&
						h(
							'div',
							{ className: 'sppcfw-grid sppcfw-grid-cols-2 sppcfw-gap-2.5 sppcfw-mt-2' },

							// 1. Container Card
							h(
								'div',
								{
									draggable: true,
									onDragStart: e => handleDragStart(e, 'flex_col', 'Container'),
									onClick: () => addContainerPreset('flex_col'),
									className: 'sppcfw-bg-[#181d24] sppcfw-border sppcfw-border-[#2d3748] hover:sppcfw-border-[#9333ea] hover:sppcfw-bg-[#202732] sppcfw-rounded-md sppcfw-p-4 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-gap-2 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-tab-group sppcfw-select-none sppcfw-relative sppcfw-shadow-sm',
								},
								h(
									'div',
									{ className: 'sppcfw-w-10 sppcfw-h-7 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#9ca3af] group-hover:sppcfw-border-[#ddb8ff] sppcfw-rounded-sm sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors' },
									h('div', { className: 'sppcfw-w-5 sppcfw-h-3 sppcfw-border sppcfw-border-dashed sppcfw-border-[#6b7280] group-hover:sppcfw-border-[#c084fc] sppcfw-rounded-[1px]' })
								),
								h('span', { className: 'sppcfw-text-xs sppcfw-font-medium sppcfw-text-center sppcfw-text-[#d9e3f6] group-hover:sppcfw-text-white' }, 'Container')
							),

							// 2. Grid Card
							h(
								'div',
								{
									draggable: true,
									onDragStart: e => handleDragStart(e, 'grid_2x2', 'Grid'),
									onClick: () => addContainerPreset('grid_2x2'),
									className: 'sppcfw-bg-[#181d24] sppcfw-border sppcfw-border-[#2d3748] hover:sppcfw-border-[#9333ea] hover:sppcfw-bg-[#202732] sppcfw-rounded-md sppcfw-p-4 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-gap-2 sppcfw-cursor-pointer sppcfw-transition-all sppcfw-tab-group sppcfw-select-none sppcfw-relative sppcfw-shadow-sm',
								},
								h(
									'div',
									{ className: 'sppcfw-w-10 sppcfw-h-7 sppcfw-border sppcfw-border-[#4b5563] group-hover:sppcfw-border-[#ddb8ff] sppcfw-grid sppcfw-grid-cols-2 sppcfw-gap-0.5 sppcfw-p-0.5 sppcfw-rounded-sm sppcfw-transition-colors' },
									h('div', { className: 'sppcfw-bg-[#6b7280] group-hover:sppcfw-bg-[#c084fc] sppcfw-rounded-[1px]' }),
									h('div', { className: 'sppcfw-bg-[#6b7280] group-hover:sppcfw-bg-[#c084fc] sppcfw-rounded-[1px]' }),
									h('div', { className: 'sppcfw-bg-[#6b7280] group-hover:sppcfw-bg-[#c084fc] sppcfw-rounded-[1px]' }),
									h('div', { className: 'sppcfw-bg-[#6b7280] group-hover:sppcfw-bg-[#c084fc] sppcfw-rounded-[1px]' })
								),
								h('span', { className: 'sppcfw-text-xs sppcfw-font-medium sppcfw-text-center sppcfw-text-[#d9e3f6] group-hover:sppcfw-text-white' }, 'Grid')
							)
						)
				),

				// Single Product Widgets Category
				filteredCore.length > 0 &&
					h(
						'div',
						null,
						h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#cfc2d7] sppcfw-uppercase sppcfw-tracking-wider sppcfw-mb-2' }, 'Single Product Widgets'),
						h(
							'div',
							{ className: 'sppcfw-grid sppcfw-grid-cols-2 sppcfw-gap-2 sppcfw-mb-4' },
							filteredCore.map(w =>
								h(
									'div',
									{
										key: w.type,
										draggable: true,
										onDragStart: e => handleDragStart(e, w.type, w.name),
										onClick: () => addWidgetToTarget(w.type, w.name),
										className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-p-2.5 sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-gap-1.5 sppcfw-cursor-grab active:sppcfw-cursor-grabbing hover:sppcfw-border-[#9333ea] hover:sppcfw-bg-[#16202e] sppcfw-transition-colors sppcfw-tab-group sppcfw-select-none',
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-[#ddb8ff] group-hover:sppcfw-scale-110 sppcfw-transition-transform sppcfw-text-lg' }, w.icon),
									h('span', { className: 'sppcfw-text-[11px] sppcfw-font-semibold sppcfw-text-center' }, w.name)
								)
							)
						)
					),

				// Categorized Product Metadata Widgets
				filteredMetaGroups.length > 0 &&
					filteredMetaGroups.map((group, gIdx) =>
						h(
							'div',
							{ key: 'group-' + gIdx, className: 'sppcfw-mb-4 sppcfw-border-t sppcfw-border-[#374151] sppcfw-pt-3' },
							h('h3', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#ddb8ff] sppcfw-uppercase sppcfw-tracking-wider sppcfw-mb-2 sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' }, h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#92ccff]' }, 'dataset'), group.title),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-flex-col sppcfw-gap-1.5' },
								group.items.map(m =>
									h(
										'div',
										{
											key: m.key,
											draggable: true,
											onDragStart: e => handleDragStart(e, 'product_meta_item', m.label, m.key),
											onClick: () => addWidgetToTarget('product_meta_item', m.label, m.key),
											className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-p-2.5 sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-cursor-grab active:sppcfw-cursor-grabbing hover:sppcfw-border-[#9333ea] sppcfw-transition-colors sppcfw-tab-group',
										},
										h(
											'div',
											{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-overflow-hidden' },
											h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-[#92ccff]' }, 'data_object'),
											h('div', { className: 'sppcfw-overflow-hidden' }, h('div', { className: 'sppcfw-text-xs sppcfw-font-medium sppcfw-truncate' }, m.label), h('div', { className: 'sppcfw-text-[10px] sppcfw-text-[#9ca3af] sppcfw-truncate font-mono' }, typeof m.value === 'object' ? JSON.stringify(m.value) : String(m.value || '')))
										),
										h('span', { className: 'sppcfw-text-[9px] sppcfw-bg-[#212b39] sppcfw-text-[#cfc2d7] sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded font-mono' }, 'Meta')
									)
								)
							)
						)
					)
			)
		);
	}

	// --- Advanced Color Picker Component & Helpers (Matching Image 3) ---
	function parseColorToHsva(colorStr) {
		if (!colorStr || colorStr === 'transparent') return { h: 215, s: 0, v: 100, a: 1 };
		let str = String(colorStr).trim();
		if (str.startsWith('#')) {
			let hex = str.slice(1);
			if (hex.length === 3) hex = hex.split('').map(c => c + c).join('') + 'ff';
			else if (hex.length === 6) hex += 'ff';
			else if (hex.length === 4) hex = hex.split('').map(c => c + c).join('');
			const num = parseInt(hex, 16);
			if (isNaN(num)) return { h: 215, s: 0, v: 100, a: 1 };
			const r = (num >> 24) & 255;
			const g = (num >> 16) & 255;
			const b = (num >> 8) & 255;
			const a = parseFloat(((num & 255) / 255).toFixed(2));
			return rgbToHsva(r, g, b, a);
		}
		if (str.startsWith('rgb')) {
			const parts = str.match(/[\d.]+/g);
			if (parts && parts.length >= 3) {
				const r = parseInt(parts[0], 10);
				const g = parseInt(parts[1], 10);
				const b = parseInt(parts[2], 10);
				const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
				return rgbToHsva(r, g, b, a);
			}
		}
		if (str.startsWith('hsl')) {
			const parts = str.match(/[\d.]+/g);
			if (parts && parts.length >= 3) {
				const h = parseFloat(parts[0]);
				const s = parseFloat(parts[1]) / 100;
				const l = parseFloat(parts[2]) / 100;
				const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
				const v = l + s * Math.min(l, 1 - l);
				const sv = v === 0 ? 0 : 2 * (1 - l / v);
				return { h: Math.round(h % 360), s: Math.round(Math.max(0, Math.min(100, sv * 100))), v: Math.round(Math.max(0, Math.min(100, v * 100))), a: parseFloat(a.toFixed(2)) };
			}
		}
		return { h: 215, s: 80, v: 90, a: 1 };
	}

	function rgbToHsva(r, g, b, a = 1) {
		r /= 255; g /= 255; b /= 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h = 0, s = 0, v = max;
		const d = max - min;
		s = max === 0 ? 0 : d / max;
		if (max !== min) {
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100), a: parseFloat(a.toFixed(2)) };
	}

	function hsvaToRgba(h, s, v, a = 1) {
		h = (h % 360) / 360; s = Math.max(0, Math.min(100, s)) / 100; v = Math.max(0, Math.min(100, v)) / 100;
		let r, g, b;
		const i = Math.floor(h * 6);
		const f = h * 6 - i;
		const p = v * (1 - s);
		const q = v * (1 - f * s);
		const t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
			default: r = v; g = v; b = v;
		}
		return {
			r: Math.round(r * 255),
			g: Math.round(g * 255),
			b: Math.round(b * 255),
			a: parseFloat(Number(a).toFixed(2))
		};
	}

	function formatColorOutput(hsva, format = 'HEXA') {
		const rgba = hsvaToRgba(hsva.h, hsva.s, hsva.v, hsva.a);
		if (format === 'RGBA') {
			return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
		}
		if (format === 'HSLA') {
			const l = (hsva.v / 100) * (1 - (hsva.s / 100) / 2);
			const sl = l === 0 || l === 1 ? 0 : ((hsva.v / 100) - l) / Math.min(l, 1 - l);
			return `hsla(${Math.round(hsva.h)}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%, ${rgba.a})`;
		}
		const toHex = n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
		if (rgba.a < 1) {
			const alphaHex = Math.round(rgba.a * 255).toString(16).padStart(2, '0').toUpperCase();
			return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}${alphaHex}`;
		}
		return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
	}

	function ColorPickerControl({ label, value, onChange, defaultVal = 'transparent' }) {
		const [isOpen, setIsOpen] = useState(false);
		const [format, setFormat] = useState('HEXA'); // 'HEXA' | 'RGBA' | 'HSLA'
		const [showPalette, setShowPalette] = useState(false);
		const [customPresets, setCustomPresets] = useState(['#9333EA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#111827', '#FFFFFF', '#000000']);
		const popoverRef = useRef(null);
		const swatchRef = useRef(null);

		const hsva = parseColorToHsva(value || defaultVal);
		const hsvaRef = useRef(hsva);
		useEffect(() => {
			hsvaRef.current = hsva;
		}, [value, defaultVal]);

		useEffect(() => {
			function handleClickOutside(e) {
				if (isOpen && popoverRef.current && !popoverRef.current.contains(e.target) && swatchRef.current && !swatchRef.current.contains(e.target)) {
					setIsOpen(false);
				}
			}
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}, [isOpen]);

		function updateHsva(newHsva) {
			const base = hsvaRef.current || hsva;
			const next = { ...base, ...newHsva };
			hsvaRef.current = next;
			const formatted = formatColorOutput(next, format);
			if (typeof onChange === 'function') {
				onChange(formatted);
			}
		}

		function handleSatValMouseDown(e) {
			e.preventDefault();
			const target = e.currentTarget;
			function handleMove(moveEvt) {
				const rect = target.getBoundingClientRect();
				const x = Math.max(0, Math.min(rect.width, moveEvt.clientX - rect.left));
				const y = Math.max(0, Math.min(rect.height, moveEvt.clientY - rect.top));
				const s = Math.round((x / rect.width) * 100);
				const v = Math.round((1 - y / rect.height) * 100);
				updateHsva({ s, v });
			}
			handleMove(e);
			function handleUp() {
				window.removeEventListener('mousemove', handleMove);
				window.removeEventListener('mouseup', handleUp);
			}
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleUp);
		}

		function handleHueMouseDown(e) {
			e.preventDefault();
			const target = e.currentTarget;
			function handleMove(moveEvt) {
				const rect = target.getBoundingClientRect();
				const x = Math.max(0, Math.min(rect.width, moveEvt.clientX - rect.left));
				const h = Math.round((x / rect.width) * 360);
				const curr = hsvaRef.current || hsva;
				const updates = { h };
				// If color is currently pure black or very dark, boost saturation & value so hue shows vibrant color immediately
				if (curr.v < 30) updates.v = 90;
				if (curr.s < 20) updates.s = 85;
				updateHsva(updates);
			}
			handleMove(e);
			function handleUp() {
				window.removeEventListener('mousemove', handleMove);
				window.removeEventListener('mouseup', handleUp);
			}
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleUp);
		}

		function handleAlphaMouseDown(e) {
			e.preventDefault();
			const target = e.currentTarget;
			function handleMove(moveEvt) {
				const rect = target.getBoundingClientRect();
				const x = Math.max(0, Math.min(rect.width, moveEvt.clientX - rect.left));
				const a = parseFloat((x / rect.width).toFixed(2));
				updateHsva({ a });
			}
			handleMove(e);
			function handleUp() {
				window.removeEventListener('mousemove', handleMove);
				window.removeEventListener('mouseup', handleUp);
			}
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleUp);
		}

		async function handleEyeDropper() {
			if (window.EyeDropper) {
				try {
					const eyeDropper = new window.EyeDropper();
					const result = await eyeDropper.open();
					if (result && result.sRGBHex && typeof onChange === 'function') {
						onChange(result.sRGBHex);
					}
				} catch (err) {}
			}
		}

		function cycleFormat() {
			setFormat(prev => (prev === 'HEXA' ? 'RGBA' : prev === 'RGBA' ? 'HSLA' : 'HEXA'));
		}

		const currentColorText = formatColorOutput(hsva, format);
		const pureColorRgb = hsvaToRgba(hsva.h, hsva.s, hsva.v, 1);

		return h(
			'div',
			{ className: 'sppcfw-relative sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
			label && h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, label),
			h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
				// Global Preset Globe Icon Button
				h(
					'button',
					{
						type: 'button',
						className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-border-[#9333ea] sppcfw-transition-colors sppcfw-cursor-pointer',
						title: 'Global Colors',
						onClick: () => {
							setShowPalette(!showPalette);
							setIsOpen(true);
						}
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'public')
				),
				// Swatch Box Button (Checkerboard background + color fill)
				h(
					'div',
					{
						ref: swatchRef,
						className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-rounded sppcfw-border sppcfw-border-[#374151] hover:sppcfw-border-[#9333ea] sppcfw-cursor-pointer sppcfw-overflow-hidden sppcfw-relative sppcfw-checkerboard sppcfw-shadow-sm',
						title: value || defaultVal,
						onClick: () => setIsOpen(!isOpen)
					},
					h('div', {
						className: 'sppcfw-w-full sppcfw-h-full',
						style: { backgroundColor: value || defaultVal }
					})
				)
			),

			// Floating Popover matching Image 3
			isOpen &&
				h(
					'div',
					{
						ref: popoverRef,
						className: 'sppcfw-color-picker-popover sppcfw-absolute sppcfw-right-0 sppcfw-top-9 sppcfw-z-50 sppcfw-shadow-2xl'
					},
					// Header Bar
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-mb-2.5 sppcfw-pb-1.5 sppcfw-border-b sppcfw-border-gray-200' },
						h('span', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-gray-800' }, 'Color Picker'),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-gray-500' },
							h(
								'button',
								{
									type: 'button',
									className: 'hover:sppcfw-text-gray-900 sppcfw-cursor-pointer sppcfw-p-0.5',
									title: 'Reset color',
									onClick: () => {
										if (typeof onChange === 'function') {
											onChange(defaultVal === 'transparent' ? '' : defaultVal);
										}
									}
								},
								h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'restart_alt')
							),
							h(
								'button',
								{
									type: 'button',
									className: 'hover:sppcfw-text-gray-900 sppcfw-cursor-pointer sppcfw-p-0.5',
									title: 'Add to custom presets',
									onClick: () => {
										if (!customPresets.includes(currentColorText)) {
											setCustomPresets([...customPresets, currentColorText]);
										}
									}
								},
								h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'add')
							),
							h(
								'button',
								{
									type: 'button',
									className: `hover:sppcfw-text-gray-900 sppcfw-cursor-pointer sppcfw-p-0.5 ${showPalette ? 'sppcfw-text-[#9333ea]' : ''}`,
									title: 'Saved colors',
									onClick: () => setShowPalette(!showPalette)
								},
								h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'palette')
							),
							window.EyeDropper &&
								h(
									'button',
									{
										type: 'button',
										className: 'hover:sppcfw-text-gray-900 sppcfw-cursor-pointer sppcfw-p-0.5',
										title: 'Eyedropper tool',
										onClick: handleEyeDropper
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'colorize')
								)
						)
					),

					// 2D Saturation / Value Gradient Canvas Area
					h(
						'div',
						{
							className: 'sppcfw-relative sppcfw-h-28 sppcfw-w-full sppcfw-rounded sppcfw-cursor-crosshair sppcfw-overflow-hidden sppcfw-mb-2.5 sppcfw-border sppcfw-border-gray-300',
							style: {
								background: `linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, hsl(${hsva.h}, 100%, 50%))`
							},
							onMouseDown: handleSatValMouseDown
						},
						h('div', {
							className: 'sppcfw-absolute sppcfw-w-3.5 sppcfw-h-3.5 sppcfw-border-2 sppcfw-border-white sppcfw-rounded-full sppcfw-shadow-md sppcfw-pointer-events-none',
							style: {
								left: `${hsva.s}%`,
								top: `${100 - hsva.v}%`,
								transform: 'translate(-50%, -50%)',
								backgroundColor: `rgb(${pureColorRgb.r}, ${pureColorRgb.g}, ${pureColorRgb.b})`
							}
						})
					),

					// Hue Rainbow Slider
					h(
						'div',
						{
							className: 'sppcfw-hue-slider sppcfw-mb-2.5',
							onMouseDown: handleHueMouseDown
						},
						h('div', {
							className: 'sppcfw-absolute sppcfw-w-3.5 sppcfw-h-3.5 sppcfw-bg-white sppcfw-border sppcfw-border-gray-400 sppcfw-rounded-full sppcfw-shadow sppcfw-pointer-events-none',
							style: {
								left: `${(hsva.h / 360) * 100}%`,
								top: '50%',
								transform: 'translate(-50%, -50%)'
							}
						})
					),

					// Alpha Opacity Slider
					h(
						'div',
						{
							className: 'sppcfw-alpha-slider sppcfw-checkerboard sppcfw-mb-3 sppcfw-border sppcfw-border-gray-200',
							onMouseDown: handleAlphaMouseDown
						},
						h('div', {
							className: 'sppcfw-w-full sppcfw-h-full sppcfw-rounded-full',
							style: {
								background: `linear-gradient(to right, transparent, rgb(${pureColorRgb.r}, ${pureColorRgb.g}, ${pureColorRgb.b}))`
							}
						}),
						h('div', {
							className: 'sppcfw-absolute sppcfw-w-3.5 sppcfw-h-3.5 sppcfw-bg-white sppcfw-border sppcfw-border-gray-400 sppcfw-rounded-full sppcfw-shadow sppcfw-pointer-events-none',
							style: {
								left: `${hsva.a * 100}%`,
								top: '50%',
								transform: 'translate(-50%, -50%)'
							}
						})
					),

					// Bottom Value Input & Format Switcher
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
						h('input', {
							type: 'text',
							className: 'sppcfw-flex-1 sppcfw-bg-gray-50 sppcfw-border sppcfw-border-gray-300 sppcfw-rounded sppcfw-px-2 sppcfw-py-1 sppcfw-text-[11px] font-mono sppcfw-text-gray-900 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: currentColorText,
							onChange: e => {
								const str = e.target.value;
								if (str && typeof onChange === 'function') onChange(str);
							}
						}),
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-px-1.5 sppcfw-py-1 sppcfw-bg-gray-100 hover:sppcfw-bg-gray-200 sppcfw-border sppcfw-border-gray-300 sppcfw-rounded sppcfw-text-[10px] sppcfw-font-bold sppcfw-text-gray-700 sppcfw-cursor-pointer sppcfw-transition-colors',
								onClick: cycleFormat,
								title: 'Toggle Format (HEXA / RGBA / HSLA)'
							},
							format
						)
					),

					// Palette Presets View (when active)
					showPalette &&
						h(
							'div',
							{ className: 'sppcfw-mt-2.5 sppcfw-pt-2.5 sppcfw-border-t sppcfw-border-gray-200' },
							h('span', { className: 'sppcfw-text-[10px] sppcfw-font-bold sppcfw-text-gray-600 sppcfw-block sppcfw-mb-1.5' }, 'Palette Presets'),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-flex-wrap sppcfw-gap-1.5' },
								customPresets.map(preset =>
									h('button', {
										key: preset,
										type: 'button',
										className: 'sppcfw-w-5 sppcfw-h-5 sppcfw-rounded sppcfw-border sppcfw-border-gray-300 hover:sppcfw-scale-110 sppcfw-transition-transform sppcfw-cursor-pointer',
										style: { backgroundColor: preset },
										onClick: () => {
											if (typeof onChange === 'function') onChange(preset);
										}
									})
								)
							)
						)
				)
		);
	}

	// 3b. Left Inspector & Modular Individual Edit Panels System
	function LeftInspector({ deviceView = 'desktop', selectedElement, updateElementProperties, closeInspector, categories, products, sampleData, addColumnToContainer, duplicateColumn, removeElement, enablePlusMinus, setEnablePlusMinus, addToCartBtnText, setAddToCartBtnText, hidePrice, setHidePrice, handleToggleHidePrice }) {
		const [activeTab, setActiveTab] = useState('layout'); // 'layout'/'content' | 'style' | 'advanced'
		const [openAccordions, setOpenAccordions] = useState({
			general: true,
			items: true,
			cart_general: true,
			variation_settings: true,
			variation_style: true,
			html_editor: true,
			css_editor: true,
			js_editor: true,
			typography: true,
			colors: true,
			image: true,
			button: true,
			button_colors: true,
			button_typography: true,
			button_quantity: true,
			button_spacing: true,
			rating: true,
			rating_stars: true,
			rating_text: true,
			rating_layout: true,
			border: false,
			background: true,
			shadow: false,
			spacing: true,
			position: true,
			responsive: false,
		});
		const [widthUnit, setWidthUnit] = useState('px');
		const [fontSizeUnit, setFontSizeUnit] = useState('px');
		const [heightUnit, setHeightUnit] = useState('px');
		const [imgWidthUnit, setImgWidthUnit] = useState('%');
		const [maxImgWidthUnit, setMaxImgWidthUnit] = useState('%');
		const [imgHeightUnit, setImgHeightUnit] = useState('px');
		const [radiusUnit, setRadiusUnit] = useState('px');
		const [marginUnit, setMarginUnit] = useState('px');
		const [paddingUnit, setPaddingUnit] = useState('px');
		const [gapsUnit, setGapsUnit] = useState('px');
		const [isGapsLinked, setIsGapsLinked] = useState(true);
		const [isRadiusLinked, setIsRadiusLinked] = useState(true);
		const [isMarginLinked, setIsMarginLinked] = useState(true);
		const [isPaddingLinked, setIsPaddingLinked] = useState(true);
		const [bgTab, setBgTab] = useState('normal'); // 'normal' | 'hover'
		const [codeTab, setCodeTab] = useState('html'); // 'html' | 'css' | 'js'
		const [copiedTab, setCopiedTab] = useState(null);

		function toggleAccordion(key) {
			setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
		}

		function getSetting(key, isFixed = false) {
			const isCodeField = key === 'html_content' || key === 'custom_css' || key === 'custom_js' || key === 'code';
			if (isFixed || isCodeField) {
				return selectedElement.settings ? selectedElement.settings[key] : undefined;
			}
			return getResponsiveProp(selectedElement.settings, key, deviceView);
		}

		function getStyle(key) {
			return getResponsiveProp(selectedElement.styles, key, deviceView);
		}

		function getAdvanced(key, isFixed = false) {
			if (isFixed) {
				return selectedElement.advanced ? selectedElement.advanced[key] : undefined;
			}
			const advVal = getResponsiveProp(selectedElement.advanced, key, deviceView);
			if (advVal !== undefined && advVal !== null && advVal !== '') {
				return advVal;
			}
			return getResponsiveProp(selectedElement.styles, key, deviceView);
		}

		function handleSettingChange(key, value, isFixed = false) {
			const isCodeField = key === 'html_content' || key === 'custom_css' || key === 'custom_js' || key === 'code';
			const targetKey = (isFixed || isCodeField) ? key : getDeviceKey(key, deviceView);
			const updated = {
				...selectedElement,
				settings: { ...selectedElement.settings, [targetKey]: value },
			};
			updateElementProperties(updated);
		}

		function handleStyleChange(key, value) {
			const targetKey = getDeviceKey(key, deviceView);
			const updated = {
				...selectedElement,
				styles: { ...selectedElement.styles, [targetKey]: value },
			};
			updateElementProperties(updated);
		}

		function handleMultiStyleChange(keyValues) {
			const targetKeyValues = {};
			Object.keys(keyValues).forEach(k => {
				const tk = getDeviceKey(k, deviceView);
				targetKeyValues[tk] = keyValues[k];
			});
			const updated = {
				...selectedElement,
				styles: { ...selectedElement.styles, ...targetKeyValues },
			};
			updateElementProperties(updated);
		}

		function handleAdvancedChange(key, value, isFixed = false) {
			const targetKey = isFixed ? key : getDeviceKey(key, deviceView);
			const updatedStyles = { ...selectedElement.styles };
			if (key.indexOf('margin_') === 0 || key.indexOf('padding_') === 0) {
				updatedStyles[targetKey] = value;
			}
			const updated = {
				...selectedElement,
				advanced: { ...selectedElement.advanced, [targetKey]: value },
				styles: updatedStyles,
			};
			updateElementProperties(updated);
		}

		function handleMultiAdvancedChange(keyValues) {
			const targetKeyValues = {};
			const targetStyleValues = {};
			Object.keys(keyValues).forEach(k => {
				const tk = getDeviceKey(k, deviceView);
				targetKeyValues[tk] = keyValues[k];
				if (k.indexOf('margin_') === 0 || k.indexOf('padding_') === 0) {
					targetStyleValues[tk] = keyValues[k];
				}
			});
			const updated = {
				...selectedElement,
				advanced: { ...selectedElement.advanced, ...targetKeyValues },
				styles: { ...selectedElement.styles, ...targetStyleValues },
			};
			updateElementProperties(updated);
		}

		const isContainer = selectedElement.type === 'container';
		const isColumn = selectedElement.type === 'column';
		const isProductGallery = selectedElement.type === 'product_gallery';
		const isCustomImage = selectedElement.type === 'image';
		const isHeading = selectedElement.type === 'heading';
		const isTextEditor = selectedElement.type === 'text_editor';
		const isHtmlCode = selectedElement.type === 'html_code' || selectedElement.type === 'custom_html' || selectedElement.type === 'html';
		const isImage = isProductGallery || isCustomImage;

		const typeLabels = {
			container: 'Edit Container',
			column: 'Edit Column',
			image: 'Edit Image',
			product_gallery: 'Edit Product Gallery',
			html_code: 'Edit HTML Element',
			custom_html: 'Edit HTML Element',
			heading: 'Edit Heading',
			text_editor: 'Edit Text Editor',
			product_title: 'Edit Product Title',
			product_price: 'Edit Product Price',
			product_add_to_cart: 'Edit Add to Cart',
			product_rating: 'Edit Rating Stars',
			product_short_desc: 'Edit Short Description',
			product_description: 'Edit Product Description',
			product_meta: 'Edit Product Meta',
			product_meta_item: 'Edit Meta Field',
			variation_swatches: 'Edit Variation Swatches',
			custom_message: 'Edit Custom Message',
			plus_minus_buttons: 'Edit Stepper Buttons',
			related_products: 'Edit Related Products',
			upsell_products: 'Edit Upsell Products',
		};
		const panelTitle = typeLabels[selectedElement.type] || (selectedElement.label ? 'Edit ' + selectedElement.label : 'Edit Element');
		const firstTabLabel = (isContainer || isColumn) ? 'Layout' : 'Content';
		const firstTabIcon = (isContainer || isColumn)
			? 'view_column'
			: isProductGallery
			? 'collections'
			: isCustomImage
			? 'image'
			: isHeading
			? 'format_size'
			: isTextEditor
			? 'edit_note'
			: isHtmlCode
			? 'code'
			: 'widgets';

		function renderControlHeader(label, showDeviceIcon = true, unitValue = null, onUnitChange = null, units = null) {
			return h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-text-xs sppcfw-text-[#e5e7eb] sppcfw-font-medium sppcfw-mb-1.5' },
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
					label,
					showDeviceIcon && h('span', { className: 'material-symbols-outlined sppcfw-text-[13px] sppcfw-text-gray-400', title: deviceView }, 'desktop_windows')
				),
				units && onUnitChange && h(
					'div',
					{ className: 'sppcfw-relative sppcfw-inline-flex sppcfw-items-center' },
					h(
						'select',
						{
							className: 'sppcfw-select-measurement sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-text-[10px] sppcfw-text-gray-300 sppcfw-rounded sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-pr-4 sppcfw-appearance-none focus:sppcfw-outline-none sppcfw-cursor-pointer',
							value: unitValue || units[0],
							onChange: e => onUnitChange(e.target.value),
						},
						units.map(u => h('option', { key: u, value: u }, u))
					)
				)
			);
		}

		function renderSliderInput(valStr, onChange, min = 0, max = 100, step = 1, unit = 'px', placeholder = '') {
			const rawNum = valStr !== '' && valStr !== undefined ? parseFloat(valStr) : '';
			const numVal = typeof rawNum === 'number' && !isNaN(rawNum) ? rawNum : '';
			return h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5' },
				h('input', {
					type: 'range',
					min: min,
					max: max,
					step: step,
					className: 'sppcfw-flex-1 sppcfw-accent-white sppcfw-bg-[#374151] sppcfw-h-1.5 sppcfw-rounded-full sppcfw-cursor-pointer',
					value: numVal !== '' ? numVal : min,
					onChange: e => onChange(e.target.value ? e.target.value + unit : ''),
				}),
				h('input', {
					type: 'number',
					min: min,
					max: max,
					step: step,
					placeholder: placeholder,
					className: 'sppcfw-w-16 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2 sppcfw-py-1 sppcfw-text-xs sppcfw-text-center sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
					value: numVal !== '' ? numVal : '',
					onChange: e => onChange(e.target.value !== '' ? e.target.value + unit : ''),
				})
			);
		}

		function renderFourBoxInput(getValueFn, prefix, onChangeFour, unit = 'px', isLinked, setIsLinked) {
			const sides = ['top', 'right', 'bottom', 'left'];

			function handleSingleChange(side, rawVal) {
				const val = rawVal !== '' ? rawVal + unit : '';
				if (isLinked) {
					onChangeFour({
						[prefix]: val,
						[`${prefix}_top`]: val,
						[`${prefix}_right`]: val,
						[`${prefix}_bottom`]: val,
						[`${prefix}_left`]: val,
					});
				} else {
					onChangeFour({
						[prefix]: '',
						[`${prefix}_${side}`]: val
					});
				}
			}

			return h(
				'div',
				{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
				h(
					'ul',
					{ className: 'sppcfw-grid sppcfw-grid-cols-5 sppcfw-flex-1' },
					sides.map(side => {
						const specificVal = getValueFn(`${prefix}_${side}`);
						const fallbackVal = getValueFn(prefix);
						const sideVal = (specificVal !== undefined && specificVal !== '') ? specificVal : (fallbackVal !== undefined && fallbackVal !== '' ? fallbackVal : '');
						const num = sideVal !== '' && sideVal !== undefined ? parseFloat(sideVal) : '';
						return h(
							'li',
							{ key: side, className: 'sppcfw-flex sppcfw-flex-col sppcfw-items-center' },
							h('input', {
								type: 'number',
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-1.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-center sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
								value: typeof num === 'number' && !isNaN(num) ? num : '',
								onChange: e => handleSingleChange(side, e.target.value),
							}),
							h('span', { className: 'sppcfw-text-[9px] sppcfw-text-gray-400 sppcfw-capitalize sppcfw-mt-0.5' }, side)
						);
					}),
					h(
						'button',
						{
							type: 'button',
							className: `sppcfw-h-10 sppcfw-p-2 sppcfw-rounded sppcfw-border sppcfw-transition-colors sppcfw-cursor-pointer ${
								isLinked ? 'sppcfw-bg-[#9333ea]/30 sppcfw-border-[#9333ea] sppcfw-text-purple-200' : 'sppcfw-bg-[#111827] sppcfw-border-[#374151] sppcfw-text-gray-400 hover:sppcfw-text-white'
							}`,
							onClick: () => setIsLinked(!isLinked),
							title: isLinked ? 'Unlink values' : 'Link values',
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, isLinked ? 'link' : 'link_off')
					)
				)
			);
		}

		function renderButtonGroup(options, currentVal, onChange) {
			return h(
				'div',
				{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
				options.map(opt => {
					const isActive = currentVal === opt.value;
					return h(
						'button',
						{
							key: opt.value,
							type: 'button',
							className: `sppcfw-flex-1 sppcfw-py-1.5 sppcfw-px-2 sppcfw-text-xs sppcfw-font-semibold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1 sppcfw-transition-colors sppcfw-cursor-pointer ${
								isActive ? 'sppcfw-bg-[#374151] sppcfw-text-white sppcfw-font-bold' : 'sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'
							}`,
							onClick: () => onChange(opt.value),
							title: opt.title || opt.label,
						},
						opt.icon ? (typeof opt.icon === 'string' ? h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, opt.icon) : opt.icon) : opt.label
					);
				})
			);
		}

		function renderColorPicker(label, value, onChange, defaultVal = 'transparent') {
			return h(ColorPickerControl, { label, value, onChange, defaultVal });
		}

		function renderAccordion(key, title, content, icon = null, badge = null) {
			const isOpen = openAccordions[key] !== undefined ? !!openAccordions[key] : true;
			return h(
				'div',
				{ key: key, className: 'sppcfw-border-b sppcfw-border-[#374151] sppcfw-pb-4 sppcfw-space-y-3.5' },
				h(
					'div',
					{
						className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-cursor-pointer sppcfw-select-none sppcfw-pb-1',
						onClick: () => toggleAccordion(key),
					},
					h(
						'h4',
						{ className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
						h('span', { className: 'sppcfw-text-[10px] sppcfw-text-gray-300' }, isOpen ? '▼' : '▶'),
						icon && h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-gray-400' }, icon),
						title
					),
					badge && h('span', { className: 'sppcfw-text-[10px] sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded sppcfw-bg-[#212b39] sppcfw-text-[#92ccff]' }, badge)
				),
				isOpen && h('div', { className: 'sppcfw-space-y-4 sppcfw-pt-1' }, content)
			);
		}

		// ==========================================
		// 1. INDIVIDUAL CONTENT PANELS
		// ==========================================

		// 1a. Container Content Panel
		function renderContainerContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'general',
					'Container Layout',
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Container Layout'),
							h(
								'div',
								{ className: 'sppcfw-relative sppcfw-w-44' },
								h(
									'select',
									{
										className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-pr-6 sppcfw-text-xs sppcfw-text-white sppcfw-appearance-none focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-cursor-pointer',
										value: getSetting('flex_direction') === 'grid' ? 'Grid' : 'Flexbox',
										onChange: e => handleSettingChange('flex_direction', e.target.value === 'Grid' ? 'grid' : 'row'),
									},
									h('option', { value: 'Flexbox' }, 'Flexbox'),
									h('option', { value: 'Grid' }, 'Grid')
								)
							)
						),
						h('hr', { className: 'sppcfw-border-[#374151]/60' }),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Content Width'),
							h(
								'div',
								{ className: 'sppcfw-relative sppcfw-w-44' },
								h(
									'select',
									{
										className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-pr-6 sppcfw-text-xs sppcfw-text-white sppcfw-appearance-none focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-cursor-pointer',
										value: getSetting('width_mode') === 'full' ? 'Full Width' : 'Boxed',
										onChange: e => handleSettingChange('width_mode', e.target.value === 'Full Width' ? 'full' : 'boxed'),
									},
									h('option', { value: 'Boxed' }, 'Boxed'),
									h('option', { value: 'Full Width' }, 'Full Width')
								)
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Width', true, widthUnit, setWidthUnit, ['px', '%', 'vw']),
							renderSliderInput(getSetting('boxed_width') || '1140px', v => handleSettingChange('boxed_width', v), 100, 2000, 1, widthUnit, '1140')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Min Height', true, heightUnit, setHeightUnit, ['px', 'vh', 'em']),
						renderSliderInput(getSetting('min_height') || '', v => handleSettingChange('min_height', v), 0, 1000, 1, heightUnit, ''),
						h('p', { className: 'sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-italic sppcfw-pt-0.5' }, 'To achieve full height Container use 100vh.')
						)
					)
				),
				renderAccordion(
					'items',
					'Container Items',
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-text-[#e5e7eb] sppcfw-font-medium' }, 'Direction', h('span', { className: 'material-symbols-outlined sppcfw-text-[13px] sppcfw-text-gray-400', title: deviceView }, 'desktop_windows')),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
								[
									{ val: 'row', title: 'Row - Horizontal', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M3 8h10M9 4l4 4-4 4' })) },
									{ val: 'column', title: 'Column - Vertical', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M8 3v10M4 9l4 4 4-4' })) },
									{ val: 'row-reverse', title: 'Row Reverse', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M13 8H3M7 4L3 8l4 4' })) },
									{ val: 'column-reverse', title: 'Column Reverse', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M8 13V3M4 7l4-4 4 4' })) },
								].map(dirOpt => {
									const isAct = (getSetting('flex_direction') || 'row') === dirOpt.val;
									return h('button', { key: dirOpt.val, type: 'button', className: `sppcfw-p-2 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${isAct ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'}`, onClick: () => handleSettingChange('flex_direction', dirOpt.val), title: dirOpt.title }, dirOpt.icon);
								})
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-text-[#e5e7eb] sppcfw-font-medium' }, 'Justify Content', h('span', { className: 'material-symbols-outlined sppcfw-text-[13px] sppcfw-text-gray-400', title: deviceView }, 'desktop_windows')),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
								[
									{ val: 'flex-start', title: 'Start', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 1.5, width: 1.5, height: 13, rx: 0.5 }), h('rect', { x: 4.5, y: 4, width: 3, height: 8, rx: 0.5 }), h('rect', { x: 9, y: 4, width: 3, height: 8, rx: 0.5 })) },
									{ val: 'center', title: 'Center', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 4, y: 4, width: 3.5, height: 8, rx: 0.5 }), h('rect', { x: 8.5, y: 4, width: 3.5, height: 8, rx: 0.5 })) },
									{ val: 'flex-end', title: 'End', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 13, y: 1.5, width: 1.5, height: 13, rx: 0.5 }), h('rect', { x: 4, y: 4, width: 3, height: 8, rx: 0.5 }), h('rect', { x: 8.5, y: 4, width: 3, height: 8, rx: 0.5 })) },
									{ val: 'space-between', title: 'Space Between', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 1.5, width: 1.5, height: 13, rx: 0.5 }), h('rect', { x: 13, y: 1.5, width: 1.5, height: 13, rx: 0.5 }), h('rect', { x: 4.5, y: 4, width: 2.5, height: 8, rx: 0.5 }), h('rect', { x: 9, y: 4, width: 2.5, height: 8, rx: 0.5 })) },
									{ val: 'space-around', title: 'Space Around', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 2.5, y: 4, width: 3, height: 8, rx: 0.5 }), h('rect', { x: 7, y: 2, width: 1.5, height: 12, rx: 0.5, opacity: 0.35 }), h('rect', { x: 10.5, y: 4, width: 3, height: 8, rx: 0.5 })) },
									{ val: 'space-evenly', title: 'Space Evenly', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 2, y: 4, width: 2.5, height: 8, rx: 0.5 }), h('rect', { x: 6.75, y: 4, width: 2.5, height: 8, rx: 0.5 }), h('rect', { x: 11.5, y: 4, width: 2.5, height: 8, rx: 0.5 })) },
								].map(jcOpt => {
									const isAct = (getSetting('justify_content') || 'flex-start') === jcOpt.val;
									return h('button', { key: jcOpt.val, type: 'button', className: `sppcfw-flex-1 sppcfw-py-2 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${isAct ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'}`, onClick: () => handleSettingChange('justify_content', jcOpt.val), title: jcOpt.title }, jcOpt.icon);
								})
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-text-[#e5e7eb] sppcfw-font-medium' }, 'Align Items', h('span', { className: 'material-symbols-outlined sppcfw-text-[13px] sppcfw-text-gray-400', title: deviceView }, 'desktop_windows')),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
								[
									{ val: 'flex-start', title: 'Start', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 1.5, width: 13, height: 1.5, rx: 0.5 }), h('rect', { x: 6, y: 4.5, width: 4, height: 9, rx: 0.5 })) },
									{ val: 'center', title: 'Center', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 7.25, width: 13, height: 1.5, rx: 0.5 }), h('rect', { x: 6, y: 2.5, width: 4, height: 11, rx: 0.5 })) },
									{ val: 'flex-end', title: 'End', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 13, width: 13, height: 1.5, rx: 0.5 }), h('rect', { x: 6, y: 2.5, width: 4, height: 9, rx: 0.5 })) },
									{ val: 'stretch', title: 'Stretch', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, h('rect', { x: 1.5, y: 1.5, width: 13, height: 1.5, rx: 0.5 }), h('rect', { x: 1.5, y: 13, width: 13, height: 1.5, rx: 0.5 }), h('rect', { x: 6, y: 4, width: 4, height: 8, rx: 0.5 })) },
								].map(aiOpt => {
									const isAct = (getSetting('align_items') || 'stretch') === aiOpt.val;
									return h('button', { key: aiOpt.val, type: 'button', className: `sppcfw-p-2 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${isAct ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'}`, onClick: () => handleSettingChange('align_items', aiOpt.val), title: aiOpt.title }, aiOpt.icon);
								})
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Gaps', true, gapsUnit, setGapsUnit, ['px', 'em', '%']),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-items-start sppcfw-gap-1.5' },
								h(
									'div',
									{ className: 'sppcfw-flex-1 sppcfw-grid sppcfw-grid-cols-2 sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
									h(
										'div',
										{ className: 'sppcfw-border-r sppcfw-border-[#374151]' },
										h('input', {
											type: 'number',
											className: 'sppcfw-w-full sppcfw-bg-transparent sppcfw-px-2 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-center sppcfw-text-white focus:sppcfw-outline-none',
											value: parseInt(getSetting('column_gap') || getSetting('gap') || '20', 10),
											onChange: e => {
												const v = e.target.value ? e.target.value + gapsUnit : '0px';
												if (isGapsLinked) {
													handleSettingChange('gap', v);
													handleSettingChange('column_gap', v);
													handleSettingChange('row_gap', v);
												} else {
													handleSettingChange('column_gap', v);
												}
											},
										})
									),
									h(
										'div',
										null,
										h('input', {
											type: 'number',
											className: 'sppcfw-w-full sppcfw-bg-transparent sppcfw-px-2 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-center sppcfw-text-white focus:sppcfw-outline-none',
											value: parseInt(getSetting('row_gap') || getSetting('gap') || '20', 10),
											onChange: e => {
												const v = e.target.value ? e.target.value + gapsUnit : '0px';
												if (isGapsLinked) {
													handleSettingChange('gap', v);
													handleSettingChange('column_gap', v);
													handleSettingChange('row_gap', v);
												} else {
													handleSettingChange('row_gap', v);
												}
											},
										})
									)
								),
								h(
									'button',
									{
										type: 'button',
										className: `sppcfw-p-2 sppcfw-rounded sppcfw-border sppcfw-transition-colors sppcfw-cursor-pointer ${
											isGapsLinked ? 'sppcfw-bg-[#374151] sppcfw-border-[#4b5563] sppcfw-text-white' : 'sppcfw-bg-[#111827] sppcfw-border-[#374151] sppcfw-text-gray-400 hover:sppcfw-text-white'
										}`,
										onClick: () => setIsGapsLinked(!isGapsLinked),
										title: isGapsLinked ? 'Unlink values' : 'Link values',
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, isGapsLinked ? 'link' : 'link_off')
								)
							),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-text-[10px] sppcfw-text-gray-400 sppcfw-pr-9' },
								h('span', { className: 'sppcfw-flex-1 sppcfw-text-center' }, 'Column'),
								h('span', { className: 'sppcfw-flex-1 sppcfw-text-center' }, 'Row')
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-text-[#e5e7eb] sppcfw-font-medium' }, 'Wrap', h('span', { className: 'material-symbols-outlined sppcfw-text-[13px] sppcfw-text-gray-400', title: deviceView }, 'desktop_windows')),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
								[
									{ val: 'nowrap', title: 'No Wrap', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M2 3v10M5 8h8M9.5 4.5L13 8l-3.5 3.5' })) },
									{ val: 'wrap', title: 'Wrap', icon: h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }, h('path', { d: 'M3 5.5h7a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H4M7 8.5L4 11.5l3 3' })) },
								].map(wrapOpt => {
									const isAct = (getSetting('flex_wrap') || 'nowrap') === wrapOpt.val;
									return h('button', { key: wrapOpt.val, type: 'button', className: `sppcfw-p-2 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${isAct ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'}`, onClick: () => handleSettingChange('flex_wrap', wrapOpt.val), title: wrapOpt.title }, wrapOpt.icon);
								})
							)
						)
					)
				)
			);
		}

		// 1b. Column Content Panel
		function renderColumnContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'general',
					'Column Width & Size',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'Quick Width Presets'),
							h(
								'div',
								{ className: 'sppcfw-grid sppcfw-grid-cols-4 sppcfw-gap-1.5' },
								['100%', '50%', '33.33%', '25%', '66.66%', '75%', '20%'].map(w =>
									h(
										'button',
										{
											key: w,
											className: `sppcfw-py-1 sppcfw-text-[11px] sppcfw-font-semibold sppcfw-rounded sppcfw-border sppcfw-transition-all ${
												(getSetting('flex_width') || '100%') === w
													? 'sppcfw-bg-[#9333ea] sppcfw-border-[#9333ea] sppcfw-text-white sppcfw-shadow'
													: 'sppcfw-bg-[#111827] sppcfw-border-[#374151] sppcfw-text-gray-300 hover:sppcfw-border-[#9333ea] hover:sppcfw-text-white'
											}`,
											onClick: () => {
												handleSettingChange('flex_width', w);
												const targetKey = getDeviceKey('flex_width', deviceView);
												updateElementProperties({ ...selectedElement, label: 'Column (' + w + ')', settings: { ...selectedElement.settings, [targetKey]: w } });
											},
										},
										w
									)
								)
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-gray-200 sppcfw-font-medium' }, 'Flex Width'),
								h('span', { className: 'sppcfw-text-[10px] sppcfw-text-gray-300 font-mono' }, getSetting('flex_width') || '100%')
							),
							renderSliderInput(getSetting('flex_width') || '100%', v => {
								handleSettingChange('flex_width', v);
								const targetKey = getDeviceKey('flex_width', deviceView);
								updateElementProperties({ ...selectedElement, label: 'Column (' + v + ')', settings: { ...selectedElement.settings, [targetKey]: v } });
							}, 5, 100, 1, '%')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Min Height', true, heightUnit, setHeightUnit, ['px', 'vh']),
						renderSliderInput(getSetting('min_height') || '', v => handleSettingChange('min_height', v), 0, 800, 1, heightUnit, '')
						)
					)
				),
				renderAccordion(
					'items',
					'Column Items Layout',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-gray-200 sppcfw-font-medium' }, 'Direction'),
							renderButtonGroup(
								[
									{ value: 'column', label: '↓ Column' },
									{ value: 'row', label: '→ Row' },
								],
								getSetting('flex_direction') || 'column',
								v => handleSettingChange('flex_direction', v)
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-gray-200 sppcfw-font-medium' }, 'Justify Content'),
							renderButtonGroup(
								[
									{ value: 'flex-start', title: 'Start', label: 'Top' },
									{ value: 'center', title: 'Center', label: 'Mid' },
									{ value: 'flex-end', title: 'End', label: 'Btm' },
								],
								getSetting('justify_content') || 'flex-start',
								v => handleSettingChange('justify_content', v)
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-gray-200 sppcfw-font-medium' }, 'Align Items'),
							renderButtonGroup(
								[
									{ value: 'flex-start', title: 'Start', label: 'Left' },
									{ value: 'center', title: 'Center', label: 'Mid' },
									{ value: 'flex-end', title: 'End', label: 'Right' },
									{ value: 'stretch', title: 'Stretch', label: 'Full' },
								],
								getSetting('align_items') || 'stretch',
								v => handleSettingChange('align_items', v)
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Widget Gap', true, gapsUnit, setGapsUnit, ['px', 'em']),
							renderSliderInput(getSetting('gap') || '12px', v => handleSettingChange('gap', v), 0, 80, 1, gapsUnit, '12')
						)
					)
				),
				renderAccordion(
					'button',
					'Column Actions',
					h(
						'div',
						{ className: 'sppcfw-space-y-2.5' },
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-w-full sppcfw-py-2 sppcfw-bg-[#9333ea] hover:sppcfw-bg-[#7e22ce] sppcfw-text-white sppcfw-rounded sppcfw-font-bold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-transition-colors sppcfw-shadow sppcfw-text-xs sppcfw-cursor-pointer',
								onClick: () => addColumnToContainer && addColumnToContainer(selectedElement.id),
							},
							h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'add'),
							'Add New Column To Container'
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-gap-2' },
							h(
								'button',
								{
									type: 'button',
									className: 'sppcfw-flex-1 sppcfw-py-1.5 sppcfw-bg-[#374151] hover:sppcfw-bg-[#4b5563] sppcfw-text-white sppcfw-rounded sppcfw-font-semibold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1 sppcfw-transition-colors sppcfw-text-xs sppcfw-cursor-pointer',
									onClick: () => duplicateColumn && duplicateColumn(selectedElement.id),
								},
								h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'content_copy'),
								'Duplicate'
							),
							h(
								'button',
								{
									type: 'button',
									className: 'sppcfw-flex-1 sppcfw-py-1.5 sppcfw-bg-red-900/40 hover:sppcfw-bg-red-800/60 sppcfw-border sppcfw-border-red-700/50 sppcfw-text-red-200 sppcfw-rounded sppcfw-font-semibold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1 sppcfw-transition-colors sppcfw-text-xs sppcfw-cursor-pointer',
								onClick: () => removeElement && removeElement(selectedElement.id),
								},
								h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'delete'),
								'Delete'
							)
						)
					)
				)
			);
		}

		// 1c. Image Content Panel
		function renderImageContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'general',
					'Choose Image',
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h(
							'div',
							{ className: 'sppcfw-space-y-2' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium sppcfw-block' }, 'Image Asset'),
							h(
								'div',
								{
									className: 'sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#374151] hover:sppcfw-border-[#9333ea] sppcfw-rounded-lg sppcfw-p-3 sppcfw-bg-[#111827] sppcfw-text-center sppcfw-cursor-pointer sppcfw-transition-colors sppcfw-relative group',
									onClick: () => {
										if (typeof wp !== 'undefined' && wp.media) {
											const frame = wp.media({
												title: 'Select Image',
												button: { text: 'Insert Image' },
												multiple: false,
											});
											frame.on('select', () => {
												const attachment = frame.state().get('selection').first().toJSON();
												if (attachment && attachment.url) {
													handleSettingChange('custom_image_url', attachment.url);
													if (attachment.alt && !getSetting('alt_text')) {
														handleSettingChange('alt_text', attachment.alt);
													}
												}
											});
											frame.open();
										} else {
											const url = prompt('Enter Image URL:', getSetting('custom_image_url') || '');
											if (url !== null && url.trim() !== '') {
												handleSettingChange('custom_image_url', url.trim());
											}
										}
									},
								},
								getSetting('custom_image_url')
									? h(
											'div',
											{ className: 'sppcfw-space-y-2' },
											h('img', {
												src: getSetting('custom_image_url'),
												alt: getSetting('alt_text') || 'Selected Custom Preview',
												className: 'sppcfw-h-32 sppcfw-w-full sppcfw-object-contain sppcfw-rounded sppcfw-bg-[#091421]/60 sppcfw-p-1',
											}),
											h('div', { className: 'sppcfw-text-[11px] sppcfw-text-[#ddb8ff] sppcfw-font-semibold' }, 'Click to Change Image')
									  )
									: h(
											'div',
											{ className: 'sppcfw-py-6 sppcfw-space-y-2' },
											h('span', { className: 'material-symbols-outlined sppcfw-text-3xl sppcfw-text-gray-400 group-hover:sppcfw-text-[#ddb8ff] sppcfw-transition-colors' }, 'add_photo_alternate'),
											h('div', { className: 'sppcfw-text-xs sppcfw-font-semibold sppcfw-text-gray-200' }, 'Choose Image from Media Library'),
											h('div', { className: 'sppcfw-text-[10px] sppcfw-text-gray-400' }, 'Insert any custom image into your layout')
									  )
							),
							getSetting('custom_image_url') &&
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-pt-1' },
									h('button', { type: 'button', className: 'sppcfw-text-[11px] sppcfw-text-red-400 hover:sppcfw-text-red-300 sppcfw-underline sppcfw-cursor-pointer', onClick: () => handleSettingChange('custom_image_url', '') }, 'Remove Image'),
									h('span', { className: 'sppcfw-text-[10px] sppcfw-text-gray-400' }, 'Custom Image Set')
								)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Image URL (Direct)'),
						h('input', {
							type: 'text',
							className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: getSetting('custom_image_url') || '',
							placeholder: 'https://example.com/image.jpg',
							onChange: e => handleSettingChange('custom_image_url', e.target.value),
						})
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Alt Text'),
						h('input', {
							type: 'text',
							className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: getSetting('alt_text') || '',
							placeholder: 'Descriptive alt text for image',
							onChange: e => handleSettingChange('alt_text', e.target.value),
						})
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Image Resolution'),
							h(
								'select',
								{
									className: 'sppcfw-w-44 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
									value: getSetting('image_size') || 'large',
									onChange: e => handleSettingChange('image_size', e.target.value),
								},
								h('option', { value: 'thumbnail' }, 'Thumbnail (150x150)'),
								h('option', { value: 'medium' }, 'Medium (300x300)'),
								h('option', { value: 'large' }, 'Large (1024x1024)'),
								h('option', { value: 'full' }, 'Full Size')
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'center',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				),
				renderAccordion(
					'items',
					'Caption & Link Options',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Caption'),
						h(
							'select',
							{
								className: 'sppcfw-w-44 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
								value: getSetting('caption_type') || 'none',
								onChange: e => handleSettingChange('caption_type', e.target.value),
							},
							h('option', { value: 'none' }, 'None'),
							h('option', { value: 'custom' }, 'Custom Caption')
						)
						),
						getSetting('caption_type') === 'custom' &&
							h('input', {
								type: 'text',
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
								value: getSetting('custom_caption') || '',
								placeholder: 'Enter custom caption text...',
								onChange: e => handleSettingChange('custom_caption', e.target.value),
							}),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Link'),
						h(
							'select',
							{
								className: 'sppcfw-w-44 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
								value: getSetting('link_to') || 'none',
								onChange: e => handleSettingChange('link_to', e.target.value),
							},
							h('option', { value: 'none' }, 'None'),
							h('option', { value: 'file' }, 'Media File'),
							h('option', { value: 'custom' }, 'Custom URL')
						)
						),
						getSetting('link_to') === 'custom' &&
							h(
								'div',
								{ className: 'sppcfw-space-y-2' },
								h('input', {
									type: 'text',
									className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
									value: getSetting('custom_link') || '',
									placeholder: 'https://...',
									onChange: e => handleSettingChange('custom_link', e.target.value),
								}),
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2' },
									h('input', { type: 'checkbox', id: 'chk-blank', className: 'sppcfw-accent-[#9333ea]', checked: !!getSetting('link_target_blank'), onChange: e => handleSettingChange('link_target_blank', e.target.checked) }),
									h('label', { htmlFor: 'chk-blank', className: 'sppcfw-text-xs sppcfw-text-gray-300' }, 'Open in new window')
								)
							)
					)
				)
			);
		}

		// 1d. Product Gallery Content Panel
		function renderProductGalleryContent() {
			const showThumbs = getSetting('show_thumbnails') !== false;
			const thumbsLayout = getSetting('thumbs_layout') || 'grid'; // 'grid' | 'carousel'

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				h(
					'div',
					{ className: 'sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg sppcfw-p-3.5 sppcfw-space-y-1.5' },
					h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#92ccff]' }, h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'collections'), 'WooCommerce Product Gallery'),
					h('p', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-leading-relaxed' }, 'This widget automatically displays the featured image and gallery thumbnails of the active product from WooCommerce.')
				),
				renderAccordion(
					'general',
					'Gallery Options',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Show Gallery Thumbnails'),
							h('input', { type: 'checkbox', className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer', checked: showThumbs, onChange: e => handleSettingChange('show_thumbnails', e.target.checked) })
						),
						showThumbs &&
							h(
								'div',
								{ className: 'sppcfw-space-y-1.5' },
								h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium sppcfw-block' }, 'Thumbnail Display Format'),
								renderButtonGroup(
									[
										{ value: 'grid', label: 'Grid', icon: 'grid_view', title: 'Static Thumbnail Grid' },
										{ value: 'carousel', label: 'Carousel', icon: 'view_carousel', title: 'Interactive Thumbnail Carousel' },
									],
									thumbsLayout,
									v => handleSettingChange('thumbs_layout', v)
								)
							),
						showThumbs &&
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
								h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, thumbsLayout === 'carousel' ? 'Visible Carousel Items' : 'Thumbnail Columns'),
								h(
									'select',
									{
										className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-w-36',
										value: getSetting('gallery_columns') || '4',
										onChange: e => handleSettingChange('gallery_columns', e.target.value),
									},
									h('option', { value: '3' }, '3 Items'),
									h('option', { value: '4' }, '4 Items'),
									h('option', { value: '5' }, '5 Items'),
									h('option', { value: '6' }, '6 Items')
								)
							),
						showThumbs && thumbsLayout === 'carousel' &&
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
								h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Show Carousel Navigation Arrows'),
								h('input', { type: 'checkbox', className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer', checked: getSetting('show_carousel_arrows') !== false, onChange: e => handleSettingChange('show_carousel_arrows', e.target.checked) })
							),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Lightbox Popup'),
							h('input', { type: 'checkbox', className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer', checked: getSetting('enable_lightbox') !== false, onChange: e => handleSettingChange('enable_lightbox', e.target.checked) })
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Image Zoom On Hover'),
							h('input', { type: 'checkbox', className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer', checked: getSetting('enable_zoom') !== false, onChange: e => handleSettingChange('enable_zoom', e.target.checked) })
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5 sppcfw-pt-1' },
							renderControlHeader('Gallery Alignment', true),
							renderButtonGroup(
								[
									{ value: 'left', icon: 'format_align_left', title: 'Left' },
									{ value: 'center', icon: 'format_align_center', title: 'Center' },
									{ value: 'right', icon: 'format_align_right', title: 'Right' },
								],
								getStyle('alignment') || 'center',
								v => handleStyleChange('alignment', v)
							)
						)
					)
				)
			);
		}

		// 1e. Product Title Content Panel
		function renderProductTitleContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				h(
					'div',
					{ className: 'sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg sppcfw-p-3.5 sppcfw-space-y-1.5' },
					h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#92ccff]' }, h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'title'), 'WooCommerce Product Title'),
					h('p', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-leading-relaxed' }, 'This widget automatically renders the title of the active product from WooCommerce.')
				),
				renderAccordion(
					'general',
					'Title Settings',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'HTML Tag'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none sppcfw-w-32',
									value: getSetting('html_tag') || 'h1',
									onChange: e => handleSettingChange('html_tag', e.target.value),
								},
								['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p'].map(tag => h('option', { key: tag, value: tag }, tag.toUpperCase()))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Link to Product Page'),
							h('input', { type: 'checkbox', className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer', checked: !!getSetting('link_to_product'), onChange: e => handleSettingChange('link_to_product', e.target.checked) })
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Alignment', true),
							renderButtonGroup(
								[
									{ value: 'left', icon: 'format_align_left', title: 'Left' },
									{ value: 'center', icon: 'format_align_center', title: 'Center' },
									{ value: 'right', icon: 'format_align_right', title: 'Right' },
									{ value: 'justify', icon: 'format_align_justify', title: 'Justify' },
								],
								getStyle('alignment') || 'left',
								v => handleStyleChange('alignment', v)
							)
						)
					)
				)
			);
		}

		// 1e-2. Product Price Content Panel
		function renderProductPriceContent() {
			const showReg = getSetting('show_regular_price') !== false && getSetting('show_regular_price') !== 'off' && getSetting('show_regular_price') !== '0';
			const showBadge = getSetting('show_sale_badge') !== false && getSetting('show_sale_badge') !== 'off' && getSetting('show_sale_badge') !== '0';

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'price_display',
					'Price Display Settings',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						// Hide Price Checkbox (sppcfw_basic_hide_price)
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-start sppcfw-gap-3 sppcfw-p-3 sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg' },
							h('input', {
								type: 'checkbox',
								id: 'sppcfw_basic_hide_price',
								className: 'sppcfw_basic_hide_price sppcfw-mt-0.5 sppcfw-w-4 sppcfw-h-4 sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer sppcfw-accent-[#9333ea]',
								checked: !!hidePrice,
								onChange: e => {
									const isChecked = e.target.checked;
									if (typeof setHidePrice === 'function') {
										setHidePrice(isChecked);
									}
									if (typeof handleToggleHidePrice === 'function') {
										handleToggleHidePrice(isChecked);
									} else {
										apiPost('sppcfw_update_builder_basic_setting', {
											key: 'hide_product_price',
											value: isChecked ? 'on' : '',
										});
										if (window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings) {
											window.SPPCFWBuilderConfig.basic_settings.hide_product_price = isChecked ? 'on' : '';
										}
									}
								},
							}),
							h(
								'label',
								{ htmlFor: 'sppcfw_basic_hide_price', className: 'sppcfw-flex sppcfw-flex-col sppcfw-cursor-pointer' },
								h('span', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#d9e3f6]' }, 'Hide price'),
								h('span', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-mt-0.5' }, 'Hides the price on single product pages. Automatically syncs with Basic Settings.')
							)
						),

						// Show Regular Price Checkbox
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-start sppcfw-gap-3 sppcfw-p-3 sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg' },
							h('input', {
								type: 'checkbox',
								id: 'sppcfw_show_regular_price',
								className: 'sppcfw-mt-0.5 sppcfw-w-4 sppcfw-h-4 sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer sppcfw-accent-[#9333ea]',
								checked: showReg,
								onChange: e => handleSettingChange('show_regular_price', e.target.checked),
							}),
							h(
								'label',
								{ htmlFor: 'sppcfw_show_regular_price', className: 'sppcfw-flex sppcfw-flex-col sppcfw-cursor-pointer' },
								h('span', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#d9e3f6]' }, 'Show regular price if on sale'),
								h('span', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-mt-0.5' }, 'When both regular and sale price exist, display the crossed-out regular price. If the product only has one price, that single price is always shown.')
							)
						),

						// Show Sale Badge Checkbox
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-start sppcfw-gap-3 sppcfw-p-3 sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg' },
							h('input', {
								type: 'checkbox',
								id: 'sppcfw_show_sale_badge',
								className: 'sppcfw-mt-0.5 sppcfw-w-4 sppcfw-h-4 sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer sppcfw-accent-[#9333ea]',
								checked: showBadge,
								onChange: e => handleSettingChange('show_sale_badge', e.target.checked),
							}),
							h(
								'label',
								{ htmlFor: 'sppcfw_show_sale_badge', className: 'sppcfw-flex sppcfw-flex-col sppcfw-cursor-pointer' },
								h('span', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#d9e3f6]' }, 'Show sale badge'),
								h('span', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-mt-0.5' }, 'Displays a "Sale" badge when the product is discounted.')
							)
						),

						// Alignment
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Alignment', true),
							renderButtonGroup(
								[
									{ value: 'left', icon: 'format_align_left', title: 'Left' },
									{ value: 'center', icon: 'format_align_center', title: 'Center' },
									{ value: 'right', icon: 'format_align_right', title: 'Right' },
								],
								getStyle('alignment') || 'left',
								v => handleStyleChange('alignment', v)
							)
						)
					)
				)
			);
		}

		// 1f. Heading Content Panel
		function renderHeadingContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'general',
					'Heading Content',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Heading Text'),
						h('input', {
							type: 'text',
							className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: getSetting('text') !== undefined ? getSetting('text') : 'Add Your Heading Text Here',
							placeholder: 'Enter heading text...',
							onChange: e => handleSettingChange('text', e.target.value),
						})
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'HTML Tag'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
									value: getSetting('html_tag') || 'h2',
									onChange: e => handleSettingChange('html_tag', e.target.value),
								},
								['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p'].map(tag => h('option', { key: tag, value: tag }, tag.toUpperCase()))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Link URL (optional)'),
						h('input', {
							type: 'text',
							className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: getSetting('link_url') || '',
							placeholder: 'https://...',
							onChange: e => handleSettingChange('link_url', e.target.value),
						})
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'left',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				)
			);
		}

		// 1f. Text Editor Content Panel
		function renderTextEditorContent() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'general',
					'Text Content',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Text Content'),
						h('textarea', {
							rows: 6,
							className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-p-2.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
							value: getSetting('text_content') !== undefined ? getSetting('text_content') : 'Add your custom description or paragraph content here...',
							placeholder: 'Enter custom text or description...',
							onChange: e => handleSettingChange('text_content', e.target.value),
						})
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'HTML Tag'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
									value: getSetting('html_tag') || 'div',
									onChange: e => handleSettingChange('html_tag', e.target.value),
								},
								['div', 'p', 'span'].map(tag => h('option', { key: tag, value: tag }, tag.toUpperCase()))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'left',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				)
			);
		}

		// 1g. Dynamic Product Elements Information Panel (Used for all other Product Elements)
		function renderProductElementDynamicCard() {
			const typeDescriptions = {
				product_title: 'Displays the active product title dynamically from WooCommerce catalog.',
				product_price: 'Displays the dynamic price, sale price, and discount badge automatically.',
				product_add_to_cart: 'Displays the dynamic Add to Cart button and quantity selector.',
				product_rating: 'Displays the average star rating and review count from WooCommerce.',
				product_short_desc: 'Displays the product excerpt or short description from WooCommerce.',
				product_description: 'Displays the full product description, reviews, and data tabs.',
				product_meta: 'Displays SKU, product categories, and tags dynamically.',
				product_meta_item: 'Displays custom WooCommerce product meta field values.',
				variation_swatches: 'Displays variable product options, attributes, and variation table.',
				custom_message: 'Displays customizable notification banner on the product page.',
				plus_minus_buttons: 'Displays plus/minus quantity stepper buttons.',
				related_products: 'Displays related products grid generated by WooCommerce.',
				upsell_products: 'Displays upsell recommendations from WooCommerce.',
			};

			const desc = typeDescriptions[selectedElement.type] || 'This element renders dynamic WooCommerce single product content.';

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				h(
					'div',
					{ className: 'sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg sppcfw-p-4 sppcfw-space-y-3' },
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#92ccff]' },
						h('span', { className: 'material-symbols-outlined sppcfw-text-lg sppcfw-text-[#ddb8ff]' }, selectedElement.icon || 'widgets'),
						selectedElement.label || panelTitle
					),
					h('p', { className: 'sppcfw-text-xs sppcfw-text-[#d9e3f6] sppcfw-leading-relaxed' }, desc),
					h(
						'div',
						{ className: 'sppcfw-bg-[#111827] sppcfw-p-3 sppcfw-rounded sppcfw-border sppcfw-border-[#374151] sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-space-y-1' },
						h('div', { className: 'sppcfw-font-bold sppcfw-text-[#ddb8ff] sppcfw-flex sppcfw-items-center sppcfw-gap-1' }, h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'info'), 'Dynamic WooCommerce Element'),
						h('p', null, 'Content for this element is automatically managed by WooCommerce. To customize colors, typography, spacing, or borders, switch to the Style and Advanced tabs.')
					),
					h(
						'button',
						{
							type: 'button',
							className: 'sppcfw-w-full sppcfw-py-2 sppcfw-bg-[#9333ea] hover:sppcfw-bg-[#7e22ce] sppcfw-text-white sppcfw-rounded sppcfw-font-bold sppcfw-text-xs sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-transition-all sppcfw-shadow sppcfw-cursor-pointer',
							onClick: () => setActiveTab('style'),
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'contrast'),
						'Customize in Style Panel →'
					)
				)
			);
		}

		// ==========================================
		// 2. INDIVIDUAL STYLE PANELS
		// ==========================================

		// 2a. Container & Column Style Panel (Matching Image 1 & 2)
		function renderContainerStyle() {
			const currentBgType = getStyle(bgTab === 'normal' ? 'bg_type' : 'bg_hover_type') || 'classic';

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'background',
					'Background',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						// Normal | Hover Tabs (Image 1 & 2)
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden sppcfw-p-0.5' },
							h(
								'button',
								{
									type: 'button',
									className: `sppcfw-flex-1 sppcfw-py-1.5 sppcfw-text-xs sppcfw-font-semibold sppcfw-rounded-sm sppcfw-transition-colors sppcfw-cursor-pointer ${
										bgTab === 'normal'
											? 'sppcfw-bg-[#cbd5e1] sppcfw-text-gray-900 sppcfw-font-bold sppcfw-shadow-sm'
											: 'sppcfw-text-gray-400 hover:sppcfw-text-white'
									}`,
									onClick: () => setBgTab('normal')
								},
								'Normal'
							),
							h(
								'button',
								{
									type: 'button',
									className: `sppcfw-flex-1 sppcfw-py-1.5 sppcfw-text-xs sppcfw-font-semibold sppcfw-rounded-sm sppcfw-transition-colors sppcfw-cursor-pointer ${
										bgTab === 'hover'
											? 'sppcfw-bg-[#cbd5e1] sppcfw-text-gray-900 sppcfw-font-bold sppcfw-shadow-sm'
											: 'sppcfw-text-gray-400 hover:sppcfw-text-white'
									}`,
									onClick: () => setBgTab('hover')
								},
								'Hover'
							)
						),

						// Background Type Selector
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Background Type'),
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-bg-[#111827] sppcfw-overflow-hidden' },
								// Classic (brush)
								h(
									'button',
									{
										type: 'button',
										className: `sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-transition-colors sppcfw-cursor-pointer ${
											currentBgType === 'classic' ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white'
										}`,
										title: 'Classic',
										onClick: () => handleStyleChange(bgTab === 'normal' ? 'bg_type' : 'bg_hover_type', 'classic')
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'brush')
								),
								// Gradient (gradient icon)
								h(
									'button',
									{
										type: 'button',
										className: `sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-border-l sppcfw-border-[#374151] sppcfw-transition-colors sppcfw-cursor-pointer ${
											currentBgType === 'gradient' ? 'sppcfw-bg-[#374151] sppcfw-text-white' : 'sppcfw-text-gray-400 hover:sppcfw-text-white'
										}`,
										title: 'Gradient',
										onClick: () => handleStyleChange(bgTab === 'normal' ? 'bg_type' : 'bg_hover_type', 'gradient')
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'gradient')
								)
							)
						),

						// Content for Classic Type (Image 1 & 2)
						currentBgType === 'classic' &&
							h(
								'div',
								{ className: 'sppcfw-space-y-3.5' },
								// Color
								renderColorPicker(
									'Color',
									getStyle(bgTab === 'normal' ? 'bg_color' : 'bg_hover_color'),
									v => handleStyleChange(bgTab === 'normal' ? 'bg_color' : 'bg_hover_color', v),
									'transparent'
								),

								// Image (Image 1 & 2)
								(() => {
									const imgKey = bgTab === 'normal' ? 'bg_image' : 'bg_hover_image';
									const currentImgUrl = getStyle(imgKey);
									const currentRes = getStyle('bg_resolution') || 'Full';
									const currentPos = getStyle('bg_position') || 'Center Center';
									const currentAtt = getStyle('bg_attachment') || 'Default';
									const currentRep = getStyle('bg_repeat') || 'No-repeat';
									const currentSize = getStyle('bg_size') || 'Cover';

									function openMediaPicker() {
										if (typeof wp !== 'undefined' && wp.media) {
											const frame = wp.media({
												title: 'Select Background Image',
												button: { text: 'Insert Background Image' },
												multiple: false
											});
											frame.on('select', () => {
												const attachment = frame.state().get('selection').first().toJSON();
												if (attachment && attachment.url) {
													const sizes = attachment.sizes || {};
													const resKey = (getStyle('bg_resolution') || 'Full').toLowerCase();
													const chosenUrl = (sizes[resKey] && sizes[resKey].url) ? sizes[resKey].url : attachment.url;
													handleMultiStyleChange({
														[imgKey]: chosenUrl,
														[`${imgKey}_sizes`]: sizes,
														[`${imgKey}_raw_url`]: attachment.url,
														bg_position: getStyle('bg_position') || 'Center Center',
														bg_repeat: getStyle('bg_repeat') || 'No-repeat',
														bg_size: getStyle('bg_size') || 'Cover',
													});
												}
											});
											frame.open();
										} else {
											const url = prompt('Enter Background Image URL:', currentImgUrl || '');
											if (url !== null && url.trim()) {
												handleMultiStyleChange({
													[imgKey]: url.trim(),
													bg_position: getStyle('bg_position') || 'Center Center',
													bg_repeat: getStyle('bg_repeat') || 'No-repeat',
													bg_size: getStyle('bg_size') || 'Cover',
												});
											}
										}
									}

									function removeImage() {
										handleMultiStyleChange({
											[imgKey]: '',
											[`${imgKey}_sizes`]: null,
											[`${imgKey}_raw_url`]: ''
										});
									}

									function handleResolutionChange(newRes) {
										const sizes = getStyle(`${imgKey}_sizes`) || {};
										const rawUrl = getStyle(`${imgKey}_raw_url`) || currentImgUrl;
										const newUrl = (sizes[newRes.toLowerCase()] && sizes[newRes.toLowerCase()].url) ? sizes[newRes.toLowerCase()].url : rawUrl;
										handleMultiStyleChange({
											bg_resolution: newRes,
											[imgKey]: newUrl
										});
									}

									return h(
										'div',
										{ className: 'sppcfw-space-y-3' },
										// Header Row
										h(
											'div',
											{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
											h(
												'div',
												{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
												h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Image'),
												h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-gray-400' }, 'desktop_windows')
											),
											h(
												'div',
												{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
												currentImgUrl &&
													h(
														'button',
														{
															type: 'button',
															className: 'sppcfw-text-gray-400 hover:sppcfw-text-red-400 sppcfw-p-1 sppcfw-rounded hover:sppcfw-bg-red-950/40 sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-flex sppcfw-items-center sppcfw-justify-center',
															title: 'Remove Image',
															onClick: e => {
																e.stopPropagation();
																removeImage();
															}
														},
														h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'delete')
													),
												h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-[#ddb8ff]' }, 'auto_awesome')
											)
										),

										// Wide Image Upload Box
										h(
											'div',
											{
												className: 'sppcfw-relative sppcfw-w-full sppcfw-h-24 sppcfw-border sppcfw-border-[#374151] hover:sppcfw-border-[#9333ea] sppcfw-rounded-md sppcfw-bg-[#111827] sppcfw-overflow-hidden sppcfw-cursor-pointer sppcfw-transition-colors group',
												onClick: openMediaPicker
											},
											currentImgUrl
												? h(
														'div',
														{ className: 'sppcfw-w-full sppcfw-h-full sppcfw-relative' },
														h('img', {
															src: currentImgUrl,
															alt: 'Background Preview',
															className: 'sppcfw-w-full sppcfw-h-full sppcfw-object-cover'
														}),
														h(
															'div',
															{ className: 'sppcfw-absolute sppcfw-inset-0 sppcfw-bg-black/60 sppcfw-opacity-0 group-hover:sppcfw-opacity-100 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-2.5 sppcfw-transition-opacity' },
															h(
																'button',
																{
																	type: 'button',
																	className: 'sppcfw-px-2.5 sppcfw-py-1 sppcfw-bg-[#9333ea] hover:sppcfw-bg-[#7e22ce] sppcfw-text-white sppcfw-rounded sppcfw-text-xs sppcfw-font-semibold sppcfw-shadow sppcfw-cursor-pointer',
																	onClick: e => {
																		e.stopPropagation();
																		openMediaPicker();
																	}
																},
																'Change'
															),
															h(
																'button',
																{
																	type: 'button',
																	className: 'sppcfw-px-2.5 sppcfw-py-1 sppcfw-bg-red-600 hover:sppcfw-bg-red-700 sppcfw-text-white sppcfw-rounded sppcfw-text-xs sppcfw-font-semibold sppcfw-shadow sppcfw-cursor-pointer',
																	title: 'Delete Image',
																	onClick: e => {
																		e.stopPropagation();
																		removeImage();
																	}
																},
																'Remove'
															)
														)
												  )
												: h(
														'div',
														{ className: 'sppcfw-w-full sppcfw-h-full sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-gap-1 sppcfw-text-gray-400 group-hover:sppcfw-text-white' },
														h('span', { className: 'material-symbols-outlined sppcfw-text-xl' }, 'add_photo_alternate'),
														h('span', { className: 'sppcfw-text-[11px] sppcfw-font-medium' }, 'Choose Image')
												  )
										),

										// If image is selected on Normal tab, show Resolution, Position, Attachment, Repeat, Display Size
										bgTab === 'normal' && currentImgUrl &&
											h(
												'div',
												{ className: 'sppcfw-space-y-3' },
												// Image Resolution
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
													h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Image Resolution'),
													h(
														'select',
														{
															className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
															value: currentRes,
															onChange: e => handleResolutionChange(e.target.value)
														},
														['Full', 'Large', 'Medium', 'Thumbnail'].map(r => h('option', { key: r, value: r }, r))
													)
												),
												h('p', { className: 'sppcfw-text-[10px] sppcfw-italic sppcfw-text-gray-400 sppcfw-leading-tight' }, 'Image size settings don\'t apply to Dynamic Images.'),

												h('hr', { className: 'sppcfw-border-[#374151] sppcfw-my-2' }),

												// Position
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
													h(
														'div',
														{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
														h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Position'),
														h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-gray-400' }, 'desktop_windows')
													),
													h(
														'select',
														{
															className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
															value: currentPos,
															onChange: e => handleStyleChange('bg_position', e.target.value)
														},
														['Default', 'Center Center', 'Center Left', 'Center Right', 'Top Center', 'Top Left', 'Top Right', 'Bottom Center', 'Bottom Left', 'Bottom Right', 'Custom'].map(p => h('option', { key: p, value: p }, p))
													)
												),
												currentPos === 'Custom' &&
													h(
														'div',
														{ className: 'sppcfw-space-y-2 sppcfw-pl-2 sppcfw-border-l sppcfw-border-[#374151]' },
														renderControlHeader('X Position', true, '%', () => {}, ['%']),
														renderSliderInput(getStyle('bg_pos_x') || '50%', v => handleStyleChange('bg_pos_x', v), 0, 100, 1, '%', '50'),
														renderControlHeader('Y Position', true, '%', () => {}, ['%']),
														renderSliderInput(getStyle('bg_pos_y') || '50%', v => handleStyleChange('bg_pos_y', v), 0, 100, 1, '%', '50')
													),

												// Attachment
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
													h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Attachment'),
													h(
														'select',
														{
															className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
															value: currentAtt,
															onChange: e => handleStyleChange('bg_attachment', e.target.value)
														},
														['Default', 'Scroll', 'Fixed'].map(a => h('option', { key: a, value: a }, a))
													)
												),

												// Repeat
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
													h(
														'div',
														{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
														h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Repeat'),
														h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-gray-400' }, 'desktop_windows')
													),
													h(
														'select',
														{
															className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
															value: currentRep,
															onChange: e => handleStyleChange('bg_repeat', e.target.value)
														},
														['Default', 'No-repeat', 'Repeat', 'Repeat-x', 'Repeat-y'].map(r => h('option', { key: r, value: r }, r))
													)
												),

												// Display Size
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
													h(
														'div',
														{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
														h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Display Size'),
														h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-gray-400' }, 'desktop_windows')
													),
													h(
														'select',
														{
															className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
															value: currentSize,
															onChange: e => handleStyleChange('bg_size', e.target.value)
														},
														['Default', 'Auto', 'Cover', 'Contain', 'Custom'].map(s => h('option', { key: s, value: s }, s))
													)
												),
												currentSize === 'Custom' &&
													h(
														'div',
														{ className: 'sppcfw-space-y-1.5 sppcfw-pl-2 sppcfw-border-l sppcfw-border-[#374151]' },
														renderControlHeader('Custom Scale Width', true, widthUnit, setWidthUnit, ['%', 'px', 'vw']),
														renderSliderInput(getStyle('bg_custom_size') || '100%', v => handleStyleChange('bg_custom_size', v), 1, 200, 1, widthUnit, '100')
													)
											),

										// Hover Transition Duration on Hover Tab
										bgTab === 'hover' &&
											h(
												'div',
												{ className: 'sppcfw-space-y-1.5' },
												renderControlHeader('Transition Duration', true, 's', () => {}, ['s']),
												renderSliderInput(getStyle('bg_hover_transition') || '0.3s', v => handleStyleChange('bg_hover_transition', v), 0.1, 3, 0.1, 's', '0.3')
											)
									);
								})()
							),

						// Content for Gradient Type
						currentBgType === 'gradient' &&
							h(
								'div',
								{ className: 'sppcfw-space-y-3.5' },
								renderColorPicker('Color 1', getStyle('bg_gradient_color1') || '#9333ea', v => handleStyleChange('bg_gradient_color1', v), '#9333ea'),
								renderColorPicker('Color 2', getStyle('bg_gradient_color2') || '#3b82f6', v => handleStyleChange('bg_gradient_color2', v), '#3b82f6'),
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
									h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Gradient Type'),
									h(
										'select',
										{
											className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36',
											value: getStyle('bg_gradient_type') || 'Linear',
											onChange: e => handleStyleChange('bg_gradient_type', e.target.value)
										},
										['Linear', 'Radial'].map(gt => h('option', { key: gt, value: gt }, gt))
									)
								),
								getStyle('bg_gradient_type') !== 'Radial' &&
									h(
										'div',
										{ className: 'sppcfw-space-y-1.5' },
										renderControlHeader('Angle', true, 'deg', () => {}, ['deg']),
										renderSliderInput(getStyle('bg_gradient_angle') || '180deg', v => handleStyleChange('bg_gradient_angle', v), 0, 360, 1, 'deg', '180')
									)
							)
					)
				),
				renderAccordion(
					'border',
					'Border & Radius',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Border Type'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36',
									value: getStyle('border_type') || 'None',
									onChange: e => {
										const val = e.target.value;
										const currentW = getStyle('border_width');
										const updates = { border_type: val };
										if (val !== 'None') {
											if (!currentW || currentW === '0px' || currentW === '0') {
												updates.border_width = val === 'Double' ? '3px' : '1px';
											} else if (val === 'Double' && (parseFloat(currentW) < 3 || currentW === '1px' || currentW === '2px')) {
												updates.border_width = '3px';
											}
											if (!getStyle('border_color') || getStyle('border_color') === 'transparent') {
												updates.border_color = '#374151';
											}
										}
										handleMultiStyleChange(updates);
									},
								},
								['None', 'Solid', 'Double', 'Dotted', 'Dashed'].map(bt => h('option', { key: bt, value: bt }, bt))
							)
						),
						(getStyle('border_type') && getStyle('border_type') !== 'None') &&
							h(
								'div',
								{ className: 'sppcfw-space-y-3' },
								renderControlHeader('Border Width', true, widthUnit, setWidthUnit, ['px']),
								renderSliderInput(getStyle('border_width') || (getStyle('border_type') === 'Double' ? '3px' : '1px'), v => handleStyleChange('border_width', v), 1, 20, 1, 'px'),
								renderColorPicker('Border Color', getStyle('border_color') || '#374151', v => handleStyleChange('border_color', v), '#374151')
							),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px', '%']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2b. Typography & Text Style Section (Product Title, Heading, Text Editor, Short Desc, Meta)
		function renderTypographyStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'typography',
					'Typography',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Text Color', getStyle('text_color'), v => handleStyleChange('text_color', v), '#111827'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Font Size', true, widthUnit, setWidthUnit, ['px', 'rem', 'em']),
						renderSliderInput(getStyle('font_size') || '16px', v => handleStyleChange('font_size', v), 10, 80, 1, widthUnit, '16')
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Font Family'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-w-44',
									value: getStyle('font_family') || 'Inherit',
									onChange: e => handleStyleChange('font_family', e.target.value),
								},
								['Inherit', 'Inter', 'Roboto', 'Outfit', 'Poppins', 'Montserrat', 'JetBrains Mono', 'Georgia', 'Arial'].map(f => h('option', { key: f, value: f }, f))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Font Weight'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-w-44',
									value: getStyle('font_weight') || 'Default',
									onChange: e => handleStyleChange('font_weight', e.target.value),
								},
								[
									{ val: 'Default', label: 'Default' },
									{ val: '400', label: 'Normal (400)' },
									{ val: '500', label: 'Medium (500)' },
									{ val: '600', label: 'Semi-Bold (600)' },
									{ val: '700', label: 'Bold (700)' },
									{ val: '800', label: 'Extra-Bold (800)' },
								].map(fw => h('option', { key: fw.val, value: fw.val }, fw.label))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Line Height', true, heightUnit, setHeightUnit, ['px', 'em']),
						renderSliderInput(getStyle('line_height') || '', v => handleStyleChange('line_height', v), 12, 100, 1, heightUnit, 'Normal')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
								{ value: 'justify', icon: 'format_align_justify', title: 'Justify' },
							],
							getStyle('alignment') || 'left',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				),
				renderAccordion(
					'background',
					'Background & Spacing',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Background Color', getStyle('bg_color'), v => handleStyleChange('bg_color', v), 'transparent'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Padding', true, paddingUnit, setPaddingUnit, ['px', '%']),
						renderFourBoxInput(getStyle, 'padding', handleMultiStyleChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px', '%']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2c. Price Style Panel (Product Price)
		function renderPriceStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'colors',
					'Price Colors & Sizing',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Price Color', getStyle('price_color') || getStyle('text_color'), v => {
							handleMultiStyleChange({ price_color: v, text_color: v });
						}, '#9333ea'),
						renderColorPicker('Regular Price Color', getStyle('regular_price_color'), v => handleStyleChange('regular_price_color', v), '#9ca3af'),
						renderColorPicker('Sale Price Color', getStyle('sale_price_color'), v => handleStyleChange('sale_price_color', v), '#ef4444'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Price Font Size', true, widthUnit, setWidthUnit, ['px', 'rem', 'em']),
						renderSliderInput(getStyle('font_size') || '24px', v => handleStyleChange('font_size', v), 12, 60, 1, widthUnit, '24')
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Font Weight'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-w-44',
									value: getStyle('font_weight') || '800',
									onChange: e => handleStyleChange('font_weight', e.target.value),
								},
								['400', '500', '600', '700', '800'].map(fw => h('option', { key: fw, value: fw }, fw))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'left',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				)
			);
		}

		// 2d. Add to Cart Style Panel
		function renderAddToCartStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'button_colors',
					'Button Colors',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Button Background', getStyle('btn_bg_color') || getStyle('bg_color'), v => {
							handleStyleChange('btn_bg_color', v);
						}, '#9333ea'),
						renderColorPicker('Button Text Color', getStyle('btn_text_color') || getStyle('text_color'), v => {
							handleStyleChange('btn_text_color', v);
						}, '#ffffff'),
						renderColorPicker('Hover Background', getStyle('btn_hover_bg_color'), v => handleStyleChange('btn_hover_bg_color', v), '#7e22ce'),
						renderColorPicker('Hover Text Color', getStyle('btn_hover_text_color'), v => handleStyleChange('btn_hover_text_color', v), '#ffffff')
					)
				),
				renderAccordion(
					'button_typography',
					'Typography',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Font Size', true, fontSizeUnit, setFontSizeUnit, ['px', 'rem', 'em']),
							renderSliderInput(getStyle('btn_font_size') || getStyle('font_size') || '14px', v => {
								handleMultiStyleChange({ btn_font_size: v, font_size: v });
							}, 10, 60, 1, fontSizeUnit, '14')
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Font Weight'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-w-36',
									value: getStyle('font_weight') || 'Default',
									onChange: e => handleStyleChange('font_weight', e.target.value),
								},
								h('option', { value: 'Default' }, 'Default'),
								h('option', { value: '400' }, '400 (Normal)'),
								h('option', { value: '500' }, '500 (Medium)'),
								h('option', { value: '600' }, '600 (Semi-Bold)'),
								h('option', { value: '700' }, '700 (Bold)'),
								h('option', { value: '800' }, '800 (Extra-Bold)')
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Font Family'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-w-36',
									value: getStyle('font_family') || 'Inherit',
									onChange: e => handleStyleChange('font_family', e.target.value),
								},
								h('option', { value: 'Inherit' }, 'Inherit'),
								h('option', { value: 'Inter' }, 'Inter'),
								h('option', { value: 'Roboto' }, 'Roboto'),
								h('option', { value: 'Open Sans' }, 'Open Sans'),
								h('option', { value: 'Lato' }, 'Lato'),
								h('option', { value: 'Poppins' }, 'Poppins'),
								h('option', { value: 'Montserrat' }, 'Montserrat')
							)
						)
					)
				),
				renderAccordion(
					'button_quantity',
					'Quantity Field',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Input Background', getStyle('qty_bg_color'), v => handleStyleChange('qty_bg_color', v), '#ffffff'),
						renderColorPicker('Input Text Color', getStyle('qty_text_color'), v => handleStyleChange('qty_text_color', v), '#111827'),
						renderColorPicker('Border Color', getStyle('qty_border_color'), v => handleStyleChange('qty_border_color', v), '#d1d5db'),
						renderColorPicker('+/- Buttons Background', getStyle('qty_btn_bg'), v => handleStyleChange('qty_btn_bg', v), '#f3f4f6'),
						renderColorPicker('+/- Buttons Color', getStyle('qty_btn_color'), v => handleStyleChange('qty_btn_color', v), '#374151'),
						renderColorPicker('+/- Buttons Hover BG', getStyle('qty_btn_hover_bg'), v => handleStyleChange('qty_btn_hover_bg', v), '#e5e7eb')
					)
				),
				renderAccordion(
					'button_spacing',
					'Dimensions & Spacing',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Button Padding', true, paddingUnit, setPaddingUnit, ['px']),
							renderFourBoxInput(getStyle, 'btn_padding', handleMultiStyleChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px', '%']),
							renderFourBoxInput(getStyle, 'btn_border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Items Gap', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('gap') || '12px', v => handleStyleChange('gap', v), 0, 40, 1, 'px', '12')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Alignment', true),
							renderButtonGroup(
								[
									{ value: 'left', icon: 'format_align_left', title: 'Left' },
									{ value: 'center', icon: 'format_align_center', title: 'Center' },
									{ value: 'right', icon: 'format_align_right', title: 'Right' },
								],
								getStyle('alignment') || 'left',
								v => handleStyleChange('alignment', v)
							)
						)
					)
				),
				renderAccordion(
					'variation_style',
					'Variation & Swatches Style',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Attribute Label Color', getStyle('var_label_color'), v => handleStyleChange('var_label_color', v), '#374151'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Attribute Label Size', true, fontSizeUnit, setFontSizeUnit, ['px']),
							renderSliderInput(getStyle('var_label_size') || '12px', v => handleStyleChange('var_label_size', v), 10, 24, 1, 'px', '12')
						),
						renderColorPicker('Active Swatch Accent Color', getStyle('active_swatch_color'), v => handleStyleChange('active_swatch_color', v), '#9333ea'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Swatch Size', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('swatch_size') || '36px', v => handleStyleChange('swatch_size', v), 18, 80, 1, widthUnit, '36')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Swatch Border Radius', true, radiusUnit, setRadiusUnit, ['px', '%']),
							renderSliderInput(getStyle('swatch_border_radius') || '4px', v => handleStyleChange('swatch_border_radius', v), 0, 50, 1, radiusUnit, '4')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Swatch Items Gap', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('swatch_gap') || '8px', v => handleStyleChange('swatch_gap', v), 0, 30, 1, 'px', '8')
						)
					)
				)
			);
		}

		// 2e. Rating Stars Style Panel
		function renderRatingStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'rating_stars',
					'Stars Appearance',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Star Color (Filled)', getStyle('star_color') || getStyle('text_color'), v => {
							handleMultiStyleChange({ star_color: v, text_color: v });
						}, '#f59e0b'),
						renderColorPicker('Empty Star Color', getStyle('empty_star_color'), v => handleStyleChange('empty_star_color', v), '#d1d5db'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Star Size', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('star_size') || '18px', v => handleStyleChange('star_size', v), 10, 60, 1, widthUnit, '18')
						)
					)
				),
				renderAccordion(
					'rating_text',
					'Review Count & Typography',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Text Color', getStyle('review_count_color'), v => handleStyleChange('review_count_color', v), '#6b7280'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Font Size', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('review_font_size') || '14px', v => handleStyleChange('review_font_size', v), 10, 32, 1, widthUnit, '14')
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Font Weight'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-w-36',
									value: getStyle('review_font_weight') || 'Default',
									onChange: e => handleStyleChange('review_font_weight', e.target.value),
								},
								h('option', { value: 'Default' }, 'Default'),
								h('option', { value: '300' }, '300 (Light)'),
								h('option', { value: '400' }, '400 (Normal)'),
								h('option', { value: '500' }, '500 (Medium)'),
								h('option', { value: '600' }, '600 (Semi-Bold)'),
								h('option', { value: '700' }, '700 (Bold)'),
								h('option', { value: '800' }, '800 (Extra-Bold)')
							)
						)
					)
				),
				renderAccordion(
					'rating_layout',
					'Layout & Alignment',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Space Between (Gap)', true, widthUnit, setWidthUnit, ['px']),
							renderSliderInput(getStyle('gap') || '8px', v => handleStyleChange('gap', v), 0, 40, 1, widthUnit, '8')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Alignment', true),
							renderButtonGroup(
								[
									{ value: 'left', icon: 'format_align_left', title: 'Left' },
									{ value: 'center', icon: 'format_align_center', title: 'Center' },
									{ value: 'right', icon: 'format_align_right', title: 'Right' },
								],
								getStyle('alignment') || 'left',
								v => handleStyleChange('alignment', v)
							)
						)
					)
				)
			);
		}

		// 2f. Image & Product Gallery Style Panel
		function renderImageStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'image',
					'Image Sizing & Alignment',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'center',
							v => handleStyleChange('alignment', v)
						)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Width', true, imgWidthUnit, setImgWidthUnit, ['%', 'px', 'vw']),
						renderSliderInput(getStyle('width') || '100%', v => handleStyleChange('width', v), 0, 100, 1, imgWidthUnit)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Max Width', true, maxImgWidthUnit, setMaxImgWidthUnit, ['%', 'px', 'vw']),
						renderSliderInput(getStyle('max_width') || '100%', v => handleStyleChange('max_width', v), 0, 100, 1, maxImgWidthUnit)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Height', true, imgHeightUnit, setImgHeightUnit, ['px', 'vh', '%']),
						renderSliderInput(getStyle('height') || '', v => handleStyleChange('height', v), 0, 800, 1, imgHeightUnit, 'Auto')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Opacity', false),
						renderSliderInput(getStyle('opacity') || '1', v => handleStyleChange('opacity', v), 0, 1, 0.05, '')
						)
					)
				),
				renderAccordion(
					'border',
					'Border & Box Shadow',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Border Type'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36',
									value: getStyle('border_type') || 'Default',
									onChange: e => handleStyleChange('border_type', e.target.value),
								},
								['Default', 'None', 'Solid', 'Double', 'Dotted', 'Dashed'].map(bt => h('option', { key: bt, value: bt }, bt))
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px', '%']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2g. Product Description & Tabs Style Panel
		function renderProductDescriptionStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'typography',
					'Tabs Appearance',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Tab Heading Color', getStyle('text_color'), v => handleStyleChange('text_color', v), '#111827'),
						renderColorPicker('Active Tab Highlight', getStyle('active_tab_color'), v => handleStyleChange('active_tab_color', v), '#9333ea'),
						renderColorPicker('Panel Background', getStyle('bg_color'), v => handleStyleChange('bg_color', v), '#f9fafb'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Content Padding', true, paddingUnit, setPaddingUnit, ['px']),
						renderFourBoxInput(getStyle, 'padding', handleMultiStyleChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2h. Product Meta Style Panel
		function renderProductMetaStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'typography',
					'Meta Text Styles',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Label Color', getStyle('label_color'), v => handleStyleChange('label_color', v), '#111827'),
						renderColorPicker('Value / Link Color', getStyle('text_color'), v => handleStyleChange('text_color', v), '#6b7280'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Font Size', true, widthUnit, setWidthUnit, ['px']),
						renderSliderInput(getStyle('font_size') || '13px', v => handleStyleChange('font_size', v), 10, 24, 1, widthUnit, '13')
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Item Gap', true, gapsUnit, setGapsUnit, ['px']),
						renderSliderInput(getStyle('gap') || '6px', v => handleStyleChange('gap', v), 0, 30, 1, gapsUnit, '6')
						)
					)
				)
			);
		}

		// 2i. Custom Message Banner Style Panel
		function renderCustomMessageStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'colors',
					'Banner Colors & Border',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Background Color', getStyle('bg_color'), v => handleStyleChange('bg_color', v), '#faf5ff'),
						renderColorPicker('Text Color', getStyle('text_color'), v => handleStyleChange('text_color', v), '#7e22ce'),
						renderColorPicker('Accent Border Color', getStyle('border_color'), v => handleStyleChange('border_color', v), '#9333ea'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Padding', true, paddingUnit, setPaddingUnit, ['px']),
						renderFourBoxInput(getStyle, 'padding', handleMultiStyleChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2j. Plus/Minus Stepper Style Panel
		function renderPlusMinusStepperStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'button',
					'Stepper Buttons & Input',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Button Background', getStyle('btn_bg_color') || getStyle('bg_color'), v => {
							handleStyleChange('btn_bg_color', v);
							handleStyleChange('bg_color', v);
						}, '#f3f4f6'),
						renderColorPicker('Button Text Color', getStyle('btn_text_color') || getStyle('text_color'), v => {
							handleStyleChange('btn_text_color', v);
							handleStyleChange('text_color', v);
						}, '#111827'),
						renderColorPicker('Border Color', getStyle('border_color'), v => handleStyleChange('border_color', v), '#d1d5db'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						)
					)
				)
			);
		}

		// 2k. Generic Product Style Panel (Related, Upsell, Swatches, etc.)
		function renderGenericProductStyle() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'typography',
					'Style & Colors',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						renderColorPicker('Primary Color', getStyle('text_color'), v => handleStyleChange('text_color', v), '#111827'),
						renderColorPicker('Background Color', getStyle('bg_color'), v => handleStyleChange('bg_color', v), 'transparent'),
						renderColorPicker('Border Color', getStyle('border_color'), v => handleStyleChange('border_color', v), '#e5e7eb'),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Padding', true, paddingUnit, setPaddingUnit, ['px']),
						renderFourBoxInput(getStyle, 'padding', handleMultiStyleChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Border Radius', true, radiusUnit, setRadiusUnit, ['px']),
						renderFourBoxInput(getStyle, 'border_radius', handleMultiStyleChange, radiusUnit, isRadiusLinked, setIsRadiusLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Alignment', true),
						renderButtonGroup(
							[
								{ value: 'left', icon: 'format_align_left', title: 'Left' },
								{ value: 'center', icon: 'format_align_center', title: 'Center' },
								{ value: 'right', icon: 'format_align_right', title: 'Right' },
							],
							getStyle('alignment') || 'left',
							v => handleStyleChange('alignment', v)
						)
						)
					)
				)
			);
		}

		// Dispatcher for Style Panel based on element type
		function renderElementStylePanel() {
			if (isContainer || isColumn) {
				return renderContainerStyle();
			}
			if (isImage) {
				return renderImageStyle();
			}
			switch (selectedElement.type) {
				case 'product_title':
				case 'heading':
				case 'text_editor':
				case 'product_short_desc':
					return renderTypographyStyle();
				case 'html_code':
				case 'custom_html':
					return renderGenericProductStyle();
				case 'product_price':
					return renderPriceStyle();
				case 'product_add_to_cart':
					return renderAddToCartStyle();
				case 'product_rating':
					return renderRatingStyle();
				case 'product_description':
					return renderProductDescriptionStyle();
				case 'product_meta':
				case 'product_meta_item':
					return renderProductMetaStyle();
				case 'custom_message':
					return renderCustomMessageStyle();
				case 'plus_minus_buttons':
					return renderPlusMinusStepperStyle();
				default:
					return renderGenericProductStyle();
			}
		}

		// Dispatcher for Content Panel based on element type
		function renderElementContentPanel() {
			if (isContainer) {
				return renderContainerContent();
			}
			if (isColumn) {
				return renderColumnContent();
			}
			if (isCustomImage) {
				return renderImageContent();
			}
			if (isProductGallery) {
				return renderProductGalleryContent();
			}
			if (selectedElement.type === 'product_title') {
				return renderProductTitleContent();
			}
			if (selectedElement.type === 'product_price') {
				return renderProductPriceContent();
			}
			if (isHeading) {
				return renderHeadingContent();
			}
			if (isTextEditor) {
				return renderTextEditorContent();
			}
			if (isHtmlCode) {
				return renderHtmlCodeContent();
			}
			if (selectedElement.type === 'product_add_to_cart') {
				return renderAddToCartContent();
			}
			// All other Product Elements have dedicated Dynamic Info Card
			return renderProductElementDynamicCard();
		}

		// 1h-2. HTML / Code Element Content Panel (HTML, CSS, JS)
		function renderHtmlCodeContent() {
			const htmlVal = getSetting('html_content') !== undefined ? getSetting('html_content') : (getSetting('code') || '');
			const cssVal = getSetting('custom_css') || '';
			const jsVal = getSetting('custom_js') || '';

			const htmlError = validateHtmlSyntax(htmlVal);
			const cssError = validateCssSyntax(cssVal);
			const jsError = validateJsSyntax(jsVal);

			const handleCopy = (text, tabKey) => {
				if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(text || '');
					setCopiedTab(tabKey);
					setTimeout(() => setCopiedTab(null), 2000);
				}
			};

			const handleKeyDownTab = (e, settingKey) => {
				if (e.key === 'Tab') {
					e.preventDefault();
					const start = e.target.selectionStart;
					const end = e.target.selectionEnd;
					const val = e.target.value;
					const newVal = val.substring(0, start) + '  ' + val.substring(end);
					handleSettingChange(settingKey, newVal);
					setTimeout(() => {
						if (e.target) {
							e.target.selectionStart = e.target.selectionEnd = start + 2;
						}
					}, 0);
				}
			};

			const activeVal = codeTab === 'html' ? htmlVal : codeTab === 'css' ? cssVal : jsVal;
			const charCount = (activeVal || '').length;
			const lineCount = activeVal ? activeVal.split('\n').length : 1;

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },

				// Code Studio Hero Card
				h(
					'div',
					{ className: 'sppcfw-p-3.5 sppcfw-rounded-xl sppcfw-bg-gradient-to-br sppcfw-from-[#18182f] sppcfw-to-[#121c2a] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-shadow-sm sppcfw-space-y-1.5' },
					h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-text-xs sppcfw-font-bold sppcfw-text-purple-300' },
							h('div', { className: 'sppcfw-w-6 sppcfw-h-6 sppcfw-rounded-md sppcfw-bg-purple-500/20 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-text-purple-300' },
								h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'code')
							),
							'Custom Code Studio'
						),
						h('span', { className: 'sppcfw-px-2 sppcfw-py-0.5 sppcfw-text-[10px] sppcfw-font-bold sppcfw-rounded-full sppcfw-bg-emerald-500/15 sppcfw-text-emerald-400 sppcfw-border sppcfw-border-emerald-500/30' }, '● Live Preview')
					),
					h('p', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-leading-relaxed' },
						'Write custom HTML markup, scoped CSS rules, and JavaScript logic. Code is rendered and executed in real-time in the canvas preview.'
					)
				),

				// Code Language Switcher Tabs
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-bg-[#111827] sppcfw-p-1 sppcfw-rounded-lg sppcfw-border sppcfw-border-[#374151] sppcfw-gap-1' },
					[
						{ id: 'html', label: 'HTML Markup', icon: 'html', color: 'sppcfw-text-cyan-400', activeClass: 'sppcfw-bg-cyan-500/20 sppcfw-text-cyan-300 sppcfw-border-cyan-500/40', hasError: !!htmlError },
						{ id: 'css', label: 'CSS Styles', icon: 'css', color: 'sppcfw-text-pink-400', activeClass: 'sppcfw-bg-pink-500/20 sppcfw-text-pink-300 sppcfw-border-pink-500/40', hasError: !!cssError },
						{ id: 'js', label: 'JavaScript', icon: 'javascript', color: 'sppcfw-text-amber-400', activeClass: 'sppcfw-bg-amber-500/20 sppcfw-text-amber-300 sppcfw-border-amber-500/40', hasError: !!jsError },
					].map(tab =>
						h(
							'button',
							{
								key: tab.id,
								type: 'button',
								className: `sppcfw-flex-1 sppcfw-py-1.5 sppcfw-px-2 sppcfw-text-xs sppcfw-font-bold sppcfw-rounded-md sppcfw-transition-all sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-cursor-pointer sppcfw-border ${
									codeTab === tab.id
										? tab.activeClass + ' sppcfw-shadow-sm'
										: 'sppcfw-border-transparent sppcfw-text-gray-400 hover:sppcfw-text-white hover:sppcfw-bg-[#1f2937]'
								} ${tab.hasError ? 'sppcfw-border-red-500/60 sppcfw-bg-red-950/20' : ''}`,
								onClick: () => setCodeTab(tab.id),
							},
							h('span', { className: `material-symbols-outlined sppcfw-text-sm ${tab.color}` }, tab.icon),
							tab.label,
							tab.hasError && h('span', { className: 'sppcfw-text-[10px] sppcfw-leading-none sppcfw-text-red-400 font-bold sppcfw-animate-pulse', title: 'Syntax Error in this tab' }, '⚠️')
						)
					)
				),

				// Editor Actions & Stats Bar
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-px-0.5' },
					h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 font-mono sppcfw-text-[10px] sppcfw-text-gray-400' },
						h('span', { className: 'sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded' }, `${charCount} chars`),
						h('span', { className: 'sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded' }, `${lineCount} lines`)
					),
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#374151] hover:sppcfw-border-purple-400 sppcfw-text-[10px] sppcfw-font-bold sppcfw-text-gray-300 hover:sppcfw-text-white sppcfw-transition-all sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-cursor-pointer',
								onClick: () => handleCopy(activeVal, codeTab),
								title: 'Copy Code',
							},
							h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, copiedTab === codeTab ? 'check' : 'content_copy'),
							copiedTab === codeTab ? 'Copied!' : 'Copy'
						),
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#374151] hover:sppcfw-border-red-500 sppcfw-text-[10px] sppcfw-font-bold sppcfw-text-gray-400 hover:sppcfw-text-red-300 sppcfw-transition-all sppcfw-cursor-pointer',
								onClick: () => {
									if (codeTab === 'html') handleSettingChange('html_content', '');
									else if (codeTab === 'css') handleSettingChange('custom_css', '');
									else if (codeTab === 'js') handleSettingChange('custom_js', '');
								},
								title: 'Clear code',
							},
							'Clear'
						)
					)
				),

				// Code Tab: HTML Editor
				codeTab === 'html' &&
					renderAccordion(
						'html_editor',
						'HTML Code / Markup',
						h(
							'div',
							{ className: 'sppcfw-space-y-2' },
							h('textarea', {
								className: `sppcfw-w-full sppcfw-h-56 sppcfw-rounded-lg sppcfw-p-3 font-mono sppcfw-text-xs sppcfw-leading-relaxed focus:sppcfw-outline-none custom-scrollbar sppcfw-resize-y ${
									htmlError
										? 'sppcfw-border-2 sppcfw-border-red-500 sppcfw-ring-1 sppcfw-ring-red-500 sppcfw-bg-[#1a0c0e] sppcfw-text-red-200'
										: 'sppcfw-bg-[#090d16] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-cyan-400 focus:sppcfw-ring-1 focus:sppcfw-ring-cyan-400 sppcfw-text-cyan-200'
								}`,
								placeholder: '<div class="custom-card">\n  <h3>Your Heading</h3>\n  <p>Your HTML content...</p>\n</div>',
								value: htmlVal,
								onChange: e => handleSettingChange('html_content', e.target.value),
								onKeyDown: e => handleKeyDownTab(e, 'html_content'),
								spellCheck: false,
								autoCapitalize: 'off',
								autoComplete: 'off',
								autoCorrect: 'off',
							}),
							htmlError &&
								h(
									'div',
									{ className: 'sppcfw-p-2.5 sppcfw-bg-red-950/60 sppcfw-border sppcfw-border-red-500/70 sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-red-200 sppcfw-flex sppcfw-items-start sppcfw-gap-2 sppcfw-shadow-sm' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-red-400 sppcfw-shrink-0 sppcfw-mt-0.5' }, 'error'),
									h(
										'div',
										{ className: 'sppcfw-space-y-0.5 sppcfw-flex-1' },
										h('div', { className: 'sppcfw-font-bold sppcfw-text-red-300' }, 'HTML Code Error (Fix to allow Save/Publish)'),
										h('div', { className: 'sppcfw-text-[10px] sppcfw-text-red-200/90 font-mono' }, htmlError)
									)
								),
							h('div', { className: 'sppcfw-p-2.5 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-space-y-1' },
								h('div', { className: 'sppcfw-font-bold sppcfw-text-cyan-300 sppcfw-flex sppcfw-items-center sppcfw-gap-1' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'info'),
									'HTML & Shortcode Tips'
								),
								h('p', { className: 'sppcfw-text-[10px] sppcfw-leading-relaxed' }, 'You can include standard HTML tags, svg icons, inline tags, or WordPress / WooCommerce shortcodes (e.g. [add_to_cart id="..."], [product_categories]).')
							)
						)
					),

				// Code Tab: CSS Editor
				codeTab === 'css' &&
					renderAccordion(
						'css_editor',
						'Custom CSS Styles',
						h(
							'div',
							{ className: 'sppcfw-space-y-2' },
							h('textarea', {
								className: `sppcfw-w-full sppcfw-h-56 sppcfw-rounded-lg sppcfw-p-3 font-mono sppcfw-text-xs sppcfw-leading-relaxed focus:sppcfw-outline-none custom-scrollbar sppcfw-resize-y ${
									cssError
										? 'sppcfw-border-2 sppcfw-border-red-500 sppcfw-ring-1 sppcfw-ring-red-500 sppcfw-bg-[#1a0c0e] sppcfw-text-red-200'
										: 'sppcfw-bg-[#090d16] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-pink-400 focus:sppcfw-ring-1 focus:sppcfw-ring-pink-400 sppcfw-text-pink-200'
								}`,
								placeholder: '/* Custom CSS Styles */\n.custom-card {\n  background: #f8fafc;\n  padding: 16px;\n  border-radius: 8px;\n}',
								value: cssVal,
								onChange: e => handleSettingChange('custom_css', e.target.value),
								onKeyDown: e => handleKeyDownTab(e, 'custom_css'),
								spellCheck: false,
								autoCapitalize: 'off',
								autoComplete: 'off',
								autoCorrect: 'off',
							}),
							cssError &&
								h(
									'div',
									{ className: 'sppcfw-p-2.5 sppcfw-bg-red-950/60 sppcfw-border sppcfw-border-red-500/70 sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-red-200 sppcfw-flex sppcfw-items-start sppcfw-gap-2 sppcfw-shadow-sm' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-red-400 sppcfw-shrink-0 sppcfw-mt-0.5' }, 'error'),
									h(
										'div',
										{ className: 'sppcfw-space-y-0.5 sppcfw-flex-1' },
										h('div', { className: 'sppcfw-font-bold sppcfw-text-red-300' }, 'CSS Syntax Error (Fix to allow Save/Publish)'),
										h('div', { className: 'sppcfw-text-[10px] sppcfw-text-red-200/90 font-mono' }, cssError)
									)
								),
							h('div', { className: 'sppcfw-p-2.5 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-space-y-1' },
								h('div', { className: 'sppcfw-font-bold sppcfw-text-pink-300 sppcfw-flex sppcfw-items-center sppcfw-gap-1' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'brush'),
									'CSS Rules Tips'
								),
								h('p', { className: 'sppcfw-text-[10px] sppcfw-leading-relaxed' }, 'Enter pure CSS without <style> tags. Styles apply instantly to the canvas preview and the frontend.')
							)
						)
					),

				// Code Tab: JS Editor
				codeTab === 'js' &&
					renderAccordion(
						'js_editor',
						'Custom JavaScript',
						h(
							'div',
							{ className: 'sppcfw-space-y-2' },
							h('textarea', {
								className: `sppcfw-w-full sppcfw-h-56 sppcfw-rounded-lg sppcfw-p-3 font-mono sppcfw-text-xs sppcfw-leading-relaxed focus:sppcfw-outline-none custom-scrollbar sppcfw-resize-y ${
									jsError
										? 'sppcfw-border-2 sppcfw-border-red-500 sppcfw-ring-1 sppcfw-ring-red-500 sppcfw-bg-[#1a0c0e] sppcfw-text-red-200'
										: 'sppcfw-bg-[#090d16] sppcfw-border sppcfw-border-[#374151] focus:sppcfw-border-amber-400 focus:sppcfw-ring-1 focus:sppcfw-ring-amber-400 sppcfw-text-amber-200'
								}`,
								placeholder: '// Custom JavaScript\n// Variable "container" refers to this element root\nconsole.log("Custom script ready");',
								value: jsVal,
								onChange: e => handleSettingChange('custom_js', e.target.value),
								onKeyDown: e => handleKeyDownTab(e, 'custom_js'),
								spellCheck: false,
								autoCapitalize: 'off',
								autoComplete: 'off',
								autoCorrect: 'off',
							}),
							jsError &&
								h(
									'div',
									{ className: 'sppcfw-p-2.5 sppcfw-bg-red-950/60 sppcfw-border sppcfw-border-red-500/70 sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-red-200 sppcfw-flex sppcfw-items-start sppcfw-gap-2 sppcfw-shadow-sm' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-red-400 sppcfw-shrink-0 sppcfw-mt-0.5' }, 'error'),
									h(
										'div',
										{ className: 'sppcfw-space-y-0.5 sppcfw-flex-1' },
										h('div', { className: 'sppcfw-font-bold sppcfw-text-red-300' }, 'JavaScript Syntax Error (Fix to allow Save/Publish)'),
										h('div', { className: 'sppcfw-text-[10px] sppcfw-text-red-200/90 font-mono' }, jsError)
									)
								),
							h('div', { className: 'sppcfw-p-2.5 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-md sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-space-y-1' },
								h('div', { className: 'sppcfw-font-bold sppcfw-text-amber-300 sppcfw-flex sppcfw-items-center sppcfw-gap-1' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'terminal'),
									'JavaScript Execution Tips'
								),
								h('p', { className: 'sppcfw-text-[10px] sppcfw-leading-relaxed' }, 'Enter pure JavaScript without <script> tags. The "container" argument is available to scope queries to this element.')
							)
						)
					)
			);
		}

		// 1h. Add to Cart Content Panel
		function renderAddToCartContent() {
			const varDisplayType = getSetting('variation_display_type') || 'swatches';
			const swatchShape = getSetting('swatch_shape') || 'circle';
			const showLabels = getSetting('show_attribute_labels') !== false;
			const showReset = !!getSetting('show_variation_reset');

			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'cart_general',
					'Quantity & Button Settings',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-start sppcfw-gap-3 sppcfw-p-3 sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#3b4b62] sppcfw-rounded-lg' },
							h('input', {
								type: 'checkbox',
								id: 'sppcfw_basic_enable_plus_minus_button',
								className: 'sppcfw_basic_enable_plus_minus_button sppcfw-mt-0.5 sppcfw-w-4 sppcfw-h-4 sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer',
								checked: !!enablePlusMinus,
								onChange: e => {
									const isChecked = e.target.checked;
									if (typeof setEnablePlusMinus === 'function') {
										setEnablePlusMinus(isChecked);
									}
									handleSettingChange('enable_plus_minus_button', isChecked ? 'on' : '');
									apiPost('sppcfw_update_builder_basic_setting', {
										key: 'enable_plus_minus_button',
										value: isChecked ? 'on' : '',
									});
								},
							}),
							h(
								'label',
								{ htmlFor: 'sppcfw_basic_enable_plus_minus_button', className: 'sppcfw-flex sppcfw-flex-col sppcfw-cursor-pointer' },
								h('span', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#d9e3f6]' }, 'Enable plus/minus button for quantity change'),
								h('span', { className: 'sppcfw-text-[11px] sppcfw-text-[#9ca3af] sppcfw-mt-0.5' }, 'Displays interactive + and - stepper buttons next to the quantity input on the product page.')
							)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'Change add to cart button text'),
							h('input', {
								type: 'text',
								id: 'sppcfw_basic_add_to_cart_button_text',
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
								value: (addToCartBtnText !== undefined && addToCartBtnText !== null && addToCartBtnText !== '') ? addToCartBtnText : (getSetting('button_text') || 'Add to cart'),
								placeholder: 'Add to cart',
								onChange: e => {
									const val = e.target.value;
									if (typeof setAddToCartBtnText === 'function') {
										setAddToCartBtnText(val);
									}
									handleSettingChange('button_text', val);
									apiPost('sppcfw_update_builder_basic_setting', {
										key: 'add_to_cart_button_text',
										value: val,
									});
								},
							})
						)
					)
				),
				renderAccordion(
					'variation_settings',
					'Variation Display Settings',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'Variation Display Mode'),
							h(
								'select',
								{
									className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-2 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]',
									value: varDisplayType,
									onChange: e => handleSettingChange('variation_display_type', e.target.value),
								},
								h('option', { value: 'swatches' }, '🎨 Color & Label Swatches'),
								h('option', { value: 'dropdown' }, '📋 WooCommerce Default Dropdowns'),
								h('option', { value: 'table' }, '📊 Variation Table / Grid')
							)
						),
						varDisplayType === 'swatches' &&
							h(
								'div',
								{ className: 'sppcfw-space-y-1.5' },
								h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'Swatch Shape'),
								renderButtonGroup(
									[
										{ value: 'circle', label: 'Circle' },
										{ value: 'rounded', label: 'Rounded' },
										{ value: 'square', label: 'Square' },
									],
									swatchShape,
									v => handleSettingChange('swatch_shape', v)
								)
							),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Show Attribute Labels (Color, Size)'),
							h('input', {
								type: 'checkbox',
								className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer',
								checked: showLabels,
								onChange: e => handleSettingChange('show_attribute_labels', e.target.checked),
							})
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, 'Show Variation Clear / Reset Link'),
							h('input', {
								type: 'checkbox',
								className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer',
								checked: showReset,
								onChange: e => handleSettingChange('show_variation_reset', e.target.checked),
							})
						)
					)
				)
			);
		}

		// ==========================================
		// 3. ADVANCED PANEL
		// ==========================================
		function renderElementAdvancedPanel() {
			return h(
				'div',
				{ className: 'sppcfw-space-y-4' },
				renderAccordion(
					'spacing',
					'Layout & Spacing',
					h(
						'div',
						{ className: 'sppcfw-space-y-4' },
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							renderControlHeader('Margin', true, marginUnit, setMarginUnit, ['px', '%', 'em']),
							renderFourBoxInput(getAdvanced, 'margin', handleMultiAdvancedChange, marginUnit, isMarginLinked, setIsMarginLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
						renderControlHeader('Padding', true, paddingUnit, setPaddingUnit, ['px', '%', 'em']),
						renderFourBoxInput(getAdvanced, 'padding', handleMultiAdvancedChange, paddingUnit, isPaddingLinked, setIsPaddingLinked)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							renderControlHeader('Width Mode', true),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea] sppcfw-w-36',
									value: getAdvanced('width_mode') || 'Default',
									onChange: e => handleAdvancedChange('width_mode', e.target.value),
								},
								h('option', { value: 'Default' }, 'Default'),
								h('option', { value: 'Full Width (100%)' }, 'Full Width (100%)'),
								h('option', { value: 'Inline (auto)' }, 'Inline (auto)'),
								h('option', { value: 'Custom' }, 'Custom')
							)
						),
						h('hr', { className: 'sppcfw-border-[#374151] sppcfw-my-2' }),
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							renderControlHeader('Align Self', true),
						renderButtonGroup(
							[
								{ value: 'flex-start', title: 'Start', label: 'Start' },
								{ value: 'center', title: 'Center', label: 'Center' },
								{ value: 'flex-end', title: 'End', label: 'End' },
								{ value: 'stretch', title: 'Stretch', label: 'Stretch' },
							],
							getAdvanced('align_self') || '',
							v => handleAdvancedChange('align_self', v)
						)
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1' },
							renderControlHeader('Order', true),
						renderButtonGroup(
							[
								{ value: 'start', title: 'Start', label: 'First' },
								{ value: 'end', title: 'End', label: 'Last' },
								{ value: 'custom', title: 'Custom', label: 'Custom' },
							],
							getAdvanced('order') || '',
							v => handleAdvancedChange('order', v)
						)
						)
					)
				),
				renderAccordion(
					'position',
					'Position & Attributes',
					h(
						'div',
						{ className: 'sppcfw-space-y-3.5' },
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
						h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium' }, 'Position'),
							h(
								'select',
								{
									className: 'sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-white sppcfw-w-36',
									value: getAdvanced('position') || 'Default',
									onChange: e => handleAdvancedChange('position', e.target.value),
								},
								h('option', { value: 'Default' }, 'Default'),
								h('option', { value: 'Absolute' }, 'Absolute'),
								h('option', { value: 'Fixed' }, 'Fixed')
							)
						),
						h(
							'div',
							{ className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
							renderControlHeader('Z-Index', true),
							h('input', {
								type: 'number',
								className: 'sppcfw-w-24 sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1 sppcfw-text-xs sppcfw-text-center sppcfw-text-white focus:sppcfw-outline-none',
								value: getAdvanced('z_index', true) || '',
								onChange: e => handleAdvancedChange('z_index', e.target.value, true),
							})
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'CSS ID'),
							h('input', {
								type: 'text',
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
								value: getAdvanced('css_id', true) || '',
								placeholder: 'e.g. my-custom-id',
								onChange: e => handleAdvancedChange('css_id', e.target.value, true),
							})
						),
						h(
							'div',
							{ className: 'sppcfw-space-y-1.5' },
							h('label', { className: 'sppcfw-text-xs sppcfw-text-gray-200 sppcfw-font-medium sppcfw-block' }, 'CSS Classes'),
							h('input', {
								type: 'text',
								className: 'sppcfw-w-full sppcfw-bg-[#111827] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded sppcfw-px-2.5 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white focus:sppcfw-outline-none',
								value: getAdvanced('css_classes', true) || (getAdvanced('custom_class', true) || ''),
								placeholder: 'e.g. custom-class-1 custom-class-2',
								onChange: e => {
									handleAdvancedChange('css_classes', e.target.value, true);
									handleAdvancedChange('custom_class', e.target.value, true);
								},
							})
						)
					)
				),
				renderAccordion(
					'responsive',
					'Responsive Visibility',
					h(
						'div',
						{ className: 'sppcfw-space-y-3' },
						[
							{ key: 'hide_on_desktop', label: 'Hide On Desktop' },
							{ key: 'hide_on_tablet', label: 'Hide On Tablet' },
							{ key: 'hide_on_mobile', label: 'Hide On Mobile' },
						].map(res =>
							h(
								'div',
								{ key: res.key, className: 'sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
								h('label', { className: 'sppcfw-text-xs sppcfw-text-[#d1d5db] sppcfw-font-medium' }, res.label),
								h('input', {
									type: 'checkbox',
									className: 'sppcfw-accent-[#9333ea] sppcfw-w-4 sppcfw-h-4 sppcfw-cursor-pointer',
									checked: !!getAdvanced(res.key, true),
									onChange: e => handleAdvancedChange(res.key, e.target.checked, true),
								})
							)
						)
					)
				)
			);
		}

		// Render Main Inspector Sidebar Shell
		return h(
			'aside',
			{ className: 'sppcfw-w-[340px] sppcfw-bg-[#1f2937] sppcfw-border-r sppcfw-border-[#374151] sppcfw-flex sppcfw-flex-col sppcfw-ml-[64px] sppcfw-z-30 sppcfw-h-full sppcfw-overflow-hidden sppcfw-shadow-xl sppcfw-select-none' },

			// Inspector Header
			h(
				'div',
				{ className: 'sppcfw-border-b sppcfw-border-[#374151] sppcfw-bg-[#121c2a]' },
				h(
					'div',
					{ className: 'sppcfw-p-3 sppcfw-flex sppcfw-justify-between sppcfw-items-center sppcfw-border-b sppcfw-border-[#212b39]' },
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-overflow-hidden' },
						h(
							'button',
							{
								className: 'sppcfw-text-[#9ca3af] hover:sppcfw-text-white sppcfw-p-1 sppcfw-rounded hover:sppcfw-bg-[#212b39] sppcfw-transition-colors',
								onClick: closeInspector,
								title: 'Back to Elements',
							},
							'←'
						),
						h('h2', { className: 'sppcfw-font-bold sppcfw-text-xs sppcfw-text-[#ffffff] sppcfw-truncate sppcfw-max-w-[130px]' }, panelTitle),
						h(
							'span',
							{
								className: `sppcfw-text-[10px] sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-font-bold sppcfw-uppercase sppcfw-border sppcfw-flex sppcfw-items-center sppcfw-gap-1 ${
									deviceView === 'mobile'
										? 'sppcfw-bg-amber-500/20 sppcfw-text-amber-300 sppcfw-border-amber-500/40'
										: deviceView === 'tablet'
										? 'sppcfw-bg-blue-500/20 sppcfw-text-blue-300 sppcfw-border-blue-500/40'
										: 'sppcfw-bg-purple-500/20 sppcfw-text-purple-300 sppcfw-border-purple-500/40'
								}`,
							},
							deviceView === 'mobile' ? '📱 Mobile' : deviceView === 'tablet' ? '📱 Tablet' : '🖥 Desktop'
						)
					),
					h(
						'button',
						{
							className: 'sppcfw-text-[#9ca3af] hover:sppcfw-text-white sppcfw-font-bold sppcfw-text-sm sppcfw-px-2',
							onClick: closeInspector,
							title: 'Close Inspector',
						},
						'✕'
					)
				),

				// 3 Tabs Header: Layout/Content | Style | Advanced
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-text-xs sppcfw-font-semibold sppcfw-bg-[#16202e] sppcfw-border-b sppcfw-border-[#374151]' },
					h(
						'button',
						{
							className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-border-b-2 sppcfw-transition-colors ${
								activeTab === 'layout' || activeTab === 'content' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('layout'),
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, firstTabIcon),
						firstTabLabel
					),
					h(
						'button',
						{
							className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-border-b-2 sppcfw-transition-colors ${
								activeTab === 'style' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('style'),
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'contrast'),
						'Style'
					),
					h(
						'button',
						{
							className: `sppcfw-flex-1 sppcfw-py-2.5 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-gap-1.5 sppcfw-border-b-2 sppcfw-transition-colors ${
								activeTab === 'advanced' ? 'sppcfw-border-white sppcfw-text-white sppcfw-bg-[#1f2937]' : 'sppcfw-border-transparent sppcfw-text-[#9ca3af] hover:sppcfw-text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('advanced'),
						},
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'settings'),
						'Advanced'
					)
				)
			),

			// Inspector Body Content
			h(
				'div',
				{ className: 'sppcfw-p-4 sppcfw-overflow-y-auto custom-scrollbar sppcfw-space-y-4 sppcfw-flex-1 sppcfw-text-xs' },
				(activeTab === 'layout' || activeTab === 'content') && renderElementContentPanel(),
				activeTab === 'style' && renderElementStylePanel(),
				activeTab === 'advanced' && renderElementAdvancedPanel()
			)
		);
	}

	// 4. Central Canvas Component with Viewport Preview
	function CentralCanvas({ deviceView, elements, setElements, selectedElementId, setSelectedElementId, sampleData, pageSettings, removeElement, addWidgetToTarget, addColumnToContainer, duplicateColumn, openElementsTab, isStructureOpen, setIsStructureOpen }) {
		const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
		const [isAddingContainer, setIsAddingContainer] = useState(false);

		function handleSelectPreset(presetType) {
			const newContainer = createContainerStructure(presetType);
			setElements(prev => [...prev, newContainer]);
			setSelectedElementId(newContainer.id);
			setIsAddingContainer(false);
		}

		return h(
			'main',
			{ className: 'sppcfw-flex-1 sppcfw-bg-[#0f172a] sppcfw-relative sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-w-full sppcfw-overflow-hidden sppcfw-h-full' },

			// Outer Canvas Container
			h(
				'div',
				{
					className: `sppcfw-preview-canvas-container sppcfw-bg-[#ffffff] sppcfw-text-[#111827] sppcfw-pb-16 sppcfw-h-[calc(100vh)] sppcfw-overflow-y-auto custom-scrollbar ${
						isCanvasDragOver ? 'sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#9333ea] sppcfw-bg-[#faf5ff]' : 'sppcfw-border-[#e5e7eb]'
					} ${deviceView === 'tablet' ? 'sppcfw-preview-viewport-tablet' : deviceView === 'mobile' ? 'sppcfw-preview-viewport-mobile' : 'sppcfw-preview-viewport-desktop'} sppcfw-transition-all`,
				},

				// Empty Canvas View (when elements.length === 0)
				elements.length === 0
					? isAddingContainer
						? h(LayoutStructureChooser, {
								onSelectPreset: handleSelectPreset,
								onClose: () => setIsAddingContainer(false),
						  })
						: h(
								'div',
								{
									className: 'sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-min-h-[450px] sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#9333ea]/40 sppcfw-rounded-xl sppcfw-p-12 sppcfw-text-center sppcfw-bg-[#faf5ff] sppcfw-cursor-pointer hover:sppcfw-border-[#9333ea] sppcfw-transition-all sppcfw-tab-group',
									onClick: () => setIsAddingContainer(true),
								},
								h('div', { className: 'sppcfw-w-16 sppcfw-h-16 sppcfw-rounded-full sppcfw-bg-[#9333ea]/10 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-mb-4 group-hover:sppcfw-scale-110 sppcfw-transition-transform' }, h('span', { className: 'material-symbols-outlined sppcfw-text-4xl sppcfw-text-[#9333ea]' }, 'add_circle')),
								h('h2', { className: 'sppcfw-text-2xl sppcfw-font-extrabold sppcfw-text-[#111827] sppcfw-mb-2' }, 'Select Layout Structure'),
								h('p', { className: 'sppcfw-text-sm sppcfw-text-[#6b7280] sppcfw-max-w-md sppcfw-mb-6' }, 'Choose a Layout Structure (Flexbox or Grid) to start building your single product page layout.'),
								h(
									'button',
									{
										className: 'sppcfw-px-6 sppcfw-py-2.5 sppcfw-bg-[#9333ea] hover:sppcfw-bg-[#7e22ce] sppcfw-text-white sppcfw-rounded-lg sppcfw-font-bold sppcfw-shadow-lg sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-text-sm sppcfw-transition-all sppcfw-cursor-pointer',
										onClick: e => {
											e.stopPropagation();
											setIsAddingContainer(true);
										},
									},
									h('span', { className: 'material-symbols-outlined sppcfw-text-lg' }, 'add'),
									'Add Layout / Container'
								)
						  )
					: h(
							'div',
							{ className: 'sppcfw-space-y-6 sppcfw-w-full' },
							elements.map((container, cIdx) =>
								h(CanvasContainerRenderer, {
									key: container.id,
									container,
									cIdx,
									elements,
									setElements,
									selectedElementId,
									setSelectedElementId,
									removeElement,
									sampleData,
									pageSettings,
									addWidgetToTarget,
									addColumnToContainer,
									duplicateColumn,
									openElementsTab,
									openStructureChooser: () => setIsAddingContainer(true),
									deviceView,
								})
							),

							// Add Container Section Bottom Action Bar
							isAddingContainer
								? h(LayoutStructureChooser, {
										onSelectPreset: handleSelectPreset,
										onClose: () => setIsAddingContainer(false),
								  })
								: h(
										'div',
										{
											className: 'sppcfw-py-4 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#d1d5db] hover:sppcfw-border-[#9333ea] sppcfw-rounded-lg sppcfw-text-center sppcfw-cursor-pointer sppcfw-bg-[#f9fafb] hover:sppcfw-bg-[#faf5ff] sppcfw-transition-all sppcfw-flex sppcfw-justify-center sppcfw-items-center sppcfw-gap-2 sppcfw-tab-group sppcfw-mx-auto sppcfw-max-w-[45rem]',
											onClick: () => setIsAddingContainer(true),
										},
										h('span', { className: 'material-symbols-outlined sppcfw-text-xl sppcfw-text-[#9333ea] group-hover:sppcfw-scale-125 sppcfw-transition-transform' }, 'add_circle'),
										h('span', { className: 'sppcfw-text-sm sppcfw-font-bold sppcfw-text-[#4b5563] group-hover:sppcfw-text-[#9333ea]' }, 'Add Container Section')
								  )
					  )
			),

			// Breadcrumb Footer
			h(
				'div',
				{ className: 'sppcfw-fixed sppcfw-bottom-4 sppcfw-left-[420px] sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#4d4354] sppcfw-rounded sppcfw-px-3 sppcfw-py-1 sppcfw-text-xs font-mono sppcfw-text-[#cfc2d7] sppcfw-z-20 sppcfw-shadow-md' },
				'Layout > ' + (findElementInTree(elements, selectedElementId)?.label || 'Empty Selection')
			)
		);
	}

	// 5. Right Floating Structure Panel (Dockable Window - Draggable bounded to workspace & Vertically Resizable)
	function FloatingStructurePanel({ elements, setElements, selectedElementId, setSelectedElementId, removeElement, openElementsTab, closeStructure, deviceView = 'desktop' }) {
		const [isCollapsed, setIsCollapsed] = useState(false);
		const [position, setPosition] = useState({ top: 16, left: null, right: 16 });
		const [isDragging, setIsDragging] = useState(false);
		const [contentHeight, setContentHeight] = useState(280);
		const [isResizing, setIsResizing] = useState(false);

		const panelRef = useRef(null);
		const contentRef = useRef(null);
		const dragRef = useRef({ startX: 0, startY: 0, initialTop: 16, initialLeft: null });
		const resizeRef = useRef({ startY: 0, startHeight: 280 });

		// Drag handler for moving the panel anywhere
		const handleMouseDown = (e) => {
			if (e.target.closest('button')) return;
			if (!panelRef.current) return;

			const panelEl = panelRef.current;
			const workspaceEl = panelEl.closest('.sppcfw-builder-workspace') || document.body;
			const wsRect = workspaceEl.getBoundingClientRect();
			const panelRect = panelEl.getBoundingClientRect();

			setIsDragging(true);
			dragRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				initialTop: panelRect.top - wsRect.top,
				initialLeft: panelRect.left - wsRect.left,
			};
		};

		// Resize handler for vertical dragging
		const handleResizeMouseDown = (e) => {
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);
			const currentH = contentRef.current ? contentRef.current.offsetHeight : contentHeight;
			resizeRef.current = {
				startY: e.clientY,
				startHeight: currentH,
			};
		};

		// Mouse move & mouse up listeners for moving panel
		useEffect(() => {
			if (!isDragging) return;

			const handleMouseMove = (e) => {
				if (!panelRef.current) return;

				const dx = e.clientX - dragRef.current.startX;
				const dy = e.clientY - dragRef.current.startY;

				let newTop = dragRef.current.initialTop + dy;
				let newLeft = dragRef.current.initialLeft + dx;

				const workspaceEl = panelRef.current.closest('.sppcfw-builder-workspace') || document.body;
				const wsWidth = workspaceEl.clientWidth || window.innerWidth;
				const wsHeight = workspaceEl.clientHeight || window.innerHeight;
				const panelWidth = panelRef.current.offsetWidth || 288;
				const panelHeight = panelRef.current.offsetHeight || 300;

				const minTop = 8;
				const maxTop = Math.max(minTop, wsHeight - 40); // Keep header reachable
				const minLeft = 8;
				const maxLeft = Math.max(minLeft, wsWidth - panelWidth - 8);

				newTop = Math.max(minTop, Math.min(maxTop, newTop));
				newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));

				setPosition({ top: newTop, left: newLeft });
			};

			const handleMouseUp = () => {
				setIsDragging(false);
			};

			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}, [isDragging]);

		// Mouse move & mouse up listeners for resizing panel vertically
		useEffect(() => {
			if (!isResizing) return;

			const handleMouseMove = (e) => {
				const dy = e.clientY - resizeRef.current.startY;
				let newHeight = resizeRef.current.startHeight + dy;

				// Strictly limited to max-h-400 (between 100px and 400px)
				newHeight = Math.max(100, Math.min(400, newHeight));
				setContentHeight(newHeight);
			};

			const handleMouseUp = () => {
				setIsResizing(false);
			};

			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}, [isResizing]);

		const panelStyle = position.left !== undefined && position.left !== null
			? { top: `${position.top}px`, left: `${position.left}px`, right: 'auto', position: 'absolute' }
			: { top: '16px', right: '16px', position: 'absolute' };

		return h(
			'aside',
			{
				ref: panelRef,
				className: `sppcfw-floating-structure-panel floating-structure-panel sppcfw-absolute sppcfw-z-40 sppcfw-w-72 sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#4d4354] sppcfw-rounded-lg sppcfw-shadow-2xl sppcfw-overflow-hidden sppcfw-flex sppcfw-flex-col sppcfw-text-[#d9e3f6] sppcfw-select-none ${
					isDragging ? 'dragging sppcfw-opacity-95 sppcfw-shadow-[0_20px_35px_rgba(0,0,0,0.6)]' : ''
				}`,
				style: panelStyle,
			},
			// Header Drag Handle
			h(
				'div',
				{
					className: 'sppcfw-p-3 sppcfw-bg-[#121c2a] sppcfw-border-b sppcfw-border-[#374151] sppcfw-flex sppcfw-justify-between sppcfw-items-center sppcfw-cursor-move sppcfw-select-none',
					onMouseDown: handleMouseDown,
					title: 'Drag to move panel',
				},
				h(
					'h3',
					{ className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-pointer-events-none' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#9333ea]' }, 'account_tree'),
					'Structure'
				),
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1' },
					h(
						'button',
						{
							type: 'button',
							className: 'sppcfw-text-xs sppcfw-text-[#cfc2d7] hover:sppcfw-text-white sppcfw-font-bold sppcfw-p-1 sppcfw-rounded hover:sppcfw-bg-[#212b39]',
							onClick: () => setIsCollapsed(!isCollapsed),
							title: isCollapsed ? 'Expand' : 'Collapse',
						},
						isCollapsed ? '□' : '–'
					),
					h(
						'button',
						{
							type: 'button',
							className: 'sppcfw-text-xs sppcfw-text-[#cfc2d7] hover:sppcfw-text-white sppcfw-font-bold sppcfw-p-1 sppcfw-rounded hover:sppcfw-bg-[#212b39]',
							onClick: closeStructure,
							title: 'Close',
						},
						'✕'
					)
				)
			),

			// Scrollable Tree Content (Dynamically resized, max-h-400)
			!isCollapsed &&
				h(
					'div',
					{
						ref: contentRef,
						className: 'sppcfw-p-2 sppcfw-overflow-y-auto custom-scrollbar sppcfw-space-y-1',
						style: { height: `${contentHeight}px`, maxHeight: '400px', minHeight: '100px' },
						onDragOver: e => {
							e.preventDefault();
						},
						onDrop: e => {
							e.preventDefault();
							const textData = e.dataTransfer.getData('text/plain');
							if (textData && textData.indexOf('structure_move:') === 0) {
								const sourceId = textData.replace('structure_move:', '');
								const sourceElement = findElementInTree(elements, sourceId);
								if (sourceElement && sourceElement.type === 'container') {
									setElements(prev => moveElementInTree(prev, sourceId, null, prev.length));
								}
							}
						},
					},
					elements.length === 0
						? h('div', { className: 'sppcfw-text-xs sppcfw-text-[#9ca3af] sppcfw-text-center sppcfw-py-4' }, 'No elements on canvas')
						: elements.map((item, idx) =>
								h(StructureTreeNode, {
									key: item.id,
									index: idx,
									item,
									parentId: null,
									elements,
									setElements,
									selectedElementId,
									setSelectedElementId,
									deviceView,
								})
						  )
				),

			// Bottom Vertical Resize Handle
			!isCollapsed &&
				h(
					'div',
					{
						className: 'sppcfw-h-2 sppcfw-w-full sppcfw-cursor-ns-resize sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-bg-[#121c2a] hover:sppcfw-bg-[#9333ea]/30 sppcfw-border-t sppcfw-border-[#374151]/50 sppcfw-transition-colors group',
						onMouseDown: handleResizeMouseDown,
						title: 'Drag to resize vertically (max 400px)',
					},
					h('div', { className: 'sppcfw-w-8 sppcfw-h-0.5 sppcfw-bg-gray-500/60 group-hover:sppcfw-bg-[#9333ea] sppcfw-rounded-full sppcfw-pointer-events-none' })
				)
		);
	}

	// Recursive Structure Tree Node Component
	function StructureTreeNode({ item, index, parentId, elements, setElements, selectedElementId, setSelectedElementId, deviceView = 'desktop' }) {
		const isSelected = selectedElementId === item.id;
		const hasChildren = item.children && item.children.length > 0;
		const [isCollapsed, setIsCollapsed] = useState(false);
		const [dropIndicator, setDropIndicator] = useState(null);

		const isHiddenOnCurrent = isElementHiddenOnDevice(item, deviceView);

		function handleDragStart(e) {
			e.stopPropagation();
			e.dataTransfer.setData('text/plain', 'structure_move:' + item.id);
			e.dataTransfer.effectAllowed = 'move';
			window.__sppcfw_dragged_id = item.id;
		}

		function handleDragEnd(e) {
			window.__sppcfw_dragged_id = null;
			setDropIndicator(null);
		}

		function handleDragOver(e) {
			e.preventDefault();
			e.stopPropagation();
			e.dataTransfer.dropEffect = 'move';
			if (window.__sppcfw_dragged_id === item.id) {
				if (dropIndicator !== null) setDropIndicator(null);
				return;
			}
			const rect = e.currentTarget.getBoundingClientRect();
			const isTopHalf = e.clientY < rect.top + rect.height / 2;
			const pos = isTopHalf ? 'top' : 'bottom';
			if (dropIndicator !== pos) {
				setDropIndicator(pos);
			}
		}

		function handleDragLeave(e) {
			e.stopPropagation();
			if (!e.currentTarget.contains(e.relatedTarget)) {
				setDropIndicator(null);
			}
		}

		function handleDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			const rect = e.currentTarget.getBoundingClientRect();
			const pos = dropIndicator || (e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom');
			setDropIndicator(null);
			window.__sppcfw_dragged_id = null;

			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('structure_move:') === 0) {
				const sourceId = textData.replace('structure_move:', '');
				if (!sourceId || sourceId === item.id) return;

				const sourceElement = findElementInTree(elements, sourceId);
				if (!sourceElement) return;

				if (sourceElement.type === 'container') {
					// Containers can ONLY reorder at root level (never nested in container or column)
					if (item.type === 'container') {
						const targetIndex = pos === 'bottom' ? index + 1 : index;
						setElements(prev => moveElementInTree(prev, sourceId, null, targetIndex));
					} else {
						const rootCont = findRootContainer(elements, item.id);
						const rootIdx = elements.findIndex(el => el.id === (rootCont ? rootCont.id : item.id));
						if (rootIdx !== -1) {
							const targetIndex = pos === 'bottom' ? rootIdx + 1 : rootIdx;
							setElements(prev => moveElementInTree(prev, sourceId, null, targetIndex));
						}
					}
				} else if (sourceElement.type === 'column') {
					// Columns can ONLY live inside a container (never inside another column or widget)
					if (item.type === 'column') {
						// Dropped on a sibling column
						const targetParentId = parentId;
						const targetIndex = pos === 'bottom' ? index + 1 : index;
						setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
					} else if (item.type === 'container') {
						// Dropped onto container header -> place inside this container
						const targetParentId = item.id;
						const targetIndex = pos === 'top' ? 0 : (item.children ? item.children.length : 0);
						setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
					} else {
						// Dropped on a widget inside some column -> place before/after that column
						const targetCol = findParentInTree(elements, item.id);
						if (targetCol) {
							const targetCont = findParentInTree(elements, targetCol.id);
							if (targetCont && targetCont.children) {
								const colIdx = targetCont.children.findIndex(c => c.id === targetCol.id);
								const targetParentId = targetCont.id;
								const targetIndex = pos === 'bottom' ? colIdx + 1 : colIdx;
								setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
							}
						}
					}
				} else {
					// Widgets (can live inside columns or containers)
					if (item.type === 'container') {
						if (item.children && item.children.length > 0) {
							const targetCol = pos === 'top' ? item.children[0] : item.children[item.children.length - 1];
							const targetParentId = targetCol.id;
							const targetIndex = pos === 'top' ? 0 : (targetCol.children ? targetCol.children.length : 0);
							setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
						}
					} else if (item.type === 'column') {
						const targetParentId = item.id;
						const targetIndex = pos === 'top' ? 0 : (item.children ? item.children.length : 0);
						setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
					} else {
						// Target is another widget
						const targetParentId = parentId;
						const targetIndex = pos === 'bottom' ? index + 1 : index;
						setElements(prev => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
					}
				}
			}
		}

		function getItemIcon() {
			if (item.type === 'container') return 'grid_view';
			if (item.type === 'column') return 'view_column';
			if (item.type === 'product_title') return 'title';
			if (item.type === 'heading') return 'format_size';
			if (item.type === 'text_editor') return 'edit_note';
			if (item.type === 'product_price') return 'payments';
			if (item.type === 'product_gallery') return 'collections';
			if (item.type === 'image') return 'image';
			if (item.type === 'product_add_to_cart') return 'shopping_cart';
			if (item.type === 'product_rating') return 'star';
			if (item.type === 'product_short_desc') return 'description';
			if (item.type === 'product_description') return 'toc';
			if (item.type === 'product_meta') return 'inventory_2';
			if (item.type === 'variation_swatches') return 'grid_view';
			if (item.type === 'custom_message') return 'campaign';
			if (item.type === 'plus_minus_buttons') return 'exposure';
			if (item.type === 'related_products') return 'grid_on';
			if (item.type === 'upsell_products') return 'auto_awesome';
			return 'widgets';
		}

		return h(
			'div',
			{
				className: 'sppcfw-select-none sppcfw-relative',
			},
			h(
				'div',
				{
					draggable: true,
					onDragStart: handleDragStart,
					onDragEnd: handleDragEnd,
					onDragOver: handleDragOver,
					onDragLeave: handleDragLeave,
					onDrop: handleDrop,
					onClick: e => {
						e.stopPropagation();
						setSelectedElementId(item.id);
					},
					className: `sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-p-1.5 sppcfw-rounded sppcfw-cursor-pointer sppcfw-text-xs sppcfw-transition-colors sppcfw-relative ${
						isSelected ? 'sppcfw-bg-[#9333ea] sppcfw-text-white sppcfw-font-bold' : isHiddenOnCurrent ? 'hover:sppcfw-bg-[#212b39] sppcfw-text-gray-400 sppcfw-opacity-70' : 'hover:sppcfw-bg-[#212b39] sppcfw-text-[#cfc2d7]'
					}`,
				},
				dropIndicator === 'top' &&
					h('div', { className: 'sppcfw-absolute -top-1 sppcfw-left-0 sppcfw-right-0 sppcfw-h-[3px] sppcfw-bg-[#c084fc] sppcfw-rounded-full sppcfw-z-30 sppcfw-shadow-[0_0_8px_#c084fc] sppcfw-pointer-events-none' }),
				dropIndicator === 'bottom' &&
					h('div', { className: 'sppcfw-absolute -bottom-1 sppcfw-left-0 sppcfw-right-0 sppcfw-h-[3px] sppcfw-bg-[#c084fc] sppcfw-rounded-full sppcfw-z-30 sppcfw-shadow-[0_0_8px_#c084fc] sppcfw-pointer-events-none' }),
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-overflow-hidden sppcfw-flex-1 sppcfw-mr-2' },
					hasChildren &&
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-text-xs hover:sppcfw-text-white sppcfw-w-4 sppcfw-h-4 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-flex-shrink-0',
								onClick: e => {
									e.stopPropagation();
									setIsCollapsed(!isCollapsed);
								},
							},
							isCollapsed ? '▶' : '▼'
						),
					h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-text-[#ddb8ff] sppcfw-flex-shrink-0' }, getItemIcon()),
					h('span', { className: 'sppcfw-font-semibold sppcfw-truncate' }, item.label),
					isHiddenOnCurrent &&
						h('span', {
							className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-amber-400 sppcfw-flex-shrink-0',
							title: `Hidden on ${deviceView}`,
						}, 'visibility_off')
				),
				h(
					'span',
					{ className: 'sppcfw-text-[9px] font-mono sppcfw-opacity-80 sppcfw-uppercase sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded sppcfw-bg-[#091421] sppcfw-flex-shrink-0' },
					item.type === 'container' ? (item.settings && item.settings.width_mode === 'boxed' ? 'Boxed' : 'Full') : item.type === 'column' ? (item.settings && item.settings.flex_width ? item.settings.flex_width : 'Col') : item.type
				)
			),

			hasChildren &&
				!isCollapsed &&
				h(
					'div',
					{ className: 'sppcfw-pl-3 sppcfw-mt-1 sppcfw-border-l sppcfw-border-[#374151] sppcfw-space-y-1 sppcfw-ml-2' },
					item.children.map((child, childIdx) =>
						h(StructureTreeNode, {
							key: child.id,
							item: child,
							index: childIdx,
							parentId: item.id,
							elements,
							setElements,
							selectedElementId,
							setSelectedElementId,
							deviceView,
						})
					)
				)
		);
	}

	// Helper to compute CSS background style object from element styles
	function computeBackgroundStyles(styles, deviceView = 'desktop') {
		if (!styles) return {};
		const bgType = getResponsiveProp(styles, 'bg_type', deviceView) || 'classic';
		const bgObj = {};
		if (bgType === 'gradient') {
			const c1 = getResponsiveProp(styles, 'bg_gradient_color1', deviceView) || '#9333ea';
			const c2 = getResponsiveProp(styles, 'bg_gradient_color2', deviceView) || '#3b82f6';
			const gType = (getResponsiveProp(styles, 'bg_gradient_type', deviceView) || 'linear').toLowerCase();
			const angle = getResponsiveProp(styles, 'bg_gradient_angle', deviceView) || '180deg';
			if (gType === 'radial') {
				bgObj.backgroundImage = `radial-gradient(circle, ${c1}, ${c2})`;
			} else {
				const angleVal = String(angle).includes('deg') ? angle : `${angle}deg`;
				bgObj.backgroundImage = `linear-gradient(${angleVal}, ${c1}, ${c2})`;
			}
		} else {
			const bgColor = getResponsiveProp(styles, 'bg_color', deviceView);
			if (bgColor && bgColor !== 'transparent') {
				bgObj.backgroundColor = bgColor;
			}
			const bgImage = getResponsiveProp(styles, 'bg_image', deviceView);
			if (bgImage) {
				bgObj.backgroundImage = `url("${bgImage}")`;

				// Position
				const bgPos = getResponsiveProp(styles, 'bg_position', deviceView) || 'Center Center';
				if (bgPos === 'Custom') {
					const posX = getResponsiveProp(styles, 'bg_pos_x', deviceView) || '50%';
					const posY = getResponsiveProp(styles, 'bg_pos_y', deviceView) || '50%';
					bgObj.backgroundPosition = `${posX} ${posY}`;
				} else if (bgPos !== 'Default') {
					bgObj.backgroundPosition = bgPos.toLowerCase();
				} else {
					bgObj.backgroundPosition = 'center center';
				}

				// Attachment
				const bgAtt = getResponsiveProp(styles, 'bg_attachment', deviceView);
				if (bgAtt && bgAtt !== 'Default') {
					bgObj.backgroundAttachment = bgAtt.toLowerCase();
				}

				// Repeat
				const bgRep = getResponsiveProp(styles, 'bg_repeat', deviceView) || 'No-repeat';
				if (bgRep !== 'Default') {
					bgObj.backgroundRepeat = bgRep.toLowerCase();
				} else {
					bgObj.backgroundRepeat = 'no-repeat';
				}

				// Display Size
				const bgSize = getResponsiveProp(styles, 'bg_size', deviceView) || 'Cover';
				if (bgSize === 'Custom') {
					const customSize = getResponsiveProp(styles, 'bg_custom_size', deviceView) || '100%';
					bgObj.backgroundSize = customSize;
				} else if (bgSize !== 'Default') {
					bgObj.backgroundSize = bgSize.toLowerCase();
				} else {
					bgObj.backgroundSize = 'cover';
				}
			}
		}
		return bgObj;
	}

	// Canvas Container Renderer
	function CanvasContainerRenderer({ container, cIdx, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData, pageSettings, addWidgetToTarget, addColumnToContainer, duplicateColumn, openElementsTab, openStructureChooser, deviceView = 'desktop' }) {
		const isSelected = selectedElementId === container.id;
		const [isContainerDragOver, setIsContainerDragOver] = useState(false);
		const rawWidthMode = getResponsiveProp(container.settings, 'width_mode', deviceView);
		const boxedWidth = getResponsiveProp(container.settings, 'boxed_width', deviceView) || '1140px';
		const advWidthMode = getResponsiveProp(container.advanced, 'width_mode', deviceView);
		const isFullWidth = rawWidthMode === 'full' || boxedWidth === '100%' || advWidthMode === 'Full Width (100%)';
		const widthMode = isFullWidth ? 'full' : 'boxed';

		const padTop = getResponsiveProp(container.advanced, 'padding_top', deviceView) || getResponsiveProp(container.styles, 'padding_top', deviceView) || '10px';
		const padRight = getResponsiveProp(container.advanced, 'padding_right', deviceView) || getResponsiveProp(container.styles, 'padding_right', deviceView) || '10px';
		const padBottom = getResponsiveProp(container.advanced, 'padding_bottom', deviceView) || getResponsiveProp(container.styles, 'padding_bottom', deviceView) || '10px';
		const padLeft = getResponsiveProp(container.advanced, 'padding_left', deviceView) || getResponsiveProp(container.styles, 'padding_left', deviceView) || '10px';

		const marTop = getResponsiveProp(container.advanced, 'margin_top', deviceView) || getResponsiveProp(container.styles, 'margin_top', deviceView) || '0px';
		const marRight = widthMode === 'boxed' ? 'auto' : getResponsiveProp(container.advanced, 'margin_right', deviceView) || getResponsiveProp(container.styles, 'margin_right', deviceView) || '0px';
		const marBottom = getResponsiveProp(container.advanced, 'margin_bottom', deviceView) || getResponsiveProp(container.styles, 'margin_bottom', deviceView) || '16px';
		const marLeft = widthMode === 'boxed' ? 'auto' : getResponsiveProp(container.advanced, 'margin_left', deviceView) || getResponsiveProp(container.styles, 'margin_left', deviceView) || '0px';

		const borderType = (getResponsiveProp(container.styles, 'border_type', deviceView) || 'none').toLowerCase();
		const hasBorder = borderType !== 'none';
		const borderWidth = hasBorder ? (getResponsiveProp(container.styles, 'border_width', deviceView) || '1px') : ((isSelected || isContainerDragOver) ? '2px' : '1px');
		const borderColor = hasBorder ? (getResponsiveProp(container.styles, 'border_color', deviceView) || '#cbd5e1') : (isContainerDragOver ? '#9333ea' : (isSelected ? '#9333ea' : '#cbd5e1'));

		const radTop = getResponsiveProp(container.styles, 'border_radius_top', deviceView);
		const radRight = getResponsiveProp(container.styles, 'border_radius_right', deviceView);
		const radBottom = getResponsiveProp(container.styles, 'border_radius_bottom', deviceView);
		const radLeft = getResponsiveProp(container.styles, 'border_radius_left', deviceView);
		const generalRad = getResponsiveProp(container.styles, 'border_radius', deviceView);

		let borderRadius = '8px';
		if ((radTop !== undefined && radTop !== '') || (radRight !== undefined && radRight !== '') || (radBottom !== undefined && radBottom !== '') || (radLeft !== undefined && radLeft !== '')) {
			const t = (radTop !== undefined && radTop !== '') ? radTop : (generalRad || '0px');
			const r = (radRight !== undefined && radRight !== '') ? radRight : (generalRad || '0px');
			const b = (radBottom !== undefined && radBottom !== '') ? radBottom : (generalRad || '0px');
			const l = (radLeft !== undefined && radLeft !== '') ? radLeft : (generalRad || '0px');
			borderRadius = `${t} ${r} ${b} ${l}`;
		} else if (generalRad !== undefined && generalRad !== '') {
			borderRadius = generalRad;
		}

		const bgStyles = computeBackgroundStyles(container.styles, deviceView);
		const isGrid = getResponsiveProp(container.settings, 'flex_direction', deviceView) === 'grid';
		const flexDir = getResponsiveProp(container.settings, 'flex_direction', deviceView) || 'row';
		const justifyContent = getResponsiveProp(container.settings, 'justify_content', deviceView) || 'flex-start';
		const alignItems = getResponsiveProp(container.settings, 'align_items', deviceView) || 'stretch';
		const flexWrap = getResponsiveProp(container.settings, 'flex_wrap', deviceView) || 'nowrap';
		const minHeight = getResponsiveProp(container.settings, 'min_height', deviceView) || '0px';
		const gridCols = getResponsiveProp(container.settings, 'grid_columns', deviceView) || '2';
		const colGap = getResponsiveProp(container.settings, 'column_gap', deviceView) || getResponsiveProp(container.settings, 'gap', deviceView) || '20px';
		const rowGap = getResponsiveProp(container.settings, 'row_gap', deviceView) || getResponsiveProp(container.settings, 'gap', deviceView) || '20px';

		function handleContainerDragStart(e) {
			e.stopPropagation();
			e.dataTransfer.setData('text/plain', 'container_reorder:' + cIdx);
		}

		function handleContainerDragOver(e) {
			e.preventDefault();
			e.stopPropagation();
			setIsContainerDragOver(true);
		}

		function handleContainerDragLeave(e) {
			e.stopPropagation();
			setIsContainerDragOver(false);
		}

		function handleContainerDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			setIsContainerDragOver(false);

			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('container_reorder:') === 0) {
				const sourceIndex = parseInt(textData.replace('container_reorder:', ''), 10);
				if (!isNaN(sourceIndex) && sourceIndex !== cIdx) {
					setElements(prev => {
						const next = [...prev];
						const [moved] = next.splice(sourceIndex, 1);
						next.splice(cIdx, 0, moved);
						return next;
					});
				}
				return;
			}

			const jsonStr = e.dataTransfer.getData('application/json');
			if (jsonStr) {
				try {
					const data = JSON.parse(jsonStr);
					if (data && data.type) {
						let targetColId = null;
						if (container.children && container.children.length > 0) {
							targetColId = container.children[0].id;
						}
						addWidgetToTarget(data.type, data.name, data.metaKey, targetColId);
						return;
					}
				} catch (err) {}
			}
		}

		const isContainerHidden = isElementHiddenOnDevice(container, deviceView);

		return h(
			'div',
			{
				draggable: true,
				onDragStart: handleContainerDragStart,
				onDragOver: handleContainerDragOver,
				onDragLeave: handleContainerDragLeave,
				onDrop: handleContainerDrop,
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(container.id);
				},
				className: `sppcfw-builder-container-item sppcfw-relative sppcfw-tab-group sppcfw-transition-all sppcfw-rounded-lg ${
					isContainerDragOver ? 'is-drag-over sppcfw-bg-[#faf5ff]' : isSelected ? 'is-selected' : ''
				} ${isContainerHidden ? 'sppcfw-hidden-device-preview' : ''} ${container.advanced && container.advanced.custom_class ? container.advanced.custom_class : ''}`,
				style: {
					maxWidth: widthMode === 'boxed' ? boxedWidth : '100%',
					width: '100%',
					minHeight: minHeight,
					backgroundColor: 'transparent',
					...bgStyles,
					borderStyle: hasBorder ? borderType : 'dashed',
					borderWidth: borderWidth,
					borderColor: borderColor,
					borderRadius: borderRadius,
					paddingTop: padTop,
					paddingRight: padRight,
					paddingBottom: padBottom,
					paddingLeft: padLeft,
					marginTop: marTop,
					marginRight: marRight,
					marginBottom: marBottom,
					marginLeft: marLeft,
				},
			},

			isContainerHidden &&
				h(
					'div',
					{
						className: 'sppcfw-absolute sppcfw-top-1.5 sppcfw-left-1.5 sppcfw-bg-gray-900/90 sppcfw-text-amber-300 sppcfw-text-[10px] sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-z-20 sppcfw-pointer-events-none sppcfw-border sppcfw-border-amber-500/50 sppcfw-shadow-sm',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'visibility_off'),
					`Hidden on ${deviceView.charAt(0).toUpperCase() + deviceView.slice(1)}`
				),

			// Toolbar Badge & Handles
			isSelected &&
				h(
					'div',
					{
						className: `sppcfw-absolute ${
							cIdx === 0 ? 'sppcfw-top-0 sppcfw-rounded-b-md' : 'sppcfw-top-[-1.6rem] sppcfw-rounded-t-md'
						} sppcfw-left-1/2 sppcfw--translate-x-1/2 sppcfw-bg-[#c084fc] sppcfw-text-white sppcfw-px-2.5 sppcfw-py-0.5 sppcfw-text-xs sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-z-20 sppcfw-shadow-sm sppcfw-select-none sppcfw-font-bold`,
					},
					h(
						'button',
						{
							className: 'hover:sppcfw-text-black sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-text-sm sppcfw-font-bold',
							onClick: e => {
								e.stopPropagation();
								if (typeof openStructureChooser === 'function') openStructureChooser();
							},
							title: 'Add Container',
						},
						'+'
					),
					h(
						'span',
						{
							className: 'sppcfw-cursor-grab active:sppcfw-cursor-grabbing sppcfw-font-extrabold sppcfw-text-[10px] sppcfw-tracking-wider hover:sppcfw-text-black sppcfw-transition-colors sppcfw-px-1 sppcfw-py-0.5 sppcfw-rounded hover:sppcfw-bg-white/20',
							draggable: true,
							onDragStart: handleContainerDragStart,
							title: 'Drag to reorder container up or down',
						},
						':::'
					),
					h(
						'button',
						{
							className: 'hover:sppcfw-text-red-200 sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-font-bold sppcfw-text-xs',
							onClick: e => {
								e.stopPropagation();
								removeElement(container.id);
							},
							title: 'Delete Container',
						},
						'✕'
					)
				),

			// Column Flex / Grid Layout Wrapper
			h(
				'div',
				{
					className: isGrid ? `grid grid-cols-${gridCols}` : 'flex',
					style: {
						display: isGrid ? 'grid' : 'flex',
						flexDirection: !isGrid ? flexDir : undefined,
						justifyContent: !isGrid ? justifyContent : undefined,
						alignItems: !isGrid ? alignItems : undefined,
						flexWrap: !isGrid ? flexWrap : undefined,
						columnGap: colGap,
						rowGap: rowGap,
					},
				},
				container.children &&
					container.children.map(column =>
						h(CanvasColumnRenderer, {
							key: column.id,
							column,
							containerId: container.id,
							elements,
							setElements,
							selectedElementId,
							setSelectedElementId,
							removeElement,
							sampleData,
							pageSettings,
							addWidgetToTarget,
							addColumnToContainer,
							duplicateColumn,
							openElementsTab,
							deviceView,
						})
					)
			)
		);
	}

	// Canvas Column Renderer
	function CanvasColumnRenderer({ column, containerId, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData, pageSettings, addWidgetToTarget, addColumnToContainer, duplicateColumn, openElementsTab, deviceView = 'desktop' }) {
		const isSelected = selectedElementId === column.id;
		const [isColumnDragOver, setIsColumnDragOver] = useState(false);
		const flexWidth = getResponsiveProp(column.settings, 'flex_width', deviceView) || '100%';
		const flexDir = getResponsiveProp(column.settings, 'flex_direction', deviceView) || 'column';
		const justifyContent = getResponsiveProp(column.settings, 'justify_content', deviceView) || 'flex-start';
		const alignItems = getResponsiveProp(column.settings, 'align_items', deviceView) || 'stretch';
		const gap = getResponsiveProp(column.settings, 'gap', deviceView) || '12px';
		const minHeight = getResponsiveProp(column.settings, 'min_height', deviceView) || '120px';

		function handleColumnDragOver(e) {
			e.preventDefault();
			e.stopPropagation();
			setIsColumnDragOver(true);
		}

		function handleColumnDragLeave(e) {
			e.stopPropagation();
			if (!e.currentTarget.contains(e.relatedTarget)) {
				setIsColumnDragOver(false);
			}
		}

		function handleColumnDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			setIsColumnDragOver(false);
			window.__sppcfw_dragged_id = null;

			const targetSlot = column.children ? column.children.length : 0;

			const jsonStr = e.dataTransfer.getData('application/json');
			if (jsonStr) {
				try {
					const data = JSON.parse(jsonStr);
					if (data && data.type) {
						addWidgetToTarget(data.type, data.name, data.metaKey, column.id, targetSlot);
						return;
					}
				} catch (err) {}
			}

			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('structure_move:') === 0) {
				const sourceId = textData.replace('structure_move:', '');
				if (sourceId) {
					setElements(prev => moveElementInTree(prev, sourceId, column.id, targetSlot));
				}
			}
		}

		const colBorderType = (getResponsiveProp(column.styles, 'border_type', deviceView) || 'none').toLowerCase();
		const colHasBorder = colBorderType !== 'none';
		const colRadTop = getResponsiveProp(column.styles, 'border_radius_top', deviceView);
		const colRadRight = getResponsiveProp(column.styles, 'border_radius_right', deviceView);
		const colRadBottom = getResponsiveProp(column.styles, 'border_radius_bottom', deviceView);
		const colRadLeft = getResponsiveProp(column.styles, 'border_radius_left', deviceView);
		const colGeneralRad = getResponsiveProp(column.styles, 'border_radius', deviceView);

		let colBorderRadius = '4px';
		if ((colRadTop !== undefined && colRadTop !== '') || (colRadRight !== undefined && colRadRight !== '') || (colRadBottom !== undefined && colRadBottom !== '') || (colRadLeft !== undefined && colRadLeft !== '')) {
			const t = (colRadTop !== undefined && colRadTop !== '') ? colRadTop : (colGeneralRad || '0px');
			const r = (colRadRight !== undefined && colRadRight !== '') ? colRadRight : (colGeneralRad || '0px');
			const b = (colRadBottom !== undefined && colRadBottom !== '') ? colRadBottom : (colGeneralRad || '0px');
			const l = (colRadLeft !== undefined && colRadLeft !== '') ? colRadLeft : (colGeneralRad || '0px');
			colBorderRadius = `${t} ${r} ${b} ${l}`;
		} else if (colGeneralRad !== undefined && colGeneralRad !== '') {
			colBorderRadius = colGeneralRad;
		}

		const colBgStyles = computeBackgroundStyles(column.styles, deviceView);
		const isColHidden = isElementHiddenOnDevice(column, deviceView);

		return h(
			'div',
			{
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(column.id);
				},
				onDragOver: handleColumnDragOver,
				onDragLeave: handleColumnDragLeave,
				onDrop: handleColumnDrop,
				className: `builder-column-item sppcfw-flex-1 sppcfw-min-w-[180px] sppcfw-p-3 sppcfw-relative sppcfw-transition-all sppcfw-min-h-[120px] ${
					isColumnDragOver ? 'is-drag-over sppcfw-bg-[#faf5ff]' : isSelected ? 'is-selected' : 'sppcfw-bg-[#f9fafb]'
				} ${isColHidden ? 'sppcfw-hidden-device-preview' : ''}`,
				style: {
					flex: flexWidth === '100%' ? '1 1 100%' : `1 1 calc(${flexWidth} - 16px)`,
					width: flexWidth === '100%' ? '100%' : undefined,
					maxWidth: flexWidth === '100%' ? '100%' : undefined,
					minHeight: minHeight,
					display: 'flex',
					flexDirection: flexDir,
					justifyContent: justifyContent,
					alignItems: alignItems,
					gap: gap,
					backgroundColor: 'transparent',
					...colBgStyles,
					borderStyle: colHasBorder ? colBorderType : 'dashed',
					borderColor: colHasBorder ? (getResponsiveProp(column.styles, 'border_color', deviceView) || '#d1d5db') : (isSelected ? '#9333ea' : '#d1d5db'),
					borderWidth: colHasBorder ? (getResponsiveProp(column.styles, 'border_width', deviceView) || '1px') : '1px',
					borderRadius: colBorderRadius,
					paddingTop: getResponsiveProp(column.advanced, 'padding_top', deviceView) || getResponsiveProp(column.styles, 'padding_top', deviceView) || '12px',
					paddingRight: getResponsiveProp(column.advanced, 'padding_right', deviceView) || getResponsiveProp(column.styles, 'padding_right', deviceView) || '12px',
					paddingBottom: getResponsiveProp(column.advanced, 'padding_bottom', deviceView) || getResponsiveProp(column.styles, 'padding_bottom', deviceView) || '12px',
					paddingLeft: getResponsiveProp(column.advanced, 'padding_left', deviceView) || getResponsiveProp(column.styles, 'padding_left', deviceView) || '12px',
					marginTop: getResponsiveProp(column.advanced, 'margin_top', deviceView) || getResponsiveProp(column.styles, 'margin_top', deviceView) || '0px',
					marginRight: getResponsiveProp(column.advanced, 'margin_right', deviceView) || getResponsiveProp(column.styles, 'margin_right', deviceView) || '0px',
					marginBottom: getResponsiveProp(column.advanced, 'margin_bottom', deviceView) || getResponsiveProp(column.styles, 'margin_bottom', deviceView) || '0px',
					marginLeft: getResponsiveProp(column.advanced, 'margin_left', deviceView) || getResponsiveProp(column.styles, 'margin_left', deviceView) || '0px',
				},
			},

			isSelected &&
				h(
					'div',
					{
						className: 'sppcfw-selection-badge sppcfw-absolute sppcfw--top-3 sppcfw-right-2 sppcfw-bg-[#9333ea] sppcfw-text-white sppcfw-px-2 sppcfw-h-5 sppcfw-leading-none sppcfw-rounded sppcfw-text-[10px] font-mono sppcfw-z-20 sppcfw-shadow-md sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-select-none',
						style: { height: '20px', lineHeight: '1', fontSize: '10px', boxSizing: 'border-box' }
					},
					h('span', { className: 'sppcfw-font-bold sppcfw-leading-none', style: { lineHeight: '1', fontSize: '10px' } }, column.label || 'Column'),
					h(
						'button',
						{
							type: 'button',
							className: 'hover:sppcfw-text-black sppcfw-text-xs sppcfw-font-bold sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-px-1 sppcfw-leading-none sppcfw-p-0 sppcfw-m-0 sppcfw-border-0 sppcfw-bg-transparent sppcfw-flex sppcfw-items-center sppcfw-justify-center',
							style: { lineHeight: '1', fontSize: '12px', padding: '0 2px', margin: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' },
							onClick: e => {
								e.stopPropagation();
								if (typeof addColumnToContainer === 'function') addColumnToContainer(containerId);
							},
							title: 'Add New Column to Container',
						},
						'+'
					),
					h(
						'button',
						{
							type: 'button',
							className: 'hover:sppcfw-text-black sppcfw-text-xs sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-px-0.5 sppcfw-leading-none sppcfw-p-0 sppcfw-m-0 sppcfw-border-0 sppcfw-bg-transparent sppcfw-flex sppcfw-items-center sppcfw-justify-center',
							style: { lineHeight: '1', fontSize: '11px', padding: '0 2px', margin: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' },
							onClick: e => {
								e.stopPropagation();
								if (typeof duplicateColumn === 'function') duplicateColumn(column.id);
							},
							title: 'Duplicate Column',
						},
						'📋'
					),
					h(
						'button',
						{
							type: 'button',
							className: 'hover:sppcfw-text-red-200 sppcfw-text-xs sppcfw-font-bold sppcfw-transition-colors sppcfw-cursor-pointer sppcfw-px-0.5 sppcfw-leading-none sppcfw-p-0 sppcfw-m-0 sppcfw-border-0 sppcfw-bg-transparent sppcfw-flex sppcfw-items-center sppcfw-justify-center',
							style: { lineHeight: '1', fontSize: '11px', padding: '0 2px', margin: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' },
							onClick: e => {
								e.stopPropagation();
								if (typeof removeElement === 'function') removeElement(column.id);
							},
							title: 'Delete Column',
						},
						'✕'
					)
				),

			isColHidden &&
				h(
					'div',
					{
						className: 'sppcfw-absolute sppcfw-top-1.5 sppcfw-left-1.5 sppcfw-bg-gray-900/90 sppcfw-text-amber-300 sppcfw-text-[10px] sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-z-20 sppcfw-pointer-events-none sppcfw-border sppcfw-border-amber-500/50 sppcfw-shadow-sm',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'visibility_off'),
					`Hidden on ${deviceView.charAt(0).toUpperCase() + deviceView.slice(1)}`
				),

			column.children && column.children.length > 0
				? column.children.map((child, childIdx) =>
						h(CanvasWidgetRenderer, {
							key: child.id,
							widget: child,
							widgetIndex: childIdx,
							columnId: column.id,
							elements,
							setElements,
							selectedElementId,
							setSelectedElementId,
							removeElement,
							sampleData,
							pageSettings,
							deviceView,
							addWidgetToTarget,
						})
				  )
				: h(
						'div',
						{
							className: 'sppcfw-flex sppcfw-flex-col sppcfw-items-center sppcfw-justify-center sppcfw-min-h-[140px] sppcfw-text-center sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#cbd5e1] sppcfw-rounded-lg sppcfw-p-6 sppcfw-bg-white sppcfw-select-none sppcfw-cursor-pointer sppcfw-tab-group hover:sppcfw-border-[#9333ea] sppcfw-transition-all',
							onClick: e => {
								e.stopPropagation();
								if (typeof openElementsTab === 'function') openElementsTab();
							},
						},
						h(
							'button',
							{
								type: 'button',
								className: 'sppcfw-w-10 sppcfw-h-10 sppcfw-border sppcfw-border-[#cbd5e1] group-hover:sppcfw-border-[#9333ea] sppcfw-bg-white sppcfw-text-[#94a3b8] group-hover:sppcfw-text-[#9333ea] sppcfw-rounded-md sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-cursor-pointer sppcfw-shadow-sm group-hover:sppcfw-shadow sppcfw-transition-all',
								title: 'Add Element',
								onClick: e => {
									e.stopPropagation();
									if (typeof openElementsTab === 'function') openElementsTab();
								},
							},
							h('span', { className: 'material-symbols-outlined sppcfw-text-lg' }, 'add')
						),
						h('span', { className: 'sppcfw-text-xs sppcfw-font-semibold sppcfw-text-[#64748b] group-hover:sppcfw-text-[#9333ea] sppcfw-mt-2' }, 'Add Element')
				  )
		);
	}

	// Canvas Widget Renderer
	function CanvasWidgetRenderer({ widget, widgetIndex, columnId, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData, pageSettings, deviceView = 'desktop', addWidgetToTarget }) {
		const isSelected = selectedElementId === widget.id;
		const [dropIndicator, setDropIndicator] = useState(null); // 'top' | 'bottom' | null

		function handleWidgetDragStart(e) {
			e.stopPropagation();
			e.dataTransfer.setData('text/plain', 'structure_move:' + widget.id);
			window.__sppcfw_dragged_id = widget.id;
		}

		function handleWidgetDragEnd(e) {
			window.__sppcfw_dragged_id = null;
			setDropIndicator(null);
		}

		function handleWidgetDragOver(e) {
			e.preventDefault();
			e.stopPropagation();
			if (window.__sppcfw_dragged_id === widget.id) {
				if (dropIndicator !== null) setDropIndicator(null);
				return;
			}
			const rect = e.currentTarget.getBoundingClientRect();
			const isTopHalf = e.clientY < rect.top + rect.height / 2;
			const pos = isTopHalf ? 'top' : 'bottom';
			if (dropIndicator !== pos) {
				setDropIndicator(pos);
			}
		}

		function handleWidgetDragLeave(e) {
			e.stopPropagation();
			if (!e.currentTarget.contains(e.relatedTarget)) {
				setDropIndicator(null);
			}
		}

		function handleWidgetDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			const pos = dropIndicator;
			setDropIndicator(null);
			window.__sppcfw_dragged_id = null;

			const targetSlot = pos === 'bottom' ? widgetIndex + 1 : widgetIndex;

			const jsonStr = e.dataTransfer.getData('application/json');
			if (jsonStr) {
				try {
					const data = JSON.parse(jsonStr);
					if (data && data.type) {
						if (typeof addWidgetToTarget === 'function') {
							addWidgetToTarget(data.type, data.name, data.metaKey, columnId, targetSlot);
						}
						return;
					}
				} catch (err) {}
			}

			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('structure_move:') === 0) {
				const sourceId = textData.replace('structure_move:', '');
				if (sourceId && sourceId !== widget.id) {
					setElements(prev => moveElementInTree(prev, sourceId, columnId, targetSlot));
				}
			}
		}

		const isWidgetHidden = isElementHiddenOnDevice(widget, deviceView);

		const isHtmlWidget = widget.type === 'html_code' || widget.type === 'custom_html' || widget.type === 'html';

		return h(
			'div',
			{
				draggable: true,
				onDragStart: handleWidgetDragStart,
				onDragEnd: handleWidgetDragEnd,
				onDragOver: handleWidgetDragOver,
				onDragLeave: handleWidgetDragLeave,
				onDrop: handleWidgetDrop,
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(widget.id);
				},
				className: `widget-canvas-item ${isHtmlWidget ? 'sppcfw-p-0' : 'sppcfw-p-3'} sppcfw-rounded sppcfw-cursor-grab active:sppcfw-cursor-grabbing sppcfw-relative sppcfw-tab-group ${
					isSelected ? 'is-selected sppcfw-ring-2 sppcfw-ring-[#9333ea]' : ''
				} ${isWidgetHidden ? 'sppcfw-hidden-device-preview' : ''} ${widget.advanced && widget.advanced.custom_class ? widget.advanced.custom_class : ''}`,
				style: {
					color: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'inherit' : (getResponsiveProp(widget.styles, 'text_color', deviceView) || 'inherit'),
					fontFamily: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'inherit' : ((getResponsiveProp(widget.styles, 'font_family', deviceView) && getResponsiveProp(widget.styles, 'font_family', deviceView) !== 'Inherit') ? getResponsiveProp(widget.styles, 'font_family', deviceView) : 'inherit'),
					fontSize: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'inherit' : (getResponsiveProp(widget.styles, 'font_size', deviceView) || 'inherit'),
					fontWeight: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'inherit' : ((getResponsiveProp(widget.styles, 'font_weight', deviceView) && getResponsiveProp(widget.styles, 'font_weight', deviceView) !== 'Default') ? getResponsiveProp(widget.styles, 'font_weight', deviceView) : 'inherit'),
					lineHeight: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'inherit' : (getResponsiveProp(widget.styles, 'line_height', deviceView) || 'inherit'),
					backgroundColor: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'transparent' : (getResponsiveProp(widget.styles, 'bg_color', deviceView) || 'transparent'),
					borderColor: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? 'transparent' : (getResponsiveProp(widget.styles, 'border_color', deviceView) || 'transparent'),
					borderWidth: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'border_width', deviceView) || '0px'),
					borderRadius: (widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'border_radius', deviceView) || '0px'),
					paddingTop: getResponsiveProp(widget.advanced, 'padding_top', deviceView) || ((widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'padding_top', deviceView) || '0px')),
					paddingRight: getResponsiveProp(widget.advanced, 'padding_right', deviceView) || ((widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'padding_right', deviceView) || '0px')),
					paddingBottom: getResponsiveProp(widget.advanced, 'padding_bottom', deviceView) || ((widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'padding_bottom', deviceView) || '0px')),
					paddingLeft: getResponsiveProp(widget.advanced, 'padding_left', deviceView) || ((widget.type === 'product_add_to_cart' || isHtmlWidget) ? '0px' : (getResponsiveProp(widget.styles, 'padding_left', deviceView) || '0px')),
					marginTop: getResponsiveProp(widget.advanced, 'margin_top', deviceView) || getResponsiveProp(widget.styles, 'margin_top', deviceView) || '0px',
					marginRight: getResponsiveProp(widget.advanced, 'margin_right', deviceView) || getResponsiveProp(widget.styles, 'margin_right', deviceView) || '0px',
					marginBottom: getResponsiveProp(widget.advanced, 'margin_bottom', deviceView) || getResponsiveProp(widget.styles, 'margin_bottom', deviceView) || '0px',
					marginLeft: getResponsiveProp(widget.advanced, 'margin_left', deviceView) || getResponsiveProp(widget.styles, 'margin_left', deviceView) || '0px',
					textAlign: getResponsiveProp(widget.styles, 'alignment', deviceView) || getResponsiveProp(widget.settings, 'alignment', deviceView) || 'left',
				},
			},

			dropIndicator === 'top' &&
				h('div', {
					className: 'sppcfw-absolute -top-1.5 sppcfw-left-0 sppcfw-right-0 sppcfw-h-1 sppcfw-bg-[#9333ea] sppcfw-rounded-full sppcfw-z-30 sppcfw-shadow-[0_0_8px_rgba(147,51,234,0.8)] sppcfw-pointer-events-none sppcfw-transition-all'
				}),
			dropIndicator === 'bottom' &&
				h('div', {
					className: 'sppcfw-absolute -bottom-1.5 sppcfw-left-0 sppcfw-right-0 sppcfw-h-1 sppcfw-bg-[#9333ea] sppcfw-rounded-full sppcfw-z-30 sppcfw-shadow-[0_0_8px_rgba(147,51,234,0.8)] sppcfw-pointer-events-none sppcfw-transition-all'
				}),

			isSelected &&
				h(
					'div',
					{
						className: 'sppcfw-selection-badge sppcfw-absolute sppcfw--top-3 sppcfw-right-2 sppcfw-bg-[#9333ea] sppcfw-text-white sppcfw-px-2 sppcfw-h-5 sppcfw-leading-none sppcfw-rounded sppcfw-text-[10px] sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-z-20 sppcfw-shadow font-mono sppcfw-select-none',
						style: { height: '20px', lineHeight: '1', fontSize: '10px', boxSizing: 'border-box' }
					},
					h('span', { className: 'sppcfw-leading-none', style: { lineHeight: '1', fontSize: '10px' } }, widget.label),
					h(
						'button',
						{
							type: 'button',
							className: 'hover:sppcfw-text-red-300 sppcfw-font-bold sppcfw-ml-1 sppcfw-leading-none sppcfw-p-0 sppcfw-m-0 sppcfw-border-0 sppcfw-bg-transparent sppcfw-cursor-pointer sppcfw-flex sppcfw-items-center sppcfw-justify-center',
							style: { lineHeight: '1', fontSize: '10px', padding: 0, margin: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' },
							onClick: e => {
								e.stopPropagation();
								removeElement(widget.id);
							},
						},
						'✕'
					)
				),

			isWidgetHidden &&
				!isSelected &&
				h(
					'div',
					{
						className: 'sppcfw-absolute sppcfw-top-1 sppcfw-right-1 sppcfw-bg-gray-900/90 sppcfw-text-amber-300 sppcfw-text-[10px] sppcfw-px-1.5 sppcfw-py-0.5 sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-gap-1 sppcfw-z-10 sppcfw-pointer-events-none sppcfw-border sppcfw-border-amber-500/50 sppcfw-shadow-sm',
					},
					h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'visibility_off'),
					`Hidden on ${deviceView.charAt(0).toUpperCase() + deviceView.slice(1)}`
				),

			renderLiveWidgetContent(widget, sampleData, pageSettings, deviceView)
		);
	}

	// Isolated Error Boundary for custom code widgets
	class HtmlErrorBoundary extends Component {
		constructor(props) {
			super(props);
			this.state = { hasError: false, error: null };
		}
		static getDerivedStateFromError(error) {
			return { hasError: true, error: error };
		}
		componentDidCatch(error, errorInfo) {
			console.warn('Isolated error caught in HTML Element widget:', error, errorInfo);
		}
		render() {
			if (this.state.hasError) {
				return h(
					'div',
					{
						className: 'sppcfw-p-3.5 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-red-500/80 sppcfw-bg-red-950/40 sppcfw-rounded-lg sppcfw-space-y-1.5 sppcfw-text-red-300 sppcfw-w-full sppcfw-overflow-hidden sppcfw-shadow-sm',
					},
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-font-bold sppcfw-text-xs sppcfw-text-red-400' },
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'error'),
						'HTML Element Broken (Isolated)'
					),
					h(
						'p',
						{ className: 'sppcfw-text-[11px] sppcfw-text-red-200/90 font-mono sppcfw-bg-black/50 sppcfw-p-2 sppcfw-rounded sppcfw-break-words' },
						this.state.error ? (this.state.error.message || String(this.state.error)) : 'Render Error in this HTML Element'
					),
					h(
						'div',
						{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-[10px] sppcfw-text-gray-400 sppcfw-pt-0.5' },
						h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-emerald-400' }, 'verified_user'),
						'Error isolated to this section. All other widgets and layout continue to render normally.'
					)
				);
			}
			return this.props.children;
		}
	}

	// Real-time sandboxed live preview for HTML, CSS, and JS Element
	function CustomHtmlLiveWidget({ widget, settings, deviceView }) {
		const containerRef = useRef(null);
		const htmlContent = settings && settings.html_content !== undefined ? settings.html_content : ((settings && settings.code) || '');
		const customCss = (settings && settings.custom_css) || '';
		const customJs = (settings && settings.custom_js) || '';

		const htmlError = validateHtmlSyntax(htmlContent);
		const cssError = validateCssSyntax(customCss);
		const jsError = validateJsSyntax(customJs);

		useEffect(() => {
			if (!containerRef.current) return;
			if (htmlError || cssError || jsError) return;

			// Handle embedded scripts in HTML markup
			try {
				const scriptEls = containerRef.current.querySelectorAll('script');
				scriptEls.forEach(oldScript => {
					try {
						const newScript = document.createElement('script');
						Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
						newScript.text = oldScript.innerHTML;
						oldScript.parentNode.replaceChild(newScript, oldScript);
					} catch (e) {
						console.warn('Error evaluating inline HTML script:', e);
					}
				});
			} catch (e) {}

			// Execute Custom JS field
			if (customJs && customJs.trim()) {
				try {
					const runUserJs = new Function('container', 'widgetId', `
						const root = container;
						const widget = container;
						const $ = (typeof window.jQuery !== "undefined") ? window.jQuery : (window.$ || null);
						
						// Allow DOMContentLoaded and load listeners to fire immediately in live preview
						const originalAddEventListener = window.addEventListener;
						const addEventListener = function(type, fn, opts) {
							if (type === "DOMContentLoaded" || type === "load") {
								try { fn.call(window, new Event(type)); } catch(err) { console.warn(err); }
							} else {
								originalAddEventListener.call(window, type, fn, opts);
							}
						};

						try {
							${customJs}
						} catch (runtimeErr) {
							console.warn("SPPCFW Live JS runtime notice:", runtimeErr);
						}
					`);

					runUserJs(containerRef.current, widget ? widget.id : '');
				} catch (syntaxErr) {
					console.warn('SPPCFW Custom JS syntax notice:', syntaxErr);
				}
			}
		}, [customJs, htmlContent, htmlError, cssError, jsError]);

		if (!htmlContent && !customCss && !customJs) {
			return h(
				'div',
				{
					className: 'sppcfw-p-6 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#3b4b62] sppcfw-rounded-xl sppcfw-text-center sppcfw-bg-[#111827]/60 sppcfw-text-[#d9e3f6] sppcfw-space-y-2',
				},
				h('div', { className: 'sppcfw-w-9 sppcfw-h-9 sppcfw-rounded-lg sppcfw-bg-purple-500/20 sppcfw-text-purple-300 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-mx-auto' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-lg' }, 'code')
				),
				h('div', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-purple-200' }, 'Custom HTML Element'),
				h('div', { className: 'sppcfw-text-[11px] sppcfw-text-gray-400 sppcfw-max-w-xs sppcfw-mx-auto' }, 'Click to write custom HTML markup, CSS styling, and JavaScript logic.')
			);
		}

		// If syntax error is present, display isolated broken error box only inside this element
		if (htmlError || cssError || jsError) {
			const activeError = htmlError || cssError || jsError;
			const errorType = htmlError ? 'HTML Syntax Error' : cssError ? 'CSS Syntax Error' : 'JavaScript Syntax Error';
			return h(
				'div',
				{
					className: 'sppcfw-p-3.5 sppcfw-border-2 sppcfw-border-dashed sppcfw-border-red-500/80 sppcfw-bg-red-950/30 sppcfw-rounded-lg sppcfw-space-y-1.5 sppcfw-text-red-300 sppcfw-w-full sppcfw-overflow-hidden sppcfw-shadow-sm sppcfw-animate-in sppcfw-fade-in',
				},
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-font-bold sppcfw-text-xs sppcfw-text-red-400' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-text-red-400' }, 'error'),
					`${errorType} (Element Broken)`
				),
				h(
					'p',
					{ className: 'sppcfw-text-[11px] sppcfw-text-red-200/90 font-mono sppcfw-bg-black/50 sppcfw-p-2 sppcfw-rounded sppcfw-border sppcfw-border-red-500/30 sppcfw-break-words' },
					activeError
				),
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-text-[10px] sppcfw-text-gray-400 sppcfw-pt-0.5' },
					h('span', { className: 'material-symbols-outlined sppcfw-text-xs sppcfw-text-emerald-400' }, 'verified_user'),
					'Error isolated to this section. All other sections and page layout remain intact.'
				)
			);
		}

		return h(
			'div',
			{
				ref: containerRef,
				className: `sppcfw-custom-html-live-block sppcfw-custom-html-${widget ? widget.id : 'widget'} sppcfw-w-full sppcfw-relative`,
				'data-widget-id': widget ? widget.id : '',
			},
			(customCss && !cssError) ? h('style', {
				key: 'live-css-' + (widget ? widget.id : 'css'),
				type: 'text/css',
				dangerouslySetInnerHTML: { __html: customCss }
			}) : null,
			h('div', {
				className: 'sppcfw-custom-html-inner sppcfw-w-full',
				dangerouslySetInnerHTML: { __html: htmlContent }
			})
		);
	}

	// Live Content Rendering for Canvas with Real-time Style Preview
	function renderLiveWidgetContent(el, sample, pageSettings, deviceView = 'desktop') {
		const staticFallback = typeof CANVAS_STATIC_DATA !== 'undefined' ? CANVAS_STATIC_DATA : {};
		const safeSample = sample || staticFallback;
		const styles = el.styles || {};
		const settings = el.settings || {};

		const alignment = getResponsiveProp(styles, 'alignment', deviceView) || getResponsiveProp(settings, 'alignment', deviceView) || 'left';
		const alignClass = alignment === 'center' ? 'sppcfw-text-center sppcfw-justify-center' : alignment === 'right' ? 'sppcfw-text-right sppcfw-justify-end' : 'sppcfw-text-left sppcfw-justify-start';

		switch (el.type) {
			case 'product_title': {
				const titleTag = (settings && settings.html_tag) || 'h1';
				const titleText = safeSample.title || staticFallback.title || 'Product Title';
				const fwVal = getResponsiveProp(styles, 'font_weight', deviceView);
				const resolvedFontWeight = (fwVal && fwVal !== 'Default') ? fwVal : undefined;
				const linkToProduct = !!settings.link_to_product;
				const innerText = linkToProduct
					? h('a', { href: '#', className: 'hover:sppcfw-underline sppcfw-text-inherit' }, titleText)
					: titleText;
				return h(
					titleTag,
					{
						className: `sppcfw-text-2xl sppcfw-m-0 sppcfw-p-0 sppcfw-transition-all ${alignClass}`,
						style: {
							color: getResponsiveProp(styles, 'text_color', deviceView) || '#111827',
							fontSize: getResponsiveProp(styles, 'font_size', deviceView) || undefined,
							fontFamily: (getResponsiveProp(styles, 'font_family', deviceView) && getResponsiveProp(styles, 'font_family', deviceView) !== 'Inherit') ? getResponsiveProp(styles, 'font_family', deviceView) : undefined,
							fontWeight: resolvedFontWeight,
							lineHeight: getResponsiveProp(styles, 'line_height', deviceView) || undefined,
							margin: 0,
							padding: 0,
						},
					},
					innerText
				);
			}
			case 'heading': {
				const headingTag = (settings && settings.html_tag) || 'h2';
				const headingText = (settings && settings.text !== undefined && settings.text !== '') ? settings.text : 'Add Your Heading Text Here';
				const linkUrl = settings && settings.link_url;
				const fwVal = getResponsiveProp(styles, 'font_weight', deviceView);
				const resolvedFontWeight = (fwVal && fwVal !== 'Default') ? fwVal : undefined;
				const inner = linkUrl
					? h('a', { href: linkUrl, className: 'hover:sppcfw-underline sppcfw-text-inherit' }, headingText)
					: headingText;
				return h(
					headingTag,
					{
						className: `sppcfw-text-xl sppcfw-transition-all ${alignClass}`,
						style: {
							color: getResponsiveProp(styles, 'text_color', deviceView) || '#111827',
							fontSize: getResponsiveProp(styles, 'font_size', deviceView) || undefined,
							fontFamily: (getResponsiveProp(styles, 'font_family', deviceView) && getResponsiveProp(styles, 'font_family', deviceView) !== 'Inherit') ? getResponsiveProp(styles, 'font_family', deviceView) : undefined,
							fontWeight: resolvedFontWeight,
							lineHeight: getResponsiveProp(styles, 'line_height', deviceView) || undefined,
						},
					},
					inner
				);
			}
			case 'text_editor': {
				const textTag = (settings && settings.html_tag) || 'div';
				const textContent = (settings && settings.text_content !== undefined && settings.text_content !== '') ? settings.text_content : 'Add your custom description or paragraph content here...';
				return h(
					textTag,
					{
						className: `sppcfw-text-sm sppcfw-leading-relaxed sppcfw-transition-all ${alignClass}`,
						style: {
							color: getResponsiveProp(styles, 'text_color', deviceView) || '#4b5563',
							fontSize: getResponsiveProp(styles, 'font_size', deviceView) || undefined,
							fontFamily: getResponsiveProp(styles, 'font_family', deviceView) !== 'Inherit' ? getResponsiveProp(styles, 'font_family', deviceView) : undefined,
							lineHeight: getResponsiveProp(styles, 'line_height', deviceView) || undefined,
							whiteSpace: 'pre-line',
						},
					},
					textContent
				);
			}
			case 'html_code':
			case 'custom_html': {
				return h(
					HtmlErrorBoundary,
					{ key: el.id },
					h(CustomHtmlLiveWidget, { widget: el, settings: settings || {}, deviceView: deviceView })
				);
			}
			case 'product_price': {
				// Check if Hide Price is enabled in Basic Settings
				const isPriceHidden =
					(typeof window !== 'undefined' && window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.hide_product_price === 'on');

				if (isPriceHidden) {
					return h(
						'div',
						{ className: `sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-py-2 sppcfw-px-3 sppcfw-rounded-lg sppcfw-bg-amber-500/10 sppcfw-border sppcfw-border-amber-500/30 sppcfw-text-amber-400 sppcfw-text-xs ${alignClass}` },
						h('span', { className: 'material-symbols-outlined sppcfw-text-base' }, 'visibility_off'),
						h('span', { className: 'sppcfw-font-medium' }, 'Price is hidden by Basic Settings (Hide Price is enabled)')
					);
				}

				const priceColor = getResponsiveProp(styles, 'price_color', deviceView) || getResponsiveProp(styles, 'text_color', deviceView) || '#9333ea';
				const salePriceColor = getResponsiveProp(styles, 'sale_price_color', deviceView) || '#ef4444';
				const regularPriceColor = getResponsiveProp(styles, 'regular_price_color', deviceView) || '#9ca3af';
				const fontSize = getResponsiveProp(styles, 'font_size', deviceView) || '24px';
				const fontWeight = getResponsiveProp(styles, 'font_weight', deviceView) || '800';

				const showRegularPrice = settings.show_regular_price !== false && settings.show_regular_price !== 'off' && settings.show_regular_price !== '0';
				const showSaleBadge = settings.show_sale_badge !== false && settings.show_sale_badge !== 'off' && settings.show_sale_badge !== '0';

				// Determine if on sale and both prices exist
				const rawReg = safeSample.regular_price || staticFallback.regular_price || '';
				const rawSale = safeSample.sale_price || staticFallback.sale_price || '';
				const hasRegular = !!rawReg;
				const hasSale = !!rawSale;
				const isOnSale = !!safeSample.on_sale || ((hasSale && hasRegular && rawSale !== rawReg) && hasSale);

				const displayPriceHtml = safeSample.price_html || safeSample.price || rawSale || rawReg || staticFallback.price || '$49.99';

				return h(
					'div',
					{ className: `sppcfw-flex sppcfw-items-center sppcfw-flex-wrap sppcfw-gap-3 ${alignClass}` },
					h('div', {
						className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-font-extrabold sppcfw-transition-all sppcfw-price-display [&_del]:sppcfw-opacity-70 [&_del]:sppcfw-font-normal [&_del]:sppcfw-text-gray-400 [&_del]:sppcfw-line-through [&_ins]:sppcfw-no-underline [&_span]:!sppcfw-text-inherit [&_bdi]:!sppcfw-text-inherit [&_.woocommerce-Price-amount]:!sppcfw-text-inherit [&_.woocommerce-Price-currencySymbol]:!sppcfw-text-inherit',
						style: {
							color: priceColor,
							fontSize: fontSize,
							fontWeight: fontWeight
						},
						dangerouslySetInnerHTML: { __html: displayPriceHtml }
					}),
					isOnSale && showSaleBadge &&
						h(
							'span',
							{
								className: 'sppcfw-text-white sppcfw-text-xs sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded sppcfw-font-bold sppcfw-uppercase sppcfw-shadow-sm sppcfw-tracking-wide',
								style: { backgroundColor: salePriceColor || '#ef4444' }
							},
							settings.sale_badge_text || 'Sale'
						)
				);
			}
			case 'product_gallery': {
				const imgStyles = el.styles || {};
				const imgSettings = el.settings || {};
				const imgWidth = getResponsiveProp(imgStyles, 'width', deviceView) || '100%';
				const imgMaxWidth = getResponsiveProp(imgStyles, 'max_width', deviceView) || '100%';
				const imgOpacity = getResponsiveProp(imgStyles, 'opacity', deviceView) !== undefined ? getResponsiveProp(imgStyles, 'opacity', deviceView) : '1';
				const alignVal = getResponsiveProp(imgStyles, 'alignment', deviceView) || getResponsiveProp(imgSettings, 'alignment', deviceView) || 'center';
				const flexAlign = alignVal === 'left' ? 'justify-start items-start' : alignVal === 'right' ? 'justify-end items-end' : 'justify-center items-center';

				const radTop = getResponsiveProp(imgStyles, 'border_radius_top', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '6px';
				const radRight = getResponsiveProp(imgStyles, 'border_radius_right', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '6px';
				const radBottom = getResponsiveProp(imgStyles, 'border_radius_bottom', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '6px';
				const radLeft = getResponsiveProp(imgStyles, 'border_radius_left', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '6px';
				const borderRadiusCss = `${radTop} ${radRight} ${radBottom} ${radLeft}`;

				const customImgStyle = {
					width: imgWidth,
					maxWidth: imgMaxWidth,
					height: 'auto',
					opacity: parseFloat(imgOpacity),
					borderRadius: borderRadiusCss,
					borderStyle: imgStyles.border_type && imgStyles.border_type !== 'Default' ? imgStyles.border_type.toLowerCase() : 'none',
					borderWidth: getResponsiveProp(imgStyles, 'border_width', deviceView) || '0px',
					borderColor: getResponsiveProp(imgStyles, 'border_color', deviceView) || 'transparent',
					objectFit: imgStyles.object_fit || 'contain',
				};

				const mainImgSrc = safeSample.activeCanvasImage || safeSample.image_url || staticFallback.image_url || '';
				const galleryUrls = Array.isArray(safeSample.gallery_urls) && safeSample.gallery_urls.length > 0
					? safeSample.gallery_urls
					: (mainImgSrc ? [mainImgSrc] : []);

				const showThumbs = imgSettings.show_thumbnails !== false;
				const showZoom = imgSettings.enable_zoom !== false;
				const showLightbox = imgSettings.enable_lightbox !== false;
				const cols = parseInt(imgSettings.gallery_columns, 10) || 4;
				const isOnSale = safeSample.on_sale || (safeSample.sale_price && safeSample.regular_price && safeSample.sale_price !== safeSample.regular_price);

				return h(
					'div',
					{ className: `sppcfw-product-gallery-preview sppcfw-w-full sppcfw-flex sppcfw-flex-col ${flexAlign} sppcfw-gap-3` },
					// Main Featured Image Frame
					h(
						'div',
						{
							className: 'sppcfw-relative sppcfw-w-full sppcfw-flex sppcfw-items-center sppcfw-justify-center',
							style: { maxWidth: imgMaxWidth }
						},
						isOnSale &&
							h(
								'span',
								{ className: 'sppcfw-absolute sppcfw-top-3 sppcfw-left-3 sppcfw-bg-[#ef4444] sppcfw-text-white sppcfw-text-xs sppcfw-px-2.5 sppcfw-py-1 sppcfw-rounded-full sppcfw-font-bold sppcfw-uppercase sppcfw-z-10 sppcfw-shadow-sm' },
								'Sale!'
							),
						mainImgSrc
							? h('img', {
									src: mainImgSrc,
									alt: safeSample.title || 'Product Featured Image',
									style: customImgStyle,
									className: 'sppcfw-w-full sppcfw-h-auto sppcfw-object-contain sppcfw-transition-all'
							  })
							: h(
									'div',
									{ className: 'sppcfw-py-12 sppcfw-text-center sppcfw-text-gray-400 sppcfw-space-y-1 sppcfw-border sppcfw-border-dashed sppcfw-rounded-lg sppcfw-w-full' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-4xl' }, 'collections'),
									h('div', { className: 'sppcfw-text-xs' }, 'No Product Image Available')
							  ),
						// Badges / Action Icons (Zoom & Lightbox)
						(showZoom || showLightbox) &&
							h(
								'div',
								{ className: 'sppcfw-absolute sppcfw-top-3 sppcfw-right-3 sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-opacity-80' },
								showZoom &&
									h(
										'span',
										{ className: 'sppcfw-bg-white/90 sppcfw-backdrop-blur sppcfw-p-1.5 sppcfw-rounded-full sppcfw-shadow-sm sppcfw-text-gray-700 sppcfw-flex sppcfw-items-center sppcfw-justify-center', title: 'Zoom Enabled' },
										h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'zoom_in')
									),
								showLightbox &&
									h(
										'span',
										{ className: 'sppcfw-bg-white/90 sppcfw-backdrop-blur sppcfw-p-1.5 sppcfw-rounded-full sppcfw-shadow-sm sppcfw-text-gray-700 sppcfw-flex sppcfw-items-center sppcfw-justify-center', title: 'Lightbox Enabled' },
										h('span', { className: 'material-symbols-outlined sppcfw-text-xs' }, 'fullscreen')
									)
							)
					),
					// Thumbnails Row (Grid or Carousel)
					showThumbs && galleryUrls.length > 1 &&
						(imgSettings.thumbs_layout === 'carousel'
							? h(
									'div',
									{
										className: 'sppcfw-relative sppcfw-w-full sppcfw-mt-2 sppcfw-flex sppcfw-items-center sppcfw-gap-1.5 sppcfw-select-none',
										style: { maxWidth: imgMaxWidth }
									},
									imgSettings.show_carousel_arrows !== false &&
										h(
											'button',
											{
												type: 'button',
												className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-rounded-full sppcfw-bg-white sppcfw-border sppcfw-border-gray-200 sppcfw-shadow-sm sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-text-gray-700 hover:sppcfw-bg-gray-100 sppcfw-shrink-0 sppcfw-transition-all',
												title: 'Previous Thumbnails'
											},
											h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'chevron_left')
										),
									h(
										'div',
										{
											className: 'sppcfw-flex sppcfw-gap-2 sppcfw-overflow-hidden sppcfw-w-full sppcfw-py-1'
										},
										galleryUrls.map((gUrl, gIdx) => {
											const isThumbActive = gUrl === mainImgSrc || (gIdx === 0 && !safeSample.activeCanvasImage);
											return h(
												'div',
												{
													key: 'g-thumb-car-' + gIdx,
													onClick: (e) => {
														e.stopPropagation();
														if (typeof safeSample.onSelectCanvasImage === 'function') {
															safeSample.onSelectCanvasImage(gUrl);
														}
													},
													className: `sppcfw-border sppcfw-rounded sppcfw-overflow-hidden sppcfw-cursor-pointer sppcfw-transition-all sppcfw-p-1 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-shrink-0 ${
														isThumbActive ? 'sppcfw-border-[#9333ea] sppcfw-ring-1 sppcfw-ring-[#9333ea]' : 'sppcfw-border-[#e5e7eb] hover:sppcfw-border-[#9333ea]'
													}`,
													style: {
														width: `calc((100% - (${cols} - 1) * 8px) / ${cols})`,
														minWidth: '40px'
													}
												},
												h('img', {
													src: gUrl,
													alt: `Gallery thumbnail ${gIdx + 1}`,
													className: 'sppcfw-max-h-16 sppcfw-w-full sppcfw-object-contain sppcfw-rounded-sm'
												})
											);
										})
									),
									imgSettings.show_carousel_arrows !== false &&
										h(
											'button',
											{
												type: 'button',
												className: 'sppcfw-w-7 sppcfw-h-7 sppcfw-rounded-full sppcfw-bg-white sppcfw-border sppcfw-border-gray-200 sppcfw-shadow-sm sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-text-gray-700 hover:sppcfw-bg-gray-100 sppcfw-shrink-0 sppcfw-transition-all',
												title: 'Next Thumbnails'
											},
											h('span', { className: 'material-symbols-outlined sppcfw-text-sm' }, 'chevron_right')
										)
							  )
							: h(
									'div',
									{
										className: 'sppcfw-grid sppcfw-gap-2 sppcfw-w-full sppcfw-mt-1',
										style: {
											maxWidth: imgMaxWidth,
											gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
										}
									},
									galleryUrls.map((gUrl, gIdx) => {
										const isThumbActive = gUrl === mainImgSrc || (gIdx === 0 && !safeSample.activeCanvasImage);
										return h(
											'div',
											{
												key: 'g-thumb-grid-' + gIdx,
												onClick: (e) => {
													e.stopPropagation();
													if (typeof safeSample.onSelectCanvasImage === 'function') {
														safeSample.onSelectCanvasImage(gUrl);
													}
												},
												className: `sppcfw-border sppcfw-rounded sppcfw-overflow-hidden sppcfw-cursor-pointer sppcfw-transition-all sppcfw-p-1 sppcfw-flex sppcfw-items-center sppcfw-justify-center ${
													isThumbActive ? 'sppcfw-border-[#9333ea] sppcfw-ring-1 sppcfw-ring-[#9333ea]' : 'sppcfw-border-[#e5e7eb] hover:sppcfw-border-[#9333ea]'
												}`
											},
											h('img', {
												src: gUrl,
												alt: `Gallery thumbnail ${gIdx + 1}`,
												className: 'sppcfw-max-h-16 sppcfw-w-full sppcfw-object-contain sppcfw-rounded-sm'
											})
										);
									})
							  )
						)
				);
			}
			case 'image': {
				const imgStyles = el.styles || {};
				const imgSettings = el.settings || {};
				const imgWidth = getResponsiveProp(imgStyles, 'width', deviceView) || '100%';
				const imgMaxWidth = getResponsiveProp(imgStyles, 'max_width', deviceView) || '100%';
				const imgOpacity = getResponsiveProp(imgStyles, 'opacity', deviceView) !== undefined ? getResponsiveProp(imgStyles, 'opacity', deviceView) : '1';
				const alignVal = getResponsiveProp(imgStyles, 'alignment', deviceView) || getResponsiveProp(imgSettings, 'alignment', deviceView) || 'center';
				const flexAlign = alignVal === 'left' ? 'justify-start text-left' : alignVal === 'right' ? 'justify-end text-right' : 'justify-center text-center';

				const radTop = getResponsiveProp(imgStyles, 'border_radius_top', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '0px';
				const radRight = getResponsiveProp(imgStyles, 'border_radius_right', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '0px';
				const radBottom = getResponsiveProp(imgStyles, 'border_radius_bottom', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '0px';
				const radLeft = getResponsiveProp(imgStyles, 'border_radius_left', deviceView) || getResponsiveProp(imgStyles, 'border_radius', deviceView) || '0px';
				const borderRadiusCss = `${radTop} ${radRight} ${radBottom} ${radLeft}`;

				const customImgSrc = imgSettings.custom_image_url || imgSettings.image_url || '';

				const customImgStyle = {
					width: imgWidth,
					maxWidth: imgMaxWidth,
					height: 'auto',
					opacity: parseFloat(imgOpacity),
					borderRadius: borderRadiusCss,
					borderStyle: imgStyles.border_type && imgStyles.border_type !== 'Default' ? imgStyles.border_type.toLowerCase() : 'none',
					borderWidth: getResponsiveProp(imgStyles, 'border_width', deviceView) || '0px',
					borderColor: getResponsiveProp(imgStyles, 'border_color', deviceView) || 'transparent',
					objectFit: imgStyles.object_fit || 'contain',
				};

				if (!customImgSrc) {
					return h(
						'div',
						{ className: `sppcfw-w-full sppcfw-flex ${flexAlign}` },
						h(
							'div',
							{
								className: 'sppcfw-w-full sppcfw-border-2 sppcfw-border-dashed sppcfw-border-[#9333ea]/50 hover:sppcfw-border-[#9333ea] sppcfw-bg-[#faf5ff] sppcfw-rounded-lg sppcfw-p-6 sppcfw-text-center sppcfw-transition-all sppcfw-cursor-pointer sppcfw-space-y-2 group',
								style: { minHeight: '140px', maxWidth: imgMaxWidth }
							},
							h('span', { className: 'material-symbols-outlined sppcfw-text-4xl sppcfw-text-[#9333ea] group-hover:sppcfw-scale-110 sppcfw-transition-transform' }, 'add_photo_alternate'),
							h('div', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#6b21a8]' }, 'Image Widget - Choose Image'),
							h('div', { className: 'sppcfw-text-[11px] sppcfw-text-[#7e22ce]' }, 'Click here or select this element to choose or upload an image')
						)
					);
				}

				return h(
					'div',
					{ className: `sppcfw-w-full sppcfw-flex sppcfw-flex-col ${flexAlign}` },
					h(
						'div',
						{ className: `sppcfw-inline-flex ${flexAlign} sppcfw-w-full` },
						h('img', {
							src: customImgSrc,
							alt: imgSettings.alt_text || 'Custom Image',
							style: customImgStyle,
							className: 'sppcfw-w-full sppcfw-h-auto sppcfw-object-contain sppcfw-transition-all inline-block'
						})
					),
					imgSettings.caption_type === 'custom' && imgSettings.custom_caption &&
						h('div', { className: 'sppcfw-text-xs sppcfw-text-[#6b7280] sppcfw-mt-1.5 sppcfw-italic' }, imgSettings.custom_caption)
				);
			}
			case 'product_add_to_cart': {
				const btnLabel = (settings && settings.button_text) ||
					(typeof addToCartBtnText !== 'undefined' && addToCartBtnText) ||
					(typeof window !== 'undefined' && window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.add_to_cart_button_text) ||
					'Add to cart';

				const customBtnBg = getResponsiveProp(styles, 'btn_bg_color', deviceView) || getResponsiveProp(styles, 'bg_color', deviceView);
				const customBtnColor = getResponsiveProp(styles, 'btn_text_color', deviceView) || getResponsiveProp(styles, 'text_color', deviceView);
				const btnBg = customBtnBg && customBtnBg !== 'transparent' ? customBtnBg : '#9333ea';
				const btnColor = customBtnColor || '#ffffff';
				const btnFontSize = getResponsiveProp(styles, 'btn_font_size', deviceView) || getResponsiveProp(styles, 'font_size', deviceView) || '14px';
				const btnFontWeight = getResponsiveProp(styles, 'font_weight', deviceView) || 'bold';
				const btnFontFamily = getResponsiveProp(styles, 'font_family', deviceView);

				// 4-box or single border radius
				const radT = getResponsiveProp(styles, 'btn_border_radius_top', deviceView) || '4px';
				const radR = getResponsiveProp(styles, 'btn_border_radius_right', deviceView) || '4px';
				const radB = getResponsiveProp(styles, 'btn_border_radius_bottom', deviceView) || '4px';
				const radL = getResponsiveProp(styles, 'btn_border_radius_left', deviceView) || '4px';
				const hasFourRad = styles && (styles.btn_border_radius_top !== undefined || styles.btn_border_radius_right !== undefined || styles.btn_border_radius_bottom !== undefined || styles.btn_border_radius_left !== undefined);
				const btnRadius = hasFourRad ? `${radT} ${radR} ${radB} ${radL}` : (getResponsiveProp(styles, 'btn_border_radius', deviceView) || '4px');

				// 4-box or default button padding
				const padT = getResponsiveProp(styles, 'btn_padding_top', deviceView) || '10px';
				const padR = getResponsiveProp(styles, 'btn_padding_right', deviceView) || '24px';
				const padB = getResponsiveProp(styles, 'btn_padding_bottom', deviceView) || '10px';
				const padL = getResponsiveProp(styles, 'btn_padding_left', deviceView) || '24px';
				const btnPadding = `${padT} ${padR} ${padB} ${padL}`;

				// Alignment & Gap
				const alignVal = getResponsiveProp(styles, 'alignment', deviceView) || 'left';
				const alignFlex = alignVal === 'center' ? 'sppcfw-justify-center' : (alignVal === 'right' ? 'sppcfw-justify-end' : 'sppcfw-justify-start');
				const gapVal = getResponsiveProp(styles, 'gap', deviceView) || '12px';

				// Quantity Box Styles
				const qtyBg = getResponsiveProp(styles, 'qty_bg_color', deviceView) || '#ffffff';
				const qtyColor = getResponsiveProp(styles, 'qty_text_color', deviceView) || '#111827';
				const qtyBorder = getResponsiveProp(styles, 'qty_border_color', deviceView) || '#d1d5db';
				const qtyBtnBg = getResponsiveProp(styles, 'qty_btn_bg', deviceView) || '#f3f4f6';
				const qtyBtnColor = getResponsiveProp(styles, 'qty_btn_color', deviceView) || '#374151';

				// Check if plus/minus button is enabled
				const isPlusMinusOn = (settings && settings.enable_plus_minus_button === 'on') ||
					(typeof window !== 'undefined' && window.SPPCFWBuilderConfig && window.SPPCFWBuilderConfig.basic_settings && window.SPPCFWBuilderConfig.basic_settings.enable_plus_minus_button === 'on');

				const hasVariations = safeSample && safeSample.variations && safeSample.variations.length > 0;
				const varDisplayType = (settings && settings.variation_display_type) || 'swatches';
				const swatchShape = (settings && settings.swatch_shape) || 'circle';
				const showLabels = settings && settings.show_attribute_labels !== undefined ? settings.show_attribute_labels : true;
				const showReset = !!(settings && settings.show_variation_reset);

				// Swatches & Variation Styles
				const varLabelColor = getResponsiveProp(styles, 'var_label_color', deviceView) || '#111827';
				const varLabelSize = getResponsiveProp(styles, 'var_label_size', deviceView) || '13px';
				const swatchSize = getResponsiveProp(styles, 'swatch_size', deviceView) || '36px';
				const customRadius = getResponsiveProp(styles, 'swatch_border_radius', deviceView);
				const swatchRadius = (customRadius !== undefined && customRadius !== null && customRadius !== '')
					? customRadius
					: (swatchShape === 'circle' ? '50%' : (swatchShape === 'square' ? '2px' : '6px'));
				const activeSwatchColor = getResponsiveProp(styles, 'active_swatch_color', deviceView) || '#007cba';
				const swatchGap = getResponsiveProp(styles, 'swatch_gap', deviceView) || '8px';

				const colorHexMap = {
					'black': '#111827',
					'purple': '#9333ea',
					'blue': '#3b82f6',
					'red': '#ef4444',
					'green': '#10b981',
					'yellow': '#f59e0b',
					'white': '#ffffff',
					'gray': '#6b7280',
					'grey': '#6b7280',
					'pink': '#ec4899',
					'orange': '#f97316'
				};

				// Find matched variation
				const availVars = (safeSample && safeSample.available_variations) || [];
				const activeAttrs = (safeSample && safeSample.activeVariationAttrs) || {};
				let matchedVar = null;

				if (availVars.length > 0) {
					for (const v of availVars) {
						if (v.attributes) {
							let match = true;
							for (const k in v.attributes) {
								const cleanK = k.replace('attribute_', '').replace('pa_', '').toLowerCase();
								const vVal = (v.attributes[k] || '').toLowerCase();
								if (vVal === '') continue; // wildcard
								const chosen = (activeAttrs[cleanK] || activeAttrs['attribute_' + cleanK] || activeAttrs['pa_' + cleanK] || activeAttrs[k] || '').toLowerCase();
								if (chosen && vVal !== chosen) {
									match = false;
									break;
								}
							}
							if (match) {
								matchedVar = v;
								break;
							}
						}
					}
					if (!matchedVar && availVars.length > 0) {
						matchedVar = availVars[0];
					}
				}

				return h(
					'div',
					{ className: 'sppcfw-space-y-3 sppcfw-w-full' },

					// 1. Variation Section (Swatches Mode)
					hasVariations && varDisplayType === 'swatches' &&
						h(
							'div',
							{ className: 'sppcfw-w-full sppcfw-mb-2' },
							h(
								'table',
								{ className: 'variations sppcfw-w-full', style: { borderCollapse: 'separate', borderSpacing: '0 8px' } },
								h(
									'tbody',
									null,
									safeSample.variations.map((attr, aIdx) => {
										const isColor = (attr.name && attr.name.toLowerCase().includes('color')) || (attr.label && attr.label.toLowerCase().includes('color'));
										const attrKey = attr.name || attr.label || `attr_${aIdx}`;
										const cleanKey = String(attrKey).replace('attribute_', '').replace('pa_', '');
										const selectedOpt = (safeSample.activeVariationAttrs && (safeSample.activeVariationAttrs[cleanKey] || safeSample.activeVariationAttrs[attrKey] || safeSample.activeVariationAttrs[attr.name] || safeSample.activeVariationAttrs[attr.label])) || (attr.options && attr.options[0]);

										return h(
											'tr',
											{ key: attr.name || aIdx, className: 'sppcfw-bg-[#f9fafb] sppcfw-rounded-md' },
											showLabels &&
												h(
													'th',
													{
														className: 'label sppcfw-text-left sppcfw-py-2.5 sppcfw-px-3.5 sppcfw-font-bold sppcfw-text-xs sppcfw-w-32 sppcfw-align-middle sppcfw-text-[#111827]',
														style: { color: varLabelColor, fontSize: varLabelSize }
													},
													`${attr.label || attr.name}`
												),
											h(
												'td',
												{ className: 'value sppcfw-py-2.5 sppcfw-px-3.5 sppcfw-align-middle' },
												h(
													'div',
													{ className: 'cu_button_el sppcfw-flex sppcfw-items-center sppcfw-flex-wrap', style: { gap: swatchGap } },
													(attr.options || []).map((opt) => {
														const isActive = selectedOpt === opt;
														if (isColor) {
															const optLower = String(opt).toLowerCase().trim();
															const hexColor = colorHexMap[optLower] || (optLower.startsWith('#') ? optLower : '#3b82f6');
															return h(
																'button',
																{
																	type: 'button',
																	key: opt,
																	title: opt,
																	onClick: (e) => {
																		e.stopPropagation();
																		if (typeof safeSample.onSelectVariationOption === 'function') {
																			safeSample.onSelectVariationOption(cleanKey, opt);
																		}
																	},
																	className: `webfwc_variation_button color ${isActive ? 'selected' : ''}`,
																	style: {
																		backgroundColor: hexColor,
																		width: swatchSize,
																		height: swatchSize,
																		minWidth: swatchSize,
																		minHeight: swatchSize,
																		borderRadius: swatchRadius,
																		border: '2px solid #ffffff',
																		boxShadow: isActive ? `0 0 0 2px ${activeSwatchColor || '#007cba'}` : '0 0 0 1px #ddd',
																		position: 'relative',
																		cursor: 'pointer',
																		display: 'inline-flex',
																		alignItems: 'center',
																		justifyContent: 'center',
																		transition: 'all 0.2s ease',
																		padding: 0,
																		outline: 'none',
																	}
																},
																isActive
																	? h('span', {
																			style: {
																				display: 'block',
																				width: '12px',
																				height: '6px',
																				borderLeft: '2.5px solid #10b981',
																				borderBottom: '2.5px solid #10b981',
																				transform: 'rotate(-45deg)',
																				marginTop: '-2px',
																			}
																	  })
																	: null
															);
														}
														return h(
															'button',
															{
																type: 'button',
																key: opt,
																onClick: (e) => {
																	e.stopPropagation();
																	if (typeof safeSample.onSelectVariationOption === 'function') {
																		safeSample.onSelectVariationOption(cleanKey, opt);
																	}
																},
																className: `webfwc_variation_button button ${isActive ? 'selected' : ''}`,
																style: {
																	borderRadius: swatchRadius,
																	boxShadow: isActive ? `0 0 0 2px ${activeSwatchColor || '#007cba'}` : '0 0 0 1px #ddd',
																	border: '2px solid #ffffff',
																	padding: '6px 14px',
																	minHeight: swatchSize,
																	minWidth: '40px',
																	position: 'relative',
																	background: isActive ? '#ffffff' : '#f3f4f6',
																	color: isActive ? '#111827' : '#374151',
																	cursor: 'pointer',
																	fontSize: '13px',
																	fontWeight: '600',
																	display: 'inline-flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	gap: '6px',
																	transition: 'all 0.2s ease',
																	outline: 'none',
																}
															},
															[
																h('span', { key: 'txt' }, opt),
																isActive
																	? h('span', {
																			key: 'chk',
																			style: {
																				display: 'inline-block',
																				width: '9px',
																				height: '5px',
																				borderLeft: '2px solid #10b981',
																				borderBottom: '2px solid #10b981',
																				transform: 'rotate(-45deg)',
																				marginLeft: '1px',
																				marginBottom: '1px',
																			}
																	  })
																	: null
															]
														);
													})
												)
											)
										);
									})
								)
							),
							(showReset || Object.keys(safeSample.activeVariationAttrs || {}).length > 0) &&
								h(
									'div',
									{ className: 'sppcfw-pt-1.5 sppcfw-pb-1' },
									h('a', {
										onClick: (e) => {
											e.stopPropagation();
											if (typeof safeSample.onResetVariation === 'function') {
												safeSample.onResetVariation();
											}
										},
										className: 'sppcfw-text-[12px] sppcfw-text-[#4b5563] hover:sppcfw-text-[#9333ea] sppcfw-font-medium sppcfw-cursor-pointer sppcfw-inline-block hover:sppcfw-underline'
									}, 'Clear')
								)
						),

					// 2. Variation Section (Dropdown Mode)
					hasVariations && varDisplayType === 'dropdown' &&
						h(
							'div',
							{ className: 'sppcfw-w-full sppcfw-mb-2' },
							h(
								'table',
								{ className: 'variations sppcfw-w-full', style: { borderCollapse: 'separate', borderSpacing: '0 8px' } },
								h(
									'tbody',
									null,
									safeSample.variations.map((attr, aIdx) => {
										const attrKey = attr.name || attr.label || `attr_${aIdx}`;
										const cleanKey = String(attrKey).replace('attribute_', '').replace('pa_', '');
										const selectedOpt = (safeSample.activeVariationAttrs && (safeSample.activeVariationAttrs[cleanKey] || safeSample.activeVariationAttrs[attrKey] || safeSample.activeVariationAttrs[attr.name] || safeSample.activeVariationAttrs[attr.label])) || '';

										return h(
											'tr',
											{ key: attr.name || aIdx, className: 'sppcfw-bg-[#f9fafb] sppcfw-rounded-md' },
											showLabels &&
												h(
													'th',
													{
														className: 'label sppcfw-text-left sppcfw-py-2.5 sppcfw-px-3.5 sppcfw-font-bold sppcfw-text-xs sppcfw-w-32 sppcfw-align-middle sppcfw-text-[#111827]',
														style: { color: varLabelColor, fontSize: varLabelSize }
													},
													`${attr.label || attr.name}`
												),
											h(
												'td',
												{ className: 'value sppcfw-py-2.5 sppcfw-px-3.5 sppcfw-align-middle' },
												h(
													'select',
													{
														className: 'sppcfw-bg-[#ffffff] sppcfw-border sppcfw-border-[#d1d5db] sppcfw-rounded sppcfw-px-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-[#111827] focus:sppcfw-outline-none focus:sppcfw-ring-1 focus:sppcfw-ring-[#9333ea] sppcfw-w-48',
														value: selectedOpt,
														onChange: (e) => {
															if (typeof safeSample.onSelectVariationOption === 'function') {
																safeSample.onSelectVariationOption(cleanKey, e.target.value);
															}
														}
													},
													h('option', { value: '' }, `Choose an option`),
													(attr.options || []).map(opt => h('option', { key: opt, value: opt }, opt))
												)
											)
										);
									})
								)
							),
							(showReset || Object.keys(safeSample.activeVariationAttrs || {}).length > 0) &&
								h(
									'div',
									{ className: 'sppcfw-pt-1.5 sppcfw-pb-1' },
									h('a', {
										onClick: (e) => {
											e.stopPropagation();
											if (typeof safeSample.onResetVariation === 'function') {
												safeSample.onResetVariation();
											}
										},
										className: 'sppcfw-text-[12px] sppcfw-text-[#4b5563] hover:sppcfw-text-[#9333ea] sppcfw-font-medium sppcfw-cursor-pointer sppcfw-inline-block hover:sppcfw-underline'
									}, 'Clear')
								)
						),

					// 3. Variation Section (Table / Grid Mode)
					hasVariations && varDisplayType === 'table' &&
						h(
							'div',
							{ className: 'sppcfw-border sppcfw-border-[#e5e7eb] sppcfw-rounded-lg sppcfw-overflow-hidden sppcfw-mb-3 sppcfw-shadow-xs' },
							h(
								'table',
								{ className: 'sppcfw-w-full sppcfw-text-xs sppcfw-text-left' },
								h(
									'thead',
									{ className: 'sppcfw-bg-[#f9fafb] sppcfw-border-b sppcfw-border-[#e5e7eb] sppcfw-text-[#4b5563] sppcfw-font-semibold' },
									h(
										'tr',
										null,
										h('th', { className: 'sppcfw-p-2.5' }, 'Variation'),
										h('th', { className: 'sppcfw-p-2.5' }, 'Price'),
										h('th', { className: 'sppcfw-p-2.5' }, 'Stock'),
										h('th', { className: 'sppcfw-p-2.5 sppcfw-text-center' }, 'Select')
									)
								),
								h(
									'tbody',
									{ className: 'sppcfw-divide-y sppcfw-divide-[#e5e7eb] sppcfw-bg-white' },
									(function() {
										if (safeSample && safeSample.available_variations && safeSample.available_variations.length > 0) {
											return safeSample.available_variations.map((vRow, rIdx) => {
												const isRowSelected = safeSample.activeCanvasImage === vRow.image_url || (rIdx === 0 && !safeSample.activeCanvasImage);
												return h(
													'tr',
													{
														key: vRow.variation_id || rIdx,
														onClick: () => {
															if (vRow.image_url && typeof safeSample.onSelectCanvasImage === 'function') {
																safeSample.onSelectCanvasImage(vRow.image_url);
															}
															if (vRow.attributes && typeof safeSample.onSelectVariationOption === 'function') {
																for (const k in vRow.attributes) {
																	const cK = k.replace('attribute_', '').replace('pa_', '');
																	safeSample.onSelectVariationOption(cK, vRow.attributes[k]);
																}
															}
														},
														className: `sppcfw-cursor-pointer hover:sppcfw-bg-purple-50/50 sppcfw-transition-colors ${isRowSelected ? 'sppcfw-bg-[#faf5ff]' : ''}`
													},
													h('td', { className: 'sppcfw-p-2.5 sppcfw-font-medium sppcfw-text-[#111827]' }, vRow.name),
													h('td', {
														className: 'sppcfw-p-2.5 sppcfw-font-bold sppcfw-text-[#9333ea] sppcfw-var-price-cell',
														dangerouslySetInnerHTML: { __html: vRow.price || safeSample.price || '$49.99' }
													}),
													h('td', { className: `sppcfw-p-2.5 sppcfw-font-medium ${vRow.is_in_stock === false ? 'sppcfw-text-red-500' : 'sppcfw-text-green-600'}` }, vRow.stock || 'In Stock'),
													h(
														'td',
														{ className: 'sppcfw-p-2.5 sppcfw-text-center' },
														h('input', {
															type: 'radio',
															name: 'builder_demo_variation_radio',
															className: 'sppcfw-accent-[#9333ea] sppcfw-cursor-pointer',
															checked: isRowSelected,
															onChange: () => {}
														})
													)
												);
											});
										}
										let combinations = [];
										if (safeSample && safeSample.variations && safeSample.variations.length > 0) {
											const attr1 = safeSample.variations[0];
											const attr2 = safeSample.variations[1];
											if (attr1 && attr2) {
												(attr1.options || []).forEach(o1 => {
													(attr2.options || []).slice(0, 2).forEach(o2 => {
														combinations.push({ name: `${o1} / ${o2}`, price: safeSample.price || '$49.99', stock: 'In Stock' });
													});
												});
											} else if (attr1) {
												(attr1.options || []).forEach(o1 => {
													combinations.push({ name: String(o1), price: safeSample.price || '$49.99', stock: 'In Stock' });
												});
											}
										}
										if (combinations.length === 0) {
											combinations = [
												{ name: 'Black / M', price: safeSample.price || '$49.99', stock: 'In Stock' },
												{ name: 'Purple / L', price: safeSample.price || '$54.99', stock: 'In Stock' },
												{ name: 'Blue / XL', price: safeSample.price || '$59.99', stock: '2 Left' }
											];
										}
										return combinations.slice(0, 5).map((vRow, rIdx) =>
											h(
												'tr',
												{ key: rIdx, className: rIdx === 0 ? 'sppcfw-bg-[#faf5ff]' : '' },
												h('td', { className: 'sppcfw-p-2.5 sppcfw-font-medium sppcfw-text-[#111827]' }, vRow.name),
												h('td', {
													className: 'sppcfw-p-2.5 sppcfw-font-bold sppcfw-text-[#9333ea] sppcfw-var-price-cell',
													dangerouslySetInnerHTML: { __html: vRow.price || '$49.99' }
												}),
												h('td', { className: 'sppcfw-p-2.5 sppcfw-text-green-600 sppcfw-font-medium' }, vRow.stock),
												h(
													'td',
													{ className: 'sppcfw-p-2.5 sppcfw-text-center' },
													h('input', {
														type: 'radio',
														name: 'builder_demo_variation_radio',
														className: 'sppcfw-accent-[#9333ea] sppcfw-cursor-pointer',
														defaultChecked: rIdx === 0
													})
												)
											)
										);
									})()
								)
							)
						),

					// 3.5 Matched Variation Price & Stock Info (Single Variation Wrap)
					hasVariations && varDisplayType !== 'table' && matchedVar && (matchedVar.price || matchedVar.stock) &&
						h(
							'div',
							{ className: 'woocommerce-variation single_variation sppcfw-space-y-1 sppcfw-my-2.5' },
							matchedVar.price &&
								h('div', {
									className: 'woocommerce-variation-price sppcfw-text-lg sppcfw-font-extrabold sppcfw-text-[#111827] [&_del]:sppcfw-opacity-60 [&_del]:sppcfw-font-normal [&_del]:sppcfw-text-gray-400 [&_del]:sppcfw-mr-2 [&_del]:sppcfw-line-through [&_ins]:sppcfw-no-underline',
									dangerouslySetInnerHTML: { __html: matchedVar.price }
								}),
							matchedVar.stock &&
								h('div', {
									className: `woocommerce-variation-availability sppcfw-text-xs sppcfw-font-semibold ${matchedVar.is_in_stock === false ? 'sppcfw-text-red-500' : 'sppcfw-text-[#16a34a]'}`
								}, matchedVar.stock)
						),

					// 4. Quantity & Add to Cart Button Row
					h(
						'div',
						{ className: `sppcfw-flex sppcfw-items-center ${alignFlex}`, style: { gap: gapVal } },
						isPlusMinusOn
							? h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-border sppcfw-rounded sppcfw-overflow-hidden', style: { borderColor: qtyBorder, backgroundColor: qtyBg } },
									h('button', { type: 'button', className: 'sppcfw-w-8 sppcfw-h-10 sppcfw-font-bold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-border-r sppcfw-cursor-pointer sppcfw-select-none', style: { backgroundColor: qtyBtnBg, color: qtyBtnColor, borderRightColor: qtyBorder } }, '-'),
									h('input', { type: 'number', defaultValue: 1, min: 1, className: 'sppcfw-w-12 sppcfw-h-10 sppcfw-text-center sppcfw-font-bold sppcfw-border-0 sppcfw-outline-none focus:sppcfw-ring-0', style: { backgroundColor: qtyBg, color: qtyColor } }),
									h('button', { type: 'button', className: 'sppcfw-w-8 sppcfw-h-10 sppcfw-font-bold sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-border-l sppcfw-cursor-pointer sppcfw-select-none', style: { backgroundColor: qtyBtnBg, color: qtyBtnColor, borderLeftColor: qtyBorder } }, '+')
							  )
							: h('input', { type: 'number', defaultValue: 1, min: 1, className: 'sppcfw-w-16 sppcfw-p-2 sppcfw-border sppcfw-rounded sppcfw-text-center sppcfw-font-bold', style: { borderColor: qtyBorder, backgroundColor: qtyBg, color: qtyColor } }),
						h('button', {
							className: 'sppcfw-shadow sppcfw-transition-all',
							style: {
								backgroundColor: btnBg,
								color: btnColor,
								borderRadius: btnRadius,
								fontSize: btnFontSize,
								fontWeight: btnFontWeight !== 'Default' ? btnFontWeight : 'bold',
								fontFamily: btnFontFamily && btnFontFamily !== 'Inherit' ? `${btnFontFamily}, sans-serif` : undefined,
								padding: btnPadding,
							}
						}, btnLabel)
					)
				);
			}
			case 'product_rating': {
				const rCount = safeSample.rating_count !== undefined ? safeSample.rating_count : 5;
				const starColor = getResponsiveProp(styles, 'star_color', deviceView) || getResponsiveProp(styles, 'text_color', deviceView) || '#f59e0b';
				const emptyStarColor = getResponsiveProp(styles, 'empty_star_color', deviceView) || '#d1d5db';
				const starSize = getResponsiveProp(styles, 'star_size', deviceView) || '18px';
				const reviewCountColor = getResponsiveProp(styles, 'review_count_color', deviceView) || '#6b7280';
				const reviewFontSize = getResponsiveProp(styles, 'review_font_size', deviceView) || '14px';
				const reviewFontWeight = getResponsiveProp(styles, 'review_font_weight', deviceView) || '400';
				const gap = getResponsiveProp(styles, 'gap', deviceView) || '8px';
				const alignment = getResponsiveProp(styles, 'alignment', deviceView) || 'left';
				const justifyClass = alignment === 'center' ? 'sppcfw-justify-center' : alignment === 'right' ? 'sppcfw-justify-end' : 'sppcfw-justify-start';

				return h(
					'div',
					{
						className: `sppcfw-flex sppcfw-items-center ${justifyClass}`,
						style: { gap: gap }
					},
					h('span', {
						className: 'sppcfw-flex sppcfw-items-center sppcfw-select-none',
						style: {
							color: starColor,
							fontSize: starSize,
							lineHeight: 1,
							letterSpacing: '2px',
						}
					}, '★★★★★'),
					h('span', {
						className: 'sppcfw-transition-colors',
						style: {
							color: reviewCountColor,
							fontSize: reviewFontSize,
							fontWeight: reviewFontWeight !== 'Default' ? reviewFontWeight : undefined,
							lineHeight: 1,
						}
					}, `(${rCount} reviews)`)
				);
			}
			case 'product_short_desc':
				return h('p', {
					className: `sppcfw-text-sm sppcfw-transition-all ${alignClass}`,
					style: {
						color: getResponsiveProp(styles, 'text_color', deviceView) || '#4b5563',
						fontSize: getResponsiveProp(styles, 'font_size', deviceView) || undefined,
						lineHeight: getResponsiveProp(styles, 'line_height', deviceView) || undefined,
					}
				}, safeSample.short_description || staticFallback.short_description || 'Product short description placeholder.');
			case 'product_description':
				const activeTabCol = getResponsiveProp(styles, 'active_tab_color', deviceView) || '#9333ea';
				const descBg = getResponsiveProp(styles, 'bg_color', deviceView) || '#f9fafb';
				return h(
					'div',
					{
						className: 'sppcfw-border sppcfw-border-[#e5e7eb] sppcfw-rounded sppcfw-p-4',
						style: { backgroundColor: descBg }
					},
					h('h3', {
						className: 'sppcfw-font-bold sppcfw-border-b sppcfw-pb-2 sppcfw-mb-2',
						style: {
							color: getResponsiveProp(styles, 'text_color', deviceView) || '#111827',
							borderBottomColor: activeTabCol,
						}
					}, 'Description'),
					h('p', { className: 'sppcfw-text-sm sppcfw-text-[#4b5563]' }, safeSample.description || staticFallback.description || 'Full product description placeholder.')
				);
			case 'product_meta':
				const labelColor = getResponsiveProp(styles, 'label_color', deviceView) || '#111827';
				const metaValColor = getResponsiveProp(styles, 'text_color', deviceView) || '#6b7280';
				const metaFontSize = getResponsiveProp(styles, 'font_size', deviceView) || '12px';
				const metaGap = getResponsiveProp(styles, 'gap', deviceView) || '4px';
				return h(
					'div',
					{
						className: 'sppcfw-text-xs sppcfw-flex sppcfw-flex-col',
						style: { color: metaValColor, fontSize: metaFontSize, gap: metaGap }
					},
					h('div', null, h('strong', { style: { color: labelColor } }, 'SKU: '), safeSample.sku || staticFallback.sku || 'SAMPLE-SKU-123'),
					h('div', null, h('strong', { style: { color: labelColor } }, 'Category: '), safeSample.categories || staticFallback.categories || 'Clothing'),
					safeSample.tags && h('div', null, h('strong', { style: { color: labelColor } }, 'Tags: '), safeSample.tags || staticFallback.tags)
				);
			case 'product_meta_item':
				return h(
					'div',
					{ className: 'sppcfw-p-2.5 sppcfw-bg-[#f3f4f6] sppcfw-rounded sppcfw-border sppcfw-border-[#e5e7eb] sppcfw-text-sm sppcfw-flex sppcfw-items-center sppcfw-justify-between' },
					h('span', { className: 'sppcfw-font-semibold sppcfw-text-[#111827]' }, el.label),
					h('span', { className: 'sppcfw-text-[#4b5563] font-mono sppcfw-text-xs' }, el.metaKey || 'Meta Field')
				);
			case 'custom_message':
				const cmBg = getResponsiveProp(styles, 'bg_color', deviceView) || '#faf5ff';
				const cmText = getResponsiveProp(styles, 'text_color', deviceView) || '#7e22ce';
				const cmBorder = getResponsiveProp(styles, 'border_color', deviceView) || '#9333ea';
				return h(
					'div',
					{
						className: 'sppcfw-p-3 sppcfw-border-l-4 sppcfw-rounded-r sppcfw-text-xs sppcfw-font-medium',
						style: { backgroundColor: cmBg, color: cmText, borderLeftColor: cmBorder }
					},
					settings && settings.custom_message ? settings.custom_message : '✨ Limited Offer: Free Shipping on orders over $50!'
				);
			case 'plus_minus_buttons':
				const pmbBg = getResponsiveProp(styles, 'btn_bg_color', deviceView) || getResponsiveProp(styles, 'bg_color', deviceView) || '#f3f4f6';
				const pmbColor = getResponsiveProp(styles, 'btn_text_color', deviceView) || getResponsiveProp(styles, 'text_color', deviceView) || '#111827';
				const pmbBorder = getResponsiveProp(styles, 'border_color', deviceView) || '#d1d5db';
				return h(
					'div',
					{
						className: 'sppcfw-inline-flex sppcfw-items-center sppcfw-border sppcfw-rounded sppcfw-overflow-hidden',
						style: { borderColor: pmbBorder }
					},
					h('button', { className: 'sppcfw-px-3 sppcfw-py-1 sppcfw-font-bold', style: { backgroundColor: pmbBg, color: pmbColor } }, '-'),
					h('span', { className: 'sppcfw-px-4 sppcfw-py-1 sppcfw-text-sm sppcfw-font-bold sppcfw-text-[#111827]' }, '1'),
					h('button', { className: 'sppcfw-px-3 sppcfw-py-1 sppcfw-font-bold', style: { backgroundColor: pmbBg, color: pmbColor } }, '+')
				);
			case 'variation_swatches': {
				const variationsList = (safeSample && safeSample.variations && safeSample.variations.length > 0)
					? safeSample.variations
					: [
							{ name: 'pa_color', label: 'Color', options: ['Black', 'Purple', 'Blue'] },
							{ name: 'pa_size', label: 'Size', options: ['S', 'M', 'L', 'XL'] }
					  ];

				const colorHexMap = {
					'black': '#111827',
					'purple': '#9333ea',
					'blue': '#3b82f6',
					'red': '#ef4444',
					'green': '#10b981',
					'yellow': '#f59e0b',
					'white': '#ffffff',
					'gray': '#6b7280',
					'grey': '#6b7280',
					'pink': '#ec4899',
					'orange': '#f97316'
				};

				return h(
					'div',
					{ className: 'sppcfw-border sppcfw-border-[#e5e7eb] sppcfw-rounded-lg sppcfw-p-3.5 sppcfw-bg-[#f9fafb] sppcfw-space-y-3 sppcfw-my-1' },
					h('div', { className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2 sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#111827]' },
						h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#9333ea]' }, 'grid_view'),
						'Product Variations & Swatches'
					),
					h(
						'div',
						{ className: 'sppcfw-space-y-2.5' },
						variationsList.map((attr, aIdx) => {
							const isColor = (attr.name && attr.name.toLowerCase().includes('color')) || (attr.label && attr.label.toLowerCase().includes('color'));
							return h(
								'div',
								{ key: attr.name || aIdx, className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2' },
								h('span', { className: 'sppcfw-text-xs sppcfw-font-medium sppcfw-w-16 sppcfw-text-gray-700' }, `${attr.label || attr.name}:`),
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-gap-1.5 sppcfw-flex-wrap' },
									(attr.options || []).map((opt, oIdx) => {
										if (isColor) {
											const optLower = String(opt).toLowerCase().trim();
											const hexColor = colorHexMap[optLower] || '#9333ea';
											return h('span', {
												key: opt,
												title: opt,
												className: `sppcfw-w-6 sppcfw-h-6 sppcfw-rounded-full sppcfw-border-2 sppcfw-shadow-sm sppcfw-cursor-pointer sppcfw-inline-block ${oIdx === 0 ? 'sppcfw-border-[#9333ea] sppcfw-ring-2 sppcfw-ring-[#9333ea]/30' : 'sppcfw-border-white'}`,
												style: { backgroundColor: hexColor }
											});
										}
										return h(
											'span',
											{
												key: opt,
												className: `sppcfw-px-2.5 sppcfw-py-0.5 sppcfw-text-xs sppcfw-rounded sppcfw-border sppcfw-cursor-pointer ${oIdx === 0 ? 'sppcfw-border-[#9333ea] sppcfw-bg-[#9333ea] sppcfw-text-white sppcfw-font-bold' : 'sppcfw-border-[#d1d5db] sppcfw-bg-white sppcfw-text-gray-700'}`
											},
											opt
										);
									})
								)
							);
						})
					)
				);
			}
			case 'related_products':
			case 'upsell_products': {
				const isRelated = el.type === 'related_products';
				const titleText = isRelated ? 'Related products' : 'You may also like…';
				const rawList = isRelated ? (safeSample && safeSample.related_products) : (safeSample && safeSample.upsell_products);
				const productList = (rawList && rawList.length > 0)
					? rawList
					: [1, 2, 3, 4].map(idx => ({
							id: idx,
							title: `${isRelated ? 'Related' : 'Upsell'} Product ${idx}`,
							price: `$${(19.99 * idx).toFixed(2)}`,
							image_url: ''
					  }));

				return h(
					'div',
					{ className: 'sppcfw-w-full sppcfw-space-y-3 sppcfw-my-2' },
					h('h2', { className: 'sppcfw-text-base sppcfw-font-bold sppcfw-text-[#111827]' }, titleText),
					h(
						'div',
						{ className: 'sppcfw-grid sppcfw-grid-cols-2 md:sppcfw-grid-cols-4 sppcfw-gap-3' },
						productList.slice(0, 4).map((prodItem, idx) =>
							h(
								'div',
								{ key: prodItem.id || idx, className: 'sppcfw-border sppcfw-border-[#e5e7eb] sppcfw-rounded-lg sppcfw-p-2.5 sppcfw-bg-white sppcfw-space-y-1.5 sppcfw-shadow-sm sppcfw-flex sppcfw-flex-col sppcfw-justify-between' },
								h(
									'div',
									{ className: 'sppcfw-space-y-1.5' },
									h(
										'div',
										{ className: 'sppcfw-w-full sppcfw-h-24 sppcfw-bg-[#f3f4f6] sppcfw-rounded sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-text-gray-400 sppcfw-overflow-hidden' },
										prodItem.image_url
											? h('img', { src: prodItem.image_url, alt: prodItem.title, className: 'sppcfw-w-full sppcfw-h-full sppcfw-object-cover' })
											: h('span', { className: 'material-symbols-outlined sppcfw-text-2xl' }, 'shopping_bag')
									),
									h('div', { className: 'sppcfw-text-[11px] sppcfw-font-semibold sppcfw-text-[#111827] sppcfw-truncate', title: prodItem.title }, prodItem.title),
									h('div', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-[#9333ea]', dangerouslySetInnerHTML: typeof prodItem.price === 'string' && prodItem.price.includes('<') ? { __html: prodItem.price } : undefined }, typeof prodItem.price === 'string' && prodItem.price.includes('<') ? undefined : prodItem.price)
								),
								h('div', { className: 'sppcfw-w-full sppcfw-py-1 sppcfw-bg-[#f3f4f6] sppcfw-text-center sppcfw-rounded sppcfw-text-[10px] sppcfw-font-bold sppcfw-text-gray-700 sppcfw-mt-2' }, 'Add to cart')
							)
						)
					)
				);
			}
			default:
				return h('div', { className: 'sppcfw-p-3 sppcfw-border sppcfw-border-dashed sppcfw-text-xs sppcfw-text-[#6b7280]' }, el.label);
		}
	}

	// 6. Display Conditions Modal Component
	function DisplayConditionsModal({ displayConditions, setDisplayConditions, categories = [], products = [], closeModal, saveTemplate }) {
		const [searchCat, setSearchCat] = useState('');
		const [searchProd, setSearchProd] = useState('');

		const currentScope = displayConditions.scope || 'entire';
		const selectedCategoryIds = Array.isArray(displayConditions.category_ids) ? displayConditions.category_ids.map(Number) : [];
		const selectedProductIds = Array.isArray(displayConditions.product_ids) ? displayConditions.product_ids.map(Number) : [];

		function handleScopeChange(scope) {
			setDisplayConditions(prev => ({ ...prev, scope }));
		}

		function toggleCategory(catId) {
			const idNum = Number(catId);
			const exists = selectedCategoryIds.includes(idNum);
			const updated = exists ? selectedCategoryIds.filter(id => id !== idNum) : [...selectedCategoryIds, idNum];
			setDisplayConditions(prev => ({ ...prev, category_ids: updated }));
		}

		function selectAllCategories() {
			setDisplayConditions(prev => ({ ...prev, category_ids: categories.map(c => Number(c.id)) }));
		}

		function clearCategories() {
			setDisplayConditions(prev => ({ ...prev, category_ids: [] }));
		}

		function toggleProduct(prodId) {
			const idNum = Number(prodId);
			const exists = selectedProductIds.includes(idNum);
			const updated = exists ? selectedProductIds.filter(id => id !== idNum) : [...selectedProductIds, idNum];
			setDisplayConditions(prev => ({ ...prev, product_ids: updated }));
		}

		function selectAllProducts() {
			setDisplayConditions(prev => ({ ...prev, product_ids: products.map(p => Number(p.id)) }));
		}

		function clearProducts() {
			setDisplayConditions(prev => ({ ...prev, product_ids: [] }));
		}

		const filteredCategories = categories.filter(cat => {
			if (!searchCat.trim()) return true;
			const term = searchCat.toLowerCase();
			return (cat.name || '').toLowerCase().includes(term) || (cat.slug || '').toLowerCase().includes(term);
		});

		const filteredProducts = products.filter(prod => {
			if (!searchProd.trim()) return true;
			const term = searchProd.toLowerCase();
			return (prod.title || '').toLowerCase().includes(term) || String(prod.id).includes(term);
		});

		return h(
			'div',
			{ className: 'sppcfw-fixed sppcfw-inset-0 sppcfw-bg-black/70 sppcfw-backdrop-blur-sm sppcfw-z-50 sppcfw-flex sppcfw-items-center sppcfw-justify-center sppcfw-p-4' },
			h(
				'div',
				{ className: 'sppcfw-bg-[#16202e] sppcfw-border sppcfw-border-[#4d4354] sppcfw-rounded-xl sppcfw-w-full sppcfw-max-w-xl sppcfw-shadow-2xl sppcfw-p-6 sppcfw-text-[#d9e3f6] sppcfw-flex sppcfw-flex-col sppcfw-max-h-[90vh]' },
				// Header
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-justify-between sppcfw-items-center sppcfw-border-b sppcfw-border-[#374151] sppcfw-pb-3.5 sppcfw-mb-4' },
					h('h3', { className: 'sppcfw-text-lg sppcfw-font-bold sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-gap-2' }, h('span', { className: 'material-symbols-outlined sppcfw-text-[#9333ea]' }, 'tune'), 'Publish Display Conditions'),
					h('button', { className: 'sppcfw-text-[#cfc2d7] hover:sppcfw-text-white sppcfw-font-bold sppcfw-cursor-pointer sppcfw-text-base', onClick: closeModal }, '✕')
				),

				// Body
				h(
					'div',
					{ className: 'sppcfw-space-y-4 sppcfw-overflow-y-auto sppcfw-pr-1 sppcfw-flex-1 sppcfw-mb-4' },
					h('p', { className: 'sppcfw-text-xs sppcfw-text-[#cfc2d7]' }, 'Choose where your single product page builder template will be applied:'),

					// Radio Scopes
					h(
						'div',
						{ className: 'sppcfw-space-y-2 sppcfw-bg-[#111827] sppcfw-p-3 sppcfw-rounded-lg sppcfw-border sppcfw-border-[#374151]' },
						// Option 1: Entire Website
						h(
							'label',
							{ className: `sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-text-sm sppcfw-cursor-pointer sppcfw-p-2 sppcfw-rounded-md sppcfw-transition-colors ${currentScope === 'entire' ? 'sppcfw-bg-[#9333ea]/15 sppcfw-border sppcfw-border-[#9333ea]/40' : 'hover:sppcfw-bg-[#1f2937]'}` },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'entire',
								className: 'sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea]',
								checked: currentScope === 'entire',
								onChange: () => handleScopeChange('entire'),
							}),
							h('span', { className: 'sppcfw-font-semibold sppcfw-text-white' }, 'Entire Website'),
							h('span', { className: 'sppcfw-text-xs sppcfw-text-[#9ca3af]' }, '(All Single Product Pages)')
						),

						// Option 2: Specific Category
						h(
							'label',
							{ className: `sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-text-sm sppcfw-cursor-pointer sppcfw-p-2 sppcfw-rounded-md sppcfw-transition-colors ${currentScope === 'category' ? 'sppcfw-bg-[#9333ea]/15 sppcfw-border sppcfw-border-[#9333ea]/40' : 'hover:sppcfw-bg-[#1f2937]'}` },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'category',
								className: 'sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea]',
								checked: currentScope === 'category',
								onChange: () => handleScopeChange('category'),
							}),
							h('span', { className: 'sppcfw-font-semibold sppcfw-text-white' }, 'Specific Category'),
							h('span', { className: 'sppcfw-text-xs sppcfw-text-[#9ca3af]' }, '(Category-Based Scope)')
						),

						// Option 3: Specific Product
						h(
							'label',
							{ className: `sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-text-sm sppcfw-cursor-pointer sppcfw-p-2 sppcfw-rounded-md sppcfw-transition-colors ${currentScope === 'product' ? 'sppcfw-bg-[#9333ea]/15 sppcfw-border sppcfw-border-[#9333ea]/40' : 'hover:sppcfw-bg-[#1f2937]'}` },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'product',
								className: 'sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea]',
								checked: currentScope === 'product',
								onChange: () => handleScopeChange('product'),
							}),
							h('span', { className: 'sppcfw-font-semibold sppcfw-text-white' }, 'Specific Product / Separate Page'),
							h('span', { className: 'sppcfw-text-xs sppcfw-text-[#9ca3af]' }, '(Product-Based Scope)')
						)
					),

					// Conditional Content: Categories Selector
					currentScope === 'category' &&
						h(
							'div',
							{ className: 'sppcfw-space-y-2.5 sppcfw-bg-[#111827] sppcfw-p-3.5 sppcfw-rounded-lg sppcfw-border sppcfw-border-[#374151]' },
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-justify-between sppcfw-items-center' },
								h('label', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#9333ea]' }, 'category'),
									'Select Categories to apply:',
									h('span', { className: 'sppcfw-text-[11px] sppcfw-font-semibold sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded-full sppcfw-bg-[#9333ea]/20 sppcfw-text-[#ddb8ff]' }, `${selectedCategoryIds.length} selected`)
								),
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2' },
									h('button', { type: 'button', onClick: selectAllCategories, className: 'sppcfw-text-[11px] sppcfw-text-[#9333ea] hover:sppcfw-underline sppcfw-cursor-pointer' }, 'Select All'),
									h('span', { className: 'sppcfw-text-gray-500 sppcfw-text-xs' }, '|'),
									h('button', { type: 'button', onClick: clearCategories, className: 'sppcfw-text-[11px] sppcfw-text-gray-400 hover:sppcfw-underline sppcfw-cursor-pointer' }, 'Clear')
								)
							),

							// Category search input
							h(
								'div',
								{ className: 'sppcfw-relative' },
								h('span', { className: 'material-symbols-outlined sppcfw-absolute sppcfw-left-2.5 sppcfw-top-1/2 sppcfw--translate-y-1/2 sppcfw-text-xs sppcfw-text-gray-400' }, 'search'),
								h('input', {
									type: 'text',
									value: searchCat,
									onChange: e => setSearchCat(e.target.value),
									placeholder: 'Filter categories by name...',
									className: 'sppcfw-w-full sppcfw-bg-[#1f2937] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-md sppcfw-pl-8 sppcfw-pr-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-placeholder-gray-400 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]'
								})
							),

							// Category list
							h(
								'div',
								{ className: 'sppcfw-max-h-48 sppcfw-overflow-y-auto sppcfw-space-y-1 sppcfw-pr-1 sppcfw-rounded-md sppcfw-border sppcfw-border-[#1f2937] sppcfw-p-1' },
								filteredCategories.length === 0
									? h('div', { className: 'sppcfw-py-4 sppcfw-text-center sppcfw-text-xs sppcfw-text-gray-400' }, 'No categories found.')
									: filteredCategories.map(cat => {
											const isSelected = selectedCategoryIds.includes(Number(cat.id));
											return h(
												'label',
												{
													key: cat.id,
													className: `sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-p-2 sppcfw-rounded sppcfw-cursor-pointer sppcfw-text-xs sppcfw-transition-all ${
														isSelected ? 'sppcfw-bg-[#9333ea]/20 sppcfw-border sppcfw-border-[#9333ea]/40 sppcfw-text-white' : 'hover:sppcfw-bg-[#1f2937] sppcfw-text-[#cfc2d7]'
													}`
												},
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5' },
													h('input', {
														type: 'checkbox',
														checked: isSelected,
														onChange: () => toggleCategory(cat.id),
														className: 'sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer'
													}),
													h('span', { className: 'sppcfw-font-medium' }, cat.name)
												),
												cat.slug && h('span', { className: 'sppcfw-text-[10px] sppcfw-font-mono sppcfw-text-gray-400' }, cat.slug)
											);
									  })
							)
						),

					// Conditional Content: Products Selector
					currentScope === 'product' &&
						h(
							'div',
							{ className: 'sppcfw-space-y-2.5 sppcfw-bg-[#111827] sppcfw-p-3.5 sppcfw-rounded-lg sppcfw-border sppcfw-border-[#374151]' },
							h(
								'div',
								{ className: 'sppcfw-flex sppcfw-justify-between sppcfw-items-center' },
								h('label', { className: 'sppcfw-text-xs sppcfw-font-bold sppcfw-text-white sppcfw-flex sppcfw-items-center sppcfw-gap-1.5' },
									h('span', { className: 'material-symbols-outlined sppcfw-text-sm sppcfw-text-[#9333ea]' }, 'shopping_bag'),
									'Select Products to apply:',
									h('span', { className: 'sppcfw-text-[11px] sppcfw-font-semibold sppcfw-px-2 sppcfw-py-0.5 sppcfw-rounded-full sppcfw-bg-[#9333ea]/20 sppcfw-text-[#ddb8ff]' }, `${selectedProductIds.length} selected`)
								),
								h(
									'div',
									{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2' },
									h('button', { type: 'button', onClick: selectAllProducts, className: 'sppcfw-text-[11px] sppcfw-text-[#9333ea] hover:sppcfw-underline sppcfw-cursor-pointer' }, 'Select All'),
									h('span', { className: 'sppcfw-text-gray-500 sppcfw-text-xs' }, '|'),
									h('button', { type: 'button', onClick: clearProducts, className: 'sppcfw-text-[11px] sppcfw-text-gray-400 hover:sppcfw-underline sppcfw-cursor-pointer' }, 'Clear')
								)
							),

							// Product search input
							h(
								'div',
								{ className: 'sppcfw-relative' },
								h('span', { className: 'material-symbols-outlined sppcfw-absolute sppcfw-left-2.5 sppcfw-top-1/2 sppcfw--translate-y-1/2 sppcfw-text-xs sppcfw-text-gray-400' }, 'search'),
								h('input', {
									type: 'text',
									value: searchProd,
									onChange: e => setSearchProd(e.target.value),
									placeholder: 'Search products by title or ID...',
									className: 'sppcfw-w-full sppcfw-bg-[#1f2937] sppcfw-border sppcfw-border-[#374151] sppcfw-rounded-md sppcfw-pl-8 sppcfw-pr-3 sppcfw-py-1.5 sppcfw-text-xs sppcfw-text-white sppcfw-placeholder-gray-400 focus:sppcfw-outline-none focus:sppcfw-border-[#9333ea]'
								})
							),

							// Product list
							h(
								'div',
								{ className: 'sppcfw-max-h-52 sppcfw-overflow-y-auto sppcfw-space-y-1 sppcfw-pr-1 sppcfw-rounded-md sppcfw-border sppcfw-border-[#1f2937] sppcfw-p-1' },
								filteredProducts.length === 0
									? h('div', { className: 'sppcfw-py-4 sppcfw-text-center sppcfw-text-xs sppcfw-text-gray-400' }, 'No products found.')
									: filteredProducts.map(prod => {
											const isSelected = selectedProductIds.includes(Number(prod.id));
											return h(
												'label',
												{
													key: prod.id,
													className: `sppcfw-flex sppcfw-items-center sppcfw-justify-between sppcfw-p-2 sppcfw-rounded sppcfw-cursor-pointer sppcfw-text-xs sppcfw-transition-all ${
														isSelected ? 'sppcfw-bg-[#9333ea]/20 sppcfw-border sppcfw-border-[#9333ea]/40 sppcfw-text-white' : 'hover:sppcfw-bg-[#1f2937] sppcfw-text-[#cfc2d7]'
													}`
												},
												h(
													'div',
													{ className: 'sppcfw-flex sppcfw-items-center sppcfw-gap-2.5 sppcfw-overflow-hidden sppcfw-pr-2' },
													h('input', {
														type: 'checkbox',
														checked: isSelected,
														onChange: () => toggleProduct(prod.id),
														className: 'sppcfw-rounded sppcfw-text-[#9333ea] focus:sppcfw-ring-[#9333ea] sppcfw-cursor-pointer'
													}),
													prod.image_url
														? h('img', { src: prod.image_url, alt: prod.title, className: 'sppcfw-w-6 sppcfw-h-6 sppcfw-object-cover sppcfw-rounded sppcfw-shrink-0' })
														: h('span', { className: 'material-symbols-outlined sppcfw-text-base sppcfw-text-gray-400 sppcfw-shrink-0' }, 'shopping_bag'),
													h('span', { className: 'sppcfw-font-medium sppcfw-truncate' }, prod.title)
												),
												h('span', { className: 'sppcfw-text-[10px] sppcfw-font-mono sppcfw-text-gray-400 sppcfw-shrink-0' }, `#${prod.id}`)
											);
									  })
							)
						)
				),

				// Footer Actions
				h(
					'div',
					{ className: 'sppcfw-flex sppcfw-justify-end sppcfw-gap-3 sppcfw-pt-3.5 sppcfw-border-t sppcfw-border-[#374151]' },
					h('button', { className: 'sppcfw-px-4 sppcfw-py-2 sppcfw-bg-[#121c2a] hover:sppcfw-bg-[#212b39] sppcfw-text-[#d9e3f6] sppcfw-rounded sppcfw-text-xs sppcfw-font-semibold sppcfw-cursor-pointer', onClick: closeModal }, 'Cancel'),
					h(
						'button',
						{
							className: 'sppcfw-px-5 sppcfw-py-2 sppcfw-bg-[#9333ea] hover:sppcfw-bg-[#7e22ce] sppcfw-text-white sppcfw-rounded sppcfw-text-xs sppcfw-font-bold sppcfw-shadow sppcfw-cursor-pointer',
							onClick: () => {
								closeModal();
								saveTemplate();
							},
						},
						'Save & Publish'
					)
				)
			)
		);
	}

	// Mount React App
	document.addEventListener('DOMContentLoaded', function () {
		const rootEl = document.getElementById('sppcfw-builder-root');
		if (rootEl && window.wp && window.wp.element) {
			window.wp.element.render(h(BuilderApp, null), rootEl);
		}
	});
})();
