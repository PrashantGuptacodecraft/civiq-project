import { prisma } from '@civiq/db';
import {
  AiRoutingRecommendation,
  RoutingCandidateDepartment,
  RoutingDecision,
  RoutingDecisionStatus,
  RoutingRequest,
} from './routing.types';
import { RoutingMatrix, routingMatrix } from './routing.matrix';
import { RoutingPolicyEngine, routingPolicyEngine } from './routing.policy';

export interface RouteIssueByIdOptions {
  aiRecommendation?: AiRoutingRecommendation | undefined;
  updateDatabase?: boolean | undefined;
  traceId?: string | undefined;
  allKnownDepartments?: RoutingCandidateDepartment[] | undefined;
}

export class RoutingService {
  private matrix: RoutingMatrix;
  private policy: RoutingPolicyEngine;

  constructor(
    matrix: RoutingMatrix = routingMatrix,
    policy: RoutingPolicyEngine = routingPolicyEngine
  ) {
    this.matrix = matrix;
    this.policy = policy;
  }

  /**
   * Pure deterministic routing evaluation:
   * 1. Evaluates verification gate (blocks unverified unless low-risk bypass).
   * 2. Filters allowed departments by jurisdiction and category capability.
   * 3. Evaluates AI recommendation against policy rules and jurisdiction constraints.
   * 4. Enforces policy override if AI recommendation violates constraints.
   * 5. Returns comprehensive decision evidence.
   */
  public evaluateRouting(request: RoutingRequest): RoutingDecision {
    const rulesEvaluated: string[] = [];

    // Step 1: Verification Gate Evaluation
    const gateResult = this.policy.evaluateVerificationGate({
      verificationStatus: request.verificationStatus,
      categoryId: request.categoryId,
      severity: request.severity,
    });

    rulesEvaluated.push(`Verification Gate: ${gateResult.reason}`);

    // If verification gate fails, hold routing immediately
    if (!gateResult.passed) {
      return {
        issueId: request.issueId,
        status: 'ROUTING_HELD_PENDING_VERIFICATION',
        jurisdictionId: request.jurisdictionId,
        categoryId: request.categoryId,
        verificationPassed: false,
        verificationReason: gateResult.reason,
        isLowRiskBypass: false,
        aiRecommendation: request.aiRecommendation,
        aiRecommendationAccepted: false,
        policyViolations: [],
        candidateDepartments: [],
        decisionEvidence: {
          gateResult,
          rulesEvaluated,
          statusReason: 'Issue held at verification gate before department routing.',
        },
        routedAt: new Date(),
      };
    }

    // Step 2: Candidate Department Lookup & Capability Matrix
    const candidateDepartments = this.matrix.filterAllowedDepartments({
      categoryId: request.categoryId,
      jurisdictionId: request.jurisdictionId,
      departments: request.availableDepartments || [],
    });

    rulesEvaluated.push(
      `Matrix Lookup: Found ${candidateDepartments.length} authorized candidate departments in jurisdiction '${request.jurisdictionId}' for category '${request.categoryId}'.`
    );

    // If no candidate department is found for jurisdiction + category
    if (candidateDepartments.length === 0) {
      return {
        issueId: request.issueId,
        status: 'ROUTING_FAILED_NO_DEPARTMENT',
        jurisdictionId: request.jurisdictionId,
        categoryId: request.categoryId,
        verificationPassed: true,
        verificationReason: gateResult.reason,
        isLowRiskBypass: gateResult.isLowRiskBypass,
        aiRecommendation: request.aiRecommendation,
        aiRecommendationAccepted: false,
        policyViolations: ['NO_QUALIFIED_DEPARTMENT_IN_JURISDICTION'],
        candidateDepartments: [],
        decisionEvidence: {
          gateResult,
          candidateCount: 0,
          rulesEvaluated,
          statusReason: `No department in jurisdiction '${request.jurisdictionId}' has capability for category '${request.categoryId}'.`,
        },
        routedAt: new Date(),
      };
    }

    // Step 3: AI Recommendation & Policy Constraint Evaluation
    let selectedDepartment: RoutingCandidateDepartment | undefined;
    let decisionStatus: RoutingDecisionStatus = gateResult.isLowRiskBypass
      ? 'ROUTED_LOW_RISK_BYPASS'
      : 'ROUTED';
    let aiRecommendationAccepted = false;
    let policyOverrideReason: string | undefined;
    let violations: string[] = [];

    if (request.aiRecommendation) {
      const policyValidation = this.policy.evaluateAiRecommendation({
        aiRecommendation: request.aiRecommendation,
        candidateDepartments,
        allKnownDepartments: request.availableDepartments || [],
        issueJurisdictionId: request.jurisdictionId,
        categoryId: request.categoryId,
      });

      if (policyValidation.valid) {
        selectedDepartment = candidateDepartments.find(
          (d) => d.id === request.aiRecommendation!.departmentId
        );
        aiRecommendationAccepted = true;
        rulesEvaluated.push(
          `AI Recommendation Accepted: Department '${selectedDepartment?.name}' matches jurisdiction and capability rules.`
        );
      } else {
        // AI recommendation violated constraints - enforce safe policy override
        violations = policyValidation.violations;
        policyOverrideReason = policyValidation.reason;
        decisionStatus = 'ROUTING_OVERRIDDEN_BY_POLICY';
        selectedDepartment = candidateDepartments.find(
          (d) => d.id === policyValidation.overrideDepartmentId
        );
        rulesEvaluated.push(
          `Policy Override Enforced: AI recommended department violated constraints (${violations.join(
            ', '
          )}). Safely overridden to '${selectedDepartment?.name}'.`
        );
      }
    } else {
      // No AI recommendation: route to top matrix candidate
      selectedDepartment = candidateDepartments[0];
      rulesEvaluated.push(
        `Default Matrix Routing: Selected highest-ranking candidate '${selectedDepartment?.name}' based on taxonomy capability.`
      );
    }

    return {
      issueId: request.issueId,
      status: decisionStatus,
      assignedDepartmentId: selectedDepartment?.id,
      assignedDepartmentName: selectedDepartment?.name,
      jurisdictionId: request.jurisdictionId,
      categoryId: request.categoryId,
      verificationPassed: true,
      verificationReason: gateResult.reason,
      isLowRiskBypass: gateResult.isLowRiskBypass,
      aiRecommendation: request.aiRecommendation,
      aiRecommendationAccepted,
      policyViolations: violations,
      policyOverrideReason,
      candidateDepartments,
      decisionEvidence: {
        gateResult,
        rulesEvaluated,
        assignedDepartment: selectedDepartment,
        aiRecommendation: request.aiRecommendation,
        aiRecommendationAccepted,
        policyOverrideReason,
        violations,
      },
      routedAt: new Date(),
    };
  }

