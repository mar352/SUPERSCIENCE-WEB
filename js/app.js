// SUPERSCIENCE - Application Logic & E-Commerce Interaction Engine
import { products } from "./products.js";
import { workoutPrograms } from "./programs.js";
import { Store, formatPrice } from "./store.js";
import { API } from "./api.js";
import { Auth } from "./auth.js";
import { Chat } from "./chat.js";

/* ==========================================================================
   Header & Drawer Metrics Alignment (Zero-Gap Sticky Alignment)
   ========================================================================== */
export function updateHeaderDrawerMetrics() {
  const nav = document.querySelector(".navbar-superscience");
  if (!nav) return;
  const rect = nav.getBoundingClientRect();
  // rect.bottom is the exact bottom edge of the sticky navbar in viewport coordinates
  // Math.floor ensures the drawer top tucks under the 1px navbar bottom border with 0 subpixel gap
  const navBottom = Math.max(0, Math.floor(rect.bottom));
  document.documentElement.style.setProperty("--ss-drawer-top", `${navBottom}px`);
}

// Drawer header button active states helper
function updateHeaderButtonActiveStates(activeOffcanvasEl = null) {
  const bagOpen = activeOffcanvasEl && (activeOffcanvasEl.id === "offcanvasBag" || activeOffcanvasEl.id === "bagOffcanvas");
  const wishlistOpen = activeOffcanvasEl && activeOffcanvasEl.id === "wishlistOffcanvas";
  const searchOpen = activeOffcanvasEl && (activeOffcanvasEl.id === "searchOffcanvas" || activeOffcanvasEl.id === "searchModal");

  document.querySelectorAll(".open-bag-trigger, #open-bag-btn").forEach(btn => {
    btn.classList.toggle("active", Boolean(bagOpen));
  });
  document.querySelectorAll(".open-wishlist-trigger, #open-wishlist-btn").forEach(btn => {
    btn.classList.toggle("active", Boolean(wishlistOpen));
  });
  document.querySelectorAll(".open-search-trigger, #open-search-btn").forEach(btn => {
    btn.classList.toggle("active", Boolean(searchOpen));
  });
}

// Global coordinator to ensure only ONE offcanvas drawer is open at a time
export function closeAllDrawers(exceptElement = null) {
  document.querySelectorAll(".offcanvas.show, .offcanvas.showing").forEach((el) => {
    if (el !== exceptElement) {
      if (window.bootstrap) {
        const inst = bootstrap.Offcanvas.getInstance(el);
        if (inst) {
          inst.hide();
        }
      }
    }
  });
  document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
    m.classList.remove("show");
    const toggle = m.closest(".dropdown")?.querySelector('[data-bs-toggle="dropdown"]');
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("show");
    }
  });
}
window.closeAllDrawers = closeAllDrawers;

// Global listeners to keep drawer top perfectly synchronized with the header
window.addEventListener("resize", updateHeaderDrawerMetrics);
window.addEventListener("scroll", updateHeaderDrawerMetrics, { passive: true });

// Collapse any already-open offcanvas when another is triggered
document.addEventListener("show.bs.offcanvas", (e) => {
  updateHeaderDrawerMetrics();
  const openingEl = e.target;
  closeAllDrawers(openingEl);
  updateHeaderButtonActiveStates(openingEl);
});

// Maintain active state when offcanvas finishes showing
document.addEventListener("shown.bs.offcanvas", (e) => {
  updateHeaderButtonActiveStates(e.target);
});

// Clean up backdrops and update active indicators when offcanvas hides
document.addEventListener("hidden.bs.offcanvas", () => {
  const activeRemaining = document.querySelector(".offcanvas.show:not(.hiding), .offcanvas.showing");
  updateHeaderButtonActiveStates(activeRemaining);

  setTimeout(() => {
    const anyOpen = document.querySelector(".offcanvas.show, .offcanvas.showing");
    if (!anyOpen) {
      document.querySelectorAll(".offcanvas-backdrop").forEach((b) => b.remove());
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      updateHeaderButtonActiveStates(null);
    }
  }, 100);
});

// Close all open drawers when dropdowns (like user profile) open
document.addEventListener("show.bs.dropdown", () => {
  closeAllDrawers();
});

let currentCategory = "all";
let currentSort = "featured";
let currentGridView = 4; // 4 columns desktop default
let currentProgramFilter = "all";
let activeWorkoutPrograms = [...workoutPrograms];
let isFetchingPrograms = false;

// Live active products state (PostgreSQL database primary with bundled fallback)
let activeProducts = [...products];
let isFetchingProducts = false;

export async function fetchLiveProducts(force = false) {
  if (isFetchingProducts && !force) return activeProducts;
  isFetchingProducts = true;
  try {
    const res = await API.getProducts("all");
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      activeProducts = res.data;
      window.activeProducts = activeProducts;
      window.dispatchEvent(new CustomEvent("superscience:products-loaded", { detail: activeProducts }));
    }
  } catch (e) {
    console.warn("[Products] Live sync offline, using bundled fallback:", e.message);
  } finally {
    isFetchingProducts = false;
  }
  return activeProducts;
}

function normalizeCategory(cat) {
  if (!cat) return "all";
  const c = cat.toLowerCase();
  if (c === "tees" || c === "tshirt" || c === "t-shirts" || c === "t-shirt") return "tshirts";
  if (c === "cap" || c === "hat" || c === "accessories") return "caps";
  if (c === "short") return "shorts";
  return c;
}

/* ==========================================================================
   Seller Preview Mode Banner & Restrictions Engine
   ========================================================================== */
export function setupSellerModeUI() {
  const isSeller = Auth.isSellerMode();
  const existingBanner = document.getElementById("seller-mode-alert-bar");
  if (document.body) {
    document.body.classList.toggle("seller-mode-active", isSeller);
  }
  if (document.documentElement) {
    document.documentElement.classList.toggle("seller-mode-active", isSeller);
  }

  // Universal button remover for sellers across all pages, modals, sidebars, and header navigation
  const buyerElements = document.querySelectorAll(
    ".open-wishlist-trigger, #open-wishlist-btn, .open-bag-trigger, #open-bag-btn, #bag-checkout-btn, #btn-proceed-checkout, #checkout-drawer-btn, #move-all-wishlist-to-bag, #wishlist-footer-actions, #btn-move-vault-to-bag, #pdp-modal-add-btn, .quick-size-bar, .wishlist-btn-card, .quick-add-wishlist-btn, .quick-add-apparel-btn, #bag-footer-checkout, .move-vault-single-btn"
  );
  buyerElements.forEach(el => {
    el.style.display = isSeller ? "none" : "";
  });

  if (Auth && typeof Auth.syncSellerVisibility === "function") {
    Auth.syncSellerVisibility();
  }

  if (!isSeller) {
    if (existingBanner) existingBanner.remove();
    updateHeaderDrawerMetrics();
    return;
  }

  const admin = Auth.getAdmin();
  const adminName = admin ? (admin.name || "Seller") : "Seller";

  if (!existingBanner) {
    const banner = document.createElement("div");
    banner.id = "seller-mode-alert-bar";
    banner.className = "seller-mode-alert-bar";
    banner.innerHTML = `
      <div class="container-fluid d-flex flex-wrap justify-content-between align-items-center py-2 px-3 gap-2">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-warning text-dark font-mono fw-bold rounded-0" style="font-size:0.68rem; letter-spacing:0.04em;">SELLER STORE PREVIEW</span>
          <span class="font-mono text-white small" style="font-size:0.75rem;">
            Viewing as <strong>${adminName}</strong>. Buyer actions (Add to Bag, Wishlist, Checkout) are <strong>strictly disabled</strong>.
          </span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <a href="admin.html" class="btn btn-warning btn-sm rounded-0 font-mono fw-bold py-1 px-3 text-dark text-decoration-none" style="font-size:0.72rem;">
            &larr; BACK TO DASHBOARD
          </a>
          <button id="btn-seller-exit-preview" class="btn btn-outline-light btn-sm rounded-0 font-mono py-1 px-2" style="font-size:0.72rem;" title="Exit Seller View to test Buyer mode">
            EXIT SELLER VIEW
          </button>
        </div>
      </div>
    `;

    const announcementBar = document.querySelector(".announcement-bar");
    if (announcementBar) {
      announcementBar.parentNode.insertBefore(banner, announcementBar);
    } else {
      document.body.prepend(banner);
    }

    banner.querySelector("#btn-seller-exit-preview")?.addEventListener("click", () => {
      Auth.exitSellerMode();
    });
  }

  updateHeaderDrawerMetrics();
}

