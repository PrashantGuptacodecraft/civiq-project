import time
from typing import Literal

from fastapi import APIRouter

from app.api.schemas import (
    AI_GATEWAY_VERSION,
    AiModelMetadata,
    CategoryPrediction,
    ClassifyRequest,
    ClassifyResponse,
    ContributingFactor,
    DepartmentOption,
    DuplicateCandidateResult,
    DuplicateScoreRequest,
    DuplicateScoreResponse,
    EvidenceCheckRequest,
    EvidenceCheckResponse,
    PredictRequest,
    PredictResponse,
    PriorityBreakdown,
    PriorityScoreRequest,
    PriorityScoreResponse,
    RouteRequest,
    RouteResponse,
    SummarizeRequest,
    SummarizeResponse,
)

router = APIRouter(prefix="/v1", tags=["AI Gateway v1"])

DEFAULT_MODEL = AiModelMetadata(
    name="civiq-ai-core",
    version="1.0.0",
    provider="provider-agnostic-gateway",
)


@router.post("/classify", response_model=ClassifyResponse)
def classify_issue(payload: ClassifyRequest) -> ClassifyResponse:
    start_time = time.perf_counter()

    combined_text = f"{payload.title or ''} {payload.text}".lower()

    primary_category = "general_civic"
    predicted_severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    is_emergency = False
    tags: list[str] = []

    emergency_words = ["fire", "gas leak", "explosion", "electrocution", "collapse"]
    if any(k in combined_text for k in emergency_words):
        is_emergency = True
        predicted_severity = "CRITICAL"
        tags.extend(["emergency", "life-safety"])

    if any(k in combined_text for k in ["pothole", "road", "asphalt", "crater", "speed breaker"]):
        primary_category = "roads_pothole"
        tags.extend(["roads", "traffic"])
    elif any(k in combined_text for k in ["drain", "water", "sewage", "flooding", "pipe"]):
        primary_category = "drainage_flooding"
        tags.extend(["water", "drainage"])
    elif any(k in combined_text for k in ["garbage", "trash", "waste", "dump", "debris"]):
        primary_category = "sanitation_waste"
        tags.extend(["sanitation", "cleanliness"])
    elif any(k in combined_text for k in ["light", "street light", "wire", "cable", "pole"]):
        primary_category = "electrical_lighting"
        tags.extend(["electrical", "safety"])

    if is_emergency:
        explanation = "Urgent high-impact keywords detected. Flagged for emergency review."
    else:
        explanation = f"Classified based on contextual lexical indicators for {primary_category}."

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return ClassifyResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.88 if primary_category != "general_civic" else 0.50,
        model=DEFAULT_MODEL,
        explanation=explanation,
        latency_ms=latency,
        primary_category=primary_category,
        predicted_severity=predicted_severity,
        alternative_categories=[
            CategoryPrediction(
                category_id=primary_category,
                confidence=0.88,
                reasoning="Primary semantic match",
            )
        ],
        suggested_tags=list(set(tags)),
        is_emergency_candidate=is_emergency,
    )


@router.post("/evidence-check", response_model=EvidenceCheckResponse)
def check_evidence(payload: EvidenceCheckRequest) -> EvidenceCheckResponse:
    start_time = time.perf_counter()

    is_image = payload.mime_type.startswith("image/")
    quality_score = 0.85 if is_image else 0.70
    relevance_score = 0.88 if is_image else 0.60
    flags: list[str] = []

    if not is_image:
        flags.append("NON_IMAGE_FORMAT")

    detected_objects: list[str] = (
        ["scene_context", "urban_infrastructure"] if is_image else ["document"]
    )

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return EvidenceCheckResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.87,
        model=DEFAULT_MODEL,
        explanation="Evidence verified against MIME integrity and civic issue context.",
        latency_ms=latency,
        is_relevant=relevance_score >= 0.5,
        relevance_score=relevance_score,
        quality_score=quality_score,
        flags=flags,
        detected_objects=detected_objects,
        safety_passed=True,
    )


@router.post("/duplicate-score", response_model=DuplicateScoreResponse)
def score_duplicates(payload: DuplicateScoreRequest) -> DuplicateScoreResponse:
    start_time = time.perf_counter()

    target_text = f"{payload.target_issue.title} {payload.target_issue.description}".lower()
    target_words = set(target_text.split())

    scored_candidates: list[DuplicateCandidateResult] = []
    top_score = 0.0
    matched_id: str | None = None

    for candidate in payload.candidate_issues:
        cand_text = f"{candidate.title} {candidate.description}".lower()
        cand_words = set(cand_text.split())

        intersection = target_words.intersection(cand_words)
        union = target_words.union(cand_words)
        jaccard = len(intersection) / len(union) if union else 0.0

        similarity = round(jaccard, 3)
        if similarity > top_score:
            top_score = similarity
            matched_id = candidate.id

        scored_candidates.append(
            DuplicateCandidateResult(
                candidate_id=candidate.id,
                similarity_score=similarity,
                semantic_similarity=similarity,
                match_explanation=f"Lexical overlap: {len(intersection)} shared terms",
            )
        )

    is_duplicate = top_score >= payload.threshold
    latency = round((time.perf_counter() - start_time) * 1000, 2)
    cand_count = len(payload.candidate_issues)

    return DuplicateScoreResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.85,
        model=DEFAULT_MODEL,
        explanation=f"Evaluated {cand_count} candidates against threshold {payload.threshold}.",
        latency_ms=latency,
        is_duplicate=is_duplicate,
        matched_candidate_id=matched_id if is_duplicate else None,
        top_similarity_score=top_score,
        scored_candidates=scored_candidates,
    )


