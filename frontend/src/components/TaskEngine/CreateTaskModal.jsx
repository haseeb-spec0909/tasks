/**
 * CreateTaskModal.jsx
 * Modal for creating new Google Tasks
 * Supports duration, due date, priority, notes, split settings
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onCreate - Create handler
 * @returns {React.ReactElement}
 */
export default function CreateTaskModal({ isOpen = false, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    duration: 60,
    dueDate: '',
    priority: 'p3',
    type: 'work',
    splitAllowed: true,
    minBlock: 15,
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate?.(formData);
    setFormData({
      title: '',
      duration: 60,
      dueDate: '',
      priority: 'p3',
      type: 'work',
      splitAllowed: true,
      minBlock: 15,
      notes: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What do you need to do?"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.priority === p
                      ? p === 'p1'
                        ? 'bg-red-500 text-white'
                        : p === 'p2'
                        ? 'bg-orange-500 text-white'
                        : p === 'p3'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Type</label>
            <div className="flex gap-2">
              {(['work', 'personal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.type === t
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Split Allowed */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.splitAllowed}
              onChange={(e) => setFormData({ ...formData, splitAllowed: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Can be split across multiple blocks</span>
          </label>

          {/* Min Block */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Minimum Block Duration (mins)</label>
            <input
              type="number"
              value={formData.minBlock}
              onChange={(e) => setFormData({ ...formData, minBlock: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="15"
              max="120"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Add any additional details..."
            />
          </div>

          {/* Command Syntax Helper */}
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
            <p className="font-medium mb-1">Quick syntax:</p>
            <p>[duration:2h, due:friday, priority:high]</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
