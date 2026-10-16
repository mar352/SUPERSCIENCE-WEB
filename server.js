const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, query, testConnection } = require('./db');
const { initialProducts } = require('./scripts/init-db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// In-memory fallback cache for live store activity
const memoryStore = {
  orders: [],
  consultations: [],
  bookings: [],
  newsletter: []
};

// 4. Orders - Create new order (Checkout submission)
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

    // Keep in memory copy too
    memoryStore.orders.unshift(record);

    return res.status(201).json({
      success: true,
      source: 'database',
      orderId,
      message: 'Order recorded successfully in PostgreSQL'
    });
  } catch (err) {
    // Save to memory store
    memoryStore.orders.unshift(record);

    return res.status(200).json({
      success: true,
      source: 'memory_fallback',
      orderId,
      warning: `Saved to memory buffer (DB offline: ${err.message})`
    });
  }
});

// 5. Orders - List recent orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    return res.json({ success: true, source: 'database', count: result.rows.length, orders: result.rows });
  } catch (err) {
    return res.json({ success: true, source: 'memory_fallback', count: memoryStore.orders.length, orders: memoryStore.orders });
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
  if (!p.id || !p.name || !p.price) {
    return res.status(400).json({ success: false, error: 'Product ID, name, and price are required' });
  }
  const newProduct = {
    id: p.id,
    name: p.name,
    category: p.category || 'tshirts',
    categoryLabel: p.categoryLabel || (p.category === 'shorts' ? 'Heavyweight Shorts' : p.category === 'caps' ? 'Caps & Headwear' : 'Oversized T-Shirts'),
    price: Number(p.price || 4200),
    fit: p.fit || 'Oversized Boxy Fit',
    gsm: p.gsm || '380 GSM',
    fabric: p.fabric || '100% Combed Heavyweight Organic Cotton',
    description: p.description || 'Engineered luxury streetwear garment.',
    images: p.images || {
      primary: 'assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif',
      front: 'assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif'
    },
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
  return res.status(201).json({ success: true, message: 'Garment specimen created successfully', data: newProduct });
});

app.put('/api/products/:id', async (req, res) => {
  const pId = req.params.id;
  const updates = req.body;
  try {
    if (updates.price) {
      await query('UPDATE products SET price = $1 WHERE id = $2', [Number(updates.price), pId]);
    }
  } catch (err) {}

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

// 9. Database Stats & Dashboard Summary
app.get('/api/stats', async (req, res) => {
  try {
    const [pRes, oRes, cRes, bRes, nRes] = await Promise.all([
      query('SELECT COUNT(*) FROM products'),
      query('SELECT COUNT(*) FROM orders'),
      query('SELECT COUNT(*) FROM sizing_consultations'),
      query('SELECT COUNT(*) FROM showroom_bookings'),
      query('SELECT COUNT(*) FROM newsletter_subscribers')
    ]);

    res.json({
      success: true,
      source: 'database',
      stats: {
        products: parseInt(pRes.rows[0].count, 10),
        orders: parseInt(oRes.rows[0].count, 10),
        sizingConsultations: parseInt(cRes.rows[0].count, 10),
        showroomBookings: parseInt(bRes.rows[0].count, 10),
        newsletterSubscribers: parseInt(nRes.rows[0].count, 10)
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
        newsletterSubscribers: memoryStore.newsletter.length
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`⚡ SUPERSCIENCE Web & API Server Running`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`📡 API Status: http://localhost:${PORT}/api/health`);
  console.log(`📦 Catalog:    http://localhost:${PORT}/api/products`);
  console.log(`======================================================\n`);
  autoInitSchemaIfConnected();
});

module.exports = { app, server };
