/**
 * FocusTimeView.jsx
 * Focus time management dashboard
 * Weekly progress, daily breakdown, defense mode, target distribution
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {number} props.weeklyTarget - Target hours per week
 * @param {Array} props.dailyHours - Hours achieved per day (Mon-Fri)
 * @returns {React.ReactElement}
 */
export default function FocusTimeView({ weeklyTarget = 8, dailyHours = [1.5, 2, 1.8, 2.2, 1.5] }) {
  const [defenseMode, setDefenseMode] = useState('flexible');
  const [distribution, setDistribution] = useState([1.6, 1.6, 1.6, 1.6, 1.6]);
  const [minBlockLength, setMinBlockLength] = useState(30);
  const [maxBlockLength, setMaxBlockLength] = useState(120);
  const [idealStartTime, setIdealStartTime] = useState('09:00');

  const achieved = dailyHours.reduce((a, b) => a + b, 0);
  const progressPercent = Math.min(100, (achieved / weeklyTarget) * 100);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const maxDaily = Math.max(...dailyHours);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Focus Time Management</h1>
        <p className="text-slate-600 mt-1">Protect your deep work blocks and track focus time</p>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white border border-slate-200 rounded-lg p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Weekly Progress</h2>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${(progressPercent / 100) * 283} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-slate-900">{achieved.toFixed(1)}h</p>
                <p className="text-sm text-slate-600">of {weeklyTarget}h target</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              <p className="font-medium text-slate-900">You're {progressPercent >= 100 ? 'exceeding' : 'on track for'} your weekly focus target!</p>
              <p className="text-sm text-slate-600">
                {progressPercent >= 100
                  ? 'Excellent work! You have achieved your focus target.'
                  : `${(weeklyTarget - achieved).toFixed(1)}h remaining this week`}
              </p>
              <div className="mt-4 space-y-2">
                {days.map((day, idx) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 w-8">{day}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${(dailyHours[idx] / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 w-10 text-right">{dailyHours[idx]}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Defense Mode */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Focus Defense Mode</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900">Mode</label>
            <div className="flex gap-3 mt-2">
              {(['flexible', 'locked'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDefenseMode(mode)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    defenseMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {defenseMode === 'locked'
                ? 'Focus blocks cannot be moved or interrupted'
                : 'Focus blocks can be rescheduled if needed'}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Distribution */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Distribution</h2>
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              Even Distribution
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              Custom
            </button>
          </div>

          <div className="space-y-3">
            {days.map((day, idx) => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-10 font-medium text-slate-700">{day}</span>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.25"
                  value={distribution[idx]}
                  onChange={(e) => {
                    const newDist = [...distribution];
                    newDist[idx] = parseFloat(e.target.value);
                    setDistribution(newDist);
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-sm font-medium text-slate-700 text-right">
                  {distribution[idx].toFixed(2)}h
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 text-right">
            Total: {distribution.reduce((a, b) => a + b, 0).toFixed(2)}h per week
          </p>
        </div>
      </div>

      {/* Block Settings */}
      <div className="grid grid-cols-2 gap-6">
        {/* Min/Max Block Length */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Block Length Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900">Minimum Block: {minBlockLength}m</label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={minBlockLength}
                onChange={(e) => setMinBlockLength(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900">Maximum Block: {maxBlockLength}m</label>
              <input
                type="range"
                min="60"
                max="480"
                step="30"
                value={maxBlockLength}
                onChange={(e) => setMaxBlockLength(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Ideal Start Time */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Preferences</h3>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Ideal Start Time</label>
            <input
              type="time"
              value={idealStartTime}
              onChange={(e) => setIdealStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-600 mt-2">
              AI will prefer to schedule focus blocks starting at this time
            </p>
          </div>
        </div>
      </div>

      {/* Current Focus Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Current Focus</h3>
        <p className="text-slate-600 text-sm">No focus block active. Next scheduled focus block is tomorrow at 9:00 AM</p>
      </div>
    </div>
  );
}
