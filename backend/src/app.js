import express from 'express';
import cors from 'cors';
import { healthRouter } from './observability/health.js';
import { issueRouter } from './modules/issues/issue.router.js';
import { mediaRouter } from './modules/media/media.router.js';
import { geographyRouter } from './modules/geography/geography.router.js';
import { notificationRouter } from './modules/notifications/notification.router.js';
import { aiAuditRouter } from './modules/ai-audit/ai-audit.router.js';
import { fieldVerificationRouter } from './modules/field-verification/field-verification.router.js';
import { feedbackRouter } from './modules/feedback/feedback.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
import { analyticsRouter } from './modules/analytics/analytics.router.js';
import { reportRouter } from './modules/reports/report.router.js';
import { assetRouter } from './modules/assets/asset.router.js';
import { assetLinkRouter } from './modules/assets-links/asset-link.router.js';
import { maintenanceRouter } from './modules/maintenance/maintenance.router.js';
import { assetDecisionRouter } from './modules/asset-decisions/asset-decision.router.js';
import { incidentRouter } from './modules/incidents/incident.router.js';
import { incidentSourceRouter } from './integrations/incident-source/index.js';
import { responderRouter } from './modules/responders/index.js';
import { communicationRouter } from './modules/communications/index.js';
import { disasterRouter } from './modules/disasters/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Observability & Health
  app.use('/', healthRouter);

  // API Modules
  app.use('/issues', issueRouter);
  app.use('/media', mediaRouter);
  app.use('/geography', geographyRouter);
  app.use('/notifications', notificationRouter);
  app.use('/ai-audit', aiAuditRouter);
  app.use('/field-verification', fieldVerificationRouter);
  app.use('/feedback', feedbackRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/analytics', analyticsRouter);
  app.use('/reports', reportRouter);
  app.use('/assets', assetRouter);
  app.use('/assets-links', assetLinkRouter);
  app.use('/maintenance', maintenanceRouter);
  app.use('/asset-decisions', assetDecisionRouter);
  app.use('/incidents', incidentRouter);
  app.use('/integrations/incident-source', incidentSourceRouter);
  app.use('/responders', responderRouter);
  app.use('/communications', communicationRouter);
  app.use('/disasters', disasterRouter);

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled API error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}

export const app = createApp();
