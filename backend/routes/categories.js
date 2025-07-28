const express = require('express');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all categories with todo counts
 *     tags: [Categories]
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           todo_count:
 *                             type: integer
 *                             description: Number of todos in this category
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new category
 *     description: Create a new category (requires authentication)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Work"
 *               description:
 *                 type: string
 *                 example: "Work-related tasks"
 *               color:
 *                 type: string
 *                 example: "#007bff"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT c.*, COUNT(t.id) as todo_count
       FROM categories c
       LEFT JOIN todos t ON c.id = t.category_id
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM categories');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      categories: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category with same name already exists
    const existing = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, description, color) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, color || '#007bff']
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get category by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, COUNT(t.id) as todo_count,
              COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
              COUNT(t.id) FILTER (WHERE t.completed = false) as pending_todos
       FROM categories c
       LEFT JOIN todos t ON c.id = t.category_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Check if category exists
    const existing = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name already exists (excluding current category)
    if (name) {
      const nameCheck = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (nameCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE categories 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check how many todos are using this category
    const todoCount = await pool.query(
      'SELECT COUNT(*) FROM todos WHERE category_id = $1',
      [id]
    );

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category deleted successfully',
      deleted_category: result.rows[0],
      affected_todos: parseInt(todoCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get todos for a specific category
router.get('/:id/todos', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      completed, 
      priority, 
      user_id,
      limit = 50, 
      offset = 0 
    } = req.query;

    // Build where clause
    const conditions = ['category_id = $1'];
    const values = [id];
    let paramCount = 2;

    if (completed !== undefined) {
      conditions.push(`completed = $${paramCount++}`);
      values.push(completed === 'true');
    }

    if (priority) {
      conditions.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(user_id);
    }

    const whereClause = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT t.*, u.username, u.first_name, u.last_name
       FROM todos t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM todos WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      todos: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching category todos:', error);
    res.status(500).json({ error: 'Failed to fetch category todos' });
  }
});

module.exports = router;
