const express = require('express');
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get general overview statistics
 *     description: Retrieve general statistics about users, todos, categories, and priorities
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatsOverview'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get general overview statistics
router.get('/overview', optionalAuth, async (req, res) => {
  try {
    // Get basic counts
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM todos) as total_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = true) as completed_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = false) as pending_todos,
        (SELECT COUNT(*) FROM todos WHERE due_date < CURRENT_TIMESTAMP AND completed = false) as overdue_todos
    `);

    // Get todos by priority
    const priorityStats = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) FILTER (WHERE completed = false) as pending
      FROM todos 
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END
    `);

    // Get recent activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as todos_created
      FROM todos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get completion rate by day (last 7 days)
    const completionRates = await pool.query(`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as todos_completed
      FROM todos 
      WHERE completed = true 
        AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(updated_at)
      ORDER BY date DESC
    `);

    res.json({
      overview: stats.rows[0],
      todos_by_priority: priorityStats.rows,
      recent_activity: recentActivity.rows,
      completion_rates: completionRates.rows,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Failed to fetch overview statistics' });
  }
});

// Get detailed todo statistics
router.get('/todos', optionalAuth, async (req, res) => {
  try {
    const { user_id, category_id, date_from, date_to } = req.query;

    // Build where clause for filtering
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(user_id);
    }

    if (category_id) {
      conditions.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }

    if (date_from) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(date_from);
    }

    if (date_to) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic todo statistics
    const basicStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) FILTER (WHERE completed = false) as pending,
        COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND completed = false) as overdue,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
        COUNT(*) FILTER (WHERE priority = 'low') as low_priority,
        AVG(CASE WHEN completed = true THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END) as avg_completion_time_hours
      FROM todos ${whereClause}
    `, values);

    // Get todos by category
    const categoryStats = await pool.query(`
      SELECT 
        c.name as category_name,
        c.color as category_color,
        COUNT(t.id) as total_todos,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
        COUNT(t.id) FILTER (WHERE t.completed = false) as pending_todos
      FROM categories c
      LEFT JOIN todos t ON c.id = t.category_id ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      GROUP BY c.id, c.name, c.color
      HAVING COUNT(t.id) > 0
      ORDER BY total_todos DESC
    `, values);

    // Get completion trends (by month for the last 6 months)
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as created,
        COUNT(*) FILTER (WHERE completed = true) as completed
      FROM todos 
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;

    const trends = await pool.query(trendQuery, values);

    // Get top users (if not filtering by specific user)
    let topUsers = [];
    if (!user_id) {
      const userStats = await pool.query(`
        SELECT 
          u.username,
          u.first_name,
          u.last_name,
          COUNT(t.id) as total_todos,
          COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
          ROUND(
            (COUNT(t.id) FILTER (WHERE t.completed = true)::decimal / 
             NULLIF(COUNT(t.id), 0) * 100), 2
          ) as completion_rate
        FROM users u
        LEFT JOIN todos t ON u.id = t.user_id ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
        GROUP BY u.id, u.username, u.first_name, u.last_name
        HAVING COUNT(t.id) > 0
        ORDER BY total_todos DESC
        LIMIT 10
      `, values);
      topUsers = userStats.rows;
    }

    res.json({
      basic_stats: basicStats.rows[0],
      by_category: categoryStats.rows,
      monthly_trends: trends.rows,
      top_users: topUsers,
      filters: {
        user_id,
        category_id,
        date_from,
        date_to
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ error: 'Failed to fetch todo statistics' });
  }
});

// Get user statistics
router.get('/users', optionalAuth, async (req, res) => {
  try {
    // Basic user statistics
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_last_7_days
      FROM users
    `);

    // User activity stats
    const activityStats = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.created_at as joined_date,
        COUNT(t.id) as total_todos,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
        COUNT(t.id) FILTER (WHERE t.completed = false) as pending_todos,
        COUNT(t.id) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '7 days') as todos_last_7_days,
        ROUND(
          (COUNT(t.id) FILTER (WHERE t.completed = true)::decimal / 
           NULLIF(COUNT(t.id), 0) * 100), 2
        ) as completion_rate,
        MAX(t.created_at) as last_todo_created
      FROM users u
      LEFT JOIN todos t ON u.id = t.user_id
      GROUP BY u.id, u.username, u.first_name, u.last_name, u.created_at
      ORDER BY total_todos DESC
    `);

    // User registration trends (last 6 months)
    const registrationTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    // Most active users (by todos created in last 30 days)
    const mostActiveUsers = await pool.query(`
      SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COUNT(t.id) as todos_last_30_days,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_last_30_days
      FROM users u
      INNER JOIN todos t ON u.id = t.user_id
      WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.username, u.first_name, u.last_name
      ORDER BY todos_last_30_days DESC
      LIMIT 10
    `);

    res.json({
      summary: userStats.rows[0],
      user_activity: activityStats.rows,
      registration_trends: registrationTrends.rows,
      most_active_users: mostActiveUsers.rows,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get category statistics
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    // Category usage statistics
    const categoryStats = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.created_at,
        COUNT(t.id) as total_todos,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
        COUNT(t.id) FILTER (WHERE t.completed = false) as pending_todos,
        COUNT(t.id) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days') as todos_last_30_days,
        ROUND(
          (COUNT(t.id) FILTER (WHERE t.completed = true)::decimal / 
           NULLIF(COUNT(t.id), 0) * 100), 2
        ) as completion_rate,
        COUNT(DISTINCT t.user_id) as unique_users
      FROM categories c
      LEFT JOIN todos t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.color, c.created_at
      ORDER BY total_todos DESC
    `);

    // Uncategorized todos
    const uncategorizedCount = await pool.query(`
      SELECT COUNT(*) as uncategorized_todos
      FROM todos 
      WHERE category_id IS NULL
    `);

    // Category usage trends (last 6 months)
    const categoryTrends = await pool.query(`
      SELECT 
        c.name as category_name,
        DATE_TRUNC('month', t.created_at) as month,
        COUNT(t.id) as todos_created
      FROM categories c
      INNER JOIN todos t ON c.id = t.category_id
      WHERE t.created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY c.id, c.name, DATE_TRUNC('month', t.created_at)
      ORDER BY month DESC, todos_created DESC
    `);

    res.json({
      category_stats: categoryStats.rows,
      uncategorized_todos: uncategorizedCount.rows[0].uncategorized_todos,
      category_trends: categoryTrends.rows,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

module.exports = router;
