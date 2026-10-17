// SUPERSCIENCE - Authentication & Session Management Module
// Client-side session handler for Athletes (Users) & Seller (Admin)

import { API } from "./api.js";

const AUTH_KEYS = {
  USER_TOKEN: "superscience_user_token",
  USER_DATA: "superscience_user",
  ADMIN_TOKEN: "superscience_admin_token",
  ADMIN_DATA: "superscience_admin"
};

export const Auth = {
  // State cache
  _user: null,
  _userToken: null,
  _admin: null,
  _adminToken: null,

  init() {
    try {
      this._userToken = localStorage.getItem(AUTH_KEYS.USER_TOKEN);
      const savedUser = localStorage.getItem(AUTH_KEYS.USER_DATA);
      if (savedUser) this._user = JSON.parse(savedUser);

      this._adminToken = localStorage.getItem(AUTH_KEYS.ADMIN_TOKEN);
      const savedAdmin = localStorage.getItem(AUTH_KEYS.ADMIN_DATA);
      if (savedAdmin) this._admin = JSON.parse(savedAdmin);
    } catch (e) {
      console.error("[Auth] Storage load error:", e);
    }

    // Immediately toggle seller-mode class on html & body
    const isSeller = this.isSellerMode();
    if (typeof document !== "undefined") {
      if (document.documentElement) document.documentElement.classList.toggle("seller-mode-active", isSeller);
      if (document.body) document.body.classList.toggle("seller-mode-active", isSeller);
    }

    this.ensureAuthModalRendered();
    this.updateNavigationHeaderAuth();
    this.syncSellerVisibility();

    // Validate sessions in background
    if (this._userToken) {
      this.validateUserSession();
    }
  },

  getUser() {
    return this._user;
  },

  getUserToken() {
    return this._userToken;
  },

  isUserLoggedIn() {
    return Boolean(this._userToken && this._user);
  },

  getAdmin() {
    return this._admin;
  },

  getAdminToken() {
    return this._adminToken;
  },

  isAdminLoggedIn() {
    return Boolean(this._adminToken && this._admin && this._admin.role === "admin");
  },

  isSellerOrAdmin() {
    // 1. If currently logged in as a standard athlete/buyer, they are strictly NOT seller/admin
    if (this._user && this._user.role === "user") {
      return false;
    }

    // 2. Active seller preview session explicitly initiated via "VIEW STORE ↗" button
    if (this.isSellerMode()) return true;

    // 3. User account is admin or seller
    if (this._user && (this._user.role === "admin" || this._user.role === "seller")) {
      return true;
    }

    // 4. Authenticated admin session (only when not actively acting as a normal buyer)
    if (this.isAdminLoggedIn()) {
      return true;
    }

    return false;
  },

  syncSellerVisibility() {
    const isSeller = this.isSellerOrAdmin();
    if (typeof document !== "undefined") {
      if (document.documentElement) {
        document.documentElement.classList.toggle("is-seller-or-admin", isSeller);
      }
      if (document.body) {
        document.body.classList.toggle("is-seller-or-admin", isSeller);
      }

      const sellerSelectors = [
        ".seller-only",
        ".seller-only-element",
        "[data-seller-only='true']",
        "#nav-seller-dashboard",
        "#nav-seller-dashboard-link",
        "#mobile-nav-seller-link",
        "#hero-seller-badge",
        "#card-seller-dashboard-wrapper"
      ].join(", ");

      document.querySelectorAll(sellerSelectors).forEach(el => {
        if (!isSeller) {
          el.style.setProperty("display", "none", "important");
        } else {
          el.style.removeProperty("display");
          if (el.tagName === "LI" && el.classList.contains("nav-item")) {
            el.style.setProperty("display", "block", "important");
          } else if (el.tagName === "LI") {
            el.style.setProperty("display", "list-item", "important");
          } else if (el.classList.contains("list-group-item")) {
            el.style.setProperty("display", "flex", "important");
          } else if (el.classList.contains("badge")) {
            el.style.setProperty("display", "inline-block", "important");
          }
        }
      });
    }
  },

  setUser(user, token) {
    this._user = user;
    this._userToken = token;
    localStorage.setItem(AUTH_KEYS.USER_TOKEN, token);
    localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user));
    this.updateNavigationHeaderAuth();
    this.syncSellerVisibility();
    this.notifyAuthChanged("user-login", user);
  },

  clearUser() {
    this._user = null;
    this._userToken = null;
    localStorage.removeItem(AUTH_KEYS.USER_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER_DATA);
    this.updateNavigationHeaderAuth();
    this.syncSellerVisibility();
    this.notifyAuthChanged("user-logout", null);
  },

  isSellerMode() {
    if (typeof window === "undefined") return false;

    // Check if seller mode was explicitly exited in current session
    if (sessionStorage.getItem("superscience_seller_mode_disabled") === "true") {
      return false;
    }

    // 1. Explicit URL parameter (e.g. from Admin Dashboard "VIEW STORE ↗" button)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("seller_view") === "1" || urlParams.get("mode") === "seller") {
      sessionStorage.setItem("superscience_seller_mode", "true");
      return true;
    }

    // 2. Active seller preview session explicitly initiated via "VIEW STORE ↗" button
    if (sessionStorage.getItem("superscience_seller_mode") === "true") {
      return true;
    }

    // Standard storefront visits should always remain in normal buyer mode
    return false;
  },

  exitSellerMode() {
    sessionStorage.removeItem("superscience_seller_mode");
    sessionStorage.setItem("superscience_seller_mode_disabled", "true");
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.delete("seller_view");
      url.searchParams.delete("mode");
      window.history.replaceState({}, "", url);
      window.location.reload();
    }
  },

  setAdmin(admin, token) {
    this._admin = admin;
    this._adminToken = token;
    localStorage.setItem(AUTH_KEYS.ADMIN_TOKEN, token);
    localStorage.setItem(AUTH_KEYS.ADMIN_DATA, JSON.stringify(admin));
    this.syncSellerVisibility();
    this.notifyAuthChanged("admin-login", admin);
  },

  clearAdmin() {
    this._admin = null;
    this._adminToken = null;
    localStorage.removeItem(AUTH_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(AUTH_KEYS.ADMIN_DATA);
    sessionStorage.removeItem("superscience_seller_mode");
    sessionStorage.removeItem("superscience_seller_mode_disabled");
    if (typeof document !== "undefined") {
      if (document.documentElement) document.documentElement.classList.remove("seller-mode-active");
      if (document.body) document.body.classList.remove("seller-mode-active");
    }
    this.syncSellerVisibility();
    this.notifyAuthChanged("admin-logout", null);
  },

  // API Actions
  async loginUser(email, password) {
    const res = await API.login(email, password);
    if (res.success && res.token && res.user) {
      this.setUser(res.user, res.token);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Authentication failed" };
  },

  async registerUser(name, email, password, fitPreference = "Oversized Boxy") {
    const res = await API.register({ name, email, password, fit_preference: fitPreference });
    if (res.success && res.token && res.user) {
      this.setUser(res.user, res.token);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Registration failed" };
  },

  async logoutUser() {
    const token = this._userToken;
    this.clearUser();
    if (token) {
      try {
        await API.logout(token);
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast("Signed out of athlete session.");
    }
  },

  async loginAdmin(email, password) {
    const res = await API.adminLogin(email, password);
    if (res.success && res.token && res.admin) {
      this.setAdmin(res.admin, res.token);
      return { success: true, admin: res.admin };
    }
    return { success: false, error: res.error || "Seller authorization failed" };
  },

  async logoutAdmin() {
    const token = this._adminToken;
    this.clearAdmin();
    if (token) {
      try {
        await API.logout(token);
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast("Signed out of seller console.");
    }
  },

  async changeAdminPassword(currentPassword, newPassword) {
    const token = this._adminToken;
    if (!token) {
      return { success: false, error: "No active seller session found. Please sign in." };
    }
    return await API.changePassword(currentPassword, newPassword, token);
  },

  async changeUserPassword(currentPassword, newPassword) {
    const token = this._userToken;
    if (!token) {
      return { success: false, error: "No active user session found. Please sign in." };
    }
    return await API.changePassword(currentPassword, newPassword, token);
  },


  async validateUserSession() {
    if (!this._userToken) return false;
    try {
      const res = await API.getMe(this._userToken);
      if (res.success && res.user) {
        this._user = res.user;
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(res.user));
        this.updateNavigationHeaderAuth();
        return true;
      } else {
        this.clearUser();
        return false;
      }
    } catch (e) {
      return true; // network hiccup, retain cached user offline
    }
  },

  async validateAdminSession() {
    if (!this._adminToken) return false;
    try {
      const res = await API.getMe(this._adminToken);
      if (res.success && res.user && res.user.role === "admin") {
        this._admin = res.user;
        localStorage.setItem(AUTH_KEYS.ADMIN_DATA, JSON.stringify(res.user));
        return true;
      } else {
        this.clearAdmin();
        return false;
      }
    } catch (e) {
      return true;
    }
  },

  notifyAuthChanged(action, payload) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("superscience:auth-updated", {
        detail: { action, payload, auth: this }
      }));
    }
  },

  // Update header dropdown across storefront pages
  updateNavigationHeaderAuth() {
    const dropdown = document.querySelector(".profile-nav-dropdown");
    if (!dropdown) return;

    const user = this.getUser();
    const isLogged = this.isUserLoggedIn();

    const menuEl = dropdown.querySelector(".profile-dropdown-menu");
    if (!menuEl) return;

    if (this.isSellerMode()) {
      const admin = this.getAdmin();
      menuEl.innerHTML = `
        <li class="px-3 py-2 bg-light border-bottom border-warning">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-warning text-dark font-mono rounded-0 fw-bold" style="font-size:0.6rem;">SELLER</span>
            <span class="badge bg-dark text-white font-mono rounded-0" style="font-size:0.6rem;">PREVIEW</span>
          </div>
          <div class="fw-bold font-brand text-dark fs-6 lh-1 mb-1">${escapeHtml(admin ? admin.name : "Seller Console")}</div>
          <div class="font-mono text-muted text-truncate" style="font-size:0.72rem;">${escapeHtml(admin ? admin.email : "seller@superscience.test")}</div>
          <div class="font-mono text-danger small mt-1" style="font-size:0.65rem;">• Buyer actions (Bag, Checkout) disabled</div>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="admin.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span class="fw-bold">Return to Admin Dashboard</span>
            <span class="badge bg-dark text-white rounded-0 ms-auto font-mono" style="font-size:0.6rem;">ADMIN</span>
          </a>
        </li>
        <li>
          <button class="dropdown-item font-mono py-2 d-flex align-items-center gap-2 small" id="header-btn-exit-seller">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <span>Exit Seller Preview</span>
          </button>
        </li>
        <li><hr class="dropdown-divider my-1"></li>
        <li>
          <button class="dropdown-item font-mono py-2 d-flex align-items-center gap-2 small text-danger" id="header-btn-logout-seller">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign Out of Seller Console</span>
          </button>
        </li>
      `;

      menuEl.querySelector("#header-btn-exit-seller")?.addEventListener("click", () => this.exitSellerMode());
      menuEl.querySelector("#header-btn-logout-seller")?.addEventListener("click", () => this.logoutAdmin());
      return;
    }

    if (isLogged && user) {
      // User is logged in
      menuEl.innerHTML = `
        <li class="px-3 py-2 bg-light border-bottom">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-black text-white font-mono rounded-0" style="font-size:0.6rem;">${user.tier || "TIER 01"}</span>
            <span class="font-mono text-muted" style="font-size:0.68rem;">ID: ${user.athleteId || "SS-ATH-0000"}</span>
          </div>
          <div class="fw-bold font-brand text-dark fs-6 lh-1 mb-1">${escapeHtml(user.name)}</div>
          <div class="font-mono text-muted text-truncate" style="font-size:0.72rem;">${escapeHtml(user.email)}</div>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="profile.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Full Athlete Profile</span>
            <span class="badge bg-dark text-white rounded-0 ms-auto font-mono" style="font-size:0.6rem;">MAIN</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="profile.html#orders">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>Orders & Tracking</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="profile.html#sizing">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Size Calculator</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="profile.html#wishlist">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>Saved Items</span>
          </a>
        </li>
        <li>
          <button class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" id="header-btn-open-chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Customer Support Chat</span>
            <span class="badge bg-success text-white rounded-0 ms-auto font-mono" style="font-size:0.6rem;">LIVE</span>
          </button>
        </li>
        ${this.isSellerOrAdmin() ? `
        <li><hr class="dropdown-divider my-1"></li>
        <li class="seller-only">
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2 small" href="admin.html">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span>Seller Dashboard</span>
            <span class="badge bg-dark text-white rounded-0 ms-auto font-mono" style="font-size:0.6rem;">SELLER</span>
          </a>
        </li>
        ` : ""}
        <li><hr class="dropdown-divider my-1"></li>
        <li>
          <button class="dropdown-item font-mono py-2 d-flex align-items-center gap-2 small text-danger" id="header-btn-logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign Out (${escapeHtml(user.name.split(" ")[0])})</span>
          </button>
        </li>
      `;

      const openChatBtn = menuEl.querySelector("#header-btn-open-chat");
      if (openChatBtn) {
        openChatBtn.addEventListener("click", () => {
          if (window.openConciergeChat) {
            window.openConciergeChat();
          }
        });
      }

      const logoutBtn = menuEl.querySelector("#header-btn-logout");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => this.logoutUser());
      }

    } else {
      // User is logged out
      menuEl.innerHTML = `
        <li class="px-3 py-3 bg-light border-bottom">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="font-mono text-muted small" style="font-size:0.68rem; letter-spacing: 0.05em;">ACCOUNT PORTAL</span>
            <span class="badge bg-secondary font-mono rounded-0" style="font-size:0.58rem;">GUEST</span>
          </div>

          <!-- 1. USER / ATHLETE LOGIN -->
          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="font-mono text-dark fw-bold" style="font-size:0.75rem;">ATHLETE / USER LOGIN</span>
              <span class="badge bg-light text-dark border font-mono rounded-0" style="font-size:0.58rem;">BUYER</span>
            </div>
            <button class="btn btn-ss-dark w-100 rounded-0 font-mono py-2 small d-flex align-items-center justify-content-center gap-2" id="header-btn-open-login">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>SIGN IN / REGISTER &rarr;</span>
            </button>
          </div>

          <!-- 2. SELLER / ADMIN LOGIN -->
          <div class="pt-2 border-top">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="font-mono text-dark fw-bold" style="font-size:0.75rem;">SELLER / ADMIN LOGIN</span>
              <span class="badge bg-dark text-white rounded-0 font-mono" style="font-size:0.58rem;">SELLER</span>
            </div>
            <a href="admin.html" class="btn btn-outline-dark w-100 rounded-0 font-mono py-2 small d-flex align-items-center justify-content-center gap-2 text-decoration-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <span>SELLER CONSOLE LOGIN &rarr;</span>
            </a>
          </div>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="catalog.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Browse Collection</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item font-mono py-2 d-flex align-items-center gap-2" href="programs.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Workout Protocols</span>
          </a>
        </li>
      `;

      const openLoginBtn = menuEl.querySelector("#header-btn-open-login");
      if (openLoginBtn) {
        openLoginBtn.addEventListener("click", () => {
          // Close dropdown and open auth modal
          const inst = bootstrap.Dropdown.getInstance(dropdown.querySelector("#profileDropdownBtn"));
          if (inst) inst.hide();
          this.openAuthModal("login");
        });
      }
    }
  },

  // Open modal for login or registration
  openAuthModal(initialTab = "login") {
    this.ensureAuthModalRendered();
    const modalEl = document.getElementById("superscienceAuthModal");
    if (!modalEl) return;

    // Switch tab
    if (initialTab === "register") {
      const regTabBtn = document.getElementById("auth-tab-register-btn");
      if (regTabBtn) {
        const tab = new bootstrap.Tab(regTabBtn);
        tab.show();
      }
    } else {
      const loginTabBtn = document.getElementById("auth-tab-login-btn");
      if (loginTabBtn) {
        const tab = new bootstrap.Tab(loginTabBtn);
        tab.show();
      }
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },

  // Ensure universal modal exists in DOM
  ensureAuthModalRendered() {
    if (document.getElementById("superscienceAuthModal")) return;

    const modalHtml = `
      <div class="modal fade" id="superscienceAuthModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-0 border-dark shadow-lg" style="border-width: 2px;">
            <!-- Modal Header -->
            <div class="modal-header bg-black text-white rounded-0 py-3 px-4 border-0">
              <div class="d-flex align-items-center gap-2">
                <span class="font-brand fs-5 fw-bold text-uppercase" style="letter-spacing: -0.02em;">SUPERSCIENCE</span>
                <span class="text-white-50 font-mono small">•</span>
                <span class="font-mono small text-white-50 text-uppercase" style="font-size: 0.72rem;">MEMBER PORTAL</span>
              </div>
              <button type="button" class="btn-close btn-close-white rounded-0" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <!-- Tab Switcher -->
            <ul class="nav nav-tabs border-bottom rounded-0 bg-light" id="authModalTabs" role="tablist">
              <li class="nav-item flex-fill text-center" role="presentation">
                <button class="nav-link active rounded-0 font-mono small py-3 w-100 text-dark fw-bold border-0 border-bottom border-dark border-2" id="auth-tab-login-btn" data-bs-toggle="tab" data-bs-target="#auth-tab-login" type="button" role="tab">
                  01 // SIGN IN
                </button>
              </li>
              <li class="nav-item flex-fill text-center" role="presentation">
                <button class="nav-link rounded-0 font-mono small py-3 w-100 text-muted fw-bold border-0" id="auth-tab-register-btn" data-bs-toggle="tab" data-bs-target="#auth-tab-register" type="button" role="tab">
                  02 // CREATE ACCOUNT
                </button>
              </li>
            </ul>

            <div class="modal-body p-4 bg-white">
              <div class="tab-content" id="authModalTabContent">
                <!-- TAB 1: LOGIN -->
                <div class="tab-pane fade show active" id="auth-tab-login" role="tabpanel">
                  <form id="form-athlete-login" novalidate>
                    <div id="auth-login-alert" class="alert alert-danger font-mono small rounded-0 py-2 d-none mb-3"></div>

                    <div class="mb-3">
                      <label class="font-mono small text-muted text-uppercase mb-1" style="font-size:0.72rem;">EMAIL ADDRESS</label>
                      <input type="email" class="form-control rounded-0 font-mono" id="login-input-email" placeholder="lifter@superscience.test" required autocomplete="email">
                    </div>

                    <div class="mb-3">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="font-mono small text-muted text-uppercase" style="font-size:0.72rem;">PASSWORD</label>
                        <a href="#" class="font-mono text-muted text-decoration-none" style="font-size:0.68rem;" onclick="event.preventDefault(); window.showToast('Demo Mode: Default athlete password is password123')">Forgot Password?</a>
                      </div>
                      <input type="password" class="form-control rounded-0 font-mono" id="login-input-password" placeholder="••••••••" required autocomplete="current-password">
                    </div>

                    <div class="mb-4 d-flex justify-content-between align-items-center">
                      <div class="form-check">
                        <input class="form-check-input rounded-0" type="checkbox" id="login-remember-me" checked>
                        <label class="form-check-label font-mono text-muted small" for="login-remember-me" style="font-size:0.72rem;">
                          Keep active session
                        </label>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-dark rounded-0 font-mono" style="font-size:0.65rem;" id="btn-quick-fill-athlete">
                        ⚡ Quick Fill Demo
                      </button>
                    </div>

                    <button type="submit" class="btn btn-ss-dark w-100 py-3 rounded-0 font-brand fw-bold mb-3" id="btn-submit-login">
                      SIGN IN
                    </button>
                  </form>
                </div>

                <!-- TAB 2: REGISTER -->
                <div class="tab-pane fade" id="auth-tab-register" role="tabpanel">
                  <form id="form-athlete-register" novalidate>
                    <div id="auth-register-alert" class="alert alert-danger font-mono small rounded-0 py-2 d-none mb-3"></div>

                    <div class="mb-3">
                      <label class="font-mono small text-muted text-uppercase mb-1" style="font-size:0.72rem;">FULL NAME</label>
                      <input type="text" class="form-control rounded-0 font-mono" id="reg-input-name" placeholder="Marcus Vance" required>
                    </div>

                    <div class="mb-3">
                      <label class="font-mono small text-muted text-uppercase mb-1" style="font-size:0.72rem;">EMAIL ADDRESS</label>
                      <input type="email" class="form-control rounded-0 font-mono" id="reg-input-email" placeholder="athlete@superscience.test" required autocomplete="email">
                    </div>

                    <div class="row g-2 mb-3">
                      <div class="col-6">
                        <label class="font-mono small text-muted text-uppercase mb-1" style="font-size:0.72rem;">PASSWORD</label>
                        <input type="password" class="form-control rounded-0 font-mono" id="reg-input-password" placeholder="Min. 6 chars" required autocomplete="new-password">
                      </div>
                      <div class="col-6">
                        <label class="font-mono small text-muted text-uppercase mb-1" style="font-size:0.72rem;">FIT PREFERENCE</label>
                        <select class="form-select rounded-0 font-mono small" id="reg-input-fit">
                          <option value="Oversized Boxy" selected>Oversized Boxy (Recommended)</option>
                          <option value="Relaxed French Terry">Relaxed Drape</option>
                          <option value="Standard Natural">Standard Athletic</option>
                        </select>
                      </div>
                    </div>

                    <div class="p-2 border bg-light font-mono text-muted mb-4" style="font-size:0.68rem;">
                      By registering, your account receives free access to workout plans, saved sizing preferences, and order tracking.
                    </div>

                    <button type="submit" class="btn btn-ss-dark w-100 py-3 rounded-0 font-brand fw-bold mb-3" id="btn-submit-register">
                      CREATE ACCOUNT
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Modal Footer Link to Seller Portal -->
            <div class="modal-footer bg-light border-top p-3 d-flex justify-content-between align-items-center">
              <div>
                <span class="font-mono text-dark fw-bold small d-block" style="font-size:0.75rem;">STORE MERCHANT OR ADMIN?</span>
                <span class="font-mono text-muted" style="font-size:0.68rem;">Access catalog, live orders & merchant tools</span>
              </div>
              <a href="admin.html" class="btn btn-sm btn-outline-dark rounded-0 font-mono fw-bold px-3 py-2 text-decoration-none" style="font-size:0.72rem;">
                SELLER LOGIN &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    this.setupAuthModalEvents();
  },

  setupAuthModalEvents() {
    const modalEl = document.getElementById("superscienceAuthModal");
    if (!modalEl) return;

    // Tab button styling sync
    const tabBtns = modalEl.querySelectorAll("#authModalTabs button");
    tabBtns.forEach(btn => {
      btn.addEventListener("shown.bs.tab", () => {
        tabBtns.forEach(b => {
          b.classList.remove("text-dark", "border-bottom", "border-dark", "border-2");
          b.classList.add("text-muted");
        });
        btn.classList.remove("text-muted");
        btn.classList.add("text-dark", "border-bottom", "border-dark", "border-2");
      });
    });

    // Quick fill demo button
    const quickFillBtn = document.getElementById("btn-quick-fill-athlete");
    if (quickFillBtn) {
      quickFillBtn.addEventListener("click", () => {
        const emailInput = document.getElementById("login-input-email");
        const passInput = document.getElementById("login-input-password");
        if (emailInput && passInput) {
          emailInput.value = "lifter@superscience.test";
          passInput.value = "password123";
          if (window.showToast) window.showToast("Filled demo athlete credentials.");
        }
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById("form-athlete-login");
    const loginAlert = document.getElementById("auth-login-alert");
    const loginBtn = document.getElementById("btn-submit-login");

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginAlert.classList.add("d-none");
        loginAlert.textContent = "";

        const email = document.getElementById("login-input-email")?.value.trim();
        const password = document.getElementById("login-input-password")?.value;

        if (!email || !password) {
          loginAlert.textContent = "Please provide both email and password.";
          loginAlert.classList.remove("d-none");
          return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "AUTHENTICATING...";

        const res = await this.loginUser(email, password);
        loginBtn.disabled = false;
        loginBtn.textContent = "AUTHENTICATE & ENTER VAULT";

        if (res.success) {
          const inst = bootstrap.Modal.getInstance(modalEl);
          if (inst) inst.hide();

          if (window.showToast) {
            window.showToast(`Authenticated as ${res.user.name}. Welcome back.`);
          }

          // If currently on profile.html, reload data
          if (window.location.pathname.includes("profile.html") && typeof window.loadAthleteProfileData === "function") {
            window.loadAthleteProfileData();
          }
        } else {
          loginAlert.textContent = res.error || "Invalid email or password.";
          loginAlert.classList.remove("d-none");
        }
      });
    }

    // Register Form Submit
    const regForm = document.getElementById("form-athlete-register");
    const regAlert = document.getElementById("auth-register-alert");
    const regBtn = document.getElementById("btn-submit-register");

    if (regForm) {
      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        regAlert.classList.add("d-none");
        regAlert.textContent = "";

        const name = document.getElementById("reg-input-name")?.value.trim();
        const email = document.getElementById("reg-input-email")?.value.trim();
        const password = document.getElementById("reg-input-password")?.value;
        const fit = document.getElementById("reg-input-fit")?.value;

        if (!name || !email || !password) {
          regAlert.textContent = "Please fill in all required fields.";
          regAlert.classList.remove("d-none");
          return;
        }

        if (password.length < 6) {
          regAlert.textContent = "Password must be at least 6 characters.";
          regAlert.classList.remove("d-none");
          return;
        }

        regBtn.disabled = true;
        regBtn.textContent = "CREATING PROFILE...";

        const res = await this.registerUser(name, email, password, fit);
        regBtn.disabled = false;
        regBtn.textContent = "CREATE ATHLETE PROFILE";

        if (res.success) {
          const inst = bootstrap.Modal.getInstance(modalEl);
          if (inst) inst.hide();

          if (window.showToast) {
            window.showToast(`Athlete profile created for ${res.user.name}. Welcome to SUPERSCIENCE.`);
          }

          if (window.location.pathname.includes("profile.html") && typeof window.loadAthleteProfileData === "function") {
            window.loadAthleteProfileData();
          }
        } else {
          regAlert.textContent = res.error || "Failed to create account.";
          regAlert.classList.remove("d-none");
        }
      });
    }
  }
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Make accessible globally
if (typeof window !== "undefined") {
  window.Auth = Auth;
  window.isSellerMode = () => Auth.isSellerMode();
}
