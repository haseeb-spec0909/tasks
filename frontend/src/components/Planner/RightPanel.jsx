/**
 * RightPanel.jsx
 * Right sidebar with "Up Next" and "Tasks" tabs
 * Shows task queue and full task list
 */

import React from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.tasks - Task list
 * @param {string} props.tab - Active tab: 'upNext' or 'tasks'
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Function} props.onTaskClick - Task click handler
 * @returns {React.ReactElement}
 */
export default function RightPanel({ tasks = [], tab = 'upNext', onTabChange, onTaskClick }) {
  const [filterSource, setFilterSource] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const upNextTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const filteredTasks = tasks.filter((task) => {
    if (filterSource !== 'all' && task.source !== filterSource) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 sticky top-0 z-10 bg-white">
        <button
          onClick={() => onTabChange('upNext')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            tab === 'upNext'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Up Next
        </button>
        <button
          onClick={() => onTabChange('tasks')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            tab === 'tasks'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tasks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'upNext' ? (
          <div className="space-y-2 p-4">
            {upNextTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No upcoming tasks</p>
              </div>
            ) : (
              upNextTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    </div>
                    {task.source === 'google' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">G</span>}
                    {task.source === 'projectflow' && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">PF</span>}
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    {task.dueDate && <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>}
                    {task.duration && <div>Duration: {task.duration}m</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Source Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Source</label>
              <div className="space-y-1">
                {['all', 'google', 'projectflow'].map((source) => (
                  <label key={source} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      value={source}
                      checked={filterSource === source}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700 capitalize">{source === 'all' ? 'All Tasks' : source}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">No tasks found</p>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.source}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
