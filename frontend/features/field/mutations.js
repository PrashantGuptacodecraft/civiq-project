const QUEUE_STORAGE_KEY = 'civiq_field_mutation_queue_v1';
export function generateIdempotencyKey(taskId, action) {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 6);
    return `mut_${taskId}_${action.toLowerCase()}_${ts}_${rand}`;
}
export class MutationQueueManager {
    inMemoryQueue = [];
    constructor() {
        this.loadFromStorage();
    }
    isStorageAvailable() {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    }
    loadFromStorage() {
        if (!this.isStorageAvailable())
            return;
        try {
            const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
            if (raw) {
                this.inMemoryQueue = JSON.parse(raw);
            }
        }
        catch {
            this.inMemoryQueue = [];
        }
    }
    saveToStorage() {
        if (!this.isStorageAvailable())
            return;
        try {
            window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.inMemoryQueue));
        }
        catch {
            // Storage quota or disabled
        }
    }
    enqueue(taskId, action, payload) {
        const mutation = {
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
    getQueue() {
        return [...this.inMemoryQueue];
    }
    remove(mutationId) {
        this.inMemoryQueue = this.inMemoryQueue.filter((m) => m.id !== mutationId);
        this.saveToStorage();
    }
    clear() {
        this.inMemoryQueue = [];
        this.saveToStorage();
    }
    /**
     * Applies an optimistic state update to a task locally before server confirmation.
     */
    applyOptimisticUpdate(task, action, payload) {
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
    async syncQueue(syncHandler) {
        if (this.inMemoryQueue.length === 0) {
            return { syncedCount: 0, remainingCount: 0 };
        }
        let syncedCount = 0;
        const remaining = [];
        for (const item of this.inMemoryQueue) {
            try {
                let success = true;
                if (syncHandler) {
                    success = await syncHandler(item);
                }
                if (success) {
                    syncedCount += 1;
                }
                else {
                    item.retryCount += 1;
                    remaining.push(item);
                }
            }
            catch {
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
