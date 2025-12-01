// ==================== PRODUCTS SECTION ====================
// This module handles products, product details/variants, and inventory management
// Integration with real Cartify API endpoints

function loadProductsList() {
    const html = `
    <div class="section-container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title"><i class="bi bi-box-seam me-2"></i>Product Management</h2>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" id="btnAddProduct">
            <i class="bi bi-plus-circle me-2"></i>Add Product
          </button>
          <button class="btn btn-outline-secondary" id="btnRefreshProducts">
            <i class="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        </div>
      </div>
      
      <!-- Search and Filter -->
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" id="productSearch" placeholder="Search products...">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" id="productSubcategoryFilter">
                <option value="">All Subcategories</option>
              </select>
            </div>
            <div class="col-md-3 text-end">
              <span class="badge bg-primary" id="productCount">0 products</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Products Table -->
      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0" id="productsTable">
              <thead>
                <tr>
                  <th><i class="bi bi-hash me-1"></i>ID</th>
                  <th><i class="bi bi-image me-1"></i>Image</th>
                  <th><i class="bi bi-box me-1"></i>Name</th>
                  <th><i class="bi bi-folder me-1"></i>Subcategory</th>
                  <th><i class="bi bi-cash me-1"></i>Price</th>
                  <th><i class="bi bi-layers me-1"></i>Variants</th>
                  <th class="text-center"><i class="bi bi-gear me-1"></i>Actions</th>
                </tr>
              </thead>
              <tbody id="productsTableBody">
                <tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex justify-content-between align-items-center p-3">
            <div>
              <label class="me-2">Page:</label>
              <input type="number" id="productPageNumber" class="form-control d-inline-block" style="width: 80px;" value="1" min="1">
              <label class="ms-2 me-2">Page Size:</label>
              <select id="productPageSize" class="form-select d-inline-block" style="width: 100px;">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div id="productPaginationInfo"></div>
          </div>
        </div>
      </div>
    </div>
  `;

    $("#dynamicContentContainer").show().html(html);

    // Load subcategories for filter
    loadSubcategoriesForFilter();

    // Load products
    fetchMerchantProducts();

    // Bind event handlers
    $(document).off('click', '#btnAddProduct').on('click', '#btnAddProduct', () => showProductForm());
    $(document).off('click', '#btnRefreshProducts').on('click', '#btnRefreshProducts', fetchMerchantProducts);
    $(document).off('change', '#productPageNumber, #productPageSize').on('change', '#productPageNumber, #productPageSize', fetchMerchantProducts);
    $(document).off('change', '#productSubcategoryFilter').on('change', '#productSubcategoryFilter', fetchMerchantProducts);
    $(document).off('input', '#productSearch').on('input', '#productSearch', debounce(fetchMerchantProducts, 500));
}

function loadSubcategoriesForFilter() {
    const token = getAuthToken();
    if (!token) return;

    $.ajax({
        url: `${API_BASE_URL}/Category/subcategory?page=1&pageSize=100`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (response) {
            const subcategories = response.data || response.items || response || [];
            const $select = $('#productSubcategoryFilter');
            $select.html('<option value="">All Subcategories</option>');
            subcategories.forEach(sub => {
                const id = sub.subCategoryId || sub.id || sub.SubCategoryId;
                const name = sub.subCategoryName || sub.name || sub.SubCategoryName;
                if (id && name) {
                    $select.append(`<option value="${id}">${name}</option>`);
                }
            });
        },
        error: function (xhr) {
            console.error('Error loading subcategories:', xhr);
        }
    });
}

