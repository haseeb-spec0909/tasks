/**
 * TaskCompletionChart.jsx
 * Bar chart showing task completion by source
 */

import React from 'react';

/**
 * @component
 * @returns {React.ReactElement}
 */
export default function TaskCompletionChart() {
  const data = [
    { week: 'Week 1', completed: 12, total: 15, source: 'Google' },
    { week: 'Week 2', completed: 14, total: 16, source: 'ProjectFlow' },
    { week: 'Week 3', completed: 16, total: 18, source: 'Mixed' },
    { week: 'Week 4', completed: 13, total: 14, source: 'Google' },
  ];

  const maxValue = 20;

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = (item.completed / item.total) * 100;
        return (
          <div key={item.week}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-900">{item.week}</span>
              <span className="text-sm text-slate-600">
                {item.completed}/{item.total} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
              <div
                className="bg-green-500 rounded-full transition-all"
                style={{ width: `${(item.completed / maxValue) * 100}%` }}
              />
              <div
                className="bg-slate-300 rounded-full transition-all"
                style={{ width: `${((item.total - item.completed) / maxValue) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
