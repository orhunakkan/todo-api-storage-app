const { Pool } = require('pg');
require('dotenv').config();

async function setupTestDatabase() {
  // First connect to postgres database to create our test database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create test database if it doesn't exist
    const testDbName = process.env.TEST_DB_NAME || 'todo_test';

    // Drop existing test database if it exists
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
      console.log(`Dropped existing test database ${testDbName}`);
    } catch (error) {
      console.log('No existing test database to drop');
    }

    // Create fresh test database
    await adminPool.query(`CREATE DATABASE ${testDbName}`);
    console.log(`Test database ${testDbName} created successfully`);
  } catch (error) {
    console.error('Error creating test database:', error.message);
    throw error;
  } finally {
    await adminPool.end();
  }

  // Now connect to our test database to create tables
  const testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'todo_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create tables
    await createTables(testPool);
    console.log('All test tables created successfully');
  } catch (error) {
    console.error('Error setting up test tables:', error);
    throw error;
  } finally {
    await testPool.end();
  }
}

async function createTables(pool) {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#007bff',
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Todos table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      due_date TIMESTAMP,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
  `);

  console.log('Test tables created: users, categories, todos');
}

if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('Test database setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTestDatabase };
