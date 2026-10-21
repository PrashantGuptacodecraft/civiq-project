export type RoutingDecisionStatus =
  | 'ROUTED'
  | 'ROUTED_LOW_RISK_BYPASS'
  | 'ROUTING_HELD_PENDING_VERIFICATION'
  | 'ROUTING_OVERRIDDEN_BY_POLICY'
  | 'ROUTING_FAILED_NO_DEPARTMENT';

export interface RoutingCandidateDepartment {
  id: string;
  name: string;
  organizationId: string;
  organizationName?: string | undefined;
  jurisdictionId: string;
  issueCategories: string[];
  isDirectMatch?: boolean | undefined;
}

export interface AiRoutingRecommendation {
  departmentId: string;
  departmentName?: string | undefined;
  confidence?: number | undefined;
  reasoning?: string | undefined;
  modelName?: string | undefined;
  modelVersion?: string | undefined;
}

export interface VerificationGateResult {
  passed: boolean;
  isLowRiskBypass: boolean;
  reason: string;
}

export interface PolicyValidationResult {
  valid: boolean;
  violations: string[];
  overrideDepartmentId?: string | undefined;
  overrideDepartmentName?: string | undefined;
  reason?: string | undefined;
}

export interface LowRiskCategoryConfig {
  categoryId: string;
  maxAllowedSeverity: 'LOW' | 'MEDIUM';
  description: string;
}

export interface RoutingRequest {
  issueId: string;
  title: string;
  description: string;
  categoryId: string;
  jurisdictionId: string;
  verificationStatus: string;
  severity: string;
  availableDepartments?: RoutingCandidateDepartment[] | undefined;
  aiRecommendation?: AiRoutingRecommendation | undefined;
}

export interface RoutingDecision {
  issueId: string;
  status: RoutingDecisionStatus;
  assignedDepartmentId?: string | undefined;
  assignedDepartmentName?: string | undefined;
  jurisdictionId: string;
  categoryId: string;
  verificationPassed: boolean;
  verificationReason: string;
  isLowRiskBypass: boolean;
  aiRecommendation?: AiRoutingRecommendation | undefined;
  aiRecommendationAccepted: boolean;
  policyViolations: string[];
  policyOverrideReason?: string | undefined;
  candidateDepartments: RoutingCandidateDepartment[];
  decisionEvidence: Record<string, unknown>;
  routedAt: Date;
}
