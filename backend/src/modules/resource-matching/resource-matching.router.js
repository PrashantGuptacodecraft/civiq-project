/**
 * Disaster Need-to-Resource Matching REST Router
 * Phase 65: Build need-to-resource matching
 *
 * REST Endpoints:
 * - GET    /resource-matching/needs
 * - POST   /resource-matching/needs
 * - GET    /resource-matching/needs/:id
 * - GET    /resource-matching/needs/:id/matches
 * - POST   /resource-matching/needs/:id/match
 * - POST   /resource-matching/needs/:id/assign
 * - POST   /resource-matching/assignments/:id/fulfill
 * - POST   /resource-matching/assignments/:id/confirm
 * - GET    /resource-matching/assignments/:id
 */

import { Router } from 'express';
import { resourceMatchingService } from './resource-matching.service.js';

export const resourceMatchingRouter = Router();

// Helper to extract user context from headers or auth token
function getUserContext(req) {
  return {
    id: req.headers['x-user-id'] || 'usr-anonymous',
    role: req.headers['x-user-role'] || 'CITIZEN',
    jurisdictionId: req.headers['x-user-jurisdiction'] || 'mh-pune-pmc',
  };
}

// 1. List Need Requests
resourceMatchingRouter.get('/needs', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const filters = {
      jurisdictionId: req.query.jurisdictionId,
      status: req.query.status,
      needType: req.query.needType,
      disasterId: req.query.disasterId,
    };
    const result = await resourceMatchingService.listNeedRequests(filters, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 2. Create Need Request
resourceMatchingRouter.post('/needs', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const need = await resourceMatchingService.createNeedRequest(req.body, userContext);
    res.status(201).json(need);
  } catch (err) {
    next(err);
  }
});

// 3. Get Need Request By ID
resourceMatchingRouter.get('/needs/:id', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await resourceMatchingService.getNeedRequestById(req.params.id, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 4. Get or Compute Recommended Matches for a Need
resourceMatchingRouter.get('/needs/:id/matches', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const options = {
      maxDistanceKm: req.query.maxDistanceKm ? parseFloat(req.query.maxDistanceKm) : 50.0,
    };
    const result = await resourceMatchingService.getRecommendedMatches(req.params.id, options, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

resourceMatchingRouter.post('/needs/:id/match', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const options = {
      maxDistanceKm: req.body.maxDistanceKm ? parseFloat(req.body.maxDistanceKm) : 50.0,
    };
    const result = await resourceMatchingService.getRecommendedMatches(req.params.id, options, userContext);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 5. Authorized Coordinator Accepts Assignment
resourceMatchingRouter.post('/needs/:id/assign', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await resourceMatchingService.acceptAssignment(req.params.id, req.body, userContext);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 6. Fulfill Assignment
resourceMatchingRouter.post('/assignments/:id/fulfill', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await resourceMatchingService.fulfillAssignment(req.params.id, req.body, userContext);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 7. Confirm Assignment
resourceMatchingRouter.post('/assignments/:id/confirm', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const result = await resourceMatchingService.confirmAssignment(req.params.id, req.body, userContext);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 8. Get Assignment By ID
resourceMatchingRouter.get('/assignments/:id', async (req, res, next) => {
  try {
    const userContext = getUserContext(req);
    const asgn = await resourceMatchingService.getAssignmentById(req.params.id, userContext);
    res.json(asgn);
  } catch (err) {
    next(err);
  }
});
