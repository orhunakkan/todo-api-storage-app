import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Search, Calendar, User, Mail, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    has_more: false,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.offset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
      });

      const response = await axios.get(`/api/users?${params}`);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        has_more: response.data.pagination.has_more,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  if (loading && users.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='large' text='Loading users...' />
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' data-testid="users-page">
      {/* Header */}
      <div className='mb-8' data-testid="users-header">
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white' data-testid="users-title">Users</h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400' data-testid="users-subtitle">View and manage user accounts.</p>
      </div>

      {/* Search */}
      <div className='card p-6 mb-8' data-testid="users-search">
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Search users...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='input pl-10'
            data-testid="users-search-input"
          />
        </div>
      </div>

      {/* Error State */}
      {error ? (
        <div className='text-center py-8' data-testid="users-error-state">
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2' data-testid="users-error-title">
            Error Loading Users
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-4' data-testid="users-error-message">{error}</p>
          <button onClick={fetchUsers} className='btn btn-primary' data-testid="users-error-retry-btn">
            Try Again
          </button>
        </div>
      ) : filteredUsers.length === 0 && searchTerm ? (
        <div className='text-center py-12' data-testid="users-no-results">
          <UsersIcon className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2' data-testid="users-no-results-title">
            No users found
          </h2>
          <p className='text-gray-600 dark:text-gray-400' data-testid="users-no-results-message">Try adjusting your search terms.</p>
        </div>
      ) : (
        <>
          {/* Users Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' data-testid="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className='card p-6' data-testid={`user-card-${user.id}`}>
                <div className='flex items-center space-x-4 mb-4' data-testid={`user-header-${user.id}`}>
                  <div className='flex-shrink-0'>
                    <div className='w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center'>
                      <User className='h-6 w-6 text-primary-600 dark:text-primary-400' />
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white truncate' data-testid={`user-name-${user.id}`}>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.username}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 truncate' data-testid={`user-username-${user.id}`}>
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className='space-y-3' data-testid={`user-details-${user.id}`}>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400' data-testid={`user-email-${user.id}`}>
                    <Mail className='h-4 w-4 mr-2 flex-shrink-0' />
                    <span className='truncate'>{user.email}</span>
                  </div>

                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400' data-testid={`user-joined-${user.id}`}>
                    <Calendar className='h-4 w-4 mr-2 flex-shrink-0' />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>

                  {user.todo_stats && (
                    <div className='pt-3 border-t border-gray-200 dark:border-gray-700' data-testid={`user-stats-${user.id}`}>
                      <div className='grid grid-cols-2 gap-4 text-center'>
                        <div data-testid={`user-total-todos-${user.id}`}>
                          <p className='text-sm text-gray-600 dark:text-gray-400'>Total</p>
                          <p className='text-lg font-semibold text-gray-900 dark:text-white'>
                            {user.todo_stats.total_todos}
                          </p>
                        </div>
                        <div data-testid={`user-completed-todos-${user.id}`}>
                          <p className='text-sm text-gray-600 dark:text-gray-400'>Completed</p>
                          <p className='text-lg font-semibold text-green-600 dark:text-green-400'>
                            {user.todo_stats.completed_todos}
                          </p>
                        </div>
                      </div>

                      {user.todo_stats.total_todos > 0 && (
                        <div className='mt-3' data-testid={`user-completion-rate-${user.id}`}>
                          <div className='flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1'>
                            <span>Completion Rate</span>
                            <span>
                              {Math.round(
                                (user.todo_stats.completed_todos / user.todo_stats.total_todos) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                            <div
                              className='bg-green-600 h-2 rounded-full transition-all duration-300'
                              style={{
                                width: `${(user.todo_stats.completed_todos / user.todo_stats.total_todos) * 100}%`,
                              }}
                              data-testid={`user-progress-bar-${user.id}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {pagination.has_more && !searchTerm && (
            <div className='text-center mt-8' data-testid="users-load-more-section">
              <button onClick={loadMore} disabled={loading} className='btn btn-outline' data-testid="users-load-more-btn">
                {loading ? <LoadingSpinner size='small' text='' /> : 'Load More'}
              </button>
            </div>
          )}

          {/* Pagination Info */}
          <div className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400' data-testid="users-pagination-info">
            {searchTerm ? (
              <>
                Showing {filteredUsers.length} of {users.length} users (filtered)
              </>
            ) : (
              <>
                Showing {users.length} of {pagination.total} users
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
