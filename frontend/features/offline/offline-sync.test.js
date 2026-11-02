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
});
