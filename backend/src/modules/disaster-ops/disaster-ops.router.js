/**
 * Disaster Operations & Situation Room REST Router
 * Phase 66: Build disaster situation room and after-action review
 *
 * REST Endpoints:
 * - GET    /disaster-ops/situation-room/:disasterId
 * - GET    /disaster-ops/tasks
 * - POST   /disaster-ops/tasks
 * - PATCH  /disaster-ops/tasks/:id/status
 * - GET    /disaster-ops/timeline/:disasterId
 * - GET    /disaster-ops/metrics/:disasterId
 * - POST   /disaster-ops/aar/:disasterId/generate
 * - PUT    /disaster-ops/aar/:disasterId
 * - GET    /disaster-ops/aar/:disasterId
 */

import { Router } from 'express';
import { disasterOpsService } from './disaster-ops.service.js';

export const disasterOpsRouter = Router();

function getUserContext(req) {
  return {
    id: req.headers['x-user-id'] || 'usr-anonymous',
    role: req.headers['x-user-role'] || 'CITIZEN',
    jurisdictionId: req.headers['x-user-jurisdiction'] || 'mh-pune-pmc',
    name: req.headers['x-user-name'] || 'Duty Officer',
  };
}

// 1. Situation Room Command Payload
disasterOpsRouter.get('/situation-room/:disasterId', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const data = await disasterOpsService.getSituationRoomData(req.params.disasterId, userContext);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 2. Response Tasks List
disasterOpsRouter.get('/tasks', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const filters = {
      disasterId: req.query.disasterId,
      status: req.query.status,
      priority: req.query.priority,
      jurisdictionId: req.query.jurisdictionId,
    };
    const result = await disasterOpsService.listResponseTasks(filters, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 3. Create Response Task
disasterOpsRouter.post('/tasks', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const disasterId = req.body.disasterId || req.query.disasterId;
    if (!disasterId) {
      return res.status(400).json({ error: 'disasterId is required to create a response task.' });
    }
    const task = await disasterOpsService.createResponseTask(disasterId, req.body, userContext);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// 4. Update Task Status
disasterOpsRouter.patch('/tasks/:id/status', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const { status, notes } = req.body;
    const task = await disasterOpsService.updateResponseTaskStatus(req.params.id, status, notes, userContext);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// 5. Timeline Milestones
disasterOpsRouter.get('/timeline/:disasterId', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await disasterOpsService.getTimeline(req.params.disasterId, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 6. Post-Event & Operational Metrics
disasterOpsRouter.get('/metrics/:disasterId', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await disasterOpsService.computeMetrics(req.params.disasterId, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 7. AI-Assisted After-Action Review (Generate)
disasterOpsRouter.post('/aar/:disasterId/generate', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const aar = await disasterOpsService.generateAfterActionReview(req.params.disasterId, req.body, userContext);
    res.status(201).json(aar);
  } catch (err) {
    next(err);
  }
});

// 8. Save / Approve After-Action Review (Coordinator Sign-off)
disasterOpsRouter.put('/aar/:disasterId', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const aar = await disasterOpsService.saveAfterActionReview(req.params.disasterId, req.body, userContext);
    res.json(aar);
  } catch (err) {
    next(err);
  }
});

// 9. Get After-Action Review
disasterOpsRouter.get('/aar/:disasterId', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const aar = await disasterOpsService.getAfterActionReview(req.params.disasterId, userContext);
    res.json(aar);
  } catch (err) {
    next(err);
  }
});
