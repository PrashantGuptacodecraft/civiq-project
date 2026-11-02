/**
 * Offline Sync & Local Cache Strategy
 * Phase 69: Add offline field sync
 */

export const CACHE_STORAGE_KEYS = {
  TASKS: 'civiq_field_tasks_cache_v1',
  QUEUE: 'civiq_field_mutation_queue_v1',
  SYNC_META: 'civiq_field_sync_meta_v1',
};

export const SYNC_STATUS = {
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
};

export function isLocalStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Local Task Cache Manager
 * Provides instant offline access to tasks, versioning, and dirty tracking
 */
export class TaskCacheManager {
  constructor(storageKey = CACHE_STORAGE_KEYS.TASKS) {
    this.storageKey = storageKey;
    this.cache = new Map();
    this.lastSyncedAt = null;
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (!isLocalStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.cache = new Map(Object.entries(parsed.tasks || {}));
        this.lastSyncedAt = parsed.lastSyncedAt || null;
      }
    } catch {
      this.cache = new Map();
    }
  }

  saveToStorage() {
    if (!isLocalStorageAvailable()) return;
    try {
      const data = {
        lastSyncedAt: this.lastSyncedAt,
        tasks: Object.fromEntries(this.cache.entries()),
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Quota exceeded or private browsing
    }
  }

  getTask(taskId) {
    return this.cache.get(taskId) || null;
  }

  getAllTasks() {
    return Array.from(this.cache.values());
  }

  setTasks(taskList) {
    this.cache.clear();
    for (const t of taskList) {
      this.cache.set(t.id, t);
    }
    this.lastSyncedAt = new Date().toISOString();
    this.saveToStorage();
  }

  updateTaskLocally(taskId, patch) {
    const existing = this.cache.get(taskId);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      _isDirty: true,
      updatedAt: new Date().toISOString(),
    };
    this.cache.set(taskId, updated);
    this.saveToStorage();
    return updated;
  }

  clear() {
    this.cache.clear();
    this.lastSyncedAt = null;
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(this.storageKey);
    }
  }
}

/**
 * Generates client-side idempotency keys for field updates.
 */
export function generateIdempotencyKey(taskId, action) {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `idemp_${taskId}_${action.toLowerCase()}_${ts}_${rand}`;
}

/**
 * Offline Mutation Queue with Idempotency and Conflict Tracking
 */
export class OfflineMutationQueue {
  constructor(storageKey = CACHE_STORAGE_KEYS.QUEUE) {
    this.storageKey = storageKey;
    this.queue = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (!isLocalStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
  }

  saveToStorage() {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch {
      // Quota or disabled
    }
  }

  enqueue(taskId, action, payload = {}, baseVersion = 1) {
    const mutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: generateIdempotencyKey(taskId, action),
      taskId,
      action,
      payload,
      baseVersion,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };
    this.queue.push(mutation);
    this.saveToStorage();
    return mutation;
  }

  getQueue() {
    return [...this.queue];
  }

  getPendingCount() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Applies optimistic update to a task object.
   */
  applyOptimistic(task, action, payload) {
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
      case 'SUBMIT_EVIDENCE':
        if (payload.evidence) {
          const currentEv = updated.evidence ? [...updated.evidence] : [];
          currentEv.push(payload.evidence);
          updated.evidence = currentEv;
        }
        break;
      case 'RESOLVE_TASK':
        updated.status = 'RESOLVED';
        if (payload.resolutionNotes !== undefined) {
          updated.resolutionNotes = payload.resolutionNotes;
        }
        updated.resolvedAt = new Date().toISOString();
        break;
      case 'SUPERVISOR_REVIEW':
        if (payload.decision === 'APPROVED') {
          updated.status = 'RESOLVED';
          updated.verificationStatus = 'APPROVED';
        } else {
          updated.status = 'IN_PROGRESS';
          updated.verificationStatus = payload.decision;
          updated.rejectionReason = payload.rejectionReason;
        }
        break;
      default:
        Object.assign(updated, payload);
    }
    return updated;
  }

  /**
   * Dispatches pending mutations in batch to the server endpoint or provided handler.
   */
  async flush(dispatchFn) {
    if (this.queue.length === 0) {
      return { success: true, syncedCount: 0, remainingCount: 0, results: [] };
    }

    const mutationsToSync = [...this.queue];
    try {
      const response = await dispatchFn(mutationsToSync);
      if (response && response.success) {
        // Clear successfully processed mutations
        this.queue = [];
        this.saveToStorage();
        return {
          success: true,
          syncedCount: mutationsToSync.length,
          remainingCount: 0,
          results: response.results || [],
        };
      } else {
        // Increment retry count
        this.queue.forEach((m) => (m.retryCount += 1));
        this.saveToStorage();
        return {
          success: false,
          syncedCount: 0,
          remainingCount: this.queue.length,
          error: response?.error || 'Sync batch rejected',
        };
      }
    } catch (err) {
      this.queue.forEach((m) => (m.retryCount += 1));
      this.saveToStorage();
      return {
        success: false,
        syncedCount: 0,
        remainingCount: this.queue.length,
        error: err.message,
      };
    }
  }
}

export const taskCache = new TaskCacheManager();
export const mutationQueueManager = new OfflineMutationQueue();
