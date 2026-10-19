const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const { pool, query, testConnection } = require('./db');
const { initialProducts, initialUsers, hashPassword } = require('./scripts/init-db');
const { initialPrograms } = require('./scripts/programs-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Cache-control for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Redirect removed pages
app.get(['/about', '/about.html', '/atelier'], (req, res) => {
  res.redirect(301, '/');
});

// Serve frontend static files
app.use(express.static(path.join(__dirname), {
  extensions: ['html', 'htm']
}));

// Default Homepage Hero CMS configuration
const defaultHeroSettings = {
  badge: "SEASON 01 // ARCHITECTURAL ESSENTIALS",
  title: "DROP 01 // OVERSIZED ESSENTIALS",
  subtitle: "Heavyweight combed cotton, architectural drop-shoulder cut, engineered for daily street drape and heavy compound lifting sessions.",
  primaryBtnText: "SHOP T-SHIRTS",
  primaryBtnLink: "catalog.html?category=tshirts",
  secondaryBtnText: "SHOP SHORTS",
  secondaryBtnLink: "catalog.html?category=shorts",
  imageUrl: "assets/products/c4fe5a12-a0a2-4c55-bfbf-da889d4100e8.jfif",
  photoTagLeft: "ATHLETE LOOKBOOK",
  photoTagRight: "AUTHENTIC 2023"
};

// Helper: Ensure tables exist if connected
async function autoInitSchemaIfConnected() {
  const status = await testConnection();
  if (status.connected) {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          category_label VARCHAR(100),
          price NUMERIC(10, 2) NOT NULL,
          fit VARCHAR(100),
          gsm VARCHAR(50),
          fabric TEXT,
          description TEXT,
          images JSONB,
          colors JSONB,
          sizes JSONB,
          rating NUMERIC(3, 1) DEFAULT 5.0,
          reviews_count INT DEFAULT 0,
          badges TEXT[],
          workout_tie_in TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(50) PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_address TEXT,
          customer_city VARCHAR(100),
          customer_country VARCHAR(100),
          items JSONB NOT NULL,
          subtotal NUMERIC(10, 2) NOT NULL,
          discount NUMERIC(10, 2) DEFAULT 0,
          shipping NUMERIC(10, 2) DEFAULT 0,
          total NUMERIC(10, 2) NOT NULL,
          promo_code VARCHAR(50),
          status VARCHAR(50) DEFAULT 'confirmed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sizing_consultations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          height VARCHAR(100),
          weight VARCHAR(100),
          fit_preference VARCHAR(100),
          garment_interest VARCHAR(255),
          questions TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS showroom_bookings (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(100),
          booking_date DATE NOT NULL,
          time_slot VARCHAR(100) NOT NULL,
          experience_focus VARCHAR(255),
          guests INT DEFAULT 1,
          status VARCHAR(50) DEFAULT 'confirmed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          source VARCHAR(100) DEFAULT 'footer',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          salt VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          athlete_id VARCHAR(50),
          tier VARCHAR(50) DEFAULT 'TIER 01',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workout_programs (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle TEXT,
          split VARCHAR(50) NOT NULL,
          split_label VARCHAR(100),
          frequency VARCHAR(100),
          duration VARCHAR(100),
          intensity VARCHAR(100),
          weekly_volume VARCHAR(100),
          experience_level VARCHAR(100),
          image TEXT,
          apparel_recommendation JSONB,
          scientific_principles JSONB,
          days JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          sender VARCHAR(50) NOT NULL,
          sender_name VARCHAR(255),
          message TEXT NOT NULL,
          mode VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'admin';
        CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed if products table is empty
      const countRes = await query('SELECT COUNT(*) as count FROM products');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        for (const p of initialProducts) {
          await query(`
            INSERT INTO products (
              id, name, category, category_label, price, fit, gsm, fabric,
              description, images, colors, sizes, rating, reviews_count, badges, workout_tie_in
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO NOTHING;
          `, [
            p.id, p.name, p.category, p.categoryLabel, p.price, p.fit, p.gsm, p.fabric,
            p.description, JSON.stringify(p.images), JSON.stringify(p.colors), JSON.stringify(p.sizes),
            p.rating, p.reviewsCount, p.badges, p.workoutTieIn
          ]);
        }
      }

      // Seed if users table is empty
      const userCountRes = await query('SELECT COUNT(*) as count FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        for (const u of initialUsers) {
          await query(`
            INSERT INTO users (id, email, password_hash, salt, name, role, athlete_id, tier)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO NOTHING;
          `, [u.id, u.email, u.password_hash, u.salt, u.name, u.role, u.athlete_id, u.tier]);
        }
      }

      // Seed if workout_programs table is empty
      const progCountRes = await query('SELECT COUNT(*) as count FROM workout_programs');
      if (parseInt(progCountRes.rows[0].count, 10) === 0) {
        for (const pr of initialPrograms) {
          await query(`
            INSERT INTO workout_programs (
              id, title, subtitle, split, split_label, frequency, duration,
              intensity, weekly_volume, experience_level, image,
              apparel_recommendation, scientific_principles, days
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO NOTHING;
          `, [
            pr.id, pr.title, pr.subtitle, pr.split, pr.splitLabel, pr.frequency, pr.duration,
            pr.intensity, pr.weeklyVolume, pr.experienceLevel, pr.image,
            JSON.stringify(pr.apparelRecommendation || {}),
            JSON.stringify(pr.scientificPrinciples || []),
            JSON.stringify(pr.days || [])
          ]);
        }
      }

      // Seed default hero settings if missing
      const heroCheck = await query("SELECT value FROM site_settings WHERE key = 'homepage_hero'");
      if (heroCheck.rows.length === 0) {
        await query(
          "INSERT INTO site_settings (key, value) VALUES ('homepage_hero', $1) ON CONFLICT (key) DO NOTHING",
          [JSON.stringify(defaultHeroSettings)]
        );
      }

      console.log('✓ PostgreSQL tables initialized and ready.');
    } catch (e) {
      console.warn('[PostgreSQL Init Warning]:', e.message);
    }
  } else {
    console.warn(`[PostgreSQL Status]: Not connected (${status.error || 'Check .env DATABASE_URL'}). Fallback memory mode active.`);
  }
}

/* ==========================================================================
   REST API Endpoints
   ========================================================================== */

// 1. Health check & DB connection diagnostics
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'online',
    server: 'SUPERSCIENCE Node.js / Express',
    port: PORT,
    database: {
      type: 'PostgreSQL',
      ...dbStatus
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Products - List all with optional ?category= filter
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];

    if (category && category !== 'all') {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    
    // Normalize field names to match frontend expectations
    const formatted = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      categoryLabel: row.category_label,
      price: parseFloat(row.price),
      fit: row.fit,
      gsm: row.gsm,
      fabric: row.fabric,
      description: row.description,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
      sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
      rating: parseFloat(row.rating),
      reviewsCount: parseInt(row.reviews_count, 10),
      badges: row.badges || [],
      workoutTieIn: row.workout_tie_in
    }));

    return res.json({ success: true, source: 'database', count: formatted.length, data: formatted });
  } catch (err) {
    // If DB is offline or table missing, return fallback mock products
    let fallback = initialProducts;
    if (req.query.category && req.query.category !== 'all') {
      fallback = fallback.filter(p => p.category === req.query.category);
    }
    return res.json({
      success: true,
      source: 'fallback_offline',
      warning: err.message,
      count: fallback.length,
      data: fallback
    });
  }
});