function initApp() {
  // Read query parameters (e.g. catalog.html?category=tshirts or programs.html?split=ppl)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("category")) {
    currentCategory = normalizeCategory(urlParams.get("category"));
  }
  if (urlParams.has("split")) {
    currentProgramFilter = urlParams.get("split");
  }

  // Initialize and synchronize athlete/admin authentication session
  Auth.init();
  Chat.init();


  // Setup Seller Mode Banner & Restrictions
  setupSellerModeUI();

  // 1. Initial immediate render with cached/bundled items
  renderHomepageHero();
  renderCategorySpotlights();
  renderWorkoutPrograms();
  renderProducts();
  renderFeaturedProducts();
  setupFilterEvents();
  setupBagDrawer();
  setupWorkoutModal();
  setupProductModal();
  setupSearchDrawer();
  setupWishlistDrawer();
  setupCheckoutModal();
  updateHeaderBadges();
  updateHeaderDrawerMetrics();

  // 2. Asynchronously pull latest live database products from PostgreSQL & re-render
  fetchLiveProducts().then(() => {
    renderProducts();
    renderFeaturedProducts();
    renderWishlistContents();
  }).catch(err => {
    console.warn("[Products Init Sync Error]:", err);
  });

  // 3. Listen for cross-tab or admin product additions/edits & hero updates
  window.addEventListener("superscience:products-updated", async () => {
    await fetchLiveProducts(true);
    renderProducts();
    renderFeaturedProducts();
    renderWishlistContents();
  });

  window.addEventListener("superscience:hero-updated", () => {
    renderHomepageHero();
  });

  window.addEventListener("storage", async (e) => {
    if (e.key === "superscience:last-product-update") {
      await fetchLiveProducts(true);
      renderProducts();
      renderFeaturedProducts();
      renderWishlistContents();
    }
    if (e.key === "superscience:hero-settings") {
      renderHomepageHero();
    }
  });

  // Re-sync when user returns or focuses tab from admin panel
  window.addEventListener("focus", async () => {
    await fetchLiveProducts(true);
    renderProducts();
    renderFeaturedProducts();
    renderHomepageHero();
  });

  // Listen to store updates
  window.addEventListener("superscience:state-updated", () => {
    updateHeaderBadges();
    renderBagContents();
    renderWishlistContents();
  });

  // Listen to authentication state changes
  window.addEventListener("superscience:auth-updated", () => {
    Auth.updateNavigationHeaderAuth();
    setupSellerModeUI();
    renderProducts();
    renderFeaturedProducts();
  });
}

/* ==========================================================================
   Header Badges & Ticker
   ========================================================================== */
function updateHeaderBadges() {
  const totals = Store.getTotals();
  document.querySelectorAll("#bag-badge-count, .bag-badge-counter").forEach(bagBadge => {
    bagBadge.textContent = totals.itemCount;
    bagBadge.style.display = totals.itemCount > 0 ? "inline-block" : "none";
  });

  const wCount = Store.state.wishlist.length;
  document.querySelectorAll("#wishlist-badge-count, .wishlist-badge-counter").forEach(wishlistBadge => {
    wishlistBadge.textContent = wCount;
    wishlistBadge.style.display = wCount > 0 ? "inline-block" : "none";
  });
}

/* ==========================================================================
   Homepage Hero Section CMS Sync
   ========================================================================== */
function applyHeroSettingsToDOM(hero) {
  if (!hero) return;

  const badgeEl = document.getElementById("hero-badge");
  if (badgeEl && hero.badge) badgeEl.textContent = hero.badge;

  const titleEl = document.getElementById("hero-title");
  if (titleEl && hero.title) titleEl.textContent = hero.title;

  const subEl = document.getElementById("hero-subtitle");
  if (subEl && hero.subtitle) subEl.textContent = hero.subtitle;

  const pBtn = document.getElementById("hero-primary-btn");
  if (pBtn) {
    if (hero.primaryBtnText) pBtn.textContent = hero.primaryBtnText;
    if (hero.primaryBtnLink) pBtn.setAttribute("href", hero.primaryBtnLink);
  }

  const sBtn = document.getElementById("hero-secondary-btn");
  if (sBtn) {
    if (hero.secondaryBtnText) sBtn.textContent = hero.secondaryBtnText;
    if (hero.secondaryBtnLink) sBtn.setAttribute("href", hero.secondaryBtnLink);
  }

  const imgEl = document.getElementById("hero-photo-img");
  if (imgEl && hero.imageUrl) {
    imgEl.src = hero.imageUrl;
    imgEl.alt = hero.title || "SUPERSCIENCE Hero Editorial Campaign";
  }

  const tagLeft = document.getElementById("hero-photo-tag-left");
  if (tagLeft && hero.photoTagLeft) tagLeft.textContent = hero.photoTagLeft;

  const tagRight = document.getElementById("hero-photo-tag-right");
  if (tagRight && hero.photoTagRight) tagRight.textContent = hero.photoTagRight;
}

async function renderHomepageHero() {
  const heroSection = document.getElementById("homepage-hero-section");
  if (!heroSection) return;

  // 1. Instant zero-flicker render from cached settings
  try {
    const cached = localStorage.getItem("superscience:hero-settings");
    if (cached) {
      applyHeroSettingsToDOM(JSON.parse(cached));
    }
  } catch (e) {}

  // 2. Fetch live settings from server API
  try {
    const res = await API.getHeroSettings();
    if (res && res.success && res.hero) {
      applyHeroSettingsToDOM(res.hero);
      localStorage.setItem("superscience:hero-settings", JSON.stringify(res.hero));
    }
  } catch (err) {
    console.warn("[Hero Settings Sync Error]:", err);
  }
}

/* ==========================================================================
   Category Spotlights
   ========================================================================== */
function renderCategorySpotlights() {
  const container = document.getElementById("category-spotlights-container");
  if (!container) return;

  const spotlights = [
    {
      title: "OVERSIZED T-SHIRTS",
      category: "tshirts",
      subtitle: "380 GSM Combed Cotton • Drop Shoulder",
      image: "assets/products/3625c097-e479-4def-9f8d-d77f753fe93d.jfif"
    },
    {
      title: "HEAVYWEIGHT SHORTS",
      category: "shorts",
      subtitle: "420 GSM French Terry • Deep Concealed Pockets",
      image: "assets/products/6fc2635d-29ae-44b8-9478-5879726e1085.jfif"
    },
    {
      title: "TWILL CAPS & HEADWEAR",
      category: "caps",
      subtitle: "280 GSM Chino Twill • Unstructured 6-Panel",
      image: "assets/products/6f932f06-daf5-4432-acb6-2cd191978d22.jfif"
    }
  ];

  container.innerHTML = spotlights.map(spot => `
    <div class="col-12 col-md-4">
      <a href="#catalog-section" class="category-card" data-category="${spot.category}">
        <img src="${spot.image}" alt="${spot.title}">
        <div class="category-overlay">
          <div>
            <div class="category-title">${spot.title}</div>
            <div class="category-cta">${spot.subtitle} &rarr;</div>
          </div>
        </div>
      </a>
    </div>
  `).join("");

  container.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", (e) => {
      const cat = card.getAttribute("data-category");
      setCategoryFilter(cat);
    });
  });
}

/* ==========================================================================
   Science-Based Workout Programs Showcase (Featured on Home Page & Programs)
   ========================================================================== */
