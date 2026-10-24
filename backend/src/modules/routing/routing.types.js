
  | 'ROUTING_FAILED_NO_DEPARTMENT';

export interface RoutingCandidateDepartment {
  id;
  name;
  organizationId;
  organizationName?;
  jurisdictionId;
  issueCategories[];
  isDirectMatch?;
}

export interface AiRoutingRecommendation {
  departmentId;
  departmentName?;
  confidence?;
  reasoning?;
  modelName?;
  modelVersion?;
}

export interface VerificationGateResult {
  passed;
  isLowRiskBypass;
  reason;
}

export interface PolicyValidationResult {
  valid;
  violations[];
  overrideDepartmentId?;
  overrideDepartmentName?;
  reason?;
}

export interface LowRiskCategoryConfig {
  categoryId;
  maxAllowedSeverity: 'LOW' | 'MEDIUM';
  description;
}

export interface RoutingRequest {
  issueId;
  title;
  description;
  categoryId;
  jurisdictionId;
  verificationStatus;
  severity;
  availableDepartments?;
  aiRecommendation?;
}

export interface RoutingDecision {
  issueId;
  status;
  assignedDepartmentId?;
  assignedDepartmentName?;
  jurisdictionId;
  categoryId;
  verificationPassed;
  verificationReason;
  isLowRiskBypass;
  aiRecommendation?;
  aiRecommendationAccepted;
  policyViolations[];
  policyOverrideReason?;
  candidateDepartments;
  decisionEvidence;
  routedAt;
}