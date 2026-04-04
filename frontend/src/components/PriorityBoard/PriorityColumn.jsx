/**
 * PriorityColumn.jsx
 * Single priority column in the kanban board
 */

import React from 'react';
import DraggableTaskCard from './DraggableTaskCard';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.priority - Priority config
 * @param {Array} props.tasks - Tasks in this column
 * @param {Array} props.selectedTasks - Selected task IDs
 * @param {Function} props.onTaskMove - Move handler
 * @param {Function} props.onTaskSelect - Select handler
 * @returns {React.ReactElement}
 */
export default function PriorityColumn({ priority, tasks = [], selectedTasks = [], onTaskMove, onTaskSelect }) {
  const colorMap = {
    red: 'bg-red-50 border-red-200 text-red-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
  };

  const headerColorMap = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className={`rounded-lg border-2 ${colorMap[priority.color]} flex flex-col`}>
      {/* Header */}
      <div className={`${headerColorMap[priority.color]} p-4 border-b-2 border-current rounded-t-sm`}>
        <h2 className="font-semibold text-lg">{priority.label}</h2>
        <p className="text-sm opacity-75">{priority.description}</p>
        <div className="mt-2 inline-block px-2 py-1 bg-white/50 rounded text-sm font-bold">
          {tasks.length}
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-96">
        {tasks.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <p className="text-sm">No tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              isSelected={selectedTasks.includes(task.id)}
              onSelect={() => onTaskSelect(task.id)}
              onMove={(newPriority) => onTaskMove(task, newPriority)}
            />
          ))
        )}
      </div>
    </div>
  );
}
