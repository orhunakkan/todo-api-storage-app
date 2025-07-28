const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { swaggerUi, specs } = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const todoRoutes = require('./routes/todos');
const statsRoutes = require('./routes/stats');
const testingRoutes = require('./routes/testing');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/testing', testingRoutes);

// Swagger Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Todo API Documentation',
  })
);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-03T19:48:09.840Z"
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 11.6898956
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information and endpoints
 *     description: Returns information about the API and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "TODO API Storage App"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 */
// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'TODO API Storage App',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        get: 'GET /api/categories/:id',
        update: 'PUT /api/categories/:id',
        delete: 'DELETE /api/categories/:id',
      },
      todos: {
        list: 'GET /api/todos',
        create: 'POST /api/todos',
        get: 'GET /api/todos/:id',
        update: 'PUT /api/todos/:id',
        delete: 'DELETE /api/todos/:id',
        complete: 'PATCH /api/todos/:id/complete',
        incomplete: 'PATCH /api/todos/:id/incomplete',
      },
      stats: {
        overview: 'GET /api/stats/overview',
        todos: 'GET /api/stats/todos',
        users: 'GET /api/stats/users',
      },
      testing: {
        config: 'GET|POST /api/testing/config',
        auth: {
          flakyLogin: 'POST /api/testing/auth/flaky-login',
          shortToken: 'POST /api/testing/auth/short-token',
          protectedResource: 'GET /api/testing/auth/protected-resource',
        },
        validation: {
          userProfile: 'POST /api/testing/validation/user-profile',
          dataTypes: 'POST /api/testing/validation/data-types',
        },
        rateLimit: {
          basic: 'GET /api/testing/rate-limit/basic',
          burst: 'POST /api/testing/rate-limit/burst',
        },
        network: {
          slowResponse: 'GET /api/testing/network/slow-response',
          randomFailure: 'GET /api/testing/network/random-failure',
          timeoutTest: 'GET /api/testing/network/timeout-test',
        },
        pagination: {
          largeDataset: 'GET /api/testing/pagination/large-dataset',
          cursorBased: 'GET /api/testing/pagination/cursor-based',
          inconsistent: 'GET /api/testing/pagination/inconsistent',
        },
      },
    },
  });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // 404 handler for development (API-only responses)
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ===================================');
  console.log('    TODO API SERVER STARTED');
  console.log('=====================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('=====================================\n');

  console.log('🎯 Quick Links (Ctrl+Click to open):');
  console.log(`   • API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`   • Health Check: http://localhost:${PORT}/health`);
  console.log(`   • Server Info: http://localhost:${PORT}/`);
  console.log('');
});

module.exports = app;
