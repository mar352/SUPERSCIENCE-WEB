// SUPERSCIENCE - Live Customer Support Chat Engine
// Dual Channel: Store Admin (Human Merchant) vs AI Concierge (Chatbot)

import { API } from "./api.js";
import { Auth } from "./auth.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatChatTime(dateString) {
  const d = dateString ? new Date(dateString) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CHIPS_DATA = {
  admin: [
    { label: "💬 Message Store Owner", prompt: "Hello, I would like to speak directly with the store admin regarding an inquiry." },
    { label: "📦 Order Status & Dispatch", prompt: "Can you please check the dispatch status of my recent order?" },
    { label: "📏 Custom Sizing Advice", prompt: "I would like personalized sizing advice from the merchant team." },
    { label: "🏛️ Showroom Private Booking", prompt: "How do I arrange a VIP showroom fitting appointment with your staff?" },
    { label: "🛡️ Return / Exchange Help", prompt: "I would like to request an exchange for an item I ordered." }
  ],
  bot: [
    { label: "📦 Track Order", prompt: "Where is my order and what is the tracking status?" },
    { label: "📏 Sizing Guide", prompt: "What size should I get for the oversized boxy tee?" },
    { label: "🧵 Fabric & Care", prompt: "How do I wash and care for the 380 GSM heavyweight cotton?" },
    { label: "⚡ Workout Splits", prompt: "Which workout program split do you recommend?" },
    { label: "📍 Showroom Info", prompt: "Where is the SUPERSCIENCE showroom located and what are the opening hours?" }
  ]
};

