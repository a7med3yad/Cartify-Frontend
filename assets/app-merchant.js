import {
  API_CONFIG,
  apiRequest,
  getAuth,
  setAuth,
  clearAuth,
  showToast,
  decodeJwt,
  setPreference,
  getPreference,
} from "./app-common.js";

const state = {
  products: [],
  attributes: [],
  measures: [],
  storeId: null,
};

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  if (!auth?.token) {
    showToast("Please log in first.", "error");
    window.location.href = "index.html#login";
    return;
  }
  state.storeId = getPreference().storeId || "";
  populateStoreInputs();
  wireNavigation();
  wireForms();
  hydrateProfile(auth);
  loadAttributes();
  loadProducts();
});

function hydrateProfile(auth) {
  const payload = decodeJwt(auth.token);
  const roles = payload
    ? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role || []
    : [];
  document.getElementById("merchant-email").textContent = payload?.email || "Unknown email";
  document.getElementById("merchant-roles").textContent = `Roles: ${[].concat(roles).join(", ") || "None"}`;
  const pill = document.getElementById("merchant-role-pill");
  if (pill) pill.textContent = roles.includes("Merchant") ? "Role: Merchant" : "Role: User";
  document.getElementById("orders-store-id").value = state.storeId || "";
}

function populateStoreInputs() {
  const inputs = [
    "merchant-store",
    "prod-store",
    "inventory-store-id",
    "orders-store-id",
  ];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el && state.storeId) el.value = state.storeId;
  });
}

function wireNavigation() {
  document.getElementById("merchant-logout")?.addEventListener("click", () => {
    clearAuth();
    window.location.href = "index.html";
  });

  document.querySelectorAll("[data-section-link]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-section-link]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      showSection(btn.getAttribute("data-section-link"));
    });
  });

  document.getElementById("save-store")?.addEventListener("click", () => {
    const value = document.getElementById("merchant-store").value;
    state.storeId = value;
    setPreference("storeId", value);
    populateStoreInputs();
    showToast("Saved store ID", "success");
  });

  document.getElementById("go-products")?.addEventListener("click", () => {
    showSection("products");
  });
}

function showSection(section) {
  document.querySelectorAll(".merchant-section").forEach((panel) => {
    panel.hidden = panel.getAttribute("data-section") !== section;
  });
}

function wireForms() {
  document.getElementById("product-form")?.addEventListener("submit", createProduct);
  document.getElementById("detail-form")?.addEventListener("submit", createDetail);
  document.getElementById("detail-update-form")?.addEventListener("submit", updateDetail);
  document.getElementById("inventory-detail-form")?.addEventListener("submit", loadInventoryByDetail);
  document.getElementById("inventory-store-form")?.addEventListener("submit", loadInventoryByStore);
  document.getElementById("stock-form")?.addEventListener("submit", updateStock);
  document.getElementById("orders-store-form")?.addEventListener("submit", loadMerchantOrders);
  document.getElementById("order-status-form")?.addEventListener("submit", submitOrderStatus);
  document.getElementById("merchant-profile-form")?.addEventListener("submit", createMerchantProfile);
  document.getElementById("reload-products")?.addEventListener("click", loadProducts);
  document.getElementById("reload-inventory")?.addEventListener("click", loadInventoryByDetail);
  document.getElementById("reload-merchant-orders")?.addEventListener("click", loadMerchantOrders);
  document.getElementById("add-attribute-row")?.addEventListener("click", addAttributeRow);
  addAttributeRow(); // add initial attribute row
}

async function loadAttributes() {
  try {
    state.attributes = await apiRequest(API_CONFIG.endpoints.attributes);
    state.measures = await apiRequest(API_CONFIG.endpoints.measures);
  } catch (err) {
    showToast(`Attributes/measures unavailable: ${err.message}`, "error");
  }
}

