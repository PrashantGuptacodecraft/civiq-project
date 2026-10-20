export const AI_GATEWAY_VERSION = 'v1' as const;

export const AI_OPERATIONS = [
  'classify',
  'evidence-check',
  'duplicate-score',
  'priority-score',
  'route',
  'summarize',
  'predict',
] as const;

export type AiOperationType = (typeof AI_OPERATIONS)[number];

export interface AiModelMetadata {
  name: string;
  version: string;
  provider: string;
}

export interface BaseAiResponse {
  version: string;
  confidence: number; // 0.0 - 1.0
  model: AiModelMetadata;
  explanation: string;
  latencyMs: number;
  requestId?: string | undefined;
  cached?: boolean | undefined;
}

// ─────────────────────────────────────────────
// 1. CLASSIFY
// ─────────────────────────────────────────────

export interface AiClassifyRequest {
  text: string;
  title?: string | undefined;
  location?: {
    latitude: number;
    longitude: number;
    jurisdictionId?: string | undefined;
  } | undefined;
  language?: string | undefined;
  candidateCategories?: string[] | undefined;
}

export interface AiCategoryPrediction {
  categoryId: string;
  confidence: number;
  reasoning?: string | undefined;
  groupId?: string | undefined;
  subcategory?: string | undefined;
  categoryName?: string | undefined;
}

export interface AiClassifyResponse extends BaseAiResponse {
  primaryCategory: string;
  primaryGroup?: string | undefined;
  primarySubcategory?: string | undefined;
  predictedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alternativeCategories: AiCategoryPrediction[];
  suggestedTags: string[];
  isEmergencyCandidate: boolean;
}

export interface AiClassificationFeedbackRequest {
  issueId: string;
  text: string;
  title?: string | undefined;
  predictedCategory: string;
  correctedCategory: string;
  predictedSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  correctedSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  reviewerId?: string | undefined;
  source?: string | undefined;
  notes?: string | undefined;
}

export interface AiClassificationFeedbackResponse {
  feedbackId: string;
  issueId: string;
  text: string;
  title?: string | undefined;
  predictedCategory: string;
  predictedGroup?: string | undefined;
  correctedCategory: string;
  correctedGroup?: string | undefined;
  predictedSeverity?: string | undefined;
  correctedSeverity?: string | undefined;
  reviewerId?: string | undefined;
  source: string;
  createdAt: string;
  notes?: string | undefined;
  success: boolean;
}

// ─────────────────────────────────────────────
// 2. EVIDENCE CHECK
// ─────────────────────────────────────────────

export interface AiEvidenceCheckRequest {
  mimeType: string;
  issueTitle: string;
  issueDescription: string;
  mediaStorageKey?: string | undefined;
  mediaUrl?: string | undefined;
  mediaBase64?: string | undefined;
  categoryId?: string | undefined;
  captureCoordinates?: {
    latitude: number;
    longitude: number;
  } | undefined;
}

export interface AiEvidenceCheckResponse extends BaseAiResponse {
  isRelevant: boolean;
  relevanceScore: number; // 0.0 - 1.0
  qualityScore: number; // 0.0 - 1.0
  flags: string[];
  detectedObjects: string[];
  safetyPassed: boolean;
  matchedCategoryId?: string | undefined;
  reviewDecision?: 'AUTO_ACCEPTED' | 'REVIEW_REQUIRED' | 'SOFT_ACCEPTED' | undefined;
  isLowConfidence?: boolean | undefined;
  isUnsupportedFormat?: boolean | undefined;
}

// ─────────────────────────────────────────────
// 3. DUPLICATE SCORE
// ─────────────────────────────────────────────

export interface AiIssueSummaryInput {
  id: string;
  title: string;
  description: string;
  categoryId?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  createdAt?: string | undefined;
  imagePerceptualHash?: string | undefined;
}

export interface AiDuplicateScoreRequest {
  targetIssue: AiIssueSummaryInput;
  candidateIssues: AiIssueSummaryInput[];
  threshold?: number | undefined;
}

