

| 'BUSY';

export interface WorkerAvailability {
  status;
  shiftStart?;
  shiftEnd?;
  maxConcurrentWorkload;
}

export interface WorkerWorkload {
  activeAssignmentsCount;
  pendingCriticalCount;
  maxCapacity;
  capacityUtilization; // 0.0 - 1.0 (or >1.0 if overloaded)
}

export interface WorkerLocation {
  latitude;
  longitude;
  updatedAt?;
}

export interface WorkerProfile {
  id;
  name;
  email?;
  phone?;
  role: 'FIELD_WORKER' | 'FIELD_SUPERVISOR';
  departmentId;
  departmentName?;
  jurisdictionId;
  skills[];
  coverageJurisdictionIds[];
  coverageRadiusKm?;
  baseLocation?;
  currentLocation?;
  availability;
  workload;
}

export interface AssignmentWeights {
  skill?;
  jurisdiction?;
  proximity?;
  workload?;
}

export interface WorkerScoreBreakdown {
  skillScore;
  jurisdictionScore;
  proximityScore;
  workloadScore;
  distanceKm?;
}

export interface ScoredWorker {
  worker;
  totalScore;
  scoreBreakdown;
  isEligible;
  ineligibilityReasons[];
  matchReasons[];
}

export interface AssignmentRecommendationRequest {
  issueId;
  title;
  description?;
  categoryId;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  jurisdictionId;
  departmentId?;
  location?{ latitude; longitude } | undefined;
  candidateWorkers?;
  customWeights?;
}

export interface AssignmentRecommendation {
  issueId;
  recommendedWorker?;
  rankedCandidates;
  ineligibleCandidates;
  decisionEvidence;
  generatedAt;
}

export interface AssignIssueParams {
  issueId;
  assignedWorkerId;
  officerId;
  isOfficerOverride?;
  overrideReason?;
  recommendedWorkerId?;
  notes?;
}

export interface AssignmentResult {
  issueId;
  assignedWorkerId;
  assignedWorkerName;
  status: 'ASSIGNED';
  isOfficerOverride;
  overrideReason?;
  assignedBy;
  assignedAt;
  decisionEvidence;
}