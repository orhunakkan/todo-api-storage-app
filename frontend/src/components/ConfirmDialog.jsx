import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'btn-danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <div className='fixed inset-0 z-50 overflow-y-auto' data-testid="confirm-dialog">
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75'
          onClick={onCancel}
          data-testid="confirm-dialog-backdrop"
        />

        {/* Modal */}
        <div className='relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-xl' data-testid="confirm-dialog-modal">
          {/* Header */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' data-testid="confirm-dialog-icon" />
              </div>
              <h3 className='ml-3 text-lg font-medium text-gray-900 dark:text-white' data-testid="confirm-dialog-title">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'
              disabled={loading}
              data-testid="confirm-dialog-close-btn"
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <p className='text-sm text-gray-600 dark:text-gray-400' data-testid="confirm-dialog-message">{message}</p>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3' data-testid="confirm-dialog-actions">
            <button type='button' onClick={onCancel} className='btn btn-outline' disabled={loading} data-testid="confirm-dialog-cancel-btn">
              {cancelText}
            </button>
            <button
              type='button'
              onClick={onConfirm}
              className={`btn ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={loading}
              data-testid="confirm-dialog-confirm-btn"
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