// 3. Products - Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      const fallback = initialProducts.find(p => p.id === req.params.id);
      if (fallback) return res.json({ success: true, source: 'fallback', data: fallback });
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const row = result.rows[0];
    res.json({
      success: true,
      source: 'database',
      data: {
        id: row.id,
        name: row.name,
        category: row.category,
        categoryLabel: row.category_label,
        price: parseFloat(row.price),
        fit: row.fit,
        gsm: row.gsm,
        fabric: row.fabric,
        description: row.description,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
        colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
        sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
        rating: parseFloat(row.rating),
        reviewsCount: parseInt(row.reviews_count, 10),
        badges: row.badges || [],
        workoutTieIn: row.workout_tie_in
      }
    });
  } catch (err) {
    const fallback = initialProducts.find(p => p.id === req.params.id);
    if (fallback) return res.json({ success: true, source: 'fallback', data: fallback });
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth helpers & session management
function verifyPassword(password, hash, salt) {
  const check = hashPassword(password, salt);
  return check === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory fallback cache for live store activity
const memoryStore = {
  orders: [],
  consultations: [],
  bookings: [],
  newsletter: [],
  users: [...initialUsers],
  sessions: {}, // token -> { token, user_id, role, expires_at, user }
  programs: [...initialPrograms],
  chatMessages: [],
  siteSettings: {
    homepage_hero: { ...defaultHeroSettings }
  }
};

// Helper: resolve user from token (checks DB, falls back to memoryStore)
async function getSessionUser(token) {
  if (!token) return null;
  try {
    const res = await query(
      `SELECT s.token, s.expires_at, u.id, u.email, u.name, u.role, u.athlete_id, u.tier
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        athleteId: row.athlete_id,
        tier: row.tier
      };
    }
  } catch (e) {}

  const mem = memoryStore.sessions[token];
  if (mem) {
    if (new Date(mem.expires_at) > new Date()) {
      return mem.user;
    } else {
      delete memoryStore.sessions[token];
    }
  }
  return null;
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers['x-auth-token']) {
    return req.headers['x-auth-token'];
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

/* ==========================================================================
   Authentication & Session REST Endpoints
   ========================================================================== */

// 4a. Register athlete account
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, fit_preference } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }
  } catch (e) {
    if (memoryStore.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }
  }

  const userId = 'USR-' + Math.floor(100000 + Math.random() * 900000);
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const athleteId = 'SS-ATH-' + Math.floor(1000 + Math.random() * 9000);
  const tier = 'TIER 01';
  const role = 'user';

  const newUser = {
    id: userId,
    email: cleanEmail,
    password_hash: passwordHash,
    salt,
    name: name.trim(),
    role,
    athlete_id: athleteId,
    tier,
    created_at: new Date().toISOString()
  };

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day session

  try {
    await query(`
      INSERT INTO users (id, email, password_hash, salt, name, role, athlete_id, tier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, cleanEmail, passwordHash, salt, newUser.name, role, athleteId, tier]);

    await query(`
      INSERT INTO sessions (token, user_id, role, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [token, userId, role, expiresAt]);
  } catch (err) {}

  memoryStore.users.push(newUser);
  const authUser = {
    id: userId,
    name: newUser.name,
    email: cleanEmail,
    role,
    athleteId,
    tier
  };

  memoryStore.sessions[token] = {
    token,
    user_id: userId,
    role,
    expires_at: expiresAt.toISOString(),
    user: authUser
  };

  return res.status(201).json({
    success: true,
    message: 'Athlete account created successfully',
    token,
    user: authUser
  });
});

// 4b. Login athlete / user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let userRecord = null;

  try {
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length > 0) {
      userRecord = result.rows[0];
    }
  } catch (e) {}

  if (!userRecord) {
    userRecord = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
  }

  if (!userRecord || !verifyPassword(password, userRecord.password_hash, userRecord.salt)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    await query(`
      INSERT INTO sessions (token, user_id, role, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [token, userRecord.id, userRecord.role, expiresAt]);
  } catch (err) {}

  const authUser = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    athleteId: userRecord.athlete_id || 'SS-ATH-0000',
    tier: userRecord.tier || 'TIER 01'
  };

  memoryStore.sessions[token] = {
    token,
    user_id: userRecord.id,
    role: userRecord.role,
    expires_at: expiresAt.toISOString(),
    user: authUser
  };

  return res.json({
    success: true,
    message: 'Authenticated successfully',
    token,
    user: authUser
  });
});

// 4c. Login admin (Seller Dashboard gate)
app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Admin email and master key required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let userRecord = null;

  try {
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length > 0) {
      userRecord = result.rows[0];
    }
  } catch (e) {}

  if (!userRecord) {
    userRecord = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
  }

  if (!userRecord || !verifyPassword(password, userRecord.password_hash, userRecord.salt)) {
    return res.status(401).json({ success: false, error: 'Invalid seller credentials' });
  }

  if (userRecord.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access restricted: account is not authorized as merchant/seller' });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day seller session

  try {
    await query(`
      INSERT INTO sessions (token, user_id, role, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [token, userRecord.id, userRecord.role, expiresAt]);
  } catch (err) {}

  const adminUser = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    athleteId: userRecord.athlete_id,
    tier: userRecord.tier
  };

  memoryStore.sessions[token] = {
    token,
    user_id: userRecord.id,
    role: userRecord.role,
    expires_at: expiresAt.toISOString(),
    user: adminUser
  };

  return res.json({
    success: true,
    message: 'Seller console unlocked',
    token,
    admin: adminUser
  });
});

// 4d. Get current authenticated user from session
app.get('/api/auth/me', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'No active session token provided' });
  }

  const user = await getSessionUser(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid' });
  }

  return res.json({
    success: true,
    user
  });
});

// 4e. Logout active session
app.post('/api/auth/logout', async (req, res) => {
  const token = extractToken(req) || req.body.token;
  if (token) {
    try {
      await query('DELETE FROM sessions WHERE token = $1', [token]);
    } catch (e) {}
    delete memoryStore.sessions[token];
  }
  return res.json({ success: true, message: 'Session terminated' });
});

// 4e-2. Change admin or user password
app.post('/api/auth/change-password', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No session token provided.' });
  }

  const sessionUser = await getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
  }

  const currentPassword = req.body.currentPassword || req.body.current_password;
  const newPassword = req.body.newPassword || req.body.new_password;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Both current password and new password are required.' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({ success: false, error: 'New password must be different from current password.' });
  }

  // Fetch full user record (with password_hash and salt)
  let userRecord = null;
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [sessionUser.id]);
    if (result.rows.length > 0) {
      userRecord = result.rows[0];
    }
  } catch (e) {
    console.warn('[Auth] Database fetch fallback for change-password:', e.message);
  }

  if (!userRecord) {
    userRecord = memoryStore.users.find(u => u.id === sessionUser.id || u.email.toLowerCase() === sessionUser.email.toLowerCase());
  }

  if (!userRecord || !verifyPassword(currentPassword, userRecord.password_hash, userRecord.salt)) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }

  // Generate new salt and hash
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newPasswordHash = hashPassword(newPassword, newSalt);

  // Update in DB if available
  try {
    await query('UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3', [newPasswordHash, newSalt, userRecord.id]);
  } catch (err) {
    console.error('[Auth] Failed to update password in database:', err.message);
  }

  // Update in memoryStore
  const memUser = memoryStore.users.find(u => u.id === userRecord.id || u.email.toLowerCase() === userRecord.email.toLowerCase());
  if (memUser) {
    memUser.password_hash = newPasswordHash;
    memUser.salt = newSalt;
  }

  return res.json({
    success: true,
    message: 'Master key successfully updated.',
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role
    }
  });
});


// 4f. List registered users (seller telemetry)
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, role, athlete_id, tier, created_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    const safeUsers = memoryStore.users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      athlete_id: u.athlete_id,
      tier: u.tier,
      created_at: u.created_at
    }));
    return res.json({ success: true, count: safeUsers.length, users: safeUsers });
  }
});

// Customer Support Intelligent Response Engine
async function generateConciergeReply(userMessage, sessionUser) {
  const msg = (userMessage || '').toLowerCase();

  // 1. Order tracking & status
  if (msg.includes('order') || msg.includes('track') || msg.includes('package') || msg.includes('delivery') || msg.includes('shipping') || msg.includes('status')) {
    let recentOrders = [];
    try {
      const ordRes = await query('SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC LIMIT 3', [sessionUser.email]);
      if (ordRes.rows.length > 0) recentOrders = ordRes.rows;
    } catch (e) {}
    if (recentOrders.length === 0) {
      recentOrders = memoryStore.orders.filter(o => o.customer_email?.toLowerCase() === sessionUser.email?.toLowerCase());
    }

    if (recentOrders.length > 0) {
      const latest = recentOrders[0];
      let items = [];
      try {
        items = Array.isArray(latest.items) ? latest.items : (typeof latest.items === 'string' ? JSON.parse(latest.items) : []);
      } catch (e) {}
      const itemNames = items.map(i => `${i.name} (${i.size})`).join(', ') || 'SUPERSCIENCE Items';
      return `📦 Order Details for ${sessionUser.name}:\n• Order ID: ${latest.id}\n• Status: ${(latest.status || 'CONFIRMED').toUpperCase()}\n• Total: ₱${Number(latest.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• Items: ${itemNames}\n• Shipping: Dispatched via standard express. Estimated delivery: 2-3 business days.`;
    } else {
      return `📦 No active orders found under ${sessionUser.email}. When you place an order, you can track its progress right here in real-time!`;
    }
  }

  // 2. Sizing and Fit matrix
  if (msg.includes('size') || msg.includes('fit') || msg.includes('height') || msg.includes('weight') || msg.includes('measure') || msg.includes('large') || msg.includes('medium') || msg.includes('small') || msg.includes('oversized')) {
    return `📏 Sizing Guide:\n• Heavyweight Oversized Tees: Relaxed drop-shoulder fit crafted with 380 GSM combed cotton.\n• Recommendation: Stick to your standard size for an oversized streetwear look. If you prefer a closer, regular fit, order one size down.\n• Training Shorts: Cut just above the knee (6" inseam) for squat depth and free movement.\nNeed help with your exact measurements? Let us know your height and weight!`;
  }

  // 3. Fabric, Materials & GSM
  if (msg.includes('fabric') || msg.includes('gsm') || msg.includes('material') || msg.includes('wash') || msg.includes('care') || msg.includes('cotton')) {
    return `🧵 Fabric & Garment Care:\n• Tees: 100% Combed Cotton, heavy 380 GSM pre-shrunk fabric.\n• Shorts: 420 GSM French Terry with reinforced stitching and metal aglets.\n• Care Instructions: Machine wash cold with like colors. Hang dry to maintain collar structure and prevent shrinkage.`;
  }

  // 4. Workout protocols & hypertrophy
  if (msg.includes('workout') || msg.includes('protocol') || msg.includes('program') || msg.includes('hypertrophy') || msg.includes('arnold') || msg.includes('split') || msg.includes('exercise') || msg.includes('train')) {
    return `⚡ Workout Programs:\n• All registered members have free access to our Workout Programs section.\n• Featured routines: 5-Day Arnold Split and Hypertrophy Lower Body Focus.\n• Head to the "Workout Programs" tab in the navigation bar to view full exercise lists, sets, and rep targets.`;
  }

  // 5. Returns, Exchange & Guarantee
  if (msg.includes('return') || msg.includes('exchange') || msg.includes('refund') || msg.includes('policy')) {
    return `🛡️ Returns & Exchanges:\n• We offer free 14-day size exchanges on all unworn items with tags attached.\n• Return shipping is covered for registered members.\n• Drop us a message here with your order number and we will set up your exchange.`;
  }

  // 6. Showroom and appointment
  if (msg.includes('showroom') || msg.includes('visit') || msg.includes('appointment') || msg.includes('book') || msg.includes('manila') || msg.includes('bgc')) {
    return `📍 Showroom & Private Fitting:\n• Location: Bonifacio Global City (BGC), Metro Manila.\n• Hours: Tuesday - Sunday | 11:00 AM - 8:00 PM.\n• Visit our Contact page or message us here to book a fitting appointment.`;
  }

  // 7. General personalized support greeting
  return `Hi ${sessionUser.name}! Thanks for reaching out to SUPERSCIENCE Support.\n\nHow can we help you today? You can ask about:\n• Order tracking & delivery status\n• Sizing & fit recommendations\n• Fabric specs & washing care\n• Workout programs & routines\n\nFeel free to type your question below!`;
}

// 4f-2. Chat - Get athlete chat messages
app.get('/api/chat/messages', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No session token provided.' });
  }

  const sessionUser = await getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in.' });
  }

  try {
    const userIdStr = String(sessionUser.id);
    const result = await query(
      'SELECT id, user_id, sender, sender_name, message, mode, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [userIdStr]
    );
    return res.json({ success: true, count: result.rows.length, messages: result.rows });
  } catch (err) {
    const userIdStr = String(sessionUser.id);
    const memMsgs = memoryStore.chatMessages.filter(m => String(m.user_id) === userIdStr);
    return res.json({ success: true, count: memMsgs.length, messages: memMsgs });
  }
});

// 4f-3. Chat - Post customer chat message & receive Support response (Admin vs AI Chatbot)
app.post('/api/chat/messages', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No session token provided.' });
  }

  const sessionUser = await getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in.' });
  }

  const rawMessage = req.body.message;
  if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return res.status(400).json({ success: false, error: 'Message content cannot be empty.' });
  }

  const targetMode = req.body.mode === 'bot' ? 'bot' : 'admin';
  const cleanMessage = rawMessage.trim();
  const now = new Date();

  const userMsgObj = {
    user_id: sessionUser.id,
    sender: 'user',
    sender_name: sessionUser.name,
    message: cleanMessage,
    mode: targetMode,
    created_at: now.toISOString()
  };

  if (targetMode === 'bot') {
    // Channel: AI Chatbot (Instant Automated Concierge)
    const conciergeReplyText = await generateConciergeReply(cleanMessage, sessionUser);
    const conciergeNow = new Date(Date.now() + 600); // slight offset for realistic sequencing
    const conciergeMsgObj = {
      user_id: sessionUser.id,
      sender: 'concierge',
      sender_name: 'SUPERSCIENCE AI Bot',
      message: conciergeReplyText,
      mode: 'bot',
      created_at: conciergeNow.toISOString()
    };

    // Save to DB
    try {
      const uRes = await query(
        'INSERT INTO chat_messages (user_id, sender, sender_name, message, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userMsgObj.user_id, userMsgObj.sender, userMsgObj.sender_name, userMsgObj.message, userMsgObj.mode, userMsgObj.created_at]
      );
      if (uRes.rows.length > 0) userMsgObj.id = uRes.rows[0].id;

      const cRes = await query(
        'INSERT INTO chat_messages (user_id, sender, sender_name, message, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [conciergeMsgObj.user_id, conciergeMsgObj.sender, conciergeMsgObj.sender_name, conciergeMsgObj.message, conciergeMsgObj.mode, conciergeMsgObj.created_at]
      );
      if (cRes.rows.length > 0) conciergeMsgObj.id = cRes.rows[0].id;
    } catch (err) {
      userMsgObj.id = memoryStore.chatMessages.length + 1;
      conciergeMsgObj.id = memoryStore.chatMessages.length + 2;
    }

    // Update memoryStore
    memoryStore.chatMessages.push(userMsgObj, conciergeMsgObj);

    return res.json({
      success: true,
      mode: 'bot',
      userMessage: userMsgObj,
      conciergeMessage: conciergeMsgObj
    });
  } else {
    // Channel: Live Store Admin (Human Merchant Support)
    // Saved directly to Admin Live Support Desk without automated bot interruption
    try {
      const uRes = await query(
        'INSERT INTO chat_messages (user_id, sender, sender_name, message, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userMsgObj.user_id, userMsgObj.sender, userMsgObj.sender_name, userMsgObj.message, userMsgObj.mode, userMsgObj.created_at]
      );
      if (uRes.rows.length > 0) userMsgObj.id = uRes.rows[0].id;
    } catch (err) {
      userMsgObj.id = memoryStore.chatMessages.length + 1;
    }

    memoryStore.chatMessages.push(userMsgObj);

    return res.json({
      success: true,
      mode: 'admin',
      userMessage: userMsgObj,
      notice: 'Inquiry routed directly to Store Admin Live Support Desk.'
    });
  }
});

