'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FieldTask, FieldWorkerProfile } from './types';
import { CURRENT_FIELD_WORKER, MOCK_FIELD_TASKS } from './mock-tasks';
import { mutationQueue } from './mutations';
import { OfflineBanner } from './offline-banner';
import { InstallPrompt } from './install-prompt';
import { TaskList } from './task-list';
import { TaskDetail } from './task-detail';

interface FieldWorkerConsoleProps {
  initialTasks?: FieldTask[] | undefined;
  initialWorker?: FieldWorkerProfile | undefined;
}

export function FieldWorkerConsole({
  initialTasks,
  initialWorker = CURRENT_FIELD_WORKER,
}: FieldWorkerConsoleProps) {
  const [worker, setWorker] = useState<FieldWorkerProfile>(initialWorker);
  const [tasks, setTasks] = useState<FieldTask[]>(initialTasks || MOCK_FIELD_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network connectivity & mutation queue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);

      const handleOnline = () => {
        setIsOffline(false);
        handleManualSync();
      };
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setQueuedCount(mutationQueue.getQueue().length);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await mutationQueue.syncQueue(async (mutation) => {
        // Simulated network dispatch for queued item
        await new Promise((resolve) => setTimeout(resolve, 300));
        return true;
      });
      setQueuedCount(mutationQueue.getQueue().length);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Filter tasks restricted to worker's assigned jurisdiction / tasks
  const authorizedTasks = tasks.filter(
    (t) =>
      t.jurisdictionId === worker.jurisdictionId ||
      t.assignedWorkerId === worker.id
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Mutation Handlers (Retry-Safe with Optimistic Updates)
  const handleStartProgress = async (taskId: string) => {
    // 1. Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? mutationQueue.applyOptimisticUpdate(t, 'START_PROGRESS', {})
          : t
      )
    );

    // 2. Queue mutation
    mutationQueue.enqueue(taskId, 'START_PROGRESS', { status: 'IN_PROGRESS' });
    setQueuedCount(mutationQueue.getQueue().length);

    // 3. If online, trigger sync
    if (!isOffline) {
      await handleManualSync();
    }
  };

  const handleUpdateNotes = async (taskId: string, notes: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? mutationQueue.applyOptimisticUpdate(t, 'UPDATE_NOTES', { notes })
          : t
      )
    );

    mutationQueue.enqueue(taskId, 'UPDATE_NOTES', { notes });
    setQueuedCount(mutationQueue.getQueue().length);

    if (!isOffline) {
      await handleManualSync();
    }
  };

  const handleResolveTask = async (taskId: string, resolutionNotes: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? mutationQueue.applyOptimisticUpdate(t, 'RESOLVE_TASK', { resolutionNotes })
          : t
      )
    );

    mutationQueue.enqueue(taskId, 'RESOLVE_TASK', {
      status: 'RESOLVED',
      resolutionNotes,
    });
    setQueuedCount(mutationQueue.getQueue().length);

    if (!isOffline) {
      await handleManualSync();
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary flex flex-col">
      {/* Offline Status & Sync Banner */}
      <OfflineBanner
        isOffline={isOffline}
        queuedCount={queuedCount}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
      />

      {/* PWA Homescreen Install Prompt */}
      <InstallPrompt />

      {/* Field Worker Header */}
      <header className="bg-surface-primary border-b border-border-primary px-4 py-3 shadow-elevation-1">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
              🛠
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary leading-tight">
                {worker.name}
              </div>
              <div className="text-xs text-text-secondary truncate max-w-[200px] sm:max-w-xs">
                {worker.departmentName} • {worker.jurisdictionName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              ● Active Shift
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-xl w-full mx-auto">
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            currentWorker={worker}
            onBack={() => setSelectedTaskId(null)}
            onStartProgress={handleStartProgress}
            onUpdateNotes={handleUpdateNotes}
            onResolveTask={handleResolveTask}
          />
        ) : (
          <TaskList
            tasks={authorizedTasks}
            selectedTaskId={selectedTaskId ?? undefined}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        )}
      </div>
    </div>
  );
}
