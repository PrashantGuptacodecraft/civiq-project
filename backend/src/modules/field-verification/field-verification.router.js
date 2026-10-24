import { Router } from 'express';
import { fieldVerificationService } from './field-verification.service.js';

export const fieldVerificationRouter = Router();

/**
 * Upload and bind evidence (BEFORE/AFTER photo proof) to a field task assignment.
 */
fieldVerificationRouter.post('/evidence', (req, res) => {
  try {
    const {
      assignmentId,
      issueId,
      workerId,
      proofType,
      mediaUrl,
      taskLocation,
      capturedLocation,
      capturedAt,
      categoryId,
      notes,
    } = req.body;

    if (!assignmentId || !workerId || !proofType || !mediaUrl) {
      return res.status(400).json({
        error: 'Missing required parameters: assignmentId, workerId, proofType, mediaUrl',
      });
    }

    const record = fieldVerificationService.submitEvidence({
      assignmentId,
      issueId,
      workerId,
      proofType,
      mediaUrl,
      taskLocation,
      capturedLocation,
      capturedAt,
      categoryId,
      notes,
    });

    res.status(201).json({
      success: true,
      evidence: record,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Retrieve the complete evidence chain and verification audit trail for an assignment.
 */
fieldVerificationRouter.get('/:assignmentId/chain', (req, res) => {
  const { assignmentId } = req.params;
  const chain = fieldVerificationService.getEvidenceChain(assignmentId);
  res.status(200).json(chain);
});

/**
 * Validate and submit task for supervisor completion review.
 */
fieldVerificationRouter.post('/:assignmentId/completion', (req, res) => {
  const { assignmentId } = req.params;
  const { categoryId, taskLocation, workerNotes } = req.body;

  const result = fieldVerificationService.submitTaskForCompletion({
    assignmentId,
    categoryId,
    taskLocation,
    workerNotes,
  });

  if (!result.success) {
    return res.status(422).json(result);
  }

  res.status(200).json(result);
});

/**
 * Supervisor review endpoint (Approve, Reject, or Reopen).
 */
fieldVerificationRouter.post('/:assignmentId/review', (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      supervisorId,
      supervisorRole,
      decision,
      rejectionReason,
      feedback,
    } = req.body;

    if (!supervisorId || !supervisorRole || !decision) {
      return res.status(400).json({
        error: 'Missing required parameters: supervisorId, supervisorRole, decision',
      });
    }

    const result = fieldVerificationService.supervisorReview({
      assignmentId,
      supervisorId,
      supervisorRole,
      decision,
      rejectionReason,
      feedback,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Retrieve configurable evidence requirements for a given category.
 */
fieldVerificationRouter.get('/policy/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const policy = fieldVerificationService.getPolicy(categoryId);
  res.status(200).json({ categoryId, policy });
});
