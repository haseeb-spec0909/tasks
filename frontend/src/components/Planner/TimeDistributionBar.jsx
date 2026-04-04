/**
 * TimeDistributionBar.jsx
 * Shows time breakdown by category for the week
 * Colored segments: Focus, Meetings, PF Tasks, G Tasks, Personal, Free
 */

import React, { useMemo } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.events - Calendar events
 * @param {Array} props.tasks - Tasks
 * @param {Date} props.weekStart - Week start date
 * @param {Date} props.weekEnd - Week end date
 * @returns {React.ReactElement}
 */
export default function TimeDistributionBar({ events = [], tasks = [], weekStart, weekEnd }) {
  const categories = useMemo(() => {
    const working = 45; // 9-6, Mon-Fri = 9 hours × 5 = 45
    return {
      focus: 8,
      meetings: 6,
      pfTasks: 12,
      gTasks: 10,
      personal: 5,
      free: working - (8 + 6 + 12 + 10 + 5),
    };
  }, []);

  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  const segments = [
    { label: 'Focus', hours: categories.focus, color: 'bg-indigo-500', key: 'focus' },
    { label: 'Meetings', hours: categories.meetings, color: 'bg-blue-500', key: 'meetings' },
    { label: 'PF Tasks', hours: categories.pfTasks, color: 'bg-teal-500', key: 'pfTasks' },
    { label: 'G Tasks', hours: categories.gTasks, color: 'bg-green-500', key: 'gTasks' },
    { label: 'Personal', hours: categories.personal, color: 'bg-amber-400', key: 'personal' },
    { label: 'Free', hours: categories.free, color: 'bg-slate-300', key: 'free' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Weekly Time Distribution</h3>
        <span className="text-xs text-slate-600">{total}h total</span>
      </div>

      <div className="flex h-8 rounded-lg overflow-hidden bg-white border border-slate-200">
        {segments.map((segment) => {
          const percentage = (segment.hours / total) * 100;
          return (
            <div
              key={segment.key}
              className={`${segment.color} flex-1 flex items-center justify-center group relative transition-all hover:opacity-80`}
              style={{ flexBasis: `${percentage}%` }}
              title={`${segment.label}: ${segment.hours}h`}
            >
              {percentage > 12 && (
                <span className="text-xs font-bold text-white group-hover:block">
                  {segment.hours}h
                </span>
              )}
              <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity">
                {segment.label}: {segment.hours}h
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${segment.color}`} />
            <span className="text-slate-600">{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