export const Chat = {
  _initialized: false,
  _messages: [],
  _isSending: false,
  _offcanvasInstance: null,
  _currentChannel: 'admin', // Default: 'admin' (Store Admin) or 'bot' (AI Concierge)
  _pollInterval: null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.ensureUI();
    this.bindEvents();

    // Set initial visibility based on current user session
    const isLogged = Auth.isUserLoggedIn();
    this.updateVisibility(isLogged);

    // Listen to global auth state changes
    window.addEventListener("superscience:auth-updated", (e) => {
      const action = e.detail?.action;
      if (action === "user-login") {
        this.updateVisibility(true);
        this.fetchMessages();
      } else if (action === "user-logout") {
        this.updateVisibility(false);
        this.close();
        this.stopPolling();
        this._messages = [];
      }
    });

    // Make global triggers available
    window.openSupportChat = () => this.open();
    window.closeSupportChat = () => this.close();
    window.toggleSupportChat = () => this.toggle();
    // Compatibility aliases
    window.openConciergeChat = () => this.open();
    window.closeConciergeChat = () => this.close();
    window.toggleConciergeChat = () => this.toggle();
    window.openChat = () => this.open();
  },

  updateVisibility(isLoggedIn) {
    const isAdminPage = window.location.pathname.endsWith("admin.html");
    const show = Boolean(isLoggedIn && !isAdminPage);

    // 1. Toggle Navbar chat buttons
    document.querySelectorAll("#navbar-chat-btn, .open-chat-trigger").forEach(btn => {
      btn.style.display = show ? "inline-flex" : "none";
      btn.classList.toggle("is-visible", show);
    });

    // 2. Toggle Mobile nav link
    const mobileLink = document.getElementById("mobile-nav-chat-link");
    if (mobileLink) {
      mobileLink.style.display = show ? "flex" : "none";
    }

    // 3. Ensure floating FAB stays hidden
    const fabBtn = document.getElementById("ss-chat-floating-btn");
    if (fabBtn) {
      fabBtn.style.display = "none";
    }
  },

  ensureUI() {
    // 1. Ensure Navbar Chat Action Button exists in header actions
    let navbarBtn = document.getElementById("navbar-chat-btn");
    if (!navbarBtn) {
      const headerActions = document.querySelector(".navbar .d-flex.align-items-center.gap-2");
      if (headerActions) {
        navbarBtn = document.createElement("button");
        navbarBtn.id = "navbar-chat-btn";
        navbarBtn.className = "header-action-btn open-chat-trigger";
        navbarBtn.type = "button";
        navbarBtn.title = "Customer Support";
        navbarBtn.setAttribute("aria-label", "Open Customer Support");
        navbarBtn.style.display = "none";
        navbarBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        `;
        const bagBtn = headerActions.querySelector("#open-bag-btn");
        if (bagBtn) {
          headerActions.insertBefore(navbarBtn, bagBtn);
        } else {
          headerActions.appendChild(navbarBtn);
        }
      }
    }

    // 2. Offcanvas Chat Drawer
    if (!document.getElementById("offcanvasChat")) {
      const drawer = document.createElement("div");
      drawer.id = "offcanvasChat";
      drawer.className = "offcanvas offcanvas-end offcanvas-drawer offcanvas-chat rounded-0";
      drawer.tabIndex = -1;
      drawer.setAttribute("aria-labelledby", "offcanvasChatLabel");
      drawer.innerHTML = `
        <!-- Drawer Header -->
        <div class="offcanvas-header bg-black text-white py-3 px-3 border-bottom border-dark d-flex align-items-center justify-content-between">
          <div>
            <h5 class="offcanvas-title font-mono text-uppercase fs-6 fw-bold mb-0 lh-1" id="offcanvasChatLabel">CUSTOMER SUPPORT</h5>
            <div class="font-mono text-muted mt-1" style="font-size:0.68rem;" id="chat-header-user-meta">Help & Order Inquiries</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-light rounded-0 font-mono py-1 px-2" style="font-size:0.68rem;" id="btn-chat-clear" title="Clear chat messages">
              CLEAR
            </button>
            <button type="button" class="btn-close btn-close-white rounded-0" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
        </div>

        <!-- Support Channel Switcher: Store Admin vs AI Chatbot -->
        <div class="chat-channel-selector-strip p-2 border-bottom">
          <div class="d-flex gap-1" id="chat-channel-toggle-group">
            <button type="button" class="chat-channel-btn flex-fill active" data-channel="admin" id="btn-chat-channel-admin" title="Direct live chat with the store merchant">
              <span class="me-1">👤</span> STORE ADMIN
              <span class="badge bg-success text-white ms-1 rounded-0" style="font-size:0.55rem;">HUMAN</span>
            </button>
            <button type="button" class="chat-channel-btn flex-fill" data-channel="bot" id="btn-chat-channel-bot" title="Instant automated support from AI Concierge">
              <span class="me-1">🤖</span> AI CHATBOT
              <span class="badge bg-dark text-white ms-1 rounded-0" style="font-size:0.55rem;">INSTANT</span>
            </button>
          </div>
        </div>

        <!-- Telemetry & Status Bar -->
        <div class="chat-telemetry-bar py-2 px-3 bg-light border-bottom font-mono d-flex justify-content-between align-items-center" style="font-size:0.7rem;" id="chat-telemetry-bar">
          <div class="d-flex align-items-center gap-2">
            <span class="chat-status-indicator online" id="chat-status-indicator"></span>
            <span class="text-dark fw-bold" id="chat-status-title">STORE ADMIN LIVE DESK</span>
          </div>
          <div class="text-muted" id="chat-status-sub">DIRECT HUMAN REPLIES</div>
        </div>

        <!-- Message Thread Body -->
        <div class="offcanvas-body p-3 d-flex flex-column chat-messages-container" id="chat-messages-container">
          <div id="chat-messages-list" class="d-flex flex-column gap-3">
            <!-- Messages rendered dynamically -->
          </div>
          <div id="chat-typing-indicator" class="chat-typing-indicator" style="display:none;">
            <div class="chat-avatar-badge" id="chat-typing-avatar">SS</div>
            <div class="chat-typing-bubble">
              <span></span><span></span><span></span>
            </div>
            <span class="chat-typing-text">Connecting...</span>
          </div>
        </div>

        <!-- Quick Suggestion Chips (Docked above input) -->
        <div class="chat-chips-strip px-3 py-2 bg-light border-top">
          <div class="d-flex gap-2 overflow-x-auto pb-1" id="chat-chips-container">
            <!-- Chips rendered dynamically based on active channel -->
          </div>
        </div>

        <!-- Input Footer Form -->
        <div class="offcanvas-footer p-3 bg-white border-top">
          <form id="form-chat-send" class="m-0" autocomplete="off">
            <div class="input-group">
              <input type="text" id="chat-input-text" class="form-control rounded-0 font-mono" placeholder="Type a message to the Store Admin / Seller..." required maxlength="500">
              <button type="submit" id="btn-chat-send" class="btn btn-ss-dark rounded-0 px-3 font-mono fw-bold" style="font-size:0.75rem;">
                SEND →
              </button>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 font-mono text-muted" style="font-size:0.65rem;">
              <span>Press Enter to send</span>
              <span id="chat-char-count">0/500</span>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(drawer);

      // Render initial chips
      this.renderChips();
    }
  },

  bindEvents() {
    // 1. Navbar chat button and trigger elements
    document.querySelectorAll("#navbar-chat-btn, .open-chat-trigger, #mobile-nav-chat-link").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggle();
      });
    });

    // 2. Chat Channel Switcher Buttons (Store Admin vs AI Chatbot)
    document.getElementById("btn-chat-channel-admin")?.addEventListener("click", () => {
      this.setChannel("admin");
    });
    document.getElementById("btn-chat-channel-bot")?.addEventListener("click", () => {
      this.setChannel("bot");
    });

    // Delegate clicks for inline switch buttons in the welcome banner
    document.getElementById("chat-messages-container")?.addEventListener("click", (e) => {
      const toBot = e.target.closest(".btn-switch-to-bot");
      const toAdmin = e.target.closest(".btn-switch-to-admin");
      if (toBot) {
        this.setChannel("bot");
      } else if (toAdmin) {
        this.setChannel("admin");
      }
    });

    // 3. Chat Send Form
    const sendForm = document.getElementById("form-chat-send");
    sendForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input-text");
      const message = input?.value.trim();
      if (message) {
        this.sendMessage(message);
        if (input) input.value = "";
        this.updateCharCount();
      }
    });

    // 4. Character count
    const chatInput = document.getElementById("chat-input-text");
    chatInput?.addEventListener("input", () => {
      this.updateCharCount();
    });

    // 5. Clear history
    document.getElementById("btn-chat-clear")?.addEventListener("click", () => {
      this.clearMessages();
    });

    // 6. Listen for drawer hide to stop polling
    const drawerEl = document.getElementById("offcanvasChat");
    drawerEl?.addEventListener("hidden.bs.offcanvas", () => {
      this.stopPolling();
    });
  },

  setChannel(channel) {
    this._currentChannel = channel === "bot" ? "bot" : "admin";

    // 1. Update channel button active classes
    const adminBtn = document.getElementById("btn-chat-channel-admin");
    const botBtn = document.getElementById("btn-chat-channel-bot");
    if (adminBtn) adminBtn.classList.toggle("active", this._currentChannel === "admin");
    if (botBtn) botBtn.classList.toggle("active", this._currentChannel === "bot");

    // 2. Update telemetry bar
    const titleEl = document.getElementById("chat-status-title");
    const subEl = document.getElementById("chat-status-sub");
    const indicatorEl = document.getElementById("chat-status-indicator");
    const inputEl = document.getElementById("chat-input-text");

    if (this._currentChannel === "admin") {
      if (titleEl) titleEl.textContent = "STORE ADMIN LIVE DESK";
      if (subEl) subEl.textContent = "DIRECT HUMAN REPLIES";
      if (indicatorEl) indicatorEl.className = "chat-status-indicator online";
      if (inputEl) inputEl.placeholder = "Type message directly to store admin / seller...";
    } else {
      if (titleEl) titleEl.textContent = "AI CONCIERGE CHATBOT";
      if (subEl) subEl.textContent = "INSTANT 24/7 ASSISTANCE";
      if (indicatorEl) indicatorEl.className = "chat-status-indicator bot-online";
      if (inputEl) inputEl.placeholder = "Ask AI chatbot about sizing, fabric GSM, workout splits...";
    }

    // 3. Render appropriate chips
    this.renderChips();

    // 4. Re-render messages with updated welcome banner
    this.renderMessages();

    // Focus input
    inputEl?.focus();
  },

  renderChips() {
    const container = document.getElementById("chat-chips-container");
    if (!container) return;

    const chips = CHIPS_DATA[this._currentChannel] || CHIPS_DATA.admin;
    container.innerHTML = chips.map(chip => `
      <button type="button" class="chat-chip-btn" data-prompt="${escapeHtml(chip.prompt)}">
        ${escapeHtml(chip.label)}
      </button>
    `).join("");

    // Rebind click events
    container.querySelectorAll(".chat-chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-prompt");
        if (prompt) {
          this.sendMessage(prompt);
        }
      });
    });
  },

  updateCharCount() {
    const input = document.getElementById("chat-input-text");
    const countEl = document.getElementById("chat-char-count");
    if (input && countEl) {
      countEl.textContent = `${input.value.length}/500`;
    }
  },

  open() {
    if (!Auth.isUserLoggedIn()) {
      if (window.showToast) {
        window.showToast("Please sign in to access Customer Support Chat.");
      }
      Auth.openAuthModal("login");
      return;
    }

    const drawerEl = document.getElementById("offcanvasChat");
    if (!drawerEl || !window.bootstrap) return;

    if (window.closeAllDrawers) {
      window.closeAllDrawers(drawerEl);
    }

    // Update header meta
    const user = Auth.getUser();
    const metaEl = document.getElementById("chat-header-user-meta");
    if (metaEl && user) {
      metaEl.textContent = `${user.name} • ${user.athleteId || "Member"}`;
    }

    this._offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(drawerEl);
    this._offcanvasInstance.show();

    // Fetch message history and start polling
    this.fetchMessages();
    this.startPolling();

    // Focus input after drawer slide
    setTimeout(() => {
      document.getElementById("chat-input-text")?.focus();
    }, 350);
  },

  close() {
    const drawerEl = document.getElementById("offcanvasChat");
    if (drawerEl && window.bootstrap) {
      const inst = bootstrap.Offcanvas.getInstance(drawerEl);
      if (inst) inst.hide();
    }
    this.stopPolling();
  },

  toggle() {
    const drawerEl = document.getElementById("offcanvasChat");
    if (drawerEl && drawerEl.classList.contains("show")) {
      this.close();
    } else {
      this.open();
    }
  },

  startPolling() {
    this.stopPolling();
    this._pollInterval = setInterval(async () => {
      const drawerEl = document.getElementById("offcanvasChat");
      if (drawerEl && drawerEl.classList.contains("show")) {
        await this.fetchMessages(true);
      } else {
        this.stopPolling();
      }
    }, 3500);
  },

  stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  },

  async fetchMessages(silent = false) {
    const token = Auth.getUserToken();
    if (!token) return;

    try {
      const res = await API.getChatMessages(token);
      if (res && res.success) {
        const newMsgs = res.messages || [];
        const changed =
          newMsgs.length !== this._messages.length ||
          (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].id !== this._messages[this._messages.length - 1]?.id);

        if (changed) {
          this._messages = newMsgs;
          this.renderMessages();
        }
      }
    } catch (e) {
      if (!silent) this.renderMessages();
    }
  },

  renderMessages() {
    const listEl = document.getElementById("chat-messages-list");
    if (!listEl) return;

    const user = Auth.getUser();
    const athleteName = user ? user.name : "Athlete";
    const isBotChannel = this._currentChannel === "bot";

    let html = "";

    // Dynamic Welcome Card based on selected channel
    if (isBotChannel) {
      html += `
        <div class="chat-welcome-card p-3 border bg-white shadow-sm mb-3">
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="chat-avatar-badge bot-avatar">AI</div>
            <div>
              <div class="fw-bold font-brand fs-6 lh-1">SUPERSCIENCE AI CHATBOT</div>
              <div class="font-mono text-muted" style="font-size:0.68rem;">Automated Intelligent Concierge • Instant 24/7 Answers</div>
            </div>
            <span class="badge bg-info text-dark font-mono rounded-0 ms-auto" style="font-size:0.62rem;">AI ACTIVE</span>
          </div>
          <p class="mb-2" style="font-size:0.82rem; line-height:1.45; color: #27272a;">
            Hi <strong>${escapeHtml(athleteName)}</strong>! I'm your automated assistant. Ask me questions about garment GSM, sizing advice, fabric care, or workout protocol splits.
          </p>
          <div class="d-flex align-items-center justify-content-between font-mono text-muted pt-2 border-top" style="font-size:0.7rem;">
            <span>👤 Need to speak with a human seller?</span>
            <button type="button" class="btn btn-sm btn-link p-0 font-mono text-decoration-none fw-bold text-dark btn-switch-to-admin" style="font-size:0.7rem;">
              Chat with Store Admin &rarr;
            </button>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="chat-welcome-card p-3 border bg-white shadow-sm mb-3">
          <div class="d-flex align-items-center gap-2 mb-2">
            <div class="chat-avatar-badge merchant-avatar">SA</div>
            <div>
              <div class="fw-bold font-brand fs-6 lh-1">STORE ADMIN LIVE DESK</div>
              <div class="font-mono text-muted" style="font-size:0.68rem;">Direct Channel to Human Merchant & Operations</div>
            </div>
            <span class="badge bg-success font-mono text-white rounded-0 ms-auto" style="font-size:0.62rem;">LIVE</span>
          </div>
          <p class="mb-2" style="font-size:0.82rem; line-height:1.45; color: #27272a;">
            You are connected directly to the <strong>Store Admin Desk</strong>. Send questions about orders, customized fitting, stock availability, or private showroom visits.
          </p>
          <div class="d-flex align-items-center justify-content-between font-mono text-muted pt-2 border-top" style="font-size:0.7rem;">
            <span>⚡ Looking for instant automated answers?</span>
            <button type="button" class="btn btn-sm btn-link p-0 font-mono text-decoration-none fw-bold text-dark btn-switch-to-bot" style="font-size:0.7rem;">
              Switch to AI Chatbot &rarr;
            </button>
          </div>
        </div>
      `;
    }

    if (this._messages.length > 0) {
      this._messages.forEach((msg) => {
        const isUser = msg.sender === "user";
        const timeStr = formatChatTime(msg.created_at);
        const formattedMsg = escapeHtml(msg.message).replace(/\n/g, "<br>");
        const msgMode = msg.mode || "admin";
        const isToAdmin = msgMode === "admin";
        const isFromAdmin =
          msg.sender === "admin" ||
          msgMode === "admin" ||
          (msg.sender_name && (msg.sender_name.toLowerCase().includes("admin") || msg.sender_name.toLowerCase().includes("merchant")));

        if (isUser) {
          html += `
            <div class="chat-msg-row chat-msg-user">
              <div class="chat-bubble-user">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-1" style="font-size:0.62rem;">
                  <span class="badge ${isToAdmin ? 'bg-secondary' : 'bg-dark'} font-mono rounded-0" style="font-size:0.55rem; letter-spacing:0.04em;">
                    ${isToAdmin ? '👤 TO ADMIN' : '🤖 TO AI BOT'}
                  </span>
                </div>
                <div class="chat-bubble-text">${formattedMsg}</div>
                <div class="chat-bubble-time">${timeStr}</div>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="chat-msg-row chat-msg-concierge">
              <div class="chat-avatar-badge ${isFromAdmin ? 'merchant-avatar' : 'bot-avatar'}">
                ${isFromAdmin ? 'SA' : 'AI'}
              </div>
              <div class="${isFromAdmin ? 'chat-bubble-merchant' : 'chat-bubble-concierge'}">
                <div class="chat-bubble-author d-flex align-items-center gap-1">
                  <span>${isFromAdmin ? 'STORE ADMIN (MERCHANT)' : 'SUPERSCIENCE AI BOT'}</span>
                  <span class="badge ${isFromAdmin ? 'bg-success text-white' : 'bg-dark text-white'} font-mono rounded-0 ms-1" style="font-size:0.52rem;">
                    ${isFromAdmin ? 'VERIFIED SELLER' : 'AUTOMATED'}
                  </span>
                </div>
                <div class="chat-bubble-text">${formattedMsg}</div>
                <div class="chat-bubble-time">${timeStr}</div>
              </div>
            </div>
          `;
        }
      });
    }

    listEl.innerHTML = html;
    this.scrollToBottom();
  },

  async sendMessage(messageText) {
    if (!messageText || this._isSending) return;
    const token = Auth.getUserToken();
    if (!token) return;

    this._isSending = true;
    const channel = this._currentChannel || "admin";

    // Immediately display user message in thread
    const nowIso = new Date().toISOString();
    const tempUserMsg = {
      sender: "user",
      sender_name: Auth.getUser()?.name || "Athlete",
      message: messageText,
      mode: channel,
      created_at: nowIso
    };
    this._messages.push(tempUserMsg);
    this.renderMessages();

    // Show typing indicator
    const typingIndicator = document.getElementById("chat-typing-indicator");
    const typingAvatar = document.getElementById("chat-typing-avatar");
    const typingText = typingIndicator?.querySelector(".chat-typing-text");

    if (typingIndicator) {
      if (typingAvatar) {
        typingAvatar.textContent = channel === "bot" ? "AI" : "SA";
        typingAvatar.className = `chat-avatar-badge ${channel === 'bot' ? 'bot-avatar' : 'merchant-avatar'}`;
      }
      if (typingText) {
        typingText.textContent = channel === "bot" ? "AI is generating response..." : "Delivering to Store Admin Desk...";
      }
      typingIndicator.style.display = "flex";
      this.scrollToBottom();
    }

    const sendBtn = document.getElementById("btn-chat-send");
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await API.sendChatMessage(messageText, token, channel);

      if (typingIndicator) typingIndicator.style.display = "none";

      if (res && res.success) {
        if (channel === "bot" && res.conciergeMessage) {
          this._messages.push(res.conciergeMessage);
          this.renderMessages();
        } else if (channel === "admin") {
          // Delivered to Store Admin Live Desk
          if (window.showToast) {
            window.showToast("Inquiry delivered to Store Admin. They will reply shortly.");
          }
          await this.fetchMessages(true);
        }
      } else {
        if (channel === "bot") {
          const fallbackReply = {
            sender: "concierge",
            sender_name: "SUPERSCIENCE AI Bot",
            mode: "bot",
            message: "Thank you for reaching out! Ask me about sizing, fabric care, or workout protocols.",
            created_at: new Date().toISOString()
          };
          this._messages.push(fallbackReply);
          this.renderMessages();
        } else {
          if (window.showToast) {
            window.showToast("Message recorded for Store Admin.");
          }
        }
      }
    } catch (err) {
      if (typingIndicator) typingIndicator.style.display = "none";
      if (window.showToast) {
        window.showToast("Message dispatched.");
      }
    } finally {
      this._isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      this.scrollToBottom();
    }
  },

  async clearMessages() {
    const token = Auth.getUserToken();
    if (!token) return;

    if (confirm("Are you sure you want to clear your chat history?")) {
      try {
        await API.clearChatMessages(token);
        this._messages = [];
        this.renderMessages();
        if (window.showToast) {
          window.showToast("Chat history cleared.");
        }
      } catch (e) {}
    }
  },

  scrollToBottom() {
    const container = document.getElementById("chat-messages-container");
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }
};
