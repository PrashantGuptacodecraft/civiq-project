"""
Resource Matching Pydantic Schemas
Phase 65: Build need-to-resource matching
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class MatchFactorScore(BaseModel):
    """Component score breakdown for deterministic explainability."""

    factor: str = Field(..., description="Evaluation factor name (e.g. distance, capacity)")
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized factor score between 0 and 1")
    weight: float = Field(..., ge=0.0, le=1.0, description="Relative weight of this factor")
    weighted_score: float = Field(..., ge=0.0, description="Weighted contribution to overall score")
    detail: str = Field(..., description="Explainable description of the factor evaluation")


class ResourceMatchResult(BaseModel):
    """Ranked match result for a single candidate resource."""

    resource_id: str = Field(..., description="Unique resource identifier")
    title: str = Field(..., description="Resource name or facility title")
    resource_type: str = Field(..., description="Resource taxonomy category")
    match_score: float = Field(..., ge=0.0, le=100.0, description="Deterministic match score 0-100")
    rank: int = Field(..., ge=1, description="Rank ordered by match score and distance")
    distance_km: float = Field(..., ge=0.0, description="Geodesic distance to need in kilometers")
    capacity_fit: Literal["EXCEEDS_REQUIREMENT", "EXACT_FIT", "PARTIAL_FIT", "ZERO_CAPACITY"] = (
        Field(..., description="Capacity fit evaluation category")
    )
    is_eligible: bool = Field(..., description="Whether the resource meets minimum criteria")
    ineligibility_reasons: list[str] = Field(
        default_factory=list, description="Reasons if resource is deemed ineligible"
    )
    factor_breakdown: list[MatchFactorScore] = Field(
        default_factory=list, description="Detailed score component breakdown"
    )
    recommendation_summary: str = Field(
        ..., description="Human-readable match justification for disaster coordinators"
    )


class NeedMatchInput(BaseModel):
    """Need request payload for deterministic resource matching."""

    need_id: str = Field(..., description="Unique need request identifier")
    need_type: str = Field(
        ...,
        description=(
            "Type of need: BOAT_EVACUATION, SHELTER_ACCOMMODATION, "
            "DRINKING_WATER, FOOD_RATIONS, MEDICAL_AID, etc."
        ),
    )
    required_quantity: float = Field(
        default=1.0, ge=0.0, description="Required quantity or number of persons"
    )
    unit: str = Field(default="UNITS", description="Unit of measurement, e.g. PERSONS, MEALS")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of need location")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of need location")
    severity: str = Field(
        default="HIGH_URGENT",
        description="Severity: CRITICAL_LIFE_SAFETY, HIGH_URGENT, MEDIUM_OPERATIONAL, LOW_ADVISORY",
    )
    jurisdiction_id: str | None = Field(
        default=None, description="Optional jurisdiction filter, e.g. mh-pune-pmc"
    )
    max_distance_km: float = Field(
        default=50.0, ge=1.0, description="Maximum search radius in kilometers"
    )
    candidate_resources: list[dict[str, Any]] = Field(
        default_factory=list, description="Candidate resources to evaluate"
    )
