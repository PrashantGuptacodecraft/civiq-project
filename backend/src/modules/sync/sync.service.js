/**
 * Offline Sync Service
 * Phase 69: Add offline field sync
 *
 * Implements:
 * - Server-side mutation processing queue with idempotency keys
 * - Task synchronization and delta queries for field workers
 * - Configurable sync conflict resolution strategy (LATEST_TIMESTAMP_WINS / CLIENT_WINS / SERVER_WINS / MERGE)
 * - Safe optimistic reconciliation
 */

import {
  SYNC_CONFLICT_RESOLUTION,
  SYNC_MUTATION_ACTIONS,
  SYNC_ITEM_STATUS,
} from './sync.types.js';

export class SyncService {
  constructor() {
    // Processed idempotency keys: idempotencyKey -> { appliedAt, result, mutationId }
    this.processedIdempotencyKeys = new Map();

    // Server-side task store for sync simulation / offline field operations
    this.tasks = new Map();

    // Audit trail of synced mutations
    this.syncHistory = [];

    this._seedInitialTasks();
  }

  _seedInitialTasks() {
    const seedTasks = [
      {
        id: 'tsk_field_101',
        issueId: 'iss_delhi_pothole_881',
        title: 'Deep Pothole Repair on Ring Road Lajpat Nagar',
        category: 'Pothole',
        priority: 'CRITICAL',
        status: 'ASSIGNED',
        assignedWorkerId: 'wrk_991',
        workerName: 'Rajesh Sharma',
        jurisdictionId: 'jur_delhi_south',
        address: 'Near Metro Pillar 42, Lajpat Nagar, New Delhi',
        coordinates: { latitude: 28.5672, longitude: 77.2435 },
        notes: 'Citizen reported multiple two-wheelers skidding.',
        version: 1,
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'tsk_field_102',
        issueId: 'iss_delhi_water_902',
        title: 'Main Pipeline Valve Burst - Block C Green Park',
        category: 'Water Leakage',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedWorkerId: 'wrk_991',
        workerName: 'Rajesh Sharma',
        jurisdictionId: 'jur_delhi_south',
        address: 'Opposite Community Center, Green Park Main, New Delhi',
        coordinates: { latitude: 28.5589, longitude: 77.2025 },
        notes: 'Water supply department notified.',
        version: 1,
        updatedAt: '2026-03-01T08:30:00.000Z',
      },
      {
        id: 'tsk_field_103',
        issueId: 'iss_delhi_light_411',
        title: 'Streetlight Pole Short Circuit at Defence Colony Flyover',
        category: 'Streetlight',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        assignedWorkerId: 'wrk_991',
        workerName: 'Rajesh Sharma',
        jurisdictionId: 'jur_delhi_south',
        address: 'Defence Colony Flyover Loop, New Delhi',
        coordinates: { latitude: 28.5721, longitude: 77.2341 },
        notes: 'Replaced halogen lamp and fuse.',
        version: 2,
        updatedAt: '2026-03-01T09:15:00.000Z',
      },
    ];

    for (const t of seedTasks) {
      this.tasks.set(t.id, t);
    }
  }

  /**
   * Resets internal maps (used for test isolation).
   */
  reset() {
    this.processedIdempotencyKeys.clear();
    this.tasks.clear();
    this.syncHistory = [];
    this._seedInitialTasks();
  }

  /**
   * Returns all active tasks or changes since a timestamp for a worker/jurisdiction.
   */
  async getTasksForWorker({ workerId, jurisdictionId, since }) {
    let list = Array.from(this.tasks.values());

    if (workerId) {
      list = list.filter((t) => t.assignedWorkerId === workerId);
    } else if (jurisdictionId) {
      list = list.filter((t) => t.jurisdictionId === jurisdictionId);
    }

    if (since) {
      const sinceDate = new Date(since).getTime();
      list = list.filter((t) => new Date(t.updatedAt).getTime() > sinceDate);
    }

    return {
      tasks: list,
      serverTime: new Date().toISOString(),
      count: list.length,
    };
  }

