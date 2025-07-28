const express = require('express');
const pool = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    // Get basic counts
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(DISTINCT t.category_id) FROM todos t WHERE t.user_id = $1 AND t.category_id IS NOT NULL) as total_categories,
        (SELECT COUNT(*) FROM todos WHERE user_id = $1) as total_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = true AND user_id = $1) as completed_todos,
        (SELECT COUNT(*) FROM todos WHERE completed = false AND user_id = $1) as pending_todos,
        (SELECT COUNT(*) FROM todos WHERE due_date < CURRENT_TIMESTAMP AND completed = false AND user_id = $1) as overdue_todos
    `, [req.user.id]);

    // Get todos by priority
    const priorityStats = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) FILTER (WHERE completed = false) as pending
      FROM todos 
      WHERE user_id = $1
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END
    `, [req.user.id]);

    // Get recent activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as todos_created
      FROM todos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND user_id = $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [req.user.id]);

    // Get completion rate by day (last 7 days)
    const completionRates = await pool.query(`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as todos_completed
      FROM todos 
      WHERE completed = true 
        AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
        AND user_id = $1
      GROUP BY DATE(updated_at)
      ORDER BY date DESC
    `, [req.user.id]);

    // Get category breakdown for overview (include all user categories and uncategorized todos)
    const categoryBreakdown = await pool.query(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category_name,
        COUNT(t.id) as total_todos
      FROM (
        SELECT id, name FROM categories WHERE user_id = $1
        UNION ALL
        SELECT NULL as id, 'Uncategorized' as name
      ) c
      LEFT JOIN todos t ON t.category_id = c.id AND t.user_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_todos DESC
    `, [req.user.id]);

    res.json({
      stats: {
        ...stats.rows[0],
        total_users: parseInt(stats.rows[0].total_users),
        total_categories: parseInt(stats.rows[0].total_categories),
        total_todos: parseInt(stats.rows[0].total_todos),
        completed_todos: parseInt(stats.rows[0].completed_todos),
        pending_todos: parseInt(stats.rows[0].pending_todos),
        overdue_todos: parseInt(stats.rows[0].overdue_todos),
        completion_rate: stats.rows[0].total_todos > 0 
          ? parseFloat((stats.rows[0].completed_todos / stats.rows[0].total_todos).toFixed(2))
          : 0,
        todos_by_priority: priorityStats.rows.map(row => ({
          ...row,
          count: parseInt(row.count),
          completed: parseInt(row.completed),
          pending: parseInt(row.pending)
        })),
        priority_breakdown: priorityStats.rows.reduce((acc, row) => {
          acc[row.priority] = parseInt(row.count);
          return acc;
        }, {}),
        category_breakdown: categoryBreakdown.rows.map(row => ({
          category_name: row.category_name,
          total_todos: parseInt(row.total_todos)
        })),
        recent_activity: recentActivity.rows.map(row => ({
          ...row,
          todos_created: parseInt(row.todos_created)
        })),
        completion_rates: completionRates.rows.map(row => ({
          ...row,
          todos_completed: parseInt(row.todos_completed)
        })),
      },
      generated_at: new Date().toISOString(),
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
    const basicStats = await pool.query(
      `
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
    `,
      values
    );

    // Get todos by category
    const categoryStats = await pool.query(
      `
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
    `,
      values
    );

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
      const userStats = await pool.query(
        `
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
      `,
        values
      );
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
        date_to,
      },
      generated_at: new Date().toISOString(),
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
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get category statistics
router.get('/categories', authenticateToken, async (req, res) => {
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
      LEFT JOIN todos t ON c.id = t.category_id AND t.user_id = $1
      GROUP BY c.id, c.name, c.color, c.created_at
      ORDER BY total_todos DESC
    `, [req.user.id]);

    // Uncategorized todos
    const uncategorizedCount = await pool.query(`
      SELECT COUNT(*) as uncategorized_todos
      FROM todos 
      WHERE category_id IS NULL AND user_id = $1
    `, [req.user.id]);

    // Category usage trends (last 6 months)
    const categoryTrends = await pool.query(`
      SELECT 
        c.name as category_name,
        DATE_TRUNC('month', t.created_at) as month,
        COUNT(t.id) as todos_created
      FROM categories c
      INNER JOIN todos t ON c.id = t.category_id
      WHERE t.created_at >= CURRENT_DATE - INTERVAL '6 months'
        AND t.user_id = $1
      GROUP BY c.id, c.name, DATE_TRUNC('month', t.created_at)
      ORDER BY month DESC, todos_created DESC
    `, [req.user.id]);

    // Add uncategorized as a virtual category
    const uncategorizedTodos = parseInt(uncategorizedCount.rows[0].uncategorized_todos);
    const categories = categoryStats.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      total_todos: parseInt(row.total_todos),
      completed_todos: parseInt(row.completed_todos),
      pending_todos: parseInt(row.pending_todos),
      todos_last_30_days: parseInt(row.todos_last_30_days),
      completion_rate: parseFloat(row.completion_rate) ? parseFloat(row.completion_rate) / 100 : 0,
      unique_users: parseInt(row.unique_users)
    }));

    // Add uncategorized virtual category if there are uncategorized todos
    if (uncategorizedTodos > 0) {
      const uncategorizedCompletedCount = await pool.query(`
        SELECT COUNT(*) as completed_count
        FROM todos 
        WHERE category_id IS NULL AND user_id = $1 AND completed = true
      `, [req.user.id]);

      const completedCount = parseInt(uncategorizedCompletedCount.rows[0].completed_count);
      categories.push({
        id: null,
        name: 'Uncategorized',
        color: '#6B7280',
        created_at: null,
        total_todos: uncategorizedTodos,
        completed_todos: completedCount,
        pending_todos: uncategorizedTodos - completedCount,
        todos_last_30_days: uncategorizedTodos, // Simplified for now
        completion_rate: uncategorizedTodos > 0 ? parseFloat(((completedCount / uncategorizedTodos)).toFixed(2)) : 0,
        unique_users: 1
      });
    }

    res.json({
      categories,
      uncategorized_todos: uncategorizedTodos,
      category_trends: categoryTrends.rows.map(row => ({
        ...row,
        todos_created: parseInt(row.todos_created)
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

// Get trends data
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { period = '7d', granularity = 'daily' } = req.query;
    
    // Validate period parameter
    const validPeriods = ['7d', '30d', '90d'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period. Must be one of: 7d, 30d, 90d' 
      });
    }

    // Calculate date range
    const days = parseInt(period.replace('d', ''));
    const dateFormat = granularity === 'weekly' ? 'week' : 'day';
    
    const trends = await pool.query(`
      SELECT 
        DATE_TRUNC('${dateFormat}', created_at) as date,
        COUNT(*) as created_count,
        COUNT(*) FILTER (WHERE completed = true) as completed_count
      FROM todos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND user_id = $1
      GROUP BY DATE_TRUNC('${dateFormat}', created_at)
      ORDER BY date DESC
      LIMIT ${granularity === 'weekly' ? Math.ceil(days / 7) : days}
    `, [req.user.id]);

    res.json({
      trends: trends.rows.map(row => ({
        ...row,
        created_count: parseInt(row.created_count),
        completed_count: parseInt(row.completed_count)
      })),
      period,
      granularity,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

// Get productivity metrics
router.get('/productivity', authenticateToken, async (req, res) => {
  try {
    // Average completion time for completed todos
    const completionTime = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_completion_time_hours
      FROM todos 
      WHERE completed = true AND user_id = $1
    `, [req.user.id]);

    // Daily productivity metrics
    const dailyProductivity = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as todos_created,
        COUNT(*) FILTER (WHERE completed = true) as todos_completed,
        ROUND(
          (COUNT(*) FILTER (WHERE completed = true)::decimal / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as daily_completion_rate
      FROM todos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND user_id = $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [req.user.id]);

    // Calculate productivity score (based on completion rate and consistency)
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_todos,
        COUNT(*) FILTER (WHERE completed = true) as completed_todos,
        COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND completed = false) as overdue_todos
      FROM todos
      WHERE user_id = $1
    `, [req.user.id]);

    // Best performing category
    const bestCategory = await pool.query(`
      SELECT 
        c.name as category_name,
        COUNT(t.id) as total_todos,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos,
        ROUND(
          (COUNT(t.id) FILTER (WHERE t.completed = true)::decimal / 
           NULLIF(COUNT(t.id), 0) * 100), 2
        ) as completion_rate
      FROM categories c
      INNER JOIN todos t ON c.id = t.category_id
      WHERE t.user_id = $1
      GROUP BY c.id, c.name
      HAVING COUNT(t.id) >= 2
      ORDER BY completion_rate DESC, total_todos DESC
      LIMIT 1
    `, [req.user.id]);

    // Current streak (consecutive days with completed todos)
    const streakData = await pool.query(`
      WITH daily_completions AS (
        SELECT DATE(updated_at) as completion_date
        FROM todos 
        WHERE completed = true 
          AND user_id = $1
          AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(updated_at)
        ORDER BY completion_date DESC
      ),
      streak_calc AS (
        SELECT 
          completion_date,
          completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::int * INTERVAL '1 day' as streak_group
        FROM daily_completions
      )
      SELECT COUNT(*) as current_streak_days
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group 
        FROM streak_calc 
        LIMIT 1
      )
    `, [req.user.id]);

    // Longest streak (all time)
    const longestStreakData = await pool.query(`
      WITH daily_completions AS (
        SELECT DATE(updated_at) as completion_date
        FROM todos 
        WHERE completed = true 
          AND user_id = $1
        GROUP BY DATE(updated_at)
        ORDER BY completion_date
      ),
      streak_calc AS (
        SELECT 
          completion_date,
          completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date))::int * INTERVAL '1 day' as streak_group
        FROM daily_completions
      ),
      streak_lengths AS (
        SELECT COUNT(*) as streak_length
        FROM streak_calc
        GROUP BY streak_group
      )
      SELECT COALESCE(MAX(streak_length), 0) as longest_streak_days
      FROM streak_lengths
    `, [req.user.id]);

    const stats = overallStats.rows[0];
    const completionRate = stats.total_todos > 0 ? (parseInt(stats.completed_todos) / parseInt(stats.total_todos)) : 0;
    const overdueRate = stats.total_todos > 0 ? (parseInt(stats.overdue_todos) / parseInt(stats.total_todos)) : 0;
    
    // Productivity score: 70% completion rate + 30% on-time performance
    const productivityScore = Math.round((completionRate * 70) + ((1 - overdueRate) * 30));

    res.json({
      productivity: {
        avg_completion_time_hours: parseFloat(completionTime.rows[0].avg_completion_time_hours) || 0,
        productivity_score: productivityScore,
        completion_rate: Math.round(completionRate * 100),
        overdue_rate: Math.round(overdueRate * 100),
        best_category: bestCategory.rows[0]?.category_name || null,
        current_streak_days: parseInt(streakData.rows[0]?.current_streak_days) || 0,
        longest_streak_days: parseInt(longestStreakData.rows[0]?.longest_streak_days) || 0,
        daily_productivity: dailyProductivity.rows.map(row => ({
          ...row,
          todos_created: parseInt(row.todos_created),
          todos_completed: parseInt(row.todos_completed),
          daily_completion_rate: parseFloat(row.daily_completion_rate)
        })),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching productivity metrics:', error);
    res.status(500).json({ error: 'Failed to fetch productivity metrics' });
  }
});

module.exports = router;
