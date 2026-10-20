"""Explainable priority scoring engine with deterministic feature extraction.

Combines severity, safety risk, impact, corroboration, age, and location context
using configurable weights, explicit safety rules, and transparent explanations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

from app.pipelines.priority.features import (
    ExtractedPriorityFeatures,
    extract_priority_features,
)


@dataclass
class PriorityWeights:
    """Configurable weights for priority components (must sum to 1.0 when normalized)."""

    severity: float = 0.25
    safety_risk: float = 0.25
    impact: float = 0.20
    corroboration: float = 0.10
    age: float = 0.10
    location_context: float = 0.10

    def normalized_dict(self) -> dict[str, float]:
        """Return normalized weights summing strictly to 1.0."""
        total = (
            self.severity
            + self.safety_risk
            + self.impact
            + self.corroboration
            + self.age
            + self.location_context
        )
        if total <= 0:
            return {
                "severity": 0.25,
                "safety_risk": 0.25,
                "impact": 0.20,
                "corroboration": 0.10,
                "age": 0.10,
                "location_context": 0.10,
            }
        return {
            "severity": round(self.severity / total, 4),
            "safety_risk": round(self.safety_risk / total, 4),
            "impact": round(self.impact / total, 4),
            "corroboration": round(self.corroboration / total, 4),
            "age": round(self.age / total, 4),
            "location_context": round(self.location_context / total, 4),
        }


@dataclass
class IssuePriorityInput:
    """Input payload for priority evaluation."""

    issue_id: str
    title: str
    description: str
    category: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    reporter_trust_score: float | None = None
    location: dict[str, Any] | None = None
    upvotes_count: int | None = 0
    age_hours: float | None = 0.0
    corroboration_count: int | None = 0
    location_context: dict[str, Any] | None = None


@dataclass
class PriorityCalculationResult:
    """Complete transparent priority decision output."""

    issue_id: str
    priority_score: float
    priority_tier: Literal["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"]
    recommended_sla_hours: int
    hazard_score: float
    impact_radius_score: float
    vulnerability_score: float
    time_decay_factor: float
    safety_risk_score: float
    impact_score: float
    corroboration_score: float
    age_score: float
    location_context_score: float
    reasons: list[str] = field(default_factory=list)
    rules_triggered: list[str] = field(default_factory=list)
    decision_evidence: dict[str, Any] = field(default_factory=dict)


class BasePriorityEngine(ABC):
    """Abstract interface for priority scoring engines."""

    @abstractmethod
    def calculate_priority(
        self,
        payload: IssuePriorityInput,
    ) -> PriorityCalculationResult:
        """Calculate priority score and explainability reasons for an issue."""
        pass


class RuleBasedPriorityEngine(BasePriorityEngine):
    """Deterministic, explainable rule-based priority engine with configurable weights."""

    P1_THRESHOLD = 80.0
    P2_THRESHOLD = 60.0
    P3_THRESHOLD = 40.0

    SLA_HOURS = {
        "P1_CRITICAL": 4,
        "P2_HIGH": 24,
        "P3_MEDIUM": 72,
        "P4_LOW": 168,
    }

    def __init__(self, weights: PriorityWeights | None = None) -> None:
        self.weights = weights or PriorityWeights()

    def calculate_priority(
        self,
        payload: IssuePriorityInput,
    ) -> PriorityCalculationResult:
        features: ExtractedPriorityFeatures = extract_priority_features(
            issue_id=payload.issue_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            severity=payload.severity,
            reporter_trust_score=payload.reporter_trust_score,
            location=payload.location,
            upvotes_count=payload.upvotes_count,
            age_hours=payload.age_hours,
            corroboration_count=payload.corroboration_count,
            location_context=payload.location_context,
        )

        w = self.weights.normalized_dict()

        # Weighted composite score
        base_score = (
            features.severity_score * w["severity"]
            + features.safety_risk_score * w["safety_risk"]
            + features.impact_score * w["impact"]
            + features.corroboration_score * w["corroboration"]
            + features.age_score * w["age"]
            + features.location_context_score * w["location_context"]
        )

        # Apply time decay
        decayed_score = base_score * features.time_decay_factor
        final_score = decayed_score
        rules_triggered: list[str] = []

        # Rule 1: Immediate life safety critical override
        if features.safety_risk_score >= 90.0 and payload.severity == "CRITICAL":
            if final_score < 85.0:
                final_score = 85.0
                rule_desc = (
                    "Life-safety critical override triggered: physical safety hazard >= 90 "
                    "with CRITICAL severity guarantees P1 tier (score floored to 85.0)."
                )
                rules_triggered.append(rule_desc)
                features.reasons.append(rule_desc)

        # Rule 2: Sensitive institutional zone safety escalation
        ctx = payload.location_context or {}
        is_sensitive = ctx.get("is_hospital_zone") or ctx.get("is_school_zone")
        if is_sensitive and features.safety_risk_score >= 65.0:
            if final_score < 70.0:
                final_score = 70.0
                rule_desc = (
                    "Institutional zone safety escalation: hazard near hospital/school "
                    "escalated priority to minimum 70.0."
                )
                rules_triggered.append(rule_desc)
                features.reasons.append(rule_desc)

        # Rule 3: Starvation prevention for long-overdue issues (>7 days)
        if (payload.age_hours or 0.0) >= 168.0:
            if final_score < 60.0:
                final_score = 60.0
                rule_desc = (
                    "SLA starvation prevention: unresolved issue older than 7 days "
                    "floored to P2 tier (60.0) to ensure officer attention."
                )
                rules_triggered.append(rule_desc)
                features.reasons.append(rule_desc)

        clamped_score = round(min(100.0, max(0.0, final_score)), 2)

        # Tier assignment
        if clamped_score >= self.P1_THRESHOLD:
            tier: Literal["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"] = "P1_CRITICAL"
        elif clamped_score >= self.P2_THRESHOLD:
            tier = "P2_HIGH"
        elif clamped_score >= self.P3_THRESHOLD:
            tier = "P3_MEDIUM"
        else:
            tier = "P4_LOW"

        sla = self.SLA_HOURS[tier]

        evidence: dict[str, Any] = {
            "weights": w,
            "subscores": {
                "severity": features.severity_score,
                "safety_risk": features.safety_risk_score,
                "impact": features.impact_score,
                "corroboration": features.corroboration_score,
                "age": features.age_score,
                "location_context": features.location_context_score,
            },
            "time_decay_factor": features.time_decay_factor,
            "base_score": round(base_score, 2),
            "decayed_score": round(decayed_score, 2),
            "final_score": clamped_score,
            "rules_triggered": rules_triggered,
            "feature_details": features.feature_evidence,
        }

        # Backwards compatible mapping:
        # hazard_score -> severity
        # impact_radius_score -> impact
        # vulnerability_score -> safety_risk
        return PriorityCalculationResult(
            issue_id=payload.issue_id,
            priority_score=clamped_score,
            priority_tier=tier,
            recommended_sla_hours=sla,
            hazard_score=features.severity_score,
            impact_radius_score=features.impact_score,
            vulnerability_score=features.safety_risk_score,
            time_decay_factor=features.time_decay_factor,
            safety_risk_score=features.safety_risk_score,
            impact_score=features.impact_score,
            corroboration_score=features.corroboration_score,
            age_score=features.age_score,
            location_context_score=features.location_context_score,
            reasons=features.reasons,
            rules_triggered=rules_triggered,
            decision_evidence=evidence,
        )