  /**
   * Processes a batch of queued mutations from an offline field client.
   *
   * @param {Object} params
   * @param {Array} params.mutations - Array of mutation objects from client queue
   * @param {string} [params.conflictStrategy] - SYNC_CONFLICT_RESOLUTION strategy
   * @param {Object} [params.userContext] - authenticated worker details
   */
  async processBatchSync({
    mutations = [],
    conflictStrategy = SYNC_CONFLICT_RESOLUTION.LATEST_TIMESTAMP_WINS,
    userContext = null,
  }) {
    const results = [];
    let appliedCount = 0;
    let duplicateCount = 0;
    let conflictCount = 0;

    for (const mutation of mutations) {
      if (!mutation || typeof mutation !== 'object') {
        results.push({
          status: SYNC_ITEM_STATUS.REJECTED,
          error: 'Invalid mutation object',
        });
        continue;
      }

      const { id, idempotencyKey, taskId, action, payload, queuedAt, baseVersion } = mutation;

      if (!idempotencyKey) {
        results.push({
          mutationId: id,
          status: SYNC_ITEM_STATUS.REJECTED,
          error: 'Missing required idempotencyKey',
        });
        continue;
      }

      if (!taskId) {
        results.push({
          mutationId: id,
          idempotencyKey,
          status: SYNC_ITEM_STATUS.REJECTED,
          error: 'Missing required taskId',
        });
        continue;
      }

      // Check idempotency: Return previously recorded response if already processed
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        duplicateCount++;
        const record = this.processedIdempotencyKeys.get(idempotencyKey);
        results.push({
          mutationId: id,
          idempotencyKey,
          status: SYNC_ITEM_STATUS.ALREADY_PROCESSED,
          task: record.resultingTask,
          appliedAt: record.appliedAt,
          message: 'Mutation already applied; returning cached state',
        });
        continue;
      }

      const existingTask = this.tasks.get(taskId);
      if (!existingTask) {
        results.push({
          mutationId: id,
          idempotencyKey,
          taskId,
          status: SYNC_ITEM_STATUS.REJECTED,
          error: `Task '${taskId}' not found on server`,
        });
        continue;
      }

      // Conflict detection: If task was updated on server after client's base version or queued time
      const serverUpdatedAt = new Date(existingTask.updatedAt).getTime();
      const clientTimestamp = queuedAt ? new Date(queuedAt).getTime() : Date.now();
      const hasConflict = baseVersion !== undefined && baseVersion < existingTask.version;

      let finalTask = { ...existingTask };
      let resolutionStatus = SYNC_ITEM_STATUS.APPLIED;
      let conflictInfo = null;

      if (hasConflict) {
        conflictCount++;
        if (conflictStrategy === SYNC_CONFLICT_RESOLUTION.SERVER_WINS) {
          resolutionStatus = SYNC_ITEM_STATUS.CONFLICT_RESOLVED;
          conflictInfo = {
            strategy: SYNC_CONFLICT_RESOLUTION.SERVER_WINS,
            chosen: 'server',
            serverVersion: existingTask.version,
          };
        } else if (conflictStrategy === SYNC_CONFLICT_RESOLUTION.CLIENT_WINS) {
          finalTask = this._applyMutation(existingTask, action, payload, clientTimestamp);
          finalTask.version = existingTask.version + 1;
          resolutionStatus = SYNC_ITEM_STATUS.CONFLICT_RESOLVED;
          appliedCount++;
          conflictInfo = {
            strategy: SYNC_CONFLICT_RESOLUTION.CLIENT_WINS,
            chosen: 'client',
            newVersion: finalTask.version,
          };
        } else if (conflictStrategy === SYNC_CONFLICT_RESOLUTION.MERGE) {
          finalTask = this._applyMutation(existingTask, action, payload, clientTimestamp);
          finalTask.version = existingTask.version + 1;
          resolutionStatus = SYNC_ITEM_STATUS.CONFLICT_RESOLVED;
          appliedCount++;
          conflictInfo = {
            strategy: SYNC_CONFLICT_RESOLUTION.MERGE,
            chosen: 'merge',
            mergedFields: Object.keys(payload || {}),
            newVersion: finalTask.version,
          };
        } else {
          // Default: LATEST_TIMESTAMP_WINS
          if (clientTimestamp >= serverUpdatedAt) {
            finalTask = this._applyMutation(existingTask, action, payload, clientTimestamp);
            finalTask.version = existingTask.version + 1;
            appliedCount++;
            conflictInfo = {
              strategy: SYNC_CONFLICT_RESOLUTION.LATEST_TIMESTAMP_WINS,
              chosen: 'client',
              reason: 'Client update has newer or equal timestamp',
              newVersion: finalTask.version,
            };
          } else {
            conflictInfo = {
              strategy: SYNC_CONFLICT_RESOLUTION.LATEST_TIMESTAMP_WINS,
              chosen: 'server',
              reason: 'Server state is newer than client offline timestamp',
              currentVersion: existingTask.version,
            };
          }
          resolutionStatus = SYNC_ITEM_STATUS.CONFLICT_RESOLVED;
        }
      } else {
        // No conflict, straightforward apply
        finalTask = this._applyMutation(existingTask, action, payload, clientTimestamp);
        finalTask.version = (existingTask.version || 1) + 1;
        appliedCount++;
      }

      // Save updated task
      this.tasks.set(taskId, finalTask);

      // Record idempotency receipt
      const receipt = {
        mutationId: id,
        idempotencyKey,
        appliedAt: new Date().toISOString(),
        resultingTask: finalTask,
        action,
      };
      this.processedIdempotencyKeys.set(idempotencyKey, receipt);

      // Record audit history
      this.syncHistory.push({
        idempotencyKey,
        taskId,
        action,
        workerId: userContext?.workerId || 'unknown',
        timestamp: receipt.appliedAt,
        status: resolutionStatus,
        conflictInfo,
      });

      results.push({
        mutationId: id,
        idempotencyKey,
        taskId,
        status: resolutionStatus,
        conflict: conflictInfo,
        task: finalTask,
      });
    }

