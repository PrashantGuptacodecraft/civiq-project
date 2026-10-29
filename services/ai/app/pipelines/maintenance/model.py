"""
Predictive Maintenance Baseline Risk Model
Phase 52: Build Predictive Maintenance Baseline

Evaluates failure frequency, operating age, maintenance history, and recurrence
to produce an explainable risk score and reason codes.
Enforces non-authoritative advisory: recommendations are strictly 'maintenance review recommended',
never automated replacement orders.
"""

from datetime import datetime, timezone

from .schemas import (
    AssetMaintenanceInput,
    ContributingFactor,
    MaintenanceActionRecommendationEnum,
    PredictiveMaintenanceResult,
    ReasonCodeEnum,
    RiskLevelEnum,
)

# Standard municipal design lifespans (in years) by asset category
DEFAULT_ASSET_LIFESPANS: dict[str, float] = {
    "ROAD_SEGMENT": 7.0,
    "STREETLIGHT": 5.0,
    "ELECTRICAL_TRANSFORMER": 20.0,
    "DRAINAGE_CULVERT": 25.0,
    "STORM_DRAIN": 20.0,
    "WATER_PIPELINE": 25.0,
    "WATER_VALVE": 10.0,
    "WATER_PUMP": 8.0,
    "COMMUNITY_TOILET": 12.0,
    "WASTE_STATION": 10.0,
    "TRAFFIC_SIGNAL": 8.0,
    "PARK_INFRASTRUCTURE": 10.0,
    "OTHER": 10.0,
}


