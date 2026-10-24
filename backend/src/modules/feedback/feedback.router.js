import { Router } from 'express';
import { feedbackService } from './feedback.service.js';

export const feedbackRouter = Router();

/**
 * Submit citizen resolution review (Confirm or Reopen).
 */
feedbackRouter.post('/reviews', async (req, res) => {
  try {
    const {
      issueId,
      citizenId,
      decision,
      rating,
      reopenReason,
      feedbackComments,
      evidenceUrls,
      departmentId,
      categoryId,
    } = req.body;

    if (!issueId || !citizenId || !decision) {
      return res.status(400).json({
        error: 'Missing required parameters: issueId, citizenId, decision',
      });
    }

    const result = await feedbackService.submitCitizenReview({
      issueId,
      citizenId,
      decision,
      rating,
      reopenReason,
      feedbackComments,
      evidenceUrls,
      departmentId,
      categoryId,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get citizen resolution review status for an issue.
 */
feedbackRouter.get('/issues/:issueId', (req, res) => {
  const { issueId } = req.params;
  const review = feedbackService.getReviewForIssue(issueId);
  if (!review) {
    return res.status(404).json({ error: 'No citizen review found for this issue.' });
  }
  res.status(200).json(review);
});

/**
 * Get resolution quality metrics (confirmation rate, reopen rate, ratings).
 */
feedbackRouter.get('/metrics', (req, res) => {
  const { departmentId, categoryId } = req.query;
  const metrics = feedbackService.getQualityMetrics({
    departmentId: departmentId ? String(departmentId) : undefined,
    categoryId: categoryId ? String(categoryId) : undefined,
  });
  res.status(200).json(metrics);
});

/**
 * Notify citizen of proposed resolution.
 */
feedbackRouter.post('/notify-resolution', async (req, res) => {
  try {
    const { issueId, citizenId, citizenEmail, issueTitle, proposedBy } = req.body;

    if (!issueId || !citizenId) {
      return res.status(400).json({
        error: 'Missing required parameters: issueId, citizenId',
      });
    }

    const notification = await feedbackService.notifyCitizenOfProposedResolution({
      issueId,
      citizenId,
      citizenEmail,
      issueTitle,
      proposedBy,
    });

    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