    return {
      success: true,
      appliedCount,
      duplicateCount,
      conflictCount,
      totalProcessed: mutations.length,
      serverTime: new Date().toISOString(),
      results,
    };
  }

  _applyMutation(task, action, payload = {}, timestamp) {
    const updated = {
      ...task,
      updatedAt: new Date(timestamp || Date.now()).toISOString(),
    };

    switch (action) {
      case SYNC_MUTATION_ACTIONS.START_PROGRESS:
        updated.status = 'IN_PROGRESS';
        break;

      case SYNC_MUTATION_ACTIONS.UPDATE_NOTES:
        if (payload.notes !== undefined) {
          updated.notes = payload.notes;
        }
        break;

      case SYNC_MUTATION_ACTIONS.SUBMIT_EVIDENCE:
        if (payload.evidence) {
          const evList = updated.evidence ? [...updated.evidence] : [];
          evList.push({
            ...payload.evidence,
            syncedAt: new Date().toISOString(),
          });
          updated.evidence = evList;
        }
        break;

      case SYNC_MUTATION_ACTIONS.RESOLVE_TASK:
        updated.status = 'RESOLVED';
        if (payload.resolutionNotes !== undefined) {
          updated.resolutionNotes = payload.resolutionNotes;
        }
        updated.resolvedAt = updated.updatedAt;
        break;

      case SYNC_MUTATION_ACTIONS.SUPERVISOR_REVIEW:
        if (payload.decision === 'APPROVED') {
          updated.status = 'RESOLVED';
          updated.verificationStatus = 'APPROVED';
        } else {
          updated.status = 'IN_PROGRESS';
          updated.verificationStatus = payload.decision || 'REJECTED';
          updated.rejectionReason = payload.rejectionReason || null;
        }
        break;

      default:
        // Generic merge
        Object.assign(updated, payload);
        break;
    }

    return updated;
  }
}

export const syncService = new SyncService();
