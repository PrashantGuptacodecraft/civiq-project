"""
Policy-Configured Thresholds for Municipal Infrastructure Categories
Phase 54: Add Cost/Benefit Decision Support
"""

import copy
from typing import Dict

from app.pipelines.asset_decision.schemas import CategoryPolicyThreshold

# Municipal Engineering Standards & Economic Life-Cycle Benchmarks (INR)
DEFAULT_CATEGORY_POLICY_THRESHOLDS: Dict[str, CategoryPolicyThreshold] = {
    "ROAD_SEGMENT": CategoryPolicyThreshold(
        asset_type="ROAD_SEGMENT",
        replacement_threshold_ratio=0.60,
        warning_threshold_ratio=0.40,
        baseline_replacement_cost_inr=5_000_000.0,  # 50 Lakhs per km standard carriageway
        annual_repair_budget_cap_inr=1_500_000.0,
        description=(
            "IRC:37 standard arterial/collector road wearing course reconstruction threshold"
        ),
    ),
    "ELECTRICAL_TRANSFORMER": CategoryPolicyThreshold(
        asset_type="ELECTRICAL_TRANSFORMER",
        replacement_threshold_ratio=0.50,
        warning_threshold_ratio=0.35,
        baseline_replacement_cost_inr=1_200_000.0,  # 12 Lakhs 250kVA distribution transformer
        annual_repair_budget_cap_inr=400_000.0,
        description="CEA standard distribution transformer rewinding & core replacement ceiling",
    ),
    "DRAINAGE_CULVERT": CategoryPolicyThreshold(
        asset_type="DRAINAGE_CULVERT",
        replacement_threshold_ratio=0.65,
        warning_threshold_ratio=0.45,
        baseline_replacement_cost_inr=2_500_000.0,  # 25 Lakhs box culvert reconstruction
        annual_repair_budget_cap_inr=700_000.0,
        description="CPHEEO stormwater cross-drainage structural rehabilitation benchmark",
    ),
    "STORM_DRAIN": CategoryPolicyThreshold(
        asset_type="STORM_DRAIN",
        replacement_threshold_ratio=0.65,
        warning_threshold_ratio=0.45,
        baseline_replacement_cost_inr=1_800_000.0,
        annual_repair_budget_cap_inr=500_000.0,
        description="Storm drain line desilting and civil lining overhaul threshold",
    ),
    "WATER_PIPELINE": CategoryPolicyThreshold(
        asset_type="WATER_PIPELINE",
        replacement_threshold_ratio=0.55,
        warning_threshold_ratio=0.35,
        baseline_replacement_cost_inr=3_500_000.0,  # 35 Lakhs DI/HDPE pipeline corridor
        annual_repair_budget_cap_inr=1_000_000.0,
        description="Non-revenue water mitigation & ductile iron trunk line replacement trigger",
    ),
    "WATER_VALVE": CategoryPolicyThreshold(
        asset_type="WATER_VALVE",
        replacement_threshold_ratio=0.60,
        warning_threshold_ratio=0.40,
        baseline_replacement_cost_inr=300_000.0,
        annual_repair_budget_cap_inr=100_000.0,
        description=(
            "Sluice/butterfly pressure regulation valve mechanical life replacement threshold"
        ),
    ),
    "STREETLIGHT": CategoryPolicyThreshold(
        asset_type="STREETLIGHT",
        replacement_threshold_ratio=0.70,
        warning_threshold_ratio=0.45,
        baseline_replacement_cost_inr=80_000.0,  # 80k smart octagonal LED pole
        annual_repair_budget_cap_inr=30_000.0,
        description="Municipal public lighting pole and smart luminaire retrofit threshold",
    ),
    "COMMUNITY_TOILET": CategoryPolicyThreshold(
        asset_type="COMMUNITY_TOILET",
        replacement_threshold_ratio=0.55,
        warning_threshold_ratio=0.35,
        baseline_replacement_cost_inr=1_500_000.0,
        annual_repair_budget_cap_inr=400_000.0,
        description="Swachh Bharat municipal public sanitation facility refurbishment limit",
    ),
    "WASTE_STATION": CategoryPolicyThreshold(
        asset_type="WASTE_STATION",
        replacement_threshold_ratio=0.60,
        warning_threshold_ratio=0.40,
        baseline_replacement_cost_inr=2_000_000.0,
        annual_repair_budget_cap_inr=600_000.0,
        description="Compactor and solid waste intermediate transfer station overhaul threshold",
    ),
    "TRAFFIC_SIGNAL": CategoryPolicyThreshold(
        asset_type="TRAFFIC_SIGNAL",
        replacement_threshold_ratio=0.60,
        warning_threshold_ratio=0.40,
        baseline_replacement_cost_inr=600_000.0,
        annual_repair_budget_cap_inr=180_000.0,
        description="Automated junction signaling and sensor pole renewal threshold",
    ),
    "PARK_INFRASTRUCTURE": CategoryPolicyThreshold(
        asset_type="PARK_INFRASTRUCTURE",
        replacement_threshold_ratio=0.65,
        warning_threshold_ratio=0.45,
        baseline_replacement_cost_inr=800_000.0,
        annual_repair_budget_cap_inr=250_000.0,
        description="Public recreation facilities, fencing, and equipment replacement threshold",
    ),
    "OTHER": CategoryPolicyThreshold(
        asset_type="OTHER",
        replacement_threshold_ratio=0.60,
        warning_threshold_ratio=0.40,
        baseline_replacement_cost_inr=1_000_000.0,
        annual_repair_budget_cap_inr=300_000.0,
        description="Default municipal general infrastructure cost-benefit threshold",
    ),
}


class PolicyThresholdManager:
    """Manages policy-configured replacement-review thresholds per asset category."""

    def __init__(self) -> None:
        self._thresholds: Dict[str, CategoryPolicyThreshold] = copy.deepcopy(
            DEFAULT_CATEGORY_POLICY_THRESHOLDS
        )

    def get_threshold(self, asset_type: str) -> CategoryPolicyThreshold:
        normalized = asset_type.upper().strip()
        if normalized in self._thresholds:
            return self._thresholds[normalized]
        return self._thresholds["OTHER"]

    def set_threshold(self, threshold: CategoryPolicyThreshold) -> None:
        normalized = threshold.asset_type.upper().strip()
        self._thresholds[normalized] = threshold

    def list_all(self) -> Dict[str, CategoryPolicyThreshold]:
        return copy.deepcopy(self._thresholds)

    def reset_defaults(self) -> None:
        self._thresholds = copy.deepcopy(DEFAULT_CATEGORY_POLICY_THRESHOLDS)
