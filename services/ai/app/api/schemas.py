from typing import Any, Literal

from pydantic import BaseModel, Field

AI_GATEWAY_VERSION: str = "v1"

# ─────────────────────────────────────────────
# BASE METADATA & RESPONSES
# ─────────────────────────────────────────────


class AiModelMetadata(BaseModel):
    name: str = Field(..., description="Model identifier name")
    version: str = Field(..., description="Model release version")
    provider: str = Field(..., description="Backend AI provider: mock, local, openai, google, etc.")


class BaseAiResponse(BaseModel):
    version: str = Field(default=AI_GATEWAY_VERSION, description="AI contract version")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    model: AiModelMetadata = Field(..., description="Metadata of model used for inference")
    explanation: str = Field(..., description="Human-readable explanation of the AI deduction")
    latency_ms: float = Field(..., ge=0.0, description="Execution latency in milliseconds")
    request_id: str | None = Field(default=None, description="Optional correlation or request ID")
    cached: bool = Field(default=False, description="Whether response was returned from cache")


# ─────────────────────────────────────────────
# 1. CLASSIFY
# ─────────────────────────────────────────────


class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    jurisdiction_id: str | None = None


class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Issue description or report text")
    title: str | None = None
    location: LocationInput | None = None
    language: str | None = None
    candidate_categories: list[str] | None = None


class CategoryPrediction(BaseModel):
    category_id: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str | None = None
    group_id: str | None = None
    subcategory: str | None = None
    category_name: str | None = None


class ClassifyResponse(BaseAiResponse):
    primary_category: str
    primary_group: str | None = None
    primary_subcategory: str | None = None
    predicted_severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    alternative_categories: list[CategoryPrediction] = Field(default_factory=list)
    suggested_tags: list[str] = Field(default_factory=list)
    is_emergency_candidate: bool = False


class ClassificationFeedbackRequest(BaseModel):
    issue_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    title: str | None = None
    predicted_category: str = Field(..., min_length=1)
    corrected_category: str = Field(..., min_length=1)
    predicted_severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] | None = None
    corrected_severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] | None = None
    reviewer_id: str | None = None
    source: str = "human_review"
    notes: str | None = None


class ClassificationFeedbackResponse(BaseModel):
    feedback_id: str
    issue_id: str
    text: str
    title: str | None = None
    predicted_category: str
    predicted_group: str | None = None
    corrected_category: str
    corrected_group: str | None = None
    predicted_severity: str | None = None
    corrected_severity: str | None = None
    reviewer_id: str | None = None
    source: str
    created_at: str
    notes: str | None = None
    success: bool = True


# ─────────────────────────────────────────────
# 2. EVIDENCE CHECK
# ─────────────────────────────────────────────


