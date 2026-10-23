import { FieldTask, QueuedMutation } from './types';

const QUEUE_STORAGE_KEY = 'civiq_field_mutation_queue_v1';

export function generateIdempotencyKey(taskId: string, action: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `mut_${taskId}_${action.toLowerCase()}_${ts}_${rand}`;
}

export class MutationQueueManager {
  private inMemoryQueue: QueuedMutation[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private loadFromStorage(): void {
    if (!this.isStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        this.inMemoryQueue = JSON.parse(raw);
      }
    } catch {
      this.inMemoryQueue = [];
    }
  }

  private saveToStorage(): void {
    if (!this.isStorageAvailable()) return;
    try {
      window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.inMemoryQueue));
    } catch {
      // Storage quota or disabled
    }
  }

  public enqueue(
    taskId: string,
    action: QueuedMutation['action'],
    payload: QueuedMutation['payload']
  ): QueuedMutation {
    const mutation: QueuedMutation = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      idempotencyKey: generateIdempotencyKey(taskId, action),
      taskId,
      action,
      payload,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.inMemoryQueue.push(mutation);
    this.saveToStorage();
    return mutation;
  }

  public getQueue(): QueuedMutation[] {
    return [...this.inMemoryQueue];
  }

  public remove(mutationId: string): void {
    this.inMemoryQueue = this.inMemoryQueue.filter((m) => m.id !== mutationId);
    this.saveToStorage();
  }

  public clear(): void {
    this.inMemoryQueue = [];
    this.saveToStorage();
  }

  /**
   * Applies an optimistic state update to a task locally before server confirmation.
   */
  public applyOptimisticUpdate(
    task: FieldTask,
    action: QueuedMutation['action'],
    payload: QueuedMutation['payload']
  ): FieldTask {
    const updated = { ...task };

    switch (action) {
      case 'START_PROGRESS':
        updated.status = 'IN_PROGRESS';
        break;
      case 'UPDATE_NOTES':
        if (payload.notes !== undefined) {
          updated.notes = payload.notes;
        }
        break;
      case 'RESOLVE_TASK':
        updated.status = 'RESOLVED';
        if (payload.resolutionNotes !== undefined) {
          updated.resolutionNotes = payload.resolutionNotes;
        }
        updated.resolvedAt = new Date().toISOString();
        break;
    }

    return updated;
  }

  /**
   * Replays queued mutations when network connectivity is restored.
   */
  public async syncQueue(
    syncHandler?: (item: QueuedMutation) => Promise<boolean>
  ): Promise<{ syncedCount: number; remainingCount: number }> {
    if (this.inMemoryQueue.length === 0) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    let syncedCount = 0;
    const remaining: QueuedMutation[] = [];

    for (const item of this.inMemoryQueue) {
      try {
        let success = true;
        if (syncHandler) {
          success = await syncHandler(item);
        }
        if (success) {
          syncedCount += 1;
        } else {
          item.retryCount += 1;
          remaining.push(item);
        }
      } catch {
        item.retryCount += 1;
        remaining.push(item);
      }
    }

    this.inMemoryQueue = remaining;
    this.saveToStorage();

    return {
      syncedCount,
      remainingCount: remaining.length,
    };
  }
}

export const mutationQueue = new MutationQueueManager();