// 4f-4. Chat - Clear user chat history
app.delete('/api/chat/messages', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const sessionUser = await getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ success: false, error: 'Session expired.' });
  }

  try {
    await query('DELETE FROM chat_messages WHERE user_id = $1', [sessionUser.id]);
  } catch (e) {}

  memoryStore.chatMessages = memoryStore.chatMessages.filter(m => m.user_id !== sessionUser.id);
  return res.json({ success: true, message: 'Chat history cleared' });
});

// 4f-5. Admin - List all athlete concierge chat messages
app.get('/api/admin/chat/messages', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.user_id, c.sender, c.sender_name, c.message, c.mode, c.created_at,
              u.name as user_name, u.email as user_email, u.athlete_id as user_athlete_id, u.tier as user_tier
       FROM chat_messages c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at ASC`
    );
    return res.json({ success: true, count: result.rows.length, messages: result.rows });
  } catch (err) {
    return res.json({ success: true, count: memoryStore.chatMessages.length, messages: [...memoryStore.chatMessages] });
  }
});

// 4f-6. Admin - Send reply message to athlete chat
app.post('/api/admin/chat/messages', async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  }

  const sessionUser = await getSessionUser(token);
  if (!sessionUser || sessionUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: admin access required.' });
  }

  const message = req.body.message;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
  }

  const targetUserId = String(req.body.user_id || req.body.userId || '1').trim();
  const cleanMessage = message.trim();
  const now = new Date();

  const adminMsgObj = {
    user_id: targetUserId,
    sender: 'concierge',
    sender_name: `${sessionUser.name || 'Store Merchant'} (Support)`,
    message: cleanMessage,
    mode: 'admin',
    created_at: now.toISOString()
  };

  try {
    const resDb = await query(
      'INSERT INTO chat_messages (user_id, sender, sender_name, message, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [adminMsgObj.user_id, adminMsgObj.sender, adminMsgObj.sender_name, adminMsgObj.message, adminMsgObj.mode, adminMsgObj.created_at]
    );
    if (resDb.rows.length > 0) adminMsgObj.id = resDb.rows[0].id;
  } catch (err) {
    adminMsgObj.id = memoryStore.chatMessages.length + 1;
  }

  memoryStore.chatMessages.push(adminMsgObj);

  return res.json({ success: true, message: adminMsgObj });
});

// 4f-7. Admin - Clear specific user chat thread or all chat
app.delete('/api/admin/chat/messages/:userId', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  const sessionUser = await getSessionUser(token);
  if (!sessionUser || sessionUser.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden.' });

  const userId = req.params.userId;
  try {
    if (userId === 'all') {
      await query('DELETE FROM chat_messages');
      memoryStore.chatMessages = [];
    } else {
      await query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
      memoryStore.chatMessages = memoryStore.chatMessages.filter(m => String(m.user_id) !== String(userId));
    }
    return res.json({ success: true, message: 'Chat thread cleared.' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// 4h. Site Settings - Homepage Hero Section CMS
app.get('/api/settings/hero', async (req, res) => {
  try {
    const resDb = await query("SELECT value FROM site_settings WHERE key = 'homepage_hero'");
    if (resDb.rows.length > 0) {
      const val = typeof resDb.rows[0].value === 'string' ? JSON.parse(resDb.rows[0].value) : resDb.rows[0].value;
      if (!memoryStore.siteSettings) memoryStore.siteSettings = {};
      memoryStore.siteSettings.homepage_hero = val;
      return res.json({ success: true, hero: val });
    }
  } catch (err) {
    console.warn('[Get Hero Settings Warn]:', err.message);
  }
  return res.json({ success: true, hero: memoryStore.siteSettings?.homepage_hero || defaultHeroSettings });
});

const handleUpdateHeroSettings = async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  const sessionUser = await getSessionUser(token);
  if (!sessionUser || sessionUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: admin access required.' });
  }

  const {
    badge,
    title,
    subtitle,
    primaryBtnText,
    primaryBtnLink,
    secondaryBtnText,
    secondaryBtnLink,
    imageUrl,
    photoTagLeft,
    photoTagRight
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Hero headline / title is required.' });
  }

  const updatedHero = {
    badge: (badge !== undefined && String(badge).trim() !== '' ? String(badge) : defaultHeroSettings.badge).trim(),
    title: String(title).trim(),
    subtitle: (subtitle !== undefined && String(subtitle).trim() !== '' ? String(subtitle) : defaultHeroSettings.subtitle).trim(),
    primaryBtnText: (primaryBtnText !== undefined && String(primaryBtnText).trim() !== '' ? String(primaryBtnText) : defaultHeroSettings.primaryBtnText).trim(),
    primaryBtnLink: (primaryBtnLink !== undefined && String(primaryBtnLink).trim() !== '' ? String(primaryBtnLink) : defaultHeroSettings.primaryBtnLink).trim(),
    secondaryBtnText: (secondaryBtnText !== undefined && String(secondaryBtnText).trim() !== '' ? String(secondaryBtnText) : defaultHeroSettings.secondaryBtnText).trim(),
    secondaryBtnLink: (secondaryBtnLink !== undefined && String(secondaryBtnLink).trim() !== '' ? String(secondaryBtnLink) : defaultHeroSettings.secondaryBtnLink).trim(),
    imageUrl: (imageUrl !== undefined && String(imageUrl).trim() !== '' ? String(imageUrl) : defaultHeroSettings.imageUrl).trim(),
    photoTagLeft: (photoTagLeft !== undefined && String(photoTagLeft).trim() !== '' ? String(photoTagLeft) : defaultHeroSettings.photoTagLeft).trim(),
    photoTagRight: (photoTagRight !== undefined && String(photoTagRight).trim() !== '' ? String(photoTagRight) : defaultHeroSettings.photoTagRight).trim()
  };

  try {
    await query(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('homepage_hero', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(updatedHero)]);
  } catch (err) {
    console.warn('[Update Hero Settings DB Warn]:', err.message);
  }

  if (!memoryStore.siteSettings) memoryStore.siteSettings = {};
  memoryStore.siteSettings.homepage_hero = updatedHero;

  return res.json({
    success: true,
    message: 'Homepage hero banner updated successfully.',
    hero: updatedHero
  });
};

app.put('/api/admin/settings/hero', handleUpdateHeroSettings);
app.post('/api/admin/settings/hero', handleUpdateHeroSettings);

app.post('/api/admin/settings/hero/reset', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  const sessionUser = await getSessionUser(token);
  if (!sessionUser || sessionUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: admin access required.' });
  }

  try {
    await query(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('homepage_hero', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(defaultHeroSettings)]);
  } catch (err) {}

  if (!memoryStore.siteSettings) memoryStore.siteSettings = {};
  memoryStore.siteSettings.homepage_hero = { ...defaultHeroSettings };

  return res.json({
    success: true,
    message: 'Homepage hero banner reset to factory defaults.',
    hero: defaultHeroSettings
  });
});





// 4g. Orders - Create new order (Checkout submission)
app.post('/api/orders', async (req, res) => {
  const {
    id,
    customer_name,
    customer_email,
    customer_address,
    customer_city,
    customer_country,
    items,
    subtotal,
    discount,
    shipping,
    total,
    promo_code
  } = req.body;

  const orderId = id || ('SS-ORD-' + Math.floor(100000 + Math.random() * 900000));
  const record = {
    id: orderId,
    customer_name: customer_name || 'Guest Customer',
    customer_email: customer_email || 'guest@example.com',
    customer_address: customer_address || '',
    customer_city: customer_city || '',
    customer_country: customer_country || '',
    items: items || [],
    subtotal: Number(subtotal || 0),
    discount: Number(discount || 0),
    shipping: Number(shipping || 0),
    total: Number(total || 0),
    promo_code: promo_code || null,
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  try {
    await query(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_address, customer_city,
        customer_country, items, subtotal, discount, shipping, total, promo_code, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmed')
    `, [
      record.id, record.customer_name, record.customer_email, record.customer_address,
      record.customer_city, record.customer_country, JSON.stringify(record.items),
      record.subtotal, record.discount, record.shipping, record.total, record.promo_code
    ]);

    memoryStore.orders.unshift(record);

    return res.status(201).json({
      success: true,
      source: 'database',
      orderId,
      message: 'Order recorded successfully in PostgreSQL'
    });
  } catch (err) {
    memoryStore.orders.unshift(record);

    return res.status(200).json({
      success: true,
      source: 'memory_fallback',
      orderId,
      warning: `Saved to memory buffer (DB offline: ${err.message})`
    });
  }
});

