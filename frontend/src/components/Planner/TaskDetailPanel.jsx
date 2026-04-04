/**
 * TaskDetailPanel.jsx
 * Slide-over panel showing full task details
 * Supports both Google Tasks and ProjectFlow tasks
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.task - Task to display
 * @param {boolean} props.isOpen - Panel visibility
 * @param {Function} props.onClose - Close handler
 * @returns {React.ReactElement}
 */
export default function TaskDetailPanel({ task, isOpen = false, onClose }) {
  const [progress, setProgress] = useState(task?.progress || 0);

  if (!isOpen || !task) return null;

  const isPFTask = task.source === 'projectflow';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 p-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-slate-900">{task.title}</h3>
            {task.source && (
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded mt-2 ${
                task.source === 'google'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-teal-100 text-teal-700'
              }`}>
                {task.source === 'google' ? 'Google Task' : 'ProjectFlow'}
              </span>
            )}
          </div>

          {/* ProjectFlow Details */}
          {isPFTask && task.wpCode && (
            <div className="space-y-3 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div>
                <label className="text-xs font-semibold text-slate-600">WP Code</label>
                <p className="text-sm font-mono text-teal-700">{task.wpCode}</p>
              </div>

              {task.wbsHierarchy && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">WBS Path</label>
                  <div className="text-xs text-slate-700 mt-1">
                    {task.wbsHierarchy.split(' > ').map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {idx > 0 && <span className="text-slate-400">→</span>}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {task.progress !== undefined && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">Progress</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-slate-900">{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Due Date</label>
              <p className="text-sm text-slate-900 mt-1">
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Duration */}
          {task.duration && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Estimated Duration</label>
              <p className="text-sm text-slate-900 mt-1">{task.duration} minutes</p>
            </div>
          )}

          {/* Status */}
          {task.status && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <p className="text-sm text-slate-900 mt-1 capitalize">{task.status}</p>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Notes</label>
              <p className="text-sm text-slate-700 mt-1">{task.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 p-6 flex gap-3 flex-shrink-0">
          <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm">
            Mark Complete
          </button>
          <button className="flex-1 bg-slate-100 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm">
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
