const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Global test configuration state
let testConfig = {
  authFailureRate: 0, // 0-1 (0% to 100%)
  networkDelayMs: 0, // artificial delay in ms
  networkFailureRate: 0, // 0-1 (0% to 100%)
  validationStrictness: 'normal', // 'normal', 'strict', 'loose'
};

/**
 * @swagger
 * /api/testing/config:
 *   get:
 *     summary: Get current test configuration
 *     description: Retrieve current testing simulation parameters
 *     tags: [Testing Challenges]
 *     responses:
 *       200:
 *         description: Current test configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 config:
 *                   type: object
 */
// Get current test configuration
router.get('/config', (req, res) => {
  res.json({
    config: testConfig,
    description: {
      authFailureRate: 'Percentage of auth requests that will fail (0-1)',
      networkDelayMs: 'Artificial delay added to responses (milliseconds)',
      networkFailureRate: 'Percentage of requests that will randomly fail (0-1)',
      validationStrictness: "Validation level: 'normal', 'strict', 'loose'",
    },
    note: 'Rate limiting has been disabled for this API',
  });
});

/**
 * @swagger
 * /api/testing/config:
 *   post:
 *     summary: Update test configuration
 *     description: Configure testing simulation parameters
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authFailureRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               networkDelayMs:
 *                 type: integer
 *                 minimum: 0
 *               networkFailureRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               validationStrictness:
 *                 type: string
 *                 enum: [normal, strict, loose]
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
// Update test configuration
router.post('/config', (req, res) => {
  const updates = req.body;

  // Validate and update configuration
  if (updates.authFailureRate !== undefined) {
    testConfig.authFailureRate = Math.max(0, Math.min(1, updates.authFailureRate));
  }
  if (updates.networkDelayMs !== undefined) {
    testConfig.networkDelayMs = Math.max(0, updates.networkDelayMs);
  }
  if (updates.networkFailureRate !== undefined) {
    testConfig.networkFailureRate = Math.max(0, Math.min(1, updates.networkFailureRate));
  }
  if (updates.validationStrictness !== undefined) {
    if (['normal', 'strict', 'loose'].includes(updates.validationStrictness)) {
      testConfig.validationStrictness = updates.validationStrictness;
    }
  }

  // Ignore rate limit parameters since rate limiting is disabled
  if (updates.rateLimitWindow !== undefined || updates.rateLimitMax !== undefined) {
    console.log('Rate limiting parameters ignored - rate limiting is disabled');
  }

  res.json({
    message: 'Test configuration updated successfully',
    config: testConfig,
    note: 'Rate limiting has been disabled for this API',
  });
});

// Middleware to simulate network issues
const simulateNetworkIssues = async (req, res, next) => {
  // Simulate network delay
  if (testConfig.networkDelayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, testConfig.networkDelayMs));
  }

  // Simulate random network failures
  if (Math.random() < testConfig.networkFailureRate) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      type: 'network_simulation',
      retry_after: Math.floor(Math.random() * 5) + 1,
    });
  }

  next();
};

// =============================================================================
// 1. AUTHENTICATION & AUTHORIZATION TESTING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/testing/auth/flaky-login:
 *   post:
 *     summary: Flaky authentication endpoint
 *     description: Login endpoint that randomly fails based on configured failure rate
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required: [username, password]
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Authentication failed (randomly simulated)
 *       500:
 *         description: Internal server error
 */
