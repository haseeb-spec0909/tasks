/**
 * WorkloadHeatmap.jsx
 * Grid showing scheduled hours per day with color intensity
 */

import React from 'react';

/**
 * @component
 * @returns {React.ReactElement}
 */
export default function WorkloadHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 9am - 6pm

  const data = {
    Mon: [0.2, 0.4, 0.8, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1, 0],
    Tue: [0.1, 0.3, 0.7, 0.95, 0.85, 0.6, 0.4, 0.3, 0.2, 0.1],
    Wed: [0.3, 0.5, 0.85, 0.92, 0.8, 0.4, 0.2, 0.1, 0, 0],
    Thu: [0.2, 0.4, 0.75, 0.88, 0.75, 0.5, 0.3, 0.2, 0.1, 0],
    Fri: [0.4, 0.6, 0.9, 0.95, 0.85, 0.55, 0.35, 0.2, 0, 0],
  };

  const getColor = (intensity) => {
    if (intensity === 0) return '#f1f5f9';
    if (intensity < 0.3) return '#dbeafe';
    if (intensity < 0.5) return '#93c5fd';
    if (intensity < 0.7) return '#60a5fa';
    if (intensity < 0.85) return '#3b82f6';
    return '#1d4ed8';
  };

  const getIntensityLabel = (intensity) => {
    if (intensity === 0) return 'Free';
    if (intensity < 0.3) return 'Light';
    if (intensity < 0.5) return 'Moderate';
    if (intensity < 0.7) return 'Busy';
    if (intensity < 0.85) return 'Very Busy';
    return 'Overloaded';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="flex">
          <div className="w-16" />
          {days.map((day) => (
            <div
              key={day}
              className="w-20 text-center font-semibold text-slate-900 py-2 border-b-2 border-slate-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-slate-100">
            <div className="w-16 py-3 px-2 text-sm font-medium text-slate-600 bg-slate-50 border-r border-slate-200">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((day) => {
              const intensity = data[day][hours.indexOf(hour)];
              return (
                <div
                  key={`${day}-${hour}`}
                  className="w-20 h-12 border-r border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: getColor(intensity) }}
                  title={`${day} ${hour}:00 - ${getIntensityLabel(intensity)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 flex-wrap text-sm">
        <span className="font-medium text-slate-700">Intensity:</span>
        {[
          { label: 'Free', color: '#f1f5f9' },
          { label: 'Light', color: '#dbeafe' },
          { label: 'Moderate', color: '#93c5fd' },
          { label: 'Busy', color: '#60a5fa' },
          { label: 'Very Busy', color: '#3b82f6' },
          { label: 'Overloaded', color: '#1d4ed8' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
