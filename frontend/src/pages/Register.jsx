import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8' data-testid='register-page'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center' data-testid='register-header'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900 dark:text-white' data-testid='register-title'>
            Create your account
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Or{' '}
            <Link
              to='/login'
              className='font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors'
              data-testid='register-login-link'
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className='card p-8' data-testid='register-form-container'>
          <form className='space-y-6' onSubmit={handleSubmit} data-testid='register-form'>
            {errors.submit && (
              <div
                className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50'
                data-testid='register-error-message'
              >
                <p className='text-sm text-red-600 dark:text-red-400'>{errors.submit}</p>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4' data-testid='register-name-fields'>
              <div data-testid='register-firstname-field'>
                <label
                  htmlFor='first_name'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid='register-firstname-label'
                >
                  First Name
                </label>
                <input
                  id='first_name'
                  name='first_name'
                  type='text'
                  value={formData.first_name}
                  onChange={handleChange}
                  className='input'
                  placeholder='First name'
                  data-testid='register-firstname-input'
                />
              </div>

              <div data-testid='register-lastname-field'>
                <label
                  htmlFor='last_name'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  data-testid='register-lastname-label'
                >
                  Last Name
                </label>
                <input
                  id='last_name'
                  name='last_name'
                  type='text'
                  value={formData.last_name}
                  onChange={handleChange}
                  className='input'
                  placeholder='Last name'
                  data-testid='register-lastname-input'
                />
              </div>
            </div>

            <div data-testid='register-username-field'>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid='register-username-label'
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
                className={`input ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder='Choose a username'
                data-testid='register-username-input'
              />
              {errors.username && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='register-username-error'>
                  {errors.username}
                </p>
              )}
            </div>

            <div data-testid='register-email-field'>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' data-testid='register-email-label'>
                Email Address *
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder='Enter your email'
                data-testid='register-email-input'
              />
              {errors.email && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='register-email-error'>
                  {errors.email}
                </p>
              )}
            </div>

            <div data-testid='register-password-field'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid='register-password-label'
              >
                Password *
              </label>
              <div className='relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder='Create a password'
                  data-testid='register-password-input'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid='register-password-toggle-btn'
                >
                  {showPassword ? (
                    <EyeOff
                      className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      data-testid='register-password-hide-icon'
                    />
                  ) : (
                    <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' data-testid='register-password-show-icon' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='register-password-error'>
                  {errors.password}
                </p>
              )}
            </div>

            <div data-testid='register-confirm-password-field'>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid='register-confirm-password-label'
              >
                Confirm Password *
              </label>
              <div className='relative'>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder='Confirm your password'
                  data-testid='register-confirm-password-input'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid='register-confirm-password-toggle-btn'
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      data-testid='register-confirm-password-hide-icon'
                    />
                  ) : (
                    <Eye
                      className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      data-testid='register-confirm-password-show-icon'
                    />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='register-confirm-password-error'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={loading}
                className='w-full flex justify-center items-center btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                data-testid='register-submit-btn'
              >
                {loading ? (
                  <LoadingSpinner size='small' text='' />
                ) : (
                  <>
                    <UserPlus className='h-4 w-4 mr-2' />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
