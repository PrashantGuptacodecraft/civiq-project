export const AI_GATEWAY_VERSION = 'v1';

export const AI_OPERATIONS = [
  'classify',
  'evidence-check',
  'duplicate-score',
  'priority-score',
  'route',
  'summarize',
  'predict',
];

export interface AiModelMetadata {
  name;
  version;
  provider;
}

export interface BaseAiResponse {
  version;
  confidence; // 0.0 - 1.0
  model;
  explanation;
  latencyMs;
  requestId?;
  cached?;
}

// ─────────────────────────────────────────────
// 1. CLASSIFY
// ─────────────────────────────────────────────

export interface AiClassifyRequest {
  text;
  title?;
  location?{
    latitude;
    longitude;
    jurisdictionId?;
  } | undefined;
  language?;
  candidateCategories?[] | undefined;
}

export interface AiCategoryPrediction {
  categoryId;
  confidence;
  reasoning?;
  groupId?;
  subcategory?;
  categoryName?;
}

export interface AiClassifyResponse extends BaseAiResponse {
  primaryCategory;
  primaryGroup?;
  primarySubcategory?;
  predictedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alternativeCategories;
  suggestedTags[];
  isEmergencyCandidate;
}

export interface AiClassificationFeedbackRequest {
  issueId;
  text;
  title?;
  predictedCategory;
  correctedCategory;
  predictedSeverity?'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  correctedSeverity?'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  reviewerId?;
  source?;
  notes?;
}

export interface AiClassificationFeedbackResponse {
  feedbackId;
  issueId;
  text;
  title?;
  predictedCategory;
  predictedGroup?;
  correctedCategory;
  correctedGroup?;
  predictedSeverity?;
  correctedSeverity?;
  reviewerId?;
  source;
  createdAt;
  notes?;
  success;
}

// ─────────────────────────────────────────────
// 2. EVIDENCE CHECK
// ─────────────────────────────────────────────

export interface AiEvidenceCheckRequest {
  mimeType;
  issueTitle;
  issueDescription;
  mediaStorageKey?;
  mediaUrl?;
  mediaBase64?;
  categoryId?;
  captureCoordinates?{
    latitude;
    longitude;
  } | undefined;
}

export interface AiEvidenceCheckResponse extends BaseAiResponse {
  isRelevant;
  relevanceScore; // 0.0 - 1.0
  qualityScore; // 0.0 - 1.0
  flags[];
  detectedObjects[];
  safetyPassed;
  matchedCategoryId?;
  reviewDecision?'AUTO_ACCEPTED' | 'REVIEW_REQUIRED' | 'SOFT_ACCEPTED' | undefined;
  isLowConfidence?;
  isUnsupportedFormat?;
}

// ─────────────────────────────────────────────
// 3. DUPLICATE SCORE
// ─────────────────────────────────────────────

export interface AiIssueSummaryInput {
  id;
  title;
  description;
  categoryId?;
  latitude?;
  longitude?;
  createdAt?;
  imagePerceptualHash?;
}

export interface AiDuplicateScoreRequest {
  targetIssue;
  candidateIssues;
  threshold?;
}

export interface AiDuplicateCandidateResult {
  candidateId;
  similarityScore; // 0.0 - 1.0
  semanticSimilarity;
  geoDistanceMeters?;
  timeDeltaHours?;
  matchExplanation;
  geoScore?;
  timeScore?;
  textScore?;
  imageScore?;
  isHighImpact?;
  decisionEvidence?, unknown> | undefined;
}

export interface AiDuplicateScoreResponse extends BaseAiResponse {
  isDuplicate;
  matchedCandidateId?;
  topSimilarityScore;
  scoredCandidates;
}

// ─────────────────────────────────────────────
// 4. PRIORITY SCORE
// ─────────────────────────────────────────────

