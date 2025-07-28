import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className='flex flex-col items-center justify-center p-8' data-testid="loading-spinner">
      <Loader2
        className={`${sizeClasses[size]} text-primary-600 dark:text-primary-400 animate-spin`}
        data-testid="loading-spinner-icon"
      />
      {text && <p className='mt-2 text-sm text-gray-600 dark:text-gray-400' data-testid="loading-spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
