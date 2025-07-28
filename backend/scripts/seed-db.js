const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample users
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: 'password123',
        first_name: 'Jane',
        last_name: 'Doe'
      },
      {
        username: 'bobsmith',
        email: 'bob@example.com',
        password: 'password123',
        first_name: 'Bob',
        last_name: 'Smith'
      },
      {
        username: 'alicejohnson',
        email: 'alice@example.com',
        password: 'password123',
        first_name: 'Alice',
        last_name: 'Johnson'
      }
    ];

    // Insert users
    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.username, user.email, hashedPassword, user.first_name, user.last_name]
      );
      userIds.push(result.rows[0].id);
      console.log(`Created user: ${user.username}`);
    }

    // Create sample categories
    const categories = [
      { name: 'Work', description: 'Work-related tasks', color: '#007bff' },
      { name: 'Personal', description: 'Personal tasks and goals', color: '#28a745' },
      { name: 'Shopping', description: 'Shopping lists and errands', color: '#ffc107' },
      { name: 'Health', description: 'Health and fitness goals', color: '#dc3545' },
      { name: 'Learning', description: 'Educational and skill development', color: '#6f42c1' },
      { name: 'Home', description: 'Household tasks and maintenance', color: '#fd7e14' }
    ];

    const categoryIds = [];
    for (const category of categories) {
      const result = await pool.query(
        'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING id',
        [category.name, category.description, category.color]
      );
      categoryIds.push(result.rows[0].id);
      console.log(`Created category: ${category.name}`);
    }

    // Create sample todos
    const todos = [
      // Work todos
      { title: 'Complete project proposal', description: 'Finish the Q1 project proposal for the new client', priority: 'high', user_id: userIds[0], category_id: categoryIds[0], completed: true },
      { title: 'Review code submissions', description: 'Review pull requests from the development team', priority: 'medium', user_id: userIds[0], category_id: categoryIds[0] },
      { title: 'Attend team meeting', description: 'Weekly team standup meeting at 10 AM', priority: 'medium', user_id: userIds[1], category_id: categoryIds[0] },
      { title: 'Update documentation', description: 'Update API documentation with latest changes', priority: 'low', user_id: userIds[2], category_id: categoryIds[0] },
      
      // Personal todos
      { title: 'Call mom', description: 'Weekly check-in call with mom', priority: 'high', user_id: userIds[1], category_id: categoryIds[1] },
      { title: 'Book dentist appointment', description: 'Schedule regular dental cleaning', priority: 'medium', user_id: userIds[1], category_id: categoryIds[1], completed: true },
      { title: 'Plan weekend trip', description: 'Research and plan weekend getaway', priority: 'low', user_id: userIds[3], category_id: categoryIds[1] },
      
      // Shopping todos
      { title: 'Buy groceries', description: 'Weekly grocery shopping - need milk, bread, eggs', priority: 'medium', user_id: userIds[2], category_id: categoryIds[2] },
      { title: 'Get birthday gift', description: 'Buy birthday present for Sarah', priority: 'high', user_id: userIds[3], category_id: categoryIds[2] },
      { title: 'Replace broken phone charger', description: 'Buy new USB-C charger for phone', priority: 'medium', user_id: userIds[0], category_id: categoryIds[2], completed: true },
      
      // Health todos
      { title: 'Morning jog', description: '30-minute jog around the neighborhood', priority: 'medium', user_id: userIds[2], category_id: categoryIds[3], completed: true },
      { title: 'Schedule annual checkup', description: 'Book appointment with primary care doctor', priority: 'high', user_id: userIds[0], category_id: categoryIds[3] },
      { title: 'Try new yoga class', description: 'Attend beginners yoga class at local studio', priority: 'low', user_id: userIds[3], category_id: categoryIds[3] },
      
      // Learning todos
      { title: 'Complete JavaScript course', description: 'Finish remaining 5 modules of the JavaScript course', priority: 'medium', user_id: userIds[1], category_id: categoryIds[4] },
      { title: 'Read programming book', description: 'Read next chapter of "Clean Code"', priority: 'low', user_id: userIds[2], category_id: categoryIds[4] },
      { title: 'Practice guitar', description: 'Practice guitar for 30 minutes', priority: 'low', user_id: userIds[3], category_id: categoryIds[4], completed: true },
      
      // Home todos
      { title: 'Fix leaky faucet', description: 'Repair the dripping kitchen faucet', priority: 'high', user_id: userIds[0], category_id: categoryIds[5] },
      { title: 'Clean garage', description: 'Organize and clean out the garage', priority: 'low', user_id: userIds[1], category_id: categoryIds[5] },
      { title: 'Plant flowers', description: 'Plant spring flowers in the front garden', priority: 'medium', user_id: userIds[2], category_id: categoryIds[5] },
      
      // Some todos without categories
      { title: 'Check email', description: 'Go through and organize email inbox', priority: 'low', user_id: userIds[0], category_id: null, completed: true },
      { title: 'Write journal entry', description: 'Daily reflection and journaling', priority: 'low', user_id: userIds[1], category_id: null },
      { title: 'Backup computer files', description: 'Create backup of important documents and photos', priority: 'medium', user_id: userIds[3], category_id: null }
    ];

    // Insert todos with some variation in dates
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];
      
      // Add some random due dates for variety
      let dueDate = null;
      if (Math.random() > 0.5) {
        const daysFromNow = Math.floor(Math.random() * 30) - 10; // -10 to +20 days from now
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysFromNow);
      }

      // Vary creation times to simulate real usage
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 60)); // Up to 60 days ago

      await pool.query(
        `INSERT INTO todos (title, description, priority, due_date, user_id, category_id, completed, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          todo.title, 
          todo.description, 
          todo.priority, 
          dueDate, 
          todo.user_id, 
          todo.category_id, 
          todo.completed || false,
          createdAt
        ]
      );
      console.log(`Created todo: ${todo.title}`);
    }

    console.log('Database seeding completed successfully!');
    console.log(`Created ${users.length} users, ${categories.length} categories, and ${todos.length} todos`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