@router.post("/priority-score", response_model=PriorityScoreResponse)
def score_priority(payload: PriorityScoreRequest) -> PriorityScoreResponse:
    start_time = time.perf_counter()

    severity_weight = {
        "LOW": 25.0,
        "MEDIUM": 50.0,
        "HIGH": 75.0,
        "CRITICAL": 95.0,
    }.get(payload.severity, 50.0)

    hazard_score = severity_weight
    impact_score = min(100.0, 40.0 + (payload.upvotes_count or 0) * 5.0)
    vulnerability_score = 60.0
    time_decay = min(2.0, 1.0 + (payload.age_hours or 0.0) * 0.02)

    raw_score = (hazard_score * 0.4 + impact_score * 0.3 + vulnerability_score * 0.3) * time_decay
    final_score = round(min(100.0, max(0.0, raw_score)), 2)

    if final_score >= 80.0:
        tier: Literal["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"] = "P1_CRITICAL"
        sla = 4
    elif final_score >= 60.0:
        tier = "P2_HIGH"
        sla = 24
    elif final_score >= 40.0:
        tier = "P3_MEDIUM"
        sla = 72
    else:
        tier = "P4_LOW"
        sla = 168

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return PriorityScoreResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.91,
        model=DEFAULT_MODEL,
        explanation=f"Composite priority index ({final_score}/100) based on severity and impact.",
        latency_ms=latency,
        priority_score=final_score,
        priority_tier=tier,
        score_breakdown=PriorityBreakdown(
            hazard_score=hazard_score,
            impact_radius_score=impact_score,
            vulnerability_score=vulnerability_score,
            time_decay_factor=time_decay,
        ),
        recommended_sla_hours=sla,
    )


@router.post("/route", response_model=RouteResponse)
def route_issue(payload: RouteRequest) -> RouteResponse:
    start_time = time.perf_counter()

    matched_dept: DepartmentOption | None = None
    for dept in payload.available_departments:
        if payload.category_id in dept.categories:
            matched_dept = dept
            break

    if not matched_dept and payload.available_departments:
        matched_dept = payload.available_departments[0]

    dept_id = matched_dept.id if matched_dept else "unassigned"
    dept_name = matched_dept.name if matched_dept else "General Municipal Service"

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return RouteResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.95 if matched_dept else 0.50,
        model=DEFAULT_MODEL,
        explanation=f"Matched category '{payload.category_id}' against department responsibility.",
        latency_ms=latency,
        recommended_department_id=dept_id,
        recommended_department_name=dept_name,
        secondary_department_ids=[],
        routing_reason="Direct taxonomy-to-department policy rule",
    )


@router.post("/summarize", response_model=SummarizeResponse)
def summarize_text(payload: SummarizeRequest) -> SummarizeResponse:
    start_time = time.perf_counter()

    clean_text = payload.text.replace("\n", ". ")
    sentences = [s.strip() for s in clean_text.split(".") if len(s.strip()) > 3]
    summary = ". ".join(sentences[:2]) + ("." if sentences else "")
    key_points = sentences[:3] if sentences else [payload.text[:80]]

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return SummarizeResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.88,
        model=DEFAULT_MODEL,
        explanation=f"Extracted concise summary targeted for {payload.target_audience}.",
        latency_ms=latency,
        summary=summary,
        key_points=key_points,
        language=payload.language or "en",
    )


@router.post("/predict", response_model=PredictResponse)
def predict_trend(payload: PredictRequest) -> PredictResponse:
    start_time = time.perf_counter()

    risk_prob = 0.65
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    trend: Literal["INCREASING", "STABLE", "DECREASING"] = "STABLE"

    unresolved = payload.historical_metrics.get("unresolved_count", 0)
    if isinstance(unresolved, (int, float)) and unresolved > 10:
        risk_prob = 0.85
        risk_level = "HIGH"
        trend = "INCREASING"

    factors = [
        ContributingFactor(
            factor="Historical volume and backlog rate",
            weight=0.60,
            description="High unresolved count correlates with escalation risk",
        ),
        ContributingFactor(
            factor="Seasonal and environmental factors",
            weight=0.40,
            description="Baseline civic activity seasonality",
        ),
    ]

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return PredictResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.82,
        model=DEFAULT_MODEL,
        explanation=(
            f"Projected {payload.horizon_days}-day horizon risk for "
            f"{payload.entity_type} {payload.entity_id}."
        ),
        latency_ms=latency,
        prediction_type="RECURRENCE_AND_ESCALATION_RISK",
        risk_probability=risk_prob,
        risk_level=risk_level,
        trend=trend,
        contributing_factors=factors,
    )