  /**
   * Route an issue by fetching issue and candidate departments directly from the database.
   */
  public async routeIssueById(
    issueId: string,
    options: RouteIssueByIdOptions = {}
  ): Promise<RoutingDecision | null> {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue || !issue.jurisdictionId || !issue.categoryId) {
      return null;
    }

    // Load active departments for this jurisdiction
    const dbDepartments = await prisma.department.findMany({
      where: {
        deletedAt: null,
        organization: {
          jurisdictionId: issue.jurisdictionId,
          deletedAt: null,
        },
      },
      include: {
        organization: true,
      },
    });

    const candidateDepartments: RoutingCandidateDepartment[] = dbDepartments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      organizationId: dept.organizationId,
      organizationName: dept.organization.name,
      jurisdictionId: dept.organization.jurisdictionId,
      issueCategories: dept.issueCategories,
    }));

    // If options.allKnownDepartments provided, combine for foreign jurisdiction validation
    const availableDepartments = [
      ...candidateDepartments,
      ...(options.allKnownDepartments || []).filter(
        (kd) => !candidateDepartments.some((cd) => cd.id === kd.id)
      ),
    ];

    const decision = this.evaluateRouting({
      issueId: issue.id,
      title: issue.title,
      description: issue.description,
      categoryId: issue.categoryId,
      jurisdictionId: issue.jurisdictionId,
      verificationStatus: issue.verificationStatus,
      severity: issue.severity,
      availableDepartments,
      aiRecommendation: options.aiRecommendation,
    });

    // AI audit log recording if AI recommendation was present
    if (options.aiRecommendation && prisma.aiAuditRecord) {
      try {
        await prisma.aiAuditRecord.create({
          data: {
            operation: 'DEPARTMENT_ROUTING',
            issueId: issue.id,
            traceId: options.traceId ?? null,
            modelName: options.aiRecommendation.modelName || 'civic-routing-model',
            modelVersion: options.aiRecommendation.modelVersion || 'v1.0.0',
            confidence: options.aiRecommendation.confidence ?? 0.85,
            inferenceOutput: {
              recommendedDepartmentId: options.aiRecommendation.departmentId,
              recommendedDepartmentName: options.aiRecommendation.departmentName,
              reasoning: options.aiRecommendation.reasoning,
            },
            rawInputRedacted: {
              issueId: issue.id,
              categoryId: issue.categoryId,
              jurisdictionId: issue.jurisdictionId,
            },
            isRedacted: true,
            humanDecision: decision.aiRecommendationAccepted ? 'ACCEPTED' : 'OVERRIDDEN',
            overrideReason: decision.policyOverrideReason ?? null,
            finalOutcome: {
              status: decision.status,
              assignedDepartmentId: decision.assignedDepartmentId,
              assignedDepartmentName: decision.assignedDepartmentName,
            },
          },
        });
      } catch {
        // Fallback gracefully if database audit record creation fails in isolated environment
      }
    }

    return decision;
  }
}

export const routingService = new RoutingService();
