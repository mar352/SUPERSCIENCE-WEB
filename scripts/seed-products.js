const { query, testConnection } = require('../db');
const { initialProducts } = require('./init-db');

async function seedProducts() {
  console.log('--- SUPERSCIENCE: Syncing Products to PostgreSQL ---');
  
  const conn = await testConnection();
  if (!conn.connected) {
    console.error('Cannot connect to PostgreSQL:', conn.error);
    process.exit(1);
  }
  console.log(`Connected to PostgreSQL database: "${conn.database}"`);

  // Ensure products table exists
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

  let count = 0;
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
    count++;
    console.log(`[${count}/${initialProducts.length}] Synced specimen: ${p.id} - ${p.name}`);
  }

  const res = await query('SELECT count(*) as total FROM products');
  console.log(`\n✓ SUCCESS: ${res.rows[0].total} products are fully stored and synchronized in PostgreSQL.`);
  process.exit(0);
}

seedProducts().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