async function renderWorkoutPrograms() {
  const container = document.getElementById("workout-programs-grid");
  if (!container) return;

  // Attempt to fetch latest programs from server API once
  if (!isFetchingPrograms) {
    isFetchingPrograms = true;
    try {
      const res = await API.getPrograms();
      if (res && res.data && res.data.length > 0) {
        activeWorkoutPrograms = res.data;
      }
    } catch (e) {
      console.warn("[Programs] Using bundled workout programs:", e.message);
    }
  }

  const filtered = activeWorkoutPrograms.filter(p => {
    if (currentProgramFilter === "all") return true;
    return p.split === currentProgramFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 py-5 text-center font-mono">
        <div class="text-muted">No workout protocols registered under "${currentProgramFilter}".</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prog => `
    <div class="col-12 col-md-6 col-lg-4 mb-4">
      <div class="program-card">
        <div class="program-img-wrapper">
          <img src="${prog.image || 'assets/stock/program_upper_lower.jpg'}" alt="${prog.title}">
          <div class="program-badge">${prog.frequency}</div>
        </div>
        <div class="program-body">
          <div class="program-title">${prog.title}</div>
          <div class="text-muted small mb-3">${prog.subtitle || ''}</div>
          
          <ul class="program-meta-list">
            <li class="program-meta-item"><span>Weekly Volume:</span> <strong>${prog.weeklyVolume}</strong></li>
            <li class="program-meta-item"><span>Target Intensity:</span> <strong>${prog.intensity}</strong></li>
            <li class="program-meta-item"><span>Duration:</span> <strong>${prog.duration}</strong></li>
            <li class="program-meta-item"><span>Level:</span> <strong>${prog.experienceLevel}</strong></li>
          </ul>

          <div class="mt-auto pt-2">
            <button class="btn btn-ss-dark w-100 open-program-modal-btn" data-program-id="${prog.id}">
              VIEW FULL ROUTINE & EXERCISES
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".open-program-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-program-id");
      openWorkoutModal(id);
    });
  });
}

/* ==========================================================================
   Product Catalog Grid (Gymshark Signature UX)
   ========================================================================== */
function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  let list = [...activeProducts];

  // Category filter
  if (currentCategory !== "all") {
    const norm = normalizeCategory(currentCategory);
    list = list.filter(p => normalizeCategory(p.category) === norm);
  }

  // Sorting
  if (currentSort === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (currentSort === "gsm") {
    list.sort((a, b) => (parseInt(b.gsm) || 0) - (parseInt(a.gsm) || 0));
  }

  // Dynamic specimens counter badge
  const countBadge = document.getElementById("catalog-specimens-count");
  if (countBadge) {
    countBadge.textContent = `${list.length} PRODUCTS`;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-12 py-5 text-center font-mono">
        <div class="text-muted mb-2">No garments found under "${currentCategory.toUpperCase()}".</div>
        <button class="btn btn-ss-dark btn-sm rounded-0" onclick="setCategoryFilter('all')">VIEW ALL PRODUCTS</button>
      </div>
    `;
    return;
  }

  // Grid column classes
  const colClass = currentGridView === 2 ? "col-6 col-md-6" : "col-6 col-md-4 col-lg-3";

  grid.innerHTML = list.map(product => {
    const isSeller = Auth.isSellerMode();
    const inWishlist = Store.isInWishlist(product.id);
    const primaryImg = (product.images && product.images.primary)
      ? product.images.primary
      : (typeof product.images === "string" ? product.images : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif");
    const colors = (product.colors && product.colors.length > 0) ? product.colors : [{ hex: "#0a0a0a", name: "Blackout" }];
    const sizes = (product.sizes && product.sizes.length > 0) ? product.sizes : [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ];

    return `
      <div class="${colClass} mb-4">
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-image-container">
            <img class="product-img" src="${primaryImg}" alt="${product.name}" loading="lazy">
            
            ${isSeller ? '' : `
            <button class="wishlist-btn-card ${inWishlist ? 'active' : ''}" 
                    data-product-id="${product.id}" 
                    title="Save to Wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${inWishlist ? '#000' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            `}

            ${product.badges && product.badges.length > 0 ? `
              <div class="product-badge-tag">${product.badges[0]}</div>
            ` : ''}

            <!-- Gymshark Hover Quick-Size Bar -->
            ${isSeller ? '' : `
            <div class="quick-size-bar">
              <span class="small font-mono text-muted me-1 d-none d-sm-inline" style="line-height:28px;">
                SIZE:
              </span>
              ${sizes.map(s => `
                <button class="quick-size-btn" 
                        data-product-id="${product.id}" 
                        data-size="${s.size}" 
                        ${!s.inStock ? 'disabled' : ''}
                        title="Quick Add ${s.size}">
                  ${s.size}
                </button>
              `).join('')}
            </div>
            `}
          </div>

          <div class="pt-2">
            <!-- Swatches -->
            <div class="swatch-group">
              ${colors.map((c, i) => `
                <div class="swatch-dot ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}" data-color-name="${c.name}"></div>
              `).join('')}
            </div>

            <div class="product-title open-pdp-trigger" data-product-id="${product.id}">${product.name}</div>
            <div class="product-spec-line">${product.gsm || '380 GSM'} • ${product.fit || 'Oversized Boxy'}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  attachProductEvents();
}

/* ==========================================================================
   Featured Products Grid (Home Page Curated Showcase)
   ========================================================================== */
function renderFeaturedProducts() {
  const grid = document.getElementById("featured-product-grid");
  if (!grid) return;

  const isSeller = Auth.isSellerMode();
  const list = activeProducts.slice(0, 4);

  grid.innerHTML = list.map(product => {
    const inWishlist = Store.isInWishlist(product.id);
    const primaryImg = (product.images && product.images.primary)
      ? product.images.primary
      : (typeof product.images === "string" ? product.images : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif");
    const colors = (product.colors && product.colors.length > 0) ? product.colors : [{ hex: "#0a0a0a", name: "Blackout" }];
    const sizes = (product.sizes && product.sizes.length > 0) ? product.sizes : [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ];

    return `
      <div class="col-6 col-md-3 mb-4">
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-image-container">
            <img class="product-img" src="${primaryImg}" alt="${product.name}" loading="lazy">
            
            ${isSeller ? '' : `
            <button class="wishlist-btn-card ${inWishlist ? 'active' : ''}" 
                    data-product-id="${product.id}" 
                    title="Save to Wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${inWishlist ? '#000' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            `}

            ${product.badges && product.badges.length > 0 ? `
              <div class="product-badge-tag">${product.badges[0]}</div>
            ` : ""}

            ${isSeller ? '' : `
            <div class="quick-size-bar">
              <div class="quick-size-label">QUICK ADD</div>
              <div class="quick-size-options">
                ${sizes.map(s => `
                  <button class="quick-size-btn" 
                          data-product-id="${product.id}" 
                          data-size="${s.size}" 
                          ${!s.inStock ? 'disabled' : ''}
                          title="Quick Add ${s.size}">
                    ${s.size}
                  </button>
                `).join("")}
              </div>
            </div>
            `}
          </div>

          <div class="product-info">
            <div class="product-swatches">
              ${colors.map((c, i) => `
                <span class="product-swatch ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}"></span>
              `).join("")}
            </div>

            <div class="product-title open-pdp-trigger" data-product-id="${product.id}">${product.name}</div>
            <div class="product-spec-line">${product.gsm || '380 GSM'} • ${product.fit || 'Oversized Boxy'}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  attachProductEvents();
}

function attachProductEvents() {
  // Quick-Size 1-Click Add
  document.querySelectorAll(".quick-size-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (Auth.isSellerMode()) {
        showToast("SELLER ACCOUNT: You cannot add items to bag as a Seller.");
        return;
      }
      const pId = btn.getAttribute("data-product-id");
      const size = btn.getAttribute("data-size");
      const product = activeProducts.find(p => p.id === pId) || products.find(p => p.id === pId);
      if (!product) return;

      if (!Auth.isUserLoggedIn()) {
        Auth.requireLogin("Shopping Bag (Bag)", () => {
          Store.addToCart(product, size);
          showToast(`Added ${product.name} (Size ${size}) to your bag.`);
          openBagDrawer();
        });
        return;
      }

      Store.addToCart(product, size);
      showToast(`Added ${product.name} (Size ${size}) to your bag.`);
      openBagDrawer();
    });
  });

  // Wishlist Button (Heart)
  document.querySelectorAll(".wishlist-btn-card").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (Auth.isSellerMode()) {
        showToast("SELLER ACCOUNT: You cannot heart or wishlist items as a Seller.");
        return;
      }
      const pId = btn.getAttribute("data-product-id");

      if (!Auth.isUserLoggedIn()) {
        Auth.requireLogin("Wishlist (Heart)", () => {
          const added = Store.toggleWishlist(pId);
          btn.classList.toggle("active", added);
          const svg = btn.querySelector("svg");
          if (svg) svg.setAttribute("fill", added ? "#000" : "none");
          showToast(added ? "Item saved to your Wishlist." : "Item removed from Wishlist.");
        });
        return;
      }

      const added = Store.toggleWishlist(pId);
      btn.classList.toggle("active", added);
      const svg = btn.querySelector("svg");
      if (svg) svg.setAttribute("fill", added ? "#000" : "none");
      showToast(added ? "Item saved to your Wishlist." : "Item removed from Wishlist.");
    });
  });

  // PDP modal trigger
  document.querySelectorAll(".open-pdp-trigger, .product-image-container").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".quick-size-bar") || e.target.closest(".wishlist-btn-card")) return;
      const card = el.closest(".product-card");
      if (card) {
        const pId = card.getAttribute("data-product-id");
        openProductModal(pId);
      }
    });
  });
}