export interface AiPriorityScoreRequest {
  issueId;
  title;
  description;
  category;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reporterTrustScore?;
  location?{
    latitude;
    longitude;
    jurisdictionId?;
  } | undefined;
  upvotesCount?;
  ageHours?;
  corroborationCount?;
  locationContext?{
    isSchoolZone?;
    isHospitalZone?;
    isTransitHub?;
    isArterialRoad?;
  } | undefined;
}

export interface AiPriorityBreakdown {
  hazardScore; // 0 - 100
  impactRadiusScore; // 0 - 100
  vulnerabilityScore; // 0 - 100
  timeDecayFactor;
  safetyRiskScore?; // 0 - 100
  impactScore?; // 0 - 100
  corroborationScore?; // 0 - 100
  ageScore?; // 0 - 100
  locationContextScore?; // 0 - 100
}

export interface AiPriorityScoreResponse extends BaseAiResponse {
  priorityScore; // 0 - 100
  priorityTier: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  scoreBreakdown;
  recommendedSlaHours;
  reasons?[] | undefined;
  decisionEvidence?, unknown> | undefined;
}

// ─────────────────────────────────────────────
// 5. ROUTE
// ─────────────────────────────────────────────

export interface AiDepartmentOption {
  id;
  name;
  categories[];
  jurisdictionId?;
}

export interface AiRouteRequest {
  issueId;
  title;
  description;
  categoryId;
  jurisdictionId;
  availableDepartments;
}

export interface AiRouteResponse extends BaseAiResponse {
  recommendedDepartmentId;
  recommendedDepartmentName;
  secondaryDepartmentIds[];
  routingReason;
}

// ─────────────────────────────────────────────
// 6. SUMMARIZE
// ─────────────────────────────────────────────

export interface AiSummarizeRequest {
  text;
  format?'BULLETS' | 'EXECUTIVE' | 'CITIZEN' | 'ONE_LINE' | undefined;
  maxLength?;
  targetAudience?'CITIZEN' | 'OFFICIAL' | 'FIELD_WORKER' | undefined;
  language?;
}

export interface AiSummarizeResponse extends BaseAiResponse {
  summary;
  keyPoints[];
  language;
}

// ─────────────────────────────────────────────
// 7. PREDICT
// ─────────────────────────────────────────────

export interface AiPredictRequest {
  entityType: 'ISSUE' | 'HOTSPOT' | 'ASSET' | 'JURISDICTION';
  entityId;
  historicalMetrics;
  horizonDays;
}

export interface AiContributingFactor {
  factor;
  weight; // 0.0 - 1.0
  description?;
}

export interface AiPredictResponse extends BaseAiResponse {
  predictionType;
  riskProbability; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  contributingFactors;
}

// ─────────────────────────────────────────────
// 8. AI AUDIT & GOVERNANCE TRAIL
// ─────────────────────────────────────────────

  | 'INCIDENT_PREDICTION';

  | 'PENDING_REVIEW';

export interface AiAuditRecordDto {
  id;
  operation;
  issueId?;
  traceId?;
  modelName;
  modelVersion;
  promptConfigHash?;
  confidence?;
  inferenceOutput;
  rawInputRedacted;
  isRedacted;
  humanDecision;
  humanDecisionNotes?;
  humanDecisionBy?;
  humanDecidedAt?;
  overrideReason?;
  finalOutcome?, unknown> | undefined;
  evaluationMetrics?, unknown> | undefined;
  latencyMs?;
  createdAt;
}

export interface AiAdminComparisonFilter {
  operation?;
  humanDecision?;
  modelName?;
  startDate?;
  endDate?;
  limit?;
  offset?;
}

export interface AiAdminComparisonSummary {
  totalInferences;
  pendingReviewCount;
  acceptedCount;
  modifiedCount;
  overriddenCount;
  rejectedCount;
  acceptanceRate;
  overrideRate;
  avgConfidenceAccepted;
  avgConfidenceOverridden;
  topOverrideReasons;
  records;
}

export interface AiEvaluationRecordDto {
  recordId;
  operation;
  modelName;
  modelVersion;
  isAgreement;
  humanDecision;
  discrepancyType?;
  confidenceCalibrated;
  metrics;
}