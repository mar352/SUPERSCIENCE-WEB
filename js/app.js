// SUPERSCIENCE - Application Logic & E-Commerce Interaction Engine
import { products } from "./products.js";
import { workoutPrograms } from "./programs.js";
import { Store, formatPrice } from "./store.js";
import { API } from "./api.js";

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

// Global listeners to keep drawer top perfectly synchronized with the header
window.addEventListener("resize", updateHeaderDrawerMetrics);
window.addEventListener("scroll", updateHeaderDrawerMetrics, { passive: true });
document.addEventListener("show.bs.offcanvas", updateHeaderDrawerMetrics);

document.addEventListener("DOMContentLoaded", () => {
  Store.init();
  updateHeaderDrawerMetrics();
  initApp();
});

let currentCategory = "all";
let currentSort = "featured";
let currentGridView = 4; // 4 columns desktop default
let currentProgramFilter = "all";

function normalizeCategory(cat) {
  if (!cat) return "all";
  const c = cat.toLowerCase();
  if (c === "tees" || c === "tshirt" || c === "t-shirts" || c === "t-shirt") return "tshirts";
  if (c === "cap" || c === "hat" || c === "accessories") return "caps";
  if (c === "short") return "shorts";
  return c;
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

  // Listen to store updates
  window.addEventListener("superscience:state-updated", () => {
    updateHeaderBadges();
    renderBagContents();
    renderWishlistContents();
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
   Science-Based Workout Programs Showcase (Featured on Home Page)
   ========================================================================== */
function renderWorkoutPrograms() {
  const container = document.getElementById("workout-programs-grid");
  if (!container) return;

  const filtered = workoutPrograms.filter(p => {
    if (currentProgramFilter === "all") return true;
    return p.split === currentProgramFilter;
  });

  container.innerHTML = filtered.map(prog => `
    <div class="col-12 col-md-6 col-lg-4 mb-4">
      <div class="program-card">
        <div class="program-img-wrapper">
          <img src="${prog.image}" alt="${prog.title}">
          <div class="program-badge">${prog.frequency}</div>
        </div>
        <div class="program-body">
          <div class="program-title">${prog.title}</div>
          <div class="text-muted small mb-3">${prog.subtitle}</div>
          
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

  let list = [...products];

  // Category filter
  if (currentCategory !== "all") {
    const norm = normalizeCategory(currentCategory);
    list = list.filter(p => p.category === norm);
  }

  // Sorting
  if (currentSort === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (currentSort === "gsm") {
    list.sort((a, b) => parseInt(b.gsm) - parseInt(a.gsm));
  }

  // Dynamic specimens counter badge
  const countBadge = document.getElementById("catalog-specimens-count");
  if (countBadge) {
    countBadge.textContent = `${list.length} SPECIMENS`;
  }

  // Grid column classes
  const colClass = currentGridView === 2 ? "col-6 col-md-6" : "col-6 col-md-4 col-lg-3";

  grid.innerHTML = list.map(product => {
    const inWishlist = Store.isInWishlist(product.id);
    return `
      <div class="${colClass} mb-4">
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-image-container">
            <img class="product-img" src="${product.images.primary}" alt="${product.name}">
            
            <button class="wishlist-btn-card ${inWishlist ? 'active' : ''}" data-product-id="${product.id}" title="Save to Wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${inWishlist ? '#000' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            ${product.badges && product.badges.length > 0 ? `
              <div class="product-badge-tag">${product.badges[0]}</div>
            ` : ''}

            <!-- Gymshark Hover Quick-Size Bar -->
            <div class="quick-size-bar">
              <span class="small font-mono text-muted me-1 d-none d-sm-inline" style="line-height:28px;">SIZE:</span>
              ${product.sizes.map(s => `
                <button class="quick-size-btn" data-product-id="${product.id}" data-size="${s.size}" ${!s.inStock ? 'disabled' : ''}>
                  ${s.size}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="pt-2">
            <!-- Swatches -->
            <div class="swatch-group">
              ${product.colors.map((c, i) => `
                <div class="swatch-dot ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}" data-color-name="${c.name}"></div>
              `).join('')}
            </div>

            <div class="product-title open-pdp-trigger" data-product-id="${product.id}">${product.name}</div>
            <div class="product-spec-line">${product.gsm} • ${product.fit}</div>
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

  const list = products.slice(0, 4);

  grid.innerHTML = list.map(product => {
    const inWishlist = Store.isInWishlist(product.id);
    return `
      <div class="col-6 col-md-3 mb-4">
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-image-container">
            <img class="product-img" src="${product.images.primary}" alt="${product.name}">
            
            <button class="wishlist-btn-card ${inWishlist ? 'active' : ''}" data-product-id="${product.id}" title="Save to Wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${inWishlist ? '#000' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            ${product.badges && product.badges.length > 0 ? `
              <div class="product-badge-tag">${product.badges[0]}</div>
            ` : ""}

            <div class="quick-size-bar">
              <div class="quick-size-label">QUICK ADD</div>
              <div class="quick-size-options">
                ${product.sizes.map(s => `
                  <button class="quick-size-btn" data-product-id="${product.id}" data-size="${s.size}">${s.size}</button>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="product-info">
            <div class="product-swatches">
              ${product.colors.map((c, i) => `
                <span class="product-swatch ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}"></span>
              `).join("")}
            </div>

            <div class="product-title open-pdp-trigger" data-product-id="${product.id}">${product.name}</div>
            <div class="product-spec-line">${product.gsm} • ${product.fit}</div>
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
      const pId = btn.getAttribute("data-product-id");
      const size = btn.getAttribute("data-size");
      const product = products.find(p => p.id === pId);
      if (product) {
        Store.addToCart(product, size);
        showToast(`Added ${product.name} (Size ${size}) to your bag.`);
        openBagDrawer();
      }
    });
  });

  // Wishlist Button
  document.querySelectorAll(".wishlist-btn-card").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pId = btn.getAttribute("data-product-id");
      const added = Store.toggleWishlist(pId);
      btn.classList.toggle("active", added);
      btn.querySelector("svg").setAttribute("fill", added ? "#000" : "none");
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
  openBagDrawer();
}

function openBagDrawer() {
  updateHeaderDrawerMetrics();
  const el = document.getElementById("offcanvasBag") || document.getElementById("bagOffcanvas");
  if (!bagOffcanvas && el && window.bootstrap) {
    bagOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
  }
  if (bagOffcanvas) {
    bagOffcanvas.show();
    renderBagContents();
  }
}

function renderBagContents() {
  const container = document.getElementById("bag-items-list");
  const emptyState = document.getElementById("bag-empty-state");
  const trackerMsg = document.getElementById("free-shipping-msg");
  const trackerFill = document.getElementById("free-shipping-fill");
  const subtotalEl = document.getElementById("bag-subtotal-price");
  const discountRow = document.getElementById("bag-discount-row");
  const discountEl = document.getElementById("bag-discount-price");
  const totalEl = document.getElementById("bag-total-price");
  const checkoutBtn = document.getElementById("bag-checkout-btn");

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
  const prog = workoutPrograms.find(p => p.id === progId);
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
    const recommendedProduct = products.find(p => p.id === prog.apparelRecommendation.productId);
    apparelBox.innerHTML = `
      <div class="p-3 border bg-light d-flex align-items-center justify-content-between">
        <div>
          <span class="badge bg-black font-mono me-2">TRAIN IN THIS</span>
          <strong>${prog.apparelRecommendation.name}</strong>
          <div class="small text-muted mt-1">${prog.apparelRecommendation.reason}</div>
        </div>
        ${recommendedProduct ? `
          <button class="btn btn-ss-dark btn-sm rounded-0 text-nowrap ms-3 quick-add-apparel-btn" data-product-id="${recommendedProduct.id}">
            QUICK ADD TO BAG (${formatPrice(recommendedProduct.price)})
          </button>
        ` : ''}
      </div>
    `;

    const addBtn = apparelBox.querySelector(".quick-add-apparel-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
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
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modalEl = document.getElementById("productDetailModal");
  if (!productModalInstance && modalEl && window.bootstrap) {
    productModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  }
  if (!productModalInstance) return;

  activeModalProduct = product;
  activeModalColor = product.colors[0].name;
  activeModalSize = product.sizes[0].size;

  const titleEl = document.getElementById("pdp-modal-title");
  if (titleEl) titleEl.textContent = product.name;
  const priceEl = document.getElementById("pdp-modal-price");
  if (priceEl) priceEl.textContent = formatPrice(product.price);
  const descEl = document.getElementById("pdp-modal-desc");
  if (descEl) descEl.textContent = product.description;
  const gsmEl = document.getElementById("pdp-modal-gsm");
  if (gsmEl) gsmEl.textContent = product.gsm;
  const fitEl = document.getElementById("pdp-modal-fit");
  if (fitEl) fitEl.textContent = product.fit;
  const fabricEl = document.getElementById("pdp-modal-fabric");
  if (fabricEl) fabricEl.textContent = product.fabric;
  const workoutTieInEl = document.getElementById("pdp-modal-workout-tiein");
  if (workoutTieInEl) workoutTieInEl.textContent = product.workoutTieIn;

  // Main Image
  const imgEl = document.getElementById("pdp-modal-main-img");
  if (imgEl) imgEl.src = product.images.primary;

  // Color Swatches (supports both pdp-modal-colors and pdp-modal-swatches)
  const colorContainer = document.getElementById("pdp-modal-colors") || document.getElementById("pdp-modal-swatches");
  if (colorContainer) {
    colorContainer.innerHTML = product.colors.map(c => `
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
    sizeContainer.innerHTML = product.sizes.map(s => `
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
    addToBagBtn.onclick = () => {
      Store.addToCart(activeModalProduct, activeModalSize, activeModalColor);
      showToast(`Added ${activeModalProduct.name} (${activeModalSize}) to your bag.`);
      productModalInstance.hide();
      openBagDrawer();
    };
  }

  productModalInstance.show();
}

/* ==========================================================================
   Slide-Over Search Drawer (Offcanvas-End & Modal Fallback)
   ========================================================================== */
let searchDrawerInstance = null;

function openSearchDrawer() {
  updateHeaderDrawerMetrics();
  const el = document.getElementById("searchOffcanvas") || document.getElementById("searchModal");
  if (!el || !window.bootstrap) return;

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
  }, 300);
}

function handleSearchTriggerClick(e) {
  e.preventDefault();
  openSearchDrawer();
}

function handleSearchKeyboardShortcut(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openSearchDrawer();
  }
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
      renderSearchResults("");
      searchInput.focus();
    });
  }

  // Quick tag suggestions
  document.querySelectorAll(".search-tag-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".search-tag-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const tag = pill.getAttribute("data-search-tag") || "";
      if (searchInput) {
        searchInput.value = tag;
        if (clearBtn) clearBtn.style.display = tag ? "block" : "none";
      }
      renderSearchResults(tag);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";
      renderSearchResults(q);
    });
  }
}

