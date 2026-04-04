/**
 * DraggableTaskCard.jsx
 * Draggable task card wrapper for kanban board
 */

import React from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.task - Task object
 * @param {boolean} props.isSelected - Selection state
 * @param {Function} props.onSelect - Select handler
 * @param {Function} props.onMove - Move handler
 * @returns {React.ReactElement}
 */
export default function DraggableTaskCard({ task, isSelected = false, onSelect, onMove }) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const sourceColor = {
    google: 'bg-green-100 text-green-700',
    projectflow: 'bg-teal-100 text-teal-700',
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white border-2 border-slate-200 rounded-lg p-3 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Checkbox */}
      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.()}
          className="w-4 h-4 mt-1 rounded border-slate-300"
        />
        <h3 className="font-medium text-slate-900 flex-1 text-sm">{task.title}</h3>
      </label>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {task.source && (
          <span className={`px-2 py-0.5 rounded font-medium ${sourceColor[task.source] || ''}`}>
            {task.source === 'google' ? 'G' : 'PF'}
          </span>
        )}
        {task.dueDate && (
          <span>
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.duration && <span>{task.duration}m</span>}
      </div>
    </div>
  );
}
