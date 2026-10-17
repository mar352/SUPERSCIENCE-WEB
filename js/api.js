// SUPERSCIENCE - Backend API Client Module
// Connects frontend UI to Node.js Express & PostgreSQL REST endpoints

export const API = {
  baseUrl: (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))))
    ? `http://${window.location.hostname || 'localhost'}:3000`
    : '',

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

  async getOrders(email = null) {
    try {
      const url = email 
        ? `${this.baseUrl}/api/orders?email=${encodeURIComponent(email)}` 
        : `${this.baseUrl}/api/orders`;
      const res = await fetch(url);
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
  },

  async uploadImage(base64Data, filename = 'specimen.jpg') {
    try {
      const res = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async seedProducts() {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/seed`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async register(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async adminLogin(email, password) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getMe(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async logout(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async changePassword(currentPassword, newPassword, token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },


  async getUsers() {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /* Customer Support Live Chat */
  async getChatMessages(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async sendChatMessage(message, token, mode = 'admin') {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, mode })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async clearChatMessages(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/messages`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getAdminChatMessages(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chat/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async sendAdminChatMessage(userId, message, token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, message })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteAdminChatThread(userId, token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chat/messages/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },


  /* Workout Protocols Management */
  async getPrograms(split = 'all') {
    try {
      const url = split && split !== 'all'
        ? `${this.baseUrl}/api/programs?split=${encodeURIComponent(split)}`
        : `${this.baseUrl}/api/programs`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[API] Failed to fetch programs from server:', e.message);
      return null;
    }
  },

  async getProgram(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/programs/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async createProgram(programPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programPayload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateProgram(id, updates) {
    try {
      const res = await fetch(`${this.baseUrl}/api/programs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteProgram(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/programs/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async seedPrograms() {
    try {
      const res = await fetch(`${this.baseUrl}/api/programs/seed`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Homepage Hero CMS
  async getHeroSettings() {
    try {
      const res = await fetch(`${this.baseUrl}/api/settings/hero`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateHeroSettings(heroSettings, token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/settings/hero`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(heroSettings)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async resetHeroSettings(token) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/settings/hero/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async uploadHeroPhoto(base64Image, filename) {
    try {
      const res = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image, filename: filename || 'hero-editorial.jpg' })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};


