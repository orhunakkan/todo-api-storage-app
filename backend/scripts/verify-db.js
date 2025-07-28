const pool = require('../config/database');

async function verifyCleanDatabase() {
  try {
    console.log('🔍 Verifying database state...\n');

    // Check users table
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersResult.rows[0].count);
    console.log(`👥 Users: ${userCount}`);

    // Check categories table
    const categoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
    const categoryCount = parseInt(categoriesResult.rows[0].count);
    console.log(`📁 Categories: ${categoryCount}`);

    // Check todos table
    const todosResult = await pool.query('SELECT COUNT(*) FROM todos');
    const todoCount = parseInt(todosResult.rows[0].count);
    console.log(`📝 Todos: ${todoCount}`);

    // Check sequence values
    const userSeq = await pool.query('SELECT last_value FROM users_id_seq');
    const categorySeq = await pool.query('SELECT last_value FROM categories_id_seq');
    const todoSeq = await pool.query('SELECT last_value FROM todos_id_seq');

    console.log('\n🔢 Sequence Values:');
    console.log(`   Users ID sequence: ${userSeq.rows[0].last_value}`);
    console.log(`   Categories ID sequence: ${categorySeq.rows[0].last_value}`);
    console.log(`   Todos ID sequence: ${todoSeq.rows[0].last_value}`);

    const totalRecords = userCount + categoryCount + todoCount;

    if (totalRecords === 0) {
      console.log('\n✅ Database is completely clean!');
      console.log('✅ Perfect for fresh start or testing registration flows');
    } else {
      console.log(`\n⚠️  Database contains ${totalRecords} records`);
      console.log('💡 Run "npm run db:clean" to clean the database');
    }
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    throw error;
  }
}

if (require.main === module) {
  verifyCleanDatabase()
    .then(() => {
      console.log('\n🎯 Verification completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCleanDatabase };
