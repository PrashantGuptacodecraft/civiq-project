"""Deterministic feature extraction for explainable priority scoring.

Extracts severity, safety risk, impact, corroboration, age, and location context
with transparent scoring and explainability reasons.
"""

import re
from dataclasses import dataclass, field
from typing import Any

# High-consequence safety keywords
SAFETY_CRITICAL_KEYWORDS: list[str] = [
    "sparking",
    "live wire",
    "electric wire",
    "electrocution",
    "gas leak",
    "explosion",
    "structural collapse",
    "bridge crack",
    "sinkhole",
    "toxic fumes",
    "chemical spill",
    "sewage in drinking water",
    "unconscious",
    "casualty",
]

# Physical hazard category classifications
SAFETY_HIGH_CATEGORIES: set[str] = {
    "electrical_hanging_wires",
    "electrical_transformer_spark",
    "sanitation_open_manhole",
    "roads_sinkhole",
    "water_contamination",
    "disaster_flood",
}

SAFETY_MEDIUM_CATEGORIES: set[str] = {
    "roads_pothole",
    "roads_streetlighting",
    "sanitation_blocked_drain",
    "water_pipeline_leak",
    "traffic_signal_failure",
}


@dataclass
class ExtractedPriorityFeatures:
    """Deterministic feature representation of an issue for priority calculation."""

    issue_id: str
    severity_score: float
    safety_risk_score: float
    impact_score: float
    corroboration_score: float
    age_score: float
    location_context_score: float
    time_decay_factor: float
    safety_hazard_flags: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)
    feature_evidence: dict[str, Any] = field(default_factory=dict)


def extract_severity_score(
    severity: str,
    title: str,
    description: str,
) -> tuple[float, list[str]]:
    """Map categorical severity to numerical score [0..100] with keyword verification."""
    combined = f"{title} {description}".lower()
    reasons: list[str] = []

    base_map = {
        "CRITICAL": 95.0,
        "HIGH": 75.0,
        "MEDIUM": 50.0,
        "LOW": 25.0,
    }
    base = base_map.get(severity.upper(), 50.0)

    escalations = [kw for kw in SAFETY_CRITICAL_KEYWORDS if kw in combined]
    if escalations and severity.upper() != "CRITICAL":
        bump = 15.0 if severity.upper() == "HIGH" else 20.0
        final_score = min(95.0, base + bump)
        reasons.append(
            f"Severity escalated from {severity} to {final_score:.1f} due to "
            f"critical keywords: {', '.join(escalations[:2])}"
        )
    elif severity.upper() == "CRITICAL":
        final_score = base
        reasons.append(f"Reported at CRITICAL severity level ({final_score:.1f}/100)")
    else:
        final_score = base
        reasons.append(f"Standard {severity} severity level assigned ({base:.1f}/100)")

    return round(final_score, 2), reasons


def extract_safety_risk_score(
    category: str,
    title: str,
    description: str,
    severity: str,
) -> tuple[float, list[str], list[str]]:
    """Assess physical life-safety and environmental hazards."""
    combined = f"{title} {description}".lower()
    flags: list[str] = []
    reasons: list[str] = []
    score = 20.0  # baseline non-hazardous civic issue

    # Check category risk
    if category in SAFETY_HIGH_CATEGORIES:
        score = max(score, 85.0)
        flags.append("HIGH_RISK_CATEGORY")
        reasons.append(f"Category '{category}' carries inherent high public safety risk")
    elif category in SAFETY_MEDIUM_CATEGORIES:
        score = max(score, 50.0)
        flags.append("MODERATE_RISK_CATEGORY")

    # Keyword safety triggers
    detected_critical = [kw for kw in SAFETY_CRITICAL_KEYWORDS if kw in combined]
    if detected_critical:
        score = max(score, 90.0)
        flags.append("LIFE_SAFETY_CRITICAL")
        reasons.append(f"Direct physical hazard detected: {', '.join(detected_critical[:2])}")

    # Open manhole or falling hazard
    if "manhole" in combined or "drain cover" in combined or "pit" in combined:
        score = max(score, 80.0)
        flags.append("FALL_HAZARD")
        reasons.append("Uncovered chamber or pit presents immediate fall hazard")

    # Dark street with traffic
    dark_signals = "street lamp" in combined or "dark" in combined
    road_signals = "highway" in combined or "main road" in combined
    if dark_signals and road_signals:
        score = max(score, 65.0)
        flags.append("ROAD_SAFETY_HAZARD")
        reasons.append("Darkness on high-speed roadway impairs night-time vehicle visibility")

    return min(100.0, round(score, 2)), flags, reasons