// 5. Orders - List recent orders (supports ?email= for athlete orders)
app.get('/api/orders', async (req, res) => {
  const { email } = req.query;
  try {
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (email) {
      sql += ' WHERE LOWER(customer_email) = LOWER($1)';
      params.push(email.trim());
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';

    const result = await query(sql, params);
    return res.json({ success: true, source: 'database', count: result.rows.length, orders: result.rows });
  } catch (err) {
    let orders = memoryStore.orders;
    if (email) {
      orders = orders.filter(o => (o.customer_email || '').toLowerCase() === email.toLowerCase().trim());
    }
    return res.json({ success: true, source: 'memory_fallback', count: orders.length, orders });
  }
});

// 5b. Orders - Update order status (Seller fulfillment)
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

  try {
    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    const memOrder = memoryStore.orders.find(o => o.id === orderId);
    if (memOrder) memOrder.status = status;
    return res.json({ success: true, message: `Order ${orderId} updated to ${status}` });
  } catch (err) {
    const memOrder = memoryStore.orders.find(o => o.id === orderId);
    if (memOrder) {
      memOrder.status = status;
      return res.json({ success: true, source: 'memory_fallback', message: `Order ${orderId} updated to ${status}` });
    }
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
});

// 5c. Orders - Delete order (Seller cleanup)
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    await query('DELETE FROM orders WHERE id = $1', [orderId]);
    memoryStore.orders = memoryStore.orders.filter(o => o.id !== orderId);
    return res.json({ success: true, message: `Order ${orderId} deleted` });
  } catch (err) {
    memoryStore.orders = memoryStore.orders.filter(o => o.id !== orderId);
    return res.json({ success: true, message: `Order ${orderId} deleted from memory` });
  }
});

