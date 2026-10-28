"""
Asset Decision Support Pydantic Schemas
Phase 54: Add Cost/Benefit Decision Support
"""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DecisionRecommendationEnum(str, Enum):
    REPLACE_REVIEW_RECOMMENDED = "REPLACE_REVIEW_RECOMMENDED"
    REHABILITATE_OR_OVERHAUL = "REHABILITATE_OR_OVERHAUL"
    CONTINUE_MAINTENANCE = "CONTINUE_MAINTENANCE"


class DecisionReasonCodeEnum(str, Enum):
    THRESHOLD_EXCEEDED = "THRESHOLD_EXCEEDED"
    NEAR_THRESHOLD_WARNING = "NEAR_THRESHOLD_WARNING"
    COST_EFFECTIVE_REPAIRS = "COST_EFFECTIVE_REPAIRS"
    EXCEEDED_DESIGN_LIFESPAN = "EXCEEDED_DESIGN_LIFESPAN"
    CHRONIC_FAILURE_COST_ACCELERATION = "CHRONIC_FAILURE_COST_ACCELERATION"
    SEVERE_CONDITION_WEAR = "SEVERE_CONDITION_WEAR"
    BUDGET_CAP_EXCEEDED = "BUDGET_CAP_EXCEEDED"


class CategoryPolicyThreshold(BaseModel):
    asset_type: str = Field(..., description="Taxonomic infrastructure category")
    replacement_threshold_ratio: float = Field(
        ..., ge=0.1, le=1.0, description="Repair-to-replacement cost ratio triggering replacement review"
    )
    warning_threshold_ratio: float = Field(
        ..., ge=0.05, le=0.95, description="Cost ratio triggering major overhaul warning"
    )
    baseline_replacement_cost_inr: float = Field(
        ..., ge=1000.0, description="Default capital replacement benchmark in INR"
    )
    annual_repair_budget_cap_inr: float | None = Field(
        default=None, ge=0.0, description="Optional annual maintenance budget cap in INR"
    )
    description: str = Field(default="", description="Policy context and municipal engineering standard")


class AssetDecisionInput(BaseModel):
    asset_id: str = Field(..., min_length=1, description="Unique asset identifier")
    asset_name: str | None = Field(default=None, description="Human readable asset name")
    asset_type: str = Field(default="OTHER", description="Asset category, e.g. ROAD_SEGMENT")
    cumulative_repair_cost_inr: float = Field(
        default=0.0, ge=0.0, description="Total historical maintenance and repair expenditure in INR"
    )
    estimated_replacement_cost_inr: float | None = Field(
        default=None, ge=1.0, description="Estimated capital reconstruction/replacement cost in INR"
    )
    current_condition_score: float = Field(
        default=100.0, ge=0.0, le=100.0, description="Current asset condition score (0-100)"
    )
    age_years: float | None = Field(default=None, ge=0.0, description="Operating service age in years")
    expected_lifespan_years: float | None = Field(
        default=None, ge=0.5, description="Expected design lifespan in years"
    )
    failure_count: int = Field(default=0, ge=0, description="Total recorded failure/repair events")
    annual_repair_cost_inr: float | None = Field(
        default=None, ge=0.0, description="Expenditures incurred in the past 12 months"
    )
    custom_threshold_ratio: float | None = Field(
        default=None, ge=0.1, le=1.0, description="Ad-hoc override for replacement threshold ratio"
    )
    custom_warning_ratio: float | None = Field(
        default=None, ge=0.05, le=0.95, description="Ad-hoc override for warning threshold ratio"
    )


class ExplainableFactor(BaseModel):
    factor: str
    weight: float = Field(..., ge=0.0, le=1.0)
    metric_value: str | float
    threshold_value: str | float
    description: str


class AssetDecisionResult(BaseModel):
    asset_id: str
    asset_name: str | None = None
    asset_type: str
    recommendation: DecisionRecommendationEnum
    cumulative_repair_cost_inr: float
    estimated_replacement_cost_inr: float
    repair_to_replacement_ratio: float = Field(
        ..., description="Calculated cumulative repair cost divided by estimated replacement cost"
    )
    applied_threshold_ratio: float = Field(
        ..., description="Replacement-review threshold ratio applied from policy"
    )
    warning_threshold_ratio: float = Field(
        ..., description="Overhaul warning threshold ratio applied from policy"
    )
    cost_headroom_inr: float = Field(
        ..., description="Expenditure headroom remaining before exceeding replacement threshold (negative = overrun)"
    )
    cost_overrun_inr: float = Field(
        default=0.0, description="Amount by which cumulative repairs exceed the replacement threshold (0 if within limit)"
    )
    reason_codes: list[DecisionReasonCodeEnum] = Field(default_factory=list)
    explanation: str = Field(..., description="Explainable narrative justifying the recommendation")
    contributing_factors: list[ExplainableFactor] = Field(default_factory=list)
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    is_authoritative: bool = Field(
        default=False, description="Always False; AI outputs are strictly non-authoritative advisory"
    )
    disclaimer: str = (
        "AI Decision Support Advisory • Non-Authoritative. Final capital replacement authorization rests "
        "with municipal finance and engineering directors."
    )
