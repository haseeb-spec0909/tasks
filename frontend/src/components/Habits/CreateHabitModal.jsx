/**
 * CreateHabitModal.jsx
 * Modal for creating/editing habits
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
export default function CreateHabitModal({ isOpen = false, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    emoji: '✨',
    category: 'work',
    minDuration: 15,
    maxDuration: 60,
    idealTime: '09:00',
    recurrence: ['mon', 'tue', 'wed', 'thu', 'fri'],
    priority: 'p3',
  });

  const emojis = ['✨', '🎯', '💪', '🧘', '📚', '☕', '🚴', '🍎', '📱', '🎵', '📓', '⏰'];
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate?.(formData);
    setFormData({
      title: '',
      emoji: '✨',
      category: 'work',
      minDuration: 15,
      maxDuration: 60,
      idealTime: '09:00',
      recurrence: ['mon', 'tue', 'wed', 'thu', 'fri'],
      priority: 'p3',
    });
  };

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: prev.recurrence.includes(day)
        ? prev.recurrence.filter((d) => d !== day)
        : [...prev.recurrence, day],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Create Habit</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Habit Name</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Morning Exercise"
              required
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji: e })}
                  className={`text-2xl p-2 rounded transition-colors ${
                    formData.emoji === e ? 'bg-blue-100' : 'hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="spiritual">Spiritual</option>
            </select>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Duration (minutes)</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-600">Min</label>
                <input
                  type="number"
                  value={formData.minDuration}
                  onChange={(e) => setFormData({ ...formData, minDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="5"
                  max="120"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-600">Max</label>
                <input
                  type="number"
                  value={formData.maxDuration}
                  onChange={(e) => setFormData({ ...formData, maxDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  min="5"
                  max="240"
                />
              </div>
            </div>
          </div>

          {/* Ideal Time */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Ideal Time</label>
            <input
              type="time"
              value={formData.idealTime}
              onChange={(e) => setFormData({ ...formData, idealTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Recurrence</label>
            <div className="flex gap-2 flex-wrap">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    formData.recurrence.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