class CoordinatesInput(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class EvidenceCheckRequest(BaseModel):
    mime_type: str = Field(..., description="MIME type of evidence (image/jpeg, etc.)")
    issue_title: str
    issue_description: str
    media_storage_key: str | None = None
    media_url: str | None = None
    media_base64: str | None = None
    category_id: str | None = None
    capture_coordinates: CoordinatesInput | None = None


class EvidenceCheckResponse(BaseAiResponse):
    is_relevant: bool
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    quality_score: float = Field(..., ge=0.0, le=1.0)
    flags: list[str] = Field(default_factory=list)
    detected_objects: list[str] = Field(default_factory=list)
    safety_passed: bool = True
    matched_category_id: str | None = None
    review_decision: Literal["AUTO_ACCEPTED", "REVIEW_REQUIRED", "SOFT_ACCEPTED"] = "AUTO_ACCEPTED"
    is_low_confidence: bool = False
    is_unsupported_format: bool = False


# ─────────────────────────────────────────────
# 3. DUPLICATE SCORE
# ─────────────────────────────────────────────


class IssueSummaryInput(BaseModel):
    id: str
    title: str
    description: str
    category_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    created_at: str | None = None
    image_perceptual_hash: str | None = None


class DuplicateCandidateResult(BaseModel):
    candidate_id: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    semantic_similarity: float = Field(..., ge=0.0, le=1.0)
    geo_distance_meters: float | None = None
    time_delta_hours: float | None = None
    match_explanation: str
    geo_score: float | None = None
    time_score: float | None = None
    text_score: float | None = None
    image_score: float | None = None
    is_high_impact: bool = False
    decision_evidence: dict[str, Any] = Field(default_factory=dict)


class DuplicateScoreRequest(BaseModel):
    target_issue: IssueSummaryInput
    candidate_issues: list[IssueSummaryInput]
    threshold: float = Field(default=0.70, ge=0.0, le=1.0)


class DuplicateScoreResponse(BaseAiResponse):
    is_duplicate: bool
    matched_candidate_id: str | None = None
    top_similarity_score: float = Field(..., ge=0.0, le=1.0)
    scored_candidates: list[DuplicateCandidateResult] = Field(default_factory=list)


# ─────────────────────────────────────────────
# 4. PRIORITY SCORE
# ─────────────────────────────────────────────


class PriorityScoreRequest(BaseModel):
    issue_id: str
    title: str
    description: str
    category: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    reporter_trust_score: float | None = Field(default=None, ge=0.0, le=100.0)
    location: LocationInput | None = None
    upvotes_count: int | None = Field(default=0, ge=0)
    age_hours: float | None = Field(default=0.0, ge=0.0)
    corroboration_count: int | None = Field(default=0, ge=0)
    location_context: dict[str, Any] | None = None


class PriorityBreakdown(BaseModel):
    hazard_score: float = Field(..., ge=0.0, le=100.0)
    impact_radius_score: float = Field(..., ge=0.0, le=100.0)
    vulnerability_score: float = Field(..., ge=0.0, le=100.0)
    time_decay_factor: float = Field(..., ge=0.0)
    safety_risk_score: float | None = Field(default=None, ge=0.0, le=100.0)
    impact_score: float | None = Field(default=None, ge=0.0, le=100.0)
    corroboration_score: float | None = Field(default=None, ge=0.0, le=100.0)
    age_score: float | None = Field(default=None, ge=0.0, le=100.0)
    location_context_score: float | None = Field(default=None, ge=0.0, le=100.0)


class PriorityScoreResponse(BaseAiResponse):
    priority_score: float = Field(..., ge=0.0, le=100.0)
    priority_tier: Literal["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"]
    score_breakdown: PriorityBreakdown
    recommended_sla_hours: int = Field(..., ge=1)
    reasons: list[str] = Field(default_factory=list)
    decision_evidence: dict[str, Any] = Field(default_factory=dict)


# ─────────────────────────────────────────────
# 5. ROUTE
# ─────────────────────────────────────────────


class DepartmentOption(BaseModel):
    id: str
    name: str
    categories: list[str] = Field(default_factory=list)
    jurisdiction_id: str | None = None


class RouteRequest(BaseModel):
    issue_id: str
    title: str
    description: str
    category_id: str
    jurisdiction_id: str
    available_departments: list[DepartmentOption]


class RouteResponse(BaseAiResponse):
    recommended_department_id: str
    recommended_department_name: str
    secondary_department_ids: list[str] = Field(default_factory=list)
    routing_reason: str


# ─────────────────────────────────────────────
# 6. SUMMARIZE
# ─────────────────────────────────────────────


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=5)
    format: Literal["BULLETS", "EXECUTIVE", "CITIZEN", "ONE_LINE"] = "EXECUTIVE"
    max_length: int | None = None
    target_audience: Literal["CITIZEN", "OFFICIAL", "FIELD_WORKER"] = "OFFICIAL"
    language: str | None = "en"


class SummarizeResponse(BaseAiResponse):
    summary: str
    key_points: list[str] = Field(default_factory=list)
    language: str = "en"


# ─────────────────────────────────────────────
# 7. PREDICT
# ─────────────────────────────────────────────


class ContributingFactor(BaseModel):
    factor: str
    weight: float = Field(..., ge=0.0, le=1.0)
    description: str | None = None


class PredictRequest(BaseModel):
    entity_type: Literal["ISSUE", "HOTSPOT", "ASSET", "JURISDICTION"]
    entity_id: str
    historical_metrics: dict[str, Any] = Field(default_factory=dict)
    horizon_days: int = Field(default=7, ge=1)


class PredictResponse(BaseAiResponse):
    prediction_type: str
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    trend: Literal["INCREASING", "STABLE", "DECREASING"]
    contributing_factors: list[ContributingFactor] = Field(default_factory=list)
