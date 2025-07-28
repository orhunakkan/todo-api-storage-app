const express = require('express');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Get all todos
 *     description: Retrieve all todos with optional filtering and pagination
 *     tags: [Todos]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority level
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, title, due_date, priority]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Todos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *                 filters:
 *                   type: object
 *                   description: Applied filters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all todos with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      user_id,
      category_id,
      completed,
      priority,
      due_date_from,
      due_date_to,
      search,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Build where clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // If user is authenticated, automatically filter by their user ID
    // unless they explicitly provide a different user_id (for admin features)
    if (req.user && !user_id) {
      conditions.push(`t.user_id = $${paramCount++}`);
      values.push(req.user.id);
    } else if (user_id) {
      conditions.push(`t.user_id = $${paramCount++}`);
      values.push(user_id);
    }

    if (category_id) {
      conditions.push(`t.category_id = $${paramCount++}`);
      values.push(category_id);
    }

    if (completed !== undefined) {
      conditions.push(`t.completed = $${paramCount++}`);
      values.push(completed === 'true');
    }

    if (priority) {
      conditions.push(`t.priority = $${paramCount++}`);
      values.push(priority);
    }

    if (due_date_from) {
      conditions.push(`t.due_date >= $${paramCount++}`);
      values.push(due_date_from);
    }

    if (due_date_to) {
      conditions.push(`t.due_date <= $${paramCount++}`);
      values.push(due_date_to);
    }

    if (search) {
      conditions.push(`(t.title ILIKE $${paramCount++} OR t.description ILIKE $${paramCount++})`);
      values.push(`%${search}%`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'due_date', 'priority'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `SELECT t.*, 
              u.username, u.first_name, u.last_name,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       ${whereClause}
       ORDER BY t.${sortField} ${sortDirection}
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM todos t ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      todos: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total,
      },
      filters: {
        user_id,
        category_id,
        completed,
        priority,
        due_date_from,
        due_date_to,
        search,
      },
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Create a new todo
 *     description: Create a new todo item (requires authentication)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TodoCreate'
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todo created successfully"
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Bad request - missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create a new todo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, due_date, category_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: low, medium, high',
      });
    }

    // Validate category exists if provided
    if (category_id) {
      const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [
        category_id,
      ]);

      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO todos (title, description, priority, due_date, user_id, category_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description, priority || 'medium', due_date, req.user.id, category_id]
    );

    // Get the todo with joined data
    const todoResult = await pool.query(
      `SELECT t.*, 
              u.username, u.first_name, u.last_name,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      message: 'Todo created successfully',
      todo: todoResult.rows[0],
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: Get todo by ID
 *     description: Retrieve a specific todo by its ID
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get todo by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, 
              u.username, u.first_name, u.last_name,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ todo: result.rows[0] });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Update todo
 *     description: Update a todo item (user can only update their own todos)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated todo title"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: "high"
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               completed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todo updated successfully"
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Bad request - invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - can only update own todos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete todo
 *     description: Delete a todo item (user can only delete their own todos)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todo deleted successfully"
 *                 deleted_todo:
 *                   $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Todo not found or no permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update todo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, category_id, completed } = req.body;

    // Check if todo exists and user owns it
    const todoCheck = await pool.query('SELECT user_id FROM todos WHERE id = $1', [id]);

    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (todoCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own todos' });
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Priority must be one of: low, medium, high',
        });
      }
    }

    // Validate category exists if provided
    if (category_id) {
      const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [
        category_id,
      ]);

      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE todos 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Get the updated todo with joined data
    const todoResult = await pool.query(
      `SELECT t.*, 
              u.username, u.first_name, u.last_name,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    res.json({
      message: 'Todo updated successfully',
      todo: todoResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First check if todo exists
    const todoCheck = await pool.query('SELECT user_id FROM todos WHERE id = $1', [id]);

    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Check if user owns the todo
    if (todoCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own todos' });
    }

    // Delete the todo
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      message: 'Todo deleted successfully',
      deleted_todo: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

/**
 * @swagger
 * /api/todos/{id}/complete:
 *   patch:
 *     summary: Mark todo as complete
 *     description: Mark a specific todo as completed
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo marked as complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todo marked as complete"
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Todo not found or no permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Mark todo as complete
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE todos 
       SET completed = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Todo not found or you do not have permission to update it' });
    }

    res.json({
      message: 'Todo marked as complete',
      todo: result.rows[0],
    });
  } catch (error) {
    console.error('Error completing todo:', error);
    res.status(500).json({ error: 'Failed to complete todo' });
  }
});

/**
 * @swagger
 * /api/todos/{id}/incomplete:
 *   patch:
 *     summary: Mark todo as incomplete
 *     description: Mark a specific todo as incomplete/pending
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo marked as incomplete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todo marked as incomplete"
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Todo not found or no permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Mark todo as incomplete
router.patch('/:id/incomplete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE todos 
       SET completed = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Todo not found or you do not have permission to update it' });
    }

    res.json({
      message: 'Todo marked as incomplete',
      todo: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking todo as incomplete:', error);
    res.status(500).json({ error: 'Failed to mark todo as incomplete' });
  }
});

module.exports = router;