def extract_impact_score(
    category: str,
    title: str,
    description: str,
    upvotes: int,
    location_context: dict[str, Any] | None,
) -> tuple[float, list[str]]:
    """Assess population affected, public disruption, and community interest."""
    combined = f"{title} {description}".lower()
    reasons: list[str] = []
    score = 30.0  # baseline impact

    # Transit or major thoroughfare
    transit_kws = ["arterial", "highway", "main road", "metro", "bus stand", "flyover"]
    if any(k in combined for k in transit_kws):
        score += 25.0
        reasons.append("Located on major transportation artery or transit node (+25 impact)")

    # Widespread utility shutdown
    wide_kws = ["entire area", "whole colony", "thousands", "ward-wide", "no drinking water"]
    if any(k in combined for k in wide_kws):
        score += 30.0
        reasons.append("Affects broad community population or residential sector (+30 impact)")

    # Upvotes engagement boost
    if upvotes > 0:
        upvote_boost = min(30.0, upvotes * 3.0)
        score += upvote_boost
        reasons.append(
            f"Corroborated by {upvotes} citizen upvotes (+{upvote_boost:.1f} community boost)"
        )

    # Context flags if present
    if location_context:
        if location_context.get("is_transit_hub"):
            score += 15.0
        if location_context.get("is_arterial_road"):
            score += 15.0

    return min(100.0, round(score, 2)), reasons


