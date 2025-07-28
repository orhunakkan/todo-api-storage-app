const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with pagination
 *     tags: [Users]
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
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all users
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's todo statistics
    const todoStats = await pool.query(
      `SELECT 
         COUNT(*) as total_todos,
         COUNT(*) FILTER (WHERE completed = true) as completed_todos,
         COUNT(*) FILTER (WHERE completed = false) as pending_todos
       FROM todos WHERE user_id = $1`,
      [id]
    );

    const user = result.rows[0];
    user.todo_stats = todoStats.rows[0];

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (requires authentication and user must be updating their own profile)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, first_name, last_name, password } = req.body;

    // Check if user is updating their own profile
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Check if new username/email already exists (excluding current user)
    if (username || email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username || '', email || '', id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Username or email already exists',
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, first_name, last_name, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (requires authentication and user must be deleting their own account)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is deleting their own account
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    // Delete user (CASCADE will delete their todos)
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deleted_user: result.rows[0].username,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user's todos
router.get('/:id/todos', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, priority, category_id, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const conditions = ['user_id = $1'];
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

    if (category_id) {
      conditions.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }

    const whereClause = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM todos WHERE ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      todos: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error('Error fetching user todos:', error);
    res.status(500).json({ error: 'Failed to fetch user todos' });
  }
});

module.exports = router;
