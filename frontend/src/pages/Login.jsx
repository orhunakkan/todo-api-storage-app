import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
      newErrors.username = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const result = await login(formData);
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
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8' data-testid='login-page'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center' data-testid='login-header'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900 dark:text-white' data-testid='login-title'>
            Sign in to your account
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Or{' '}
            <Link
              to='/register'
              className='font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors'
              data-testid='login-register-link'
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className='card p-8' data-testid='login-form-container'>
          <form className='space-y-6' onSubmit={handleSubmit} data-testid='login-form'>
            {errors.submit && (
              <div
                className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50'
                data-testid='login-error-message'
              >
                <p className='text-sm text-red-600 dark:text-red-400'>{errors.submit}</p>
              </div>
            )}

            <div data-testid='login-username-field'>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid='login-username-label'
              >
                Username or Email
              </label>
              <input
                id='username'
                name='username'
                type='text'
                autoComplete='username'
                required
                value={formData.username}
                onChange={handleChange}
                className={`input ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder='Enter your username or email'
                data-testid='login-username-input'
              />
              {errors.username && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='login-username-error'>
                  {errors.username}
                </p>
              )}
            </div>

            <div data-testid='login-password-field'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                data-testid='login-password-label'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder='Enter your password'
                  data-testid='login-password-input'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid='login-password-toggle-btn'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' data-testid='login-password-hide-icon' />
                  ) : (
                    <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' data-testid='login-password-show-icon' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400' data-testid='login-password-error'>
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={loading}
                className='w-full flex justify-center items-center btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                data-testid='login-submit-btn'
              >
                {loading ? (
                  <LoadingSpinner size='small' text='' />
                ) : (
                  <>
                    <LogIn className='h-4 w-4 mr-2' />
                    Sign in
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

export default Login;
