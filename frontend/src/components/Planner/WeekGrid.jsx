/**
 * WeekGrid.jsx
 * Week calendar grid showing Mon-Fri with 30-min time slots
 * Auto-scrolls to current time, renders event blocks
 */

import React, { useState, useEffect, useRef } from 'react';
import EventBlock from './EventBlock';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.events - Calendar events
 * @param {Array} props.tasks - Tasks to render
 * @param {Date} props.weekStart - Week start
 * @param {Date} props.weekEnd - Week end
 * @param {Function} props.onTaskClick - Click handler
 * @param {boolean} props.pauseScheduling - Scheduling paused flag
 * @returns {React.ReactElement}
 */
export default function WeekGrid({ events = [], tasks = [], weekStart, weekEnd, onTaskClick, pauseScheduling }) {
  const [workingHours] = useState({ start: 9, end: 18 }); // 9am-6pm
  const gridRef = useRef(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Generate time labels (30-min intervals)
  const timeSlots = [];
  for (let h = workingHours.start; h <= workingHours.end; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < workingHours.end) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Auto-scroll to current time
  useEffect(() => {
    const now = new Date();
    if (now >= weekStart && now <= weekEnd) {
      const hour = now.getHours();
      const minute = now.getMinutes();
      const scrollTop = ((hour - workingHours.start) * 60 + minute) * 2; // rough approximation
      if (gridRef.current) {
        gridRef.current.scrollTop = Math.max(0, scrollTop - 200);
      }
    }
  }, [weekStart, weekEnd, workingHours.start]);

  const getDayColumn = (date) => {
    const dayIndex = (date.getDay() + 6) % 7; // Adjust so Monday = 0
    return dayIndex < 5 ? dayIndex : null;
  };

  const getEventPosition = (event) => {
    const startDate = new Date(event.startTime);
    const columnIndex = getDayColumn(startDate);
    if (columnIndex === null) return null;

    const hour = startDate.getHours();
    const minute = startDate.getMinutes();
    const topOffset = ((hour - workingHours.start) * 60 + minute) * 2;

    const endDate = new Date(event.endTime);
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    const height = ((endHour - hour) * 60 + (endMinute - minute)) * 2;

    return { columnIndex, topOffset, height };
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with day names */}
      <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <div className="border-r border-slate-200 p-2 text-xs font-semibold text-slate-600 text-center">Time</div>
        {days.map((day, idx) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + idx);
          return (
            <div key={day} className="border-r border-slate-200 p-3 text-center">
              <div className="text-sm font-semibold text-slate-900">{day}</div>
              <div className="text-xs text-slate-600">{date.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 relative">
          {/* Time labels column */}
          <div className="border-r border-slate-200 bg-slate-50">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-16 border-b border-slate-200 p-2 text-xs text-slate-600 font-medium flex items-start justify-center"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => (
            <div key={day} className="border-r border-slate-200 relative">
              {timeSlots.map((time) => (
                <div
                  key={`${day}-${time}`}
                  className="h-16 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer relative group transition-colors"
                  onClick={() => {
                    // Handle "add task here" click
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">Add task</span>
                  </div>
                </div>
              ))}

              {/* Event blocks for this day */}
              <div className="absolute inset-0 pointer-events-none">
                {events
                  .filter((event) => getDayColumn(new Date(event.startTime)) === dayIdx)
                  .map((event) => {
                    const pos = getEventPosition(event);
                    if (!pos) return null;
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0 right-0 pointer-events-auto mx-1"
                        style={{ top: `${pos.topOffset}px`, height: `${pos.height}px` }}
                      >
                        <EventBlock event={event} onClick={() => onTaskClick?.(event)} />
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
