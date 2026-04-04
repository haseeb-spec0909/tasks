import { useState } from 'react'
import { Checkbox, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { formatDuration, formatRelativeDate, getPriorityLabel } from '../../utils/formatters'
import { getCategoryColorClass, getPriorityColorClass } from '../../utils/colors'
import PriorityChip from './PriorityChip'
import SourceBadge from './SourceBadge'

/**
 * TaskCard component - reusable task card
 */
export default function TaskCard({ task, onComplete, onUpdate, onClick }) {
  const [expanded, setExpanded] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async (e) => {
    e.stopPropagation()
    setIsCompleting(true)
    try {
      await onComplete?.(task.id)
    } finally {
      setIsCompleting(false)
    }
  }

  const isPfTask = task.source?.toLowerCase().includes('projectflow') || task.source?.toLowerCase().includes('project-flow')
  const isGoogleTask = task.source?.toLowerCase().includes('google')

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900 transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors mt-1 flex-shrink-0"
          >
            <Checkbox
              size={20}
              className={clsx(
                isCompleting && 'opacity-50',
                task.completed && 'text-green-600 dark:text-green-400'
              )}
            />
          </button>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h3
              className={clsx(
                'font-medium truncate',
                task.completed && 'line-through text-gray-500 dark:text-gray-400'
              )}
            >
              {task.title}
            </h3>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Source badge */}
              <SourceBadge source={task.source} />

              {/* Priority */}
              {task.priority && (
                <PriorityChip priority={task.priority} />
              )}

              {/* Due date */}
              {task.dueDate && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                  {formatRelativeDate(task.dueDate)}
                </span>
              )}

              {/* Duration */}
              {task.estimatedMinutes && (
                <span className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {formatDuration(task.estimatedMinutes)}
                </span>
              )}

              {/* ProjectFlow-specific badges */}
              {isPfTask && task.wpCode && (
                <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100 px-2 py-1 rounded font-mono">
                  {task.wpCode}
                </span>
              )}

              {isPfTask && task.projectName && (
                <span className="text-xs bg-teal-50 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded truncate">
                  {task.projectName}
                </span>
              )}

              {/* Google Tasks-specific badges */}
              {isGoogleTask && task.listName && (
                <span className="text-xs bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded truncate">
                  {task.listName}
                </span>
              )}
            </div>

            {/* Progress bar for ProjectFlow tasks */}
            {isPfTask && task.progress !== undefined && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(task.progress, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {task.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {task.description}
                </p>
              </div>
            )}

            {isPfTask && task.wbsPath && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Path
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {task.wbsPath}
                </p>
              </div>
            )}

            {task.status && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Status
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {task.status.replace('_', ' ')}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                Edit Priority
              </button>
              <button className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
