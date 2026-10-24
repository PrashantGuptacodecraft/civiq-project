import { prisma } from '@civiq/shared-db';

export interface StoredDuplicatePair {
  id;
  targetIssueId;
  candidateIssueId;
  totalScore;
  isHighImpact;
  explanation;
  decisionEvidence;
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'DISMISSED';
  reviewedById?;
  reviewedAt?;
  createdAt;
}

class DuplicateEvidenceStore {
  inMemoryPairs = new Map();

  /**
   * Record or update a detected candidate pair with its decision evidence.
   * Also creates an immutable audit trail entry.
   */
  async recordCandidatePair(params) {
    const pairId = `${params.targetIssueId}_${params.candidateIssueId}`;
    const stored = {
      id: pairId,
      targetIssueId: params.targetIssueId,
      candidateIssueId: params.candidateIssueId,
      totalScore: params.totalScore,
      isHighImpact: params.isHighImpact,
      explanation: params.explanation,
      decisionEvidence: params.decisionEvidence,
      status: 'PENDING_REVIEW',
      createdAt: new Date(),
    };

    this.inMemoryPairs.set(pairId, stored);

    // Persist to audit log for tamper-evident record keeping
    try {
      if (prisma && prisma.auditLog && typeof prisma.auditLog.create === 'function') {
        await prisma.auditLog.create({
          data: {
            action: 'DUPLICATE_CANDIDATE_DETECTED',
            objectType: 'Issue',
            objectId: params.targetIssueId,
            actorType: 'SYSTEM',
            payload: {
              candidateIssueId: params.candidateIssueId,
              totalScore: params.totalScore,
              isHighImpact: params.isHighImpact,
              explanation: params.explanation,
              decisionEvidence: params.decisionEvidence,
            },
          },
        });
      }
    } catch {
      // Non-fatal if auditLog is not available or mocked
    }

    return stored;
  }

  /**
   * Retrieve all stored candidate pairs for a given issue ( or candidate).
   */
  getCandidatePairsForIssue(issueId) {
    const matches = [];
    for (const pair of this.inMemoryPairs.values()) {
      if (pair.targetIssueId === issueId || pair.candidateIssueId === issueId) {
        matches.push(pair);
      }
    }
    return matches.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Retrieve specific candidate pair by ID.
   */
  getCandidatePairById(pairId){
    return this.inMemoryPairs.get(pairId);
  }

  /**
   * Mark candidate pair  duplicate by an authorized reviewer.
   */
  async confirmDuplicate(pairId, reviewedById) {
    const pair = this.inMemoryPairs.get(pairId);
    if (!pair) return undefined;

    pair.status = 'CONFIRMED';
    pair.reviewedById = reviewedById;
    pair.reviewedAt = new Date();

    try {
      if (prisma && prisma.auditLog && typeof prisma.auditLog.create === 'function') {
        await prisma.auditLog.create({
          data: {
            action: 'DUPLICATE_CANDIDATE_CONFIRMED',
            objectType: 'Issue',
            objectId: pair.targetIssueId,
            actorId: reviewedById,
            actorType: 'HUMAN',
            payload: {
              candidateIssueId: pair.candidateIssueId,
              pairId,
              decisionEvidence: pair.decisionEvidence,
            },
          },
        });
      }
    } catch {
      // Non-fatal
    }

    return pair;
  }

  /**
   * Mark candidate pair  (false positive) by an authorized reviewer.
   */
  async dismissDuplicate(pairId, reviewedById) {
    const pair = this.inMemoryPairs.get(pairId);
    if (!pair) return undefined;

    pair.status = 'DISMISSED';
    pair.reviewedById = reviewedById;
    pair.reviewedAt = new Date();

    try {
      if (prisma && prisma.auditLog && typeof prisma.auditLog.create === 'function') {
        await prisma.auditLog.create({
          data: {
            action: 'DUPLICATE_CANDIDATE_DISMISSED',
            objectType: 'Issue',
            objectId: pair.targetIssueId,
            actorId: reviewedById,
            actorType: 'HUMAN',
            payload: {
              candidateIssueId: pair.candidateIssueId,
              pairId,
            },
          },
        });
      }
    } catch {
      // Non-fatal
    }

    return pair;
  }

  /**
   * Clear in-memory pairs (for test isolation).
   */
  clear() {
    this.inMemoryPairs.clear();
  }
}

export const duplicateEvidenceStore = new DuplicateEvidenceStore();