import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import TodoModal from '../components/TodoModal';
import ConfirmDialog from '../components/ConfirmDialog';

const TodoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTodo();
    fetchCategories();
  }, [id]);

  const fetchTodo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/todos/${id}`);
      setTodo(response.data.todo);
    } catch (error) {
      console.error('Error fetching todo:', error);
      if (error.response?.status === 404) {
        setError('Todo not found');
      } else {
        setError('Failed to load todo');
      }
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

  const handleToggleComplete = async () => {
    try {
      const endpoint = todo.completed ? 'incomplete' : 'complete';
      await axios.patch(`/api/todos/${id}/${endpoint}`);
      fetchTodo();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/todos/${id}`);
      navigate('/todos');
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading todo..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/todos')}
              className="btn btn-outline"
            >
              Back to Todos
            </button>
            <button
              onClick={fetchTodo}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            to="/todos"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Todo Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage todo information
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="btn btn-danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Todo Card */}
      <div className="card p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4 flex-1">
            <button
              onClick={handleToggleComplete}
              className="mt-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {todo.completed ? (
                <CheckSquare className="h-6 w-6 text-green-600" />
              ) : (
                <Square className="h-6 w-6" />
              )}
            </button>
            
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${
                todo.completed 
                  ? 'text-gray-500 dark:text-gray-400 line-through' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {todo.title}
              </h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(todo.priority)}`}>
                  {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                </span>
                
                {todo.completed && (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {todo.description && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {todo.description}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="h-5 w-5 mr-3" />
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-500">Created by</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {todo.first_name && todo.last_name 
                      ? `${todo.first_name} ${todo.last_name}` 
                      : todo.username
                    }
                  </p>
                </div>
              </div>

              {todo.category_name && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Tag className="h-5 w-5 mr-3" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Category</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {todo.category_name}
                    </p>
                  </div>
                </div>
              )}

              {todo.due_date && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Due date</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(todo.due_date)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Timeline
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-5 w-5 mr-3" />
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-500">Created</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(todo.created_at)}
                  </p>
                </div>
              </div>

              {todo.updated_at !== todo.created_at && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="h-5 w-5 mr-3" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Last updated</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(todo.updated_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <button
              onClick={handleToggleComplete}
              className={`btn ${todo.completed ? 'btn-outline' : 'btn-primary'}`}
            >
              {todo.completed ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Mark as Incomplete
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Todo ID: {todo.id}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <TodoModal
          todo={todo}
          categories={categories}
          onClose={() => {
            setShowEditModal(false);
            fetchTodo();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Todo"
          message={`Are you sure you want to delete "${todo.title}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
};

export default TodoDetail;
