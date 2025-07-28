import { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

const TodoModal = ({ todo, categories, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
        category_id: todo.category_id || '',
      });
    }
  }, [todo]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const dataToSend = {
        ...formData,
        due_date: formData.due_date || null,
        category_id: formData.category_id || null,
      };

      if (todo) {
        await axios.put(`/api/todos/${todo.id}`, dataToSend);
        toast.success('Todo updated successfully!');
      } else {
        await axios.post('/api/todos', dataToSend);
        toast.success('Todo created successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving todo:', error);
      const message = error.response?.data?.error || 'Failed to save todo';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto' data-testid="todo-modal">
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75'
          onClick={onClose}
          data-testid="todo-modal-backdrop"
        />

        {/* Modal */}
        <div className='relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-xl' data-testid="todo-modal-content">
          {/* Header */}
          <div className='flex items-center justify-between mb-6' data-testid="todo-modal-header">
            <h3 className='text-lg font-medium text-gray-900 dark:text-white' data-testid="todo-modal-title">
              {todo ? 'Edit Todo' : 'Create New Todo'}
            </h3>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'
              data-testid="todo-modal-close-btn"
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6' data-testid="todo-modal-form">
            {errors.submit && (
              <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50' data-testid="todo-modal-error">
                <div className='flex'>
                  <AlertCircle className='h-5 w-5 text-red-400 mr-2 mt-0.5' />
                  <p className='text-sm text-red-600 dark:text-red-400'>{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div data-testid="todo-modal-title-field">
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid="todo-modal-title-label"
              >
                Title *
              </label>
              <input
                id='title'
                name='title'
                type='text'
                required
                value={formData.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder='Enter todo title'
                data-testid="todo-modal-title-input"
              />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid="todo-modal-title-error">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div data-testid="todo-modal-description-field">
              <label
                htmlFor='description'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid="todo-modal-description-label"
              >
                Description
              </label>
              <textarea
                id='description'
                name='description'
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className='input resize-none'
                placeholder='Enter todo description (optional)'
                data-testid="todo-modal-description-input"
              />
            </div>

            {/* Priority and Category */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4' data-testid="todo-modal-priority-category-fields">
              <div data-testid="todo-modal-priority-field">
                <label
                  htmlFor='priority'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid="todo-modal-priority-label"
                >
                  Priority
                </label>
                <select
                  id='priority'
                  name='priority'
                  value={formData.priority}
                  onChange={handleChange}
                  className='input'
                  data-testid="todo-modal-priority-select"
                >
                  <option value='low'>Low</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>

              <div data-testid="todo-modal-category-field">
                <label
                  htmlFor='category_id'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid="todo-modal-category-label"
                >
                  Category
                </label>
                <select
                  id='category_id'
                  name='category_id'
                  value={formData.category_id}
                  onChange={handleChange}
                  className='input'
                  data-testid="todo-modal-category-select"
                >
                  <option value=''>No Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div data-testid="todo-modal-due-date-field">
              <label
                htmlFor='due_date'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid="todo-modal-due-date-label"
              >
                Due Date
              </label>
              <div className='relative'>
                <input
                  id='due_date'
                  name='due_date'
                  type='date'
                  value={formData.due_date}
                  onChange={handleChange}
                  className='input pr-10'
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="todo-modal-due-date-input"
                />
                <Calendar className='absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none' data-testid="todo-modal-due-date-icon" />
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700' data-testid="todo-modal-actions">
              <button
                type='button'
                onClick={onClose}
                className='btn btn-outline'
                disabled={loading}
                data-testid="todo-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                data-testid="todo-modal-submit-btn"
              >
                {loading ? (
                  <LoadingSpinner size='small' text='' />
                ) : todo ? (
                  'Update Todo'
                ) : (
                  'Create Todo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TodoModal;
