/**
 * TaskDetailView.jsx
 * Full task detail page with all fields and actions
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.task - Task to display
 * @param {Function} props.onUpdate - Update handler
 * @returns {React.ReactElement}
 */
export default function TaskDetailView({ task, onUpdate }) {
  const [progress, setProgress] = useState(task?.progress || 0);
  const [isEditing, setIsEditing] = useState(false);

  const isPFTask = task?.source === 'projectflow';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{task?.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {task?.source === 'google' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium">Google Task</span>}
              {isPFTask && <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded text-sm font-medium">ProjectFlow</span>}
              {task?.status && <span className="text-sm text-slate-600">Status: {task.status}</span>}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* ProjectFlow Details */}
          {isPFTask && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">ProjectFlow Details</h3>
              <div className="space-y-3 text-sm">
                {task.wpCode && (
                  <div>
                    <label className="font-medium text-slate-700">WP Code</label>
                    <p className="text-slate-600 font-mono">{task.wpCode}</p>
                  </div>
                )}
                {task.wbsHierarchy && (
                  <div>
                    <label className="font-medium text-slate-700">WBS Hierarchy</label>
                    <p className="text-slate-600">{task.wbsHierarchy}</p>
                  </div>
                )}
                {task.assignee && (
                  <div>
                    <label className="font-medium text-slate-700">Assigned to</label>
                    <p className="text-slate-600">{task.assignee}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Due Date & Duration */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              {task?.dueDate && (
                <div>
                  <label className="font-medium text-slate-700">Due Date</label>
                  <p className="text-slate-600">
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {task?.duration && (
                <div>
                  <label className="font-medium text-slate-700">Estimated Duration</label>
                  <p className="text-slate-600">{task.duration} minutes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Progress */}
          {isPFTask && task?.progress !== undefined && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Progress</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-slate-900">{progress}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Status */}
          {task?.status && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Status</h3>
              <p className="text-slate-600 capitalize">{task.status}</p>
            </div>
          )}

          {/* Notes */}
          {task?.notes && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Notes</h3>
              <p className="text-slate-600 text-sm">{task.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scheduling Info */}
      {task?.scheduledTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-slate-900 mb-2">Scheduled For</h3>
          <p className="text-slate-700">
            {new Date(task.scheduledTime).toLocaleString()}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
          Mark Complete
        </button>
        <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
          Update Progress
        </button>
        <button className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors">
          Reschedule
        </button>
      </div>
    </div>
  );
}