// 6. Sizing Consultation Inquiry
app.post('/api/consultations', async (req, res) => {
  const { name, email, height, weight, fit_preference, garment_interest, questions } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const record = {
    id: memoryStore.consultations.length + 1,
    name, email, height, weight, fit_preference, garment_interest, questions,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  try {
    const result = await query(`
      INSERT INTO sizing_consultations (name, email, height, weight, fit_preference, garment_interest, questions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `, [name, email, height, weight, fit_preference, garment_interest, questions]);

    record.id = result.rows[0].id;
    memoryStore.consultations.unshift(record);

    res.status(201).json({
      success: true,
      source: 'database',
      message: 'Consultation request received and stored.',
      id: result.rows[0].id
    });
  } catch (err) {
    memoryStore.consultations.unshift(record);
    res.status(200).json({
      success: true,
      source: 'memory_fallback',
      message: 'Consultation request received and stored in memory buffer.',
      id: record.id
    });
  }
});

// 7. Showroom Booking
app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, booking_date, time_slot, experience_focus, guests } = req.body;
  if (!name || !email || !booking_date || !time_slot) {
    return res.status(400).json({ success: false, error: 'Name, email, date, and time slot are required' });
  }

  const record = {
    id: memoryStore.bookings.length + 1,
    name, email, phone, booking_date, time_slot, experience_focus,
    guests: parseInt(guests || 1, 10),
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  try {
    const result = await query(`
      INSERT INTO showroom_bookings (name, email, phone, booking_date, time_slot, experience_focus, guests)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `, [name, email, phone, booking_date, time_slot, experience_focus, parseInt(guests || 1, 10)]);

    record.id = result.rows[0].id;
    memoryStore.bookings.unshift(record);

    res.status(201).json({
      success: true,
      source: 'database',
      message: 'Showroom booking confirmed and stored.',
      id: result.rows[0].id
    });
  } catch (err) {
    memoryStore.bookings.unshift(record);
    res.status(200).json({
      success: true,
      source: 'memory_fallback',
      message: 'Showroom booking confirmed and stored in memory buffer.',
      id: record.id
    });
  }
});

