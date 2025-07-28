import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const updateData = { ...formData };
      // Don't send password if it's empty
      if (!updateData.password) {
        delete updateData.password;
      }

      await axios.put(`/api/users/${user.id}`, updateData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.error || 'Failed to update profile';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      password: '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8' data-testid="profile-page">
      {/* Header */}
      <div className='flex items-center justify-between mb-8' data-testid="profile-header">
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white' data-testid="profile-title">Profile</h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400' data-testid="profile-subtitle">
            Manage your account settings and personal information.
          </p>
        </div>

        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className='btn btn-primary' data-testid="profile-edit-btn">
            <Edit className='h-4 w-4 mr-2' />
            Edit Profile
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8' data-testid="profile-content">
        {/* Profile Overview */}
        <div className='lg:col-span-1' data-testid="profile-overview">
          <div className='card p-6'>
            <div className='text-center' data-testid="profile-avatar-section">
              <div className='w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                <User className='h-12 w-12 text-primary-600 dark:text-primary-400' />
              </div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white' data-testid="profile-display-name">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username}
              </h2>
              <p className='text-gray-600 dark:text-gray-400' data-testid="profile-username">@{user?.username}</p>

              <div className='mt-6 space-y-3' data-testid="profile-overview-details">
                <div className='flex items-center justify-center text-sm text-gray-600 dark:text-gray-400' data-testid="profile-email-info">
                  <Mail className='h-4 w-4 mr-2' />
                  {user?.email}
                </div>

                <div className='flex items-center justify-center text-sm text-gray-600 dark:text-gray-400' data-testid="profile-joined-info">
                  <Calendar className='h-4 w-4 mr-2' />
                  Joined {formatDate(user?.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className='lg:col-span-2' data-testid="profile-form-section">
          <div className='card p-6'>
            <form onSubmit={handleSubmit} className='space-y-6' data-testid="profile-form">
              {errors.submit && (
                <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50' data-testid="profile-error-message">
                  <p className='text-sm text-red-600 dark:text-red-400'>{errors.submit}</p>
                </div>
              )}

              {/* Name Fields */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4' data-testid="profile-name-fields">
                <div data-testid="profile-firstname-field">
                  <label
                    htmlFor='first_name'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    data-testid="profile-firstname-label"
                  >
                    First Name
                  </label>
                  <input
                    id='first_name'
                    name='first_name'
                    type='text'
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                    placeholder='First name'
                    data-testid="profile-firstname-input"
                  />
                </div>

                <div data-testid="profile-lastname-field">
                  <label
                    htmlFor='last_name'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    data-testid="profile-lastname-label"
                  >
                    Last Name
                  </label>
                  <input
                    id='last_name'
                    name='last_name'
                    type='text'
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                    placeholder='Last name'
                    data-testid="profile-lastname-input"
                  />
                </div>
              </div>

              {/* Username */}
              <div data-testid="profile-username-field">
                <label
                  htmlFor='username'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid="profile-username-label"
                >
                  Username *
                </label>
                <input
                  id='username'
                  name='username'
                  type='text'
                  required
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`input ${
                    !isEditing
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : errors.username
                        ? 'border-red-500 focus:ring-red-500'
                        : ''
                  }`}
                  placeholder='Username'
                  data-testid="profile-username-input"
                />
                {errors.username && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid="profile-username-error">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div data-testid="profile-email-field">
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid="profile-email-label"
                >
                  Email Address *
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`input ${
                    !isEditing
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : ''
                  }`}
                  placeholder='Email address'
                  data-testid="profile-email-input"
                />
                {errors.email && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid="profile-email-error">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              {isEditing && (
                <div data-testid="profile-password-field">
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    data-testid="profile-password-label"
                  >
                    New Password (leave blank to keep current)
                  </label>
                  <div className='relative'>
                    <input
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder='Enter new password'
                      data-testid="profile-password-input"
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="profile-password-toggle-btn"
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' data-testid="profile-password-hide-icon" />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' data-testid="profile-password-show-icon" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid="profile-password-error">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Account Info (read-only) */}
              <div className='pt-6 border-t border-gray-200 dark:border-gray-700' data-testid="profile-account-info">
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4' data-testid="profile-account-info-title">
                  Account Information
                </h3>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4' data-testid="profile-readonly-fields">
                  <div data-testid="profile-user-id-field">
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' data-testid="profile-user-id-label">
                      User ID
                    </label>
                    <div className='input bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' data-testid="profile-user-id-value">
                      {user?.id}
                    </div>
                  </div>

                  <div data-testid="profile-last-updated-field">
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' data-testid="profile-last-updated-label">
                      Last Updated
                    </label>
                    <div className='input bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' data-testid="profile-last-updated-value">
                      {formatDate(user?.updated_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700' data-testid="profile-form-actions">
                  <button
                    type='button'
                    onClick={handleCancel}
                    className='btn btn-outline'
                    disabled={loading}
                    data-testid="profile-cancel-btn"
                  >
                    <X className='h-4 w-4 mr-2' />
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={loading}
                    className='btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                    data-testid="profile-save-btn"
                  >
                    {loading ? (
                      <LoadingSpinner size='small' text='' />
                    ) : (
                      <>
                        <Save className='h-4 w-4 mr-2' />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
