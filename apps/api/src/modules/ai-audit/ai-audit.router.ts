import { Router, Request, Response, NextFunction } from 'express';
import { aiAuditService } from './ai-audit.service';
import { AiAuditOperation, AiHumanDecisionType } from './ai-audit.types';

export const aiAuditRouter: Router = Router();

/**
 * GET /ai-audit/admin/comparison
 * Admin view comparing AI recommendations against final human decisions.
 */
aiAuditRouter.get(
  '/admin/comparison',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const operation = req.query.operation as AiAuditOperation | undefined;
      const humanDecision = req.query.humanDecision as AiHumanDecisionType | undefined;
      const modelName = req.query.modelName as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const summary = await aiAuditService.getAdminComparisonView({
        operation,
        humanDecision,
        modelName,
        startDate,
        endDate,
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /ai-audit/records
 * Query AI audit records.
 */
aiAuditRouter.get(
  '/records',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const operation = req.query.operation as AiAuditOperation | undefined;
      const humanDecision = req.query.humanDecision as AiHumanDecisionType | undefined;
      const modelName = req.query.modelName as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const summary = await aiAuditService.getAdminComparisonView({
        operation,
        humanDecision,
        modelName,
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: summary.records,
        total: summary.totalInferences,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /ai-audit/records/:id
 * Retrieve a specific AI audit record by ID.
 */
aiAuditRouter.get(
  '/records/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recordId = String(req.params.id);
      const record = await aiAuditService.getRecordById(recordId);
      if (!record) {
        res.status(404).json({
          success: false,
          error: `AI audit record '${recordId}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /ai-audit/records/:id/decision
 * Record human review decision for an AI inference.
 */
aiAuditRouter.post(
  '/records/:id/decision',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recordId = String(req.params.id);
      const { decision, reviewerId, notes, overrideReason, finalOutcome } = req.body;

      if (!decision || !reviewerId) {
        res.status(400).json({
          success: false,
          error: 'Fields decision and reviewerId are required.',
        });
        return;
      }

      const updated = await aiAuditService.recordHumanDecision({
        auditRecordId: recordId,
        decision,
        reviewerId,
        notes,
        overrideReason,
        finalOutcome,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `AI audit record '${recordId}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /ai-audit/records/:id/evaluation
 * Retrieve evaluation metrics comparing AI recommendation vs final decision.
 */
aiAuditRouter.get(
  '/records/:id/evaluation',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recordId = String(req.params.id);
      const evalRecord = await aiAuditService.createEvaluationRecord(recordId);
      if (!evalRecord) {
        res.status(404).json({
          success: false,
          error: `AI audit record '${recordId}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: evalRecord,
      });
    } catch (err) {
      next(err);
    }
  }
);