function fetchMerchantProducts() {
    const token = getAuthToken();
    if (!token) {
        $("#productsTableBody").html('<tr><td colspan="7" class="text-center text-danger">Authentication required</td></tr>');
        return;
    }

    // Get merchant ID from token
    const merchantId = getMerchantIdFromToken();
    if (!merchantId) {
        $("#productsTableBody").html('<tr><td colspan="7" class="text-center text-danger">Merchant ID not found</td></tr>');
        return;
    }

    const page = parseInt($('#productPageNumber').val()) || 1;
    const pageSize = parseInt($('#productPageSize').val()) || 10;
    const searchTerm = $('#productSearch').val() || '';
    const subcategoryId = $('#productSubcategoryFilter').val() || '';

    // Use the correct endpoint from Swagger: GET /api/merchant/products/merchant/{merchantId}
    let url = `${API_BASE_URL}/merchant/products/merchant/${merchantId}?page=${page}&pageSize=${pageSize}`;

    if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    if (subcategoryId) {
        url += `&subcategoryId=${subcategoryId}`;
    }

    $.ajax({
        url: url,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        success: function (response) {
            const products = response.data || response.items || response || [];
            const totalCount = response.totalCount || response.total || products.length;
            const totalPages = response.totalPages || Math.ceil(totalCount / pageSize);

            renderProductsTable(products);
            updateProductPaginationInfo(page, totalPages, totalCount);
            $('#productCount').text(`${totalCount} product${totalCount !== 1 ? 's' : ''}`);
        },
        error: function (xhr) {
            console.error('Error fetching products:', xhr);
            let errorMsg = 'Error loading products';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            $("#productsTableBody").html(`<tr><td colspan="7" class="text-center text-danger">${errorMsg}</td></tr>`);
        }
    });
}

function renderProductsTable(products) {
    const $tbody = $("#productsTableBody");

    if (!products || products.length === 0) {
        $tbody.html('<tr><td colspan="7" class="text-center text-muted">No products found</td></tr>');
        return;
    }

    let html = '';
    products.forEach((product, index) => {
        const id = product.productId || product.id || product.ProductId;
        const name = product.productName || product.name || product.ProductName || 'N/A';
        const description = product.description || product.Description || '';
        const imageUrl = product.imageUrl || product.image || product.ImageUrl || '';
        const price = parseFloat(product.price || product.Price || 0).toFixed(2);
        const subcategoryName = product.subcategoryName || product.SubcategoryName || product.subCategoryName || 'N/A';
        const variantsCount = product.productDetailsCount || product.variantsCount || 0;

        html += `
      <tr>
        <td>${id}</td>
        <td>
          ${imageUrl ? `<img src="${imageUrl}" alt="${name}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">` : '<span class="text-muted">No image</span>'}
        </td>
        <td>
          <strong>${name}</strong>
          ${description ? `<br><small class="text-muted">${description.substring(0, 50)}${description.length > 50 ? '...' : ''}</small>` : ''}
        </td>
        <td>${subcategoryName}</td>
        <td>$${price}</td>
        <td>
          <span class="badge bg-info">${variantsCount} variant${variantsCount !== 1 ? 's' : ''}</span>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" onclick="viewProduct('${id}')" title="View">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-success" onclick="manageProductVariants('${id}')" title="Variants">
              <i class="bi bi-layers"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="editProduct('${id}')" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteProduct('${id}')" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    });

    $tbody.html(html);
}

function updateProductPaginationInfo(page, totalPages, totalCount) {
    $('#productPaginationInfo').html(`Page ${page} of ${totalPages} (${totalCount} total)`);
}

// ==================== PRODUCT FORM (CREATE / EDIT) ====================

function showProductForm(productId = null) {
    const isEdit = productId !== null;
    const modalHtml = `
    <div class="modal fade" id="productFormModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-${isEdit ? 'pencil' : 'plus-circle'} me-2"></i>${isEdit ? 'Edit' : 'Add'} Product
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="productForm">
              <input type="hidden" id="productFormId" value="${productId || ''}">
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="productFormName" class="form-label">Product Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="productFormName" required>
                </div>
                <div class="col-md-6">
                  <label for="productFormSubcategory" class="form-label">Subcategory <span class="text-danger">*</span></label>
                  <select class="form-select" id="productFormSubcategory" required>
                    <option value="">Select Subcategory...</option>
                  </select>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="productFormDescription" class="form-label">Description</label>
                <textarea class="form-control" id="productFormDescription" rows="3"></textarea>
              </div>
              
              <div class="mb-3">
                <label for="productFormImage" class="form-label">Product Image</label>
                <input type="file" class="form-control" id="productFormImage" accept="image/*">
                <small class="text-muted">Image will be uploaded to AWS S3</small>
                <div id="productFormImagePreview" class="mt-2"></div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="btnSaveProduct">
              <i class="bi bi-save me-1"></i>Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#productFormModal').remove();
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
    modal.show();

    // Load subcategories
    loadSubcategoriesForForm();

    // Load product data if editing
    if (isEdit && productId) {
        loadProductData(productId);
    }

    // Bind save button
    $('#btnSaveProduct').off('click').on('click', function () {
        saveProduct();
    });

    // Bind image preview
    $('#productFormImage').off('change').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#productFormImagePreview').html(`<img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px;">`);
            };
            reader.readAsDataURL(file);
        }
    });
}

