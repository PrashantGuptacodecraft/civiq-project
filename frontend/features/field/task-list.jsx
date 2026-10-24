'use client';

import React, { useState, useMemo } from 'react';
import { FieldTask, FieldTaskStatus } from './types';
import { TaskCard } from './task-card';

interface TaskListProps {
  tasks;
  selectedTaskId?;
  onSelectTask: (taskId) => void;
  isLoading?;
  error?;
  onRetry?() => void;
}

const PRIORITY_ORDER = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  isLoading = false,
  error,
  onRetry,
}) {
  const [activeTab, setActiveTab] = useState<'ALL' | FieldTaskStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Priority-sorted list with filtering
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (activeTab !== 'ALL' && t.status !== activeTab) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.title.toLowerCase().includes(q) ||
            t.location.address.toLowerCase().includes(q) ||
            t.categoryName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Priority order first
        const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (pDiff !== 0) return pDiff;
        // Then remaining SLA hours
        return a.slaHoursRemaining - b.slaHoursRemaining;
      });
  }, [tasks, activeTab, searchQuery]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading tasks">
        <div className="h-10 bg-slate-200 animate-pulse rounded-md w-full" />
        <div className="h-32 bg-slate-200 animate-pulse rounded-lg w-full" />
        <div className="h-32 bg-slate-200 animate-pulse rounded-lg w-full" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-lg m-4">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="text-base font-bold text-red-900 mb-1">Failed to Load Tasks</h3>
        <p className="text-xs text-red-700 mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded-md shadow-sm hover:bg-red-700 outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const counts = {
    ALL: tasks.length,
    ASSIGNED: tasks.filter((t) => t.status === 'ASSIGNED').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    RESOLVED: tasks.filter((t) => t.status === 'RESOLVED').length,
  };

  return (
    <section className="flex flex-col h-full" aria-label="Field task list">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-border-primary bg-surface-primary sticky top-16 z-20 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="search"
            placeholder="Search tasks, streets, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] px-3.5 pl-9 text-sm rounded-md border border-border-primary bg-surface-secondary text-text-primary placeholder:text-text-tertiary outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Search assigned tasks"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 min-h-[30px] min-w-[30px] text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs (Touch Targets >= 44px) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="tablist">
          {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary text-text-inverse shadow-sm'
                    : 'bg-surface-secondary text-text-secondary hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.replace('_', ' ')} ({counts[tab]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          // Empty State
          <div className="text-center py-12 px-4 border-2 border-dashed border-border-primary rounded-lg bg-surface-secondary">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-base font-bold text-text-primary mb-1">No Tasks Found</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              {searchQuery
                ? `No tasks match search "${searchQuery}". Clear query to see all tasks.`
                : activeTab === 'ALL'
                ? 'No civic issues currently assigned to your shift.'
                : `No tasks currently in status "${activeTab.replace('_', ' ')}".`}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isActive={task.id === selectedTaskId}
              onSelectTask={onSelectTask}
            />
          ))
        )}
      </div>
    </section>
  );
}