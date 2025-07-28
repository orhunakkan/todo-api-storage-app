const { Pool } = require('pg');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.NODE_ENV === 'test' ? process.env.TEST_DB_NAME || 'todo_test' : process.env.DB_NAME || 'todo_api_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '4284',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', err => {
  console.error('Database connection error:', err);
});

module.exports = pool;
