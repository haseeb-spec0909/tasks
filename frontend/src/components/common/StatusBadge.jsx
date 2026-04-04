import clsx from 'clsx'
import { getStatusLabel } from '../../utils/formatters'

/**
 * StatusBadge component with color coding
 */
export default function StatusBadge({ status }) {
  if (!status) return null

  const colorMap = {
    'planned': 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    'scheduled': 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
    'in_progress': 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100',
    'inProgress': 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100',
    'completed': 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100',
    'blocked': 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100',
    'cancelled': 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100',
  }

  const colorClass = colorMap[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <span className={clsx('text-xs font-semibold px-2 py-1 rounded', colorClass)}>
      {getStatusLabel(status)}
    </span>
  )
}
