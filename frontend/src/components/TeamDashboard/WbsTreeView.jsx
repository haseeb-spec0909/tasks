/**
 * WbsTreeView.jsx
 * Collapsible tree view of ProjectFlow WBS hierarchy
 */

import React, { useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Array} props.projects - Projects array
 * @returns {React.ReactElement}
 */
export default function WbsTreeView({ projects = [] }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sampleWBS = [
    {
      id: 'prj1',
      name: 'TimeIntel Platform',
      type: 'project',
      status: 'in-progress',
      completion: 65,
      children: [
        {
          id: 'bld1',
          name: 'Frontend Build',
          type: 'build',
          status: 'in-progress',
          completion: 75,
          children: [
            {
              id: 'del1',
              name: 'UI Components',
              type: 'deliverable',
              status: 'completed',
              completion: 100,
              children: [
                { id: 'wp1', name: 'Button Component', type: 'wp', status: 'completed', assignee: 'Ahmed' },
                { id: 'wp2', name: 'Form Component', type: 'wp', status: 'completed', assignee: 'Fatima' },
              ],
            },
          ],
        },
      ],
    },
  ];

  const statusColors = {
    'not-started': 'text-slate-600',
    'in-progress': 'text-blue-600',
    'completed': 'text-green-600',
    'on-hold': 'text-yellow-600',
    'at-risk': 'text-red-600',
  };

  const TreeNode = ({ node, depth = 0 }) => {
    const isExpandable = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id];

    return (
      <div>
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-slate-50 rounded transition-colors"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {isExpandable && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!isExpandable && <div className="w-4" />}

          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            node.type === 'wp' ? 'bg-teal-100 text-teal-700' :
            node.type === 'deliverable' ? 'bg-purple-100 text-purple-700' :
            node.type === 'build' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {node.type.toUpperCase()}
          </span>

          <span className="font-medium text-slate-900">{node.name}</span>

          {node.status && (
            <span className={`text-xs font-medium capitalize ${statusColors[node.status] || 'text-slate-600'}`}>
              {node.status.replace('-', ' ')}
            </span>
          )}

          {node.completion !== undefined && (
            <span className="text-xs text-slate-600 ml-auto">{node.completion}%</span>
          )}
        </div>

        {isExpandable && isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {sampleWBS.map((project) => (
        <TreeNode key={project.id} node={project} />
      ))}
    </div>
  );
}