// 8. Newsletter Subscription
app.post('/api/newsletter', async (req, res) => {
  const { email, source } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const record = {
    id: memoryStore.newsletter.length + 1,
    email: cleanEmail,
    source: source || 'footer',
    created_at: new Date().toISOString()
  };

  try {
    await query(`
      INSERT INTO newsletter_subscribers (email, source)
      VALUES ($1, $2)
      ON CONFLICT (email) DO NOTHING
    `, [cleanEmail, source || 'footer']);

    if (!memoryStore.newsletter.some(n => n.email === cleanEmail)) {
      memoryStore.newsletter.unshift(record);
    }

    res.status(201).json({
      success: true,
      source: 'database',
      message: 'Successfully subscribed to SUPERSCIENCE drops and research briefs.'
    });
  } catch (err) {
    if (!memoryStore.newsletter.some(n => n.email === cleanEmail)) {
      memoryStore.newsletter.unshift(record);
    }
    res.status(200).json({
      success: true,
      source: 'memory_fallback',
      message: 'Successfully subscribed to SUPERSCIENCE drops and research briefs.'
    });
  }
});

// 8b. Seller Inquiry Desks - List Consultations, Bookings & Newsletter
app.get('/api/consultations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM sizing_consultations ORDER BY created_at DESC LIMIT 50');
    return res.json({ success: true, source: 'database', count: result.rows.length, data: result.rows });
  } catch (err) {
    return res.json({ success: true, source: 'memory_fallback', count: memoryStore.consultations.length, data: memoryStore.consultations });
  }
});

app.patch('/api/consultations/:id/status', async (req, res) => {
  const { status } = req.body;
  const id = parseInt(req.params.id, 10);
  try {
    await query('UPDATE sizing_consultations SET status = $1 WHERE id = $2', [status, id]);
  } catch (e) {}
  const mem = memoryStore.consultations.find(c => c.id === id);
  if (mem) mem.status = status;
  return res.json({ success: true, message: 'Consultation status updated' });
});

app.get('/api/bookings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM showroom_bookings ORDER BY created_at DESC LIMIT 50');
    return res.json({ success: true, source: 'database', count: result.rows.length, data: result.rows });
  } catch (err) {
    return res.json({ success: true, source: 'memory_fallback', count: memoryStore.bookings.length, data: memoryStore.bookings });
  }
});

app.patch('/api/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const id = parseInt(req.params.id, 10);
  try {
    await query('UPDATE showroom_bookings SET status = $1 WHERE id = $2', [status, id]);
  } catch (e) {}
  const mem = memoryStore.bookings.find(b => b.id === id);
  if (mem) mem.status = status;
  return res.json({ success: true, message: 'Booking status updated' });
});

app.get('/api/newsletter', async (req, res) => {
  try {
    const result = await query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, source: 'database', count: result.rows.length, data: result.rows });
  } catch (err) {
    return res.json({ success: true, source: 'memory_fallback', count: memoryStore.newsletter.length, data: memoryStore.newsletter });
  }
});

// 8c. Product Catalog Management (Add / Update / Delete Product)
app.post('/api/products', async (req, res) => {
  const p = req.body;
  if (!p.name || !p.price) {
    return res.status(400).json({ success: false, error: 'Product name and price are required' });
  }

  // Automatic Product ID sequencing if not provided or empty
  let productId = (p.id && p.id.trim() && p.id !== 'AUTO') ? p.id.trim() : null;
  if (!productId) {
    const category = p.category || 'tshirts';
    const prefixMap = { tshirts: 'SS-TEE-', shorts: 'SS-SHORTS-', caps: 'SS-CAP-' };
    const prefix = prefixMap[category] || 'SS-PROD-';
    try {
      const existing = await query('SELECT id FROM products WHERE id LIKE $1', [`${prefix}%`]);
      let maxNum = 0;
      existing.rows.forEach(r => {
        const numPart = r.id.replace(prefix, '');
        const n = parseInt(numPart, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      });
      const nextNum = maxNum + 1;
      productId = `${prefix}${nextNum < 10 ? '0' : ''}${nextNum}`;
    } catch (e) {
      productId = `${prefix}${Date.now().toString().slice(-4)}`;
    }
  }

  const newProduct = {
    id: productId,
    name: p.name,
    category: p.category || 'tshirts',
    categoryLabel: p.categoryLabel || (p.category === 'shorts' ? 'Heavyweight Shorts' : p.category === 'caps' ? 'Caps & Headwear' : 'Oversized T-Shirts'),
    price: Number(p.price || 4200),
    fit: p.fit || 'Oversized Boxy Fit',
    gsm: p.gsm || '380 GSM',
    fabric: p.fabric || '100% Combed Heavyweight Organic Cotton',
    images: typeof p.images === 'string'
      ? { primary: p.images, front: p.images, back: p.images }
      : (p.images && p.images.primary ? p.images : {
          primary: (p.image || 'assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif'),
          front: (p.image || 'assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif')
        }),
    colors: p.colors || [{ name: 'Blackout', hex: '#0a0a0a', inStock: true }],
    sizes: p.sizes || [
      { size: 'S', inStock: true },
      { size: 'M', inStock: true },
      { size: 'L', inStock: true },
      { size: 'XL', inStock: true }
    ],
    rating: Number(p.rating || 5.0),
    reviewsCount: parseInt(p.reviewsCount || 0, 10),
    badges: p.badges || ['NEW DROP'],
    workoutTieIn: p.workoutTieIn || 'Calibrated for heavy compound lifting.'
  };

  try {
    await query(`
      INSERT INTO products (
        id, name, category, category_label, price, fit, gsm, fabric,
        description, images, colors, sizes, rating, reviews_count, badges, workout_tie_in
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      newProduct.id, newProduct.name, newProduct.category, newProduct.categoryLabel,
      newProduct.price, newProduct.fit, newProduct.gsm, newProduct.fabric,
      newProduct.description, JSON.stringify(newProduct.images), JSON.stringify(newProduct.colors),
      JSON.stringify(newProduct.sizes), newProduct.rating, newProduct.reviewsCount,
      newProduct.badges, newProduct.workoutTieIn
    ]);
  } catch (err) {}

  initialProducts.unshift(newProduct);
  return res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
});

app.put('/api/products/:id', async (req, res) => {
  const pId = req.params.id;
  const updates = req.body;
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${idx++}`);
      values.push(Number(updates.price));
    }
    if (updates.gsm !== undefined) {
      fields.push(`gsm = $${idx++}`);
      values.push(updates.gsm);
    }
    if (updates.fit !== undefined) {
      fields.push(`fit = $${idx++}`);
      values.push(updates.fit);
    }
    if (updates.sizes !== undefined) {
      fields.push(`sizes = $${idx++}`);
      values.push(JSON.stringify(updates.sizes));
    }
    if (fields.length > 0) {
      values.push(pId);
      await query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }
  } catch (err) {
    console.error('[Update Product DB Error]:', err.message);
  }

  const prod = initialProducts.find(p => p.id === pId);
  if (prod) {
    if (updates.name) prod.name = updates.name;
    if (updates.price) prod.price = Number(updates.price);
    if (updates.gsm) prod.gsm = updates.gsm;
    if (updates.fit) prod.fit = updates.fit;
    if (updates.sizes) prod.sizes = updates.sizes;
    return res.json({ success: true, message: `Product ${pId} updated`, data: prod });
  }
  return res.status(404).json({ success: false, error: 'Product not found' });
});

