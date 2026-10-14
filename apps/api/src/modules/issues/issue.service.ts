import { prisma, Issue, IssueSeverity, IssueStatus, VerificationStatus } from '@civiq/db';
import { CIVIC_ISSUE_TAXONOMY_V1, IssueCategory } from '@civiq/contracts';
import { CreateIssueDTO, IssueSubmissionResult } from './issue.types';
import { notificationService } from '../notifications/notification.service';

export function getTaxonomyCategory(categoryId: string): IssueCategory | null {
  for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
    for (const cat of group.categories) {
      if (cat.id === categoryId) {
        return cat;
      }
    }
  }
  return null;
}

export class IssueService {
  /**
   * Create an issue with description, category, jurisdiction, location, and source.
   * Requires an authenticated, active user.
   */
  async createIssue(params: {
    userId: string;
    data: CreateIssueDTO;
  }): Promise<IssueSubmissionResult> {
    const { userId, data } = params;

    if (!userId) {
      throw new Error('Authentication required for public issue submission.');
    }

    // 1. Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is inactive or suspended.');
    }

    // 2. Validate description
    const description = data.description ? data.description.trim() : '';
    if (description.length < 10) {
      throw new Error('Description must be at least 10 characters long.');
    }

    // 3. Validate category against versioned civic taxonomy
    if (!data.categoryId) {
      throw new Error('Category is required.');
    }

    const taxonomyCat = getTaxonomyCategory(data.categoryId);
    if (!taxonomyCat) {
      throw new Error(`Invalid category: "${data.categoryId}". Category must be registered in civic taxonomy.`);
    }

    // 4. Validate jurisdiction
    if (!data.jurisdictionId) {
      throw new Error('Jurisdiction is required.');
    }

    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: data.jurisdictionId },
    });

    if (!jurisdiction) {
      throw new Error(`Jurisdiction not found: "${data.jurisdictionId}".`);
    }

    // 5. Validate GPS location coordinates if provided
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (data.latitude !== undefined || data.longitude !== undefined) {
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('Both latitude and longitude must be numbers if location is provided.');
      }
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees.');
      }
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees.');
      }
      latitude = data.latitude;
      longitude = data.longitude;
    }

    // 6. Source and Severity
    const source = (data.source && data.source.trim()) ? data.source.trim() : 'CITIZEN_WEB';
    const severity: IssueSeverity = data.severity ?? (taxonomyCat.severity as IssueSeverity);

    // 7. Title (either provided or derived from category + summary)
    const title = (data.title && data.title.trim())
      ? data.title.trim()
      : `${taxonomyCat.name} - ${description.slice(0, 40).trim()}...`;

    // 8. Execute in transaction: Create issue and initial verification history record
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          title,
          description,
          categoryId: taxonomyCat.id,
          jurisdictionId: jurisdiction.id,
          latitude,
          longitude,
          address: data.address?.trim() ?? null,
          state: data.state?.trim() ?? null,
          district: data.district?.trim() ?? null,
          city: data.city?.trim() ?? null,
          source,
          severity,
          resolverVersion: data.resolverVersion ?? null,
          resolverSource: data.resolverSource ?? null,
          isBoundaryAmbiguous: data.isBoundaryAmbiguous ?? false,
          manualJurisdictionConfirmed: data.manualJurisdictionConfirmed ?? false,
          status: IssueStatus.SUBMITTED,
          verificationStatus: VerificationStatus.PENDING,
          reportedById: user.id,
        },
      });

      // Immutable submission audit via verification history
      await tx.verificationHistory.create({
        data: {
          issueId: issue.id,
          previousStatus: VerificationStatus.PENDING,
          newStatus: VerificationStatus.PENDING,
          changedById: user.id,
          reason: 'Initial public submission',
        },
      });

      return issue as IssueSubmissionResult;
    });

    try {
      await notificationService.handleIssueStatusChange({
        eventId: `evt_${result.id}_${result.status}`,
        issueId: result.id,
        issueTitle: result.title,
        previousStatus: 'DRAFT',
        newStatus: result.status,
        changedById: user.id,
        recipientUserId: user.id,
        ...(user.email ? { recipientEmail: user.email } : {}),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return result;
  }

  /**
   * Update issue status and dispatch lifecycle notification event.
   */
  async updateStatus(params: {
    issueId: string;
    newStatus: IssueStatus;
    changedById: string;
    reason?: string | undefined;
  }): Promise<Issue> {
    const { issueId, newStatus, changedById, reason } = params;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!issue) {
      throw new Error(`Issue not found: "${issueId}".`);
    }

    const previousStatus = issue.status;
    if (previousStatus === newStatus) {
      return issue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: { status: newStatus },
        include: {
          reportedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      await tx.verificationHistory.create({
        data: {
          issueId,
          previousStatus: issue.verificationStatus,
          newStatus: issue.verificationStatus,
          changedById,
          reason: reason ?? `Status changed from ${previousStatus} to ${newStatus}`,
        },
      });

      return updatedIssue;
    });

    try {
      await notificationService.handleIssueStatusChange({
        eventId: `evt_${issueId}_${newStatus}`,
        issueId,
        issueTitle: updated.title,
        previousStatus,
        newStatus,
        changedById,
        recipientUserId: updated.reportedById,
        ...(updated.reportedBy?.email ? { recipientEmail: updated.reportedBy.email } : {}),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking notification dispatch
    }

    return updated;
  }

  /**
   * Fetch an issue by ID with reporter and history metadata
   */
  async getIssueById(issueId: string): Promise<Issue | null> {
    return prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        jurisdiction: true,
        verificationHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * List issues with optional filters
   */
  async listIssues(filters?: {
    userId?: string;
    jurisdictionId?: string;
    categoryId?: string;
    status?: IssueStatus;
  }): Promise<Issue[]> {
    const where: any = { deletedAt: null };

    if (filters?.userId) where.reportedById = filters.userId;
    if (filters?.jurisdictionId) where.jurisdictionId = filters.jurisdictionId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.status) where.status = filters.status;

    return prisma.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const issueService = new IssueService();
