import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { FeedbackService } from './feedback.service.js';
import { CitizenReviewDecision } from './feedback.types.js';

describe('Citizen Resolution Verification & Feedback (Phase 43)', () => {
  let service;
  let app;

  beforeEach(() => {
    service = new FeedbackService();
    app = createApp();
  });

  describe('Citizen Notification of Proposed Resolution', () => {
    it('notifies citizen when resolution is proposed with review URL', async () => {
      const notification = await service.notifyCitizenOfProposedResolution({
        issueId: 'issue-401',
        citizenId: 'citizen-priya',
        citizenEmail: 'priya@example.in',
        issueTitle: 'Deep road pothole on Mall Road',
        proposedBy: 'Field Worker Rajesh Kumar',
      });

      expect(notification.id).toBeDefined();
      expect(notification.issueId).toBe('issue-401');
      expect(notification.citizenId).toBe('citizen-priya');
      expect(notification.reviewUrl).toBe('/resolution-review?issueId=issue-401');
      expect(notification.status).toBe('SENT');
    });
  });

  describe('Citizen Review Flow: Confirmation', () => {
    it('confirms resolution, closes issue, and updates quality metrics', async () => {
      const result = await service.submitCitizenReview({
        issueId: 'issue-401',
        citizenId: 'citizen-priya',
        decision: CitizenReviewDecision.CONFIRMED,
        rating: 5,
        feedbackComments: 'Pothole completely filled and road is smooth. Great job!',
        departmentId: 'dept-pwd-north',
        categoryId: 'roads_pothole',
      });

      expect(result.success).toBe(true);
      expect(result.outcome).toBe('CONFIRMED');
      expect(result.newIssueStatus).toBe('CLOSED');
      expect(result.review.rating).toBe(5);

      // Verify review retrieval
      const review = service.getReviewForIssue('issue-401');
      expect(review).toBeDefined();
      expect(review.decision).toBe('CONFIRMED');

      // Verify metrics
      const metrics = service.getQualityMetrics();
      expect(metrics.totalReviews).toBe(1);
      expect(metrics.confirmedCount).toBe(1);
      expect(metrics.reopenedCount).toBe(0);
      expect(metrics.confirmationRate).toBe(100);
      expect(metrics.averageRating).toBe(5.0);
    });
  });

  describe('Citizen Review Flow: Reopen / Rejection', () => {
    it('requires a mandatory reason when citizen reopens an issue', async () => {
      await expect(
        service.submitCitizenReview({
          issueId: 'issue-402',
          citizenId: 'citizen-amit',
          decision: CitizenReviewDecision.REOPENED,
          reopenReason: '', // Empty reason should fail
        })
      ).rejects.toThrow(/valid reason is required/);
    });

    it('reopens issue with reason and optional photo evidence', async () => {
      const result = await service.submitCitizenReview({
        issueId: 'issue-402',
        citizenId: 'citizen-amit',
        decision: CitizenReviewDecision.REOPENED,
        reopenReason: 'Loose gravel remains; water is still seeping from pipe joint.',
        evidenceUrls: ['https://storage.civiq.in/citizen-counter/photo-402.jpg'],
        departmentId: 'dept-djb-north',
        categoryId: 'water_pipeline_leak',
      });

      expect(result.success).toBe(true);
      expect(result.outcome).toBe('REOPENED');
      expect(result.newIssueStatus).toBe('REOPENED');
      expect(result.review.reopenReason).toContain('Loose gravel remains');
      expect(result.review.evidenceUrls).toHaveLength(1);

      // Verify metrics impact
      const metrics = service.getQualityMetrics();
      expect(metrics.totalReviews).toBe(1);
      expect(metrics.reopenedCount).toBe(1);
      expect(metrics.reopenRate).toBe(100);
      expect(metrics.confirmationRate).toBe(0);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('rejects invalid review decision', async () => {
      await expect(
        service.submitCitizenReview({
          issueId: 'issue-403',
          citizenId: 'citizen-01',
          decision: 'MAYBE',
        })
      ).rejects.toThrow(/Invalid review decision/);
    });

    it('validates rating is between 1 and 5', async () => {
      await expect(
        service.submitCitizenReview({
          issueId: 'issue-403',
          citizenId: 'citizen-01',
          decision: CitizenReviewDecision.CONFIRMED,
          rating: 6,
        })
      ).rejects.toThrow(/between 1 and 5/);
    });
  });

  describe('Aggregated Quality Metrics & Department Accountability', () => {
    it('aggregates multi-department resolution quality metrics', async () => {
      // 2 Confirmed for PWD
      await service.submitCitizenReview({
        issueId: 'iss-1',
        citizenId: 'c1',
        decision: CitizenReviewDecision.CONFIRMED,
        rating: 5,
        departmentId: 'dept-pwd',
        categoryId: 'roads_pothole',
      });
      await service.submitCitizenReview({
        issueId: 'iss-2',
        citizenId: 'c2',
        decision: CitizenReviewDecision.CONFIRMED,
        rating: 4,
        departmentId: 'dept-pwd',
        categoryId: 'roads_pothole',
      });

      // 1 Reopened for PWD
      await service.submitCitizenReview({
        issueId: 'iss-3',
        citizenId: 'c3',
        decision: CitizenReviewDecision.REOPENED,
        reopenReason: 'Pothole sunk again after rain',
        departmentId: 'dept-pwd',
        categoryId: 'roads_pothole',
      });

      // 1 Confirmed for Jal Board
      await service.submitCitizenReview({
        issueId: 'iss-4',
        citizenId: 'c4',
        decision: CitizenReviewDecision.CONFIRMED,
        rating: 5,
        departmentId: 'dept-djb',
        categoryId: 'water_leak',
      });

      const metrics = service.getQualityMetrics();
      expect(metrics.totalReviews).toBe(4);
      expect(metrics.confirmedCount).toBe(3);
      expect(metrics.reopenedCount).toBe(1);
      expect(metrics.confirmationRate).toBe(75.0);
      expect(metrics.reopenRate).toBe(25.0);

      // Department breakdowns
      expect(metrics.byDepartment['dept-pwd'].total).toBe(3);
      expect(metrics.byDepartment['dept-pwd'].confirmed).toBe(2);
      expect(metrics.byDepartment['dept-pwd'].reopened).toBe(1);
      expect(metrics.byDepartment['dept-pwd'].confirmationRate).toBe(66.7);

      expect(metrics.byDepartment['dept-djb'].total).toBe(1);
      expect(metrics.byDepartment['dept-djb'].confirmed).toBe(1);
      expect(metrics.byDepartment['dept-djb'].confirmationRate).toBe(100.0);
    });
  });

  describe('REST API Endpoints Integration', () => {
    it('POST /feedback/notify-resolution sends notification and returns 200', async () => {
      const res = await request(app)
        .post('/feedback/notify-resolution')
        .send({
          issueId: 'api-iss-1',
          citizenId: 'cit-10',
          issueTitle: 'Streetlight pole broken',
          proposedBy: 'Lineman Ashok',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.reviewUrl).toContain('api-iss-1');
    });

    it('POST /feedback/reviews submits citizen review and returns 201', async () => {
      const res = await request(app)
        .post('/feedback/reviews')
        .send({
          issueId: 'api-iss-1',
          citizenId: 'cit-10',
          decision: 'CONFIRMED',
          rating: 5,
          feedbackComments: 'Prompt resolution, thank you NDMC.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.newIssueStatus).toBe('CLOSED');
    });

    it('GET /feedback/issues/:issueId returns review details', async () => {
      const res = await request(app).get('/feedback/issues/api-iss-1');
      expect(res.status).toBe(200);
      expect(res.body.decision).toBe('CONFIRMED');
      expect(res.body.rating).toBe(5);
    });

    it('GET /feedback/metrics returns aggregated quality stats', async () => {
      const res = await request(app).get('/feedback/metrics');
      expect(res.status).toBe(200);
      expect(res.body.totalReviews).toBeGreaterThanOrEqual(1);
      expect(res.body.confirmationRate).toBeDefined();
    });
  });
});