async function createProduct(event) {
  event.preventDefault();
  const form = event.target;
  const fd = new FormData();
  fd.append("ProductName", form.ProductName.value);
  if (form.ProductDescription.value) fd.append("ProductDescription", form.ProductDescription.value);
  fd.append("TypeId", form.TypeId.value);
  fd.append("StoreId", form.StoreId.value);
  try {
    await apiRequest(API_CONFIG.endpoints.createProduct, { method: "POST", body: fd });
    showToast("Product created", "success");
    form.reset();
    populateStoreInputs();
    loadProducts();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadProducts() {
  const auth = getAuth();
  if (!auth?.userId) return;
  try {
    const data = await apiRequest(API_CONFIG.endpoints.productsByMerchant(auth.userId), {
      query: { page: 1, pageSize: 20 },
    });
    state.products = data?.items ?? [];
    renderProducts();
  } catch (err) {
    showToast(`Products error: ${err.message}`, "error");
  }
}

function renderProducts() {
  const list = document.getElementById("product-list");
  const empty = document.getElementById("product-empty");
  if (!list) return;
  list.innerHTML = "";
  if (!state.products.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  state.products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="section-header">
        <div>
          <div class="title">${p.productName || p.name || "Unnamed"}</div>
          <div class="meta">ID ${p.productId || p.id || "N/A"} · Type ${p.typeId ?? p.TypeId ?? "?"}</div>
        </div>
        <button class="btn btn-danger" data-delete="${p.productId || p.id}">Delete</button>
      </div>
      <p class="meta">${p.productDescription || p.description || ""}</p>
      <div class="controls">
        <button class="btn btn-ghost" data-fill-detail="${p.productId || p.id}">Use in detail form</button>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-delete")))
  );
  list.querySelectorAll("[data-fill-detail]").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.getElementById("detail-product").value = btn.getAttribute("data-fill-detail");
      showToast("Filled product ID into detail form");
      showSection("details");
      document.querySelector("[data-section-link='details']")?.classList.add("active");
    })
  );
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    await apiRequest(API_CONFIG.endpoints.productById(id), { method: "DELETE" });
    showToast("Product deleted", "success");
    loadProducts();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function collectAttributes(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .attribute-row`);
  const attrs = [];
  rows.forEach((row) => {
    const attributeId = row.querySelector("[name='attributeId']")?.value;
    const measureUnitId = row.querySelector("[name='measureUnitId']")?.value;
    if (attributeId && measureUnitId) {
      attrs.push({ attributeId: Number(attributeId), measureUnitId: Number(measureUnitId) });
    }
  });
  return attrs.length ? attrs : null;
}

function addAttributeRow() {
  const container = document.getElementById("detail-attributes");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "input-row attribute-row";
  row.innerHTML = `
    <div class="field">
      <label>Attribute ID</label>
      <input name="attributeId" type="number" min="1">
    </div>
    <div class="field">
      <label>Measure unit ID</label>
      <input name="measureUnitId" type="number" min="1">
    </div>
    <button class="btn btn-ghost" type="button" data-remove-row>Remove</button>
  `;
  row.querySelector("[data-remove-row]").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

async function createDetail(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    productId: Number(form.productId.value),
    serialNumber: form.serialNumber.value,
    price: Number(form.price.value),
    description: form.description.value || null,
    quantityAvailable: Number(form.quantityAvailable.value),
    attributes: collectAttributes("detail-attributes"),
  };
  try {
    await apiRequest(API_CONFIG.endpoints.createProductDetail, { method: "POST", body: payload });
    showToast("Product detail created", "success");
    form.reset();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function updateDetail(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    productDetailId: Number(form.productDetailId.value),
    price: form.price.value ? Number(form.price.value) : null,
    quantityAvailable: form.quantityAvailable.value ? Number(form.quantityAvailable.value) : null,
    description: form.description.value || null,
  };
  const attrs = collectAttributes("detail-attributes");
  if (attrs) payload.attributes = attrs;
  try {
    await apiRequest(API_CONFIG.endpoints.updateProductDetail, { method: "PUT", body: payload });
    showToast("Detail updated", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadInventoryByDetail(event) {
  if (event) event.preventDefault();
  const detailId = document.getElementById("inventory-detail-id")?.value;
  if (!detailId) return;
  try {
    const data = await apiRequest(API_CONFIG.endpoints.inventoryByDetail(detailId));
    renderInventory(data || []);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderInventory(items) {
  const list = document.getElementById("inventory-list");
  const empty = document.getElementById("inventory-empty");
  if (!list) return;
  list.innerHTML = "";
  if (!items || !items.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="title">Serial ${item.serialNumber || item.serial || "N/A"}</div>
      <div class="meta">Detail ${item.productDetailId || item.detailId || ""}</div>
      <div class="meta">Created ${item.createdAt || item.createdDate || ""}</div>
    `;
    list.appendChild(card);
  });
}

