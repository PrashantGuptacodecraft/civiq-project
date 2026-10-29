"""
Predictive Maintenance Pipeline Pydantic Schemas
Phase 52: Build Predictive Maintenance Baseline
"""

from enum import Enum

from pydantic import BaseModel, Field


class ReasonCodeEnum(str, Enum):
    HIGH_FAILURE_FREQUENCY = "HIGH_FAILURE_FREQUENCY"
    CHRONIC_RECURRENCE = "CHRONIC_RECURRENCE"
    EXCEEDED_DESIGN_LIFESPAN = "EXCEEDED_DESIGN_LIFESPAN"
    MAINTENANCE_OVERDUE = "MAINTENANCE_OVERDUE"
    RAPID_CONDITION_DEGRADATION = "RAPID_CONDITION_DEGRADATION"
    ELEVATED_DOWNTIME = "ELEVATED_DOWNTIME"
    HEALTHY_OPERATIONAL_BASELINE = "HEALTHY_OPERATIONAL_BASELINE"


class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class MaintenanceActionRecommendationEnum(str, Enum):
    ROUTINE_MONITORING = "ROUTINE_MONITORING"
    MAINTENANCE_REVIEW_RECOMMENDED = "MAINTENANCE_REVIEW_RECOMMENDED"


class AssetMaintenanceInput(BaseModel):
    asset_id: str = Field(..., min_length=1, description="Unique asset identifier")
    asset_name: str | None = Field(default=None, description="Human readable asset name")
    asset_type: str = Field(
        default="OTHER", description="Taxonomic asset type, e.g. ROAD_SEGMENT, STREETLIGHT"
    )
    installation_date: str | None = Field(default=None, description="ISO timestamp of installation")
    age_years: float | None = Field(default=None, ge=0.0, description="Operating age in years")
    expected_lifespan_years: float | None = Field(
        default=None, ge=0.5, description="Expected operational design lifespan"
    )
    current_condition_score: float = Field(
        default=100.0, ge=0.0, le=100.0, description="Latest condition score (0-100)"
    )
    failure_count: int = Field(
        default=0, ge=0, description="Total recorded failures/repairs over operating history"
    )
    recent_failure_count: int = Field(
        default=0, ge=0, description="Failures recorded within recent window (e.g. 90 days)"
    )
    total_downtime_hours: float = Field(
        default=0.0, ge=0.0, description="Cumulative outage downtime in hours"
    )
    days_since_last_maintenance: int | None = Field(
        default=None, ge=0, description="Days elapsed since last scheduled or emergency servicing"
    )
    mtbf_days: float | None = Field(
        default=None, ge=0.0, description="Mean time between failures in days"
    )
    past_expenditure_inr: float = Field(
        default=0.0, ge=0.0, description="Cumulative maintenance expenditure in INR"
    )


class ContributingFactor(BaseModel):
    factor: str
    weight: float = Field(..., ge=0.0, le=1.0)
    score: float = Field(..., ge=0.0, le=1.0)
    description: str


class PredictiveMaintenanceResult(BaseModel):
    asset_id: str
    asset_name: str | None = None
    asset_type: str
    risk_score: float = Field(
        ..., ge=0.0, le=1.0, description="Composite failure risk probability score (0.0 - 1.0)"
    )
    risk_level: RiskLevelEnum
    recommended_action: MaintenanceActionRecommendationEnum
    reason_codes: list[ReasonCodeEnum] = Field(default_factory=list)
    contributing_factors: list[ContributingFactor] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    is_authoritative: bool = Field(
        default=False,
        description="Always False; AI outputs are strictly non-authoritative advisory",
    )
    disclaimer: str = (
        "AI-generated risk advisory for decision support only. Maintenance review is recommended; "
        "final engineering authority rests with municipal department officers."
    )
