/**
 * StatsView.jsx
 * Personal stats dashboard with charts and metrics
 * Time breakdown, task completion, focus achievement, workload heatmap
 */

import React, { useMemo } from 'react';
import TimeBreakdownChart from './TimeBreakdownChart';
import TaskCompletionChart from './TaskCompletionChart';
import WorkloadHeatmap from './WorkloadHeatmap';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.events - Calendar events
 * @param {Array} props.tasks - Tasks
 * @returns {React.ReactElement}
 */
export default function StatsView({ events = [], tasks = [] }) {
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const focusAchieved = 8;
    const focusTarget = 8;

    const meetingHours = events.filter((e) => e.type === 'meeting').reduce((sum) => sum + 1, 0);

    return {
      completionRate,
      focusAchieved,
      focusTarget,
      meetingHours,
      totalHours: 45,
    };
  }, [tasks, events]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600 mt-1">Your weekly productivity insights</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Completion Rate */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Task Completion</h3>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.completionRate}%</p>
          <p className="text-xs text-slate-600 mt-1">Tasks completed this week</p>
        </div>

        {/* Focus Achievement */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Focus Time</h3>
            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.focusAchieved}h</p>
          <p className="text-xs text-slate-600 mt-1">of {stats.focusTarget}h target</p>
        </div>

        {/* Meeting Load */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Meeting Load</h3>
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.meetingHours}h</p>
          <p className="text-xs text-slate-600 mt-1">+5% from last week</p>
        </div>

        {/* ProjectFlow Health */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">PF On-Time</h3>
            <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-slate-900">87%</p>
          <p className="text-xs text-slate-600 mt-1">Tasks on-time delivery</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Time Breakdown</h2>
          <TimeBreakdownChart />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Task Completion Rate</h2>
          <TaskCompletionChart />
        </div>
      </div>

      {/* Workload Heatmap */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Weekly Workload Heatmap</h2>
        <WorkloadHeatmap />
      </div>
    </div>
  );
}