/* ==========================================================================
   Filter & Grid Controls
   ========================================================================== */
function setupFilterEvents() {
  // Category tabs
  document.querySelectorAll(".filter-pill-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const category = btn.getAttribute("data-category");
      setCategoryFilter(category);
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Grid view switcher (2 col vs 4 col)
  const btn2Col = document.getElementById("view-2col-btn");
  const btn4Col = document.getElementById("view-4col-btn");
  if (btn2Col && btn4Col) {
    btn2Col.addEventListener("click", () => {
      currentGridView = 2;
      btn2Col.classList.add("active");
      btn4Col.classList.remove("active");
      renderProducts();
    });
    btn4Col.addEventListener("click", () => {
      currentGridView = 4;
      btn4Col.classList.add("active");
      btn2Col.classList.remove("active");
      renderProducts();
    });
  }

  // Program split filter pills
  document.querySelectorAll(".program-filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const split = btn.getAttribute("data-split");
      setProgramFilter(split);
    });
  });

  // Sync initial pill highlight from query param
  document.querySelectorAll(".filter-pill-btn").forEach(btn => {
    const btnCat = normalizeCategory(btn.getAttribute("data-category"));
    btn.classList.toggle("active", btnCat === currentCategory);
  });
  document.querySelectorAll(".program-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-split") === currentProgramFilter);
  });
}

function setCategoryFilter(category) {
  currentCategory = normalizeCategory(category);
  const grid = document.getElementById("product-grid");
  if (grid) {
    document.querySelectorAll(".filter-pill-btn").forEach(btn => {
      const btnCat = normalizeCategory(btn.getAttribute("data-category"));
      btn.classList.toggle("active", btnCat === currentCategory);
    });
    renderProducts();
    try {
      const url = new URL(window.location);
      if (currentCategory === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", currentCategory);
      }
      window.history.replaceState({}, "", url);
    } catch (_) { }
  } else {
    window.location.href = `catalog.html?category=${encodeURIComponent(currentCategory)}`;
  }
}

function setProgramFilter(split) {
  currentProgramFilter = split;
  const grid = document.getElementById("workout-programs-grid");
  if (grid) {
    document.querySelectorAll(".program-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-split") === split);
    });
    renderWorkoutPrograms();
    try {
      const url = new URL(window.location);
      if (split === "all") {
        url.searchParams.delete("split");
      } else {
        url.searchParams.set("split", split);
      }
      window.history.replaceState({}, "", url);
    } catch (_) { }
  } else {
    window.location.href = `programs.html?split=${encodeURIComponent(split)}`;
  }
}


/* ==========================================================================
   Slide-Over Bag Drawer (Offcanvas-End)
   ========================================================================== */
let bagOffcanvas = null;

function setupBagDrawer() {
  const el = document.getElementById("offcanvasBag") || document.getElementById("bagOffcanvas");
  if (el && window.bootstrap) {
    bagOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
  }

  document.querySelectorAll(".open-bag-trigger, #open-bag-btn").forEach(btn => {
    btn.removeEventListener("click", handleBagTriggerClick);
    btn.addEventListener("click", handleBagTriggerClick);
  });

  // Promo Code input
  const promoBtn = document.getElementById("apply-promo-btn");
  const promoInput = document.getElementById("promo-input");
  if (promoBtn && promoInput) {
    promoBtn.onclick = () => {
      const res = Store.applyPromoCode(promoInput.value);
      showToast(res.message);
      Store.notifyUpdate();
    };
  }

  renderBagContents();
}

function handleBagTriggerClick(e) {
  e.preventDefault();
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Shopping bag is disabled for Seller accounts.");
    return;
  }
  if (!Auth.isUserLoggedIn()) {
    Auth.requireLogin("Shopping Bag (Bag)", () => openBagDrawer());
    return;
  }
  const el = document.getElementById("offcanvasBag") || document.getElementById("bagOffcanvas");
  if (el && el.classList.contains("show")) {
    closeBagDrawer();
  } else {
    openBagDrawer();
  }
}

function closeBagDrawer() {
  const el = document.getElementById("offcanvasBag") || document.getElementById("bagOffcanvas");
  if (el && window.bootstrap) {
    const inst = bootstrap.Offcanvas.getInstance(el) || bagOffcanvas;
    if (inst) inst.hide();
  }
}

function openBagDrawer() {
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Shopping bag is disabled for Seller accounts.");
    return;
  }
  if (!Auth.isUserLoggedIn()) {
    Auth.requireLogin("Shopping Bag (Bag)", () => openBagDrawer());
    return;
  }
  const el = document.getElementById("offcanvasBag") || document.getElementById("bagOffcanvas");
  closeAllDrawers(el);
  updateHeaderDrawerMetrics();
  if (!bagOffcanvas && el && window.bootstrap) {
    bagOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
  }
  if (bagOffcanvas) {
    bagOffcanvas.show();
    renderBagContents();
  }
}
window.openBagDrawer = openBagDrawer;
window.closeBagDrawer = closeBagDrawer;

