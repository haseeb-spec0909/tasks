/**
 * TimeBreakdownChart.jsx
 * Pie/donut chart showing time breakdown by category
 * Using recharts or SVG-based implementation
 */

import React from 'react';

/**
 * @component
 * @returns {React.ReactElement}
 */
export default function TimeBreakdownChart() {
  const data = [
    { name: 'Focus', value: 8, color: '#6366f1' },
    { name: 'Meetings', value: 6, color: '#3b82f6' },
    { name: 'PF Tasks', value: 12, color: '#14b8a6' },
    { name: 'G Tasks', value: 10, color: '#22c55e' },
    { name: 'Personal', value: 5, color: '#f59e0b' },
    { name: 'Free', value: 4, color: '#cbd5e1' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const segments = data.map((item, idx) => {
    const percentage = (item.value / total) * 100;
    return {
      ...item,
      percentage,
      startAngle: data.slice(0, idx).reduce((sum, d) => sum + (d.value / total) * 360, 0),
      angle: (item.value / total) * 360,
    };
  });

  return (
    <div className="flex items-center justify-between">
      {/* Chart */}
      <svg viewBox="0 0 200 200" className="w-32 h-32">
        {segments.map((segment) => {
          const radius = 60;
          const start = (segment.startAngle * Math.PI) / 180;
          const end = ((segment.startAngle + segment.angle) * Math.PI) / 180;

          const x1 = 100 + radius * Math.cos(start);
          const y1 = 100 + radius * Math.sin(start);
          const x2 = 100 + radius * Math.cos(end);
          const y2 = 100 + radius * Math.sin(end);

          const largeArc = segment.angle > 180 ? 1 : 0;

          const path = `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path key={segment.name} d={path} fill={segment.color} stroke="white" strokeWidth="2" />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="space-y-2 ml-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-700">{item.name}</span>
            <span className="text-slate-600 text-xs">{item.value}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
