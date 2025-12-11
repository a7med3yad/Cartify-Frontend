// =================================================================
// CONSTANTS & CONFIGURATION
// =================================================================
const API_BASE_URL = 'https://cartify.runasp.net/api';
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// =================================================================
// STATE MANAGEMENT
// =================================================================
let currentUser = null;
let currentStoreId = null;
let currentProductId = null;
let currentVariantId = null;
let categories = [];
let attributes = [];
let measureUnits = [];

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Get authorization token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get user data from localStorage
 */
function getUserData() {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Clear authentication and redirect to login
 */
function handleUnauthorized() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    window.location.href = 'login.html';
}

/**
 * Make authenticated API request
 */
async function fetchAPI(endpoint, options = {}) {
    const token = getAuthToken();

    const defaultHeaders = {};

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } else {
            // Non-JSON response
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// =================================================================
// NAVIGATION
// =================================================================

/**
 * Initialize navigation
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.querySelector('.page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update page title
            const sectionName = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
            pageTitle.textContent = sectionName;

            // Load section data
            switch (sectionId) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'products':
                    loadProducts();
                    break;
                case 'orders':
                    loadOrders();
                    break;
            }
        });
    });
}

// =================================================================
// DASHBOARD
// =================================================================

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        showLoading('recentOrdersTable', 5);

        // Load KPIs and recent orders
        await Promise.all([
            loadDashboardKPIs(),
            loadRecentOrders()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 3000);
    }
}

/**
 * Load dashboard KPIs
 */
async function loadDashboardKPIs() {
    try {
        if (!currentStoreId) return;

        // Get products count
        const productsData = await fetchAPI(`/merchant/products/merchant/${currentUser.id}?page=1&pageSize=1`);
        const totalProducts = productsData?.totalCount || 0;

        // Get orders for revenue and count
        const ordersData = await fetchAPI(`/merchant/orders/filter?storeId=${currentStoreId}&page=1&pageSize=100`);

        let totalRevenue = 0;
        let totalOrders = 0;

        if (ordersData && ordersData.data) {
            totalOrders = ordersData.totalCount || ordersData.data.length;
            totalRevenue = ordersData.data.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        }

        // Update KPI cards
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalProducts').textContent = totalProducts;
    } catch (error) {
        console.error('Error loading KPIs:', error);
        // Set defaults on error
        document.getElementById('totalRevenue').textContent = formatCurrency(0);
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalProducts').textContent = '0';
    }
}

/**
 * Load recent orders for dashboard
 */
async function loadRecentOrders() {
    const tableBody = document.getElementById('recentOrdersTable');

    try {
        if (!currentStoreId) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No store ID available</td></tr>';
            return;
        }

        const data = await fetchAPI(`/merchant/orders/filter?storeId=${currentStoreId}&page=1&pageSize=10`);

        if (!data || !data.data || data.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No recent orders</td></tr>';
            return;
        }

        tableBody.innerHTML = data.data.slice(0, 10).map(order => `
            <tr>
                <td>${order.orderId || 'N/A'}</td>
                <td>${order.customerName || 'Unknown'}</td>
                <td><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                <td>${formatCurrency(order.totalAmount)}</td>
                <td>${formatDate(order.createdAt || order.orderDate)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">Error loading orders</td></tr>';
    }
}

// =================================================================
// PRODUCTS MANAGEMENT
// =================================================================

/**
 * Load products list
 */
async function loadProducts() {
    const tableBody = document.getElementById('productsTable');
    showLoading('productsTable', 5);

    try {
        if (!currentUser || !currentUser.id) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">User not authenticated</td></tr>';
            return;
        }

        const data = await fetchAPI(`/merchant/products/merchant/${currentUser.id}?page=1&pageSize=100`);

        if (!data || !data.data || data.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No products found. Click "Add Product" to create your first product.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.data.map(product => `
            <tr>
                <td>${product.productName || 'Unnamed Product'}</td>
                <td>${product.categoryName || product.typeName || 'N/A'}</td>
                <td>${product.variantCount || 0}</td>
                <td>${product.totalStock || 0}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="openProductVariants(${product.productId})">
                        Manage Variants
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">Error loading products</td></tr>';
        showToast('Error loading products', 3000);
    }
}

/**
 * Load categories/types for product form
 */
async function loadCategories() {
    try {
        const data = await fetchAPI('/Category?page=1&pageSize=100');

        if (data && data.data) {
            categories = data.data;

            const selectElement = document.getElementById('productType');
            selectElement.innerHTML = '<option value="">Select category...</option>' +
                categories.map(cat => `
                    <option value="${cat.categoryId}">${cat.categoryName}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Initialize add product form
 */
function initAddProductForm() {
    const addProductBtn = document.getElementById('addProductBtn');
    const addProductForm = document.getElementById('addProductForm');

    addProductBtn.addEventListener('click', async () => {
        await loadCategories();
        document.getElementById('productStoreId').value = currentStoreId || '';
        openModal('addProductModal');
    });

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addProductForm);

        try {
            await fetchAPI('/merchant/products', {
                method: 'POST',
                body: formData
            });

            showToast('Product created successfully!', 3000);
            closeModal('addProductModal');
            addProductForm.reset();
            loadProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            showToast('Error creating product: ' + error.message, 3000);
        }
    });
}

/**
 * Open product variants modal
 */
async function openProductVariants(productId) {
    currentProductId = productId;

    const variantsTable = document.getElementById('variantsTable');
    showLoading('variantsTable', 5);

    try {
        // Get product details
        const product = await fetchAPI(`/merchant/products/${productId}`);
        document.getElementById('variantProductName').textContent = product.productName || 'Product';

        openModal('variantsModal');

        // Load variants (ProductDetails)
        await loadProductVariants(productId);
    } catch (error) {
        console.error('Error loading product variants:', error);
        showToast('Error loading product variants', 3000);
    }
}

/**
 * Load product variants (ProductDetails)
 */
async function loadProductVariants(productId) {
    const variantsTable = document.getElementById('variantsTable');

    try {
        const data = await fetchAPI(`/merchant/products/${productId}`);

        if (!data || !data.productDetails || data.productDetails.length === 0) {
            variantsTable.innerHTML = '<tr><td colspan="5" class="empty-cell">No variants found. Click "Add Variant" to create one.</td></tr>';
            return;
        }

        variantsTable.innerHTML = data.productDetails.map(variant => `
            <tr>
                <td>#${variant.productDetailId}</td>
                <td>${variant.serialNumber || 'N/A'}</td>
                <td>${formatCurrency(variant.price)}</td>
                <td>${variant.quantityAvailable || 0}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="openAttributesModal(${variant.productDetailId})">
                        Attributes
                    </button>
                    <button class="btn-danger btn-sm" onclick="deleteVariant(${variant.productDetailId})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading variants:', error);
        variantsTable.innerHTML = '<tr><td colspan="5" class="empty-cell">Error loading variants</td></tr>';
    }
}

/**
 * Initialize variant form
 */
function initVariantForm() {
    const addVariantBtn = document.getElementById('addVariantBtn');
    const variantForm = document.getElementById('variantForm');

    addVariantBtn.addEventListener('click', () => {
        document.getElementById('variantFormTitle').textContent = 'Add Product Variant';
        document.getElementById('variantProductId').value = currentProductId;
        variantForm.reset();
        openModal('variantFormModal');
    });

    variantForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            productId: parseInt(document.getElementById('variantProductId').value),
            serialNumber: document.getElementById('variantSerial').value,
            price: parseFloat(document.getElementById('variantPrice').value),
            description: document.getElementById('variantDescription').value || null,
            quantityAvailable: parseInt(document.getElementById('variantQuantity').value)
        };

        try {
            await fetchAPI('/merchant/products/details', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Variant created successfully!', 3000);
            closeModal('variantFormModal');
            variantForm.reset();
            loadProductVariants(currentProductId);
        } catch (error) {
            console.error('Error creating variant:', error);
            showToast('Error creating variant: ' + error.message, 3000);
        }
    });
}

/**
 * Delete variant
 */
async function deleteVariant(variantId) {
    if (!confirm('Are you sure you want to delete this variant?')) {
        return;
    }

    try {
        await fetchAPI(`/merchant/products/details/${variantId}`, {
            method: 'DELETE'
        });

        showToast('Variant deleted successfully!', 3000);
        loadProductVariants(currentProductId);
    } catch (error) {
        console.error('Error deleting variant:', error);
        showToast('Error deleting variant: ' + error.message, 3000);
    }
}

// =================================================================
// ATTRIBUTES & MEASURE UNITS
// =================================================================

/**
 * Load attributes and measure units
 */
async function loadAttributesAndMeasures() {
    try {
        const [attributesData, measuresData] = await Promise.all([
            fetchAPI('/merchant/attributes-measures/attributes'),
            fetchAPI('/merchant/attributes-measures/measures')
        ]);

        attributes = attributesData || [];
        measureUnits = measuresData || [];

        // Populate attribute dropdown
        const attrSelect = document.getElementById('attrAttribute');
        attrSelect.innerHTML = '<option value="">Select...</option>' +
            attributes.map(attr => `<option value="${attr}">${attr}</option>`).join('');

        // Populate measure dropdown
        const measureSelect = document.getElementById('attrMeasure');
        measureSelect.innerHTML = '<option value="">Select...</option>' +
            measureUnits.map(measure => `<option value="${measure}">${measure}</option>`).join('');
    } catch (error) {
        console.error('Error loading attributes and measures:', error);
    }
}

/**
 * Open attributes modal for a variant
 */
async function openAttributesModal(variantId) {
    currentVariantId = variantId;
    document.getElementById('attrVariantId').textContent = variantId;

    await loadAttributesAndMeasures();
    openModal('attributesModal');

    // Load existing attributes for this variant
    loadVariantAttributes(variantId);
}

/**
 * Load variant attributes
 */
async function loadVariantAttributes(variantId) {
    const attributesTable = document.getElementById('attributesTable');

    try {
        const data = await fetchAPI(`/merchant/products/details/${variantId}`);

        if (!data || !data.attributes || data.attributes.length === 0) {
            attributesTable.innerHTML = '<tr><td colspan="4" class="empty-cell">No attributes added yet</td></tr>';
            return;
        }

        attributesTable.innerHTML = data.attributes.map(attr => `
            <tr>
                <td>${attr.attributeName || 'N/A'}</td>
                <td>${attr.value || 'N/A'}</td>
                <td>${attr.measureUnitSymbol || '-'}</td>
                <td>
                    <button class="btn-danger btn-sm" onclick="deleteAttribute(${attr.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading variant attributes:', error);
        attributesTable.innerHTML = '<tr><td colspan="4" class="empty-cell">Error loading attributes</td></tr>';
    }
}

/**
 * Initialize attribute form
 */
function initAttributeForm() {
    const addAttributeForm = document.getElementById('addAttributeForm');

    addAttributeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Note: This is a placeholder - the actual endpoint for adding attributes to a variant
        // may differ. You'll need to check your backend API for the exact endpoint.
        showToast('Feature under development. Check backend API for attribute assignment endpoint.', 3000);

        // Expected payload structure based on ProductAttributeDto:
        // {
        //     productDetailId: currentVariantId,
        //     attributeId: ...,
        //     measureUnitId: ...,
        //     value: ...
        // }
    });
}

// =================================================================
// ORDERS MANAGEMENT
// =================================================================

/**
 * Load orders
 */
async function loadOrders(status = '') {
    const tableBody = document.getElementById('ordersTable');
    showLoading('ordersTable', 6);

    try {
        if (!currentStoreId) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No store ID available</td></tr>';
            return;
        }

        let endpoint = `/merchant/orders/filter?storeId=${currentStoreId}&page=1&pageSize=100`;
        if (status) {
            endpoint += `&status=${status}`;
        }

        const data = await fetchAPI(endpoint);

        if (!data || !data.data || data.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No orders found</td></tr>';
            return;
        }

        tableBody.innerHTML = data.data.map(order => `
            <tr>
                <td>${order.orderId || 'N/A'}</td>
                <td>${order.customerName || 'Unknown'}</td>
                <td><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                <td>${formatCurrency(order.totalAmount)}</td>
                <td>${formatDate(order.createdAt || order.orderDate)}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="viewOrderDetails('${order.orderId}')">
                        View
                    </button>
                    <button class="btn-secondary btn-sm" onclick="updateOrderStatus('${order.orderId}')">
                        Update Status
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Error loading orders</td></tr>';
        showToast('Error loading orders', 3000);
    }
}

/**
 * Initialize order status filter
 */
function initOrderFilter() {
    const filterSelect = document.getElementById('orderStatusFilter');

    filterSelect.addEventListener('change', (e) => {
        loadOrders(e.target.value);
    });
}

/**
 * View order details
 */
async function viewOrderDetails(orderId) {
    const detailsContent = document.getElementById('orderDetailsContent');
    document.getElementById('orderDetailsId').textContent = orderId;

    openModal('orderDetailsModal');
    detailsContent.innerHTML = '<p class="loading-cell">Loading order details...</p>';

    try {
        // Note: Check your backend for the exact endpoint to get order details
        // This is a placeholder - you may need to adjust based on actual API
        showToast('Order details view - check backend API for specific endpoint', 3000);

        detailsContent.innerHTML = `
            <div style="padding: 1rem;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p>Order details endpoint not yet implemented. Check backend API documentation.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        detailsContent.innerHTML = '<p class="empty-cell">Error loading order details</p>';
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId) {
    const newStatus = prompt('Enter new status (Pending/Processing/Shipped/Delivered/Cancelled):');

    if (!newStatus) return;

    try {
        await fetchAPI(`/merchant/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: newStatus
            })
        });

        showToast('Order status updated successfully!', 3000);
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status: ' + error.message, 3000);
    }
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Show loading state in table
 */