async function loadInventoryByStore(event) {
  event.preventDefault();
  const storeId = document.getElementById("inventory-store-id").value;
  const page = document.getElementById("inventory-store-page").value || 1;
  const pageSize = document.getElementById("inventory-store-size").value || 10;
  if (!storeId) return;
  try {
    const data = await apiRequest(API_CONFIG.endpoints.inventoryByStore(storeId), {
      query: { page, pageSize },
    });
    const items = data?.items ?? data ?? [];
    const list = document.getElementById("inventory-store-list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = `<div class="empty">No inventory for store ${storeId}</div>`;
    } else {
      items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="section-header">
            <div class="title">Detail ${item.productDetailId || item.detailId || ""}</div>
            <span class="badge">${item.stockQuantity ?? item.quantity ?? "?"} units</span>
          </div>
          <div class="meta">${item.serialNumber || ""}</div>
        `;
        list.appendChild(card);
      });
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function updateStock(event) {
  event.preventDefault();
  const detailId = document.getElementById("stock-detail-id").value;
  const qty = document.getElementById("stock-qty").value;
  if (!detailId || qty === "") return;
  try {
    await apiRequest(API_CONFIG.endpoints.updateStock(detailId), {
      method: "PUT",
      body: { newQuantity: Number(qty) },
    });
    showToast("Stock updated", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadMerchantOrders(event) {
  if (event) event.preventDefault();
  const storeId = document.getElementById("orders-store-id").value || state.storeId;
  const page = document.getElementById("orders-page").value || 1;
  const pageSize = document.getElementById("orders-size").value || 10;
  if (!storeId) {
    showToast("Store ID is required to load orders", "error");
    return;
  }
  try {
    const data = await apiRequest(API_CONFIG.endpoints.merchantOrders(storeId), {
      query: { page, pageSize },
    });
    const items = data?.items ?? [];
    renderMerchantOrders(items);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderMerchantOrders(items) {
  const list = document.getElementById("merchant-orders");
  const empty = document.getElementById("merchant-orders-empty");
  if (!list) return;
  list.innerHTML = "";
  if (!items.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  items.forEach((order) => {
    const id = order.orderId || order.id || "N/A";
    const status = order.status || order.orderStatus || "Unknown";
    const total = order.total || order.totalAmount || order.orderTotal || 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="section-header">
        <div>
          <div class="title">Order ${id}</div>
          <div class="meta">${order.createdAt || order.orderDate || ""}</div>
        </div>
        <span class="badge">${status}</span>
      </div>
      <div class="meta">Customer: ${order.customerName || order.customerEmail || "N/A"}</div>
      <div class="price">$${Number(total || 0).toFixed(2)}</div>
    `;
    list.appendChild(card);
  });
}

async function submitOrderStatus(event) {
  event.preventDefault();
  const orderId = document.getElementById("order-status-id").value;
  const status = document.getElementById("order-status-value").value;
  if (!orderId || !status) return;
  try {
    await apiRequest(API_CONFIG.endpoints.updateOrderStatus(orderId), {
      method: "PUT",
      body: { status },
    });
    showToast("Order status updated", "success");
    loadMerchantOrders();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function createMerchantProfile(event) {
  event.preventDefault();
  const name = document.getElementById("merchant-store-name").value;
  if (!name) return;
  try {
    const resp = await apiRequest(API_CONFIG.endpoints.createMerchantProfile, {
      method: "POST",
      body: { storeName: name },
    });
    const auth = setAuth(resp);
    hydrateProfile(auth);
    showToast("Merchant profile created/refreshed", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}