export interface AiDuplicateCandidateResult {
  candidateId: string;
  similarityScore: number; // 0.0 - 1.0
  semanticSimilarity: number;
  geoDistanceMeters?: number | undefined;
  timeDeltaHours?: number | undefined;
  matchExplanation: string;
  geoScore?: number | undefined;
  timeScore?: number | undefined;
  textScore?: number | undefined;
  imageScore?: number | undefined;
  isHighImpact?: boolean | undefined;
  decisionEvidence?: Record<string, unknown> | undefined;
}

export interface AiDuplicateScoreResponse extends BaseAiResponse {
  isDuplicate: boolean;
  matchedCandidateId?: string | undefined;
  topSimilarityScore: number;
  scoredCandidates: AiDuplicateCandidateResult[];
}

// ─────────────────────────────────────────────
// 4. PRIORITY SCORE
// ─────────────────────────────────────────────

export interface AiPriorityScoreRequest {
  issueId: string;
  title: string;
  description: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reporterTrustScore?: number | undefined;
  location?: {
    latitude: number;
    longitude: number;
    jurisdictionId?: string | undefined;
  } | undefined;
  upvotesCount?: number | undefined;
  ageHours?: number | undefined;
  corroborationCount?: number | undefined;
  locationContext?: {
    isSchoolZone?: boolean | undefined;
    isHospitalZone?: boolean | undefined;
    isTransitHub?: boolean | undefined;
    isArterialRoad?: boolean | undefined;
  } | undefined;
}

export interface AiPriorityBreakdown {
  hazardScore: number; // 0 - 100
  impactRadiusScore: number; // 0 - 100
  vulnerabilityScore: number; // 0 - 100
  timeDecayFactor: number;
  safetyRiskScore?: number | undefined; // 0 - 100
  impactScore?: number | undefined; // 0 - 100
  corroborationScore?: number | undefined; // 0 - 100
  ageScore?: number | undefined; // 0 - 100
  locationContextScore?: number | undefined; // 0 - 100
}

export interface AiPriorityScoreResponse extends BaseAiResponse {
  priorityScore: number; // 0 - 100
  priorityTier: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  scoreBreakdown: AiPriorityBreakdown;
  recommendedSlaHours: number;
  reasons?: string[] | undefined;
  decisionEvidence?: Record<string, unknown> | undefined;
}

// ─────────────────────────────────────────────
// 5. ROUTE
// ─────────────────────────────────────────────

export interface AiDepartmentOption {
  id: string;
  name: string;
  categories: string[];
  jurisdictionId?: string | undefined;
}

export interface AiRouteRequest {
  issueId: string;
  title: string;
  description: string;
  categoryId: string;
  jurisdictionId: string;
  availableDepartments: AiDepartmentOption[];
}

export interface AiRouteResponse extends BaseAiResponse {
  recommendedDepartmentId: string;
  recommendedDepartmentName: string;
  secondaryDepartmentIds: string[];
  routingReason: string;
}

// ─────────────────────────────────────────────
// 6. SUMMARIZE
// ─────────────────────────────────────────────

export interface AiSummarizeRequest {
  text: string;
  format?: 'BULLETS' | 'EXECUTIVE' | 'CITIZEN' | 'ONE_LINE' | undefined;
  maxLength?: number | undefined;
  targetAudience?: 'CITIZEN' | 'OFFICIAL' | 'FIELD_WORKER' | undefined;
  language?: string | undefined;
}

export interface AiSummarizeResponse extends BaseAiResponse {
  summary: string;
  keyPoints: string[];
  language: string;
}

// ─────────────────────────────────────────────
// 7. PREDICT
// ─────────────────────────────────────────────

export interface AiPredictRequest {
  entityType: 'ISSUE' | 'HOTSPOT' | 'ASSET' | 'JURISDICTION';
  entityId: string;
  historicalMetrics: Record<string, any>;
  horizonDays: number;
}

export interface AiContributingFactor {
  factor: string;
  weight: number; // 0.0 - 1.0
  description?: string | undefined;
}

export interface AiPredictResponse extends BaseAiResponse {
  predictionType: string;
  riskProbability: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  contributingFactors: AiContributingFactor[];
}
