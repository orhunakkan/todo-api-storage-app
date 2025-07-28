import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { CheckSquare, Plus, Clock, Calendar, User, Users, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTodos, setRecentTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch overview stats and recent todos
      const [statsResponse, todosResponse] = await Promise.all([
        axios.get('/api/stats/overview'),
        axios.get('/api/todos?limit=5&sort_by=created_at&sort_order=DESC'),
      ]);

      setStats(statsResponse.data.overview);
      setRecentTodos(todosResponse.data.todos);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='large' text='Loading dashboard...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>Error Loading Dashboard</h2>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
          <button onClick={fetchDashboardData} className='btn btn-primary'>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' data-testid='dashboard-page'>
      {/* Welcome Section */}
      <div className='mb-8' data-testid='dashboard-welcome-section'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white' data-testid='dashboard-welcome-title'>
          Welcome back, {user?.first_name || user?.username}!
        </h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400' data-testid='dashboard-welcome-subtitle'>
          Here&apos;s what&apos;s happening with your todos today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8' data-testid='dashboard-stats-cards'>
        <div className='card p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
              <CheckSquare className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Todos</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats?.total_todos || 0}</p>
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
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats?.completed_todos || 0}</p>
            </div>
          </div>
        </div>

        <div className='card p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg'>
              <Clock className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Pending</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats?.pending_todos || 0}</p>
            </div>
          </div>
        </div>

        <div className='card p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
              <TrendingUp className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Completion Rate</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats?.total_todos > 0 ? Math.round((stats?.completed_todos / stats?.total_todos) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8' data-testid='dashboard-main-grid'>
        {/* Recent Todos */}
        <div className='lg:col-span-2' data-testid='dashboard-recent-todos-section'>
          <div className='card p-6' data-testid='dashboard-recent-todos-card'>
            <div className='flex items-center justify-between mb-6' data-testid='dashboard-recent-todos-header'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white' data-testid='dashboard-recent-todos-title'>
                Recent Todos
              </h2>
              <Link
                to='/todos'
                className='text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium'
                data-testid='dashboard-view-all-todos-link'
              >
                View all
              </Link>
            </div>

            {recentTodos.length === 0 ? (
              <div className='text-center py-8' data-testid='dashboard-no-todos'>
                <CheckSquare className='h-12 w-12 text-gray-400 mx-auto mb-4' data-testid='dashboard-no-todos-icon' />
                <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-2' data-testid='dashboard-no-todos-title'>
                  No todos yet
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-4' data-testid='dashboard-no-todos-description'>
                  Get started by creating your first todo.
                </p>
                <Link to='/todos' className='btn btn-primary' data-testid='dashboard-create-todo-btn'>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Todo
                </Link>
              </div>
            ) : (
              <div className='space-y-4' data-testid='dashboard-recent-todos-list'>
                {recentTodos.map(todo => (
                  <div
                    key={todo.id}
                    className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'
                    data-testid={`dashboard-todo-item-${todo.id}`}
                  >
                    <div className='flex items-center space-x-3' data-testid={`dashboard-todo-content-${todo.id}`}>
                      <div
                        className={`w-3 h-3 rounded-full ${todo.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        data-testid={`dashboard-todo-status-indicator-${todo.id}`}
                      />
                      <div data-testid={`dashboard-todo-details-${todo.id}`}>
                        <h3
                          className={`font-medium ${
                            todo.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                          }`}
                          data-testid={`dashboard-todo-title-${todo.id}`}
                        >
                          {todo.title}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400' data-testid={`dashboard-todo-date-${todo.id}`}>
                          {formatDate(todo.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2' data-testid={`dashboard-todo-metadata-${todo.id}`}>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(todo.priority)}`}
                        data-testid={`dashboard-todo-priority-${todo.id}`}
                      >
                        {todo.priority}
                      </span>
                      {todo.category_name && (
                        <span
                          className='px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full'
                          data-testid={`dashboard-todo-category-${todo.id}`}
                        >
                          {todo.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='space-y-6' data-testid='dashboard-quick-actions-section'>
          <div className='card p-6' data-testid='dashboard-quick-actions-card'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4' data-testid='dashboard-quick-actions-title'>
              Quick Actions
            </h2>
            <div className='space-y-3' data-testid='dashboard-quick-actions-list'>
              <Link
                to='/todos'
                className='w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                data-testid='dashboard-create-todo-action'
              >
                <Plus className='h-5 w-5 text-primary-600 dark:text-primary-400 mr-3' />
                <span className='text-gray-900 dark:text-white'>Create New Todo</span>
              </Link>
              <Link
                to='/stats'
                className='w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                data-testid='dashboard-view-stats-action'
              >
                <BarChart3 className='h-5 w-5 text-primary-600 dark:text-primary-400 mr-3' />
                <span className='text-gray-900 dark:text-white'>View Statistics</span>
              </Link>
              <Link
                to='/users'
                className='w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                data-testid='dashboard-manage-users-action'
              >
                <Users className='h-5 w-5 text-primary-600 dark:text-primary-400 mr-3' />
                <span className='text-gray-900 dark:text-white'>Manage Users</span>
              </Link>
              <Link
                to='/profile'
                className='w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                data-testid='dashboard-edit-profile-action'
              >
                <User className='h-5 w-5 text-primary-600 dark:text-primary-400 mr-3' />
                <span className='text-gray-900 dark:text-white'>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Today's Overview */}
          <div className='card p-6' data-testid='dashboard-todays-overview-card'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4' data-testid='dashboard-todays-overview-title'>
              Today&apos;s Overview
            </h2>
            <div className='space-y-3' data-testid='dashboard-todays-overview-list'>
              <div className='flex items-center justify-between' data-testid='dashboard-categories-count'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>Categories</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>{stats?.total_categories || 0}</span>
              </div>
              <div className='flex items-center justify-between' data-testid='dashboard-users-count'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>Users</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>{stats?.total_users || 0}</span>
              </div>
              <div className='pt-3 border-t border-gray-200 dark:border-gray-700' data-testid='dashboard-date-section'>
                <div className='flex items-center text-sm text-gray-600 dark:text-gray-400' data-testid='dashboard-current-date'>
                  <Calendar className='h-4 w-4 mr-2' />
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