def extract_corroboration_score(
    reporter_trust: float | None,
    upvotes: int,
    corroboration_count: int,
) -> tuple[float, list[str]]:
    """Calculate multi-source verification score and citizen credibility."""
    reasons: list[str] = []
    trust = reporter_trust if reporter_trust is not None else 50.0

    # Base starts with scaled reporter trust
    base = trust * 0.5
    corrob_pts = 0.0

    total_confirmations = corroboration_count + (upvotes // 3)
    if total_confirmations >= 5:
        corrob_pts = 45.0
        reasons.append(
            f"Strong multi-citizen corroboration ({total_confirmations} confirmations, +45)"
        )
    elif total_confirmations >= 2:
        corrob_pts = 25.0
        reasons.append(
            f"Moderate multi-party verification ({total_confirmations} confirmations, +25)"
        )
    elif total_confirmations == 1:
        corrob_pts = 12.0
        reasons.append("Single corroborating confirmation recorded (+12)")

    if trust >= 80.0:
        reasons.append(f"Submitted by high-trust authenticated reporter ({trust:.0f}/100)")
    elif trust < 30.0:
        reasons.append(f"Reporter account has low historical trust profile ({trust:.0f}/100)")

    final_score = min(100.0, max(10.0, base + corrob_pts))
    return round(final_score, 2), reasons


def extract_age_score(age_hours: float) -> tuple[float, float, list[str]]:
    """Calculate SLA starvation prevention curve and time decay factor."""
    reasons: list[str] = []
    safe_hours = max(0.0, age_hours)

    if safe_hours < 2.0:
        score = 15.0
        decay = 1.0
        reasons.append("Newly reported incident (< 2 hours old)")
    elif safe_hours < 24.0:
        score = 35.0
        decay = 1.05
        reasons.append(f"Pending for {safe_hours:.1f} hours within initial response window")
    elif safe_hours < 72.0:
        score = 65.0
        decay = 1.15
        reasons.append(f"Pending for {safe_hours / 24.0:.1f} days without resolution (SLA warning)")
    elif safe_hours < 168.0:
        score = 85.0
        decay = 1.30
        days_str = f"{safe_hours / 24.0:.1f}"
        reasons.append(f"Long-pending unresolved issue ({days_str} days); starvation boost applied")
    else:
        score = 95.0
        decay = 1.45
        days_str = f"{safe_hours / 24.0:.1f}"
        reasons.append(
            f"Severely overdue ({days_str} days); maximum urgency escalation "
            f"(starvation prevention applied)"
        )

    return round(score, 2), round(decay, 2), reasons


def extract_location_context_score(
    location: dict[str, Any] | None,
    title: str,
    description: str,
    location_context: dict[str, Any] | None,
) -> tuple[float, list[str]]:
    """Evaluate spatial sensitivity (schools, hospitals, transit, expressways)."""
    combined = f"{title} {description}".lower()
    reasons: list[str] = []
    score = 30.0  # standard urban/suburban baseline

    # Explicit metadata flags
    ctx = location_context or {}
    is_hospital = ctx.get("is_hospital_zone") or bool(
        re.search(r"\b(hospital|clinic|emergency ward|dispensary)\b", combined)
    )
    is_school = ctx.get("is_school_zone") or bool(
        re.search(r"\b(school|college|kindergarten|campus)\b", combined)
    )
    is_transit = ctx.get("is_transit_hub") or bool(
        re.search(r"\b(metro station|railway|bus depot|bus terminal)\b", combined)
    )
    is_arterial = ctx.get("is_arterial_road") or bool(
        re.search(r"\b(highway|expressway|ring road|arterial road)\b", combined)
    )

    if is_hospital:
        score = max(score, 90.0)
        reasons.append("Located in hospital or emergency medical zone (+60 sensitivity)")
    elif is_school:
        score = max(score, 85.0)
        reasons.append("Adjacent to school or student pedestrian area (+55 sensitivity)")
    elif is_transit:
        score = max(score, 75.0)
        reasons.append("High-density public transit hub proximity (+45 sensitivity)")
    elif is_arterial:
        score = max(score, 70.0)
        reasons.append("High-speed vehicular arterial corridor (+40 sensitivity)")

    return min(100.0, round(score, 2)), reasons


def extract_priority_features(
    issue_id: str,
    title: str,
    description: str,
    category: str,
    severity: str,
    reporter_trust_score: float | None = None,
    location: dict[str, Any] | None = None,
    upvotes_count: int | None = 0,
    age_hours: float | None = 0.0,
    corroboration_count: int | None = 0,
    location_context: dict[str, Any] | None = None,
) -> ExtractedPriorityFeatures:
    """Extract all deterministic priority features with explainability reasons."""
    all_reasons: list[str] = []

    sev_score, sev_reasons = extract_severity_score(severity, title, description)
    all_reasons.extend(sev_reasons)

    safe_score, safe_flags, safe_reasons = extract_safety_risk_score(
        category, title, description, severity
    )
    all_reasons.extend(safe_reasons)

    impact_score, impact_reasons = extract_impact_score(
        category, title, description, upvotes_count or 0, location_context
    )
    all_reasons.extend(impact_reasons)

    corrob_score, corrob_reasons = extract_corroboration_score(
        reporter_trust_score, upvotes_count or 0, corroboration_count or 0
    )
    all_reasons.extend(corrob_reasons)

    age_score, time_decay, age_reasons = extract_age_score(age_hours or 0.0)
    all_reasons.extend(age_reasons)

    loc_score, loc_reasons = extract_location_context_score(
        location, title, description, location_context
    )
    all_reasons.extend(loc_reasons)

    evidence: dict[str, Any] = {
        "severity": {
            "score": sev_score,
            "input": severity,
        },
        "safety_risk": {
            "score": safe_score,
            "flags": safe_flags,
        },
        "impact": {
            "score": impact_score,
            "upvotes": upvotes_count or 0,
        },
        "corroboration": {
            "score": corrob_score,
            "reporter_trust": reporter_trust_score,
            "corroboration_count": corroboration_count or 0,
        },
        "age": {
            "score": age_score,
            "hours": age_hours or 0.0,
            "decay_factor": time_decay,
        },
        "location_context": {
            "score": loc_score,
            "has_coordinates": bool(location),
        },
    }

    return ExtractedPriorityFeatures(
        issue_id=issue_id,
        severity_score=sev_score,
        safety_risk_score=safe_score,
        impact_score=impact_score,
        corroboration_score=corrob_score,
        age_score=age_score,
        location_context_score=loc_score,
        time_decay_factor=time_decay,
        safety_hazard_flags=safe_flags,
        reasons=all_reasons,
        feature_evidence=evidence,
    )
