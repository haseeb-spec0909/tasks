/**
 * PriorityBoardView.jsx
 * Kanban-style priority board with 4 columns (P1-P4)
 * Drag and drop between columns to change priority
 */

import React, { useState } from 'react';
import PriorityColumn from './PriorityColumn';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.tasks - All tasks
 * @param {Function} props.onPriorityChange - Priority change handler
 * @returns {React.ReactElement}
 */
export default function PriorityBoardView({ tasks = [], onPriorityChange }) {
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const priorities = [
    { level: 'p1', label: 'Critical', color: 'red', description: 'Must complete today' },
    { level: 'p2', label: 'High', color: 'orange', description: 'Complete this week' },
    { level: 'p3', label: 'Medium', color: 'blue', description: 'Complete this month' },
    { level: 'p4', label: 'Low', color: 'slate', description: 'Nice to have' },
  ];

  const getTasksByPriority = (priority) => {
    return boardTasks.filter((t) => t.priority === priority);
  };

  const handleTaskMove = (task, newPriority) => {
    const updated = boardTasks.map((t) =>
      t.id === task.id ? { ...t, priority: newPriority } : t
    );
    setBoardTasks(updated);
    onPriorityChange?.(task.id, newPriority);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Priority Board</h1>
        <p className="text-slate-600 mt-1">Organize tasks by priority. Drag to change priority level.</p>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">
            {selectedTasks.length} task(s) selected
          </span>
          <div className="flex gap-2">
            <button className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
              Reschedule to Next Week
            </button>
            <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
              Mark Complete
            </button>
          </div>
        </div>
      )}

      {/* Board Grid */}
      <div className="grid grid-cols-4 gap-4">
        {priorities.map((priority) => (
          <PriorityColumn
            key={priority.level}
            priority={priority}
            tasks={getTasksByPriority(priority.level)}
            selectedTasks={selectedTasks}
            onTaskMove={handleTaskMove}
            onTaskSelect={toggleTaskSelection}
          />
        ))}
      </div>
    </div>
  );
}
