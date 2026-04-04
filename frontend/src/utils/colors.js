/**
 * Color utility for mapping event categories to hex colors
 */

const CATEGORY_COLORS = {
  'oneOnOne': '#3B82F6',        // Blue
  'one-on-one': '#3B82F6',      // Blue
  'teamMeeting': '#7C3AED',     // Purple
  'team-meeting': '#7C3AED',    // Purple
  'external': '#EC4899',         // Pink
  'personal': '#FB7185',         // Coral
  'googleTask': '#10B981',       // Green
  'google-task': '#10B981',      // Green
  'google_task': '#10B981',      // Green
  'projectflow': '#0D9488',      // Teal
  'projectFlow': '#0D9488',      // Teal
  'project-flow': '#0D9488',     // Teal
  'focus': '#4F46E5',            // Indigo
  'habit': '#F59E0B',            // Amber
}

const PRIORITY_COLORS = {
  'P1': '#EF4444',               // Red
  'P2': '#F97316',               // Orange
  'P3': '#3B82F6',               // Blue
  'P4': '#9CA3AF',               // Gray
  1: '#EF4444',
  2: '#F97316',
  3: '#3B82F6',
  4: '#9CA3AF',
}

const STATUS_COLORS = {
  'planned': '#94A3B8',          // Slate
  'scheduled': '#3B82F6',        // Blue
  'in_progress': '#F59E0B',      // Amber
  'inProgress': '#F59E0B',       // Amber
  'completed': '#10B981',        // Green
  'blocked': '#EF4444',          // Red
  'cancelled': '#6B7280',        // Gray
}

/**
 * Get hex color for a category
 */
export function getCategoryColor(category) {
  if (!category) return '#999999'
  return CATEGORY_COLORS[category] || '#999999'
}

/**
 * Get hex color for a priority
 */
export function getPriorityColor(priority) {
  if (priority === null || priority === undefined) return '#999999'
  return PRIORITY_COLORS[priority] || '#999999'
}

/**
 * Get hex color for a status
 */
export function getStatusColor(status) {
  if (!status) return '#999999'
  return STATUS_COLORS[status] || '#999999'
}

/**
 * Get Tailwind color class for a category
 */
export function getCategoryColorClass(category) {
  if (!category) return 'bg-gray-200'
  
  const classMap = {
    'oneOnOne': 'bg-blue-100 text-blue-900',
    'one-on-one': 'bg-blue-100 text-blue-900',
    'teamMeeting': 'bg-purple-100 text-purple-900',
    'team-meeting': 'bg-purple-100 text-purple-900',
    'external': 'bg-pink-100 text-pink-900',
    'personal': 'bg-red-100 text-red-900',
    'googleTask': 'bg-green-100 text-green-900',
    'google-task': 'bg-green-100 text-green-900',
    'google_task': 'bg-green-100 text-green-900',
    'projectflow': 'bg-teal-100 text-teal-900',
    'projectFlow': 'bg-teal-100 text-teal-900',
    'project-flow': 'bg-teal-100 text-teal-900',
    'focus': 'bg-indigo-100 text-indigo-900',
    'habit': 'bg-amber-100 text-amber-900',
  }
  
  return classMap[category] || 'bg-gray-100 text-gray-900'
}

/**
 * Get Tailwind color class for priority
 */
export function getPriorityColorClass(priority) {
  const classMap = {
    'P1': 'bg-red-100 text-red-900',
    'P2': 'bg-orange-100 text-orange-900',
    'P3': 'bg-blue-100 text-blue-900',
    'P4': 'bg-gray-100 text-gray-900',
    1: 'bg-red-100 text-red-900',
    2: 'bg-orange-100 text-orange-900',
    3: 'bg-blue-100 text-blue-900',
    4: 'bg-gray-100 text-gray-900',
  }
  
  return classMap[priority] || 'bg-gray-100 text-gray-900'
}
