const crypto = require('crypto');
const { pool, query } = require('../db');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

const initialUsers = [
  {
    id: 'USR-ADMIN-01',
    email: 'admin@superscience.ph',
    password: 'admin123',
    salt: 'salt_admin_8842',
    name: 'Store Admin',
    role: 'admin',
    athlete_id: 'SS-SELLER-01',
    tier: 'ADMIN // MASTER'
  },
  {
    id: 'USR-ATH-01',
    email: 'lifter@superscience.test',
    password: 'password123',
    salt: 'salt_user_3914',
    name: 'Marcus Vance',
    role: 'user',
    athlete_id: 'SS-ATH-9821',
    tier: 'TIER 01'
  }
];

initialUsers.forEach(u => {
  u.password_hash = hashPassword(u.password, u.salt);
});

const initialProducts = [
  {
    id: "SS-TEE-01",
    name: "Blackout Heavyweight Boxy Tee",
    category: "tshirts",
    categoryLabel: "Oversized T-Shirts",
    price: 4200.00,
    fit: "Oversized Boxy Fit",
    gsm: "380 GSM",
    fabric: "100% Combed Heavyweight Organic Cotton",
    description: "Signature SUPERSCIENCE Blackout tee. Dense 380 GSM cotton jersey with drop-shoulder geometry, thick 1.25-inch ribbed collar, chest branding, and woven sleeve tag. Pre-shrunk bio-enzyme wash for zero distortion.",
    images: {
      primary: "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif",
      front: "assets/products/d0d159a5-2fc7-4bb2-b155-ccdcc942f226.jfif",
      back: "assets/products/3625c097-e479-4def-9f8d-d77f753fe93d.jfif"
    },
    colors: [
      { name: "Blackout", hex: "#0a0a0a", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 142,
    badges: ["BESTSELLER", "380 GSM"],
    workoutTieIn: "Ideal for upper body lifting days — structured chest drape with unrestricted shoulder mobility."
  },
  {
    id: "SS-SHO-01",
    name: "Blackout Heavyweight Training Shorts",
    category: "shorts",
    categoryLabel: "Heavyweight Shorts",
    price: 4800.00,
    fit: "Relaxed 6\" Inseam",
    gsm: "420 GSM",
    fabric: "420 GSM High-Density Mesh & French Terry",
    description: "Engineered specifically for heavy lifting sessions. Features a 6-inch above-the-knee cut, custom branded aglets, deep concealed pockets, ribbed elastic waistband, and tonal SUPERSCIENCE branding.",
    images: {
      primary: "assets/products/6fc2635d-29ae-44b8-9478-5879726e1085.jfif",
      front: "assets/products/3f1fa169-a2d0-4f2e-b15e-52978c01d732.jfif",
      back: "assets/products/e18f15f5-2146-496c-9644-57f1f0cdef4c.jfif"
    },
    colors: [
      { name: "Blackout", hex: "#0a0a0a", inStock: true },
      { name: "Pitch Black", hex: "#141414", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 5.0,
    reviewsCount: 184,
    badges: ["ICONIC DROP", "420 GSM"],
    workoutTieIn: "Maximum hip hinge and quad clearance for deep squats, leg presses, and Romanian deadlifts."
  },
  {
    id: "SS-TEE-02",
    name: "Off-White Heavyweight Boxy Tee",
    category: "tshirts",
    categoryLabel: "Oversized T-Shirts",
    price: 4200.00,
    fit: "Oversized Boxy Fit",
    gsm: "380 GSM",
    fabric: "100% Organic Raw Combed Cotton",
    description: "Clean studio off-white architectural drop-shoulder tee. Substantial 380 GSM drape with minimalist chest SUPERSCIENCE emblem, thick crew collar, and custom hem woven label.",
    images: {
      primary: "assets/products/fac38579-7ac8-40ac-824b-a3a73b9e8903.jfif",
      front: "assets/products/fac38579-7ac8-40ac-824b-a3a73b9e8903.jfif",
      back: "assets/products/9779ea37-17d0-463f-a828-35f576c87b1c.jfif"
    },
    colors: [
      { name: "Off White", hex: "#f5f5f3", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.8,
    reviewsCount: 98,
    badges: ["NEW RELEASE", "380 GSM"],
    workoutTieIn: "Breathable heavy cotton optimal for pump cover and street commute."
  },
  {
    id: "SS-CAP-01",
    name: "Vintage Distressed Suede Trucker Cap",
    category: "caps",
    categoryLabel: "Caps & Headwear",
    price: 2500.00,
    fit: "Adjustable 6-Panel Strapback",
    gsm: "280 GSM",
    fabric: "Stone-Washed Suede Crown & High-Airflow Mesh",
    description: "Curved visor in vintage distressed suede with breathable rear mesh and tonal brass strapback. Features official 'IN SCIENCE WE TRUST // FACTS OVER MYTHS' round embroidery insignia.",
    images: {
      primary: "assets/products/6f932f06-daf5-4432-acb6-2cd191978d22.jfif",
      front: "assets/products/6f932f06-daf5-4432-acb6-2cd191978d22.jfif",
      back: "assets/products/697b7c8a-089a-4c7e-bbf2-76000d2c15b2.jfif"
    },
    colors: [
      { name: "Washed Charcoal", hex: "#2b2b2e", inStock: true }
    ],
    sizes: [
      { size: "ONE SIZE", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 196,
    badges: ["BESTSELLER", "SUEDE & MESH"],
    workoutTieIn: "Minimizes sensory distractions and locks focus during high-effort lifting sets."
  },
  {
    id: "SS-SHO-02",
    name: "Stealth Slate Heavyweight Training Shorts",
    category: "shorts",
    categoryLabel: "Heavyweight Shorts",
    price: 4800.00,
    fit: "Relaxed 6\" Inseam",
    gsm: "420 GSM",
    fabric: "420 GSM Custom-Milled Heavy Mesh & French Terry",
    description: "Stealth slate grey training shorts with tonal rubberized SUPERSCIENCE branding, reinforced deep pockets, custom engraved aglets, and 6-inch quad-revealing athletic inseam.",
    images: {
      primary: "assets/products/150ef353-6df1-4496-af62-2c683fb11420.jfif",
      front: "assets/products/150ef353-6df1-4496-af62-2c683fb11420.jfif",
      back: "assets/products/6fc2635d-29ae-44b8-9478-5879726e1085.jfif"
    },
    colors: [
      { name: "Stealth Slate", hex: "#474d53", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 112,
    badges: ["ICONIC DROP", "420 GSM"],
    workoutTieIn: "Thermal breathability and non-restrictive thigh width for Olympic weightlifting and powerbuilding."
  },
  {
    id: "SS-TEE-03",
    name: "Lifestyle Forest Green Oversized Tee",
    category: "tshirts",
    categoryLabel: "Oversized T-Shirts",
    price: 4400.00,
    fit: "Relaxed Drop-Shoulder Fit",
    gsm: "380 GSM",
    fabric: "100% Combed Heavyweight Organic Cotton",
    description: "Deep forest green tone with bold 'Lifestyle. SUPERSCIENCE' graphic typography. High-density knit holding structural boxy drape with woven hem label.",
    images: {
      primary: "assets/products/762380e8-44dd-4c09-9737-c730060c9a3b.jfif",
      front: "assets/products/762380e8-44dd-4c09-9737-c730060c9a3b.jfif",
      back: "assets/products/3625c097-e479-4def-9f8d-d77f753fe93d.jfif"
    },
    colors: [
      { name: "Forest Green", hex: "#1c3b2b", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 64,
    badges: ["LIMITED RUN", "380 GSM"],
    workoutTieIn: "High-density knit holds structural silhouette through intense barbell sessions."
  },
  {
    id: "SS-SHO-03",
    name: "Cream Heavyweight Mesh Training Shorts",
    category: "shorts",
    categoryLabel: "Heavyweight Shorts",
    price: 4800.00,
    fit: "Boxy Athletic Cut (6\" Inseam)",
    gsm: "420 GSM",
    fabric: "100% Double-Layer Air Mesh with Poly-Cotton Liner",
    description: "Signature Cream colorway with woven Authentic SUPERSCIENCE Est. 2023 patch, thick ribbed elastic waistband, raw cream drawstrings with metal aglets, and deep side zip pockets.",
    images: {
      primary: "assets/products/5f9668d7-8578-4718-8a8b-4680cfc1482b.jfif",
      front: "assets/products/5f9668d7-8578-4718-8a8b-4680cfc1482b.jfif",
      back: "assets/products/150ef353-6df1-4496-af62-2c683fb11420.jfif"
    },
    colors: [
      { name: "Cream / Ivory", hex: "#f0ede6", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.8,
    reviewsCount: 79,
    badges: ["NEW RELEASE", "420 GSM"],
    workoutTieIn: "Built-in crotch gusset prevents seam tearing during maximum depth squats."
  },
  {
    id: "SS-CAP-02",
    name: "Two-Tone Suede & Mesh Trucker Cap",
    category: "caps",
    categoryLabel: "Caps & Headwear",
    price: 2700.00,
    fit: "Adjustable 6-Panel Strapback",
    gsm: "280 GSM",
    fabric: "Premium White Suede Front & Tan Suede Visor",
    description: "Luxury two-tone construction with white suede face panel, rich tan suede visor, and breathable espresso brown mesh. Screenprinted 'IN SCIENCE WE TRUST' graphic seal.",
    images: {
      primary: "assets/products/697b7c8a-089a-4c7e-bbf2-76000d2c15b2.jfif",
      front: "assets/products/697b7c8a-089a-4c7e-bbf2-76000d2c15b2.jfif",
      back: "assets/products/6f932f06-daf5-4432-acb6-2cd191978d22.jfif"
    },
    colors: [
      { name: "Tan / White Suede", hex: "#c29b68", inStock: true }
    ],
    sizes: [
      { size: "ONE SIZE", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 88,
    badges: ["NEW RELEASE", "TWO-TONE"],
    workoutTieIn: "Breathable natural twill & mesh prevents sweat buildup through training."
  },
  {
    id: "SS-TEE-04",
    name: "Sky Is The Limit Navy Boxy Tee",
    category: "tshirts",
    categoryLabel: "Oversized T-Shirts",
    price: 4400.00,
    fit: "Oversized Boxy Fit",
    gsm: "380 GSM",
    fabric: "100% Combed Heavyweight Organic Cotton",
    description: "Midnight navy heavyweight boxy tee with celestial 'Sky is the Limit // Everything's Possible Est. 2023' typography, branded sleeve print, and hem woven label.",
    images: {
      primary: "assets/products/9f277685-422e-4960-8a7c-d0a0e5e73186.jfif",
      front: "assets/products/9f277685-422e-4960-8a7c-d0a0e5e73186.jfif",
      back: "assets/products/3625c097-e479-4def-9f8d-d77f753fe93d.jfif"
    },
    colors: [
      { name: "Midnight Navy", hex: "#192538", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 82,
    badges: ["GRAPHIC TEE", "380 GSM"],
    workoutTieIn: "Heavyweight drape gives a commanding pump cover silhouette."
  },
  {
    id: "SS-SHO-04",
    name: "Forest Green Heavyweight Training Shorts",
    category: "shorts",
    categoryLabel: "Heavyweight Shorts",
    price: 4800.00,
    fit: "Relaxed 6\" Inseam",
    gsm: "420 GSM",
    fabric: "420 GSM Double-Knit Athletic Mesh",
    description: "Forest green heavyweight training shorts with tonal SUPERSCIENCE branding, custom metal aglets, and thick ribbed waistband.",
    images: {
      primary: "assets/products/91e7117f-3c74-46e0-b00a-61688512c10e.jfif",
      front: "assets/products/91e7117f-3c74-46e0-b00a-61688512c10e.jfif",
      back: "assets/products/6fc2635d-29ae-44b8-9478-5879726e1085.jfif"
    },
    colors: [
      { name: "Forest Green", hex: "#1c3b2b", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 76,
    badges: ["LIMITED DROP", "420 GSM"],
    workoutTieIn: "Uninhibited hip flexion for deep squats and heavy hip thrusts."
  },
  {
    id: "SS-SHO-05",
    name: "Navy Blue Heavyweight Training Shorts",
    category: "shorts",
    categoryLabel: "Heavyweight Shorts",
    price: 4800.00,
    fit: "Relaxed 6\" Inseam",
    gsm: "420 GSM",
    fabric: "420 GSM Custom-Milled Heavy Mesh",
    description: "Navy blue training shorts with tonal SUPERSCIENCE print, custom drawcord aglets, and authentic woven patch.",
    images: {
      primary: "assets/products/9c49a136-ebe3-4ecf-b11c-c117c250b06e.jfif",
      front: "assets/products/a89c111f-74fa-4f73-838d-76d6ad22fc8d.jfif",
      back: "assets/products/9c49a136-ebe3-4ecf-b11c-c117c250b06e.jfif"
    },
    colors: [
      { name: "Navy Blue", hex: "#192538", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.8,
    reviewsCount: 91,
    badges: ["420 GSM", "ATHLETIC FIT"],
    workoutTieIn: "Engineered with reinforced split hems for sprint and leg work."
  },
  {
    id: "SS-TEE-05",
    name: "Lowkey Ringer Contrast Boxy Tee",
    category: "tshirts",
    categoryLabel: "Oversized T-Shirts",
    price: 4200.00,
    fit: "Oversized Drop-Shoulder Fit",
    gsm: "380 GSM",
    fabric: "100% Combed Heavyweight Organic Cotton",
    description: "High-contrast stark white tee with black contrast rib collar, vintage 'Lowkey' script print, and SUPERSCIENCE sleeve graphic.",
    images: {
      primary: "assets/products/f89fe85d-e991-476a-9b8f-f54432fe4745.jfif",
      front: "assets/products/f89fe85d-e991-476a-9b8f-f54432fe4745.jfif",
      back: "assets/products/c0994b75-f62f-4db3-9e3d-146f3600bb8e.jfif"
    },
    colors: [
      { name: "White / Black Rib", hex: "#ffffff", inStock: true }
    ],
    sizes: [
      { size: "S", inStock: true },
      { size: "M", inStock: true },
      { size: "L", inStock: true },
      { size: "XL", inStock: true }
    ],
    rating: 4.9,
    reviewsCount: 104,
    badges: ["RINGER TEE", "380 GSM"],
    workoutTieIn: "Contrast collar frames traps and neck line with clean drape."
  }
];

async function initializeDatabase() {
  console.log('[PostgreSQL] Initializing SUPERSCIENCE schema and tables...');

  try {
    // 1. Products Table
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
    `);
    console.log('✓ Table "products" ready.');

    // 2. Orders Table
    await query(`
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
    `);
    console.log('✓ Table "orders" ready.');

    // 3. Sizing Consultations Table
    await query(`
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
    `);
    console.log('✓ Table "sizing_consultations" ready.');

    // 4. Showroom Bookings Table
    await query(`
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
    `);
    console.log('✓ Table "showroom_bookings" ready.');

    // 5. Newsletter Subscribers Table
    await query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        source VARCHAR(100) DEFAULT 'footer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table "newsletter_subscribers" ready.');

    // 6. Users & Accounts Table
    await query(`
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
    `);
    console.log('✓ Table "users" ready.');

    // 7. Persistent User & Admin Sessions Table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('✓ Table "sessions" ready.');

    // 8. Chat Messages Table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table "chat_messages" ready.');

    // Seed Initial Users & Admin
    console.log('[PostgreSQL] Seeding admin and athlete accounts...');
    for (const u of initialUsers) {
      await query(`
        INSERT INTO users (id, email, password_hash, salt, name, role, athlete_id, tier)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING;
      `, [u.id, u.email, u.password_hash, u.salt, u.name, u.role, u.athlete_id, u.tier]);
    }
    console.log(`✓ Seeded ${initialUsers.length} user accounts successfully.`);

    // Seed Initial Products
    console.log('[PostgreSQL] Seeding initial product catalog...');
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
        p.id,
        p.name,
        p.category,
        p.categoryLabel,
        p.price,
        p.fit,
        p.gsm,
        p.fabric,
        p.description,
        JSON.stringify(p.images),
        JSON.stringify(p.colors),
        JSON.stringify(p.sizes),
        p.rating,
        p.reviewsCount,
        p.badges,
        p.workoutTieIn
      ]);
    }
    console.log(`✓ Seeded ${initialProducts.length} products successfully.`);
    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, initialProducts, initialUsers, hashPassword };