function renderBagContents() {
  const container = document.getElementById("bag-items-list") || document.getElementById("bag-items-container");
  const emptyState = document.getElementById("bag-empty-state");
  const trackerMsg = document.getElementById("free-shipping-msg");
  const trackerFill = document.getElementById("free-shipping-fill");
  const subtotalEl = document.getElementById("bag-subtotal-price");
  const discountRow = document.getElementById("bag-discount-row");
  const discountEl = document.getElementById("bag-discount-price");
  const totalEl = document.getElementById("bag-total-price");
  const checkoutBtn = document.getElementById("bag-checkout-btn") || document.getElementById("btn-proceed-checkout");

  if (!container) return;

  const totals = Store.getTotals();

  // Shipping Progress
  if (trackerMsg && trackerFill) {
    if (totals.isFreeShippingUnlocked) {
      trackerMsg.innerHTML = `<strong>FREE WORLDWIDE EXPRESS DISPATCH UNLOCKED!</strong>`;
      trackerFill.style.width = "100%";
      trackerFill.style.backgroundColor = "var(--ss-accent-green)";
    } else {
      trackerMsg.innerHTML = `Add <strong>${formatPrice(totals.freeShippingRemaining)}</strong> more for <strong>FREE EXPRESS SHIPPING</strong>`;
      trackerFill.style.width = `${totals.freeShippingProgress}%`;
      trackerFill.style.backgroundColor = "var(--ss-black)";
    }
  }

  if (Store.state.cart.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (checkoutBtn) checkoutBtn.setAttribute("disabled", "true");
  } else {
    if (emptyState) emptyState.style.display = "none";
    if (checkoutBtn) checkoutBtn.removeAttribute("disabled");

    container.innerHTML = Store.state.cart.map((item, index) => `
      <div class="cart-item-row">
        <img class="cart-item-thumb" src="${item.image}" alt="${item.name}">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div class="fw-bold text-uppercase small">${item.name}</div>
            <button class="btn btn-link p-0 text-muted remove-cart-item-btn" data-index="${index}" title="Remove item">
              &times;
            </button>
          </div>
          <div class="font-mono text-muted small mt-1">Size: ${item.size} • Color: ${item.color}</div>
          <div class="fw-bold mt-1">${formatPrice(item.price)}</div>
          
          <div class="d-flex align-items-center mt-2">
            <div class="qty-control-box">
              <button class="qty-btn qty-minus-btn" data-index="${index}">-</button>
              <div class="qty-display">${item.quantity}</div>
              <button class="qty-btn qty-plus-btn" data-index="${index}">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".qty-minus-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        Store.updateQuantity(idx, Store.state.cart[idx].quantity - 1);
      });
    });

    container.querySelectorAll(".qty-plus-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        Store.updateQuantity(idx, Store.state.cart[idx].quantity + 1);
      });
    });

    container.querySelectorAll(".remove-cart-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        Store.removeFromCart(idx);
      });
    });
  }

  // Update Totals
  if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
  if (discountRow && discountEl) {
    if (totals.discount > 0) {
      discountRow.style.display = "flex";
      discountEl.textContent = `-${formatPrice(totals.discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }
  if (totalEl) totalEl.textContent = formatPrice(totals.total);

  // Seller Preview Mode Enforcement in Bag Drawer: completely remove checkout button
  if (Auth.isSellerMode()) {
    if (checkoutBtn) {
      checkoutBtn.style.display = "none";
    }
    const checkoutFooter = document.getElementById("bag-footer-checkout");
    if (checkoutFooter) {
      checkoutFooter.style.display = "none";
    }
    let sellerNotice = document.getElementById("bag-seller-mode-notice");
    if (!sellerNotice && container) {
      sellerNotice = document.createElement("div");
      sellerNotice.id = "bag-seller-mode-notice";
      sellerNotice.className = "alert alert-warning rounded-0 font-mono small py-2 mb-3 border-warning d-flex align-items-center gap-2";
      sellerNotice.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div><strong>SELLER ACCOUNT</strong>: You are viewing store in preview mode. Checkout and ordering are disabled for Sellers.</div>
      `;
      container.parentNode.insertBefore(sellerNotice, container);
    }
  } else {
    if (checkoutBtn) {
      checkoutBtn.style.display = "";
    }
    const sellerNotice = document.getElementById("bag-seller-mode-notice");
    if (sellerNotice) sellerNotice.remove();
  }
}

/* ==========================================================================
   Workout Program Routine Modal (Bootstrap 5 modal-xl)
   ========================================================================== */
let workoutModalInstance = null;

function setupWorkoutModal() {
  const el = document.getElementById("workoutProgramModal") || document.getElementById("workoutDetailModal");
  if (el && window.bootstrap) {
    workoutModalInstance = new bootstrap.Modal(el);
  }
}

function openWorkoutModal(progId) {
  const prog = activeWorkoutPrograms.find(p => p.id === progId) || workoutPrograms.find(p => p.id === progId);
  if (!prog) return;

  const modalEl = document.getElementById("workoutProgramModal") || document.getElementById("workoutDetailModal");
  if (!workoutModalInstance && modalEl && window.bootstrap) {
    workoutModalInstance = new bootstrap.Modal(modalEl);
  }
  if (!workoutModalInstance) return;

  const titleEl = document.getElementById("modal-prog-title");
  if (titleEl) titleEl.textContent = prog.title;
  const subtitleEl = document.getElementById("modal-prog-subtitle");
  if (subtitleEl) subtitleEl.textContent = prog.subtitle;
  const freqEl = document.getElementById("modal-prog-freq");
  if (freqEl) freqEl.textContent = prog.frequency;
  const durEl = document.getElementById("modal-prog-dur");
  if (durEl) durEl.textContent = prog.duration;
  const intEl = document.getElementById("modal-prog-intensity") || document.getElementById("modal-prog-int");
  if (intEl) intEl.textContent = prog.intensity;
  const volEl = document.getElementById("modal-prog-volume") || document.getElementById("modal-prog-vol");
  if (volEl) volEl.textContent = prog.weeklyVolume;

  // Principles list
  const principlesContainer = document.getElementById("modal-prog-principles");
  if (principlesContainer && prog.scientificPrinciples) {
    principlesContainer.innerHTML = prog.scientificPrinciples.map(p => `
      <li class="mb-2"><span class="badge bg-black me-2 font-mono">EVIDENCE</span> ${p}</li>
    `).join("");
  }

  // Tabbed days
  const tabsNav = document.getElementById("modal-prog-tabs-nav");
  const tabsContent = document.getElementById("modal-prog-tabs-content");
  if (tabsNav && tabsContent) {
    tabsNav.innerHTML = prog.days.map((day, idx) => `
      <button class="btn btn-outline-dark btn-sm rounded-0 me-2 mb-2 ${idx === 0 ? 'active' : ''}" 
              data-bs-toggle="pill" data-bs-target="#day-tab-${idx}" type="button">
        ${day.dayName.split(':')[0]}
      </button>
    `).join("");

    tabsContent.innerHTML = prog.days.map((day, idx) => `
      <div class="tab-pane fade ${idx === 0 ? 'show active' : ''}" id="day-tab-${idx}">
        <div class="p-3 bg-light border mb-3">
          <div class="fw-bold text-uppercase">${day.dayName}</div>
          <div class="text-muted small">Target Focus: ${day.focus}</div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-dark">
              <tr class="font-mono small">
                <th>EXERCISE MOVEMENT</th>
                <th>TARGET MUSCLE</th>
                <th>SETS × REPS</th>
                <th>RIR</th>
                <th>REST</th>
                <th>BIOMECHANICAL CUE</th>
              </tr>
            </thead>
            <tbody>
              ${day.exercises.map(ex => `
                <tr>
                  <td class="fw-bold">${ex.name}</td>
                  <td><span class="badge bg-light text-dark border font-mono">${ex.muscle}</span></td>
                  <td class="font-mono fw-bold">${ex.sets} × ${ex.reps}</td>
                  <td class="font-mono text-danger fw-bold">${ex.rir}</td>
                  <td class="font-mono text-muted">${ex.rest}</td>
                  <td class="small text-secondary fst-italic">${ex.cue}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `).join("");
  }

  // Apparel Tie-in
  const apparelBox = document.getElementById("modal-prog-apparel");
  if (apparelBox && prog.apparelRecommendation) {
    const recId = prog.apparelRecommendation.productId;
    const recommendedProduct = activeProducts.find(p => p.id === recId) || products.find(p => p.id === recId);
    apparelBox.innerHTML = `
      <div class="p-3 border bg-light d-flex align-items-center justify-content-between">
        <div>
          <span class="badge bg-black font-mono me-2">TRAIN IN THIS</span>
          <strong>${prog.apparelRecommendation.name}</strong>
          <div class="small text-muted mt-1">${prog.apparelRecommendation.reason}</div>
        </div>
        ${(recommendedProduct && !Auth.isSellerMode()) ? `
          <button class="btn btn-ss-dark btn-sm rounded-0 text-nowrap ms-3 quick-add-apparel-btn" data-product-id="${recommendedProduct.id}">
            QUICK ADD TO BAG (${formatPrice(recommendedProduct.price)})
          </button>
        ` : ''}
      </div>
    `;

    const addBtn = apparelBox.querySelector(".quick-add-apparel-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (Auth.isSellerMode()) {
          showToast("SELLER PREVIEW: Purchasing is disabled for Seller accounts.");
          return;
        }
        if (!Auth.isUserLoggedIn()) {
          Auth.requireLogin("Shopping Bag (Bag)", () => {
            Store.addToCart(recommendedProduct, "L");
            showToast(`Added ${recommendedProduct.name} to your bag.`);
            openBagDrawer();
          });
          return;
        }
        Store.addToCart(recommendedProduct, "L");
        showToast(`Added ${recommendedProduct.name} to your bag.`);
        openBagDrawer();
      });
    }
  }

  // Print Routine Button
  const printBtn = document.getElementById("modal-prog-print-btn");
  if (printBtn) {
    printBtn.onclick = () => window.print();
  }

  workoutModalInstance.show();
}

/* ==========================================================================
   Product Detail Modal (Quick View & Spec Sheet)
   ========================================================================== */
let productModalInstance = null;
let activeModalProduct = null;
let activeModalColor = null;
let activeModalSize = "L";

function setupProductModal() {
  const el = document.getElementById("productDetailModal");
  if (el && window.bootstrap) {
    productModalInstance = bootstrap.Modal.getOrCreateInstance(el);
  }
}

function openProductModal(productId) {
  const product = activeProducts.find(p => p.id === productId) || products.find(p => p.id === productId);
  if (!product) return;

  const modalEl = document.getElementById("productDetailModal");
  if (!productModalInstance && modalEl && window.bootstrap) {
    productModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  }
  if (!productModalInstance) return;

  const colors = (product.colors && product.colors.length > 0) ? product.colors : [{ hex: "#0a0a0a", name: "Blackout" }];
  const sizes = (product.sizes && product.sizes.length > 0) ? product.sizes : [
    { size: "S", inStock: true },
    { size: "M", inStock: true },
    { size: "L", inStock: true },
    { size: "XL", inStock: true }
  ];
  const primaryImg = (product.images && product.images.primary)
    ? product.images.primary
    : (typeof product.images === "string" ? product.images : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif");

  activeModalProduct = product;
  activeModalColor = colors[0].name;
  activeModalSize = sizes[0].size;

  const titleEl = document.getElementById("pdp-modal-title");
  if (titleEl) titleEl.textContent = product.name;
  const priceEl = document.getElementById("pdp-modal-price");
  if (priceEl) priceEl.textContent = formatPrice(product.price);
  const descEl = document.getElementById("pdp-modal-desc");
  if (descEl) descEl.textContent = product.description || "Engineered luxury heavyweight streetwear garment calibrated for hypertrophy athletes.";
  const gsmEl = document.getElementById("pdp-modal-gsm");
  if (gsmEl) gsmEl.textContent = product.gsm || "380 GSM";
  const fitEl = document.getElementById("pdp-modal-fit");
  if (fitEl) fitEl.textContent = product.fit || "Oversized Boxy Fit";
  const fabricEl = document.getElementById("pdp-modal-fabric");
  if (fabricEl) fabricEl.textContent = product.fabric || "100% Combed Heavyweight Organic Cotton";
  const workoutTieInEl = document.getElementById("pdp-modal-workout-tiein");
  if (workoutTieInEl) workoutTieInEl.textContent = product.workoutTieIn || "Calibrated for heavy compound lifting.";

  // Main Image
  const imgEl = document.getElementById("pdp-modal-main-img");
  if (imgEl) imgEl.src = primaryImg;

  // Color Swatches (supports both pdp-modal-colors and pdp-modal-swatches)
  const colorContainer = document.getElementById("pdp-modal-colors") || document.getElementById("pdp-modal-swatches");
  if (colorContainer) {
    colorContainer.innerHTML = colors.map(c => `
      <button class="btn btn-outline-dark btn-sm rounded-0 me-2 mb-2 pdp-color-btn ${c.name === activeModalColor ? 'active' : ''}" data-color-name="${c.name}">
        ${c.name}
      </button>
    `).join("");

    colorContainer.querySelectorAll(".pdp-color-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        colorContainer.querySelectorAll(".pdp-color-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeModalColor = btn.getAttribute("data-color-name");
      });
    });
  }

  // Sizes Selector
  const sizeContainer = document.getElementById("pdp-modal-sizes");
  if (sizeContainer) {
    sizeContainer.innerHTML = sizes.map(s => `
      <button class="btn btn-outline-dark btn-sm rounded-0 me-2 mb-2 pdp-size-btn ${s.size === activeModalSize ? 'active' : ''}" data-size="${s.size}">
        ${s.size}
      </button>
    `).join("");

    sizeContainer.querySelectorAll(".pdp-size-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sizeContainer.querySelectorAll(".pdp-size-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeModalSize = btn.getAttribute("data-size");
      });
    });
  }

  // Add to Bag CTA
  const addToBagBtn = document.getElementById("pdp-modal-add-btn");
  if (addToBagBtn) {
    if (Auth.isSellerMode()) {
      addToBagBtn.style.display = "none";
    } else {
      addToBagBtn.style.display = "";
      addToBagBtn.classList.remove("disabled");
      addToBagBtn.removeAttribute("disabled");
      addToBagBtn.innerHTML = `ADD TO BAG`;
      addToBagBtn.style.cursor = "pointer";
      addToBagBtn.style.opacity = "1";
      addToBagBtn.onclick = () => {
        if (!Auth.isUserLoggedIn()) {
          Auth.requireLogin("Shopping Bag (Bag)", () => {
            Store.addToCart(activeModalProduct, activeModalSize, activeModalColor);
            showToast(`Added ${activeModalProduct.name} (${activeModalSize}) to your bag.`);
            if (productModalInstance) productModalInstance.hide();
            openBagDrawer();
          });
          return;
        }
        Store.addToCart(activeModalProduct, activeModalSize, activeModalColor);
        showToast(`Added ${activeModalProduct.name} (${activeModalSize}) to your bag.`);
        productModalInstance.hide();
        openBagDrawer();
      };
    }
  }

  productModalInstance.show();
}