app.delete('/api/products/:id', async (req, res) => {
  const pId = req.params.id;
  try {
    await query('DELETE FROM products WHERE id = $1', [pId]);
  } catch (err) {}

  const idx = initialProducts.findIndex(p => p.id === pId);
  if (idx > -1) {
    initialProducts.splice(idx, 1);
    return res.json({ success: true, message: `Product ${pId} deleted` });
  }
  return res.json({ success: true, message: `Product ${pId} removed` });
});

// 8d. Product Specimen Photo Upload (Zero-dependency Base64 image handler)
const uploadDir = path.join(__dirname, 'assets', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.post('/api/upload', (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    let buffer;
    let ext = 'jpg';

    // Handle data URL (data:image/png;base64,...)
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('jfif') || mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    // Generate safe unique filename
    const origExt = filename && path.extname(filename) ? path.extname(filename).slice(1) : ext;
    const baseSlug = filename ? path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) : 'specimen';
    const finalName = `upload-${Date.now()}-${baseSlug || 'specimen'}.${origExt || ext}`;
    const targetPath = path.join(uploadDir, finalName);

    fs.writeFileSync(targetPath, buffer);

    const relativeUrl = `assets/products/${finalName}`;
    return res.status(201).json({
      success: true,
      message: 'Product image uploaded successfully',
      url: relativeUrl,
      filename: finalName,
      sizeBytes: buffer.length
    });
  } catch (err) {
    console.error('[Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products/seed', async (req, res) => {
  try {
    for (const p of initialProducts) {
      await query(`
        INSERT INTO products (
          id, name, category, category_label, price, fit, gsm, fabric,
          description, images, colors, sizes, rating, reviews_count, badges, workout_tie_in
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          category_label = EXCLUDED.category_label,
          price = EXCLUDED.price,
          fit = EXCLUDED.fit,
          gsm = EXCLUDED.gsm,
          fabric = EXCLUDED.fabric,
          description = EXCLUDED.description,
          images = EXCLUDED.images,
          colors = EXCLUDED.colors,
          sizes = EXCLUDED.sizes,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          badges = EXCLUDED.badges,
          workout_tie_in = EXCLUDED.workout_tie_in;
      `, [
        p.id, p.name, p.category, p.categoryLabel, p.price, p.fit, p.gsm, p.fabric,
        p.description, JSON.stringify(p.images), JSON.stringify(p.colors), JSON.stringify(p.sizes),
        p.rating, p.reviewsCount, p.badges, p.workoutTieIn
      ]);
    }
    const countRes = await query('SELECT COUNT(*) as count FROM products');
    return res.json({ success: true, message: `Successfully synchronized ${countRes.rows[0].count} products in PostgreSQL`, count: parseInt(countRes.rows[0].count, 10) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   Workout Protocols & Training Programs REST Endpoints
   ========================================================================== */

// Helper to format program row from DB to frontend camelCase
function formatProgramRow(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    split: row.split,
    splitLabel: row.split_label || row.splitLabel,
    frequency: row.frequency,
    duration: row.duration,
    intensity: row.intensity,
    weeklyVolume: row.weekly_volume || row.weeklyVolume,
    experienceLevel: row.experience_level || row.experienceLevel,
    image: row.image,
    apparelRecommendation: typeof row.apparel_recommendation === 'string' 
      ? JSON.parse(row.apparel_recommendation) 
      : (row.apparel_recommendation || row.apparelRecommendation || null),
    scientificPrinciples: typeof row.scientific_principles === 'string'
      ? JSON.parse(row.scientific_principles)
      : (row.scientific_principles || row.scientificPrinciples || []),
    days: typeof row.days === 'string'
      ? JSON.parse(row.days)
      : (row.days || []),
    createdAt: row.created_at || new Date().toISOString()
  };
}

// 8a. List all workout programs (with optional ?split= filter)
app.get('/api/programs', async (req, res) => {
  try {
    const { split } = req.query;
    let sql = 'SELECT * FROM workout_programs';
    const params = [];
    if (split && split !== 'all') {
      sql += ' WHERE split = $1';
      params.push(split);
    }
    sql += ' ORDER BY created_at ASC';

    const result = await query(sql, params);
    if (result.rows.length > 0) {
      const formatted = result.rows.map(formatProgramRow);
      return res.json({ success: true, source: 'database', count: formatted.length, data: formatted });
    }
    // Fallback to memoryStore if query returns empty
    let list = [...memoryStore.programs];
    if (split && split !== 'all') {
      list = list.filter(p => p.split === split);
    }
    return res.json({ success: true, source: 'memory_store', count: list.length, data: list });
  } catch (err) {
    let list = [...memoryStore.programs];
    if (req.query.split && req.query.split !== 'all') {
      list = list.filter(p => p.split === req.query.split);
    }
    return res.json({ success: true, source: 'memory_fallback', count: list.length, data: list });
  }
});

// 8b. Get single workout program by ID
app.get('/api/programs/:id', async (req, res) => {
  const progId = req.params.id;
  try {
    const result = await query('SELECT * FROM workout_programs WHERE id = $1', [progId]);
    if (result.rows.length > 0) {
      return res.json({ success: true, source: 'database', data: formatProgramRow(result.rows[0]) });
    }
    const memProg = memoryStore.programs.find(p => p.id === progId);
    if (memProg) return res.json({ success: true, source: 'memory', data: memProg });
    return res.status(404).json({ success: false, error: 'Workout protocol not found' });
  } catch (err) {
    const memProg = memoryStore.programs.find(p => p.id === progId);
    if (memProg) return res.json({ success: true, source: 'memory_fallback', data: memProg });
    return res.status(404).json({ success: false, error: 'Workout protocol not found' });
  }
});

// 8c. Create / Upload new workout program (Seller Desk)
app.post('/api/programs', async (req, res) => {
  try {
    const {
      id,
      title,
      subtitle,
      split,
      splitLabel,
      frequency,
      duration,
      intensity,
      weeklyVolume,
      experienceLevel,
      image,
      apparelRecommendation,
      scientificPrinciples,
      days
    } = req.body;

    if (!title || !split) {
      return res.status(400).json({ success: false, error: 'Title and Split category are required fields' });
    }

    const progId = (id && id.trim()) ? id.trim() : `PROG-${split.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    const finalProgram = {
      id: progId,
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      split: split.trim().toLowerCase(),
      splitLabel: splitLabel || title,
      frequency: frequency || '4-5 Days / Week',
      duration: duration || '60 Min',
      intensity: intensity || '1 - 2 RIR',
      weeklyVolume: weeklyVolume || '12 - 16 Sets / Muscle Group',
      experienceLevel: experienceLevel || 'Intermediate',
      image: image || 'assets/stock/program_upper_lower.jpg',
      apparelRecommendation: apparelRecommendation || null,
      scientificPrinciples: Array.isArray(scientificPrinciples) ? scientificPrinciples : [],
      days: Array.isArray(days) ? days : []
    };

    // Attempt DB persistence
    let dbSaved = false;
    let dbWarning = null;
    try {
      await query(`
        INSERT INTO workout_programs (
          id, title, subtitle, split, split_label, frequency, duration,
          intensity, weekly_volume, experience_level, image,
          apparel_recommendation, scientific_principles, days
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          split = EXCLUDED.split,
          split_label = EXCLUDED.split_label,
          frequency = EXCLUDED.frequency,
          duration = EXCLUDED.duration,
          intensity = EXCLUDED.intensity,
          weekly_volume = EXCLUDED.weekly_volume,
          experience_level = EXCLUDED.experience_level,
          image = EXCLUDED.image,
          apparel_recommendation = EXCLUDED.apparel_recommendation,
          scientific_principles = EXCLUDED.scientific_principles,
          days = EXCLUDED.days;
      `, [
        finalProgram.id,
        finalProgram.title,
        finalProgram.subtitle,
        finalProgram.split,
        finalProgram.splitLabel,
        finalProgram.frequency,
        finalProgram.duration,
        finalProgram.intensity,
        finalProgram.weeklyVolume,
        finalProgram.experienceLevel,
        finalProgram.image,
        JSON.stringify(finalProgram.apparelRecommendation || {}),
        JSON.stringify(finalProgram.scientificPrinciples || []),
        JSON.stringify(finalProgram.days || [])
      ]);
      dbSaved = true;
    } catch (dbErr) {
      console.warn('[Postgres Workout Insert Warning]:', dbErr.message);
      dbWarning = dbErr.message;
    }

    // Always update memoryStore as well
    const existingIndex = memoryStore.programs.findIndex(p => p.id === finalProgram.id);
    if (existingIndex > -1) {
      memoryStore.programs[existingIndex] = finalProgram;
    } else {
      memoryStore.programs.unshift(finalProgram);
    }

    return res.status(201).json({
      success: true,
      source: dbSaved ? 'database' : 'memory_fallback',
      dbSaved,
      warning: dbWarning,
      message: dbSaved ? `Workout protocol ${finalProgram.id} saved to PostgreSQL database` : 'Saved to memory buffer',
      data: finalProgram
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8d. Update workout program
app.put('/api/programs/:id', async (req, res) => {
  const progId = req.params.id;
  const updates = req.body;
  try {
    const memIndex = memoryStore.programs.findIndex(p => p.id === progId);
    if (memIndex > -1) {
      memoryStore.programs[memIndex] = { ...memoryStore.programs[memIndex], ...updates };
    }
    try {
      await query(`
        UPDATE workout_programs
        SET title = COALESCE($2, title),
            subtitle = COALESCE($3, subtitle),
            split = COALESCE($4, split),
            split_label = COALESCE($5, split_label),
            frequency = COALESCE($6, frequency),
            duration = COALESCE($7, duration),
            intensity = COALESCE($8, intensity),
            weekly_volume = COALESCE($9, weekly_volume),
            experience_level = COALESCE($10, experience_level),
            image = COALESCE($11, image),
            apparel_recommendation = COALESCE($12, apparel_recommendation),
            scientific_principles = COALESCE($13, scientific_principles),
            days = COALESCE($14, days)
        WHERE id = $1;
      `, [
        progId,
        updates.title,
        updates.subtitle,
        updates.split,
        updates.splitLabel,
        updates.frequency,
        updates.duration,
        updates.intensity,
        updates.weeklyVolume,
        updates.experienceLevel,
        updates.image,
        updates.apparelRecommendation ? JSON.stringify(updates.apparelRecommendation) : null,
        updates.scientificPrinciples ? JSON.stringify(updates.scientificPrinciples) : null,
        updates.days ? JSON.stringify(updates.days) : null
      ]);
    } catch (e) {
      console.warn('[Postgres Workout Update Warning]:', e.message);
    }

    return res.json({ success: true, message: `Workout protocol ${progId} updated` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8e. Delete workout program
app.delete('/api/programs/:id', async (req, res) => {
  const progId = req.params.id;
  try {
    await query('DELETE FROM workout_programs WHERE id = $1', [progId]);
  } catch (err) {}

  const idx = memoryStore.programs.findIndex(p => p.id === progId);
  if (idx > -1) {
    memoryStore.programs.splice(idx, 1);
  }
  return res.json({ success: true, message: `Workout protocol ${progId} deleted` });
});

// 8f. Synchronize / Seed default workout programs to PostgreSQL
app.post('/api/programs/seed', async (req, res) => {
  try {
    for (const pr of initialPrograms) {
      await query(`
        INSERT INTO workout_programs (
          id, title, subtitle, split, split_label, frequency, duration,
          intensity, weekly_volume, experience_level, image,
          apparel_recommendation, scientific_principles, days
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          split = EXCLUDED.split,
          split_label = EXCLUDED.split_label,
          frequency = EXCLUDED.frequency,
          duration = EXCLUDED.duration,
          intensity = EXCLUDED.intensity,
          weekly_volume = EXCLUDED.weekly_volume,
          experience_level = EXCLUDED.experience_level,
          image = EXCLUDED.image,
          apparel_recommendation = EXCLUDED.apparel_recommendation,
          scientific_principles = EXCLUDED.scientific_principles,
          days = EXCLUDED.days;
      `, [
        pr.id, pr.title, pr.subtitle, pr.split, pr.splitLabel, pr.frequency, pr.duration,
        pr.intensity, pr.weeklyVolume, pr.experienceLevel, pr.image,
        JSON.stringify(pr.apparelRecommendation || {}),
        JSON.stringify(pr.scientificPrinciples || []),
        JSON.stringify(pr.days || [])
      ]);
    }
    const countRes = await query('SELECT COUNT(*) as count FROM workout_programs');
    return res.json({
      success: true,
      message: `Successfully synchronized ${countRes.rows[0].count} workout protocols in PostgreSQL`,
      count: parseInt(countRes.rows[0].count, 10)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Database Stats & Dashboard Summary
app.get('/api/stats', async (req, res) => {
  try {
    const [pRes, oRes, cRes, bRes, nRes, progRes] = await Promise.all([
      query('SELECT COUNT(*) FROM products'),
      query('SELECT COUNT(*) FROM orders'),
      query('SELECT COUNT(*) FROM sizing_consultations'),
      query('SELECT COUNT(*) FROM showroom_bookings'),
      query('SELECT COUNT(*) FROM newsletter_subscribers'),
      query('SELECT COUNT(*) FROM workout_programs')
    ]);

    res.json({
      success: true,
      source: 'database',
      stats: {
        products: parseInt(pRes.rows[0].count, 10),
        orders: parseInt(oRes.rows[0].count, 10),
        sizingConsultations: parseInt(cRes.rows[0].count, 10),
        showroomBookings: parseInt(bRes.rows[0].count, 10),
        newsletterSubscribers: parseInt(nRes.rows[0].count, 10),
        programs: parseInt(progRes.rows[0].count, 10)
      }
    });
  } catch (err) {
    // Return memory fallback counts
    res.json({
      success: true,
      source: 'memory_fallback',
      stats: {
        products: initialProducts.length,
        orders: memoryStore.orders.length,
        sizingConsultations: memoryStore.consultations.length,
        showroomBookings: memoryStore.bookings.length,
        newsletterSubscribers: memoryStore.newsletter.length,
        programs: memoryStore.programs.length
      }
    });
  }
});

// Wildcard HTML fallback for single-page routing if needed
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

// Start listening
let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`⚡ SUPERSCIENCE Web & API Server Running`);
    console.log(`🌐 Local URL:  http://localhost:${PORT}`);
    console.log(`📡 API Status: http://localhost:${PORT}/api/health`);
    console.log(`📦 Catalog:    http://localhost:${PORT}/api/products`);
    console.log(`======================================================\n`);
    autoInitSchemaIfConnected();
  });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