class PredictiveMaintenanceModel:
    """
    Composite domain-driven risk model calculating breakdown probability
    across failure recurrence, operational wear, maintenance deficit, and physical condition.
    """

    def __init__(
        self,
        w_failure: float = 0.35,
        w_age: float = 0.25,
        w_maintenance_lag: float = 0.20,
        w_condition: float = 0.20,
    ) -> None:
        self.w_failure = w_failure
        self.w_age = w_age
        self.w_maintenance_lag = w_maintenance_lag
        self.w_condition = w_condition

    def _estimate_age_years(self, asset: AssetMaintenanceInput) -> float:
        if asset.age_years is not None:
            return max(0.0, float(asset.age_years))

        if asset.installation_date:
            try:
                # Handle ISO timestamps with or without timezone
                inst_str = asset.installation_date.replace("Z", "+00:00")
                inst_dt = datetime.fromisoformat(inst_str)
                if inst_dt.tzinfo is None:
                    inst_dt = inst_dt.replace(tzinfo=timezone.utc)
                now_dt = datetime.now(timezone.utc)
                delta_days = (now_dt - inst_dt).total_seconds() / 86400.0
                return max(0.0, round(delta_days / 365.25, 2))
            except Exception:
                pass

        return 3.0  # Default assumption if unspecified

    def _get_expected_lifespan(self, asset: AssetMaintenanceInput) -> float:
        if asset.expected_lifespan_years is not None and asset.expected_lifespan_years > 0:
            return float(asset.expected_lifespan_years)
        return DEFAULT_ASSET_LIFESPANS.get(asset.asset_type.upper(), 10.0)

    def predict(self, asset: AssetMaintenanceInput) -> PredictiveMaintenanceResult:
        factors: list[ContributingFactor] = []
        reason_codes: list[ReasonCodeEnum] = []

        # ─── 1. Failure Frequency & Recurrence Subscore (Weight: 0.35) ───
        if asset.recent_failure_count >= 3:
            failure_score = 1.00
            desc = (
                f"Critical chronic recurrence: {asset.recent_failure_count} repeat failures "
                "in recent operational window"
            )
            reason_codes.append(ReasonCodeEnum.CHRONIC_RECURRENCE)
        elif asset.recent_failure_count >= 2:
            failure_score = 0.85
            desc = (
                f"Elevated recurrence: {asset.recent_failure_count} "
                "recent repeated failures detected"
            )
            reason_codes.append(ReasonCodeEnum.CHRONIC_RECURRENCE)
        elif asset.failure_count >= 5:
            failure_score = 0.80
            desc = f"High historical failure volume: {asset.failure_count} total repairs recorded"
            reason_codes.append(ReasonCodeEnum.HIGH_FAILURE_FREQUENCY)
        elif asset.failure_count >= 3:
            failure_score = 0.60
            desc = f"Moderate failure history: {asset.failure_count} recorded interventions"
            reason_codes.append(ReasonCodeEnum.HIGH_FAILURE_FREQUENCY)
        elif asset.failure_count >= 1:
            failure_score = 0.30
            desc = f"Isolated past failure: {asset.failure_count} repair on record"
        else:
            failure_score = 0.05
            desc = "Zero recorded breakdown incidents"

        factors.append(
            ContributingFactor(
                factor="Failure Frequency & Recurrence",
                weight=self.w_failure,
                score=failure_score,
                description=desc,
            )
        )

        # ─── 2. Asset Lifecycle Age & Wear Subscore (Weight: 0.25) ───
        age_years = self._estimate_age_years(asset)
        lifespan_years = self._get_expected_lifespan(asset)
        age_ratio = age_years / lifespan_years

        if age_ratio >= 1.0:
            age_score = 1.00
            desc = (
                f"Exceeded design life: {age_years} years operating "
                f"(design: {lifespan_years} yrs, {round(age_ratio * 100)}% wear)"
            )
            reason_codes.append(ReasonCodeEnum.EXCEEDED_DESIGN_LIFESPAN)
        elif age_ratio >= 0.80:
            age_score = 0.75
            desc = (
                f"Nearing end of design life: {age_years} / {lifespan_years} yrs "
                f"({round(age_ratio * 100)}%)"
            )
        elif age_ratio >= 0.50:
            age_score = 0.45
            desc = (
                f"Mid-lifecycle operating age: {age_years} / {lifespan_years} yrs "
                f"({round(age_ratio * 100)}%)"
            )
        else:
            age_score = max(0.05, round(age_ratio * 0.4, 2))
            desc = (
                f"Early lifecycle operating age: {age_years} / {lifespan_years} yrs "
                f"({round(age_ratio * 100)}%)"
            )

        factors.append(
            ContributingFactor(
                factor="Asset Lifecycle Age & Wear",
                weight=self.w_age,
                score=age_score,
                description=desc,
            )
        )

        # ─── 3. Maintenance Deficit & Servicing Lag (Weight: 0.20) ───
        days_lag = asset.days_since_last_maintenance
        if days_lag is not None:
            if days_lag >= 365:
                maint_score = 1.00
                desc = (
                    f"Severe maintenance lag: {days_lag} days since "
                    "last recorded servicing (> 1 year)"
                )
                reason_codes.append(ReasonCodeEnum.MAINTENANCE_OVERDUE)
            elif days_lag >= 180:
                maint_score = 0.70
                desc = (
                    f"Overdue for scheduled servicing: {days_lag} days "
                    "elapsed without preventive check"
                )
                reason_codes.append(ReasonCodeEnum.MAINTENANCE_OVERDUE)
            elif days_lag >= 90:
                maint_score = 0.35
                desc = f"Moderate maintenance interval: {days_lag} days since last inspection"
            else:
                maint_score = 0.10
                desc = f"Recently serviced: {days_lag} days ago"
        else:
            # If never maintained but asset is older than 1 year
            if age_years >= 1.0:
                maint_score = 0.65
                desc = f"No recorded preventive maintenance history for asset aged {age_years} yrs"
                reason_codes.append(ReasonCodeEnum.MAINTENANCE_OVERDUE)
            else:
                maint_score = 0.10
                desc = "Recent commissioning baseline, within initial maintenance grace window"

        factors.append(
            ContributingFactor(
                factor="Maintenance Deficit & Servicing Lag",
                weight=self.w_maintenance_lag,
                score=maint_score,
                description=desc,
            )
        )

        # ─── 4. Physical Condition & Degradation Subscore (Weight: 0.20) ───
        condition = asset.current_condition_score

        if condition < 40.0:
            cond_score = 1.00
            desc = f"Severe physical degradation: condition score {round(condition)}/100"
            reason_codes.append(ReasonCodeEnum.RAPID_CONDITION_DEGRADATION)
        elif condition < 60.0:
            cond_score = 0.75
            desc = f"Substantial wear observed: condition score {round(condition)}/100"
            reason_codes.append(ReasonCodeEnum.RAPID_CONDITION_DEGRADATION)
        elif condition < 80.0:
            cond_score = 0.40
            desc = f"Moderate operating wear: condition score {round(condition)}/100"
        else:
            cond_score = 0.10
            desc = f"Good physical condition: {round(condition)}/100"

        factors.append(
            ContributingFactor(
                factor="Physical Condition & Degradation",
                weight=self.w_condition,
                score=cond_score,
                description=desc,
            )
        )

        # ─── Downtime Special Assessment ───
        if asset.total_downtime_hours >= 20.0:
            reason_codes.append(ReasonCodeEnum.ELEVATED_DOWNTIME)

        # ─── Composite Risk Score Calculation ───
        raw_risk = (
            self.w_failure * failure_score
            + self.w_age * age_score
            + self.w_maintenance_lag * maint_score
            + self.w_condition * cond_score
        )
        risk_score = round(max(0.05, min(0.99, raw_risk)), 2)

        # Categorize risk level
        if risk_score >= 0.75:
            risk_level = RiskLevelEnum.CRITICAL
        elif risk_score >= 0.55:
            risk_level = RiskLevelEnum.HIGH
        elif risk_score >= 0.30:
            risk_level = RiskLevelEnum.MEDIUM
        else:
            risk_level = RiskLevelEnum.LOW

        # Recommended Action: strictly non-authoritative
        # Always 'MAINTENANCE_REVIEW_RECOMMENDED' when risk is elevated (never replacement)
        if risk_score >= 0.30:
            recommended_action = MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED
        else:
            recommended_action = MaintenanceActionRecommendationEnum.ROUTINE_MONITORING

        # If healthy baseline and no flags
        if not reason_codes:
            reason_codes.append(ReasonCodeEnum.HEALTHY_OPERATIONAL_BASELINE)

        # Confidence: higher when more empirical data points are provided
        confidence = 0.85
        if asset.days_since_last_maintenance is not None and asset.installation_date is not None:
            confidence = 0.92
        elif asset.failure_count == 0 and asset.age_years is None:
            confidence = 0.75

        return PredictiveMaintenanceResult(
            asset_id=asset.asset_id,
            asset_name=asset.asset_name,
            asset_type=asset.asset_type,
            risk_score=risk_score,
            risk_level=risk_level,
            recommended_action=recommended_action,
            reason_codes=reason_codes,
            contributing_factors=factors,
            confidence=confidence,
            is_authoritative=False,
            disclaimer=(
                "AI-generated risk advisory for decision support only. Maintenance review is "
                "recommended; final engineering authority rests with municipal department officers."
            ),
        )
