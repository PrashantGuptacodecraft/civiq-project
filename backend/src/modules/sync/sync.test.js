import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { syncService } from './sync.service.js';
import {
  SYNC_CONFLICT_RESOLUTION,
  SYNC_ITEM_STATUS,
  SYNC_MUTATION_ACTIONS,
} from './sync.types.js';

describe('Phase 69: Offline Field Sync & Conflict Strategy', () => {
  beforeEach(() => {
    syncService.reset();
  });

  describe('Local Task Delta Retrieval (GET /sync/tasks)', () => {
    it('returns seed tasks for assigned worker', async () => {
      const res = await request(app)
        .get('/sync/tasks?workerId=wrk_991')
        .expect(200);

      expect(res.body.success).toBeUndefined();
      expect(res.body.tasks).toBeDefined();
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.length).toBeGreaterThan(0);
      expect(res.body.serverTime).toBeDefined();

      const task = res.body.tasks[0];
      expect(task.assignedWorkerId).toBe('wrk_991');
      expect(task.version).toBeGreaterThanOrEqual(1);
    });

    it('filters tasks modified since timestamp', async () => {
      const since = '2026-03-01T08:15:00.000Z';
      const res = await request(app)
        .get(`/sync/tasks?workerId=wrk_991&since=${encodeURIComponent(since)}`)
        .expect(200);

      expect(res.body.tasks.length).toBe(2);
      res.body.tasks.forEach((t) => {
        expect(new Date(t.updatedAt).getTime()).toBeGreaterThan(new Date(since).getTime());
      });
    });
  });

  describe('Batch Sync & Idempotency Controls (POST /sync/batch)', () => {
    it('applies queued mutations sequentially with idempotency keys', async () => {
      const mutation = {
        id: 'mut_test_1',
        idempotencyKey: 'idemp_key_101_start',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.START_PROGRESS,
        payload: { status: 'IN_PROGRESS' },
        queuedAt: '2026-03-01T10:00:00.000Z',
        baseVersion: 1,
      };

      const res = await request(app)
        .post('/sync/batch')
        .set('x-worker-id', 'wrk_991')
        .send({ mutations: [mutation] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.appliedCount).toBe(1);
      expect(res.body.results[0].status).toBe(SYNC_ITEM_STATUS.APPLIED);
      expect(res.body.results[0].task.status).toBe('IN_PROGRESS');
      expect(res.body.results[0].task.version).toBe(2);

      // Verify audit history records workerId
      expect(syncService.syncHistory.length).toBe(1);
      expect(syncService.syncHistory[0].workerId).toBe('wrk_991');
    });

    it('safely handles duplicate mutation replays using idempotency keys without duplicate mutation execution', async () => {
      const mutation = {
        id: 'mut_test_2',
        idempotencyKey: 'idemp_key_duplicate_check',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.UPDATE_NOTES,
        payload: { notes: 'Material arrived on site' },
        queuedAt: '2026-03-01T10:05:00.000Z',
        baseVersion: 1,
      };

      // First run
      const firstRes = await request(app)
        .post('/sync/batch')
        .send({ mutations: [mutation] })
        .expect(200);
      expect(firstRes.body.appliedCount).toBe(1);
      expect(firstRes.body.duplicateCount).toBe(0);

      // Replay identical mutation
      const replayRes = await request(app)
        .post('/sync/batch')
        .send({ mutations: [mutation] })
        .expect(200);

      expect(replayRes.body.duplicateCount).toBe(1);
      expect(replayRes.body.results[0].status).toBe(SYNC_ITEM_STATUS.ALREADY_PROCESSED);
      expect(replayRes.body.results[0].task.notes).toBe('Material arrived on site');
    });

    it('rejects mutations missing idempotency keys', async () => {
      const invalidMutation = {
        id: 'mut_invalid',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.START_PROGRESS,
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({ mutations: [invalidMutation] })
        .expect(200);

      expect(res.body.results[0].status).toBe(SYNC_ITEM_STATUS.REJECTED);
      expect(res.body.results[0].error).toMatch(/Missing required idempotencyKey/i);
    });

    it('rejects mutations missing required taskId', async () => {
      const missingTaskMutation = {
        id: 'mut_no_task',
        idempotencyKey: 'idemp_no_task_1',
        action: SYNC_MUTATION_ACTIONS.START_PROGRESS,
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({ mutations: [missingTaskMutation] })
        .expect(200);

      expect(res.body.results[0].status).toBe(SYNC_ITEM_STATUS.REJECTED);
      expect(res.body.results[0].error).toMatch(/Missing required taskId/i);
    });
  });

  describe('Sync Conflict Strategy & Resolution', () => {
    it('resolves conflicts using LATEST_TIMESTAMP_WINS when client timestamp is newer', async () => {
      // Modify server task first so version increments to 2
      const serverTask = syncService.tasks.get('tsk_field_101');
      serverTask.version = 2;
      serverTask.updatedAt = '2026-03-01T09:00:00.000Z';
      serverTask.notes = 'Server updated note';

      // Client had baseVersion 1, but updated offline at 10:00:00 (newer)
      const clientMutation = {
        id: 'mut_conflict_1',
        idempotencyKey: 'idemp_key_conflict_newer',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.UPDATE_NOTES,
        payload: { notes: 'Offline field note from worker' },
        queuedAt: '2026-03-01T10:00:00.000Z',
        baseVersion: 1, // outdated base version triggers conflict check
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({
          mutations: [clientMutation],
          conflictStrategy: SYNC_CONFLICT_RESOLUTION.LATEST_TIMESTAMP_WINS,
        })
        .expect(200);

      expect(res.body.conflictCount).toBe(1);
      const result = res.body.results[0];
      expect(result.status).toBe(SYNC_ITEM_STATUS.CONFLICT_RESOLVED);
      expect(result.conflict.chosen).toBe('client');
      expect(result.task.notes).toBe('Offline field note from worker');
    });

    it('resolves conflicts with SERVER_WINS when specified', async () => {
      const serverTask = syncService.tasks.get('tsk_field_101');
      serverTask.version = 2;
      serverTask.notes = 'Server authoritative note';

      const clientMutation = {
        id: 'mut_conflict_2',
        idempotencyKey: 'idemp_key_conflict_server_wins',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.UPDATE_NOTES,
        payload: { notes: 'Client conflicting note' },
        queuedAt: '2026-03-01T11:00:00.000Z',
        baseVersion: 1,
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({
          mutations: [clientMutation],
          conflictStrategy: SYNC_CONFLICT_RESOLUTION.SERVER_WINS,
        })
        .expect(200);

      expect(res.body.conflictCount).toBe(1);
      const result = res.body.results[0];
      expect(result.status).toBe(SYNC_ITEM_STATUS.CONFLICT_RESOLVED);
      expect(result.conflict.chosen).toBe('server');
      expect(result.task.notes).toBe('Server authoritative note');
    });

    it('resolves conflicts with CLIENT_WINS when specified', async () => {
      const serverTask = syncService.tasks.get('tsk_field_101');
      serverTask.version = 2;
      serverTask.notes = 'Server note to override';

      const clientMutation = {
        id: 'mut_conflict_client_wins',
        idempotencyKey: 'idemp_key_client_wins_force',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.UPDATE_NOTES,
        payload: { notes: 'Client forced override note' },
        queuedAt: '2026-03-01T08:30:00.000Z', // Even if timestamp is older
        baseVersion: 1,
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({
          mutations: [clientMutation],
          conflictStrategy: SYNC_CONFLICT_RESOLUTION.CLIENT_WINS,
        })
        .expect(200);

      expect(res.body.conflictCount).toBe(1);
      const result = res.body.results[0];
      expect(result.status).toBe(SYNC_ITEM_STATUS.CONFLICT_RESOLVED);
      expect(result.conflict.chosen).toBe('client');
      expect(result.task.notes).toBe('Client forced override note');
      expect(result.task.version).toBe(3);
    });

    it('resolves conflicts with MERGE preserving non-conflicting mutation fields', async () => {
      const serverTask = syncService.tasks.get('tsk_field_101');
      serverTask.version = 2;
      serverTask.notes = 'Server updated priority dispatch note';

      const clientMutation = {
        id: 'mut_conflict_merge',
        idempotencyKey: 'idemp_key_merge_evidence',
        taskId: 'tsk_field_101',
        action: SYNC_MUTATION_ACTIONS.SUBMIT_EVIDENCE,
        payload: {
          evidence: {
            id: 'ev_merge_1',
            proofType: 'BEFORE',
            mediaUrl: 'https://civiq.in/img_pothole_before.jpg',
          },
        },
        queuedAt: '2026-03-01T09:10:00.000Z',
        baseVersion: 1,
      };

      const res = await request(app)
        .post('/sync/batch')
        .send({
          mutations: [clientMutation],
          conflictStrategy: SYNC_CONFLICT_RESOLUTION.MERGE,
        })
        .expect(200);

      expect(res.body.conflictCount).toBe(1);
      const result = res.body.results[0];
      expect(result.status).toBe(SYNC_ITEM_STATUS.CONFLICT_RESOLVED);
      expect(result.conflict.chosen).toBe('merge');
      // Server note preserved
      expect(result.task.notes).toBe('Server updated priority dispatch note');
      // Client evidence merged
      expect(result.task.evidence).toHaveLength(1);
      expect(result.task.evidence[0].id).toBe('ev_merge_1');
      expect(result.task.version).toBe(3);
    });
  });
});
