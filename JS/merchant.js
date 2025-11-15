$(document).ready(function () {

  $("#logout1").click(function (e) {
  e.preventDefault();

  // امسح التوكن من التخزين المحلي
  localStorage.removeItem("Auth");
  sessionStorage.removeItem("Auth");


  // بعد كده redirect لصفحة اللوجين
  window.location.href = "login.html";
});
  // API Base URL
  const API_BASE_URL = 'https://cartify.runasp.net/api';
  
  // Get Auth Token
  function getAuthToken() {
    const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
    return authData.jwt || '';
  }

  // ==================== NOTIFICATION SYSTEM ====================
  function showNotification(message, type = 'success') {
    $('.custom-notification').remove();
    const icon = type === 'success' ? '<i class="bi bi-check-circle-fill"></i>' : 
                 type === 'error' ? '<i class="bi bi-x-circle-fill"></i>' : 
                 '<i class="bi bi-info-circle-fill"></i>';
    const notification = $(`
      <div class="custom-notification ${type}">
        <div class="notification-content">
          <span class="notification-icon">${icon}</span>
          <span class="notification-message">${message}</span>
          <button class="notification-close"><i class="bi bi-x"></i></button>
        </div>
      </div>
    `);
    $('body').append(notification);
    notification.fadeIn(300);
    notification.find('.notification-close').on('click', function() {
      notification.fadeOut(300, function() { $(this).remove(); });
    });
    setTimeout(() => {
      notification.fadeOut(300, function() { $(this).remove(); });
    }, 4000);
  }

  // ==================== CONFIRMATION MODAL ====================
  function showConfirmModal(title, message, onConfirm) {
    const modal = $(`
      <div class="modal fade" id="confirmModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body"><p>${message}</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmBtn">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `);
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    bsModal.show();
    $('#confirmBtn').on('click', function() {
      onConfirm();
      bsModal.hide();
    });
    $('#confirmModal').on('hidden.bs.modal', function() { $(this).remove(); });
  }

  // -------------------- [Initial Content Load] --------------------
  loadDashboard();

  // -------------------- [Navigation Handling] --------------------
  $(".nav-link").click(function (e) {
    e.preventDefault();

    // Reset active class
    $(".nav-link").removeClass("active");
    $(this).addClass("active");

    let target = $(this).data("target");

    // -------------------- [Target Based Rendering] --------------------
    switch (target) {
      case "Dashboard":
        loadDashboard();
        $("#productWizardContainer").hide();
        break;
      case "Promotion":
        loadPromotion();
        $("#productWizardContainer").hide();
        break;
      case "Customer":
        loadCustomer();
        $("#productWizardContainer").hide();
        break;
      case "Order":
        loadOrder();
        $("#productWizardContainer").hide();
        break;
      case "Category":
        loadCategory();
        $("#productWizardContainer").hide();
        break;
      case "Subcategory":
        loadSubcategory();
        $("#productWizardContainer").hide();
        break;
      case "Profile":
        loadProfile();
        $("#productWizardContainer").hide();
        break;
      case "Products":
        $("#dynamicContentContainer").hide();
        $("#productWizardContainer").show();
        break;
    }
  });

  // -------------------- [File Input Plugin Initialization] --------------------
  $("#input-pd").fileinput({
    uploadUrl: "/file-upload-batch/1", // adjust to your server
    uploadAsync: true,
    showPreview: true,
    browseClass: "btn-custom",
    removeClass: "btn btn-danger",
    maxFileCount: 5,
    previewFileType: "any",
    theme: "fas",
    fileActionSettings: {
      removeIcon: '<i class="bi bi-x-lg"></i>',
      uploadIcon: '<i class="bi bi-upload"></i>',
      zoomIcon: '<i class="bi bi-eye"></i>',
      dragIcon: '<i class="bi bi-arrows-move"></i>',
    },
  });

  // -------------------- [Product Wizard Navigation] --------------------
  function goToStep(hideStep, showStep, widthFrom = "50%", widthTo = "100%") {
    $(hideStep).hide();
    $(showStep)
      .show()
      .css({ width: widthFrom, opacity: 0 })
      .animate({ width: widthTo, opacity: 1 }, 400);
  }

  $("#nextStep1").click((e) => { e.preventDefault(); goToStep("#productStep1", "#productStep2"); });
  $("#nextStep2").click((e) => { e.preventDefault(); goToStep("#productStep2", "#productStep3"); });
  $("#prevStep1").click((e) => { e.preventDefault(); goToStep("#productStep2", "#productStep1", "100%", "50%"); });
  $("#prevStep2").click((e) => { e.preventDefault(); goToStep("#productStep3", "#productStep2"); });

  // -------------------- [Product Categories and Attributes Data] --------------------
  let data = {
    electronics: [
      {
        name: "Mobiles",
        attributes: [
          { name: "Brand" },
          { name: "Model" },
          { name: "Storage Capacity", unit: "GB" },
          { name: "RAM", unit: "GB" },
          { name: "Processor" },
          { name: "Battery", unit: "mAh" },
          { name: "Camera", unit: "MP" },
          { name: "Color" },
          { name: "Operating System" },
        ],
      },
      {
        name: "Laptops",
        attributes: [
          { name: "Brand" },
          { name: "Model" },
          { name: "Processor" },
          { name: "RAM", unit: "GB" },
          { name: "Storage Capacity", unit: "GB" },
          { name: "Graphics Card" },
          { name: "Screen Size", unit: "inch" },
          { name: "Operating System" },
          { name: "Color" },
        ],
      },
      {
        name: "Cameras",
        attributes: [
          { name: "Brand" },
          { name: "Model" },
          { name: "Resolution", unit: "MP" },
          { name: "Lens Type" },
          { name: "Sensor Type" },
          { name: "Battery", unit: "mAh" },
          { name: "Weight", unit: "g" },
        ],
      },
      {
        name: "Audio Devices",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Model" },
          { name: "Connectivity" },
          { name: "Battery Life", unit: "hours" },
          { name: "Color" },
        ],
      },
      {
        name: "Accessories",
        attributes: [
          { name: "Type" },
          { name: "Compatibility" },
          { name: "Material" },
          { name: "Color" },
          { name: "Brand" },
        ],
      },
      {
        name: "Gaming Consoles",
        attributes: [
          { name: "Brand" },
          { name: "Model" },
          { name: "Generation" },
          { name: "Storage Capacity", unit: "GB" },
          { name: "Color" },
        ],
      },
    ],

    fashion: [
      {
        name: "Men's Clothing",
        attributes: [
          { name: "Brand" },
          { name: "Category" },
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Fit" },
          { name: "Style" },
        ],
      },
      {
        name: "Women's Clothing",
        attributes: [
          { name: "Brand" },
          { name: "Category" },
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Fit" },
          { name: "Style" },
        ],
      },
      {
        name: "Kids' Wear",
        attributes: [
          { name: "Brand" },
          { name: "Category" },
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Age Group" },
        ],
      },
      {
        name: "Footwear",
        attributes: [
          { name: "Brand" },
          { name: "Category" },
          { name: "Size", unit: "EU" },
          { name: "Color" },
          { name: "Material" },
          { name: "Style" },
        ],
      },
      {
        name: "Watches",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Model" },
          { name: "Material" },
          { name: "Color" },
          { name: "Water Resistance", unit: "m" },
        ],
      },
      {
        name: "Bags & Accessories",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Material" },
          { name: "Color" },
          { name: "Size" },
        ],
      },
    ],

    "home-furniture": [
      {
        name: "Furniture",
        attributes: [
          { name: "Type" },
          { name: "Material" },
          { name: "Color" },
          { name: "Dimensions", unit: "cm" },
          { name: "Brand" },
          { name: "Style" },
        ],
      },
      {
        name: "Kitchen & Dining",
        attributes: [
          { name: "Type" },
          { name: "Material" },
          { name: "Brand" },
          { name: "Dimensions", unit: "cm" },
          { name: "Color" },
        ],
      },
      {
        name: "Decor",
        attributes: [
          { name: "Type" },
          { name: "Style" },
          { name: "Material" },
          { name: "Color" },
          { name: "Dimensions", unit: "cm" },
        ],
      },
      {
        name: "Appliances",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Model" },
          { name: "Power", unit: "W" },
          { name: "Capacity", unit: "L" },
          { name: "Warranty", unit: "Years" },
        ],
      },
      {
        name: "Lighting",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Wattage", unit: "W" },
          { name: "Color" },
          { name: "Material" },
          { name: "Style" },
        ],
      },
    ],

    "beauty-care": [
      {
        name: "Skincare",
        attributes: [
          { name: "Brand" },
          { name: "Product Type" },
          { name: "Skin Type" },
          { name: "Ingredients" },
          { name: "Size", unit: "ml" },
        ],
      },
      {
        name: "Makeup",
        attributes: [
          { name: "Brand" },
          { name: "Product Type" },
          { name: "Shade" },
          { name: "Finish" },
          { name: "Ingredients" },
          { name: "Size", unit: "ml" },
        ],
      },
      {
        name: "Haircare",
        attributes: [
          { name: "Brand" },
          { name: "Product Type" },
          { name: "Hair Type" },
          { name: "Ingredients" },
          { name: "Size", unit: "ml" },
        ],
      },
      {
        name: "Fragrances",
        attributes: [
          { name: "Brand" },
          { name: "Fragrance Type" },
          { name: "Scent" },
          { name: "Size", unit: "ml" },
          { name: "Gender" },
        ],
      },
      {
        name: "Personal Hygiene",
        attributes: [
          { name: "Brand" },
          { name: "Product Type" },
          { name: "Size", unit: "ml" },
          { name: "Ingredients" },
          { name: "Usage" },
        ],
      },
    ],

    "sports-outdoors": [
      {
        name: "Fitness Equipment",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Model" },
          { name: "Material" },
          { name: "Weight Capacity", unit: "kg" },
          { name: "Dimensions", unit: "cm" },
        ],
      },
      {
        name: "Sportswear",
        attributes: [
          { name: "Brand" },
          { name: "Category" },
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Style" },
        ],
      },
      {
        name: "Outdoor Gear",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Material" },
          { name: "Durability" },
          { name: "Dimensions", unit: "cm" },
        ],
      },
      {
        name: "Bicycles",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Frame Size", unit: "inch" },
          { name: "Wheel Size", unit: "inch" },
          { name: "Gear Count" },
          { name: "Color" },
        ],
      },
      {
        name: "Camping & Hiking",
        attributes: [
          { name: "Brand" },
          { name: "Type" },
          { name: "Capacity", unit: "L" },
          { name: "Material" },
          { name: "Weight", unit: "kg" },
          { name: "Dimensions", unit: "cm" },
        ],
      },
    ],

    groceries: [
      {
        name: "Fruits & Vegetables",
        attributes: [
          { name: "Type" },
          { name: "Variety" },
          { name: "Weight", unit: "kg" },
          { name: "Origin" },
          { name: "Organic/Non-Organic" },
        ],
      },
      {
        name: "Snacks",
        attributes: [
          { name: "Type" },
          { name: "Flavor" },
          { name: "Brand" },
          { name: "Weight", unit: "g" },
          { name: "Package Type" },
        ],
      },
      {
        name: "Beverages",
        attributes: [
          { name: "Type" },
          { name: "Flavor" },
          { name: "Brand" },
          { name: "Size", unit: "ml" },
          { name: "Package Type" },
        ],
      },
      {
        name: "Dairy & Bakery",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Flavor" },
          { name: "Weight", unit: "g" },
          { name: "Package Type" },
        ],
      },
      {
        name: "Household Essentials",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Material" },
          { name: "Usage" },
        ],
      },
    ],

    "books-stationery": [
      {
        name: "Fiction",
        attributes: [
          { name: "Title" },
          { name: "Author" },
          { name: "Publisher" },
          { name: "Language" },
          { name: "Pages" },
          { name: "ISBN" },
        ],
      },
      {
        name: "Non-fiction",
        attributes: [
          { name: "Title" },
          { name: "Author" },
          { name: "Publisher" },
          { name: "Language" },
          { name: "Pages" },
          { name: "ISBN" },
        ],
      },
      {
        name: "School Books",
        attributes: [
          { name: "Title" },
          { name: "Subject" },
          { name: "Grade" },
          { name: "Author" },
          { name: "Publisher" },
          { name: "ISBN" },
        ],
      },
      {
        name: "Office Supplies",
        attributes: [
          { name: "Type" },
          { name: "Material" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Color" },
        ],
      },
      {
        name: "Art & Craft",
        attributes: [
          { name: "Type" },
          { name: "Material" },
          { name: "Brand" },
          { name: "Color" },
          { name: "Size" },
        ],
      },
    ],

    "toys-kids": [
      {
        name: "Toys",
        attributes: [
          { name: "Type" },
          { name: "Age Group" },
          { name: "Brand" },
          { name: "Material" },
          { name: "Dimensions", unit: "cm" },
        ],
      },
      {
        name: "Baby Products",
        attributes: [
          { name: "Type" },
          { name: "Age Group" },
          { name: "Material" },
          { name: "Brand" },
          { name: "Color" },
        ],
      },
      {
        name: "Kids’ Fashion",
        attributes: [
          { name: "Category" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Color" },
          { name: "Material" },
          { name: "Style" },
        ],
      },
      {
        name: "Games & Puzzles",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Age Group" },
          { name: "Pieces" },
          { name: "Material" },
        ],
      },
    ],

    automotive: [
      {
        name: "Car Accessories",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Compatibility" },
          { name: "Material" },
          { name: "Color" },
        ],
      },
      {
        name: "Motorbike Accessories",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Compatibility" },
          { name: "Material" },
          { name: "Color" },
        ],
      },
      {
        name: "Car Care",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Usage" },
          { name: "Material" },
        ],
      },
      {
        name: "Spare Parts",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Model Compatibility" },
          { name: "Material" },
        ],
      },
    ],

    "health-wellness": [
      {
        name: "Supplements",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Dosage", unit: "mg" },
          { name: "Ingredients" },
          { name: "Size", unit: "capsules" },
        ],
      },
      {
        name: "Medical Equipment",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Model" },
          { name: "Material" },
          { name: "Size" },
        ],
      },
      {
        name: "Fitness",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Material" },
          { name: "Usage" },
        ],
      },
      {
        name: "Personal Care",
        attributes: [
          { name: "Type" },
          { name: "Brand" },
          { name: "Size" },
          { name: "Ingredients" },
          { name: "Usage" },
        ],
      },
    ],
  };

  // -------------------- [Category Change Handler] --------------------
  $("#category").change(function () {
    let subs = data[$(this).val()] || [];
    let $sub = $("#type");

    // Clear "type" dropdown
    $sub.empty().append('<option value="" selected disabled hidden>Choose Type</option>');

    // Clear attributes row
    $("#attributesRow").empty();

    // Populate "type" dropdown
    $.each(subs, (i, v) => {
      $sub.append(`<option value="${i}">${v.name}</option>`);
    });
  });

  // -------------------- [Type Change Handler - Generate Attributes Form] --------------------
  $("#type").change(function () {
    let selectedType = $(this).val();
    let subs = data[$("#category").val()][selectedType]?.attributes || [];
    let $container = $("#attributesRow");

    $container.empty(); // clear previous attributes

    // Add attributes in rows of 3 inputs each
    for (let i = 0; i < subs.length; i += 3) {
      let row = $('<div class="row mb-3"></div>');

      function makeCol(attr) {
        if (!attr) return "";
        if (attr.unit) {
          return `
            <div class="col">
              <label class="form-label">${attr.name}</label>
              <div class="input-group">
                <input type="text" class="form-control" name="${attr.name}" placeholder="${attr.name}" />
                <span class="input-group-text">${attr.unit}</span>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="col">
              <label class="form-label">${attr.name}</label>
              <input type="text" class="form-control" name="${attr.name}" placeholder="${attr.name}" />
            </div>
          `;
        }
      }

      row.append(makeCol(subs[i]));
      row.append(makeCol(subs[i + 1]));
      row.append(makeCol(subs[i + 2]));
      $container.append(row);
    }
  });

  // ==================== DASHBOARD SECTION ====================
  function loadDashboard() {
    const html = `
      <div class="section-container">
        <h2 class="section-title"><i class="bi bi-speedometer2 me-2"></i>Dashboard</h2>
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card stat-card">
              <div class="card-body">
                <h5 class="card-title">Total Products</h5>
                <h3 class="stat-number" id="totalProducts">0</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card">
              <div class="card-body">
                <h5 class="card-title">Total Customers</h5>
                <h3 class="stat-number" id="totalCustomers">0</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card">
              <div class="card-body">
                <h5 class="card-title">Total Orders</h5>
                <h3 class="stat-number" id="totalOrders">0</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card">
              <div class="card-body">
                <h5 class="card-title">Total Revenue</h5>
                <h3 class="stat-number" id="totalRevenue">$0</h3>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h5>Recent Activity</h5>
          </div>
          <div class="card-body">
            <div id="recentActivity">Loading...</div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchDashboardData();
  }

  function fetchDashboardData() {
    // Fetch dashboard statistics
    // This is a placeholder - adjust API endpoints as needed
    $("#totalProducts").text("0");
    $("#totalCustomers").text("0");
    $("#totalOrders").text("0");
    $("#totalRevenue").text("$0");
    $("#recentActivity").html("<p>No recent activity</p>");
  }

  // ==================== PROMOTION SECTION ====================
  function loadPromotion() {
    const html = `
      <div class="section-container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="section-title"><i class="bi bi-tag me-2"></i>Promotion Management</h2>
          <button class="btn btn-primary" id="btnAddPromotion">
            <i class="bi bi-plus-circle me-2"></i>Add Promotion
          </button>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover" id="promotionTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Discount</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="promotionTableBody">
                  <tr><td colspan="7" class="text-center">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchPromotions();
    
    // Add promotion button handler
    $(document).off('click', '#btnAddPromotion').on('click', '#btnAddPromotion', showPromotionModal);
  }

  function fetchPromotions() {
    // Fetch promotions from API
    $.ajax({
      url: `${API_BASE_URL}/Promotions`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        renderPromotionsTable(data);
      },
      error: function() {
        $("#promotionTableBody").html('<tr><td colspan="7" class="text-center text-danger">Error loading promotions</td></tr>');
      }
    });
  }

  function renderPromotionsTable(promotions) {
    if (!promotions || promotions.length === 0) {
      $("#promotionTableBody").html('<tr><td colspan="7" class="text-center">No promotions found</td></tr>');
      return;
    }
    let html = '';
    promotions.forEach(promo => {
      html += `
        <tr>
          <td>${promo.id || 'N/A'}</td>
          <td>${promo.title || 'N/A'}</td>
          <td>${promo.discount || 0}%</td>
          <td>${promo.startDate || 'N/A'}</td>
          <td>${promo.endDate || 'N/A'}</td>
          <td><span class="badge ${promo.isActive ? 'bg-success' : 'bg-secondary'}">${promo.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="editPromotion(${promo.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deletePromotion(${promo.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    $("#promotionTableBody").html(html);
  }

  function showPromotionModal(id = null) {
    const isEdit = id !== null;
    const modal = `
      <div class="modal fade" id="promotionModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Promotion</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="promotionForm">
                <input type="hidden" id="promotionId" value="${id || ''}">
                <div class="mb-3">
                  <label class="form-label">Title</label>
                  <input type="text" class="form-control" id="promotionTitle" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="promotionDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Discount (%)</label>
                  <input type="number" class="form-control" id="promotionDiscount" min="0" max="100" required>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="promotionStartDate" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control" id="promotionEndDate" required>
                  </div>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="promotionIsActive" checked>
                    <label class="form-check-label" for="promotionIsActive">Active</label>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="savePromotion()">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('promotionModal'));
    bsModal.show();
    $('#promotionModal').on('hidden.bs.modal', function() {
      $(this).remove();
    });
    if (isEdit) loadPromotionData(id);
  }

  window.editPromotion = function(id) {
    showPromotionModal(id);
  };

  window.deletePromotion = function(id) {
    showConfirmModal('Delete Promotion', 'Are you sure you want to delete this promotion?', function() {
      $.ajax({
        url: `${API_BASE_URL}/Promotions/${id}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        success: function() {
          fetchPromotions();
          showNotification('Promotion deleted successfully', 'success');
        },
        error: function(xhr) {
          showNotification(xhr.responseJSON?.message || 'Error deleting promotion', 'error');
        }
      });
    });
  };

  window.savePromotion = function() {
    if (!$('#promotionTitle').val().trim()) {
      showNotification('Please enter a promotion title', 'error');
      return;
    }
    const data = {
      id: $('#promotionId').val() || 0,
      title: $('#promotionTitle').val().trim(),
      description: $('#promotionDescription').val().trim(),
      discount: parseFloat($('#promotionDiscount').val()) || 0,
      startDate: $('#promotionStartDate').val(),
      endDate: $('#promotionEndDate').val(),
      isActive: $('#promotionIsActive').is(':checked')
    };
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_BASE_URL}/Promotions/${data.id}` : `${API_BASE_URL}/Promotions`;
    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify(data),
      success: function() {
        bootstrap.Modal.getInstance(document.getElementById('promotionModal')).hide();
        fetchPromotions();
        showNotification(`Promotion ${data.id ? 'updated' : 'created'} successfully`, 'success');
      },
      error: function(xhr) {
        showNotification(xhr.responseJSON?.message || 'Error saving promotion', 'error');
      }
    });
  };

  function loadPromotionData(id) {
    $.ajax({
      url: `${API_BASE_URL}/Promotions/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        $('#promotionId').val(data.id);
        $('#promotionTitle').val(data.title);
        $('#promotionDescription').val(data.description);
        $('#promotionDiscount').val(data.discount);
        $('#promotionStartDate').val(data.startDate);
        $('#promotionEndDate').val(data.endDate);
        $('#promotionIsActive').prop('checked', data.isActive);
      }
    });
  }

  // ==================== CUSTOMER SECTION ====================
  function loadCustomer() {
    const html = `
      <div class="section-container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="section-title"><i class="bi bi-people me-2"></i>Customer Management</h2>
          <button class="btn btn-primary btn-lg" id="btnAddCustomer">
            <i class="bi bi-plus-circle me-2"></i>Add Customer
          </button>
        </div>
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control" id="customerSearch" placeholder="Search customers...">
                </div>
              </div>
              <div class="col-md-6 text-end">
                <span class="badge bg-primary" id="customerCount">0 customers</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0" id="customerTable">
                <thead>
                  <tr>
                    <th><i class="bi bi-hash me-1"></i>ID</th>
                    <th><i class="bi bi-person me-1"></i>Name</th>
                    <th><i class="bi bi-envelope me-1"></i>Email</th>
                    <th><i class="bi bi-telephone me-1"></i>Phone</th>
                    <th><i class="bi bi-cart me-1"></i>Orders</th>
                    <th><i class="bi bi-toggle-on me-1"></i>Status</th>
                    <th class="text-center"><i class="bi bi-gear me-1"></i>Actions</th>
                  </tr>
                </thead>
                <tbody id="customerTableBody">
                  <tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchCustomers();
    
    $(document).off('click', '#btnAddCustomer').on('click', '#btnAddCustomer', () => showCustomerModal());
    $(document).off('input', '#customerSearch').on('input', '#customerSearch', function() {
      const term = $(this).val().toLowerCase();
      $('#customerTableBody tr').each(function() {
        $(this).toggle($(this).text().toLowerCase().includes(term));
      });
    });
  }

  function fetchCustomers() {
    $.ajax({
      url: `${API_BASE_URL}/Customers`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        renderCustomersTable(data);
      },
      error: function() {
        $("#customerTableBody").html('<tr><td colspan="7" class="text-center text-danger">Error loading customers</td></tr>');
      }
    });
  }

  function renderCustomersTable(customers) {
    if (!customers || customers.length === 0) {
      $("#customerTableBody").html(`
        <tr><td colspan="7" class="text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="mt-3 text-muted">No customers found</p>
        </td></tr>
      `);
      $('#customerCount').text('0 customers');
      return;
    }
    let html = '';
    customers.forEach(customer => {
      const name = customer.name || (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 'N/A');
      html += `
        <tr class="table-row-hover">
          <td><strong>#${customer.id || 'N/A'}</strong></td>
          <td>
            <div class="d-flex align-items-center">
              <i class="bi bi-person-circle me-2" style="font-size: 1.5rem; color: var(--greenNormal);"></i>
              <span>${name}</span>
            </div>
          </td>
          <td><a href="mailto:${customer.email || ''}" class="text-decoration-none">${customer.email || 'N/A'}</a></td>
          <td>${customer.phone || '<span class="text-muted">-</span>'}</td>
          <td><span class="badge bg-info">${customer.totalOrders || 0}</span></td>
          <td><span class="badge ${customer.isActive ? 'bg-success' : 'bg-secondary'}">${customer.isActive ? '<i class="bi bi-check-circle me-1"></i>Active' : '<i class="bi bi-x-circle me-1"></i>Inactive'}</span></td>
          <td class="text-center">
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary" onclick="editCustomer(${customer.id})" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    $("#customerTableBody").html(html);
    $('#customerCount').text(`${customers.length} customer${customers.length !== 1 ? 's' : ''}`);
  }

  function showCustomerModal(id = null) {
    const isEdit = id !== null;
    const modal = $(`
      <div class="modal fade" id="customerModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-${isEdit ? 'pencil' : 'person-plus'} me-2"></i>${isEdit ? 'Edit' : 'Add'} Customer</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <form id="customerForm">
                <input type="hidden" id="customerId" value="${id || ''}">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label"><i class="bi bi-person me-1"></i>First Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="customerFirstName" placeholder="Enter first name" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label"><i class="bi bi-person me-1"></i>Last Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="customerLastName" placeholder="Enter last name" required>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label"><i class="bi bi-envelope me-1"></i>Email <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" id="customerEmail" placeholder="customer@example.com" required>
                </div>
                <div class="mb-3">
                  <label class="form-label"><i class="bi bi-telephone me-1"></i>Phone</label>
                  <input type="tel" class="form-control" id="customerPhone" placeholder="+1234567890">
                </div>
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="customerIsActive" checked>
                    <label class="form-check-label" for="customerIsActive"><i class="bi bi-toggle-on me-1"></i>Active Status</label>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="bi bi-x-circle me-1"></i>Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveCustomer()"><i class="bi bi-check-circle me-1"></i>Save</button>
            </div>
          </div>
        </div>
      </div>
    `);
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('customerModal'));
    bsModal.show();
    $('#customerModal').on('hidden.bs.modal', function() { $(this).remove(); });
    if (isEdit) loadCustomerData(id);
  }

  window.editCustomer = function(id) {
    showCustomerModal(id);
  };

  window.deleteCustomer = function(id) {
    showConfirmModal('Delete Customer', 'Are you sure you want to delete this customer? This action cannot be undone.', function() {
      $.ajax({
        url: `${API_BASE_URL}/Customers/${id}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        success: function() {
          fetchCustomers();
          showNotification('Customer deleted successfully', 'success');
        },
        error: function(xhr) {
          showNotification(xhr.responseJSON?.message || 'Error deleting customer', 'error');
        }
      });
    });
  };

  window.saveCustomer = function() {
    if (!$('#customerFirstName').val().trim() || !$('#customerLastName').val().trim()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    if (!$('#customerEmail').val().trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#customerEmail').val())) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    const data = {
      id: $('#customerId').val() || 0,
      firstName: $('#customerFirstName').val().trim(),
      lastName: $('#customerLastName').val().trim(),
      email: $('#customerEmail').val().trim(),
      phone: $('#customerPhone').val().trim() || null,
      isActive: $('#customerIsActive').is(':checked')
    };
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_BASE_URL}/Customers/${data.id}` : `${API_BASE_URL}/Customers`;
    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify(data),
      success: function() {
        bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
        fetchCustomers();
        showNotification(`Customer ${data.id ? 'updated' : 'created'} successfully`, 'success');
      },
      error: function(xhr) {
        showNotification(xhr.responseJSON?.message || 'Error saving customer', 'error');
      }
    });
  };

  function loadCustomerData(id) {
    $.ajax({
      url: `${API_BASE_URL}/Customers/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        $('#customerId').val(data.id);
        $('#customerFirstName').val(data.firstName);
        $('#customerLastName').val(data.lastName);
        $('#customerEmail').val(data.email);
        $('#customerPhone').val(data.phone);
        $('#customerIsActive').prop('checked', data.isActive);
      }
    });
  }

  // ==================== ORDER SECTION ====================
  function loadOrder() {
    const html = `
      <div class="section-container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="section-title"><i class="bi bi-cart-check me-2"></i>Order Management</h2>
        </div>
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control" id="orderSearch" placeholder="Search orders...">
                </div>
              </div>
              <div class="col-md-4">
                <select class="form-select" id="orderStatusFilter">
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div class="col-md-4 text-end">
                <span class="badge bg-primary" id="orderCount">0 orders</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0" id="orderTable">
                <thead>
                  <tr>
                    <th><i class="bi bi-hash me-1"></i>Order ID</th>
                    <th><i class="bi bi-person me-1"></i>Customer</th>
                    <th><i class="bi bi-calendar me-1"></i>Date</th>
                    <th><i class="bi bi-currency-dollar me-1"></i>Total</th>
                    <th><i class="bi bi-tag me-1"></i>Status</th>
                    <th class="text-center"><i class="bi bi-gear me-1"></i>Actions</th>
                  </tr>
                </thead>
                <tbody id="orderTableBody">
                  <tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchOrders();
    
    $(document).off('input', '#orderSearch').on('input', '#orderSearch', function() {
      filterOrders();
    });
    $(document).off('change', '#orderStatusFilter').on('change', '#orderStatusFilter', function() {
      filterOrders();
    });
  }

  function fetchOrders() {
    $.ajax({
      url: `${API_BASE_URL}/Orders`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        renderOrdersTable(data);
      },
      error: function() {
        $("#orderTableBody").html('<tr><td colspan="6" class="text-center text-danger">Error loading orders</td></tr>');
      }
    });
  }

  function renderOrdersTable(orders) {
    if (!orders || orders.length === 0) {
      $("#orderTableBody").html(`
        <tr>
          <td colspan="6" class="text-center py-5">
            <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
            <p class="mt-3 text-muted">No orders found</p>
          </td>
        </tr>
      `);
      $('#orderCount').text('0 orders');
      return;
    }
    let html = '';
    orders.forEach(order => {
      const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A';
      const statusClass = {
        'Pending': 'bg-warning',
        'Processing': 'bg-info',
        'Shipped': 'bg-primary',
        'Delivered': 'bg-success',
        'Cancelled': 'bg-danger'
      }[order.status] || 'bg-secondary';
      
      html += `
        <tr class="table-row-hover" data-status="${order.status || ''}">
          <td><strong>#${order.id || 'N/A'}</strong></td>
          <td>${order.customerName || order.customer?.name || 'N/A'}</td>
          <td>${orderDate}</td>
          <td><strong>$${parseFloat(order.totalAmount || 0).toFixed(2)}</strong></td>
          <td><span class="badge ${statusClass}">${order.status || 'N/A'}</span></td>
          <td class="text-center">
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails(${order.id})" title="View">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-success" onclick="updateOrderStatus(${order.id})" title="Update Status">
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    $("#orderTableBody").html(html);
    $('#orderCount').text(`${orders.length} order${orders.length !== 1 ? 's' : ''}`);
  }

  function filterOrders() {
    const searchTerm = $('#orderSearch').val().toLowerCase();
    const statusFilter = $('#orderStatusFilter').val();
    
    $('#orderTableBody tr').each(function() {
      const text = $(this).text().toLowerCase();
      const status = $(this).data('status') || '';
      const matchesSearch = text.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      $(this).toggle(matchesSearch && matchesStatus);
    });
  }

  window.viewOrderDetails = function(id) {
    $.ajax({
      url: `${API_BASE_URL}/Orders/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(order) {
        showOrderDetailsModal(order);
      },
      error: function() {
        showNotification('Error loading order details', 'error');
      }
    });
  };

  function showOrderDetailsModal(order) {
    const itemsHtml = order.orderItems?.map(item => `
      <tr>
        <td>${item.productName || 'N/A'}</td>
        <td>${item.quantity || 0}</td>
        <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
        <td>$${parseFloat((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" class="text-center">No items</td></tr>';
    
    const modal = $(`
      <div class="modal fade" id="orderDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-cart-check me-2"></i>Order #${order.id} Details</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <div class="row mb-3">
                <div class="col-md-6">
                  <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
                  <p><strong>Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Status:</strong> <span class="badge bg-primary">${order.status || 'N/A'}</span></p>
                  <p><strong>Total:</strong> <strong>$${parseFloat(order.totalAmount || 0).toFixed(2)}</strong></p>
                </div>
              </div>
              <hr>
              <h6 class="mb-3">Order Items</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `);
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    bsModal.show();
    $('#orderDetailsModal').on('hidden.bs.modal', function() { $(this).remove(); });
  }

  window.updateOrderStatus = function(id) {
    const modal = $(`
      <div class="modal fade" id="updateStatusModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title"><i class="bi bi-arrow-repeat me-2"></i>Update Order Status</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <form id="statusForm">
                <input type="hidden" id="orderId" value="${id}">
                <div class="mb-3">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="newStatus" required>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" onclick="saveOrderStatus()">Update Status</button>
            </div>
          </div>
        </div>
      </div>
    `);
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    bsModal.show();
    $('#updateStatusModal').on('hidden.bs.modal', function() { $(this).remove(); });
  };

  window.saveOrderStatus = function() {
    const orderId = $('#orderId').val();
    const newStatus = $('#newStatus').val();
    
    $.ajax({
      url: `${API_BASE_URL}/Orders/${orderId}/status`,
      method: 'PUT',
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify({ status: newStatus }),
      success: function() {
        bootstrap.Modal.getInstance(document.getElementById('updateStatusModal')).hide();
        fetchOrders();
        showNotification('Order status updated successfully', 'success');
      },
      error: function() {
        showNotification('Error updating order status', 'error');
      }
    });
  };

  // ==================== CATEGORY SECTION ====================
  function loadCategory() {
    const html = `
      <div class="section-container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="section-title"><i class="bi bi-folder me-2"></i>Category Management</h2>
          <button class="btn btn-primary" id="btnAddCategory">
            <i class="bi bi-plus-circle me-2"></i>Add Category
          </button>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover" id="categoryTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="categoryTableBody">
                  <tr><td colspan="6" class="text-center">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchCategories();
    
    $(document).off('click', '#btnAddCategory').on('click', '#btnAddCategory', showCategoryModal);
  }

  function fetchCategories() {
    $.ajax({
      url: `${API_BASE_URL}/Categories`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        renderCategoriesTable(data);
      },
      error: function() {
        $("#categoryTableBody").html('<tr><td colspan="6" class="text-center text-danger">Error loading categories</td></tr>');
      }
    });
  }

  function renderCategoriesTable(categories) {
    if (!categories || categories.length === 0) {
      $("#categoryTableBody").html('<tr><td colspan="6" class="text-center">No categories found</td></tr>');
      return;
    }
    let html = '';
    categories.forEach(category => {
      html += `
        <tr>
          <td>${category.id || 'N/A'}</td>
          <td>${category.name || 'N/A'}</td>
          <td>${category.description || 'N/A'}</td>
          <td>${category.imageUrl ? `<img src="${category.imageUrl}" width="50" height="50" class="img-thumbnail">` : 'N/A'}</td>
          <td><span class="badge ${category.isActive ? 'bg-success' : 'bg-secondary'}">${category.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="editCategory(${category.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    $("#categoryTableBody").html(html);
  }

  function showCategoryModal(id = null) {
    const isEdit = id !== null;
    const modal = `
      <div class="modal fade" id="categoryModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Category</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="categoryForm">
                <input type="hidden" id="categoryId" value="${id || ''}">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input type="text" class="form-control" id="categoryName" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="categoryDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Image URL</label>
                  <input type="url" class="form-control" id="categoryImageUrl">
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="categoryIsActive" checked>
                    <label class="form-check-label" for="categoryIsActive">Active</label>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveCategory()">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modal);
    const bsModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    bsModal.show();
    $('#categoryModal').on('hidden.bs.modal', function() {
      $(this).remove();
    });
    if (isEdit) loadCategoryData(id);
  }

  window.editCategory = function(id) {
    showCategoryModal(id);
  };

  window.deleteCategory = function(id) {
    showConfirmModal('Delete Category', 'Are you sure you want to delete this category?', function() {
      $.ajax({
        url: `${API_BASE_URL}/Categories/${id}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        success: function() {
          fetchCategories();
          showNotification('Category deleted successfully', 'success');
        },
        error: function(xhr) {
          showNotification(xhr.responseJSON?.message || 'Error deleting category', 'error');
        }
      });
    });
  };

  window.saveCategory = function() {
    if (!$('#categoryName').val().trim()) {
      showNotification('Please enter a category name', 'error');
      return;
    }
    const data = {
      id: $('#categoryId').val() || 0,
      name: $('#categoryName').val().trim(),
      description: $('#categoryDescription').val().trim(),
      imageUrl: $('#categoryImageUrl').val().trim() || null,
      isActive: $('#categoryIsActive').is(':checked')
    };
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_BASE_URL}/Categories/${data.id}` : `${API_BASE_URL}/Categories`;
    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify(data),
      success: function() {
        bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        fetchCategories();
        showNotification(`Category ${data.id ? 'updated' : 'created'} successfully`, 'success');
      },
      error: function(xhr) {
        showNotification(xhr.responseJSON?.message || 'Error saving category', 'error');
      }
    });
  };

  function loadCategoryData(id) {
    $.ajax({
      url: `${API_BASE_URL}/Categories/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        $('#categoryId').val(data.id);
        $('#categoryName').val(data.name);
        $('#categoryDescription').val(data.description);
        $('#categoryImageUrl').val(data.imageUrl);
        $('#categoryIsActive').prop('checked', data.isActive);
      }
    });
  }

  // ==================== SUBCATEGORY SECTION ====================
  function loadSubcategory() {
    const html = `
      <div class="section-container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="section-title"><i class="bi bi-folder2 me-2"></i>Subcategory Management</h2>
          <button class="btn btn-primary" id="btnAddSubcategory">
            <i class="bi bi-plus-circle me-2"></i>Add Subcategory
          </button>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover" id="subcategoryTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="subcategoryTableBody">
                  <tr><td colspan="6" class="text-center">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    fetchSubcategories();
    
    $(document).off('click', '#btnAddSubcategory').on('click', '#btnAddSubcategory', showSubcategoryModal);
  }

  function fetchSubcategories() {
    $.ajax({
      url: `${API_BASE_URL}/Subcategories`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        renderSubcategoriesTable(data);
      },
      error: function() {
        $("#subcategoryTableBody").html('<tr><td colspan="6" class="text-center text-danger">Error loading subcategories</td></tr>');
      }
    });
  }

  function renderSubcategoriesTable(subcategories) {
    if (!subcategories || subcategories.length === 0) {
      $("#subcategoryTableBody").html('<tr><td colspan="6" class="text-center">No subcategories found</td></tr>');
      return;
    }
    let html = '';
    subcategories.forEach(sub => {
      html += `
        <tr>
          <td>${sub.id || 'N/A'}</td>
          <td>${sub.name || 'N/A'}</td>
          <td>${sub.categoryName || sub.categoryId || 'N/A'}</td>
          <td>${sub.description || 'N/A'}</td>
          <td><span class="badge ${sub.isActive ? 'bg-success' : 'bg-secondary'}">${sub.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="editSubcategory(${sub.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteSubcategory(${sub.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    $("#subcategoryTableBody").html(html);
  }

  function showSubcategoryModal(id = null) {
    const isEdit = id !== null;
    const modal = `
      <div class="modal fade" id="subcategoryModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Subcategory</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="subcategoryForm">
                <input type="hidden" id="subcategoryId" value="${id || ''}">
                <div class="mb-3">
                  <label class="form-label">Category</label>
                  <select class="form-select" id="subcategoryCategoryId" required>
                    <option value="">Select Category</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input type="text" class="form-control" id="subcategoryName" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="subcategoryDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="subcategoryIsActive" checked>
                    <label class="form-check-label" for="subcategoryIsActive">Active</label>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveSubcategory()">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modal);
    loadCategoriesForSubcategory();
    const bsModal = new bootstrap.Modal(document.getElementById('subcategoryModal'));
    bsModal.show();
    $('#subcategoryModal').on('hidden.bs.modal', function() {
      $(this).remove();
    });
    if (isEdit) loadSubcategoryData(id);
  }

  function loadCategoriesForSubcategory() {
    $.ajax({
      url: `${API_BASE_URL}/Categories`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        const select = $('#subcategoryCategoryId');
        select.empty().append('<option value="">Select Category</option>');
        if (data && data.length > 0) {
          data.forEach(cat => {
            select.append(`<option value="${cat.id}">${cat.name}</option>`);
          });
        }
      }
    });
  }

  window.editSubcategory = function(id) {
    showSubcategoryModal(id);
  };

  window.deleteSubcategory = function(id) {
    showConfirmModal('Delete Subcategory', 'Are you sure you want to delete this subcategory?', function() {
      $.ajax({
        url: `${API_BASE_URL}/Subcategories/${id}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        success: function() {
          fetchSubcategories();
          showNotification('Subcategory deleted successfully', 'success');
        },
        error: function(xhr) {
          showNotification(xhr.responseJSON?.message || 'Error deleting subcategory', 'error');
        }
      });
    });
  };

  window.saveSubcategory = function() {
    if (!$('#subcategoryCategoryId').val()) {
      showNotification('Please select a category', 'error');
      return;
    }
    if (!$('#subcategoryName').val().trim()) {
      showNotification('Please enter a subcategory name', 'error');
      return;
    }
    const data = {
      id: $('#subcategoryId').val() || 0,
      categoryId: $('#subcategoryCategoryId').val(),
      name: $('#subcategoryName').val().trim(),
      description: $('#subcategoryDescription').val().trim(),
      isActive: $('#subcategoryIsActive').is(':checked')
    };
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_BASE_URL}/Subcategories/${data.id}` : `${API_BASE_URL}/Subcategories`;
    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify(data),
      success: function() {
        bootstrap.Modal.getInstance(document.getElementById('subcategoryModal')).hide();
        fetchSubcategories();
        showNotification(`Subcategory ${data.id ? 'updated' : 'created'} successfully`, 'success');
      },
      error: function(xhr) {
        showNotification(xhr.responseJSON?.message || 'Error saving subcategory', 'error');
      }
    });
  };

  function loadSubcategoryData(id) {
    $.ajax({
      url: `${API_BASE_URL}/Subcategories/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      success: function(data) {
        $('#subcategoryId').val(data.id);
        $('#subcategoryCategoryId').val(data.categoryId);
        $('#subcategoryName').val(data.name);
        $('#subcategoryDescription').val(data.description);
        $('#subcategoryIsActive').prop('checked', data.isActive);
      }
    });
  }

  // ==================== PROFILE SECTION ====================
  function loadProfile() {
    const html = `
      <div class="section-container">
        <h2 class="section-title"><i class="bi bi-person-circle me-2"></i>Profile Management</h2>
        <div class="row">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header">
                <h5>Merchant Profile</h5>
              </div>
              <div class="card-body">
                <form id="profileForm">
                  <input type="hidden" id="profileId">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Store Name</label>
                      <input type="text" class="form-control" id="profileStoreName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Email</label>
                      <input type="email" class="form-control" id="profileEmail" required>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Phone</label>
                      <input type="tel" class="form-control" id="profilePhone">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Address</label>
                      <input type="text" class="form-control" id="profileAddress">
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="profileDescription" rows="4"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Logo URL</label>
                    <input type="url" class="form-control" id="profileLogoUrl">
                  </div>
                  <button type="button" class="btn btn-primary" onclick="saveProfile()">
                    <i class="bi bi-save me-2"></i>Save Profile
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h5>Profile Image</h5>
              </div>
              <div class="card-body text-center">
                <img id="profileImagePreview" src="images/user.png" class="img-thumbnail mb-3" style="max-width: 200px;">
                <div class="mb-3">
                  <label class="form-label">Change Password</label>
                  <input type="password" class="form-control mb-2" id="profileOldPassword" placeholder="Old Password">
                  <input type="password" class="form-control mb-2" id="profileNewPassword" placeholder="New Password">
                  <input type="password" class="form-control" id="profileConfirmPassword" placeholder="Confirm Password">
                  <button type="button" class="btn btn-warning mt-2" onclick="changePassword()">
                    <i class="bi bi-key me-2"></i>Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#dynamicContentContainer").show().html(html);
    loadProfileData();
  }

  function loadProfileData() {
    // Get user ID from token or API
    const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
    const token = authData.jwt;
    if (!token) return;
    
    // Decode JWT to get user ID (simplified - you may need a proper JWT decoder)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.nameid;
      
      $.ajax({
        url: `${API_BASE_URL}/Profile/${userId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: function(data) {
          $('#profileId').val(data.id || userId);
          $('#profileStoreName').val(data.storeName || data.name || '');
          $('#profileEmail').val(data.email || '');
          $('#profilePhone').val(data.phone || '');
          $('#profileAddress').val(data.address || '');
          $('#profileDescription').val(data.description || '');
          $('#profileLogoUrl').val(data.logoUrl || data.imageUrl || '');
          if (data.logoUrl || data.imageUrl) {
            $('#profileImagePreview').attr('src', data.logoUrl || data.imageUrl);
          }
        },
        error: function() {
          console.log('Error loading profile');
        }
      });
    } catch(e) {
      console.log('Error parsing token');
    }
  }

  window.saveProfile = function() {
    const data = {
      id: $('#profileId').val(),
      storeName: $('#profileStoreName').val(),
      email: $('#profileEmail').val(),
      phone: $('#profilePhone').val(),
      address: $('#profileAddress').val(),
      description: $('#profileDescription').val(),
      logoUrl: $('#profileLogoUrl').val()
    };
    
    $.ajax({
      url: `${API_BASE_URL}/Profile/${data.id}`,
      method: 'PUT',
      contentType: 'application/json',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      data: JSON.stringify(data),
      success: function() {
        alert('Profile updated successfully');
        loadProfileData();
      },
      error: function() {
        alert('Error updating profile');
      }
    });
  };

  window.changePassword = function() {
    const oldPassword = $('#profileOldPassword').val();
    const newPassword = $('#profileNewPassword').val();
    const confirmPassword = $('#profileConfirmPassword').val();
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    const authData = JSON.parse(localStorage.getItem('Auth') || sessionStorage.getItem('Auth') || '{}');
    const token = authData.jwt;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.nameid;
      
      $.ajax({
        url: `${API_BASE_URL}/Users/ChangePassword`,
        method: 'POST',
        contentType: 'application/json',
        headers: { 'Authorization': `Bearer ${token}` },
        data: JSON.stringify({
          userId: userId,
          oldPassword: oldPassword,
          newPassword: newPassword
        }),
        success: function() {
          alert('Password changed successfully');
          $('#profileOldPassword, #profileNewPassword, #profileConfirmPassword').val('');
        },
        error: function() {
          alert('Error changing password');
        }
      });
    } catch(e) {
      alert('Error processing request');
    }
  };

// -------------------- [Logout Handler] --------------------

});