/* ==========================================================================
   Slide-Over Search Drawer (Offcanvas-End & Modal Fallback)
   ========================================================================== */
let searchDrawerInstance = null;

function closeSearchDrawer() {
  const el = document.getElementById("searchOffcanvas") || document.getElementById("searchModal");
  if (el && window.bootstrap) {
    if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
      const inst = bootstrap.Offcanvas.getInstance(el) || searchDrawerInstance;
      if (inst) inst.hide();
    } else {
      const inst = bootstrap.Modal.getInstance(el) || searchDrawerInstance;
      if (inst) inst.hide();
    }
  }
}

function openSearchDrawer() {
  const el = document.getElementById("searchOffcanvas") || document.getElementById("searchModal");
  closeAllDrawers(el);
  updateHeaderDrawerMetrics();
  if (!el || !window.bootstrap) return;

  renderSearchBestSellers();

  if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
    searchDrawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    searchDrawerInstance.show();
  } else {
    searchDrawerInstance = bootstrap.Modal.getOrCreateInstance(el);
    searchDrawerInstance.show();
  }

  setTimeout(() => {
    const input = document.getElementById("search-input") || document.getElementById("search-modal-input");
    if (input) {
      input.focus();
      input.select();
    }
  }, 250);
}

function handleSearchTriggerClick(e) {
  e.preventDefault();
  const el = document.getElementById("searchOffcanvas") || document.getElementById("searchModal");
  if (el && el.classList.contains("show")) {
    closeSearchDrawer();
  } else {
    openSearchDrawer();
  }
}
window.openSearchDrawer = openSearchDrawer;
window.closeSearchDrawer = closeSearchDrawer;

function handleSearchKeyboardShortcut(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openSearchDrawer();
  }
}

function renderSearchProductCard(product) {
  const img = (product.images && product.images.primary)
    ? product.images.primary
    : (typeof product.images === "string" ? product.images : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif");
  const isWishlisted = Store.state.wishlist && Store.state.wishlist.includes(product.id);
  const badgeText = (product.badges && product.badges.length > 0) ? product.badges[0] : (product.gsm || "380 GSM");
  const fitText = product.fit || product.categoryLabel || "Boxy Fit";
  const ratingText = product.rating ? `★ ${product.rating}` : "★ 4.9";

  return `
    <div class="col-6 col-md-3">
      <div class="search-card" data-product-id="${product.id}">
        <div class="search-card-img-wrapper">
          <img src="${img}" alt="${product.name}" class="search-card-img" loading="lazy">
          <button type="button" class="search-card-heart-btn ${isWishlisted ? 'active' : ''}" data-product-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="Wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWishlisted ? '#dc2626' : 'none'}" stroke="${isWishlisted ? '#dc2626' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <span class="search-card-badge">${badgeText}</span>
        </div>
        <div class="search-card-info">
          <div class="search-card-title-row">
            <span class="search-card-title" title="${product.name}">${product.name}</span>
            <span class="search-card-rating">${ratingText}</span>
          </div>
          <div class="search-card-subtitle">${fitText}</div>
          <div class="search-card-price">${formatPrice(product.price)}</div>
        </div>
      </div>
    </div>
  `;
}

function bindSearchCardEvents(container) {
  if (!container) return;
  // Card click -> PDP Modal
  container.querySelectorAll(".search-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".search-card-heart-btn")) return;
      const pid = card.getAttribute("data-product-id");
      closeSearchDrawer();
      openProductModal(pid);
    });
  });

  // Heart click -> Wishlist toggle
  container.querySelectorAll(".search-card-heart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!Auth.isUserLoggedIn()) {
        Auth.requireLogin("Wishlist");
        return;
      }
      const pid = btn.getAttribute("data-product-id");
      Store.toggleWishlist(pid);
      const isWishlisted = Store.state.wishlist && Store.state.wishlist.includes(pid);
      btn.classList.toggle("active", isWishlisted);
      const svg = btn.querySelector("svg");
      if (svg) {
        svg.setAttribute("fill", isWishlisted ? "#dc2626" : "none");
        svg.setAttribute("stroke", isWishlisted ? "#dc2626" : "currentColor");
      }
    });
  });
}

function renderSearchBestSellers() {
  const container = document.getElementById("search-bestsellers-grid");
  if (!container) return;
  const bestSellers = activeProducts.slice(0, 4);
  container.innerHTML = bestSellers.map(renderSearchProductCard).join("");
  bindSearchCardEvents(container);
}

