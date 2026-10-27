import time
from typing import Literal

from fastapi import APIRouter

from app.api.schemas import (
    AI_GATEWAY_VERSION,
    AiModelMetadata,
    CategoryPrediction,
    ClassificationFeedbackRequest,
    ClassificationFeedbackResponse,
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
    PredictiveMaintenanceRequest,
    PredictiveMaintenanceResponse,
    PriorityBreakdown,
    PriorityScoreRequest,
    PriorityScoreResponse,
    RouteRequest,
    RouteResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.pipelines.classification import get_classifier, get_feedback_store
from app.pipelines.dedup import IssueSummary, get_dedup_engine
from app.pipelines.priority import IssuePriorityInput, get_priority_engine
from app.pipelines.vision import get_analyzer
from app.pipelines.maintenance import AssetMaintenanceInput, get_maintenance_predictor

router = APIRouter(prefix="/v1", tags=["AI Gateway v1"])

DEFAULT_MODEL = AiModelMetadata(
    name="civiq-ai-core",
    version="1.0.0",
    provider="provider-agnostic-gateway",
)


@router.post("/classify", response_model=ClassifyResponse)
def classify_issue(payload: ClassifyRequest) -> ClassifyResponse:
    start_time = time.perf_counter()

    classifier = get_classifier()
    result = classifier.classify(
        text=payload.text,
        title=payload.title,
        candidate_categories=payload.candidate_categories,
        language=payload.language,
    )

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    alt_preds = [
        CategoryPrediction(
            category_id=alt.category_id,
            confidence=alt.confidence,
            reasoning=alt.reasoning,
            group_id=alt.group_id,
            subcategory=alt.group_id,
            category_name=alt.category_name,
        )
        for alt in result.alternative_categories
    ]

    return ClassifyResponse(
        version=AI_GATEWAY_VERSION,
        confidence=result.confidence,
        model=result.model_metadata,
        explanation=result.explanation,
        latency_ms=latency,
        primary_category=result.primary_category,
        primary_group=result.primary_group,
        primary_subcategory=result.primary_group,
        predicted_severity=result.predicted_severity,
        alternative_categories=alt_preds,
        suggested_tags=result.suggested_tags,
        is_emergency_candidate=result.is_emergency_candidate,
    )


@router.post("/classify/feedback", response_model=ClassificationFeedbackResponse)
def submit_classification_feedback(
    payload: ClassificationFeedbackRequest,
) -> ClassificationFeedbackResponse:
    store = get_feedback_store()
    entry = store.record_feedback(
        issue_id=payload.issue_id,
        text=payload.text,
        predicted_category=payload.predicted_category,
        corrected_category=payload.corrected_category,
        title=payload.title,
        predicted_severity=payload.predicted_severity,
        corrected_severity=payload.corrected_severity,
        reviewer_id=payload.reviewer_id,
        source=payload.source,
        notes=payload.notes,
    )
    return ClassificationFeedbackResponse(
        feedback_id=entry.feedback_id,
        issue_id=entry.issue_id,
        text=entry.text,
        title=entry.title,
        predicted_category=entry.predicted_category,
        predicted_group=entry.predicted_group,
        corrected_category=entry.corrected_category,
        corrected_group=entry.corrected_group,
        predicted_severity=entry.predicted_severity,
        corrected_severity=entry.corrected_severity,
        reviewer_id=entry.reviewer_id,
        source=entry.source,
        created_at=entry.created_at,
        notes=entry.notes,
        success=True,
    )


@router.get("/classify/feedback", response_model=list[ClassificationFeedbackResponse])
def list_classification_feedback(
    category: str | None = None,
    limit: int = 100,
) -> list[ClassificationFeedbackResponse]:
    store = get_feedback_store()
    entries = store.list_feedback(category=category, limit=limit)
    return [
        ClassificationFeedbackResponse(
            feedback_id=e.feedback_id,
            issue_id=e.issue_id,
            text=e.text,
            title=e.title,
            predicted_category=e.predicted_category,
            predicted_group=e.predicted_group,
            corrected_category=e.corrected_category,
            corrected_group=e.corrected_group,
            predicted_severity=e.predicted_severity,
            corrected_severity=e.corrected_severity,
            reviewer_id=e.reviewer_id,
            source=e.source,
            created_at=e.created_at,
            notes=e.notes,
            success=True,
        )
        for e in entries
    ]


@router.post("/evidence-check", response_model=EvidenceCheckResponse)
def check_evidence(payload: EvidenceCheckRequest) -> EvidenceCheckResponse:
    start_time = time.perf_counter()

    analyzer = get_analyzer()
    result = analyzer.analyse(
        mime_type=payload.mime_type,
        issue_title=payload.issue_title,
        issue_description=payload.issue_description,
        category_id=payload.category_id,
        media_base64=payload.media_base64,
        media_url=payload.media_url,
        media_storage_key=payload.media_storage_key,
    )

    latency = round((time.perf_counter() - start_time) * 1000, 2)

    return EvidenceCheckResponse(
        version=AI_GATEWAY_VERSION,
        confidence=result.confidence,
        model=result.model_metadata,
        explanation=result.explanation,
        latency_ms=latency,
        is_relevant=result.is_relevant,
        relevance_score=result.relevance_score,
        quality_score=result.quality.quality_score,
        flags=result.all_flags(),
        detected_objects=result.detected_objects,
        safety_passed=result.safety_passed,
        matched_category_id=result.primary_category_id,
        review_decision=result.review_decision,
        is_low_confidence=result.is_low_confidence,
        is_unsupported_format=result.is_unsupported_format,
    )


@router.post("/duplicate-score", response_model=DuplicateScoreResponse)
def score_duplicates(payload: DuplicateScoreRequest) -> DuplicateScoreResponse:
    start_time = time.perf_counter()

    engine = get_dedup_engine()
    target_summary = IssueSummary(
        id=payload.target_issue.id,
        title=payload.target_issue.title,
        description=payload.target_issue.description,
        category_id=payload.target_issue.category_id,
        latitude=payload.target_issue.latitude,
        longitude=payload.target_issue.longitude,
        created_at=payload.target_issue.created_at,
        image_perceptual_hash=payload.target_issue.image_perceptual_hash,
    )
    candidates_summary = [
        IssueSummary(
            id=c.id,
            title=c.title,
            description=c.description,
            category_id=c.category_id,
            latitude=c.latitude,
            longitude=c.longitude,
            created_at=c.created_at,
            image_perceptual_hash=c.image_perceptual_hash,
        )
        for c in payload.candidate_issues
    ]

    scored = engine.score_candidates(
        target=target_summary,
        candidates=candidates_summary,
        threshold=payload.threshold,
    )

    scored_candidates = [
        DuplicateCandidateResult(
            candidate_id=res.candidate_id,
            similarity_score=res.total_score,
            semantic_similarity=res.semantic_similarity,
            geo_distance_meters=res.geo_distance_meters,
            time_delta_hours=res.time_delta_hours,
            match_explanation=res.match_explanation,
            geo_score=res.geo_similarity,
            time_score=res.time_similarity,
            text_score=res.semantic_similarity,
            image_score=res.image_similarity,
            is_high_impact=res.is_high_impact,
            decision_evidence=res.decision_evidence,
        )
        for res in scored
    ]

    top_score = scored[0].total_score if scored else 0.0
    is_duplicate = any(res.is_duplicate for res in scored)
    matched_id = scored[0].candidate_id if is_duplicate and scored else None

    latency = round((time.perf_counter() - start_time) * 1000, 2)
    cand_count = len(payload.candidate_issues)

    return DuplicateScoreResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.88 if is_duplicate else 0.80,
        model=DEFAULT_MODEL,
        explanation=(
            f"Evaluated {cand_count} candidates via embedding and spatial-temporal ensemble "
            f"(threshold={payload.threshold})."
        ),
        latency_ms=latency,
        is_duplicate=is_duplicate,
        matched_candidate_id=matched_id,
        top_similarity_score=top_score,
        scored_candidates=scored_candidates,
    )


