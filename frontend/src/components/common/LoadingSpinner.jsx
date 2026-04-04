import clsx from 'clsx'

/**
 * LoadingSpinner component
 */
export default function LoadingSpinner({ size = 'md', center = true }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const spinner = (
    <div
      className={clsx(
        'animate-spin rounded-full border-b-2 border-t-2 border-blue-600 dark:border-blue-400',
        sizeClasses[size]
      )}
    />
  )

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    )
  }

  return spinner
}
