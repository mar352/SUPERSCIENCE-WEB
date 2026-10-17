const { Pool, Client } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool Configuration
// Supports either a full DATABASE_URL (Supabase, Neon, Render, Railway, local)
// or individual PG* environment variables.
function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return {
      connectionString,
      ssl: process.env.PGSSL === 'true' || connectionString.includes('sslmode=require') || connectionString.includes('supabase.co') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
    };
  }

  const cfg = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    database: process.env.PGDATABASE || 'superscience',
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  };

  if (process.env.PGPASSWORD && process.env.PGPASSWORD.trim() !== '') {
    cfg.password = process.env.PGPASSWORD;
  }

  return cfg;
}

const pool = new Pool(buildPoolConfig());

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

// Automatically create database if it doesn't exist yet
async function ensureDatabaseExists() {
  const targetDb = process.env.PGDATABASE || 'superscience';
  if (targetDb === 'postgres') return;

  try {
    const adminConfig = {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      database: 'postgres',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    };
    if (process.env.PGPASSWORD && process.env.PGPASSWORD.trim() !== '') {
      adminConfig.password = process.env.PGPASSWORD;
    }

    const client = new Client(adminConfig);
    await client.connect();
    const checkRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (checkRes.rowCount === 0) {
      console.log(`[PostgreSQL] Database "${targetDb}" does not exist. Creating it now...`);
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`[PostgreSQL] Database "${targetDb}" created successfully.`);
    }
    await client.end();
  } catch (err) {
    // Non-fatal, pool will report if it cannot connect
  }
}

// Test connection without throwing an unhandled fatal error
async function testConnection() {
  try {
    await ensureDatabaseExists();
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

