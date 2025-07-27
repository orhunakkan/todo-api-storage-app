import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  User,
  Tag,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Check
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import TodoModal from '../components/TodoModal';
import ConfirmDialog from '../components/ConfirmDialog';

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    completed: '',
    priority: '',
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    has_more: false
  });

  useEffect(() => {
    fetchTodos();
    fetchCategories();
  }, [filters, pagination.offset]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await axios.get(`/api/todos?${params}`);
      setTodos(response.data.todos);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        has_more: response.data.pagination.has_more
      }));
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleToggleComplete = async (todoId, completed) => {
    try {
      const endpoint = completed ? 'incomplete' : 'complete';
      await axios.patch(`/api/todos/${todoId}/${endpoint}`);
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setShowModal(true);
  };

  const handleDelete = (todo) => {
    setTodoToDelete(todo);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/todos/${todoToDelete.id}`);
      fetchTodos();
      setShowDeleteDialog(false);
      setTodoToDelete(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTodo(null);
    fetchTodos();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  if (loading && todos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading todos..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Todos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your tasks and stay organized.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Todo
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search todos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.completed}
              onChange={(e) => handleFilterChange('completed', e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="false">Pending</option>
              <option value="true">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Todos List */}
      {error ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Todos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button onClick={fetchTodos} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No todos found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {Object.values(filters).some(value => value !== '') 
              ? 'Try adjusting your filters or create a new todo.'
              : 'Get started by creating your first todo.'
            }
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Todo
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {todos.map((todo) => (
              <div key={todo.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <button
                      onClick={() => handleToggleComplete(todo.id, todo.completed)}
                      className="mt-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {todo.completed ? (
                        <CheckSquare className="h-5 w-5 text-green-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium ${
                        todo.completed 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        
                        {todo.category_name && (
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {todo.category_name}
                          </span>
                        )}
                        
                        {todo.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due {formatDate(todo.due_date)}
                          </span>
                        )}
                        
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {todo.username}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/todos/${todo.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {pagination.has_more && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn btn-outline"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {todos.length} of {pagination.total} todos
          </div>
        </>
      )}

      {/* Todo Modal */}
      {showModal && (
        <TodoModal
          todo={editingTodo}
          categories={categories}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Todo"
          message={`Are you sure you want to delete "${todoToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="btn-danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setTodoToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default Todos;
