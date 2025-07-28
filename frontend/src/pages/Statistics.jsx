import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CheckSquare, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [todoStats, setTodoStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewResponse, todosResponse, usersResponse] = await Promise.all([
        axios.get('/api/stats/overview'),
        axios.get('/api/stats/todos'),
        axios.get('/api/stats/users'),
      ]);

      setStats(overviewResponse.data);
      setTodoStats(todosResponse.data);
      setUserStats(usersResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='large' text='Loading statistics...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center' data-testid="statistics-error-state">
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2' data-testid="statistics-error-title">
            Error Loading Statistics
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-4' data-testid="statistics-error-message">{error}</p>
          <button onClick={fetchAllStats} className='btn btn-primary' data-testid="statistics-error-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' data-testid="statistics-page">
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8' data-testid="statistics-header">
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white' data-testid="statistics-title">Statistics</h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400' data-testid="statistics-subtitle">
            Analytics and insights about your todo application.
          </p>
        </div>
        <div className='mt-4 sm:mt-0 flex items-center space-x-4' data-testid="statistics-actions">
          {lastUpdated && (
            <span className='text-sm text-gray-500 dark:text-gray-400' data-testid="statistics-last-updated">
              Last updated: {formatDateTime(lastUpdated)}
            </span>
          )}
          <button onClick={fetchAllStats} className='btn btn-outline' disabled={loading} data-testid="statistics-refresh-btn">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8' data-testid="statistics-overview-cards">
          <div className='card p-6' data-testid="statistics-total-todos-card">
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                <CheckSquare className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Todos</p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white' data-testid="statistics-total-todos-count">
                  {stats.overview.total_todos}
                </p>
              </div>
            </div>
          </div>

          <div className='card p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 dark:bg-green-900/30 rounded-lg'>
                <CheckSquare className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Completed</p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.overview.completed_todos}
                </p>
              </div>
            </div>
          </div>

          <div className='card p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
                <Users className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Users</p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.overview.total_users}
                </p>
              </div>
            </div>
          </div>

          <div className='card p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg'>
                <Tag className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Categories</p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.overview.total_categories}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Todo Statistics */}
        {todoStats && (
          <div className='space-y-6'>
            {/* Priority Distribution */}
            <div className='card p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Todos by Priority
              </h2>
              {todoStats.by_category && todoStats.by_category.length > 0 ? (
                <div className='space-y-3'>
                  {stats.todos_by_priority?.map(priority => (
                    <div key={priority.priority} className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(priority.priority)}`}
                        >
                          {priority.priority.charAt(0).toUpperCase() + priority.priority.slice(1)}
                        </span>
                        <span className='ml-3 text-sm text-gray-600 dark:text-gray-400'>
                          {priority.todo_count} todos
                        </span>
                      </div>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        {priority.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600 dark:text-gray-400'>No priority data available</p>
              )}
            </div>

            {/* Category Statistics */}
            <div className='card p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Top Categories
              </h2>
              {todoStats.by_category && todoStats.by_category.length > 0 ? (
                <div className='space-y-3'>
                  {todoStats.by_category.slice(0, 5).map(category => (
                    <div
                      key={category.category_name || 'uncategorized'}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center'>
                        <div
                          className='w-3 h-3 rounded-full mr-3'
                          style={{ backgroundColor: category.category_color || '#6b7280' }}
                        />
                        <span className='text-sm text-gray-900 dark:text-white'>
                          {category.category_name || 'Uncategorized'}
                        </span>
                      </div>
                      <div className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                        {category.total_todos} todos
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600 dark:text-gray-400'>No category data available</p>
              )}
            </div>
          </div>
        )}

        {/* User Statistics */}
        {userStats && (
          <div className='space-y-6'>
            {/* Recent Activity */}
            <div className='card p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Recent Activity
              </h2>
              {stats.recent_activity && stats.recent_activity.length > 0 ? (
                <div className='space-y-3'>
                  {stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                          {activity.title}
                        </p>
                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                          by {activity.username}
                        </p>
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-500'>
                        {formatDateTime(activity.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600 dark:text-gray-400'>No recent activity</p>
              )}
            </div>

            {/* Top Users */}
            <div className='card p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Most Active Users
              </h2>
              {userStats.most_active_users && userStats.most_active_users.length > 0 ? (
                <div className='space-y-3'>
                  {userStats.most_active_users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3'>
                          <span className='text-sm font-medium text-primary-600 dark:text-primary-400'>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className='text-sm font-medium text-gray-900 dark:text-white'>
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>
                            {user.completed_last_30_days} completed this month
                          </p>
                        </div>
                      </div>
                      <div className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                        {user.todos_last_30_days} todos
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600 dark:text-gray-400'>No user activity data</p>
              )}
            </div>

            {/* User Growth */}
            <div className='card p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                User Growth
              </h2>
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {userStats.summary?.new_users_last_7_days || 0}
                  </p>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>New users (7 days)</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {userStats.summary?.new_users_last_30_days || 0}
                  </p>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>New users (30 days)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      {todoStats?.monthly_trends && todoStats.monthly_trends.length > 0 && (
        <div className='mt-8'>
          <div className='card p-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Monthly Trends
            </h2>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Month
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Created
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Completed
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {todoStats.monthly_trends.map((trend, index) => (
                    <tr key={index}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                        {formatDate(trend.month)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400'>
                        {trend.todos_created}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400'>
                        {trend.todos_completed}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400'>
                        {trend.completion_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