// Flaky authentication endpoint
router.post('/auth/flaky-login', simulateNetworkIssues, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Simulate random auth failures
  if (Math.random() < testConfig.authFailureRate) {
    return res.status(401).json({
      error: 'Authentication failed',
      type: 'auth_simulation',
      reason: 'Simulated authentication failure',
    });
  }

  // Simple mock authentication
  if (username === 'testuser' && password === 'testpass') {
    const token = jwt.sign(
      { userId: 999, username: 'testuser', type: 'test' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // Short expiry for testing
    );

    res.json({
      message: 'Login successful',
      token,
      expiresIn: '5 minutes',
      type: 'test_token',
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * @swagger
 * /api/testing/auth/short-token:
 *   post:
 *     summary: Generate short-lived token
 *     description: Creates tokens with very short expiration for testing token refresh scenarios
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresInSeconds:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 300
 *                 default: 30
 *     responses:
 *       200:
 *         description: Short-lived token created
 */
// Generate short-lived tokens for testing
router.post('/auth/short-token', (req, res) => {
  const { expiresInSeconds = 30 } = req.body;
  const expiry = Math.max(1, Math.min(300, expiresInSeconds)); // 1-300 seconds

  const token = jwt.sign(
    { userId: 999, username: 'testuser', type: 'short_lived' },
    process.env.JWT_SECRET,
    { expiresIn: `${expiry}s` }
  );

  res.json({
    message: 'Short-lived token created',
    token,
    expiresInSeconds: expiry,
    expiresAt: new Date(Date.now() + expiry * 1000).toISOString(),
  });
});

/**
 * @swagger
 * /api/testing/auth/protected-resource:
 *   get:
 *     summary: Protected resource for testing auth
 *     description: Endpoint that requires authentication and may randomly reject valid tokens
 *     tags: [Testing Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Token rejected (simulation)
 */
// Protected resource with flaky auth
router.get('/auth/protected-resource', simulateNetworkIssues, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Simulate random token rejection even for valid tokens
    if (Math.random() < testConfig.authFailureRate) {
      return res.status(403).json({
        error: 'Token randomly rejected',
        type: 'auth_simulation',
        reason: 'Simulated token rejection',
      });
    }

    res.json({
      message: 'Access granted to protected resource',
      user: decoded,
      timestamp: new Date().toISOString(),
      resource: 'sensitive_data_here',
    });
  });
});

// =============================================================================
// 2. DATA VALIDATION & ERROR HANDLING TESTING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/testing/validation/user-profile:
 *   post:
 *     summary: User profile validation testing
 *     description: Endpoint with configurable validation strictness levels
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation passed
 *       400:
 *         description: Validation failed
 */
// Validation testing endpoint
router.post('/validation/user-profile', simulateNetworkIssues, (req, res) => {
  const { name, email, age, phone, bio } = req.body;
  const errors = [];

  // Different validation based on strictness level
  switch (testConfig.validationStrictness) {
    case 'strict':
      // Strict validation
      if (!name || name.length < 2 || name.length > 50) {
        errors.push('Name must be between 2-50 characters');
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email address is required');
      }
      if (!age || age < 13 || age > 120) {
        errors.push('Age must be between 13-120');
      }
      if (phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(phone)) {
        errors.push('Phone number format is invalid');
      }
      if (bio && bio.length > 500) {
        errors.push('Bio cannot exceed 500 characters');
      }
      if (name && /[^a-zA-Z\s\-']/.test(name)) {
        errors.push('Name contains invalid characters');
      }
      break;

    case 'loose':
      // Loose validation
      if (!name) {
        errors.push('Name is required');
      }
      if (!email) {
        errors.push('Email is required');
      }
      break;

    default: // normal
      // Normal validation
      if (!name || name.length < 1 || name.length > 100) {
        errors.push('Name is required and must be under 100 characters');
      }
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.push('Valid email is required');
      }
      if (age !== undefined && (age < 0 || age > 150)) {
        errors.push('Age must be between 0-150');
      }
      break;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors,
      strictness: testConfig.validationStrictness,
      receivedData: { name, email, age, phone, bio },
    });
  }

  res.json({
    message: 'Profile validation passed',
    profile: { name, email, age, phone, bio },
    strictness: testConfig.validationStrictness,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/testing/validation/data-types:
 *   post:
 *     summary: Data type validation testing
 *     description: Tests various data type validation scenarios
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stringField:
 *                 type: string
 *               numberField:
 *                 type: number
 *               booleanField:
 *                 type: boolean
 *               dateField:
 *                 type: string
 *                 format: date
 *               arrayField:
 *                 type: array
 *               objectField:
 *                 type: object
 *     responses:
 *       200:
 *         description: Data types valid
 *       400:
 *         description: Data type validation failed
 */
// Data type validation testing
router.post('/validation/data-types', simulateNetworkIssues, (req, res) => {
  const { stringField, numberField, booleanField, dateField, arrayField, objectField } = req.body;
  const errors = [];

  // Type validation
  if (stringField !== undefined && typeof stringField !== 'string') {
    errors.push('stringField must be a string');
  }
  if (numberField !== undefined && (typeof numberField !== 'number' || isNaN(numberField))) {
    errors.push('numberField must be a valid number');
  }
  if (booleanField !== undefined && typeof booleanField !== 'boolean') {
    errors.push('booleanField must be a boolean');
  }
  if (dateField !== undefined && isNaN(Date.parse(dateField))) {
    errors.push('dateField must be a valid date string');
  }
  if (arrayField !== undefined && !Array.isArray(arrayField)) {
    errors.push('arrayField must be an array');
  }
  if (
    objectField !== undefined &&
    (typeof objectField !== 'object' || Array.isArray(objectField) || objectField === null)
  ) {
    errors.push('objectField must be an object');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Data type validation failed',
      errors,
      receivedTypes: {
        stringField: typeof stringField,
        numberField: typeof numberField,
        booleanField: typeof booleanField,
        dateField: typeof dateField,
        arrayField: Array.isArray(arrayField) ? 'array' : typeof arrayField,
        objectField: typeof objectField,
      },
    });
  }

  res.json({
    message: 'All data types are valid',
    processedData: { stringField, numberField, booleanField, dateField, arrayField, objectField },
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// 3. RATE LIMITING TESTING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/testing/rate-limit/basic:
 *   get:
 *     summary: Basic rate limiting test
 *     description: Endpoint with configurable rate limiting for testing
 *     tags: [Testing Challenges]
 *     responses:
 *       200:
 *         description: Request successful
 *       429:
 *         description: Rate limit exceeded
 */
// Basic rate limiting test (rate limiting removed)
router.get('/rate-limit/basic', simulateNetworkIssues, (req, res) => {
  res.json({
    message: 'Request successful (rate limiting disabled)',
    timestamp: new Date().toISOString(),
    note: 'Rate limiting has been disabled for this API',
    clientId: req.ip,
  });
});

/**
 * @swagger
 * /api/testing/rate-limit/burst:
 *   post:
 *     summary: Burst rate limiting test
 *     description: Endpoint to test burst requests and rate limiting behavior
 *     tags: [Testing Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 5
 *     responses:
 *       200:
 *         description: Burst test results
 */
// Burst rate limiting test (rate limiting removed)
router.post('/rate-limit/burst', async (req, res) => {
  const { requestCount = 5 } = req.body;
  const maxRequests = Math.min(20, Math.max(1, requestCount));
  const results = [];

  for (let i = 0; i < maxRequests; i++) {
    // All requests succeed since rate limiting is disabled
    results.push({
      requestNumber: i + 1,
      status: 200,
      timestamp: new Date().toISOString(),
      note: 'Rate limiting disabled - all requests succeed',
    });

    // Small delay to simulate real requests
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  res.json({
    message: 'Burst test completed (rate limiting disabled)',
    totalRequests: maxRequests,
    results,
    note: 'Rate limiting has been disabled for this API - all requests will succeed',
  });
});

// =============================================================================
// 4. NETWORK & CONNECTIVITY TESTING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/testing/network/slow-response:
 *   get:
 *     summary: Slow response simulation
 *     description: Endpoint that simulates slow network responses
 *     tags: [Testing Challenges]
 *     parameters:
 *       - in: query
 *         name: delay
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 30000
 *         description: Additional delay in milliseconds (0-30000)
 *     responses:
 *       200:
 *         description: Slow response completed
 */
// Slow response simulation
router.get('/network/slow-response', async (req, res) => {
  const additionalDelay = Math.min(30000, Math.max(0, parseInt(req.query.delay) || 0));
  const totalDelay = testConfig.networkDelayMs + additionalDelay;

  const startTime = Date.now();

  if (totalDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  res.json({
    message: 'Slow response completed',
    configuredDelay: testConfig.networkDelayMs,
    additionalDelay,
    totalDelay,
    actualResponseTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/testing/network/random-failure:
 *   get:
 *     summary: Random network failure simulation
 *     description: Endpoint that randomly fails based on configured failure rate
 *     tags: [Testing Challenges]
 *     responses:
 *       200:
 *         description: Request successful
 *       503:
 *         description: Service unavailable (simulated failure)
 */
// Random failure simulation
router.get('/network/random-failure', simulateNetworkIssues, (req, res) => {
  res.json({
    message: 'Network request successful',
    failureRate: testConfig.networkFailureRate,
    timestamp: new Date().toISOString(),
    lucky: 'You made it through!',
  });
});

/**
 * @swagger
 * /api/testing/network/timeout-test:
 *   get:
 *     summary: Timeout simulation
 *     description: Endpoint that can simulate various timeout scenarios
 *     tags: [Testing Challenges]
 *     parameters:
 *       - in: query
 *         name: behavior
 *         schema:
 *           type: string
 *           enum: [normal, slow, timeout, hang]
 *           default: normal
 *     responses:
 *       200:
 *         description: Normal response
 *       408:
 *         description: Request timeout
 */
// Timeout simulation
router.get('/network/timeout-test', async (req, res) => {
  const behavior = req.query.behavior || 'normal';

  switch (behavior) {
    case 'slow':
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      res.json({ message: 'Slow response completed', behavior });
      break;

    case 'timeout':
      res.status(408).json({ error: 'Request timeout', behavior });
      break;

    case 'hang':
      // Don't respond at all - will cause client timeout
      return;

    default: // normal
      res.json({ message: 'Normal response', behavior, timestamp: new Date().toISOString() });
  }
});

// =============================================================================
// 5. PAGINATION TESTING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/testing/pagination/large-dataset:
 *   get:
 *     summary: Large dataset pagination testing
 *     description: Endpoint that simulates pagination with a large dataset
 *     tags: [Testing Challenges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: total_records
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100000
 *           default: 10000
 *     responses:
 *       200:
 *         description: Paginated data
 *       400:
 *         description: Invalid pagination parameters
 */
// Large dataset pagination
router.get('/pagination/large-dataset', simulateNetworkIssues, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const totalRecords = Math.max(0, Math.min(100000, parseInt(req.query.total_records) || 10000));

  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(totalRecords / limit);

  // Validate pagination
  if (page > totalPages && totalRecords > 0) {
    return res.status(400).json({
      error: 'Page number exceeds total pages',
      page,
      totalPages,
      totalRecords,
    });
  }

  // Simulate slow response for large offsets (common real-world issue)
  const delayMs = Math.min(2000, Math.floor(offset / 1000) * 100);
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Generate mock data
  const data = [];
  for (let i = 0; i < Math.min(limit, totalRecords - offset); i++) {
    const recordId = offset + i + 1;
    data.push({
      id: recordId,
      title: `Test Record ${recordId}`,
      description: `This is test record number ${recordId} of ${totalRecords}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      category: ['Work', 'Personal', 'Shopping', 'Health'][recordId % 4],
    });
  }

  res.json({
    data,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    },
    performance: {
      offset,
      queryDelayMs: delayMs,
      recordsInPage: data.length,
    },
    links: {
      self: `/api/testing/pagination/large-dataset?page=${page}&limit=${limit}&total_records=${totalRecords}`,
      next:
        page < totalPages
          ? `/api/testing/pagination/large-dataset?page=${page + 1}&limit=${limit}&total_records=${totalRecords}`
          : null,
      prev:
        page > 1
          ? `/api/testing/pagination/large-dataset?page=${page - 1}&limit=${limit}&total_records=${totalRecords}`
          : null,
    },
  });
});

/**
 * @swagger
 * /api/testing/pagination/cursor-based:
 *   get:
 *     summary: Cursor-based pagination testing
 *     description: Endpoint demonstrating cursor-based pagination vs offset-based
 *     tags: [Testing Challenges]
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (base64 encoded timestamp)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *     responses:
 *       200:
 *         description: Cursor-based paginated data
 */
// Cursor-based pagination
router.get('/pagination/cursor-based', simulateNetworkIssues, (req, res) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
  const direction = req.query.direction || 'next';
  let cursorTimestamp = Date.now();

  // Decode cursor if provided
  if (req.query.cursor) {
    try {
      cursorTimestamp = parseInt(Buffer.from(req.query.cursor, 'base64').toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid cursor format' });
    }
  }

  // Generate mock data based on cursor
  const data = [];
  const timeIncrement = direction === 'next' ? -60000 : 60000; // 1 minute intervals

  for (let i = 0; i < limit; i++) {
    const recordTimestamp = cursorTimestamp + timeIncrement * (i + 1);
    const recordId = Math.abs(Math.floor(recordTimestamp / 1000));

    data.push({
      id: recordId,
      title: `Cursor Record ${recordId}`,
      timestamp: recordTimestamp,
      created_at: new Date(recordTimestamp).toISOString(),
      data: `Record created at ${new Date(recordTimestamp).toISOString()}`,
    });
  }

  // Create next/prev cursors
  const nextCursor =
    data.length > 0
      ? Buffer.from(data[data.length - 1].timestamp.toString()).toString('base64')
      : null;
  const prevCursor =
    data.length > 0 ? Buffer.from(data[0].timestamp.toString()).toString('base64') : null;

  res.json({
    data,
    pagination: {
      limit,
      direction,
      hasMore: true, // Simplified - assume there's always more data
      nextCursor: direction === 'next' ? nextCursor : null,
      prevCursor: direction === 'prev' ? prevCursor : null,
    },
    cursors: {
      current: req.query.cursor || null,
      next: nextCursor,
      prev: prevCursor,
    },
    links: {
      next: nextCursor
        ? `/api/testing/pagination/cursor-based?cursor=${nextCursor}&limit=${limit}&direction=next`
        : null,
      prev: prevCursor
        ? `/api/testing/pagination/cursor-based?cursor=${prevCursor}&limit=${limit}&direction=prev`
        : null,
    },
  });
});

/**
 * @swagger
 * /api/testing/pagination/inconsistent:
 *   get:
 *     summary: Inconsistent pagination simulation
 *     description: Simulates pagination issues like duplicate records and missing records
 *     tags: [Testing Challenges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *       - in: query
 *         name: issue_type
 *         schema:
 *           type: string
 *           enum: [none, duplicates, missing_records, changing_order]
 *           default: none
 *     responses:
 *       200:
 *         description: Potentially inconsistent paginated data
 */
// Inconsistent pagination simulation
router.get('/pagination/inconsistent', simulateNetworkIssues, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(20, parseInt(req.query.limit) || 5));
  const issueType = req.query.issue_type || 'none';

  const baseData = [];
  const totalRecords = 50;

  // Generate base dataset
  for (let i = 1; i <= totalRecords; i++) {
    baseData.push({
      id: i,
      title: `Record ${i}`,
      order: i,
      created_at: new Date(Date.now() - (totalRecords - i) * 60000).toISOString(),
    });
  }

  let data;
  const offset = (page - 1) * limit;

  switch (issueType) {
    case 'duplicates':
      // Introduce duplicate records
      data = baseData.slice(offset, offset + limit);
      if (page > 1 && data.length > 0) {
        data.unshift(baseData[offset - 1]); // Duplicate last record from previous page
      }
      break;

    case 'missing_records':
      // Simulate missing records
      const adjustedOffset = offset + Math.floor(page / 2); // Skip some records
      data = baseData.slice(adjustedOffset, adjustedOffset + limit);
      break;

    case 'changing_order':
      // Simulate changing sort order between requests
      const shuffled = [...baseData];
      if (page % 2 === 0) {
        // Reverse order on even pages
        shuffled.reverse();
      }
      data = shuffled.slice(offset, offset + limit);
      break;

    default: // none
      data = baseData.slice(offset, offset + limit);
  }

  const totalPages = Math.ceil(totalRecords / limit);

  res.json({
    data,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    simulation: {
      issueType,
      description: {
        none: 'Normal pagination behavior',
        duplicates: 'Some records may appear on multiple pages',
        missing_records: 'Some records may be skipped between pages',
        changing_order: 'Sort order changes between requests',
      }[issueType],
    },
    warning:
      issueType !== 'none'
        ? 'This endpoint simulates pagination issues for testing purposes'
        : null,
  });
});

module.exports = router;
