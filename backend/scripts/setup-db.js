const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  // First connect to postgres database to create our app database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'todo_api_db';
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database already exists, continuing...');
    } else {
      console.error('Error creating database:', error.message);
      throw error;
    }
  } finally {
    await adminPool.end();
  }

  // Now connect to our app database to create tables
  const appPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'todo_api_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create tables
    await createTables(appPool);
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
    throw error;
  } finally {
    await appPool.end();
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

  console.log('Tables created: users, categories, todos');
}

if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
