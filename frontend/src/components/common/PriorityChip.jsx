import clsx from 'clsx'
import { getPriorityColorClass } from '../../utils/colors'

/**
 * PriorityChip component - P1 (red), P2 (orange), P3 (blue), P4 (gray)
 */
export default function PriorityChip({ priority }) {
  if (priority === null || priority === undefined) return null

  const priorityMap = {
    'P1': 'P1',
    'P2': 'P2',
    'P3': 'P3',
    'P4': 'P4',
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: 'P4',
  }

  const label = priorityMap[priority] || String(priority)
  const colorClass = getPriorityColorClass(priority)

  return (
    <span className={clsx('text-xs font-semibold px-2 py-1 rounded', colorClass)}>
      {label}
    </span>
  )
}
