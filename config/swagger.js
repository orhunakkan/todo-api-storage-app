const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo API Storage App',
      version: '1.0.0',
      description: 'A comprehensive Todo API with user management, categories, and statistics. Perfect for testing e2e frameworks.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1
            },
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            first_name: {
              type: 'string',
              description: 'First name',
              example: 'John'
            },
            last_name: {
              type: 'string',
              description: 'Last name',
              example: 'Doe'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        UserRegistration: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123'
            },
            first_name: {
              type: 'string',
              description: 'First name',
              example: 'John'
            },
            last_name: {
              type: 'string',
              description: 'Last name',
              example: 'Doe'
            }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username or email',
              example: 'johndoe'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'password123'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Work'
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Work-related tasks'
            },
            color: {
              type: 'string',
              description: 'Hex color code',
              example: '#007bff'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Todo: {
          type: 'object',
          required: ['title'],
          properties: {
            id: {
              type: 'integer',
              description: 'Todo ID',
              example: 1
            },
            title: {
              type: 'string',
              description: 'Todo title',
              example: 'Complete project proposal'
            },
            description: {
              type: 'string',
              description: 'Todo description',
              example: 'Finish the Q1 project proposal for the new client'
            },
            completed: {
              type: 'boolean',
              description: 'Completion status',
              example: false
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Todo priority',
              example: 'high'
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Due date',
              nullable: true
            },
            user_id: {
              type: 'integer',
              description: 'Owner user ID',
              example: 1
            },
            category_id: {
              type: 'integer',
              description: 'Category ID',
              nullable: true,
              example: 1
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            username: {
              type: 'string',
              description: 'Owner username',
              example: 'johndoe'
            },
            first_name: {
              type: 'string',
              description: 'Owner first name',
              example: 'John'
            },
            last_name: {
              type: 'string',
              description: 'Owner last name',
              example: 'Doe'
            },
            category_name: {
              type: 'string',
              description: 'Category name',
              nullable: true,
              example: 'Work'
            },
            category_color: {
              type: 'string',
              description: 'Category color',
              nullable: true,
              example: '#007bff'
            }
          }
        },
        TodoCreate: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              description: 'Todo title',
              example: 'Complete project proposal'
            },
            description: {
              type: 'string',
              description: 'Todo description',
              example: 'Finish the Q1 project proposal for the new client'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Todo priority',
              example: 'high'
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Due date',
              nullable: true
            },
            category_id: {
              type: 'integer',
              description: 'Category ID',
              nullable: true,
              example: 1
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Login successful'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 100
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 50
            },
            offset: {
              type: 'integer',
              description: 'Number of items skipped',
              example: 0
            },
            has_more: {
              type: 'boolean',
              description: 'Whether there are more items',
              example: true
            }
          }
        },
        StatsOverview: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                total_users: {
                  type: 'string',
                  example: '4'
                },
                total_categories: {
                  type: 'string',
                  example: '6'
                },
                total_todos: {
                  type: 'string',
                  example: '22'
                },
                completed_todos: {
                  type: 'string',
                  example: '6'
                },
                pending_todos: {
                  type: 'string',
                  example: '16'
                },
                overdue_todos: {
                  type: 'string',
                  example: '2'
                }
              }
            },
            todos_by_priority: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: {
                    type: 'string',
                    example: 'high'
                  },
                  count: {
                    type: 'string',
                    example: '5'
                  },
                  completed: {
                    type: 'string',
                    example: '1'
                  },
                  pending: {
                    type: 'string',
                    example: '4'
                  }
                }
              }
            },
            generated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Statistics generation timestamp'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Categories',
        description: 'Category management operations'
      },
      {
        name: 'Todos',
        description: 'Todo management operations'
      },
      {
        name: 'Statistics',
        description: 'Analytics and reporting endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
