import { createHash } from 'crypto';
import { ProofType, SupervisorDecision, FieldTaskVerificationStatus } from './field-verification.types.js';

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class FieldVerificationService {
  /**
   * Configurable policies mapped by category ID.
   */
  policies = new Map();

  /**
   * Evidence records keyed by assignmentId -> Array of evidence items.
   */
  evidenceStore = new Map();

  /**
   * Reviews keyed by assignmentId -> Array of review decisions.
   */
  reviewStore = new Map();

  /**
   * Verification status keyed by assignmentId -> status record.
   */
  statusStore = new Map();

  constructor() {
    this.initDefaultPolicies();
  }

  initDefaultPolicies() {
    // Standard default policy
    this.policies.set('default', {
      requiresBeforePhoto: true,
      requiresAfterPhoto: true,
      maxGpsRadiusMeters: 250,
      minPhotoCount: 2,
    });

    // High-risk infrastructure / road repair
    this.policies.set('roads_pothole', {
      requiresBeforePhoto: true,
      requiresAfterPhoto: true,
      maxGpsRadiusMeters: 200,
      minPhotoCount: 2,
    });

    this.policies.set('electrical_hanging_wires', {
      requiresBeforePhoto: true,
      requiresAfterPhoto: true,
      maxGpsRadiusMeters: 150,
      minPhotoCount: 2,
    });

    // Light duty cleaning
    this.policies.set('sanitation_litter', {
      requiresBeforePhoto: false,
      requiresAfterPhoto: true,
      maxGpsRadiusMeters: 300,
      minPhotoCount: 1,
    });
  }

  /**
   * Retrieve or configure an evidence requirement policy.
   */
  getPolicy(categoryId) {
    if (categoryId && this.policies.has(categoryId)) {
      return this.policies.get(categoryId);
    }
    return this.policies.get('default');
  }

  setPolicy(categoryId, policy) {
    this.policies.set(categoryId, {
      ...this.getPolicy('default'),
      ...policy,
    });
  }

  /**
   * Submit and bind a photo proof with GPS and timestamp to an assignment.
   */
  submitEvidence(params) {
    const {
      assignmentId,
      issueId,
      workerId,
      proofType,
      mediaUrl,
      taskLocation,
      capturedLocation,
      capturedAt = new Date().toISOString(),
      notes,
    } = params;

    if (!assignmentId || !workerId || !proofType || !mediaUrl) {
      throw new Error('Missing required evidence fields (assignmentId, workerId, proofType, mediaUrl).');
    }

    if (!Object.values(ProofType).includes(proofType)) {
      throw new Error(`Invalid proof type: ${proofType}`);
    }

    // Distance calculation
    let distanceMeters = 0;
    let isWithinRadius = true;
    if (taskLocation && capturedLocation) {
      distanceMeters = calculateDistanceMeters(
        taskLocation.latitude,
        taskLocation.longitude,
        capturedLocation.latitude,
        capturedLocation.longitude
      );
      const policy = this.getPolicy(params.categoryId);
      isWithinRadius = distanceMeters <= policy.maxGpsRadiusMeters;
    }

    // Retrieve existing evidence items to chain cryptographic hashes
    const existing = this.evidenceStore.get(assignmentId) || [];
    const prevHash = existing.length > 0 ? existing[existing.length - 1].hash : 'GENESIS';

    const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hashPayload = `${evidenceId}|${assignmentId}|${issueId}|${workerId}|${proofType}|${mediaUrl}|${capturedAt}|${distanceMeters}|${prevHash}`;
    const hash = createHash('sha256').update(hashPayload).digest('hex');

    const record = {
      id: evidenceId,
      assignmentId,
      issueId: issueId || 'unknown',
      workerId,
      proofType,
      mediaUrl,
      capturedAt,
      capturedLocation: capturedLocation || null,
      distanceFromSiteMeters: Math.round(distanceMeters),
      isWithinRadius,
      notes: notes || '',
      prevHash,
      hash,
    };

    existing.push(record);
    this.evidenceStore.set(assignmentId, existing);

    return record;
  }

  /**
   * Validates if the evidence chain satisfies the policy requirements for task completion.
   */
  validateEvidenceChain(assignmentId, categoryId, taskLocation) {
    const policy = this.getPolicy(categoryId);
    const evidenceList = this.evidenceStore.get(assignmentId) || [];

    const beforeEvidence = evidenceList.filter((e) => e.proofType === ProofType.BEFORE);
    const afterEvidence = evidenceList.filter((e) => e.proofType === ProofType.AFTER);

    const errors = [];

    if (policy.requiresBeforePhoto && beforeEvidence.length === 0) {
      errors.push('Missing required BEFORE work proof photograph.');
    }

    if (policy.requiresAfterPhoto && afterEvidence.length === 0) {
      errors.push('Missing required AFTER work proof photograph.');
    }

    if (evidenceList.length < policy.minPhotoCount) {
      errors.push(`Minimum of ${policy.minPhotoCount} verification photo(s) required (found ${evidenceList.length}).`);
    }

    // Check GPS validity
    const invalidGpsBefore = beforeEvidence.some((e) => !e.isWithinRadius);
    const invalidGpsAfter = afterEvidence.some((e) => !e.isWithinRadius);

    if (invalidGpsBefore || invalidGpsAfter) {
      errors.push(`One or more photographs were taken outside the allowed ${policy.maxGpsRadiusMeters}m perimeter.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      beforeCount: beforeEvidence.length,
      afterCount: afterEvidence.length,
      totalCount: evidenceList.length,
      policy,
    };
  }

  /**
   * Complete task and submit for supervisor field verification.
   */
  submitTaskForCompletion(params) {
    const { assignmentId, categoryId, taskLocation, workerNotes } = params;

    const validation = this.validateEvidenceChain(assignmentId, categoryId, taskLocation);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Task completion rejected due to insufficient or invalid evidence.',
        validationErrors: validation.errors,
      };
    }

    const statusRecord = {
      assignmentId,
      status: FieldTaskVerificationStatus.PENDING_SUPERVISOR_REVIEW,
      submittedAt: new Date().toISOString(),
      workerNotes: workerNotes || '',
      evidenceCount: validation.totalCount,
    };

    this.statusStore.set(assignmentId, statusRecord);

    return {
      success: true,
      status: statusRecord.status,
      message: 'Task submitted for supervisor verification.',
      validation,
    };
  }

  /**
   * Supervisor reviews completion evidence (Approve, Reject, or Reopen).
   */
  supervisorReview(params) {
    const {
      assignmentId,
      supervisorId,
      supervisorRole,
      decision,
      rejectionReason,
      feedback,
    } = params;

    const allowedRoles = [
      'FIELD_SUPERVISOR',
      'DEPARTMENT_OFFICER',
      'DISTRICT_ULB_ADMIN',
      'VERIFICATION_OFFICER',
      'PLATFORM_SUPER_ADMIN',
    ];

    if (!allowedRoles.includes(supervisorRole)) {
      throw new Error(`Unauthorized: Role '${supervisorRole}' cannot perform supervisor field verification.`);
    }

    if (!Object.values(SupervisorDecision).includes(decision)) {
      throw new Error(`Invalid supervisor decision: ${decision}`);
    }

    if ((decision === SupervisorDecision.REJECTED || decision === SupervisorDecision.REOPENED) && !rejectionReason?.trim()) {
      throw new Error('A rejection reason or reopening remark is required.');
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const review = {
      id: reviewId,
      assignmentId,
      supervisorId,
      decision,
      rejectionReason: rejectionReason || null,
      feedback: feedback || '',
      reviewedAt: new Date().toISOString(),
    };

    const existingReviews = this.reviewStore.get(assignmentId) || [];
    existingReviews.push(review);
    this.reviewStore.set(assignmentId, existingReviews);

    // Update assignment verification status
    let updatedStatus;
    if (decision === SupervisorDecision.APPROVED) {
      updatedStatus = FieldTaskVerificationStatus.APPROVED;
    } else if (decision === SupervisorDecision.REJECTED) {
      updatedStatus = FieldTaskVerificationStatus.REJECTED;
    } else {
      updatedStatus = FieldTaskVerificationStatus.REOPENED;
    }

    this.statusStore.set(assignmentId, {
      assignmentId,
      status: updatedStatus,
      lastReviewedAt: review.reviewedAt,
      lastDecision: decision,
      lastRejectionReason: rejectionReason || null,
    });

    return {
      success: true,
      decision,
      status: updatedStatus,
      review,
    };
  }

  /**
   * Get the entire evidence chain and verification history for an assignment.
   */
  getEvidenceChain(assignmentId) {
    const evidence = this.evidenceStore.get(assignmentId) || [];
    const reviews = this.reviewStore.get(assignmentId) || [];
    const currentStatus = this.statusStore.get(assignmentId) || {
      assignmentId,
      status: FieldTaskVerificationStatus.NOT_SUBMITTED,
    };

    // Verify cryptographic integrity of evidence chain
    let isChainTamperFree = true;
    for (let i = 0; i < evidence.length; i++) {
      const item = evidence[i];
      const expectedPrev = i === 0 ? 'GENESIS' : evidence[i - 1].hash;
      if (item.prevHash !== expectedPrev) {
        isChainTamperFree = false;
        break;
      }
    }

    return {
      assignmentId,
      status: currentStatus.status,
      currentStatus,
      isChainTamperFree,
      evidence,
      reviews,
    };
  }
}

export const fieldVerificationService = new FieldVerificationService();