@router.post("/priority-score", response_model=PriorityScoreResponse)
def score_priority(payload: PriorityScoreRequest) -> PriorityScoreResponse:
    start_time = time.perf_counter()

    engine = get_priority_engine()
    location_dict = (
        {
            "latitude": payload.location.latitude,
            "longitude": payload.location.longitude,
            "jurisdiction_id": payload.location.jurisdiction_id,
        }
        if payload.location
        else None
    )

    priority_input = IssuePriorityInput(
        issue_id=payload.issue_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        reporter_trust_score=payload.reporter_trust_score,
        location=location_dict,
        upvotes_count=payload.upvotes_count,
        age_hours=payload.age_hours,
        corroboration_count=payload.corroboration_count,
        location_context=payload.location_context,
    )

    result = engine.calculate_priority(priority_input)
    latency = round((time.perf_counter() - start_time) * 1000, 2)

    first_reason = result.reasons[0] if result.reasons else "Deterministic signals evaluated."
    explanation = (
        f"Priority score {result.priority_score}/100 [{result.priority_tier}]: "
        f"{first_reason}"
    )

    return PriorityScoreResponse(
        version=AI_GATEWAY_VERSION,
        confidence=0.92,
        model=DEFAULT_MODEL,
        explanation=explanation,
        latency_ms=latency,
        priority_score=result.priority_score,
        priority_tier=result.priority_tier,
        score_breakdown=PriorityBreakdown(
            hazard_score=result.hazard_score,
            impact_radius_score=result.impact_radius_score,
            vulnerability_score=result.vulnerability_score,
            time_decay_factor=result.time_decay_factor,
            safety_risk_score=result.safety_risk_score,
            impact_score=result.impact_score,
            corroboration_score=result.corroboration_score,
            age_score=result.age_score,
            location_context_score=result.location_context_score,
        ),
        recommended_sla_hours=result.recommended_sla_hours,
        reasons=result.reasons,
        decision_evidence=result.decision_evidence,
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

    if payload.entity_type == "ASSET":
        predictor = get_maintenance_predictor()
        metrics = payload.historical_metrics
        asset_input = AssetMaintenanceInput(
            asset_id=payload.entity_id,
            asset_type=metrics.get("asset_type", "OTHER"),
            age_years=metrics.get("age_years"),
            expected_lifespan_years=metrics.get("expected_lifespan_years"),
            current_condition_score=metrics.get("current_condition_score", 100.0),
            failure_count=metrics.get("failure_count", 0),
            recent_failure_count=metrics.get("recent_failure_count", 0),
            total_downtime_hours=metrics.get("total_downtime_hours", 0.0),
            days_since_last_maintenance=metrics.get("days_since_last_maintenance"),
        )
        res = predictor.predict(asset_input)
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        return PredictResponse(
            version=AI_GATEWAY_VERSION,
            confidence=res.confidence,
            model=DEFAULT_MODEL,
            explanation=f"Predictive maintenance risk assessment for asset {payload.entity_id}.",
            latency_ms=latency,
            prediction_type="PREDICTIVE_MAINTENANCE_RISK",
            risk_probability=res.risk_score,
            risk_level=res.risk_level.value,
            trend="INCREASING" if res.risk_level in ["HIGH", "CRITICAL"] else "STABLE",
            contributing_factors=[
                ContributingFactor(
                    factor=f.factor,
                    weight=f.weight,
                    description=f.description,
                )
                for f in res.contributing_factors
            ],
        )

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



@router.post("/predict/maintenance", response_model=PredictiveMaintenanceResponse)
def predict_maintenance(payload: PredictiveMaintenanceRequest) -> PredictiveMaintenanceResponse:
    start_time = time.perf_counter()

    predictor = get_maintenance_predictor()
    asset_input = AssetMaintenanceInput(
        asset_id=payload.asset_id,
        asset_name=payload.asset_name,
        asset_type=payload.asset_type,
        installation_date=payload.installation_date,
        age_years=payload.age_years,
        expected_lifespan_years=payload.expected_lifespan_years,
        current_condition_score=payload.current_condition_score,
        failure_count=payload.failure_count,
        recent_failure_count=payload.recent_failure_count,
        total_downtime_hours=payload.total_downtime_hours,
        days_since_last_maintenance=payload.days_since_last_maintenance,
        mtbf_days=payload.mtbf_days,
        past_expenditure_inr=payload.past_expenditure_inr,
    )

    result = predictor.predict(asset_input)
    latency = round((time.perf_counter() - start_time) * 1000, 2)

    factors = [
        ContributingFactor(
            factor=f.factor,
            weight=f.weight,
            description=f.description,
        )
        for f in result.contributing_factors
    ]

    return PredictiveMaintenanceResponse(
        version=AI_GATEWAY_VERSION,
        confidence=result.confidence,
        model=DEFAULT_MODEL,
        explanation=(
            f"Baseline predictive maintenance assessment for asset {payload.asset_id} ({payload.asset_type}): "
            f"risk {result.risk_level.value} ({result.risk_score}). Recommended action: {result.recommended_action.value}."
        ),
        latency_ms=latency,
        asset_id=result.asset_id,
        asset_name=result.asset_name,
        asset_type=result.asset_type,
        risk_score=result.risk_score,
        risk_level=result.risk_level.value,
        recommended_action=result.recommended_action.value,
        reason_codes=[rc.value for rc in result.reason_codes],
        contributing_factors=factors,
        is_authoritative=False,
        disclaimer=result.disclaimer,
    )
