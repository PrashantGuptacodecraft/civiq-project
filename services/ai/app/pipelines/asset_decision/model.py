"""
Cost/Benefit Decision Support Engine
Phase 54: Add Cost/Benefit Decision Support
"""

from typing import List

from app.pipelines.asset_decision.policy import PolicyThresholdManager
from app.pipelines.asset_decision.schemas import (
    AssetDecisionInput,
    AssetDecisionResult,
    DecisionReasonCodeEnum,
    DecisionRecommendationEnum,
    ExplainableFactor,
)


class AssetDecisionModel:
    """Evaluates cumulative repair cost against policy replacement-review thresholds."""

    def __init__(self, policy_manager: PolicyThresholdManager | None = None) -> None:
        self.policy_manager = policy_manager or PolicyThresholdManager()

    def evaluate(self, asset: AssetDecisionInput) -> AssetDecisionResult:
        # 1. Resolve policy threshold and baseline replacement cost
        policy = self.policy_manager.get_threshold(asset.asset_type)

        replacement_cost = asset.estimated_replacement_cost_inr
        if replacement_cost is None or replacement_cost <= 0:
            replacement_cost = policy.baseline_replacement_cost_inr

        # Determine threshold ratios (custom override > policy)
        replacement_threshold_ratio = (
            asset.custom_threshold_ratio
            if asset.custom_threshold_ratio is not None
            else policy.replacement_threshold_ratio
        )
        warning_threshold_ratio = (
            asset.custom_warning_ratio
            if asset.custom_warning_ratio is not None
            else policy.warning_threshold_ratio
        )

        # 2. Compute cost ratios & headroom
        cumulative_repairs = round(asset.cumulative_repair_cost_inr, 2)
        ratio = round(cumulative_repairs / replacement_cost, 4)

        threshold_cost = round(replacement_cost * replacement_threshold_ratio, 2)
        warning_cost = round(replacement_cost * warning_threshold_ratio, 2)

        cost_headroom = round(threshold_cost - cumulative_repairs, 2)
        cost_overrun = round(max(0.0, cumulative_repairs - threshold_cost), 2)

        # 3. Analyze contextual variables (age wear, condition score, annual spend cap)
        is_past_lifespan = False
        if asset.age_years is not None and asset.expected_lifespan_years is not None:
            if asset.age_years >= asset.expected_lifespan_years:
                is_past_lifespan = True

        is_severe_condition = asset.current_condition_score < 40.0
        is_moderate_condition = asset.current_condition_score < 60.0

        is_budget_cap_exceeded = False
        if (
            asset.annual_repair_cost_inr is not None
            and policy.annual_repair_budget_cap_inr is not None
            and asset.annual_repair_cost_inr > policy.annual_repair_budget_cap_inr
        ):
            is_budget_cap_exceeded = True

        # 4. Formulate Recommendation & Reason Codes
        reason_codes: List[DecisionReasonCodeEnum] = []
        factors: List[ExplainableFactor] = []

        if ratio >= replacement_threshold_ratio or (
            ratio >= warning_threshold_ratio and is_past_lifespan and is_severe_condition
        ):
            recommendation = DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED
            reason_codes.append(DecisionReasonCodeEnum.THRESHOLD_EXCEEDED)

            factors.append(
                ExplainableFactor(
                    factor="Cumulative Repair-to-Replacement Ratio",
                    weight=0.55,
                    metric_value=f"{round(ratio * 100, 1)}%",
                    threshold_value=f"{round(replacement_threshold_ratio * 100, 1)}%",
                    description=(
                        f"Cumulative maintenance expenditure of ₹{cumulative_repairs:,.2f} "
                        f"has reached {round(ratio * 100, 1)}% of the ₹{replacement_cost:,.2f} "
                        f"replacement benchmark, exceeding the {round(replacement_threshold_ratio * 100, 1)}% policy ceiling."
                    ),
                )
            )
        elif ratio >= warning_threshold_ratio or is_severe_condition or is_budget_cap_exceeded:
            recommendation = DecisionRecommendationEnum.REHABILITATE_OR_OVERHAUL
            reason_codes.append(DecisionReasonCodeEnum.NEAR_THRESHOLD_WARNING)

            factors.append(
                ExplainableFactor(
                    factor="Elevated Repair Accumulation",
                    weight=0.45,
                    metric_value=f"{round(ratio * 100, 1)}%",
                    threshold_value=f"{round(warning_threshold_ratio * 100, 1)}%",
                    description=(
                        f"Cumulative repairs of ₹{cumulative_repairs:,.2f} represent {round(ratio * 100, 1)}% "
                        f"of replacement cost, approaching the capital replacement review horizon."
                    ),
                )
            )
        else:
            recommendation = DecisionRecommendationEnum.CONTINUE_MAINTENANCE
            reason_codes.append(DecisionReasonCodeEnum.COST_EFFECTIVE_REPAIRS)

            factors.append(
                ExplainableFactor(
                    factor="Cost-Effective Maintenance Window",
                    weight=0.50,
                    metric_value=f"{round(ratio * 100, 1)}%",
                    threshold_value=f"{round(warning_threshold_ratio * 100, 1)}%",
                    description=(
                        f"Cumulative repairs of ₹{cumulative_repairs:,.2f} ({round(ratio * 100, 1)}%) "
                        f"remain safely within the {round(warning_threshold_ratio * 100, 1)}% warning threshold. "
                        f"Continued preventative maintenance is economically viable."
                    ),
                )
            )

        # Additional contextual factors
        if is_past_lifespan:
            reason_codes.append(DecisionReasonCodeEnum.EXCEEDED_DESIGN_LIFESPAN)
            factors.append(
                ExplainableFactor(
                    factor="Operating Age vs Design Lifespan",
                    weight=0.20,
                    metric_value=f"{asset.age_years} years",
                    threshold_value=f"{asset.expected_lifespan_years} years",
                    description=(
                        f"Asset has reached {asset.age_years} operating years, exceeding its "
                        f"{asset.expected_lifespan_years}-year design life. Material fatigue accelerates repair costs."
                    ),
                )
            )

        if is_severe_condition or is_moderate_condition:
            reason_codes.append(DecisionReasonCodeEnum.SEVERE_CONDITION_WEAR)
            factors.append(
                ExplainableFactor(
                    factor="Structural Condition Wear",
                    weight=0.15,
                    metric_value=f"{asset.current_condition_score}/100",
                    threshold_value="60.0/100",
                    description=(
                        f"Current condition index ({asset.current_condition_score}/100) indicates physical distress "
                        f"diminishing return on localized repairs."
                    ),
                )
            )

        if asset.failure_count >= 4:
            reason_codes.append(DecisionReasonCodeEnum.CHRONIC_FAILURE_COST_ACCELERATION)
            factors.append(
                ExplainableFactor(
                    factor="Chronic Recurrence Rate",
                    weight=0.10,
                    metric_value=f"{asset.failure_count} failures",
                    threshold_value="4 failures",
                    description="Chronic recurrent failures drive rapid expenditure compounding.",
                )
            )

        if is_budget_cap_exceeded:
            reason_codes.append(DecisionReasonCodeEnum.BUDGET_CAP_EXCEEDED)
            factors.append(
                ExplainableFactor(
                    factor="Annual Budget Cap",
                    weight=0.15,
                    metric_value=f"₹{asset.annual_repair_cost_inr:,.2f}",
                    threshold_value=f"₹{policy.annual_repair_budget_cap_inr:,.2f}",
                    description="Past 12-month expenditures have breached the municipal category annual ceiling.",
                )
            )

        # 5. Build Explainable Narrative
        asset_label = asset.asset_name or f"Asset {asset.asset_id}"
        type_label = asset.asset_type.replace("_", " ").title()

        if recommendation == DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED:
            explanation = (
                f"Capital replacement review recommended for {asset_label} ({type_label}). "
                f"Cumulative repair expenditures of ₹{cumulative_repairs:,.2f} account for "
                f"{round(ratio * 100, 1)}% of the ₹{replacement_cost:,.2f} estimated replacement benchmark, "
                f"exceeding the municipal {round(replacement_threshold_ratio * 100, 1)}% policy ceiling by ₹{cost_overrun:,.2f}. "
                f"Continued localized repairs are no longer cost-effective; municipal engineering should prepare "
                f"a capital reconstruction budget proposal."
            )
        elif recommendation == DecisionRecommendationEnum.REHABILITATE_OR_OVERHAUL:
            explanation = (
                f"Comprehensive overhaul or rehabilitation recommended for {asset_label} ({type_label}). "
                f"Cumulative repairs of ₹{cumulative_repairs:,.2f} represent {round(ratio * 100, 1)}% "
                f"of replacement cost (approaching the {round(replacement_threshold_ratio * 100, 1)}% ceiling with "
                f"₹{cost_headroom:,.2f} headroom remaining). A planned major overhaul will arrest further degradation "
                f"more efficiently than ad-hoc emergency patches."
            )
        else:
            explanation = (
                f"Routine maintenance remains cost-effective for {asset_label} ({type_label}). "
                f"Cumulative repairs of ₹{cumulative_repairs:,.2f} remain at {round(ratio * 100, 1)}% "
                f"of the ₹{replacement_cost:,.2f} replacement benchmark, well below the "
                f"{round(warning_threshold_ratio * 100, 1)}% warning threshold (₹{cost_headroom:,.2f} headroom remaining). "
                f"Continue scheduled preventative servicing."
            )

        return AssetDecisionResult(
            asset_id=asset.asset_id,
            asset_name=asset.asset_name,
            asset_type=asset.asset_type,
            recommendation=recommendation,
            cumulative_repair_cost_inr=cumulative_repairs,
            estimated_replacement_cost_inr=replacement_cost,
            repair_to_replacement_ratio=ratio,
            applied_threshold_ratio=replacement_threshold_ratio,
            warning_threshold_ratio=warning_threshold_ratio,
            cost_headroom_inr=cost_headroom,
            cost_overrun_inr=cost_overrun,
            reason_codes=reason_codes,
            explanation=explanation,
            contributing_factors=factors,
            confidence=0.95,
            is_authoritative=False,
        )