function renderLiveSearchResults(query) {
  const bestSellersWrapper = document.getElementById("search-bestsellers-wrapper");
  const resultsWrapper = document.getElementById("search-results-wrapper");
  const resultsGrid = document.getElementById("search-results-grid");
  const resultsCount = document.getElementById("search-results-count");
  const resultsHeading = document.getElementById("search-results-heading");
  const clearBtn = document.getElementById("clear-search-btn");

  const q = (query || "").toLowerCase().trim();

  if (clearBtn) clearBtn.style.display = q ? "flex" : "none";

  if (q.length === 0) {
    if (bestSellersWrapper) bestSellersWrapper.style.display = "block";
    if (resultsWrapper) resultsWrapper.style.display = "none";
    return;
  }

  if (bestSellersWrapper) bestSellersWrapper.style.display = "none";
  if (resultsWrapper) resultsWrapper.style.display = "block";

  const matches = activeProducts.filter(p => {
    const nameMatch = (p.name || "").toLowerCase().includes(q);
    const catMatch = (p.category || "").toLowerCase().includes(q) || (p.categoryLabel || "").toLowerCase().includes(q);
    const gsmMatch = (p.gsm || "").toLowerCase().includes(q);
    const fitMatch = (p.fit || "").toLowerCase().includes(q);
    const descMatch = (p.description || "").toLowerCase().includes(q);
    return nameMatch || catMatch || gsmMatch || fitMatch || descMatch;
  });

  if (resultsHeading) resultsHeading.textContent = `RESULTS FOR "${q.toUpperCase()}"`;
  if (resultsCount) resultsCount.textContent = `${matches.length} ${matches.length === 1 ? 'ITEM' : 'ITEMS'}`;

  if (!resultsGrid) return;

  if (matches.length === 0) {
    resultsGrid.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="font-mono text-muted small text-uppercase mb-2">NO PRODUCTS MATCHING "${q.toUpperCase()}"</div>
        <p class="text-secondary small mb-3">Try searching for keywords like "tee", "shorts", "blackout", or "380 GSM".</p>
        <button type="button" class="btn btn-outline-dark rounded-0 font-mono small px-3 py-2" id="btn-search-empty-clear">
          CLEAR AND VIEW BEST SELLERS
        </button>
      </div>
    `;
    const emptyClearBtn = document.getElementById("btn-search-empty-clear");
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener("click", () => {
        const input = document.getElementById("search-input");
        if (input) {
          input.value = "";
          renderLiveSearchResults("");
          input.focus();
        }
      });
    }
    return;
  }

  resultsGrid.innerHTML = matches.map(renderSearchProductCard).join("");
  bindSearchCardEvents(resultsGrid);
}

function setupSearchDrawer() {
  const el = document.getElementById("searchOffcanvas") || document.getElementById("searchModal");
  if (el && window.bootstrap) {
    if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
      searchDrawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    } else {
      searchDrawerInstance = bootstrap.Modal.getOrCreateInstance(el);
    }
  }

  document.querySelectorAll(".open-search-trigger, #open-search-btn").forEach(btn => {
    btn.removeEventListener("click", handleSearchTriggerClick);
    btn.addEventListener("click", handleSearchTriggerClick);
  });

  window.removeEventListener("keydown", handleSearchKeyboardShortcut);
  window.addEventListener("keydown", handleSearchKeyboardShortcut);

  const searchInput = document.getElementById("search-input") || document.getElementById("search-modal-input");
  const clearBtn = document.getElementById("clear-search-btn");

  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      renderLiveSearchResults("");
      searchInput.focus();
    });
  }

  // Trending Searches Click Handlers (Gymshark Style)
  document.querySelectorAll(".trending-search-item").forEach(item => {
    item.addEventListener("click", () => {
      const term = item.getAttribute("data-search-term") || item.textContent.trim();
      if (searchInput) {
        searchInput.value = term;
        if (clearBtn) clearBtn.style.display = "flex";
        renderLiveSearchResults(term);
        searchInput.focus();
      }
    });
  });

  // Legacy search-tag-pill support
  document.querySelectorAll(".search-tag-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".search-tag-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const tag = pill.getAttribute("data-search-tag") || "";
      if (searchInput) {
        searchInput.value = tag;
        if (clearBtn) clearBtn.style.display = tag ? "flex" : "none";
      }
      renderLiveSearchResults(tag);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      renderLiveSearchResults(q);
    });
  }

  // Pre-render bestsellers into search overlay
  renderSearchBestSellers();
}

function renderSearchResults(query) {
  renderLiveSearchResults(query);
}

function setupSearchModal() {
  return setupSearchDrawer();
}

/* ==========================================================================
   Slide-Over Wishlist Drawer (Offcanvas-End & Modal Fallback)
   ========================================================================== */
let wishlistDrawerInstance = null;

function closeWishlistDrawer() {
  const el = document.getElementById("wishlistOffcanvas") || document.getElementById("wishlistModal");
  if (el && window.bootstrap) {
    if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
      const inst = bootstrap.Offcanvas.getInstance(el) || wishlistDrawerInstance;
      if (inst) inst.hide();
    } else {
      const inst = bootstrap.Modal.getInstance(el) || wishlistDrawerInstance;
      if (inst) inst.hide();
    }
  }
}

function openWishlistDrawer() {
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Saved wishlist vault is disabled for Seller accounts.");
    return;
  }
  if (!Auth.isUserLoggedIn()) {
    Auth.requireLogin("Wishlist Vault (Heart)", () => openWishlistDrawer());
    return;
  }
  const el = document.getElementById("wishlistOffcanvas") || document.getElementById("wishlistModal");
  closeAllDrawers(el);
  updateHeaderDrawerMetrics();
  renderWishlistContents();
  if (!el || !window.bootstrap) return;

  if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
    wishlistDrawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    wishlistDrawerInstance.show();
  } else {
    wishlistDrawerInstance = bootstrap.Modal.getOrCreateInstance(el);
    wishlistDrawerInstance.show();
  }
}

function handleWishlistTriggerClick(e) {
  e.preventDefault();
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Saved wishlist vault is disabled for Seller accounts.");
    return;
  }
  if (!Auth.isUserLoggedIn()) {
    Auth.requireLogin("Wishlist Vault (Heart)", () => openWishlistDrawer());
    return;
  }
  const el = document.getElementById("wishlistOffcanvas") || document.getElementById("wishlistModal");
  if (el && el.classList.contains("show")) {
    closeWishlistDrawer();
  } else {
    openWishlistDrawer();
  }
}
window.openWishlistDrawer = openWishlistDrawer;
window.closeWishlistDrawer = closeWishlistDrawer;

function setupWishlistDrawer() {
  const el = document.getElementById("wishlistOffcanvas") || document.getElementById("wishlistModal");
  if (el && window.bootstrap) {
    if (el.classList.contains("offcanvas") || el.id.includes("Offcanvas")) {
      wishlistDrawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    } else {
      wishlistDrawerInstance = bootstrap.Modal.getOrCreateInstance(el);
    }
  }

  document.querySelectorAll(".open-wishlist-trigger, #open-wishlist-btn").forEach(btn => {
    btn.removeEventListener("click", handleWishlistTriggerClick);
    btn.addEventListener("click", handleWishlistTriggerClick);
  });

  const clearBtn = document.getElementById("clear-wishlist-btn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      Store.state.wishlist = [];
      Store.saveWishlist();
      renderWishlistContents();
      updateHeaderBadges();
      showToast("Cleared all saved wishlist items.");
    };
  }

  const moveAllBtn = document.getElementById("move-all-wishlist-to-bag");
  const footerActions = document.getElementById("wishlist-footer-actions");
  if (Auth.isSellerMode()) {
    if (moveAllBtn) moveAllBtn.style.display = "none";
    if (footerActions) footerActions.style.display = "none";
  } else {
    if (moveAllBtn) moveAllBtn.style.display = "";
  }
  if (moveAllBtn) {
    moveAllBtn.onclick = () => {
      if (Auth.isSellerMode()) {
        showToast("SELLER PREVIEW: Moving items to bag is disabled for Seller accounts.");
        return;
      }
      if (!Auth.isUserLoggedIn()) {
        Auth.requireLogin("Shopping Bag (Bag)");
        return;
      }
      const savedIds = [...(Store.state.wishlist || [])];
      if (savedIds.length === 0) {
        showToast("No items in wishlist to move.");
        return;
      }
      savedIds.forEach(id => {
        const prod = activeProducts.find(p => p.id === id) || products.find(p => p.id === id);
        if (prod) {
          Store.addToCart(prod, prod.sizes?.[0]?.size || "L");
        }
      });
      Store.state.wishlist = [];
      Store.saveWishlist();
      renderWishlistContents();
      updateHeaderBadges();
      if (wishlistDrawerInstance) wishlistDrawerInstance.hide();
      openBagDrawer();
      showToast("Moved all saved garments to your bag!");
    };
  }

  renderWishlistContents();
}

function renderWishlistContents() {
  const container = document.getElementById("wishlist-items-container") || document.getElementById("wishlist-modal-items");
  const emptyState = document.getElementById("wishlist-empty-state");
  const footerActions = document.getElementById("wishlist-footer-actions");
  const drawerCount = document.getElementById("wishlist-drawer-count");

  const savedIds = Store.state.wishlist || [];
  const items = activeProducts.filter(p => savedIds.includes(p.id));

  if (drawerCount) {
    drawerCount.textContent = items.length;
  }

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (footerActions) footerActions.style.display = "none";
  } else {
    if (emptyState) emptyState.style.display = "none";
    if (footerActions) footerActions.style.display = Auth.isSellerMode() ? "none" : "block";

    const isSeller = Auth.isSellerMode();
    container.innerHTML = items.map(p => {
      const img = (p.images && p.images.primary) ? p.images.primary : (typeof p.images === "string" ? p.images : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif");
      return `
        <div class="wishlist-item-row p-3 border-bottom d-flex align-items-center gap-3">
          <img src="${img}" alt="${p.name}" style="width: 60px; height: 75px; object-fit: cover;" class="border flex-shrink-0">
          <div class="flex-grow-1 min-w-0">
            <div class="fw-bold font-brand text-uppercase fs-6 text-truncate mb-1">${p.name}</div>
            <div class="font-mono text-muted small mb-2">${p.gsm || ''} • ${formatPrice(p.price)}</div>
            <div class="d-flex gap-2">
              ${isSeller ? '' : `
              <button class="btn btn-ss-dark btn-sm rounded-0 font-mono quick-add-wishlist-btn" data-product-id="${p.id}" style="font-size:0.7rem; padding: 4px 10px;">
                ADD TO BAG
              </button>
              `}
              <button class="btn btn-outline-danger btn-sm rounded-0 remove-wishlist-btn" data-product-id="${p.id}" title="Remove from wishlist" style="font-size:0.7rem; padding: 4px 8px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".quick-add-wishlist-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (Auth.isSellerMode()) {
          showToast("SELLER PREVIEW: Adding items to bag is disabled for Seller accounts.");
          return;
        }
        if (!Auth.isUserLoggedIn()) {
          Auth.requireLogin("Shopping Bag (Bag)");
          return;
        }
        const pId = btn.getAttribute("data-product-id");
        const prod = activeProducts.find(p => p.id === pId) || products.find(p => p.id === pId);
        if (prod) {
          Store.addToCart(prod, prod.sizes?.[0]?.size || "L");
          showToast(`Added ${prod.name} to your bag.`);
          if (wishlistDrawerInstance) wishlistDrawerInstance.hide();
          openBagDrawer();
        }
      });
    });

    container.querySelectorAll(".remove-wishlist-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-product-id");
        Store.toggleWishlist(pId);
        renderWishlistContents();
        updateHeaderBadges();
      });
    });
  }
}

