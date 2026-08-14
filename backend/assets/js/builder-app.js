/**
 * Single Product Page Builder React App
 * Built with React (wp.element) & Tailwind CSS
 * Features: Multi-template management (All Templates / Add New), Container / Flexbox / Grid / Div layout system, Elementor-style Boxed Width, Layout Popup (+ Placeholder), Categorized Meta Widgets, Drag & Drop Structure Tab
 *
 * @package Single_Product_Customizer
 */

(function () {
	'use strict';

	const { createElement: h, useState, useEffect } = window.wp.element;

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

	// Static Visual Sample Data for Edit Canvas (Isolates Canvas from direct product data loading)
	const CANVAS_STATIC_DATA = {
		title: 'Product Title Placeholder',
		price: '$49.99',
		sku: 'SAMPLE-SKU-123',
		stock_text: 'In Stock',
		rating_count: 5,
		image_url: window.SPPCFWBuilderConfig ? window.SPPCFWBuilderConfig.plugin_url + 'backend/resources/images/logo.png' : '',
		short_description: 'This is a product short description placeholder for designing your WooCommerce single product page layout.',
		description: 'Full product description placeholder detailing extensive technical specifications and features.',
		categories: 'Clothing, Featured',
		tags: 'Customizer, Premium',
	};

	// Core Single Product Widget Definitions
	const CORE_WIDGETS = [
		{ type: 'product_title', name: 'Product Title', icon: 'title' },
		{ type: 'product_price', name: 'Product Price', icon: 'payments' },
		{ type: 'product_gallery', name: 'Image Gallery', icon: 'image' },
		{ type: 'product_add_to_cart', name: 'Add to Cart', icon: 'shopping_cart' },
		{ type: 'product_rating', name: 'Rating Stars', icon: 'star' },
		{ type: 'product_short_desc', name: 'Short Description', icon: 'description' },
		{ type: 'product_description', name: 'Full Description & Tabs', icon: 'toc' },
		{ type: 'product_meta', name: 'Product Meta', icon: 'inventory_2' },
		{ type: 'variation_swatches', name: 'Variation Table', icon: 'grid_view' },
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
			alignment: 'left',
		};

		switch (presetType) {
			case '1_container':
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
					{
						id: 'col-' + timestamp + '-1',
						type: 'column',
						label: 'Column 1 (50%)',
						settings: { flex_width: '50%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
					{
						id: 'col-' + timestamp + '-2',
						type: 'column',
						label: 'Column 2 (50%)',
						settings: { flex_width: '50%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
				];
				break;
			case '2_col_33_67':
				children = [
					{
						id: 'col-' + timestamp + '-1',
						type: 'column',
						label: 'Column 1 (33%)',
						settings: { flex_width: '33.33%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
					{
						id: 'col-' + timestamp + '-2',
						type: 'column',
						label: 'Column 2 (67%)',
						settings: { flex_width: '66.66%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
				];
				break;
			case '2_col_67_33':
				children = [
					{
						id: 'col-' + timestamp + '-1',
						type: 'column',
						label: 'Column 1 (67%)',
						settings: { flex_width: '66.66%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
					{
						id: 'col-' + timestamp + '-2',
						type: 'column',
						label: 'Column 2 (33%)',
						settings: { flex_width: '33.33%' },
						children: [],
						styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' },
					},
				];
				break;
			case '3_col':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Column 3', settings: { flex_width: '33.33%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case '4_col':
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Column 1', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Column 2', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Column 3', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-4', type: 'column', label: 'Column 4', settings: { flex_width: '25%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
				];
				break;
			case 'grid_2x2':
				settings.flex_direction = 'grid';
				settings.grid_columns = '2';
				children = [
					{ id: 'col-' + timestamp + '-1', type: 'column', label: 'Grid Box 1', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-2', type: 'column', label: 'Grid Box 2', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-3', type: 'column', label: 'Grid Box 3', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
					{ id: 'col-' + timestamp + '-4', type: 'column', label: 'Grid Box 4', settings: { flex_width: '100%' }, children: [], styles: { padding_top: '12px', padding_right: '12px', padding_bottom: '12px', padding_left: '12px' } },
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
			label: 'Container Layout',
			settings: settings,
			children: children,
			styles: {
				bg_color: '#ffffff',
				border_color: '#e5e7eb',
				border_width: '1px',
				border_radius: '8px',
				padding_top: '20px',
				padding_right: '20px',
				padding_bottom: '20px',
				padding_left: '20px',
				margin_top: '0px',
				margin_right: '0px',
				margin_bottom: '24px',
				margin_left: '0px',
			},
			advanced: {
				custom_class: '',
				z_index: '1',
			},
		};
	}

	// Helper to find element anywhere in nested tree
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

	// Helper to update element anywhere in nested tree
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

	// Helper to remove element anywhere in nested tree
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

	// Helper to insert child inside parent or root
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

	// Helper to move an element from anywhere to a target parent/index
	function moveElementInTree(tree, sourceId, targetParentId, targetIndex) {
		const elementToMove = findElementInTree(tree, sourceId);
		if (!elementToMove) return tree;

		const cleanedTree = removeElementFromTree(tree, sourceId);
		return insertChildInTree(cleanedTree, targetParentId, elementToMove, targetIndex);
	}

	// Main App Component
	function BuilderApp() {
		const initialTplId = window.SPPCFWBuilderConfig ? window.SPPCFWBuilderConfig.template_id || 'template_default' : 'template_default';
		const [templateId, setTemplateId] = useState(initialTplId);
		const [templateTitle, setTemplateTitle] = useState('Single Product Template');

		const [products, setProducts] = useState([]);
		const [categories, setCategories] = useState([]);
		const [selectedProductId, setSelectedProductId] = useState('');
		const [productData, setProductData] = useState(null);

		const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
		const [activeLeftTab, setActiveLeftTab] = useState('widgets'); // 'widgets' | 'structure'
		const [elements, setElements] = useState([]); // Canvas layout elements tree - defaults to EMPTY (no default container)
		const [selectedElementId, setSelectedElementId] = useState(null);

		const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
		const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
		const [displayConditions, setDisplayConditions] = useState({
			scope: 'entire',
			category_ids: [],
			product_ids: [],
		});

		const [isSaving, setIsSaving] = useState(false);
		const [statusMessage, setStatusMessage] = useState('');

		// Initial Data Load
		useEffect(() => {
			apiPost('sppcfw_get_builder_products_and_categories', {}).then(res => {
				if (res && res.success) {
					setProducts(res.data.products || []);
					setCategories(res.data.categories || []);
				}
			});

			apiPost('sppcfw_load_builder_template', { template_id: initialTplId }).then(res => {
				if (res && res.success && res.data && res.data.template) {
					const tpl = res.data.template;
					if (tpl.id) setTemplateId(tpl.id);
					if (tpl.title) setTemplateTitle(tpl.title);
					if (tpl.layout && Array.isArray(tpl.layout)) {
						setElements(tpl.layout);
					}
					if (tpl.conditions) {
						setDisplayConditions(tpl.conditions);
					}
				}
			});

			// Initial product meta list for Widget tab
			apiPost('sppcfw_get_builder_product_data', { product_id: 0 }).then(res => {
				if (res && res.success) {
					setProductData(res.data.product);
				}
			});
		}, []);

		// Fetch Single Product Data for Left Panel Widget Tab Meta Fields (Does NOT mutate canvas directly)
		function fetchProductData(productId) {
			apiPost('sppcfw_get_builder_product_data', { product_id: productId || 0 }).then(res => {
				if (res && res.success) {
					setProductData(res.data.product);
				}
			});
		}

		// Handle Product Selector Change in Preview Product Data dropdown
		function handleProductChange(e) {
			const id = e.target.value;
			setSelectedProductId(id);
			fetchProductData(id);
		}

		// Add Layout Structure to Canvas
		function addContainerPreset(presetType) {
			const newContainer = createContainerStructure(presetType);
			setElements(prev => [...prev, newContainer]);
			setSelectedElementId(newContainer.id);
			setIsLayoutModalOpen(false);
		}

		// Add Widget to specified Parent Column/Container
		function addWidgetToTarget(widgetType, name, metaKey, targetParentId, targetIndex) {
			// If edit field has no containers yet, prompt user to select a container layout first
			if (elements.length === 0 && !targetParentId) {
				setIsLayoutModalOpen(true);
				return;
			}

			const newId = 'el-' + widgetType + '-' + Date.now();
			const newElement = {
				id: newId,
				type: widgetType,
				label: name || widgetType,
				metaKey: metaKey || null,
				settings: {
					scope: 'global',
					alignment: 'left',
				},
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

			setElements(prev => {
				let resolvedParentId = targetParentId;

				if (!resolvedParentId) {
					// Insert into first column of last container
					const lastContainer = prev[prev.length - 1];
					if (lastContainer && lastContainer.children && lastContainer.children[0]) {
						resolvedParentId = lastContainer.children[0].id;
					} else if (lastContainer) {
						resolvedParentId = lastContainer.id;
					}
				}

				return insertChildInTree(prev, resolvedParentId, newElement, targetIndex);
			});

			setSelectedElementId(newId);
		}

		// Remove element anywhere in tree
		function removeElement(id) {
			setElements(prev => removeElementFromTree(prev, id));
			if (selectedElementId === id) {
				setSelectedElementId(null);
			}
		}

		// Save / Publish Template
		function saveTemplate() {
			setIsSaving(true);
			setStatusMessage('Publishing template...');
			apiPost('sppcfw_save_builder_template', {
				template_id: templateId,
				template_title: templateTitle,
				layout: JSON.stringify(elements),
				conditions: JSON.stringify(displayConditions),
			}).then(res => {
				setIsSaving(false);
				if (res && res.success) {
					if (res.data && res.data.template_id) {
						setTemplateId(res.data.template_id);
					}
					setStatusMessage(res.data.message || 'Published successfully!');
					setTimeout(() => setStatusMessage(''), 4000);
				} else {
					setStatusMessage('Failed to publish template.');
				}
			});
		}

		// Selected Element
		const selectedElement = findElementInTree(elements, selectedElementId);

		// Update Element Properties
		function updateElementProperties(updatedElement) {
			setElements(prev => updateElementInTree(prev, updatedElement.id, () => updatedElement));
		}

		return h(
			'div',
			{ className: 'sppcfw-builder-layout flex flex-col h-screen w-screen overflow-hidden bg-[#091421] text-[#d9e3f6]' },

			// Top Bar with Editable Template Name and All Templates Link
			h(TopBar, {
				templateTitle,
				setTemplateTitle,
				deviceView,
				setDeviceView,
				saveTemplate,
				isSaving,
				statusMessage,
				openConditionsModal: () => setIsConditionsModalOpen(true),
			}),

			// Main Workspace Grid
			h(
				'div',
				{ className: 'flex flex-1 pt-12 overflow-hidden relative' },

				// Left Rail
				h(LeftRail, { activeLeftTab, setActiveLeftTab }),

				// Left Panel (Widgets / Structure Tab)
				h(LeftPanel, {
					activeLeftTab,
					products,
					selectedProductId,
					handleProductChange,
					productData,
					addWidgetToTarget,
					elements,
					setElements,
					selectedElementId,
					setSelectedElementId,
					openLayoutModal: () => setIsLayoutModalOpen(true),
				}),

				// Central Canvas (Uses static placeholder sample data for edit page)
				h(CentralCanvas, {
					deviceView,
					elements,
					setElements,
					selectedElementId,
					setSelectedElementId,
					sampleData: CANVAS_STATIC_DATA,
					removeElement,
					addWidgetToTarget,
					openLayoutModal: () => setIsLayoutModalOpen(true),
				}),

				// Right Property Inspector
				h(RightInspector, {
					selectedElement,
					updateElementProperties,
					categories,
					products,
				})
			),

			// Layout Selection Popup Modal
			isLayoutModalOpen &&
				h(LayoutPopupModal, {
					closeModal: () => setIsLayoutModalOpen(false),
					addContainerPreset,
				}),

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

	// 1. Top Navigation Bar Component
	function TopBar({ templateTitle, setTemplateTitle, deviceView, setDeviceView, saveTemplate, isSaving, statusMessage, openConditionsModal }) {
		return h(
			'header',
			{ className: 'bg-[#16202e] border-b border-[#4d4354] h-12 fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4' },
			h(
				'div',
				{ className: 'flex items-center gap-3' },
				h(
					'a',
					{
						href: 'admin.php?page=sppcfw-builder-all-templates',
						className: 'flex items-center gap-1.5 px-3 py-1 bg-[#121c2a] hover:bg-[#212b39] text-[#92ccff] border border-[#3a98d7] rounded text-xs font-semibold transition-colors',
						title: 'All Templates List',
					},
					h('span', { className: 'material-symbols-outlined text-base' }, 'arrow_back'),
					'All Templates'
				),
				h('span', { className: 'h-4 w-[1px] bg-[#4d4354]' }),

				// Editable Template Title Input
				h(
					'div',
					{ className: 'flex items-center gap-2' },
					h('span', { className: 'material-symbols-outlined text-sm text-[#9333ea]' }, 'edit_note'),
					h('input', {
						type: 'text',
						className: 'bg-[#091421] border border-[#374151] focus:border-[#9333ea] rounded px-2.5 py-0.5 text-xs font-bold text-[#d9e3f6] w-[220px] focus:outline-none',
						value: templateTitle,
						onChange: e => setTemplateTitle(e.target.value),
						placeholder: 'Template Name...',
					})
				),

				h(
					'a',
					{
						href: 'admin.php?page=sppcfw-single-page-builder&template_id=new',
						className: 'flex items-center gap-1 px-2 py-0.5 bg-[#9333ea]/20 hover:bg-[#9333ea]/40 text-[#ddb8ff] border border-[#9333ea]/50 rounded text-[11px] font-semibold transition-colors ml-1',
						title: 'Create New Template',
					},
					h('span', { className: 'material-symbols-outlined text-xs' }, 'add'),
					'Add New'
				)
			),

			// Viewport Switcher
			h(
				'div',
				{ className: 'flex items-center gap-1 bg-[#091421] p-1 rounded border border-[#374151]' },
				h(
					'button',
					{
						className: `px-3 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
							deviceView === 'desktop' ? 'bg-[#9333ea] text-white' : 'text-[#cfc2d7] hover:text-white'
						}`,
						onClick: () => setDeviceView('desktop'),
					},
					h('span', { className: 'material-symbols-outlined text-sm' }, 'desktop_windows'),
					'Desktop'
				),
				h(
					'button',
					{
						className: `px-3 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
							deviceView === 'tablet' ? 'bg-[#9333ea] text-white' : 'text-[#cfc2d7] hover:text-white'
						}`,
						onClick: () => setDeviceView('tablet'),
					},
					h('span', { className: 'material-symbols-outlined text-sm' }, 'tablet_mac'),
					'Tablet'
				),
				h(
					'button',
					{
						className: `px-3 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
							deviceView === 'mobile' ? 'bg-[#9333ea] text-white' : 'text-[#cfc2d7] hover:text-white'
						}`,
						onClick: () => setDeviceView('mobile'),
					},
					h('span', { className: 'material-symbols-outlined text-sm' }, 'smartphone'),
					'Mobile'
				)
			),

			// Actions
			h(
				'div',
				{ className: 'flex items-center gap-3' },
				statusMessage && h('span', { className: 'text-xs text-[#10b981] font-medium' }, statusMessage),
				h(
					'button',
					{
						className: 'px-3 py-1.5 border border-[#3a98d7] text-[#92ccff] hover:bg-[#121c2a] rounded text-xs font-semibold flex items-center gap-1 transition-colors',
						onClick: openConditionsModal,
					},
					h('span', { className: 'material-symbols-outlined text-sm' }, 'tune'),
					'Display Conditions'
				),
				h(
					'button',
					{
						className: 'px-4 py-1.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded text-xs font-bold transition-all shadow flex items-center gap-1',
						onClick: saveTemplate,
						disabled: isSaving,
					},
					h('span', { className: 'material-symbols-outlined text-sm' }, 'publish'),
					isSaving ? 'Publishing...' : 'Publish'
				)
			)
		);
	}

	// 2. Left Rail Component
	function LeftRail({ activeLeftTab, setActiveLeftTab }) {
		return h(
			'nav',
			{ className: 'bg-[#16202e] border-r border-[#4d4354] w-[64px] fixed left-0 top-12 bottom-0 flex flex-col items-center py-4 z-40' },
			h(
				'button',
				{
					className: `w-12 h-12 flex flex-col items-center justify-center gap-1 mb-4 rounded transition-all ${
						activeLeftTab === 'widgets' ? 'text-[#ddb8ff] border-l-2 border-[#9333ea] bg-[#2b3544]' : 'text-[#cfc2d7] hover:bg-[#212b39]'
					}`,
					onClick: () => setActiveLeftTab('widgets'),
					title: 'Widgets Tab',
				},
				h('span', { className: 'material-symbols-outlined text-xl' }, 'widgets'),
				h('span', { className: 'text-[9px] uppercase font-bold tracking-wider' }, 'Widgets')
			),
			h(
				'button',
				{
					className: `w-12 h-12 flex flex-col items-center justify-center gap-1 mb-4 rounded transition-all ${
						activeLeftTab === 'structure' ? 'text-[#ddb8ff] border-l-2 border-[#9333ea] bg-[#2b3544]' : 'text-[#cfc2d7] hover:bg-[#212b39]'
					}`,
					onClick: () => setActiveLeftTab('structure'),
					title: 'Structure Tab',
				},
				h('span', { className: 'material-symbols-outlined text-xl' }, 'account_tree'),
				h('span', { className: 'text-[9px] uppercase font-bold tracking-wider' }, 'Structure')
			)
		);
	}

	// 3. Left Panel (Product Selector & Draggable Widgets + Categorized Product Meta Data)
	function LeftPanel({
		activeLeftTab,
		products,
		selectedProductId,
		handleProductChange,
		productData,
		addWidgetToTarget,
		elements,
		setElements,
		selectedElementId,
		setSelectedElementId,
		openLayoutModal,
	}) {
		function handleDragStart(e, widgetType, name, metaKey) {
			e.dataTransfer.setData('application/json', JSON.stringify({ type: widgetType, name: name, metaKey: metaKey || null }));
		}

		return h(
			'aside',
			{ className: 'w-[320px] bg-[#1f2937] border-r border-[#374151] flex flex-col ml-[64px] z-30 h-full overflow-hidden shadow-md' },
			h(
				'div',
				{ className: 'p-3 border-b border-[#374151] bg-[#121c2a]' },
				h('label', { className: 'inspector-label mb-1' }, 'Preview Product Data'),
				h(
					'select',
					{
						className: 'inspector-input',
						value: selectedProductId,
						onChange: handleProductChange,
					},
					h('option', { value: '' }, '-- Select a Product --'),
					products.map(p => h('option', { key: p.id, value: p.id }, p.title))
				)
			),

			// --- WIDGETS TAB ---
			activeLeftTab === 'widgets' &&
				h(
					'div',
					{ className: 'p-3 overflow-y-auto custom-scrollbar flex-1' },

					// Add Section / Layout Button
					h(
						'button',
						{
							className: 'w-full mb-4 py-2.5 px-3 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow transition-all',
							onClick: openLayoutModal,
						},
						h('span', { className: 'material-symbols-outlined text-base' }, 'add_circle'),
						'Add Layout / Container'
					),

					// Single Product Widgets
					h('h3', { className: 'text-xs font-bold text-[#cfc2d7] uppercase tracking-wider mb-2' }, 'Single Product Widgets'),
					h(
						'div',
						{ className: 'grid grid-cols-2 gap-2 mb-6' },
						CORE_WIDGETS.map(w =>
							h(
								'div',
								{
									key: w.type,
									draggable: true,
									onDragStart: e => handleDragStart(e, w.type, w.name),
									onClick: () => addWidgetToTarget(w.type, w.name),
									className: 'bg-[#111827] border border-[#374151] rounded p-2.5 flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing hover:border-[#9333ea] hover:bg-[#16202e] transition-colors group select-none',
								},
								h('span', { className: 'material-symbols-outlined text-[#ddb8ff] group-hover:scale-110 transition-transform text-lg' }, w.icon),
								h('span', { className: 'text-[11px] font-semibold text-center' }, w.name)
							)
						)
					),

					// Categorized Product Metadata Widgets (populated when product selected)
					productData && productData.meta_groups && productData.meta_groups.length > 0
						? productData.meta_groups.map((group, gIdx) =>
								h(
									'div',
									{ key: 'group-' + gIdx, className: 'mb-5 border-t border-[#374151] pt-3' },
									h('h3', { className: 'text-xs font-bold text-[#ddb8ff] uppercase tracking-wider mb-2 flex items-center gap-1.5' }, h('span', { className: 'material-symbols-outlined text-sm text-[#92ccff]' }, 'dataset'), group.title),
									h(
										'div',
										{ className: 'flex flex-col gap-1.5' },
										group.items.map(m =>
											h(
												'div',
												{
													key: m.key,
													draggable: true,
													onDragStart: e => handleDragStart(e, 'product_meta_item', m.label, m.key),
													onClick: () => addWidgetToTarget('product_meta_item', m.label, m.key),
													className: 'bg-[#111827] border border-[#374151] rounded p-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#9333ea] transition-colors group',
												},
												h(
													'div',
													{ className: 'flex items-center gap-2 overflow-hidden' },
													h('span', { className: 'material-symbols-outlined text-xs text-[#92ccff]' }, 'data_object'),
													h('div', { className: 'overflow-hidden' }, h('div', { className: 'text-xs font-medium truncate' }, m.label), h('div', { className: 'text-[10px] text-[#9ca3af] truncate font-mono' }, m.value))
												),
												h('span', { className: 'text-[9px] bg-[#212b39] text-[#cfc2d7] px-1.5 py-0.5 rounded font-mono' }, 'Meta')
											)
										)
									)
								)
						  )
						: null
				),

			// --- STRUCTURE TAB (Drag & Drop Hierarchy Panel) ---
			activeLeftTab === 'structure' &&
				h(
					'div',
					{ className: 'p-3 overflow-y-auto custom-scrollbar flex-1' },
					h('h3', { className: 'text-xs font-bold text-[#cfc2d7] uppercase tracking-wider mb-1 flex items-center justify-between' }, h('span', { className: 'flex items-center gap-1' }, h('span', { className: 'material-symbols-outlined text-sm text-[#9333ea]' }, 'account_tree'), 'Template Structure'), h('span', { className: 'text-[10px] text-[#9ca3af] font-mono' }, `${elements.length} Sections`)),
					h('p', { className: 'text-[11px] text-[#9ca3af] mb-3' }, 'Drag tree nodes to rearrange content directly:'),

					elements.length === 0
						? h(
								'div',
								{ className: 'text-center p-6 border border-dashed border-[#374151] rounded text-xs text-[#9ca3af]' },
								h('span', { className: 'material-symbols-outlined text-2xl mb-1 text-[#4b5563]' }, 'folder_off'),
								h('p', null, 'Canvas is empty.'),
								h('button', { className: 'mt-2 px-3 py-1 bg-[#9333ea] text-white rounded font-semibold text-xs', onClick: openLayoutModal }, 'Add Layout Structure')
						  )
						: h(
								'div',
								{ className: 'space-y-2' },
								elements.map((container, cIdx) =>
									h(StructureTreeNode, {
										key: container.id,
										item: container,
										index: cIdx,
										parentId: null,
										elements,
										setElements,
										selectedElementId,
										setSelectedElementId,
									})
								)
						  )
				)
		);
	}

	// Recursive Structure Tree Node Component
	function StructureTreeNode({ item, index, parentId, elements, setElements, selectedElementId, setSelectedElementId }) {
		const [isCollapsed, setIsCollapsed] = useState(false);
		const isSelected = selectedElementId === item.id;
		const hasChildren = item.children && item.children.length > 0;

		function handleTreeDragStart(e) {
			e.stopPropagation();
			e.dataTransfer.setData('text/plain', 'structure_move:' + item.id);
		}

		function handleTreeDrop(e) {
			e.preventDefault();
			e.stopPropagation();

			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('structure_move:') === 0) {
				const sourceId = textData.replace('structure_move:', '');
				if (sourceId && sourceId !== item.id) {
					const targetParent = item.type === 'container' || item.type === 'column' ? item.id : parentId;
					setElements(prev => moveElementInTree(prev, sourceId, targetParent, index));
				}
			}
		}

		function getItemIcon() {
			if (item.type === 'container') return 'inventory_2';
			if (item.type === 'column') return 'view_column';
			if (item.type === 'product_meta_item') return 'data_object';
			return 'widgets';
		}

		return h(
			'div',
			{ className: 'tree-node-wrapper' },
			h(
				'div',
				{
					draggable: true,
					onDragStart: handleTreeDragStart,
					onDragOver: e => e.preventDefault(),
					onDrop: handleTreeDrop,
					onClick: e => {
						e.stopPropagation();
						setSelectedElementId(item.id);
					},
					className: `p-2 rounded border text-xs flex items-center justify-between cursor-pointer select-none transition-colors ${
						isSelected ? 'bg-[#9333ea] border-[#9333ea] text-white shadow' : 'bg-[#111827] border-[#374151] text-[#d9e3f6] hover:bg-[#16202e]'
					}`,
				},
				h(
					'div',
					{ className: 'flex items-center gap-1.5 overflow-hidden' },
					hasChildren &&
						h(
							'button',
							{
								className: 'text-xs hover:text-white',
								onClick: e => {
									e.stopPropagation();
									setIsCollapsed(!isCollapsed);
								},
							},
							isCollapsed ? '▶' : '▼'
						),
					h('span', { className: 'material-symbols-outlined text-base text-[#ddb8ff]' }, getItemIcon()),
					h('span', { className: 'font-semibold truncate' }, item.label)
				),
				h(
					'span',
					{ className: 'text-[9px] font-mono opacity-80 uppercase px-1 rounded bg-[#091421]' },
					item.type === 'container' ? (item.settings && item.settings.width_mode === 'boxed' ? 'Boxed' : 'Full') : item.type === 'column' ? (item.settings && item.settings.flex_width ? item.settings.flex_width : 'Col') : item.type
				)
			),

			hasChildren &&
				!isCollapsed &&
				h(
					'div',
					{ className: 'pl-3 mt-1 border-l border-[#374151] space-y-1 ml-2' },
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
						})
					)
				)
		);
	}

	// 4. Central Canvas Component with Dynamic Layout Wrapping & Scrolling
	function CentralCanvas({ deviceView, elements, setElements, selectedElementId, setSelectedElementId, sampleData, removeElement, addWidgetToTarget, openLayoutModal }) {
		const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);

		return h(
			'main',
			{ className: 'flex-1 bg-[#0f172a] overflow-y-auto relative p-8 flex flex-col items-center custom-scrollbar' },

			// Canvas Outer Container
			h(
				'div',
				{
					className: `preview-canvas-container bg-[#ffffff] text-[#111827] rounded shadow-2xl overflow-visible min-h-[700px] p-6 border ${
						isCanvasDragOver ? 'border-2 border-dashed border-[#9333ea] bg-[#faf5ff]' : 'border-[#e5e7eb]'
					} ${deviceView === 'tablet' ? 'preview-viewport-tablet' : deviceView === 'mobile' ? 'preview-viewport-mobile' : 'preview-viewport-desktop'} transition-all`,
				},

				// Empty Canvas State (+ Placeholder) - No Default Container
				elements.length === 0
					? h(
							'div',
							{
								className: 'flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-[#9333ea]/40 rounded-xl p-12 text-center bg-[#faf5ff] cursor-pointer hover:border-[#9333ea] transition-all group',
								onClick: openLayoutModal,
							},
							h('div', { className: 'w-16 h-16 rounded-full bg-[#9333ea]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform' }, h('span', { className: 'material-symbols-outlined text-4xl text-[#9333ea]' }, 'add_circle')),
							h('h2', { className: 'text-2xl font-extrabold text-[#111827] mb-2' }, 'Select Layout Structure'),
							h('p', { className: 'text-sm text-[#6b7280] max-w-md mb-6' }, 'Click + to choose a container shape (Container, Flexbox, Grid, Div) to start building your WooCommerce product layout.'),
							h(
								'button',
								{
									className: 'px-6 py-2.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-lg font-bold shadow-lg flex items-center gap-2 text-sm transition-all',
									onClick: e => {
										e.stopPropagation();
										openLayoutModal();
									},
								},
								h('span', { className: 'material-symbols-outlined text-lg' }, 'add'),
								'Choose Layout'
							)
					  )
					: h(
							'div',
							{ className: 'space-y-6' },
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
									addWidgetToTarget,
								})
							),

							// Add Section Bottom Bar
							h(
								'div',
								{
									className: 'py-4 border-2 border-dashed border-[#d1d5db] hover:border-[#9333ea] rounded-lg text-center cursor-pointer bg-[#f9fafb] hover:bg-[#faf5ff] transition-all flex justify-center items-center gap-2 group',
									onClick: openLayoutModal,
								},
								h('span', { className: 'material-symbols-outlined text-xl text-[#9333ea] group-hover:scale-125 transition-transform' }, 'add_circle'),
								h('span', { className: 'text-sm font-bold text-[#4b5563] group-hover:text-[#9333ea]' }, 'Add Container Section')
							)
					  )
			),

			// Breadcrumb Footer
			h(
				'div',
				{ className: 'fixed bottom-4 left-[400px] bg-[#16202e] border border-[#4d4354] rounded px-3 py-1 text-xs font-mono text-[#cfc2d7] z-20' },
				'Layout > ' + (findElementInTree(elements, selectedElementId)?.label || 'Empty')
			)
		);
	}

	// Renderer for Top-Level Containers on Canvas
	function CanvasContainerRenderer({ container, cIdx, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData, addWidgetToTarget }) {
		const isSelected = selectedElementId === container.id;
		const widthMode = container.settings && container.settings.width_mode === 'full' ? 'full' : 'boxed';
		const boxedWidth = (container.settings && container.settings.boxed_width) || '1140px';
		const isGrid = container.settings && container.settings.flex_direction === 'grid';
		const gridCols = (container.settings && container.settings.grid_columns) || '2';

		function handleContainerDrop(e) {
			e.preventDefault();
			e.stopPropagation();
			const jsonStr = e.dataTransfer.getData('application/json');
			if (jsonStr) {
				try {
					const data = JSON.parse(jsonStr);
					if (data && data.type) {
						const targetColId = container.children && container.children[0] ? container.children[0].id : container.id;
						addWidgetToTarget(data.type, data.name, data.metaKey, targetColId);
					}
				} catch (err) {}
			}
		}

		return h(
			'div',
			{
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(container.id);
				},
				onDragOver: e => e.preventDefault(),
				onDrop: handleContainerDrop,
				className: `builder-container-item relative group border transition-all rounded-lg p-4 mb-4 ${
					isSelected ? 'border-2 border-[#9333ea] shadow-lg ring-2 ring-[#9333ea]/30' : 'border-[#e5e7eb] hover:border-[#9333ea]/50'
				}`,
				style: {
					maxWidth: widthMode === 'boxed' ? boxedWidth : '100%',
					margin: '0 auto 24px auto',
					width: '100%',
					backgroundColor: container.styles ? container.styles.bg_color || '#ffffff' : '#ffffff',
					borderColor: container.styles ? container.styles.border_color || '#e5e7eb' : '#e5e7eb',
					borderWidth: container.styles ? container.styles.border_width || '1px' : '1px',
					borderRadius: container.styles ? container.styles.border_radius || '8px' : '8px',
					paddingTop: container.styles ? container.styles.padding_top || '16px' : '16px',
					paddingBottom: container.styles ? container.styles.padding_bottom || '16px' : '16px',
				},
			},

			// Container Toolbar Badge
			isSelected &&
				h(
					'div',
					{ className: 'absolute -top-3 left-3 bg-[#9333ea] text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 z-20 shadow font-mono select-none' },
					h('span', null, `Container (${widthMode === 'boxed' ? 'Boxed: ' + boxedWidth : 'Full Width'})`),
					h(
						'button',
						{
							className: 'hover:text-red-300 font-bold ml-1',
							onClick: e => {
								e.stopPropagation();
								removeElement(container.id);
							},
						},
						'✕'
					)
				),

			// Columns Layout Wrapper
			h(
				'div',
				{
					className: isGrid ? `grid grid-cols-${gridCols} gap-4` : 'flex flex-wrap gap-4 items-stretch',
					style: { gap: container.settings ? container.settings.gap || '16px' : '16px' },
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
							addWidgetToTarget,
						})
					)
			)
		);
	}

	// Renderer for Columns inside Container
	function CanvasColumnRenderer({ column, containerId, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData, addWidgetToTarget }) {
		const isSelected = selectedElementId === column.id;
		const flexWidth = (column.settings && column.settings.flex_width) || '100%';

		function handleColumnDrop(e) {
			e.preventDefault();
			e.stopPropagation();

			// Dropping new widget from Left Panel
			const jsonStr = e.dataTransfer.getData('application/json');
			if (jsonStr) {
				try {
					const data = JSON.parse(jsonStr);
					if (data && data.type) {
						addWidgetToTarget(data.type, data.name, data.metaKey, column.id);
						return;
					}
				} catch (err) {}
			}

			// Moving existing widget from Structure or Canvas
			const textData = e.dataTransfer.getData('text/plain');
			if (textData && textData.indexOf('structure_move:') === 0) {
				const sourceId = textData.replace('structure_move:', '');
				if (sourceId) {
					setElements(prev => moveElementInTree(prev, sourceId, column.id, column.children ? column.children.length : 0));
				}
			}
		}

		return h(
			'div',
			{
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(column.id);
				},
				onDragOver: e => e.preventDefault(),
				onDrop: handleColumnDrop,
				className: `builder-column-item flex-1 min-w-[200px] border border-dashed rounded p-3 relative transition-all min-h-[120px] ${
					isSelected ? 'border-[#9333ea] bg-[#faf5ff]' : 'border-[#d1d5db] hover:border-[#9333ea]/50 bg-[#f9fafb]'
				}`,
				style: { flex: `1 1 calc(${flexWidth} - 16px)` },
			},

			isSelected &&
				h(
					'div',
					{ className: 'absolute -top-2.5 right-2 bg-[#1f2937] text-white px-1.5 py-0.5 rounded text-[9px] font-mono z-10' },
					column.label || 'Column'
				),

			column.children && column.children.length > 0
				? column.children.map(child =>
						h(CanvasWidgetRenderer, {
							key: child.id,
							widget: child,
							columnId: column.id,
							elements,
							setElements,
							selectedElementId,
							setSelectedElementId,
							removeElement,
							sampleData,
						})
				  )
				: h(
						'div',
						{ className: 'flex flex-col items-center justify-center min-h-[100px] text-center text-xs text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded p-4 select-none' },
						h('span', { className: 'material-symbols-outlined text-xl mb-1 text-[#d1d5db]' }, 'move_to_inbox'),
						'Drag & drop widget here'
				  )
		);
	}

	// Renderer for Individual Widgets inside Column
	function CanvasWidgetRenderer({ widget, columnId, elements, setElements, selectedElementId, setSelectedElementId, removeElement, sampleData }) {
		const isSelected = selectedElementId === widget.id;

		function handleWidgetDragStart(e) {
			e.stopPropagation();
			e.dataTransfer.setData('text/plain', 'structure_move:' + widget.id);
		}

		return h(
			'div',
			{
				draggable: true,
				onDragStart: handleWidgetDragStart,
				onClick: e => {
					e.stopPropagation();
					setSelectedElementId(widget.id);
				},
				className: `widget-canvas-item p-3 mb-3 rounded cursor-grab active:cursor-grabbing relative group ${
					isSelected ? 'is-selected ring-2 ring-[#9333ea]' : ''
				} ${widget.advanced && widget.advanced.custom_class ? widget.advanced.custom_class : ''}`,
				style: {
					color: widget.styles ? widget.styles.text_color || 'inherit' : 'inherit',
					fontFamily: widget.styles ? widget.styles.font_family || 'inherit' : 'inherit',
					fontSize: widget.styles ? widget.styles.font_size || 'inherit' : 'inherit',
					fontWeight: widget.styles ? widget.styles.font_weight || 'inherit' : 'inherit',
					lineHeight: widget.styles ? widget.styles.line_height || 'inherit' : 'inherit',
					backgroundColor: widget.styles ? widget.styles.bg_color || 'transparent' : 'transparent',
					borderColor: widget.styles ? widget.styles.border_color || 'transparent' : 'transparent',
					borderWidth: widget.styles ? widget.styles.border_width || '0px' : '0px',
					borderRadius: widget.styles ? widget.styles.border_radius || '0px' : '0px',
					paddingTop: widget.styles ? widget.styles.padding_top || '0px' : '0px',
					paddingRight: widget.styles ? widget.styles.padding_right || '0px' : '0px',
					paddingBottom: widget.styles ? widget.styles.padding_bottom || '0px' : '0px',
					paddingLeft: widget.styles ? widget.styles.padding_left || '0px' : '0px',
					marginTop: widget.styles ? widget.styles.margin_top || '0px' : '0px',
					marginRight: widget.styles ? widget.styles.margin_right || '0px' : '0px',
					marginBottom: widget.styles ? widget.styles.margin_bottom || '16px' : '16px',
					marginLeft: widget.styles ? widget.styles.margin_left || '0px' : '0px',
					textAlign: widget.settings ? widget.settings.alignment || 'left' : 'left',
				},
			},

			isSelected &&
				h(
					'div',
					{ className: 'absolute -top-3 right-2 bg-[#9333ea] text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1 z-20 shadow font-mono select-none' },
					h('span', null, widget.label),
					h(
						'button',
						{
							className: 'hover:text-red-300 font-bold ml-1',
							onClick: e => {
								e.stopPropagation();
								removeElement(widget.id);
							},
						},
						'✕'
					)
				),

			renderLiveWidgetContent(widget, sampleData)
		);
	}

	// Live Content Rendering for Canvas
	function renderLiveWidgetContent(el, sample) {
		switch (el.type) {
			case 'product_title':
				return h('h1', { className: 'text-2xl font-bold text-[#111827]' }, sample.title || 'Product Title Placeholder');
			case 'product_price':
				return h(
					'div',
					{ className: 'flex items-center gap-3' },
					h('span', { className: 'text-2xl font-extrabold text-[#9333ea]', dangerouslySetInnerHTML: { __html: sample.price || '$49.99' } }),
					h('span', { className: 'bg-[#ef4444] text-white text-xs px-2 py-1 rounded font-bold uppercase' }, 'Sale')
				);
			case 'product_gallery':
				return h(
					'div',
					{ className: 'w-full rounded overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center' },
					h('img', { src: sample.image_url, alt: sample.title, className: 'max-h-[350px] mx-auto object-contain mb-2' })
				);
			case 'product_add_to_cart':
				return h(
					'div',
					{ className: 'flex items-center gap-3' },
					h('input', { type: 'number', defaultValue: 1, min: 1, className: 'w-16 p-2 border border-[#d1d5db] rounded text-center font-bold text-[#111827]' }),
					h('button', { className: 'px-6 py-2.5 bg-[#9333ea] text-white rounded font-bold shadow' }, 'Add to cart')
				);
			case 'product_rating':
				return h(
					'div',
					{ className: 'flex items-center gap-2 text-[#f59e0b]' },
					h('span', { className: 'text-lg' }, '★★★★★'),
					h('span', { className: 'text-xs text-[#6b7280]' }, '(5 reviews)')
				);
			case 'product_short_desc':
				return h('p', { className: 'text-sm text-[#4b5563]' }, sample.short_description);
			case 'product_description':
				return h(
					'div',
					{ className: 'border border-[#e5e7eb] rounded p-4 bg-[#f9fafb]' },
					h('h3', { className: 'font-bold border-b pb-2 mb-2 text-[#111827]' }, 'Description'),
					h('p', { className: 'text-sm text-[#4b5563]' }, sample.description)
				);
			case 'product_meta':
				return h(
					'div',
					{ className: 'text-xs text-[#6b7280] space-y-1' },
					h('div', null, h('strong', null, 'SKU: '), sample.sku || 'SAMPLE-SKU-123'),
					h('div', null, h('strong', null, 'Category: '), sample.categories || 'Clothing')
				);
			case 'product_meta_item':
				return h(
					'div',
					{ className: 'p-2.5 bg-[#f3f4f6] rounded border border-[#e5e7eb] text-sm flex items-center justify-between' },
					h('span', { className: 'font-semibold text-[#111827]' }, el.label),
					h('span', { className: 'text-[#4b5563] font-mono text-xs' }, el.metaKey || 'Meta Field')
				);
			case 'custom_message':
				return h(
					'div',
					{ className: 'p-3 bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe] rounded font-semibold text-sm flex items-center gap-2' },
					h('span', { className: 'material-symbols-outlined' }, 'campaign'),
					'Special Offer: Free Shipping on all orders!'
				);
			case 'plus_minus_buttons':
				return h(
					'div',
					{ className: 'inline-flex items-center border border-[#d1d5db] rounded overflow-hidden' },
					h('button', { className: 'px-3 py-1 bg-[#f3f4f6] font-bold text-[#111827]' }, '-'),
					h('span', { className: 'px-4 py-1 text-sm font-bold text-[#111827]' }, '1'),
					h('button', { className: 'px-3 py-1 bg-[#f3f4f6] font-bold text-[#111827]' }, '+')
				);
			default:
				return h('div', { className: 'p-3 border border-dashed text-xs text-[#6b7280]' }, el.label);
		}
	}

	// 5. Right Kirki-Style 3-Tab Property Inspector
	function RightInspector({ selectedElement, updateElementProperties, categories, products }) {
		const [activeTab, setActiveTab] = useState('content');

		if (!selectedElement) {
			return h(
				'aside',
				{ className: 'w-[320px] bg-[#1f2937] border-l border-[#374151] p-6 flex flex-col items-center justify-center text-center text-xs text-[#9ca3af]' },
				h('span', { className: 'material-symbols-outlined text-4xl mb-2 text-[#4b5563]' }, 'touch_app'),
				'Select a Container, Column, or Widget on canvas to edit its properties.'
			);
		}

		function handleSettingChange(key, value) {
			const updated = {
				...selectedElement,
				settings: { ...selectedElement.settings, [key]: value },
			};
			updateElementProperties(updated);
		}

		function handleStyleChange(key, value) {
			const updated = {
				...selectedElement,
				styles: { ...selectedElement.styles, [key]: value },
			};
			updateElementProperties(updated);
		}

		function handleAdvancedChange(key, value) {
			const updated = {
				...selectedElement,
				advanced: { ...selectedElement.advanced, [key]: value },
			};
			updateElementProperties(updated);
		}

		const isContainer = selectedElement.type === 'container';
		const isColumn = selectedElement.type === 'column';

		return h(
			'aside',
			{ className: 'w-[320px] bg-[#1f2937] border-l border-[#374151] flex flex-col h-full overflow-hidden shadow-lg' },

			// Inspector Header & 3-Tab Switcher
			h(
				'div',
				{ className: 'border-b border-[#374151] bg-[#121c2a]' },
				h(
					'div',
					{ className: 'p-3 flex justify-between items-center border-b border-[#212b39]' },
					h('h2', { className: 'font-bold text-xs uppercase tracking-wider text-[#d9e3f6]' }, selectedElement.label),
					h('span', { className: 'text-[10px] bg-[#9333ea] text-white px-1.5 py-0.5 rounded font-mono uppercase' }, selectedElement.type)
				),
				h(
					'div',
					{ className: 'flex text-xs font-semibold' },
					h(
						'button',
						{
							className: `flex-1 py-2 text-center border-b-2 transition-colors ${
								activeTab === 'content' ? 'border-[#9333ea] text-[#ddb8ff] bg-[#16202e]' : 'border-transparent text-[#9ca3af] hover:text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('content'),
						},
						'Content'
					),
					h(
						'button',
						{
							className: `flex-1 py-2 text-center border-b-2 transition-colors ${
								activeTab === 'style' ? 'border-[#9333ea] text-[#ddb8ff] bg-[#16202e]' : 'border-transparent text-[#9ca3af] hover:text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('style'),
						},
						'Style'
					),
					h(
						'button',
						{
							className: `flex-1 py-2 text-center border-b-2 transition-colors ${
								activeTab === 'advanced' ? 'border-[#9333ea] text-[#ddb8ff] bg-[#16202e]' : 'border-transparent text-[#9ca3af] hover:text-[#d9e3f6]'
							}`,
							onClick: () => setActiveTab('advanced'),
						},
						'Advanced'
					)
				)
			),

			// Inspector Body
			h(
				'div',
				{ className: 'p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1' },

				// --- 1. CONTENT TAB ---
				activeTab === 'content' &&
					h(
						'div',
						{ className: 'space-y-4' },

						// Container Width Controls (Elementor-Style)
						isContainer &&
							h(
								'div',
								{ className: 'space-y-3 bg-[#121c2a] p-3 rounded border border-[#374151]' },
								h('h4', { className: 'text-xs font-bold uppercase text-[#9333ea] border-b border-[#374151] pb-1' }, 'Container Width Options'),
								h(
									'div',
									null,
									h('label', { className: 'inspector-label' }, 'Width Mode'),
									h(
										'select',
										{
											className: 'inspector-input',
											value: selectedElement.settings.width_mode || 'boxed',
											onChange: e => handleSettingChange('width_mode', e.target.value),
										},
										h('option', { value: 'boxed' }, 'Boxed / Fixed Width'),
										h('option', { value: 'full' }, 'Full Width (100%)')
									)
								),

								selectedElement.settings.width_mode === 'boxed' &&
									h(
										'div',
										null,
										h('label', { className: 'inspector-label' }, 'Boxed Max-Width (px/%)'),
										h('input', {
											type: 'text',
											className: 'inspector-input',
											value: selectedElement.settings.boxed_width || '1140px',
											onChange: e => handleSettingChange('boxed_width', e.target.value),
										})
									),

								h(
									'div',
									null,
									h('label', { className: 'inspector-label' }, 'Column Gap (px)'),
									h('input', {
										type: 'text',
										className: 'inspector-input',
										value: selectedElement.settings.gap || '16px',
										onChange: e => handleSettingChange('gap', e.target.value),
									})
								)
							),

						// Column Width
						isColumn &&
							h(
								'div',
								{ className: 'space-y-3 bg-[#121c2a] p-3 rounded border border-[#374151]' },
								h('h4', { className: 'text-xs font-bold uppercase text-[#9333ea] border-b border-[#374151] pb-1' }, 'Column Layout'),
								h(
									'div',
									null,
									h('label', { className: 'inspector-label' }, 'Flex Width (e.g. 50%, 33.33%)'),
									h('input', {
										type: 'text',
										className: 'inspector-input',
										value: selectedElement.settings.flex_width || '100%',
										onChange: e => handleSettingChange('flex_width', e.target.value),
									})
								)
							),

						// Widget Scope & Alignment
						!isContainer &&
							!isColumn &&
							h(
								'div',
								{ className: 'space-y-3' },
								h(
									'div',
									null,
									h('label', { className: 'inspector-label' }, 'Customization Scope'),
									h(
										'select',
										{
											className: 'inspector-input',
											value: selectedElement.settings.scope || 'global',
											onChange: e => handleSettingChange('scope', e.target.value),
										},
										h('option', { value: 'global' }, 'Global (All Products)'),
										h('option', { value: 'category' }, 'Category-Based Scope'),
										h('option', { value: 'product' }, 'Product-Based Scope')
									)
								),
								h(
									'div',
									null,
									h('label', { className: 'inspector-label' }, 'Alignment'),
									h(
										'select',
										{
											className: 'inspector-input',
											value: selectedElement.settings.alignment || 'left',
											onChange: e => handleSettingChange('alignment', e.target.value),
										},
										h('option', { value: 'left' }, 'Left'),
										h('option', { value: 'center' }, 'Center'),
										h('option', { value: 'right' }, 'Right')
									)
								)
							)
					),

				// --- 2. STYLE TAB ---
				activeTab === 'style' &&
					h(
						'div',
						{ className: 'space-y-4' },
						h('h4', { className: 'text-xs font-bold uppercase tracking-wider text-[#9333ea] border-b border-[#374151] pb-1' }, 'Colors & Background'),
						h(
							'div',
							{ className: 'grid grid-cols-2 gap-2' },
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Text Color'),
								h('input', {
									type: 'color',
									className: 'inspector-input h-9 p-1 cursor-pointer',
									value: selectedElement.styles ? selectedElement.styles.text_color || '#111827' : '#111827',
									onChange: e => handleStyleChange('text_color', e.target.value),
								})
							),
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Background'),
								h('input', {
									type: 'color',
									className: 'inspector-input h-9 p-1 cursor-pointer',
									value: selectedElement.styles ? selectedElement.styles.bg_color || '#ffffff' : '#ffffff',
									onChange: e => handleStyleChange('bg_color', e.target.value),
								})
							)
						),

						h('h4', { className: 'text-xs font-bold uppercase tracking-wider text-[#9333ea] border-b border-[#374151] pb-1 pt-2' }, 'Border & Padding'),
						h(
							'div',
							{ className: 'grid grid-cols-2 gap-2' },
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Border Width'),
								h('input', {
									type: 'text',
									className: 'inspector-input',
									value: selectedElement.styles ? selectedElement.styles.border_width || '1px' : '1px',
									onChange: e => handleStyleChange('border_width', e.target.value),
								})
							),
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Border Radius'),
								h('input', {
									type: 'text',
									className: 'inspector-input',
									value: selectedElement.styles ? selectedElement.styles.border_radius || '8px' : '8px',
									onChange: e => handleStyleChange('border_radius', e.target.value),
								})
							)
						),

						h(
							'div',
							{ className: 'grid grid-cols-2 gap-2' },
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Padding Vertical'),
								h('input', {
									type: 'text',
									className: 'inspector-input',
									value: selectedElement.styles ? selectedElement.styles.padding_top || '16px' : '16px',
									onChange: e => {
										handleStyleChange('padding_top', e.target.value);
										handleStyleChange('padding_bottom', e.target.value);
									},
								})
							),
							h(
								'div',
								null,
								h('label', { className: 'inspector-label' }, 'Margin Bottom'),
								h('input', {
									type: 'text',
									className: 'inspector-input',
									value: selectedElement.styles ? selectedElement.styles.margin_bottom || '24px' : '24px',
									onChange: e => handleStyleChange('margin_bottom', e.target.value),
								})
							)
						)
					),

				// --- 3. ADVANCED TAB ---
				activeTab === 'advanced' &&
					h(
						'div',
						{ className: 'space-y-4' },
						h(
							'div',
							null,
							h('label', { className: 'inspector-label' }, 'Custom CSS Class'),
							h('input', {
								type: 'text',
								className: 'inspector-input',
								placeholder: 'e.g. my-custom-section',
								value: (selectedElement.advanced && selectedElement.advanced.custom_class) || '',
								onChange: e => handleAdvancedChange('custom_class', e.target.value),
							})
						),
						h(
							'div',
							null,
							h('label', { className: 'inspector-label' }, 'Z-Index'),
							h('input', {
								type: 'number',
								className: 'inspector-input',
								value: (selectedElement.advanced && selectedElement.advanced.z_index) || '1',
								onChange: e => handleAdvancedChange('z_index', e.target.value),
							})
						)
					)
			)
		);
	}

	// 6. Layout Selection Popup Modal Component
	function LayoutPopupModal({ closeModal, addContainerPreset }) {
		const PRESETS = [
			{ type: '1_container', title: '1 Column Container', desc: '100% Full Width Column', icon: 'crop_16_9' },
			{ type: '2_col_50_50', title: '2 Columns (50% / 50%)', desc: 'Equal 2 Column Layout', icon: 'view_column' },
			{ type: '2_col_33_67', title: '2 Columns (33% / 67%)', desc: 'Left Sidebar Layout', icon: 'auto_awesome_mosaic' },
			{ type: '2_col_67_33', title: '2 Columns (67% / 33%)', desc: 'Right Sidebar Layout', icon: 'auto_awesome_mosaic' },
			{ type: '3_col', title: '3 Columns (33% / 33% / 33%)', desc: 'Equal 3 Column Layout', icon: 'view_week' },
			{ type: '4_col', title: '4 Columns (25% each)', desc: 'Equal 4 Column Grid', icon: 'grid_view' },
			{ type: 'grid_2x2', title: 'Grid 2x2 Layout', desc: '2 Columns by 2 Rows Grid', icon: 'apps' },
			{ type: 'div_block', title: 'Div Block Container', desc: 'Simple Div Container', icon: 'square' },
		];

		return h(
			'div',
			{ className: 'fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4' },
			h(
				'div',
				{ className: 'bg-[#16202e] border border-[#4d4354] rounded-xl w-full max-w-2xl shadow-2xl p-6 text-[#d9e3f6]' },
				h(
					'div',
					{ className: 'flex justify-between items-center border-b border-[#374151] pb-3 mb-4' },
					h('h3', { className: 'text-lg font-bold text-white flex items-center gap-2' }, h('span', { className: 'material-symbols-outlined text-[#9333ea]' }, 'grid_view'), 'Select Layout Structure'),
					h('button', { className: 'text-[#cfc2d7] hover:text-white font-bold text-lg', onClick: closeModal }, '✕')
				),

				h('p', { className: 'text-xs text-[#cfc2d7] mb-4' }, 'Choose a container shape structure to insert into your single product edit canvas:'),

				h(
					'div',
					{ className: 'grid grid-cols-2 gap-3 mb-6 max-h-[420px] overflow-y-auto custom-scrollbar p-1' },
					PRESETS.map(p =>
						h(
							'div',
							{
								key: p.type,
								onClick: () => addContainerPreset(p.type),
								className: 'bg-[#111827] border border-[#374151] hover:border-[#9333ea] hover:bg-[#16202e] rounded-lg p-4 cursor-pointer transition-all flex items-center gap-3 group shadow-md',
							},
							h('div', { className: 'w-10 h-10 rounded bg-[#9333ea]/20 text-[#ddb8ff] flex items-center justify-center group-hover:scale-110 transition-transform' }, h('span', { className: 'material-symbols-outlined text-2xl' }, p.icon)),
							h(
								'div',
								null,
								h('h4', { className: 'text-xs font-bold text-white group-hover:text-[#ddb8ff]' }, p.title),
								h('p', { className: 'text-[10px] text-[#9ca3af]' }, p.desc)
							)
						)
					)
				),

				h(
					'div',
					{ className: 'flex justify-end pt-3 border-t border-[#374151]' },
					h('button', { className: 'px-4 py-2 bg-[#121c2a] hover:bg-[#212b39] text-[#d9e3f6] rounded text-xs font-semibold', onClick: closeModal }, 'Cancel')
				)
			)
		);
	}

	// 7. Display Conditions Modal Component
	function DisplayConditionsModal({ displayConditions, setDisplayConditions, categories, products, closeModal, saveTemplate }) {
		return h(
			'div',
			{ className: 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4' },
			h(
				'div',
				{ className: 'bg-[#16202e] border border-[#4d4354] rounded-lg w-full max-w-lg shadow-2xl p-6 text-[#d9e3f6]' },
				h(
					'div',
					{ className: 'flex justify-between items-center border-b border-[#374151] pb-3 mb-4' },
					h('h3', { className: 'text-lg font-bold text-white flex items-center gap-2' }, h('span', { className: 'material-symbols-outlined text-[#9333ea]' }, 'tune'), 'Publish Display Conditions'),
					h('button', { className: 'text-[#cfc2d7] hover:text-white font-bold', onClick: closeModal }, '✕')
				),

				h(
					'div',
					{ className: 'space-y-4 mb-6' },
					h('p', { className: 'text-xs text-[#cfc2d7]' }, 'Choose where your single product page builder template will be applied:'),
					h(
						'div',
						{ className: 'space-y-3' },
						h(
							'label',
							{ className: 'flex items-center gap-2 text-sm cursor-pointer' },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'entire',
								checked: displayConditions.scope === 'entire',
								onChange: () => setDisplayConditions({ ...displayConditions, scope: 'entire' }),
							}),
							h('span', { className: 'font-semibold' }, 'Entire Website'),
							h('span', { className: 'text-xs text-[#9ca3af]' }, '(All Single Product Pages)')
						),
						h(
							'label',
							{ className: 'flex items-center gap-2 text-sm cursor-pointer' },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'category',
								checked: displayConditions.scope === 'category',
								onChange: () => setDisplayConditions({ ...displayConditions, scope: 'category' }),
							}),
							h('span', { className: 'font-semibold' }, 'Specific Category'),
							h('span', { className: 'text-xs text-[#9ca3af]' }, '(Category-Based Scope)')
						),
						h(
							'label',
							{ className: 'flex items-center gap-2 text-sm cursor-pointer' },
							h('input', {
								type: 'radio',
								name: 'condition_scope',
								value: 'product',
								checked: displayConditions.scope === 'product',
								onChange: () => setDisplayConditions({ ...displayConditions, scope: 'product' }),
							}),
							h('span', { className: 'font-semibold' }, 'Specific Product / Separate Page'),
							h('span', { className: 'text-xs text-[#9ca3af]' }, '(Product-Based Scope)')
						)
					)
				),

				h(
					'div',
					{ className: 'flex justify-end gap-3 pt-3 border-t border-[#374151]' },
					h('button', { className: 'px-4 py-2 bg-[#121c2a] hover:bg-[#212b39] text-[#d9e3f6] rounded text-xs font-semibold', onClick: closeModal }, 'Cancel'),
					h(
						'button',
						{
							className: 'px-5 py-2 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded text-xs font-bold shadow',
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
