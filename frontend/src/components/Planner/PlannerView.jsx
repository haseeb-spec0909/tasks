/**
 * PlannerView.jsx
 * Main planner page with week view calendar
 * - Time distribution bar
 * - Week navigation
 * - WeekGrid + RightPanel layout
 * - Scheduling controls
 */

import React, { useState, useMemo } from 'react';
import TimeDistributionBar from './TimeDistributionBar';
import WeekGrid from './WeekGrid';
import RightPanel from './RightPanel';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.events - Calendar events
 * @param {Array} props.tasks - Tasks to schedule
 * @param {Function} props.onTaskClick - Callback when task clicked
 * @returns {React.ReactElement}
 */
export default function PlannerView({ events = [], tasks = [], onTaskClick }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [pauseScheduling, setPauseScheduling] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('upNext');
  const [tasksFitWarning, setTasksFitWarning] = useState(false);

  const weekStart = useMemo(() => {
    const date = new Date(currentWeek);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }, [currentWeek]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  const formatWeekLabel = () => {
    const start = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Time Distribution Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <TimeDistributionBar events={events} tasks={tasks} weekStart={weekStart} weekEnd={weekEnd} />
      </div>

      {/* Warning Banner */}
      {tasksFitWarning && (
        <div className="bg-orange-50 border-b-2 border-orange-400 px-6 py-3 flex items-center gap-2">
          <span className="text-orange-600 text-sm font-medium">
            Warning: Some tasks don't fit in your schedule this week. They may be pushed to next week.
          </span>
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-slate-900 min-w-48">{formatWeekLabel()}</span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 2h12a1 1 0 011 1v2h2a1 1 0 011 1v2h1a1 1 0 110 2h-1v6h1a1 1 0 110 2h-1v2a1 1 0 01-1 1h-2v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2H4a1 1 0 01-1-1v-2H2a1 1 0 110-2h1V8H2a1 1 0 110-2h1V4a1 1 0 011-1h2V3a1 1 0 011-1z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pause Scheduling Toggle */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pauseScheduling}
            onChange={(e) => setPauseScheduling(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700 font-medium">Pause AI scheduling</span>
        </label>
      </div>

      {/* Main Content - Week Grid + Right Panel */}
      <div className="flex flex-1 bg-slate-50">
        <div className="flex-1" style={{ width: '70%' }}>
          <WeekGrid
            events={events}
            tasks={tasks}
            weekStart={weekStart}
            weekEnd={weekEnd}
            onTaskClick={onTaskClick}
            pauseScheduling={pauseScheduling}
          />
        </div>
        <div className="border-l border-slate-200" style={{ width: '30%' }}>
          <RightPanel
            tasks={tasks}
            tab={rightPanelTab}
            onTabChange={setRightPanelTab}
            onTaskClick={onTaskClick}
          />
        </div>
      </div>
    </div>
  );
}
