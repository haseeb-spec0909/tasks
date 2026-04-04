/**
 * NotificationPreferences.jsx
 * Notification toggle switches with descriptions
 */

import React, { useState } from 'react';

/**
 * @component
 * @returns {React.ReactElement}
 */
export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    overdue: true,
    deadline: true,
    newAssignment: true,
    focusStart: true,
    dailyDigest: true,
    weeklyDigest: false,
  });

  const preferences = [
    {
      id: 'overdue',
      label: 'Overdue Tasks',
      description: 'Notify when a task becomes overdue',
    },
    {
      id: 'deadline',
      label: 'Upcoming Deadline',
      description: 'Reminder 24 hours before deadline',
    },
    {
      id: 'newAssignment',
      label: 'New Assignment',
      description: 'Notify when new task is assigned to you',
    },
    {
      id: 'focusStart',
      label: 'Focus Block Starting',
      description: '5 minutes before focus block starts',
    },
    {
      id: 'dailyDigest',
      label: 'Daily Digest',
      description: 'Summary of today at 5 PM',
    },
    {
      id: 'weeklyDigest',
      label: 'Weekly Summary',
      description: 'Weekly productivity summary (Fridays 5 PM)',
    },
  ];

  const togglePref = (id) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {preferences.map((pref) => (
        <label
          key={pref.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={prefs[pref.id] || false}
            onChange={() => togglePref(pref.id)}
            className="w-5 h-5 mt-0.5 rounded border-slate-300"
          />
          <div className="flex-1">
            <p className="font-medium text-slate-900">{pref.label}</p>
            <p className="text-sm text-slate-600">{pref.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