function loadSubcategoriesForForm() {
    const token = getAuthToken();
    if (!token) return;

    $.ajax({
        url: `${API_BASE_URL}/Category/subcategory?page=1&pageSize=100`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (response) {
            const subcategories = response.data || response.items || response || [];
            const $select = $('#productFormSubcategory');
            $select.html('<option value="">Select Subcategory...</option>');
            subcategories.forEach(sub => {
                const id = sub.subCategoryId || sub.id || sub.SubCategoryId;
                const name = sub.subCategoryName || sub.name || sub.SubCategoryName;
                if (id && name) {
                    $select.append(`<option value="${id}">${name}</option>`);
                }
            });
        },
        error: function (xhr) {
            console.error('Error loading subcategories:', xhr);
            showNotification('Error loading subcategories', 'error');
        }
    });
}

function loadProductData(productId) {
    const token = getAuthToken();
    if (!token) return;

    // Use Swagger endpoint: GET /api/merchant/products/{productId}
    $.ajax({
        url: `${API_BASE_URL}/merchant/products/${productId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (product) {
            $('#productFormName').val(product.productName || product.name || product.ProductName || '');
            $('#productFormDescription').val(product.description || product.Description || '');

            const subcategoryId = product.subcategoryId || product.subCategoryId || product.SubcategoryId || '';
            if (subcategoryId) {
                $('#productFormSubcategory').val(subcategoryId);
            }

            const imageUrl = product.imageUrl || product.image || product.ImageUrl;
            if (imageUrl) {
                $('#productFormImagePreview').html(`
          <img src="${imageUrl}" class="img-thumbnail" style="max-width: 200px;">
          <br><small class="text-muted">Current image</small>
        `);
            }
        },
        error: function (xhr) {
            console.error('Error loading product:', xhr);
            showNotification('Error loading product data', 'error');
        }
    });
}

async function saveProduct() {
    const productId = $('#productFormId').val();
    const name = $('#productFormName').val().trim();
    const subcategoryId = $('#productFormSubcategory').val();
    const description = $('#productFormDescription').val().trim();
    const imageFile = $('#productFormImage')[0]?.files[0];

    if (!name) {
        showNotification('Product name is required', 'error');
        return;
    }

    if (!subcategoryId) {
        showNotification('Subcategory is required', 'error');
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    const merchantId = getMerchantIdFromToken();
    if (!merchantId) {
        showNotification('Merchant ID not found', 'error');
        return;
    }

    try {
        // Step 1: Upload image if provided (using endpoint: POST /api/merchant/products/{productId}/images)
        let imageUrl = '';
        if (productId && imageFile) {
            imageUrl = await uploadProductImage(productId, imageFile);
        }

        // Step 2: Create or update product
        const productData = {
            productName: name,
            description: description,
            subcategoryId: parseInt(subcategoryId),
            merchantId: merchantId,
            imageUrl: imageUrl || $('#productFormImagePreview img').attr('src') || ''
        };

        const method = productId ? 'PUT' : 'POST';
        const url = productId
            ? `${API_BASE_URL}/merchant/products/${productId}`
            : `${API_BASE_URL}/merchant/products`;

        $.ajax({
            url: url,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(productData),
            success: async function (response) {
                const savedProductId = response.productId || response.id || productId;

                // Step 3: Upload image for new product
                if (!productId && imageFile && savedProductId) {
                    try {
                        await uploadProductImage(savedProductId, imageFile);
                    } catch (e) {
                        console.error('Error uploading image:', e);
                    }
                }

                showNotification(`Product ${productId ? 'updated' : 'created'} successfully`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('productFormModal')).hide();
                fetchMerchantProducts();
            },
            error: function (xhr) {
                console.error('Error saving product:', xhr);
                let errorMsg = 'Error saving product';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showNotification(errorMsg, 'error');
            }
        });
    } catch (error) {
        console.error('Error in saveProduct:', error);
        showNotification('Error saving product', 'error');
    }
}

// Upload product image to S3 via backend endpoint
// Using Swagger endpoint: POST /api/merchant/products/{productId}/images
function uploadProductImage(productId, imageFile) {
    return new Promise((resolve, reject) => {
        const token = getAuthToken();
        if (!token) {
            reject('Authentication required');
            return;
        }

        const formData = new FormData();
        formData.append('image', imageFile);

        $.ajax({
            url: `${API_BASE_URL}/merchant/products/${productId}/images`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                // Response should contain the S3 URL
                const imageUrl = response.imageUrl || response.url || response.ImageUrl || '';
                resolve(imageUrl);
            },
            error: function (xhr) {
                console.error('Error uploading image:', xhr);
                reject('Error uploading image');
            }
        });
    });
}

// ==================== PRODUCT ACTIONS ====================

window.viewProduct = function (productId) {
    const token = getAuthToken();
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    // Using Swagger endpoint: GET /api/merchant/products/{productId}
    $.ajax({
        url: `${API_BASE_URL}/merchant/products/${productId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (product) {
            showProductDetailsModal(product);
        },
        error: function (xhr) {
            console.error('Error fetching product:', xhr);
            showNotification('Error loading product details', 'error');
        }
    });
};

function showProductDetailsModal(product) {
    const productId = product.productId || product.id || product.ProductId;
    const name = product.productName || product.name || product.ProductName || 'N/A';
    const description = product.description || product.Description || 'N/A';
    const imageUrl = product.imageUrl || product.image || product.ImageUrl || '';
    const subcategoryName = product.subcategoryName || product.SubcategoryName || 'N/A';
    const price = product.price ? parseFloat(product.price).toFixed(2) : 'N/A';

    const modalHtml = `
    <div class="modal fade" id="productDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-box-seam me-2"></i>Product Details - ${name}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-4 text-center">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}" class="img-thumbnail mb-3" style="max-width: 100%;">` : '<div class="alert alert-secondary">No image</div>'}
              </div>
              <div class="col-md-8">
                <p><strong>Product ID:</strong> ${productId}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Subcategory:</strong> ${subcategoryName}</p>
                <p><strong>Price:</strong> $${price}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" onclick="manageProductVariants('${productId}')">
              <i class="bi bi-layers me-1"></i>Manage Variants
            </button>
            <button type="button" class="btn btn-warning" onclick="editProduct('${productId}')">
              <i class="bi bi-pencil me-1"></i>Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#productDetailsModal').remove();
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('productDetailsModal'));
    modal.show();
}

