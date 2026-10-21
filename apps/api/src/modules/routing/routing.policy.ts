import {
  AiRoutingRecommendation,
  PolicyValidationResult,
  RoutingCandidateDepartment,
  VerificationGateResult,
} from './routing.types';
import { RoutingMatrix, routingMatrix } from './routing.matrix';

export class RoutingPolicyEngine {
  private matrix: RoutingMatrix;

  constructor(matrix: RoutingMatrix = routingMatrix) {
    this.matrix = matrix;
  }

  /**
   * Evaluate whether an issue can proceed past the verification gate into routing.
   * - VERIFIED issues pass unconditionally.
   * - Unverified issues only pass if they belong to a configured low-risk category with acceptable severity.
   */
  public evaluateVerificationGate(params: {
    verificationStatus: string;
    categoryId: string;
    severity: string;
  }): VerificationGateResult {
    const { verificationStatus, categoryId, severity } = params;
    const normStatus = (verificationStatus || '').toUpperCase();

    if (normStatus === 'VERIFIED') {
      return {
        passed: true,
        isLowRiskBypass: false,
        reason: 'Issue passed verification gate (status: VERIFIED).',
      };
    }

    const isLowRiskEligible = this.matrix.isLowRiskAutoRouteEligible(categoryId, severity);
    if (isLowRiskEligible) {
      return {
        passed: true,
        isLowRiskBypass: true,
        reason: `Issue verification status is ${normStatus}, but category '${categoryId}' (${severity}) is configured for low-risk auto-route bypass.`,
      };
    }

    return {
      passed: false,
      isLowRiskBypass: false,
      reason: `Routing held: Issue verification status is ${normStatus}. Category '${categoryId}' with severity '${severity}' requires verified status before department dispatch.`,
    };
  }

  /**
   * Enforce jurisdiction isolation: an issue cannot be routed to a department scoped to another jurisdiction.
   */
  public validateJurisdictionConstraint(
    departmentJurisdictionId: string,
    issueJurisdictionId: string
  ): boolean {
    return departmentJurisdictionId === issueJurisdictionId;
  }

  /**
   * Enforce category capability: department must be authorized to handle the category.
   */
  public validateCapabilityConstraint(
    department: RoutingCandidateDepartment,
    categoryId: string
  ): boolean {
    if (department.issueCategories.some((c) => c.toLowerCase() === categoryId.toLowerCase())) {
      return true;
    }
    const defaultDept = this.matrix.getDefaultDepartmentForCategory(categoryId)?.toLowerCase();
    if (defaultDept && department.name) {
      const dName = department.name.toLowerCase();
      return dName.includes(defaultDept) || defaultDept.includes(dName);
    }
    return false;
  }

  /**
   * Validate AI recommendation against hard policy rules and jurisdiction constraints.
   * If AI recommendation violates rules, policy overrides with top eligible candidate from routing matrix.
   */
  public evaluateAiRecommendation(params: {
    aiRecommendation?: AiRoutingRecommendation;
    candidateDepartments: RoutingCandidateDepartment[];
    allKnownDepartments?: RoutingCandidateDepartment[];
    issueJurisdictionId: string;
    categoryId: string;
  }): PolicyValidationResult {
    const {
      aiRecommendation,
      candidateDepartments,
      allKnownDepartments = [],
      issueJurisdictionId,
      categoryId,
    } = params;

    if (!aiRecommendation || !aiRecommendation.departmentId) {
      return { valid: true, violations: [] };
    }

    const violations: string[] = [];

    // Check if AI recommended department is among allowed candidates in this jurisdiction
    const candidateMatch = candidateDepartments.find(
      (d) => d.id === aiRecommendation.departmentId
    );

    if (candidateMatch) {
      // AI recommended an allowed department that already satisfies jurisdiction and capability constraints
      return { valid: true, violations: [] };
    }

    // AI recommended a department outside candidate list - determine violation reason
    const knownMatch = allKnownDepartments.find(
      (d) => d.id === aiRecommendation.departmentId
    );

    if (knownMatch) {
      if (knownMatch.jurisdictionId !== issueJurisdictionId) {
        violations.push(
          `JURISDICTION_MISMATCH: AI recommended department '${knownMatch.name}' (${knownMatch.id}) scoped to jurisdiction '${knownMatch.jurisdictionId}', but issue belongs to jurisdiction '${issueJurisdictionId}'.`
        );
      }
      if (!this.validateCapabilityConstraint(knownMatch, categoryId)) {
        violations.push(
          `CAPABILITY_MISMATCH: AI recommended department '${knownMatch.name}' (${knownMatch.id}) lacks capability for category '${categoryId}'.`
        );
      }
    } else {
      violations.push(
        `UNKNOWN_DEPARTMENT: AI recommended department '${aiRecommendation.departmentId}' is not an authorized department in the system.`
      );
    }

    // Safe fallback: pick the top valid department from the matrix candidate list
    const fallback = candidateDepartments[0];

    return {
      valid: false,
      violations,
      overrideDepartmentId: fallback?.id,
      overrideDepartmentName: fallback?.name,
      reason: `Policy constraint violation in AI recommendation: ${violations.join(' | ')}. Safe override to matrix department '${fallback?.name || 'none'}'.`,
    };
  }
}

export const routingPolicyEngine = new RoutingPolicyEngine();
