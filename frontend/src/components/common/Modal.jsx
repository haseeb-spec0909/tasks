import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Fragment } from 'react'
import clsx from 'clsx'

/**
 * Modal component using @headlessui/react Dialog
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
}) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all',
                  sizeClasses[size]
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </Dialog.Title>
                  )}

                  {closeButton && (
                    <button
                      onClick={onClose}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-auto"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
