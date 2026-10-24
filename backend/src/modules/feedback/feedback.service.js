import { prisma } from '@civiq/db';
import { notificationService } from '../notifications/notification.service.js';
import { CitizenReviewDecision } from './feedback.types.js';

export class FeedbackService {
  /**
   * In-memory store for citizen reviews (supports both DB-backed and standalone runs)
   */
  reviews = new Map();

  /**
   * Pending resolution review notifications
   */
  pendingReviewNotifications = new Map();

  /**
   * Notify the reporting citizen that work has been completed and request verification.
   */
  async notifyCitizenOfProposedResolution(params) {
    const { issueId, citizenId, citizenEmail, issueTitle, proposedBy = 'Field Operations' } = params;

    const notificationRecord = {
      id: `notif_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      issueId,
      citizenId,
      issueTitle: issueTitle || `Issue #${issueId}`,
      proposedBy,
      reviewUrl: `/resolution-review?issueId=${issueId}`,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    this.pendingReviewNotifications.set(issueId, notificationRecord);

    // Dispatch via notificationService
    try {
      await notificationService.handleIssueStatusChange({
        eventId: `evt_prop_res_${issueId}`,
        issueId,
        issueTitle: notificationRecord.issueTitle,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        recipientUserId: citizenId,
        ...(citizenEmail ? { recipientEmail: citizenEmail } : {}),
        timestamp: notificationRecord.createdAt,
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return notificationRecord;
  }

  /**
   * Citizen submits resolution verification review (Confirm or Reopen).
   */
  async submitCitizenReview(params) {
    const {
      issueId,
      citizenId,
      decision,
      rating,
      reopenReason,
      feedbackComments = '',
      evidenceUrls = [],
      departmentId = 'general',
      categoryId = 'general',
    } = params;

    if (!issueId || !citizenId || !decision) {
      throw new Error('Missing required fields: issueId, citizenId, decision.');
    }

    if (!Object.values(CitizenReviewDecision).includes(decision)) {
      throw new Error(`Invalid review decision: ${decision}. Must be CONFIRMED or REOPENED.`);
    }

    if (decision === CitizenReviewDecision.REOPENED) {
      if (!reopenReason || !reopenReason.trim()) {
        throw new Error('A valid reason is required when reopening an issue.');
      }
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reviewRecord = {
      id: reviewId,
      issueId,
      citizenId,
      decision,
      rating: rating ?? (decision === CitizenReviewDecision.CONFIRMED ? 5 : null),
      reopenReason: decision === CitizenReviewDecision.REOPENED ? reopenReason.trim() : null,
      feedbackComments: feedbackComments.trim(),
      evidenceUrls,
      departmentId,
      categoryId,
      createdAt: new Date().toISOString(),
    };

    this.reviews.set(issueId, reviewRecord);

    // Update Issue status in database if available
    try {
      const newStatus = decision === CitizenReviewDecision.CONFIRMED ? 'CLOSED' : 'REOPENED';
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: newStatus,
        },
      });

      // Record verification history entry
      await prisma.verificationHistory.create({
        data: {
          issueId,
          previousStatus: 'RESOLVED',
          newStatus: newStatus,
          changedById: citizenId,
          reason:
            decision === CitizenReviewDecision.CONFIRMED
              ? `Citizen verified and confirmed resolution (Rating: ${rating ?? 5}/5)`
              : `Citizen rejected resolution and reopened issue: ${reopenReason.trim()}`,
        },
      });
    } catch {
      // Memory fallback for standalone tests
    }

    return {
      success: true,
      review: reviewRecord,
      outcome: decision,
      newIssueStatus: decision === CitizenReviewDecision.CONFIRMED ? 'CLOSED' : 'REOPENED',
    };
  }

  /**
   * Retrieve review for an issue.
   */
  getReviewForIssue(issueId) {
    return this.reviews.get(issueId) || null;
  }

  /**
   * Compute aggregated resolution quality metrics fed by citizen outcomes.
   */
  getQualityMetrics(filters = {}) {
    let allReviews = Array.from(this.reviews.values());

    if (filters.departmentId) {
      allReviews = allReviews.filter((r) => r.departmentId === filters.departmentId);
    }
    if (filters.categoryId) {
      allReviews = allReviews.filter((r) => r.categoryId === filters.categoryId);
    }

    const totalReviews = allReviews.length;
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        confirmedCount: 0,
        reopenedCount: 0,
        confirmationRate: 100, // Default baseline
        reopenRate: 0,
        averageRating: 5.0,
        byDepartment: {},
        byCategory: {},
      };
    }

    const confirmedCount = allReviews.filter((r) => r.decision === CitizenReviewDecision.CONFIRMED).length;
    const reopenedCount = allReviews.filter((r) => r.decision === CitizenReviewDecision.REOPENED).length;

    const ratedReviews = allReviews.filter((r) => typeof r.rating === 'number');
    const averageRating =
      ratedReviews.length > 0
        ? Number((ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length).toFixed(2))
        : 5.0;

    const confirmationRate = Number(((confirmedCount / totalReviews) * 100).toFixed(1));
    const reopenRate = Number(((reopenedCount / totalReviews) * 100).toFixed(1));

    // Department grouping
    const byDepartment = {};
    for (const r of allReviews) {
      const dept = r.departmentId || 'unassigned';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { total: 0, confirmed: 0, reopened: 0, ratingSum: 0, ratingCount: 0 };
      }
      byDepartment[dept].total += 1;
      if (r.decision === CitizenReviewDecision.CONFIRMED) byDepartment[dept].confirmed += 1;
      if (r.decision === CitizenReviewDecision.REOPENED) byDepartment[dept].reopened += 1;
      if (typeof r.rating === 'number') {
        byDepartment[dept].ratingSum += r.rating;
        byDepartment[dept].ratingCount += 1;
      }
    }

    for (const key of Object.keys(byDepartment)) {
      const item = byDepartment[key];
      item.confirmationRate = Number(((item.confirmed / item.total) * 100).toFixed(1));
      item.averageRating = item.ratingCount > 0 ? Number((item.ratingSum / item.ratingCount).toFixed(2)) : 5.0;
      delete item.ratingSum;
      delete item.ratingCount;
    }

    // Category grouping
    const byCategory = {};
    for (const r of allReviews) {
      const cat = r.categoryId || 'unassigned';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, confirmed: 0, reopened: 0 };
      }
      byCategory[cat].total += 1;
      if (r.decision === CitizenReviewDecision.CONFIRMED) byCategory[cat].confirmed += 1;
      if (r.decision === CitizenReviewDecision.REOPENED) byCategory[cat].reopened += 1;
    }

    for (const key of Object.keys(byCategory)) {
      const item = byCategory[key];
      item.confirmationRate = Number(((item.confirmed / item.total) * 100).toFixed(1));
    }

    return {
      totalReviews,
      confirmedCount,
      reopenedCount,
      confirmationRate,
      reopenRate,
      averageRating,
      byDepartment,
      byCategory,
    };
  }
}

export const feedbackService = new FeedbackService();
