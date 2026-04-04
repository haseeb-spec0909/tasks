import clsx from 'clsx'

/**
 * SourceBadge component - shows G (green) or PF (teal)
 */
export default function SourceBadge({ source }) {
  if (!source) return null

  const isGoogle = source?.toLowerCase().includes('google')
  const isPf = source?.toLowerCase().includes('projectflow') || 
              source?.toLowerCase().includes('project-flow')

  const text = isGoogle ? 'G' : isPf ? 'PF' : source?.substring(0, 2).toUpperCase()
  const bgClass = isGoogle
    ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
    : isPf
    ? 'bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'

  return (
    <span className={clsx('text-xs font-semibold px-2 py-1 rounded', bgClass)}>
      {text}
    </span>
  )
}