function renderSearchResults(query) {
  const searchResults = document.getElementById("search-results-list");
  if (!searchResults) return;

  const q = (query || "").toLowerCase().trim();
  if (q.length === 0) {
    searchResults.innerHTML = `
      <div class="p-4 text-center text-muted small font-mono">
        Type above or select a tag to filter garments instantly.
      </div>
    `;
    return;
  }

  const matches = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const catMatch = (p.category || "").toLowerCase().includes(q) || (p.categoryLabel || "").toLowerCase().includes(q);
    const gsmMatch = (p.gsm || "").toLowerCase().includes(q);
    const descMatch = (p.description || "").toLowerCase().includes(q);
    return nameMatch || catMatch || gsmMatch || descMatch;
  });

  if (matches.length === 0) {
    searchResults.innerHTML = `
      <div class="p-4 text-center text-muted small font-mono">
        NO SPECIMEN MATCHES FOUND FOR "${q.toUpperCase()}".
      </div>
    `;
    return;
  }

  searchResults.innerHTML = matches.map(p => `
    <div class="search-match-item p-3 border-bottom d-flex align-items-center justify-content-between cursor-pointer" data-product-id="${p.id}" style="cursor: pointer; transition: background 0.15s ease;">
      <div class="d-flex align-items-center gap-3">
        <img src="${p.images.primary}" alt="${p.name}" style="width: 50px; height: 60px; object-fit: cover;" class="border">
        <div>
          <div class="font-brand fw-bold text-dark fs-6">${p.name}</div>
          <div class="text-muted font-mono" style="font-size:0.75rem;">${p.gsm || ''} • ${formatPrice(p.price)}</div>
        </div>
      </div>
      <button class="btn btn-outline-dark btn-sm rounded-0 font-mono" style="font-size:0.7rem;">VIEW</button>
    </div>
  `).join("");

  searchResults.querySelectorAll(".search-match-item").forEach(item => {
    item.addEventListener("click", () => {
      const pId = item.getAttribute("data-product-id");
      if (searchDrawerInstance) searchDrawerInstance.hide();
      openProductModal(pId);
    });
  });
}

