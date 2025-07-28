import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8' data-testid='not-found-page'>
      <div className='max-w-md w-full text-center'>
        {/* 404 Graphic */}
        <div className='mb-8' data-testid='not-found-graphic'>
          <div className='text-9xl font-bold text-gray-200 dark:text-gray-800 select-none' data-testid='not-found-404-text'>
            404
          </div>
          <div className='relative -mt-8'>
            <Search className='h-16 w-16 text-gray-400 mx-auto' data-testid='not-found-search-icon' />
          </div>
        </div>

        {/* Content */}
        <div className='mb-8' data-testid='not-found-content'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4' data-testid='not-found-title'>
            Page Not Found
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-6' data-testid='not-found-description'>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Actions */}
        <div className='space-y-4' data-testid='not-found-actions'>
          <Link to='/dashboard' className='w-full btn btn-primary flex items-center justify-center' data-testid='not-found-dashboard-btn'>
            <Home className='h-4 w-4 mr-2' />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className='w-full btn btn-outline flex items-center justify-center'
            data-testid='not-found-back-btn'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700' data-testid='not-found-help'>
          <p className='text-sm text-gray-500 dark:text-gray-400' data-testid='not-found-help-title'>
            Need help? Try these popular pages:
          </p>
          <div className='mt-3 flex flex-wrap justify-center gap-4 text-sm' data-testid='not-found-help-links'>
            <Link
              to='/todos'
              className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              data-testid='not-found-todos-link'
            >
              Todos
            </Link>
            <Link
              to='/users'
              className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              data-testid='not-found-users-link'
            >
              Users
            </Link>
            <Link
              to='/stats'
              className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              data-testid='not-found-stats-link'
            >
              Statistics
            </Link>
            <Link
              to='/profile'
              className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              data-testid='not-found-profile-link'
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
