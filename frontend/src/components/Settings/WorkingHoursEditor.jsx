/**
 * WorkingHoursEditor.jsx
 * Per-day working hours editor with visual preview
 */

import React from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.hours - Hours configuration
 * @param {Function} props.onChange - Change handler
 * @returns {React.ReactElement}
 */
export default function WorkingHoursEditor({ hours = {}, onChange }) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleChange = (day, field, value) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      {/* Per-day editors */}
      {days.map((day, idx) => (
        <div key={day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="w-24">
            <label className="font-medium text-slate-900">{dayLabels[idx]}</label>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hours[day]?.enabled ?? true}
              onChange={(e) => handleChange(day, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Working</span>
          </label>

          {hours[day]?.enabled && (
            <>
              <input
                type="time"
                value={hours[day]?.start || '09:00'}
                onChange={(e) => handleChange(day, 'start', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-600">—</span>
              <input
                type="time"
                value={hours[day]?.end || '18:00'}
                onChange={(e) => handleChange(day, 'end', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      ))}

      {/* Visual Preview */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm font-medium text-slate-900 mb-3">Weekly Preview</p>
        <div className="flex gap-1">
          {days.map((day, idx) => {
            const isWorking = hours[day]?.enabled ?? true;
            return (
              <div
                key={day}
                className={`flex-1 h-12 rounded border-2 flex items-center justify-center text-xs font-bold ${
                  isWorking
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              >
                {dayLabels[idx].slice(0, 3)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
