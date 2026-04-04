/**
 * TeamDashboardView.jsx
 * Manager team view with workload heatmap, WBS tracker, at-risk tasks
 */

import React, { useState } from 'react';
import WbsTreeView from './WbsTreeView';
import CapacityChart from './CapacityChart';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.teamMembers - Team member data
 * @param {Array} props.projects - ProjectFlow projects
 * @returns {React.ReactElement}
 */
export default function TeamDashboardView({ teamMembers = [], projects = [] }) {
  const [selectedMember, setSelectedMember] = useState(null);

  const sampleMembers = [
    { id: 1, name: 'Ahmed Hassan', role: 'Lead Engineer', allocated: 38, available: 40 },
    { id: 2, name: 'Fatima Khan', role: 'PM', allocated: 40, available: 40 },
    { id: 3, name: 'Omar Singh', role: 'Designer', allocated: 35, available: 40 },
    { id: 4, name: 'Aisha Patel', role: 'QA', allocated: 32, available: 40 },
  ];

  const atRiskTasks = [
    { id: 1, title: 'Authentication Module', wpCode: 'WP-001', daysRemaining: 2, assignee: 'Ahmed Hassan' },
    { id: 2, title: 'Database Migration', wpCode: 'WP-002', daysRemaining: 1, assignee: 'Omar Singh' },
    { id: 3, title: 'UI Components Library', wpCode: 'WP-003', daysRemaining: 3, assignee: 'Aisha Patel' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-600 mt-1">Monitor team capacity, workload, and project health</p>
      </div>

      {/* Team Workload Heatmap */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Team Workload (This Week)</h2>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Days Header */}
            <div className="flex mb-2">
              <div className="w-32" />
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                <div key={day} className="w-20 text-center font-medium text-slate-900">
                  {day}
                </div>
              ))}
            </div>

            {/* Team Members */}
            {sampleMembers.map((member) => (
              <div key={member.id} className="flex mb-2">
                <div className="w-32 text-sm font-medium text-slate-900">{member.name}</div>
                {[0.7, 0.8, 0.9, 0.75, 0.65].map((intensity, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-10 rounded border border-slate-200"
                    style={{
                      backgroundColor:
                        intensity > 0.85
                          ? '#dc2626'
                          : intensity > 0.7
                          ? '#f59e0b'
                          : intensity > 0.5
                          ? '#3b82f6'
                          : '#dbeafe',
                    }}
                    onClick={() => setSelectedMember(member.id)}
                    role="button"
                    className="w-20 h-10 rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                    title={`${Math.round(intensity * 100)}% allocated`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-Risk Tasks */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-4">At-Risk Tasks (Due < 3 Days)</h2>
        <div className="space-y-2">
          {atRiskTasks.length === 0 ? (
            <p className="text-slate-600 text-sm">No at-risk tasks</p>
          ) : (
            atRiskTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-sm text-slate-600">{task.wpCode} • {task.assignee}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-600">
                    {task.daysRemaining} day{task.daysRemaining !== 1 ? 's' : ''} left
                  </span>
                  <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded font-medium hover:bg-blue-600 transition-colors">
                    Message in Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Capacity Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Team Capacity</h2>
        <CapacityChart members={sampleMembers} />
      </div>

      {/* ProjectFlow WBS Tracker */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-900 mb-4">ProjectFlow WBS Tracker</h2>
        <WbsTreeView projects={projects} />
      </div>

      {/* Member Detail (if selected) */}
      {selectedMember && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-2">
            {sampleMembers.find((m) => m.id === selectedMember)?.name} - Schedule
          </h3>
          <p className="text-sm text-slate-600">Click on a team member to see their detailed schedule</p>
        </div>
      )}
    </div>
  );
}
