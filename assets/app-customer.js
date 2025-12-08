import {
  API_CONFIG,
  apiRequest,
  setAuth,
  getAuth,
  clearAuth,
  showToast,
  formatMoney,
} from "./app-common.js";

const state = {
  categories: [],
  subCategories: [],
  products: [],
  filteredProducts: [],
  cart: loadCart(),
  pagination: { page: 1, pageSize: 12, totalPages: 1 },
  filters: { categoryId: null, subCategoryId: null, search: "" },
  orders: [],
};

document.addEventListener("DOMContentLoaded", () => {
  wireNavigation();
  wireModals();
  wireForms();
  renderCart();
  syncAuthUi();
  loadCategories();
  loadSubCategories();
});

function wireNavigation() {
  const cartToggle = document.getElementById("cart-toggle");
  const closeCart = document.getElementById("close-cart");
  const clearBtn = document.getElementById("clear-cart");
  const cartCheckout = document.getElementById("cart-checkout");
  const refreshBtn = document.getElementById("refresh-products");
  const reloadOrders = document.getElementById("reload-orders");
  const ctaLogin = document.getElementById("cta-login");
  const ctaMerchant = document.getElementById("cta-merchant");

  cartToggle?.addEventListener("click", () => toggleCart(true));
  closeCart?.addEventListener("click", () => toggleCart(false));
  clearBtn?.addEventListener("click", clearCart);
  cartCheckout?.addEventListener("click", () => {
    toggleCart(false);
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  });
  refreshBtn?.addEventListener("click", loadProducts);
  reloadOrders?.addEventListener("click", loadOrders);
  ctaLogin?.addEventListener("click", () => openModal("login-modal"));
  ctaMerchant?.addEventListener("click", () => {
    window.location.href = "merchant.html";
  });

  document
    .getElementById("login-btn")
    ?.addEventListener("click", () => openModal("login-modal"));
  document
    .getElementById("register-btn")
    ?.addEventListener("click", () => openModal("register-modal"));
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearAuth();
    syncAuthUi();
    showToast("Logged out");
  });

  document
    .getElementById("filter-category")
    ?.addEventListener("change", (e) => {
      state.filters.categoryId = e.target.value || null;
      state.filters.subCategoryId = null;
      loadProducts();
    });

  document
    .getElementById("filter-subcategory")
    ?.addEventListener("change", (e) => {
      state.filters.subCategoryId = e.target.value || null;
      loadProducts();
    });

  document.getElementById("search-input")?.addEventListener("input", (e) => {
    state.filters.search = e.target.value.toLowerCase();
    applyClientFilter();
  });
}

function wireModals() {
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () =>
      closeModal(btn.closest(".modal-backdrop")),
    );
  });
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (evt) => {
      if (evt.target === backdrop) closeModal(backdrop);
    });
  });
}

function wireForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const checkoutForm = document.getElementById("checkout-form");

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    try {
      const resp = await apiRequest(API_CONFIG.endpoints.login, {
        method: "POST",
        body: formData,
        auth: false,
      });
      setAuth(resp);
      syncAuthUi();
      closeModal(document.getElementById("login-modal"));
      showToast("Logged in", "success");
      loadOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    try {
      await apiRequest(API_CONFIG.endpoints.register, {
        method: "POST",
        body: formData,
        auth: false,
      });
      showToast("Account created. You can log in now.", "success");
      closeModal(document.getElementById("register-modal"));
      openModal("login-modal");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  checkoutForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const auth = getAuth();
    if (!auth?.token) {
      showToast("Please log in before placing an order.", "error");
      openModal("login-modal");
      return;
    }
    if (!state.cart.length) {
      showToast("Cart is empty.", "error");
      return;
    }
    const form = new FormData(checkoutForm);
    const storeId = Number(form.get("storeId"));
    const paymentTypeId = Number(form.get("paymentTypeId") || 1);
    const shipmentMethodId = Number(form.get("shipmentMethodId") || 1);
    const taxVal = form.get("tax");
    if (!storeId) {
      showToast("Store ID is required for checkout.", "error");
      return;
    }
    const orderItems = state.cart.map((item) => ({
      productDetailId: Number(item.productDetailId),
      quantity: item.quantity,
    }));
    if (orderItems.some((i) => !i.productDetailId)) {
      showToast("Every cart item needs a product detail ID.", "error");
      return;
    }
    const payload = {
      storeId,
      paymentTypeId,
      shipmentMethodId,
      orderItems,
    };
    if (taxVal) payload.tax = Number(taxVal);
    try {
      await apiRequest(API_CONFIG.endpoints.customerOrders, {
        method: "POST",
        body: payload,
      });
      clearCart();
      showToast("Order placed successfully", "success");
      loadOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

function openModal(id) {
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (el) el.classList.add("open");
}

function closeModal(el) {
  if (el) el.classList.remove("open");
}

function syncAuthUi() {
  const auth = getAuth();
  const loggedIn = Boolean(auth?.token);
  document.getElementById("login-btn").hidden = loggedIn;
  document.getElementById("register-btn").hidden = loggedIn;
  document.getElementById("logout-btn").hidden = !loggedIn;
  if (loggedIn) {
    loadOrders();
  } else {
    state.orders = [];
    renderOrders();
  }
}

async function loadCategories() {
  try {
    const data = await apiRequest(API_CONFIG.endpoints.categories, {
      auth: false,
      query: { page: 1, pageSize: 50 },
    });
    state.categories = data?.items || [];
    const select = document.getElementById("filter-category");
    if (select) {
      select.innerHTML =
        `<option value="">All categories</option>` +
        state.categories
          .map(
            (c) => `<option value="${c.categoryId}">${c.categoryName}</option>`,
          )
          .join("");
    }
  } catch (err) {
    showToast(`Categories error: ${err.message}`, "error");
  }
}

async function loadSubCategories() {
  try {
    const data = await apiRequest(API_CONFIG.endpoints.subCategories, {
      auth: false,
      query: { page: 1, pageSize: 100 },
    });
    state.subCategories = data || [];
    const select = document.getElementById("filter-subcategory");
    if (select) {
      select.innerHTML =
        `<option value="">All subcategories</option>` +
        state.subCategories
          .map(
            (s) =>
              `<option value="${s.subCategoryId}">${s.subCategoryName}</option>`,
          )
          .join("");
    }
  } catch (err) {
    showToast(`Subcategory error: ${err.message}`, "error");
  }
}

async function loadProducts() {
  const subtitle = document.getElementById("product-subtitle");
  if (!state.filters.categoryId && !state.filters.subCategoryId) {
    state.products = [];
    applyClientFilter();
    if (subtitle)
      subtitle.textContent =
        "Choose a category or subcategory to load products.";
    return;
  }
  try {
    const path = state.filters.subCategoryId
      ? API_CONFIG.endpoints.subCategoryProducts(state.filters.subCategoryId)
      : API_CONFIG.endpoints.categoryProducts(state.filters.categoryId);
    const data = await apiRequest(path, {
      auth: false,
      query: {
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
      },
    });
    const items = data?.items ?? [];
    state.products = items.map(normalizeProduct);
    state.pagination.totalPages = data?.totalPages || 1;
    applyClientFilter();
    if (subtitle)
      subtitle.textContent = `Loaded ${state.products.length} item(s) from the API.`;
  } catch (err) {
    showToast(`Products error: ${err.message}`, "error");
  }
}

function normalizeProduct(raw) {
  const details = Array.isArray(raw?.productDetails)
    ? raw.productDetails
    : raw?.details || raw?.variants || [];
  const firstDetail = details.length ? details[0] : null;
  const price =
    raw?.price ??
    raw?.unitPrice ??
    firstDetail?.price ??
    firstDetail?.priceValue ??
    raw?.productDetail?.price ??
    0;
  const productDetailId =
    firstDetail?.productDetailId ??
    firstDetail?.id ??
    raw?.productDetailId ??
    raw?.productDetail?.productDetailId;

  return {
    id: raw.productId ?? raw.id ?? raw.productID ?? raw?.product?.id,
    name: raw.productName ?? raw.name ?? "Untitled product",
    description: raw.productDescription ?? raw.description ?? "",
    price: Number(price || 0),
    image:
      raw.imageUrl ||
      raw.mainImageUrl ||
      raw.thumbnailUrl ||
      (Array.isArray(raw.imageUrls) ? raw.imageUrls[0] : "") ||
      "",
    details,
    productDetailId,
    storeId: raw.storeId ?? raw.storeID ?? firstDetail?.storeId,
    raw,
  };
}

function applyClientFilter() {
  const search = state.filters.search;
  state.filteredProducts = state.products.filter((p) =>
    !search
      ? true
      : p.name.toLowerCase().includes(search) ||
        (p.description || "").toLowerCase().includes(search),
  );
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("product-empty");
  if (!grid) return;
  grid.innerHTML = "";
  if (!state.filteredProducts.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  state.filteredProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card";
    const price = formatMoney(product.price || 0);
    const badgeText = product.storeId
      ? `Store ${product.storeId}`
      : "Store unknown";
    card.innerHTML = `
      <div class="chip-row">
        <span class="pill">${badgeText}</span>
        <span class="pill">ID: ${product.id || "N/A"}</span>
      </div>
      <div class="title">${product.name}</div>
      <p class="meta">${product.description || "No description provided."}</p>
      <div class="price">${price}</div>
      <div class="controls">
        <button class="btn btn-primary" data-add="${product.id}">Add to cart</button>
        <button class="btn btn-ghost" data-detail="${product.id}">Details</button>
      </div>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () =>
      addToCart(btn.getAttribute("data-add")),
    );
  });
  grid.querySelectorAll("[data-detail]").forEach((btn) => {
    btn.addEventListener("click", () =>
      showProductDetail(btn.getAttribute("data-detail")),
    );
  });
}

function showProductDetail(productId) {
  const product = state.products.find(
    (p) => String(p.id) === String(productId),
  );
  if (!product) return;
  const detailLines =
    Array.isArray(product.details) && product.details.length
      ? product.details
          .map(
            (d) =>
              `<div class="pill-input">Detail ${d.productDetailId ?? d.id ?? ""} · ${formatMoney(
                d.price ?? 0,
              )} · Qty ${d.quantityAvailable ?? d.quantity ?? "?"}</div>`,
          )
          .join("")
      : `<div class="pill-input">No variants returned from the API.</div>`;
  const modal = document.createElement("div");
  modal.className = "modal-backdrop open";
  modal.innerHTML = `
    <div class="modal">
      <div class="section-header">
        <div class="section-title">${product.name}</div>
        <button class="btn btn-ghost" data-close>Close</button>
      </div>
      <p class="meta">${product.description || "No description provided."}</p>
      <div class="stack">
        <div class="pill">Product ID: ${product.id ?? "N/A"}</div>
        <div class="pill">Detail ID: ${product.productDetailId ?? "N/A"}</div>
        <div class="chip-row">${detailLines}</div>
      </div>
      <div class="controls">
        <button class="btn btn-primary" data-add="${product.id}">Add to cart</button>
      </div>
    </div>
  `;
  modal.addEventListener("click", (evt) => {
    if (evt.target === modal || evt.target.dataset.close !== undefined)
      modal.remove();
  });
  modal.querySelector("[data-add]")?.addEventListener("click", () => {
    addToCart(product.id);
    modal.remove();
  });
  document.body.appendChild(modal);
}

function loadCart() {
  try {
    const raw = localStorage.getItem("cartify_cart");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read cart", err);
    return [];
  }
}

function saveCart() {
  localStorage.setItem("cartify_cart", JSON.stringify(state.cart));
  renderCart();
}

function addToCart(productId) {
  const product = state.products.find(
    (p) => String(p.id) === String(productId),
  );
  if (!product) return;
  let detailId = product.productDetailId;
  if (!detailId) {
    const input = prompt(
      "Product detail ID is required by the API. Enter the detail/variant ID:",
    );
    if (!input) return;
    detailId = input;
  }
  const existing = state.cart.find(
    (item) =>
      String(item.productDetailId) === String(detailId) &&
      String(item.productId) === String(product.id),
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      productDetailId: detailId,
      name: product.name,
      price: product.price || 0,
      quantity: 1,
    });
  }
  showToast("Added to cart", "success");
  saveCart();
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const countEl = document.getElementById("cart-count");
  const checkoutItems = document.getElementById("checkout-items");
  const checkoutTotal = document.getElementById("checkout-total");
  if (!container) return;
  container.innerHTML = "";
  if (!state.cart.length) {
    container.innerHTML = `<div class="empty">Your cart is empty.</div>`;
  } else {
    state.cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "card";
      row.innerHTML = `
        <div class="section-header">
          <div>
            <div class="title">${item.name}</div>
            <div class="meta">Product ID ${item.productId} · Detail ${item.productDetailId}</div>
          </div>
          <button class="btn btn-ghost" data-remove="${item.productDetailId}">Remove</button>
        </div>
        <div class="input-row">
          <div class="field">
            <label>Price</label>
            <div class="price">${formatMoney(item.price || 0)}</div>
          </div>
          <div class="field">
            <label>Quantity</label>
            <div class="controls">
              <button class="btn btn-ghost" data-down="${item.productDetailId}">-</button>
              <div class="pill">${item.quantity}</div>
              <button class="btn btn-ghost" data-up="${item.productDetailId}">+</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(row);
    });
    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () =>
        removeCartItem(btn.getAttribute("data-remove")),
      );
    });
    container.querySelectorAll("[data-up]").forEach((btn) => {
      btn.addEventListener("click", () =>
        adjustQuantity(btn.getAttribute("data-up"), 1),
      );
    });
    container.querySelectorAll("[data-down]").forEach((btn) => {
      btn.addEventListener("click", () =>
        adjustQuantity(btn.getAttribute("data-down"), -1),
      );
    });
  }
  const total = state.cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0,
  );
  if (totalEl) totalEl.textContent = formatMoney(total);
  if (countEl) countEl.textContent = state.cart.length;
  if (checkoutItems) checkoutItems.textContent = state.cart.length;
  if (checkoutTotal) checkoutTotal.textContent = formatMoney(total);
}

