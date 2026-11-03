import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  taskCache,
  mutationQueueManager,
  generateIdempotencyKey,
  TaskCacheManager,
  OfflineMutationQueue,
} from './offline-sync.js';

describe('Phase 69: Frontend Offline Field Sync & Simulation', () => {
  beforeEach(() => {
    taskCache.clear();
    mutationQueueManager.clear();
  });

  describe('Local Task Cache Management', () => {
    it('initializes and caches field tasks locally', () => {
      const mockTasks = [
        {
          id: 'tsk_1',
          title: 'Repair Road Sign',
          status: 'ASSIGNED',
          version: 1,
        },
        {
          id: 'tsk_2',
          title: 'Fix Water Valve',
          status: 'IN_PROGRESS',
          version: 2,
        },
      ];

      taskCache.setTasks(mockTasks);
      expect(taskCache.getAllTasks().length).toBe(2);
      expect(taskCache.getTask('tsk_1').title).toBe('Repair Road Sign');
      expect(taskCache.lastSyncedAt).toBeDefined();
    });

    it('updates task optimistically in cache with dirty flag', () => {
      taskCache.setTasks([
        { id: 'tsk_10', title: 'Streetlight outage', status: 'ASSIGNED', version: 1 },
      ]);

      const updated = taskCache.updateTaskLocally('tsk_10', {
        status: 'IN_PROGRESS',
        notes: 'En route to pole',
      });

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.notes).toBe('En route to pole');
      expect(updated._isDirty).toBe(true);

      const retrieved = taskCache.getTask('tsk_10');
      expect(retrieved.status).toBe('IN_PROGRESS');
    });

    it('upserts server-synced tasks clearing dirty flag', () => {
      taskCache.setTasks([
        { id: 'tsk_20', title: 'Drain cleaning', status: 'IN_PROGRESS', version: 1, _isDirty: true },
      ]);

      const syncedTask = {
        id: 'tsk_20',
        title: 'Drain cleaning',
        status: 'RESOLVED',
        version: 2,
        _isDirty: false,
        updatedAt: '2026-03-01T12:00:00.000Z',
      };

      const result = taskCache.upsertTask(syncedTask);
      expect(result._isDirty).toBe(false);
      expect(result.status).toBe('RESOLVED');
      expect(result.version).toBe(2);

      const stored = taskCache.getTask('tsk_20');
      expect(stored._isDirty).toBe(false);
      expect(stored.updatedAt).toBe('2026-03-01T12:00:00.000Z');
    });
  });

  describe('Offline Mutation Queue & Idempotency Generation', () => {
    it('generates unique, collision-resistant idempotency keys with action and task context', () => {
      const key1 = generateIdempotencyKey('task_123', 'START_PROGRESS');
      const key2 = generateIdempotencyKey('task_123', 'START_PROGRESS');

      expect(key1).toMatch(/^idemp_task_123_start_progress_\d+_[a-z0-9]+$/);
      expect(key2).toMatch(/^idemp_task_123_start_progress_\d+_[a-z0-9]+$/);
      expect(key1).not.toBe(key2);
    });

    it('enqueues mutations offline with pending state and base version', () => {
      const mutation = mutationQueueManager.enqueue(
        'task_456',
        'UPDATE_NOTES',
        { notes: 'Inspected pothole, depth 15cm' },
        3
      );

      expect(mutation.idempotencyKey).toBeDefined();
      expect(mutation.taskId).toBe('task_456');
      expect(mutation.baseVersion).toBe(3);
      expect(mutation.status).toBe('PENDING');

      expect(mutationQueueManager.getPendingCount()).toBe(1);
    });

    it('applies optimistic updates without altering unrelated properties', () => {
      const task = {
        id: 'task_789',
        status: 'ASSIGNED',
        priority: 'CRITICAL',
        notes: 'Original',
      };

      const inProgress = mutationQueueManager.applyOptimistic(task, 'START_PROGRESS', {});
      expect(inProgress.status).toBe('IN_PROGRESS');
      expect(inProgress.priority).toBe('CRITICAL');

      const resolved = mutationQueueManager.applyOptimistic(inProgress, 'RESOLVE_TASK', {
        resolutionNotes: 'Fixed with cold-mix asphalt',
      });
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionNotes).toBe('Fixed with cold-mix asphalt');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('flushes queued mutations cleanly when online simulation succeeds', async () => {
      mutationQueueManager.enqueue('tsk_1', 'START_PROGRESS', {}, 1);
      mutationQueueManager.enqueue('tsk_1', 'UPDATE_NOTES', { notes: 'Started work' }, 1);
      expect(mutationQueueManager.getPendingCount()).toBe(2);

      const mockDispatcher = vi.fn().mockResolvedValue({
        success: true,
        results: [{ status: 'APPLIED' }, { status: 'APPLIED' }],
      });

      const syncResult = await mutationQueueManager.flush(mockDispatcher);

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(2);
      expect(mutationQueueManager.getPendingCount()).toBe(0);
      expect(mockDispatcher).toHaveBeenCalledTimes(1);
    });

    it('increments retry count and retains queue when offline dispatch fails', async () => {
      mutationQueueManager.enqueue('tsk_fail', 'UPDATE_NOTES', { notes: 'Offline try' }, 1);

      const mockFailingDispatcher = vi.fn().mockRejectedValue(new Error('Network offline (503)'));

      const syncResult = await mutationQueueManager.flush(mockFailingDispatcher);

      expect(syncResult.success).toBe(false);
      expect(syncResult.remainingCount).toBe(1);
      expect(mutationQueueManager.getPendingCount()).toBe(1);

      const queued = mutationQueueManager.getQueue();
      expect(queued[0].retryCount).toBe(1);
    });
  });

  describe('Offline/Online E2E Simulation (Phase 69 Exit Check)', () => {
    it('executes full offline lifecycle: cache -> offline actions -> queue -> online flush -> reconciliation', async () => {
      // 1. Initial State: cached task on worker's device
      const initialTask = {
        id: 'tsk_e2e_101',
        title: 'Repair water main valve',
        status: 'ASSIGNED',
        version: 1,
        notes: 'Initial assignment',
        updatedAt: '2026-03-01T08:00:00.000Z',
      };
      taskCache.setTasks([initialTask]);
      expect(taskCache.getAllTasks().length).toBe(1);

      // 2. Worker goes offline and starts work
      let currentTask = taskCache.getTask('tsk_e2e_101');
      const startMutation = mutationQueueManager.enqueue('tsk_e2e_101', 'START_PROGRESS', {}, currentTask.version);
      currentTask = mutationQueueManager.applyOptimistic(currentTask, 'START_PROGRESS', {});
      taskCache.updateTaskLocally('tsk_e2e_101', currentTask);

      expect(startMutation.idempotencyKey).toBeDefined();
      expect(currentTask.status).toBe('IN_PROGRESS');
      expect(taskCache.getTask('tsk_e2e_101')._isDirty).toBe(true);
      expect(mutationQueueManager.getPendingCount()).toBe(1);

      // 3. Worker updates notes and submits evidence while still offline
      const notesMutation = mutationQueueManager.enqueue(
        'tsk_e2e_101',
        'UPDATE_NOTES',
        { notes: 'Excavated 1m pit, valve seal replaced' },
        currentTask.version
      );
      currentTask = mutationQueueManager.applyOptimistic(currentTask, 'UPDATE_NOTES', {
        notes: 'Excavated 1m pit, valve seal replaced',
      });
      taskCache.updateTaskLocally('tsk_e2e_101', currentTask);

      expect(notesMutation.idempotencyKey).not.toBe(startMutation.idempotencyKey);
      expect(mutationQueueManager.getPendingCount()).toBe(2);

      // 4. Worker marks task resolved offline
      const resolveMutation = mutationQueueManager.enqueue(
        'tsk_e2e_101',
        'RESOLVE_TASK',
        { resolutionNotes: 'Valve tested under 6 bar pressure - leak free' },
        currentTask.version
      );
      currentTask = mutationQueueManager.applyOptimistic(currentTask, 'RESOLVE_TASK', {
        resolutionNotes: 'Valve tested under 6 bar pressure - leak free',
      });
      taskCache.updateTaskLocally('tsk_e2e_101', currentTask);

      expect(mutationQueueManager.getPendingCount()).toBe(3);
      expect(currentTask.status).toBe('RESOLVED');

      // 5. Worker reconnects to network -> Dispatch batch sync to server
      const serverSimulatedTask = {
        ...currentTask,
        version: 4,
        _isDirty: false,
        updatedAt: '2026-03-01T09:30:00.000Z',
      };

      const serverDispatcher = vi.fn().mockImplementation(async (mutations) => {
        expect(mutations).toHaveLength(3);
        // Verify every mutation carries a unique idempotency key
        const keys = new Set(mutations.map((m) => m.idempotencyKey));
        expect(keys.size).toBe(3);

        return {
          success: true,
          appliedCount: 3,
          duplicateCount: 0,
          conflictCount: 0,
          results: [
            { taskId: 'tsk_e2e_101', status: 'APPLIED', task: serverSimulatedTask },
            { taskId: 'tsk_e2e_101', status: 'APPLIED', task: serverSimulatedTask },
            { taskId: 'tsk_e2e_101', status: 'APPLIED', task: serverSimulatedTask },
          ],
        };
      });

      const syncResult = await mutationQueueManager.flush(serverDispatcher);
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(3);
      expect(mutationQueueManager.getPendingCount()).toBe(0);

      // 6. Client reconciles server response into local cache
      taskCache.upsertTask(serverSimulatedTask);
      const reconciledTask = taskCache.getTask('tsk_e2e_101');
      expect(reconciledTask.version).toBe(4);
      expect(reconciledTask._isDirty).toBe(false);
      expect(reconciledTask.status).toBe('RESOLVED');
      expect(reconciledTask.notes).toBe('Excavated 1m pit, valve seal replaced');
    });
  });
});
