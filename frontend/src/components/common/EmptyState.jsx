import clsx from 'clsx'

/**
 * EmptyState component with icon, title, description, optional action button
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4', className)}>
      {Icon && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Icon size={40} className="text-gray-400 dark:text-gray-600" />
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
