/**
 * Test Fixtures
 * Sample data for testing
 */

module.exports = {
  users: {
    valid: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User'
    },
    
    invalid: {
      missingUsername: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User'
      },
      
      invalidEmail: {
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User'
      },
      
      weakPassword: {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        first_name: 'Test',
        last_name: 'User'
      }
    },
    
    multiple: [
      {
        username: 'user1',
        email: 'user1@example.com',
        password: 'Password123!',
        first_name: 'User',
        last_name: 'One'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        password: 'Password123!',
        first_name: 'User',
        last_name: 'Two'
      }
    ]
  },

  categories: {
    valid: {
      name: 'Work',
      description: 'Work-related tasks',
      color: '#3B82F6'
    },
    
    minimal: {
      name: 'Personal'
    },
    
    invalid: {
      missingName: {
        description: 'Category without name',
        color: '#FF0000'
      }
    },
    
    multiple: [
      {
        name: 'Work',
        description: 'Work-related tasks',
        color: '#3B82F6'
      },
      {
        name: 'Personal',
        description: 'Personal tasks',
        color: '#10B981'
      },
      {
        name: 'Shopping',
        description: 'Shopping list',
        color: '#F59E0B'
      }
    ]
  },

  todos: {
    valid: {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      priority: 'high',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
    },
    
    minimal: {
      title: 'Simple task'
    },
    
    invalid: {
      missingTitle: {
        description: 'Task without title',
        priority: 'medium'
      },
      
      invalidPriority: {
        title: 'Task with invalid priority',
        priority: 'invalid'
      },
      
      pastDueDate: {
        title: 'Task with past due date',
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }
    },
    
    multiple: [
      {
        title: 'Task 1',
        description: 'First task',
        priority: 'high',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Task 2',
        description: 'Second task',
        priority: 'medium',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Task 3',
        description: 'Third task',
        priority: 'low',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },

  auth: {
    validLogin: {
      username: 'testuser',
      password: 'TestPassword123!'
    },
    
    invalidLogin: {
      wrongPassword: {
        username: 'testuser',
        password: 'wrongpassword'
      },
      
      nonexistentUser: {
        username: 'nonexistent',
        password: 'TestPassword123!'
      },
      
      missingCredentials: {
        username: 'testuser'
      }
    }
  }
};