function showLoading(tableId, colSpan) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="loading-cell">Loading data...</td></tr>`;
}

/**
 * Initialize modal close buttons
 */
function initModalCloseBtns() {
    const closeBtns = document.querySelectorAll('.modal-close, [data-modal]');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            } else {
                // Close parent modal
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    });

    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// =================================================================
// INITIALIZATION
// =================================================================

/**
 * Initialize application
 */
async function initApp() {
    // Check authentication
    const token = getAuthToken();
    if (!token) {
        handleUnauthorized();
        return;
    }

    // Get user data
    currentUser = getUserData();
    if (!currentUser) {
        handleUnauthorized();
        return;
    }

    // Set store ID (from user data or merchant profile)
    currentStoreId = currentUser.storeId || null;

    // Update store name in UI
    const storeNameElement = document.getElementById('storeName');
    if (storeNameElement) {
        storeNameElement.textContent = currentUser.storeName || currentUser.userName || 'Merchant';
    }

    // Initialize components
    initNavigation();
    initModalCloseBtns();
    initAddProductForm();
    initVariantForm();
    initAttributeForm();
    initOrderFilter();

    // Set up logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            handleUnauthorized();
        }
    });

    // Load initial dashboard
    loadDashboard();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope for inline onclick handlers
window.openProductVariants = openProductVariants;
window.deleteVariant = deleteVariant;
window.openAttributesModal = openAttributesModal;
window.deleteAttribute = async (attrId) => {
    showToast('Delete attribute feature - check backend API', 3000);
};
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
