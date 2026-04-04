/**
 * TaskListView.jsx
 * Full task management view with filtering and sorting
 * Source filters, status filters, date filters, search
 */

import React, { useState, useMemo } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.tasks - All tasks
 * @param {Function} props.onCreateTask - Create task handler
 * @param {Function} props.onTaskClick - Task click handler
 * @returns {React.ReactElement}
 */
export default function TaskListView({ tasks = [], onCreateTask, onTaskClick }) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const sourceCounts = useMemo(() => {
    return {
      all: tasks.length,
      google: tasks.filter((t) => t.source === 'google').length,
      projectflow: tasks.filter((t) => t.source === 'projectflow').length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((t) =>
        sourceFilter === 'google' ? t.source === 'google' : t.source === 'projectflow'
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      filtered = filtered.filter((t) => {
        const due = new Date(t.dueDate);
        if (dateFilter === 'week') return due <= nextWeek && due >= today;
        if (dateFilter === 'nextWeek') return due > nextWeek && due <= new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (dateFilter === 'overdue') return due < today;
        return true;
      });
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'dueDate') {
      filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (sortBy === 'priority') {
      const priorityOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
      filtered.sort((a, b) => (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999));
    } else if (sortBy === 'source') {
      filtered.sort((a, b) => a.source.localeCompare(b.source));
    }

    return filtered;
  }, [tasks, sourceFilter, statusFilter, dateFilter, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border border-slate-200">
          {/* Source Tabs */}
          <div className="flex gap-2">
            {(['all', 'google', 'projectflow']).map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sourceFilter === source
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {source === 'all' ? 'All Tasks' : source === 'google' ? 'Google' : 'ProjectFlow'} ({
                  sourceCounts[source]
                })
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="schedule">AI Schedule</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="source">Source</option>
          </select>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-500">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    {task.source === 'google' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">G</span>}
                    {task.source === 'projectflow' && <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded">PF</span>}
                    {task.status && <span>{task.status}</span>}
                    {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="text-right ml-4">
                  {task.priority && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      task.priority === 'p1' ? 'bg-red-100 text-red-700' :
                      task.priority === 'p2' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'p3' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
