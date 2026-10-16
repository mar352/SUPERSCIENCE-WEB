const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool Configuration
// Supports either a full DATABASE_URL (Supabase, Neon, Render, Railway, local)
// or individual PG* environment variables.
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.PGSSL === 'true' || connectionString.includes('sslmode=require') || connectionString.includes('supabase.co') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'superscience',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

// Helper for running queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[SQL]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

// Test connection without throwing an unhandled fatal error
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as database');
    return {
      connected: true,
      database: res.rows[0].database,
      currentTime: res.rows[0].current_time
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
