/**
 * Unified Analytics Express Router
 * Phase 46 & 47: Hotspot Analytics & Recurring Issue Intelligence
 * Phase 57: Road-Safety Correlation Analytics
 */

import { Router } from 'express';
import { hotspotRouter } from './hotspots/hotspot.router.js';
import { recurrenceRouter } from './recurrence/recurrence.router.js';
import { safetyRouter } from './safety/safety.router.js';

export const analyticsRouter = Router();

analyticsRouter.use(hotspotRouter);
analyticsRouter.use(recurrenceRouter);
analyticsRouter.use(safetyRouter);
