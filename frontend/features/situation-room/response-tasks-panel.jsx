'use client';

import React, { useState } from 'react';
import { TASK_STATUS_CLASSES, PRIORITY_BADGE_CLASSES } from './types.js';

export function ResponseTasksPanel({ tasks = [], onStatusUpdate, onTaskCreate }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('RESCUE_EVACUATION');
  const [priority, setPriority] = useState('HIGH_P1');
  const [address, setAddress] = useState('');
  const [unitName, setUnitName] = useState('PMC Rapid Disaster Response Squad');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !onTaskCreate) return;
    await onTaskCreate({
      title: title.trim(),
      taskType,
      priority,
      location: { address: address || 'Disaster Corridor' },
      assignedUnit: { name: unitName },
    });
    setTitle('');
    setAddress('');
    setIsCreating(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Emergency Response Tasks ({tasks.length})
          </h2>
          <p className="text-xs text-slate-500">
            Task dispatch, unit navigation, and on-scene resolution tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                filter === 'ACTIVE' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                filter === 'COMPLETED' ? 'bg-white text-green-700 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Dispatch New Task Button */}
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm min-h-[44px] flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Dispatch Task</span>
          </button>
        </div>
      </div>

      {/* Task Creation Inline Modal/Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-950">Dispatch Operational Response Task</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-500 hover:text-slate-800 p-1 min-h-[36px] min-w-[36px]"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deploy boat rescue crew to Swapna Nagari"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sinhagad Road Near Vitthal Mandir"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              >
                <option value="RESCUE_EVACUATION">Rescue & Evacuation</option>
                <option value="DEWATERING_PUMPING">Dewatering & Pumping</option>
                <option value="DEBRIS_ROAD_CLEARANCE">Debris & Road Clearance</option>
                <option value="FOOD_WATER_RELIEF">Food & Drinking Water</option>
                <option value="MEDICAL_AID_TRIAGE">Medical Aid & Triage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              >
                <option value="CRITICAL_P0">Critical P0 (Life-Safety Immediate)</option>
                <option value="HIGH_P1">High P1 (Urgent Protection)</option>
                <option value="MEDIUM_P2">Medium P2 (Operational Logistics)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
            >
              Confirm Dispatch
            </button>
          </div>
        </form>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No response tasks match the current filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        PRIORITY_BADGE_CLASSES[task.priority] || 'bg-slate-600 text-white'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${
                        TASK_STATUS_CLASSES[task.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      {task.taskNumber || task.id}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description || task.notes}
                  </p>
                </div>
              </div>

              {/* Unit Info & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span>🚒</span>
                  <span className="font-semibold text-slate-800">
                    {task.assignedUnit?.name || 'Assigned Crew'}
                  </span>
                  {task.assignedUnit?.contactPhoneMasked && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({task.assignedUnit.contactPhoneMasked})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span>📍</span>
                  <span className="truncate">{task.location?.address || 'Site Location'}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              {onStatusUpdate && task.status !== 'COMPLETED' && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Progress:</span>
                  {task.status === 'DISPATCHED' && (
                    <button
                      type="button"
                      onClick={() => onStatusUpdate(task.id, 'EN_ROUTE')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 min-h-[44px]"
                    >
                      Mark En Route
                    </button>
                  )}
                  {(task.status === 'DISPATCHED' || task.status === 'EN_ROUTE') && (
                    <button
                      type="button"
                      onClick={() => onStatusUpdate(task.id, 'ON_SCENE')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 min-h-[44px]"
                    >
                      Mark On Scene
                    </button>
                  )}
                  {task.status === 'ON_SCENE' && (
                    <button
                      type="button"
                      onClick={() => onStatusUpdate(task.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 min-h-[44px]"
                    >
                      Mark Completed ✓
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
