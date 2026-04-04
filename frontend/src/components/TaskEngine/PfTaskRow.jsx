/**
 * PfTaskRow.jsx
 * ProjectFlow task row with WP code, progress, status, expandable details
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.task - ProjectFlow task
 * @param {Function} props.onClick - Click handler
 * @returns {React.ReactElement}
 */
export default function PfTaskRow({ task, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    'not-started': 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'on-hold': 'bg-yellow-100 text-yellow-700',
    'at-risk': 'bg-red-100 text-red-700',
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Main Row */}
      <div
        className="bg-white p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button
              className="p-1 hover:bg-slate-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded font-mono text-sm font-semibold">
              {task.wpCode}
            </span>

            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{task.title}</p>
              {task.projectPath && (
                <p className="text-xs text-slate-500 truncate">{task.projectPath}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-4">
          {/* Progress Bar */}
          {task.progress !== undefined && (
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          )}

          {/* Status Badge */}
          {task.status && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded capitalize whitespace-nowrap ${statusColors[task.status] || statusColors['not-started']}`}>
              {task.status.replace('-', ' ')}
            </span>
          )}

          {/* Days Remaining */}
          {task.dueDate && (
            <span className="text-sm text-slate-600 whitespace-nowrap">
              {Math.max(0, Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
          {task.wbsHierarchy && (
            <div>
              <label className="text-xs font-semibold text-slate-600">WBS Path</label>
              <p className="text-sm text-slate-700 mt-1">{task.wbsHierarchy}</p>
            </div>
          )}

          {task.progress !== undefined && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Progress: {task.progress}%</label>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {task.statusHistory && task.statusHistory.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Recent Status Changes</label>
              <div className="space-y-1 mt-2">
                {task.statusHistory.slice(0, 3).map((entry, idx) => (
                  <p key={idx} className="text-xs text-slate-600">
                    {entry.status} - {new Date(entry.date).toLocaleDateString()}
                  </p>
                ))}
              </div>
            </div>
          )}

          {task.lastUpdated && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Last Updated</label>
              <p className="text-xs text-slate-600 mt-1">
                {new Date(task.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(task);
            }}
            className="w-full mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
}
