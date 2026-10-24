import express from 'express';
import cors from 'cors';
import { healthRouter } from './observability/health.js';
import { issueRouter } from './modules/issues/issue.router.js';
import { mediaRouter } from './modules/media/media.router.js';
import { geographyRouter } from './modules/geography/geography.router.js';
import { notificationRouter } from './modules/notifications/notification.router.js';
import { aiAuditRouter } from './modules/ai-audit/ai-audit.router.js';
import { fieldVerificationRouter } from './modules/field-verification/field-verification.router.js';

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
