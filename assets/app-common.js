export const API_CONFIG = {
  baseUrl: "https://cartify.runasp.net",
  endpoints: {
    login: "/api/Users/Login",
    register: "/api/Users/Register",
    refreshToken: "/api/Users/RefreshToken",
    createMerchantProfile: "/api/Users/CreateMerchantProfile",
    profile: (userId) => `/api/Profile/${userId}`,
    categories: "/api/Category",
    subCategories: "/api/Category/subcategory",
    categoryProducts: (categoryId) => `/api/Category/${categoryId}/products`,
    subCategoryProducts: (subCategoryId) => `/api/Category/subcategory/${subCategoryId}/products`,
    productSearch: "/api/merchant/products/search",
    productById: (productId) => `/api/merchant/products/${productId}`,
    productsByMerchant: (merchantId) => `/api/merchant/products/merchant/${merchantId}`,
    createProduct: "/api/merchant/products",
    productDetails: (productDetailId) => `/api/merchant/products/details/${productDetailId}`,
    createProductDetail: "/api/merchant/products/details",
    updateProductDetail: "/api/merchant/products/details",
    attributes: "/api/merchant/attributes-measures/attributes",
    measures: "/api/merchant/attributes-measures/measures",
    inventoryByDetail: (productDetailId) => `/api/merchant/inventory/product-detail/${productDetailId}`,
    updateStock: (productDetailId) => `/api/merchant/inventory/product-detail/${productDetailId}/stock`,
    inventoryByStore: (storeId) => `/api/merchant/inventory/store/${storeId}`,
    lowStock: (storeId) => `/api/merchant/inventory/store/${storeId}/low-stock`,
    customerOrders: "/api/customer/orders",
    customerOrder: (orderId) => `/api/customer/orders/${orderId}`,
    cancelCustomerOrder: (orderId) => `/api/customer/orders/${orderId}/cancel`,
    checkout: "/api/Checkout",
    orderTracking: (orderId) => `/api/Orderstracking/${orderId}`,
    orderTrackingByUser: (userId) => `/api/Orderstracking/user/${userId}`,
    merchantOrders: (storeId) => `/api/merchant/orders/store/${storeId}`,
    merchantOrder: (orderId) => `/api/merchant/orders/${orderId}`,
    updateOrderStatus: (orderId) => `/api/merchant/orders/${orderId}/status`,
    wishlist: (userId) => `/api/Wishlist/GetWishlist/${userId}`,
    wishlistAdd: "/api/Wishlist/Add",
    wishlistRemove: (itemId) => `/api/Wishlist/Remove/${itemId}`,
    wishlistClear: (userId) => `/api/Wishlist/Clear/${userId}`,
  },
};

const STORAGE_KEYS = {
  auth: "cartify_auth",
  cart: "cartify_cart",
  preferences: "cartify_preferences",
};

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");
    const json = atob(payload);
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode JWT", err);
    return null;
  }
}

function extractRoles(payload) {
  if (!payload) return [];
  const raw =
    payload.role ||
    payload.roles ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/roles"];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw].filter(Boolean);
}

export function getAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.auth);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error("Unable to read auth", err);
    return null;
  }
}

export function setAuth(authResponse = {}) {
  const token = authResponse.jwt || authResponse.token || authResponse.accessToken;
  if (!token) throw new Error("Missing token in auth response");
  const payload = decodeJwt(token);
  const auth = {
    token,
    jwtExpiry: authResponse.jwtExpiry || authResponse.expiresAt || null,
    email: payload?.email,
    userId: payload?.sub,
    roles: extractRoles(payload),
  };
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(auth));
  return auth;
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

function buildUrl(path, query) {
  let url = path.startsWith("http") ? path : `${API_CONFIG.baseUrl}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.append(key, value);
    });
    const qs = params.toString();
    if (qs) url += url.includes("?") ? `&${qs}` : `?${qs}`;
  }
  return url;
}

function extractError(data, status) {
  if (!data) return `Request failed (${status || "unknown"})`;
  if (typeof data === "string") return data;
  if (data.errors) {
    const combined = Object.values(data.errors)
      .flat()
      .join(" ");
    if (combined) return combined;
  }
  return data.message || data.title || `Request failed (${status || "unknown"})`;
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    headers = {},
    query,
    redirectOn401 = true,
  } = options;

  const isForm = body instanceof FormData;
  const url = buildUrl(path, query);
  const reqHeaders = new Headers(headers);

  if (!isForm && body !== undefined) {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (auth !== false) {
    const token = getAuth()?.token;
    if (token) reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let parsed = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (response.status === 401) {
    clearAuth();
    if (redirectOn401) window.location.href = "index.html#login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(extractError(parsed, response.status));
  }

  return parsed;
}

export function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

export function setPreference(key, value) {
  const prefs = getPreference();
  prefs[key] = value;
  localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(prefs));
  return prefs;
}

export function getPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.preferences);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error("Unable to read preferences", err);
    return {};
  }
}

export function hasRole(role) {
  const auth = getAuth();
  if (!auth || !auth.roles) return false;
  return auth.roles.includes(role);
}
