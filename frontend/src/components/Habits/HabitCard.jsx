/**
 * HabitCard.jsx
 * Individual habit card with toggle, edit, delete actions
 */

import React from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.habit - Habit object
 * @param {Function} props.onToggle - Toggle handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @returns {React.ReactElement}
 */
export default function HabitCard({ habit, onToggle, onEdit, onDelete }) {
  return (
    <div className={`border border-slate-200 rounded-lg p-4 flex items-center justify-between transition-colors ${
      habit.active ? 'bg-white' : 'bg-slate-50'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={habit.active}
            onChange={onToggle}
            className="w-5 h-5 rounded border-slate-300"
          />
        </label>

        <div className="text-2xl">{habit.emoji}</div>

        <div className="flex-1">
          <h3 className={`font-semibold ${habit.active ? 'text-slate-900' : 'text-slate-600'}`}>
            {habit.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
            <span>{habit.duration}m</span>
            {habit.time && <span>{habit.time}</span>}
            {habit.recurrence && <span>{habit.recurrence}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {habit.category && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
            {habit.category}
          </span>
        )}

        {habit.priority === 'p1' && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-100 text-red-700">
            Non-Displaceable
          </span>
        )}

        <button
          onClick={onEdit}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