function setupWishlistModal() {
  return setupWishlistDrawer();
}

/* ==========================================================================
   Checkout Simulation Modal
   ========================================================================== */
let checkoutModalInstance = null;

function setupCheckoutModal() {
  const el = document.getElementById("checkoutModal");
  if (el && window.bootstrap) {
    checkoutModalInstance = bootstrap.Modal.getOrCreateInstance(el);
  }

  document.querySelectorAll("#bag-checkout-btn, #btn-proceed-checkout").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      if (Auth.isSellerMode()) return;
      if (!Auth.isUserLoggedIn()) {
        Auth.requireLogin("Checkout", () => openCheckoutModal());
        return;
      }
      if (bagOffcanvas) bagOffcanvas.hide();
      openCheckoutModal();
    };
  });

  const form = document.getElementById("checkout-form") || document.getElementById("checkout-shipping-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      completeCheckout();
    });
  }
}

function openCheckoutModal() {
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Checkout is disabled for Seller/Admin accounts.");
    return;
  }
  if (!Auth.isUserLoggedIn()) {
    Auth.requireLogin("Checkout", () => openCheckoutModal());
    return;
  }

  const totals = Store.getTotals();
  const summaryEl = document.getElementById("checkout-order-summary");
  if (summaryEl) {
    summaryEl.innerHTML = Store.state.cart.map(item => `
      <div class="d-flex justify-content-between small py-1 border-bottom">
        <span>${item.name} (${item.size}) × ${item.quantity}</span>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
    `).join("") + `
      <div class="d-flex justify-content-between pt-2 fw-bold">
        <span>TOTAL DUE:</span>
        <span>${formatPrice(totals.total)}</span>
      </div>
    `;
  }

  // Pre-fill with authenticated athlete data if session is active
  const currentUser = Auth.getUser();
  if (currentUser) {
    const form = document.getElementById("checkout-form") || document.getElementById("checkout-shipping-form");
    if (form) {
      const inputs = form.querySelectorAll("input");
      if (inputs[0] && (!inputs[0].value || inputs[0].value === "Marcus Vance")) {
        inputs[0].value = currentUser.name;
      }
      if (inputs[1] && (!inputs[1].value || inputs[1].value === "athlete@superscience.test")) {
        inputs[1].value = currentUser.email;
      }
    }
  }

  const el = document.getElementById("checkoutModal");
  if (!checkoutModalInstance && el && window.bootstrap) {
    checkoutModalInstance = bootstrap.Modal.getOrCreateInstance(el);
  }
  if (checkoutModalInstance) checkoutModalInstance.show();
}

async function completeCheckout() {
  if (Auth.isSellerMode()) {
    showToast("SELLER PREVIEW: Orders cannot be placed from a Seller account.");
    return;
  }

  const confirmationBox = document.getElementById("checkout-confirmation-view");
  const formBox = document.getElementById("checkout-form-view");
  const orderId = "SS-ORD-" + Math.floor(100000 + Math.random() * 900000);

  const currentUser = Auth.getUser();
  const form = document.getElementById("checkout-form") || document.getElementById("checkout-shipping-form");
  let customerName = currentUser ? currentUser.name : "Guest Athlete";
  let customerEmail = currentUser ? currentUser.email : "guest@superscience.test";
  let customerAddress = "Central Warehouse Delivery";
  let customerCity = "Central";

  if (form) {
    const inputs = form.querySelectorAll("input");
    if (inputs[0] && inputs[0].value) customerName = inputs[0].value.trim();
    if (inputs[1] && inputs[1].value) customerEmail = inputs[1].value.trim();
    if (inputs[2] && inputs[2].value) customerAddress = inputs[2].value.trim();
    if (inputs[3] && inputs[3].value) customerCity = inputs[3].value.trim();
  }

  const totals = Store.getTotals();
  const items = Store.state.cart.map(i => ({
    id: i.id,
    name: i.name,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    price: i.price
  }));

  try {
    await API.createOrder({
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_address: customerAddress,
      customer_city: customerCity,
      customer_country: "Philippines / Worldwide Express",
      items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      promo_code: Store.state.promoCode
    });
  } catch (err) {
    console.warn("[Checkout] Order record sync warning:", err);
  }

  const idEl = document.getElementById("confirmed-order-id");
  const dateEl = document.getElementById("confirmed-order-date");
  if (idEl) idEl.textContent = orderId;
  if (dateEl) dateEl.textContent = new Date().toUTCString();

  if (formBox) formBox.style.display = "none";
  if (confirmationBox) confirmationBox.style.display = "block";

  Store.clearCart();
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-ss animate__animated animate__fadeInUp";
  toast.innerHTML = `
    <span class="font-mono" style="font-size:0.75rem;">[SYSTEM]</span>
    <span class="small">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// Global window helpers for HTML event handlers & cross-page navigation
window.showToast = showToast;
window.openBagDrawer = openBagDrawer;
window.openSearchDrawer = openSearchDrawer;
window.openSearch = openSearchDrawer;
window.openWishlistDrawer = openWishlistDrawer;
window.openWishlist = openWishlistDrawer;
window.openProductModal = openProductModal;
window.openWorkoutModal = openWorkoutModal;
window.setCategoryFilter = setCategoryFilter;
window.setProgramFilter = setProgramFilter;
window.activeProducts = activeProducts;
window.fetchLiveProducts = fetchLiveProducts;
window.Auth = Auth;
window.openAuthModal = (t) => Auth.openAuthModal(t);
window.setupSellerModeUI = setupSellerModeUI;
window.isSellerMode = () => Auth.isSellerMode();
window.exitSellerMode = () => Auth.exitSellerMode();

// Boot application after all variables, state, and modules are initialized
function boot() {
  Store.init();
  updateHeaderDrawerMetrics();
  initApp();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
