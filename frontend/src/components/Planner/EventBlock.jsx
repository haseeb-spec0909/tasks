/**
 * EventBlock.jsx
 * Individual event/task block on the week grid
 * Color-coded by category with hover details
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.event - Event/task object
 * @param {Function} props.onClick - Click handler
 * @returns {React.ReactElement}
 */
export default function EventBlock({ event, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getColorClass = () => {
    const type = event.type || 'meeting';
    const colors = {
      focus: 'bg-indigo-100 border-indigo-400 text-indigo-900',
      meeting: 'bg-blue-100 border-blue-400 text-blue-900',
      pfTask: 'bg-teal-100 border-teal-400 text-teal-900',
      gTask: 'bg-green-100 border-green-400 text-green-900',
      habit: 'bg-amber-100 border-amber-400 text-amber-900',
      personal: 'bg-pink-100 border-pink-400 text-pink-900',
    };
    return colors[type] || colors.meeting;
  };

  const getBadge = () => {
    const badges = {
      gTask: { text: 'G', color: 'bg-green-200' },
      pfTask: { text: 'PF', color: 'bg-teal-200' },
      meeting: { text: 'CAL', color: 'bg-blue-200' },
    };
    return badges[event.type] || null;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const badge = getBadge();
  const isAiManaged = event.aiManaged;

  return (
    <div
      className={`h-full rounded border-2 p-2 cursor-pointer transition-all hover:shadow-md ${getColorClass()} ${
        isAiManaged ? 'border-dashed opacity-90' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={event.title}
    >
      {/* Content */}
      <div className="h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{event.title}</p>
          </div>
          {badge && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>

        <div className="text-xs opacity-75 flex items-center gap-1">
          <span>{formatTime(event.startTime)}</span>
          {event.duration && <span>• {event.duration}m</span>}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bg-slate-900 text-white px-3 py-2 rounded shadow-lg text-xs max-w-xs break-words -top-12 left-0 whitespace-normal">
          <p className="font-semibold">{event.title}</p>
          <p>{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
        </div>
      )}
    </div>
  );
}
