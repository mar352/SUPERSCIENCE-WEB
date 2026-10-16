// SUPERSCIENCE - Backend API Client Module
// Connects frontend UI to Node.js Express & PostgreSQL REST endpoints

export const API = {
  baseUrl: '',

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  async getProducts(category = 'all') {
    try {
      const url = category && category !== 'all' 
        ? `${this.baseUrl}/api/products?category=${encodeURIComponent(category)}` 
        : `${this.baseUrl}/api/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[API] Could not fetch products from server, using bundle:', e.message);
      return null;
    }
  },

  async getProduct(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[API] Could not fetch product details:', e.message);
      return null;
    }
  },

  async createOrder(orderPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      return await res.json();
    } catch (e) {
      console.error('[API] Failed to record order:', e);
      return { success: false, error: e.message };
    }
  },

  async getOrders() {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async submitConsultation(consultationPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationPayload)
      });
      return await res.json();
    } catch (e) {
      console.error('[API] Failed to submit consultation:', e);
      return { success: false, error: e.message };
    }
  },

  async submitBooking(bookingPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      return await res.json();
    } catch (e) {
      console.error('[API] Failed to submit booking:', e);
      return { success: false, error: e.message };
    }
  },

  async subscribeNewsletter(email, source = 'footer') {
    try {
      const res = await fetch(`${this.baseUrl}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });
      return await res.json();
    } catch (e) {
      console.error('[API] Failed to subscribe newsletter:', e);
      return { success: false, error: e.message };
    }
  },

  async getStats() {
    try {
      const res = await fetch(`${this.baseUrl}/api/stats`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteOrder(orderId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getConsultations() {
    try {
      const res = await fetch(`${this.baseUrl}/api/consultations`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateConsultationStatus(id, status) {
    try {
      const res = await fetch(`${this.baseUrl}/api/consultations/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getBookings() {
    try {
      const res = await fetch(`${this.baseUrl}/api/bookings`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateBookingStatus(id, status) {
    try {
      const res = await fetch(`${this.baseUrl}/api/bookings/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getNewsletter() {
    try {
      const res = await fetch(`${this.baseUrl}/api/newsletter`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async addProduct(productPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateProduct(id, updates) {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteProduct(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
