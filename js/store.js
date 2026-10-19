// SUPERSCIENCE - Reactive Store State (Cart, Wishlist, Currency & Promo Engine)

const STORAGE_KEYS = {
  CART: "superscience_cart_v1",
  WISHLIST: "superscience_wishlist_v1"
};

const FREE_SHIPPING_THRESHOLD = 8500.00; // Free worldwide express dispatch over ₱8,500

/**
 * Formats numeric values to Philippine Peso (PHP / ₱)
 * Example: 4200 => "₱4,200.00"
 */
export function formatPrice(amount) {
  const num = Number(amount) || 0;
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Make accessible globally for non-module scripts
if (typeof window !== "undefined") {
  window.formatPrice = formatPrice;
}

export const Store = {
  state: {
    cart: [],
    wishlist: [],
    promoCode: null,
    discountAmount: 0
  },

  init() {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) this.state.cart = JSON.parse(savedCart);

      const savedWishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (savedWishlist) this.state.wishlist = JSON.parse(savedWishlist);
    } catch (e) {
      console.error("Storage error:", e);
    }
  },

  saveCart() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.state.cart));
    this.notifyUpdate();
  },

  saveWishlist() {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(this.state.wishlist));
    this.notifyUpdate();
  },

  isSellerModeActive() {
    if (typeof window !== "undefined") {
      if (window.Auth && typeof window.Auth.isSellerMode === "function") {
        return window.Auth.isSellerMode();
      }
      if (typeof window.isSellerMode === "function") {
        return window.isSellerMode();
      }
    }
    return false;
  },

  addToCart(product, size = "L", color = null, quantity = 1) {
    if (this.isSellerModeActive()) {
      if (window.showToast) {
        window.showToast("SELLER ACCOUNT: You cannot add items to bag as a Seller.");
      }
      return false;
    }

    if (typeof window !== "undefined" && window.Auth && typeof window.Auth.isUserLoggedIn === "function") {
      if (!window.Auth.isUserLoggedIn()) {
        if (typeof window.Auth.requireLogin === "function") {
          window.Auth.requireLogin("Shopping Bag (Bag)");
        }
        return false;
      }
    }

    const selectedColor = color || (product.colors && product.colors[0] ? product.colors[0].name : "Standard");
    const existingIndex = this.state.cart.findIndex(
      item => item.id === product.id && item.size === size && item.color === selectedColor
    );

    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += quantity;
    } else {
      this.state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: size,
        color: selectedColor,
        quantity: quantity,
        image: product.images && product.images.primary ? product.images.primary : "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif",
        fit: product.fit,
        gsm: product.gsm
      });
    }

    this.saveCart();
    return true;
  },

  updateQuantity(index, newQty) {
    if (newQty <= 0) {
      this.state.cart.splice(index, 1);
    } else {
      this.state.cart[index].quantity = newQty;
    }
    this.saveCart();
  },

  removeFromCart(index) {
    this.state.cart.splice(index, 1);
    this.saveCart();
  },

  clearCart() {
    this.state.cart = [];
    this.state.promoCode = null;
    this.state.discountAmount = 0;
    this.saveCart();
  },

  toggleWishlist(productId) {
    if (this.isSellerModeActive()) {
      if (window.showToast) {
        window.showToast("SELLER ACCOUNT: You cannot heart or wishlist items as a Seller.");
      }
      return false;
    }

    if (typeof window !== "undefined" && window.Auth && typeof window.Auth.isUserLoggedIn === "function") {
      if (!window.Auth.isUserLoggedIn()) {
        if (typeof window.Auth.requireLogin === "function") {
          window.Auth.requireLogin("Wishlist (Heart)");
        }
        return false;
      }
    }

    const idx = this.state.wishlist.indexOf(productId);
    let added = false;
    if (idx > -1) {
      this.state.wishlist.splice(idx, 1);
    } else {
      this.state.wishlist.push(productId);
      added = true;
    }
    this.saveWishlist();
    return added;
  },

  isInWishlist(productId) {
    return this.state.wishlist.includes(productId);
  },

  applyPromoCode(code) {
    const cleanCode = (code || "").trim().toUpperCase();
    if (cleanCode === "SCIENCE10") {
      this.state.promoCode = cleanCode;
      this.state.discountAmount = 0.10; // 10%
      return { success: true, message: "PROMO APPLIED: 10% OFF ENTIRE ORDER" };
    } else if (cleanCode === "DROP01") {
      this.state.promoCode = cleanCode;
      this.state.discountAmount = 1000.00; // ₱1,000 flat drop credit
      return { success: true, message: "PROMO APPLIED: ₱1,000 DROP CREDIT" };
    }
    return { success: false, message: "INVALID PROMO CODE. TRY 'SCIENCE10'" };
  },

  getTotals() {
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (this.state.discountAmount > 0) {
      if (this.state.discountAmount < 1) {
        discount = subtotal * this.state.discountAmount;
      } else {
        discount = Math.min(subtotal, this.state.discountAmount);
      }
    }

    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    const shipping = (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0) ? 0 : 350.00; // ₱350 standard courier
    const total = Math.max(0, subtotal - discount + (subtotal > 0 ? shipping : 0));
    const itemCount = this.state.cart.reduce((count, item) => count + item.quantity, 0);

    return {
      subtotal,
      discount,
      shipping,
      total,
      itemCount,
      freeShippingRemaining,
      freeShippingProgress,
      isFreeShippingUnlocked: subtotal >= FREE_SHIPPING_THRESHOLD
    };
  },

  formatPrice,

  notifyUpdate() {
    window.dispatchEvent(new CustomEvent("superscience:state-updated", {
      detail: this.getTotals()
    }));
  }
};
