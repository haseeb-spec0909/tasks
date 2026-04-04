/**
 * HabitsView.jsx
 * Habits management with active list and TMC templates
 * Create custom habits, toggle active/inactive
 */

import React, { useState } from 'react';
import HabitCard from './HabitCard';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.habits - Active habits
 * @returns {React.ReactElement}
 */
export default function HabitsView({ habits = [] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeHabits, setActiveHabits] = useState(habits);

  const tmcTemplates = [
    {
      id: 'lunch',
      title: 'Lunch Break',
      emoji: '🍽️',
      duration: 60,
      time: '12:00-13:00',
      recurrence: 'Mon-Fri',
    },
    {
      id: 'dhuhr',
      title: 'Dhuhr Prayer',
      emoji: '🕌',
      duration: 15,
      time: '12:30',
      recurrence: 'Daily',
      priority: 'p1',
    },
    {
      id: 'asr',
      title: 'Asr Prayer',
      emoji: '🕌',
      duration: 15,
      time: '15:45',
      recurrence: 'Daily',
      priority: 'p1',
    },
    {
      id: 'daily-review',
      title: 'Daily Review',
      emoji: '📋',
      duration: 15,
      time: '17:30',
      recurrence: 'Mon-Fri',
    },
  ];

  const handleToggleHabit = (habitId) => {
    setActiveHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, active: !h.active } : h))
    );
  };

  const handleAddTemplate = (template) => {
    const newHabit = {
      id: `habit-${Date.now()}`,
      ...template,
      active: true,
    };
    setActiveHabits((prev) => [...prev, newHabit]);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Habits</h1>
        <p className="text-slate-600 mt-1">Create recurring activities and schedule your day</p>
      </div>

      {/* Active Habits Section */}
      {activeHabits.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Habits</h2>
          <div className="space-y-3">
            {activeHabits
              .filter((h) => h.active)
              .map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
          </div>
        </div>
      )}

      {/* Inactive Habits Section */}
      {activeHabits.filter((h) => !h.active).length > 0 && (
        <div className="mb-8 opacity-60">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Inactive Habits</h2>
          <div className="space-y-2">
            {activeHabits
              .filter((h) => !h.active)
              .map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
          </div>
        </div>
      )}

      {/* TMC Templates Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">TMC Templates</h2>
        <p className="text-sm text-slate-600 mb-4">Quick-add templates for common TMC habits</p>
        <div className="grid grid-cols-2 gap-4">
          {tmcTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => handleAddTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.emoji}</span>
                  <h3 className="font-semibold text-slate-900">{template.title}</h3>
                </div>
                {template.priority === 'p1' && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>Duration: {template.duration}m</p>
                <p>When: {template.time}</p>
                <p>Recurrence: {template.recurrence}</p>
              </div>
              <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Add to Habits
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Custom Habit Button */}
      <div className="text-center">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Custom Habit
        </button>
      </div>
    </div>
  );
}
