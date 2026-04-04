/**
 * CapacityChart.jsx
 * Horizontal bar chart showing allocated vs available hours
 */

import React from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.members - Team members data
 * @returns {React.ReactElement}
 */
export default function CapacityChart({ members = [] }) {
  const maxCapacity = Math.max(...members.map((m) => m.available));

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const allocatedPercent = (member.allocated / member.available) * 100;
        const isOverloaded = member.allocated > member.available;

        return (
          <div key={member.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-900">{member.name}</span>
              <span className={`text-sm font-bold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                {member.allocated}/{member.available}h
              </span>
            </div>

            <div className="h-6 bg-slate-100 rounded-lg overflow-hidden flex">
              <div
                className={`transition-all flex items-center justify-end pr-2 text-xs font-bold text-white ${
                  isOverloaded ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(allocatedPercent, 100)}%` }}
              >
                {allocatedPercent > 30 && `${Math.round(allocatedPercent)}%`}
              </div>
              {isOverloaded && (
                <div
                  className="bg-red-200 flex items-center justify-center text-xs font-bold text-red-700"
                  style={{ width: `${allocatedPercent - 100}%` }}
                >
                  +{Math.round(member.allocated - member.available)}h
                </div>
              )}
            </div>

            {isOverloaded && (
              <p className="text-xs text-red-600 mt-1">Over-allocated by {member.allocated - member.available}h</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