window.editProduct = function (productId) {
    $('#productDetailsModal').remove();
    showProductForm(productId);
};

window.deleteProduct = function (productId) {
    showConfirmModal(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        function () {
            const token = getAuthToken();
            if (!token) {
                showNotification('Authentication required', 'error');
                return;
            }

            // Using Swagger endpoint: DELETE /api/merchant/products/{productId}
            $.ajax({
                url: `${API_BASE_URL}/merchant/products/${productId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                success: function () {
                    showNotification('Product deleted successfully', 'success');
                    fetchMerchantProducts();
                },
                error: function (xhr) {
                    console.error('Error deleting product:', xhr);
                    let errorMsg = 'Error deleting product';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    showNotification(errorMsg, 'error');
                }
            });
        }
    );
};

// ==================== PRODUCT VARIANTS / DETAILS ====================

window.manageProductVariants = function (productId) {
    const modalHtml = `
    <div class="modal fade" id="productVariantsModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-layers me-2"></i>Product Variants & Inventory</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-between mb-3">
              <h6>Variants for Product ID: ${productId}</h6>
              <button class="btn btn-sm btn-primary" onclick="addProductVariant('${productId}')">
                <i class="bi bi-plus-circle me-1"></i>Add Variant
              </button>
            </div>
            
            <div class="table-responsive">
              <table class="table table-bordered" id="variantsTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Storage</th>
                    <th>RAM</th>
                    <th>Processor</th>
                    <th>Measure Unit</th>
                    <th>Inventory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="variantsTableBody">
                  <tr><td colspan="7" class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#productVariantsModal').remove();
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('productVariantsModal'));
    modal.show();

    // Load variants for this product
    loadProductVariants(productId);
};

function loadProductVariants(productId) {
    const token = getAuthToken();
    if (!token) {
        $('#variantsTableBody').html('<tr><td colspan="7" class="text-center text-danger">Authentication required</td></tr>');
        return;
    }

    // Note: There might be an endpoint to get all variants for a product
    // For now, we'll use a workaround or fetch from product details
    // This is a placeholder - adjust based on actual API structure

    $.ajax({
        url: `${API_BASE_URL}/merchant/products/${productId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (product) {
            const variants = product.productDetails || product.variants || [];
            renderVariantsTable(variants, productId);
        },
        error: function (xhr) {
            console.error('Error loading variants:', xhr);
            $('#variantsTableBody').html('<tr><td colspan="7" class="text-center text-danger">Error loading variants</td></tr>');
        }
    });
}

function renderVariantsTable(variants, productId) {
    const $tbody = $('#variantsTableBody');

    if (!variants || variants.length === 0) {
        $tbody.html('<tr><td colspan="7" class="text-center text-muted">No variants found. Add one to get started.</td></tr>');
        return;
    }

    let html = '';
    variants.forEach(variant => {
        const id = variant.productDetailId || variant.id || variant.ProductDetailId || 'N/A';
        const storage = variant.storage || variant.Storage || '-';
        const ram = variant.ram || variant.Ram || '-';
        const processor = variant.processor || variant.Processor || '-';
        const measureUnit = variant.measureUnit || variant.MeasureUnit || '-';
        const inventoryCount = variant.inventoryCount || 0;

        html += `
      <tr>
        <td>${id}</td>
        <td>${storage}</td>
        <td>${ram}</td>
        <td>${processor}</td>
        <td>${measureUnit}</td>
        <td>
          <span class="badge bg-${inventoryCount > 0 ? 'success' : 'secondary'}">${inventoryCount} items</span>
          <button class="btn btn-sm btn-outline-primary ms-2" onclick="manageInventory('${id}')">
            <i class="bi bi-list-ul"></i> Manage
          </button>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-warning" onclick="editProductVariant('${id}', '${productId}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteProductVariant('${id}', '${productId}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    });

    $tbody.html(html);
}

window.addProductVariant = function (productId) {
    showVariantForm(productId);
};

window.editProductVariant = function (variantId, productId) {
    showVariantForm(productId, variantId);
};

function showVariantForm(productId, variantId = null) {
    const isEdit = variantId !== null;
    const formHtml = `
    <div class="modal fade" id="variantFormModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Variant</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="variantFormProductId" value="${productId}">
            <input type="hidden" id="variantFormId" value="${variantId || ''}">
            
            <div class="mb-3">
              <label for="variantStorage" class="form-label">Storage</label>
              <input type="text" class="form-control" id="variantStorage" placeholder="e.g., 128GB">
            </div>
            
            <div class="mb-3">
              <label for="variantRam" class="form-label">RAM</label>
              <input type="text" class="form-control" id="variantRam" placeholder="e.g., 8GB">
            </div>
            
            <div class="mb-3">
              <label for="variantProcessor" class="form-label">Processor</label>
              <input type="text" class="form-control" id="variantProcessor" placeholder="e.g., Snapdragon 888">
            </div>
            
            <div class="mb-3">
              <label for="variantMeasureUnit" class="form-label">Measure Unit</label>
              <input type="text" class="form-control" id="variantMeasureUnit" placeholder="e.g., piece, box">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveProductVariant()">Save Variant</button>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#variantFormModal').remove();
    $('body').append(formHtml);
    const modal = new bootstrap.Modal(document.getElementById('variantFormModal'));
    modal.show();

    if (isEdit && variantId) {
        loadVariantData(variantId);
    }
}

function loadVariantData(variantId) {
    const token = getAuthToken();
    if (!token) return;

    // Using Swagger endpoint: GET /api/merchant/products/details/{productDetailId}
    $.ajax({
        url: `${API_BASE_URL}/merchant/products/details/${variantId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (variant) {
            $('#variantStorage').val(variant.storage || variant.Storage || '');
            $('#variantRam').val(variant.ram || variant.Ram || '');
            $('#variantProcessor').val(variant.processor || variant.Processor || '');
            $('#variantMeasureUnit').val(variant.measureUnit || variant.MeasureUnit || '');
        },
        error: function (xhr) {
            console.error('Error loading variant:', xhr);
            showNotification('Error loading variant data', 'error');
        }
    });
}

window.saveProductVariant = function () {
    const productId = $('#variantFormProductId').val();
    const variantId = $('#variantFormId').val();
    const storage = $('#variantStorage').val().trim();
    const ram = $('#variantRam').val().trim();
    const processor = $('#variantProcessor').val().trim();
    const measureUnit = $('#variantMeasureUnit').val().trim();

    const token = getAuthToken();
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    const variantData = {
        productId: parseInt(productId),
        storage: storage || null,
        ram: ram || null,
        processor: processor || null,
        measureUnit: measureUnit || null
    };

    if (variantId) {
        variantData.productDetailId = parseInt(variantId);
    }

    const method = variantId ? 'PUT' : 'POST';
    const url = `${API_BASE_URL}/merchant/products/details`;

    $.ajax({
        url: url,
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(variantData),
        success: function () {
            showNotification(`Variant ${variantId ? 'updated' : 'created'} successfully`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('variantFormModal')).hide();
            loadProductVariants(productId);
        },
        error: function (xhr) {
            console.error('Error saving variant:', xhr);
            let errorMsg = 'Error saving variant';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            showNotification(errorMsg, 'error');
        }
    });
};

window.deleteProductVariant = function (variantId, productId) {
    showConfirmModal(
        'Delete Variant',
        'Are you sure you want to delete this variant?',
        function () {
            const token = getAuthToken();
            if (!token) {
                showNotification('Authentication required', 'error');
                return;
            }

            // Using Swagger endpoint: DELETE /api/merchant/products/details/{productDetailId}
            $.ajax({
                url: `${API_BASE_URL}/merchant/products/details/${variantId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                success: function () {
                    showNotification('Variant deleted successfully', 'success');
                    loadProductVariants(productId);
                },
                error: function (xhr) {
                    console.error('Error deleting variant:', xhr);
                    let errorMsg = 'Error deleting variant';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    showNotification(errorMsg, 'error');
                }
            });
        }
    );
};

// ==================== INVENTORY MANAGEMENT ====================

window.manageInventory = function (productDetailId) {
    const modalHtml = `
    <div class="modal fade" id="inventoryModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-list-ul me-2"></i>Inventory Management</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-between mb-3">
              <h6>Inventory for Variant ID: ${productDetailId}</h6>
              <button class="btn btn-sm btn-primary" onclick="addInventoryItem('${productDetailId}')">
                <i class="bi bi-plus-circle me-1"></i>Add Serial Number
              </button>
            </div>
            
            <div class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Serial Number</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="inventoryTableBody">
                  <tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#inventoryModal').remove();
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
    modal.show();

    loadInventoryItems(productDetailId);
};

function loadInventoryItems(productDetailId) {
    const token = getAuthToken();
    if (!token) {
        $('#inventoryTableBody').html('<tr><td colspan="4" class="text-center text-danger">Authentication required</td></tr>');
        return;
    }

    // Using Swagger endpoint: GET /api/merchant/inventory/product-detail/{productDetailId}
    $.ajax({
        url: `${API_BASE_URL}/merchant/inventory/product-detail/${productDetailId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        success: function (response) {
            const items = response.data || response.items || response || [];
            renderInventoryTable(items, productDetailId);
        },
        error: function (xhr) {
            console.error('Error loading inventory:', xhr);
            $('#inventoryTableBody').html('<tr><td colspan="4" class="text-center text-danger">Error loading inventory</td></tr>');
        }
    });
}

function renderInventoryTable(items, productDetailId) {
    const $tbody = $('#inventoryTableBody');

    if (!items || items.length === 0) {
        $tbody.html('<tr><td colspan="4" class="text-center text-muted">No inventory items found</td></tr>');
        return;
    }

    let html = '';
    items.forEach(item => {
        const id = item.inventoryId || item.id || item.InventoryId || 'N/A';
        const serialNumber = item.serialNumber || item.SerialNumber || 'N/A';
        const createdAt = item.createdAt || item.CreatedAt || '';
        const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : 'N/A';

        html += `
      <tr>
        <td>${id}</td>
        <td><strong>${serialNumber}</strong></td>
        <td>${formattedDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteInventoryItem('${id}', '${productDetailId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
    });

    $tbody.html(html);
}

window.addInventoryItem = function (productDetailId) {
    const formHtml = `
    <div class="modal fade" id="addInventoryModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Inventory Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="inventoryProductDetailId" value="${productDetailId}">
            
            <div class="mb-3">
              <label for="inventorySerialNumber" class="form-label">Serial Number <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="inventorySerialNumber" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveInventoryItem()">Add Item</button>
          </div>
        </div>
      </div>
    </div>
  `;

    $('#addInventoryModal').remove();
    $('body').append(formHtml);
    const modal = new bootstrap.Modal(document.getElementById('addInventoryModal'));
    modal.show();
};

window.saveInventoryItem = function () {
    const productDetailId = $('#inventoryProductDetailId').val();
    const serialNumber = $('#inventorySerialNumber').val().trim();

    if (!serialNumber) {
        showNotification('Serial number is required', 'error');
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showNotification('Authentication required', 'error');
        return;
    }

    const inventoryData = {
        productDetailId: parseInt(productDetailId),
        serialNumber: serialNumber
    };

    // Note: You may need to adjust this endpoint based on actual API documentation
    // This uses PUT to update stock, which might include adding serial numbers
    $.ajax({
        url: `${API_BASE_URL}/merchant/inventory/product-detail/${productDetailId}/stock`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(inventoryData),
        success: function () {
            showNotification('Inventory item added successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addInventoryModal')).hide();
            loadInventoryItems(productDetailId);
        },
        error: function (xhr) {
            console.error('Error adding inventory item:', xhr);
            let errorMsg = 'Error adding inventory item';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            showNotification(errorMsg, 'error');
        }
    });
};

window.deleteInventoryItem = function (inventoryId, productDetailId) {
    showConfirmModal(
        'Delete Inventory Item',
        'Are you sure you want to delete this inventory item?',
        function () {
            const token = getAuthToken();
            if (!token) {
                showNotification('Authentication required', 'error');
                return;
            }

            // Note: Adjust endpoint based on actual API
            $.ajax({
                url: `${API_BASE_URL}/merchant/inventory/${inventoryId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                success: function () {
                    showNotification('Inventory item deleted successfully', 'success');
                    loadInventoryItems(productDetailId);
                },
                error: function (xhr) {
                    console.error('Error deleting inventory item:', xhr);
                    let errorMsg = 'Error deleting inventory item';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                    showNotification(errorMsg, 'error');
                }
            });
        }
    );
};

// ==================== UTILITY FUNCTIONS ====================

function getMerchantIdFromToken() {
    try {
        const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
        const token = authData.jwt;
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.nameid || payload.userId || null;
    } catch (e) {
        console.error('Error parsing merchant ID from token:', e);
        return null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
