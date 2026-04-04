import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format WBS path from metadata
 */
export function formatWbsPath(meta) {
  if (!meta) return ''
  if (Array.isArray(meta)) {
    return meta.filter(Boolean).join(' > ')
  }
  if (typeof meta === 'string') return meta
  return ''
}

/**
 * Format date relative to today
 */
export function formatRelativeDate(date) {
  if (!date) return 'N/A'
  const d = dayjs(date)
  const now = dayjs()
  
  if (d.isSame(now, 'day')) return 'Today'
  if (d.isSame(now.add(1, 'day'), 'day')) return 'Tomorrow'
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday'
  if (d.isBefore(now, 'day')) return d.format('MMM D')
  
  return d.fromNow()
}

/**
 * Format date for display (short form)
 */
export function formatDate(date, format = 'MMM D') {
  if (!date) return 'N/A'
  return dayjs(date).format(format)
}

/**
 * Format time range
 */
export function formatTimeRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('MMM D, h:mm A')} - ${end.format('h:mm A')}`
  }
  
  return `${start.format('MMM D, h:mm A')} - ${end.format('MMM D, h:mm A')}`
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority) {
  const labels = {
    'P1': 'P1 - Critical',
    'P2': 'P2 - High',
    'P3': 'P3 - Medium',
    'P4': 'P4 - Low',
    1: 'P1 - Critical',
    2: 'P2 - High',
    3: 'P3 - Medium',
    4: 'P4 - Low',
  }
  return labels[priority] || 'Unknown'
}

/**
 * Get status label
 */
export function getStatusLabel(status) {
  const labels = {
    'planned': 'Planned',
    'scheduled': 'Scheduled',
    'in_progress': 'In Progress',
    'inProgress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked',
    'cancelled': 'Cancelled',
  }
  return labels[status] || status || 'Unknown'
}

/**
 * Get source badge text and color
 */
export function getSourceBadge(source) {
  const badges = {
    'google': { text: 'G', bg: 'bg-green-100', text: 'text-green-900' },
    'google_tasks': { text: 'G', bg: 'bg-green-100', text: 'text-green-900' },
    'projectflow': { text: 'PF', bg: 'bg-teal-100', text: 'text-teal-900' },
    'projectFlow': { text: 'PF', bg: 'bg-teal-100', text: 'text-teal-900' },
    'project-flow': { text: 'PF', bg: 'bg-teal-100', text: 'text-teal-900' },
  }
  
  const normalized = source?.toLowerCase() || ''
  return badges[normalized] || { text: '?', bg: 'bg-gray-100', text: 'text-gray-900' }
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Format email domain for display
 */
export function formatEmailDomain(email) {
  if (!email) return ''
  return email.split('@')[1] || ''
}
