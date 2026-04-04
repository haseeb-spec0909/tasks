/**
 * SettingsView.jsx
 * Settings page with working hours, focus time, notifications, connections
 */

import React, { useState } from 'react';
import WorkingHoursEditor from './WorkingHoursEditor';
import NotificationPreferences from './NotificationPreferences';

/**
 * @component
 * @returns {React.ReactElement}
 */
export default function SettingsView() {
  const [workingHours, setWorkingHours] = useState({
    mon: { start: '09:00', end: '18:00', enabled: true },
    tue: { start: '09:00', end: '18:00', enabled: true },
    wed: { start: '09:00', end: '18:00', enabled: true },
    thu: { start: '09:00', end: '18:00', enabled: true },
    fri: { start: '09:00', end: '18:00', enabled: true },
  });

  const [focusTarget, setFocusTarget] = useState(8);
  const [role, setRole] = useState('Manager');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [pfConnected, setPfConnected] = useState(true);
  const [lastSync, setLastSync] = useState(new Date(Date.now() - 3600000));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Configure your TimeIntel preferences</p>
      </div>

      {/* Account Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Email</label>
            <input
              type="email"
              value="haseeb@tmcltd.ai"
              disabled
              className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Team Member">Team Member</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Working Hours</h2>
        <WorkingHoursEditor hours={workingHours} onChange={setWorkingHours} />
      </div>

      {/* Focus Time */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Focus Time Target</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Weekly Target: {focusTarget}h
            </label>
            <input
              type="range"
              min="2"
              max="20"
              step="0.5"
              value={focusTarget}
              onChange={(e) => setFocusTarget(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <p className="text-sm text-slate-600">
            You have {focusTarget} hours per week for uninterrupted deep work. The AI scheduler will protect these blocks.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
        <NotificationPreferences />
      </div>

      {/* ProjectFlow Connection */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">ProjectFlow Connection</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Connected</p>
              <p className="text-sm text-slate-600">
                Linked to haseeb@tmcltd.ai
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Last synced: {lastSync.toLocaleString()}
              </p>
              <p className="text-xs text-slate-600">
                Tasks found: 47 across 5 projects
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm">
              Sync Now
            </button>
          </div>

          <p className="text-xs text-slate-600">
            ProjectFlow tasks are automatically synced every hour. Manual sync can be triggered above.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
          Save Changes
        </button>
        <button className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