function setupSearchModal() {
  return setupSearchDrawer();
}

/* ==========================================================================
   Slide-Over Wishlist Drawer (Offcanvas-End & Modal Fallback)
   ========================================================================== */
let wishlistDrawerInstance = null;

function openWishlistDrawer() {
  updateHeaderDrawerMetrics();
  renderWishlistContents();
  const el = document.getElementById("wishlistOffcanvas") || document.getElementById("wishlistModal");
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
  openWishlistDrawer();
}

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
      showToast("Cleared all saved wishlist specimens.");
    };
  }

  const moveAllBtn = document.getElementById("move-all-wishlist-to-bag");
  if (moveAllBtn) {
    moveAllBtn.onclick = () => {
      const savedIds = [...(Store.state.wishlist || [])];
      if (savedIds.length === 0) {
        showToast("No items in wishlist to move.");
        return;
      }
      savedIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) {
          Store.addToCart(prod, prod.sizes[0]?.size || "L");
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
  const items = products.filter(p => savedIds.includes(p.id));

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
    if (footerActions) footerActions.style.display = "block";

    container.innerHTML = items.map(p => `
      <div class="wishlist-item-row p-3 border-bottom d-flex align-items-center gap-3">
        <img src="${p.images.primary}" alt="${p.name}" style="width: 60px; height: 75px; object-fit: cover;" class="border flex-shrink-0">
        <div class="flex-grow-1 min-w-0">
          <div class="fw-bold font-brand text-uppercase fs-6 text-truncate mb-1">${p.name}</div>
          <div class="font-mono text-muted small mb-2">${p.gsm || ''} • ${formatPrice(p.price)}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-ss-dark btn-sm rounded-0 font-mono quick-add-wishlist-btn" data-product-id="${p.id}" style="font-size:0.7rem; padding: 4px 10px;">
              ADD TO BAG
            </button>
            <button class="btn btn-outline-danger btn-sm rounded-0 remove-wishlist-btn" data-product-id="${p.id}" title="Remove from wishlist" style="font-size:0.7rem; padding: 4px 8px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".quick-add-wishlist-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-product-id");
        const prod = products.find(p => p.id === pId);
        if (prod) {
          Store.addToCart(prod, prod.sizes[0]?.size || "L");
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

  const proceedBtn = document.getElementById("bag-checkout-btn");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (bagOffcanvas) bagOffcanvas.hide();
      openCheckoutModal();
    });
  }

  const form = document.getElementById("checkout-form") || document.getElementById("checkout-shipping-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      completeCheckout();
    });
  }
}

function openCheckoutModal() {
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
  const el = document.getElementById("checkoutModal");
  if (!checkoutModalInstance && el && window.bootstrap) {
    checkoutModalInstance = bootstrap.Modal.getOrCreateInstance(el);
  }
  if (checkoutModalInstance) checkoutModalInstance.show();
}

function completeCheckout() {
  const confirmationBox = document.getElementById("checkout-confirmation-view");
  const formBox = document.getElementById("checkout-form-view");
  const orderId = "SS-ORD-" + Math.floor(100000 + Math.random() * 900000);

  document.getElementById("confirmed-order-id").textContent = orderId;
  document.getElementById("confirmed-order-date").textContent = new Date().toUTCString();

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