function adjustQuantity(productDetailId, delta) {
  const item = state.cart.find(
    (c) => String(c.productDetailId) === String(productDetailId),
  );
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeCartItem(productDetailId);
    return;
  }
  saveCart();
}

function removeCartItem(productDetailId) {
  state.cart = state.cart.filter(
    (c) => String(c.productDetailId) !== String(productDetailId),
  );
  saveCart();
}

function clearCart() {
  state.cart = [];
  saveCart();
}

function toggleCart(open) {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;
  drawer.classList[open ? "add" : "remove"]("open");
}

async function loadOrders() {
  const auth = getAuth();
  if (!auth?.token) {
    state.orders = [];
    renderOrders();
    return;
  }
  try {
    const data = await apiRequest(API_CONFIG.endpoints.customerOrders, {
      query: { page: 1, pageSize: 20 },
    });
    state.orders = data?.items ?? [];
    renderOrders();
  } catch (err) {
    showToast(`Orders error: ${err.message}`, "error");
  }
}

function renderOrders() {
  const list = document.getElementById("orders-list");
  const empty = document.getElementById("orders-empty");
  if (!list) return;
  list.innerHTML = "";
  if (!state.orders.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  state.orders.forEach((order) => {
    const id = order.orderId || order.id || order.referenceNumber || "N/A";
    const status =
      order.status || order.orderStatus || order.currentStatus || "Unknown";
    const total =
      order.total ||
      order.totalAmount ||
      order.orderTotal ||
      (order.items || order.orderItems || []).reduce(
        (sum, i) => sum + (i.price || i.unitPrice || 0) * (i.quantity || 1),
        0,
      );
    const created =
      order.createdAt || order.orderDate || order.dateCreated || "";
    const items = order.items || order.orderItems || [];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="section-header">
        <div>
          <div class="title">Order ${id}</div>
          <div class="meta">${created}</div>
        </div>
        <span class="badge ${status.toLowerCase().includes("ship") ? "info" : ""}">${status}</span>
      </div>
      <div class="meta">Items: ${items.length}</div>
      <div class="price">${formatMoney(total)}</div>
      <div class="controls">
        <button class="btn btn-ghost" data-track="${id}">Track</button>
        <button class="btn btn-danger" data-cancel="${id}">Cancel</button>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () =>
      cancelOrder(btn.getAttribute("data-cancel")),
    );
  });
  list.querySelectorAll("[data-track]").forEach((btn) => {
    btn.addEventListener("click", () =>
      trackOrder(btn.getAttribute("data-track")),
    );
  });
}

async function cancelOrder(orderId) {
  try {
    await apiRequest(API_CONFIG.endpoints.cancelCustomerOrder(orderId), {
      method: "PUT",
    });
    showToast(`Order ${orderId} cancelled`, "success");
    loadOrders();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function trackOrder(orderId) {
  try {
    const data = await apiRequest(API_CONFIG.endpoints.orderTracking(orderId), {
      method: "GET",
    });
    const status = data?.status || data?.orderStatus || JSON.stringify(data);
    showToast(`Tracking ${orderId}: ${status}`, "info");
  } catch (err) {
    showToast(err.message, "error");
  }
}
