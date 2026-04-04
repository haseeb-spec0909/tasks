import { Fragment } from 'react'
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'

/**
 * ConfirmDialog component for destructive actions
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isDangerous = false,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeButton={!isLoading}
      footer={
        <Fragment>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50',
              isDangerous
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </Fragment>
      }
    >
      <div className="flex gap-3">
        {isDangerous && (
          <div className="flex-shrink-0">
            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          </div>
        )}
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}
