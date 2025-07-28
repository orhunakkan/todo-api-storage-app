const pool = require('../config/database');

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Delete all data in reverse order of dependencies
    console.log('Deleting todos...');
    const todosResult = await pool.query('DELETE FROM todos');
    console.log(`Deleted ${todosResult.rowCount} todos`);
    
    console.log('Deleting categories...');
    const categoriesResult = await pool.query('DELETE FROM categories');
    console.log(`Deleted ${categoriesResult.rowCount} categories`);
    
    console.log('Deleting users...');
    const usersResult = await pool.query('DELETE FROM users');
    console.log(`Deleted ${usersResult.rowCount} users`);
    
    // Reset sequences to start from 1 again
    console.log('Resetting ID sequences...');
    await pool.query('ALTER SEQUENCE todos_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    console.log('ID sequences reset');
    
    console.log('Database cleanup completed successfully!');
    console.log('All data has been removed and ID sequences reset');
    
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('Cleanup process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };
