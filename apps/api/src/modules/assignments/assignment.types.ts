export type WorkerAvailabilityStatus =
  | 'AVAILABLE'
  | 'ON_DUTY'
  | 'ON_LEAVE'
  | 'OFF_SHIFT'
  | 'BUSY';

export interface WorkerAvailability {
  status: WorkerAvailabilityStatus;
  shiftStart?: string | undefined;
  shiftEnd?: string | undefined;
  maxConcurrentWorkload: number;
}

export interface WorkerWorkload {
  activeAssignmentsCount: number;
  pendingCriticalCount: number;
  maxCapacity: number;
  capacityUtilization: number; // 0.0 - 1.0 (or >1.0 if overloaded)
}

export interface WorkerLocation {
  latitude: number;
  longitude: number;
  updatedAt?: Date | undefined;
}

export interface WorkerProfile {
  id: string;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  role: 'FIELD_WORKER' | 'FIELD_SUPERVISOR';
  departmentId: string;
  departmentName?: string | undefined;
  jurisdictionId: string;
  skills: string[];
  coverageJurisdictionIds: string[];
  coverageRadiusKm?: number | undefined;
  baseLocation?: WorkerLocation | undefined;
  currentLocation?: WorkerLocation | undefined;
  availability: WorkerAvailability;
  workload: WorkerWorkload;
}

export interface AssignmentWeights {
  skill?: number | undefined;
  jurisdiction?: number | undefined;
  proximity?: number | undefined;
  workload?: number | undefined;
}

export interface WorkerScoreBreakdown {
  skillScore: number;
  jurisdictionScore: number;
  proximityScore: number;
  workloadScore: number;
  distanceKm?: number | undefined;
}

export interface ScoredWorker {
  worker: WorkerProfile;
  totalScore: number;
  scoreBreakdown: WorkerScoreBreakdown;
  isEligible: boolean;
  ineligibilityReasons: string[];
  matchReasons: string[];
}

export interface AssignmentRecommendationRequest {
  issueId: string;
  title: string;
  description?: string | undefined;
  categoryId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  jurisdictionId: string;
  departmentId?: string | undefined;
  location?: { latitude: number; longitude: number } | undefined;
  candidateWorkers?: WorkerProfile[] | undefined;
  customWeights?: AssignmentWeights | undefined;
}

export interface AssignmentRecommendation {
  issueId: string;
  recommendedWorker?: ScoredWorker | undefined;
  rankedCandidates: ScoredWorker[];
  ineligibleCandidates: ScoredWorker[];
  decisionEvidence: Record<string, unknown>;
  generatedAt: Date;
}

export interface AssignIssueParams {
  issueId: string;
  assignedWorkerId: string;
  officerId: string;
  isOfficerOverride?: boolean | undefined;
  overrideReason?: string | undefined;
  recommendedWorkerId?: string | undefined;
  notes?: string | undefined;
}

export interface AssignmentResult {
  issueId: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  status: 'ASSIGNED';
  isOfficerOverride: boolean;
  overrideReason?: string | undefined;
  assignedBy: string;
  assignedAt: Date;
  decisionEvidence: Record<string, unknown>;
}
