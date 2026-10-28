"""
Phase 54 Exit Checks: Asset Cost/Benefit Decision Support Tests
Validates cumulative repair cost vs replacement-review thresholds, policy-configured
thresholds per asset category, explainable recommendations, and FastAPI endpoints.
"""

from fastapi.testclient import TestClient

from app.main import app
from app.pipelines.asset_decision import (
    AssetDecisionInput,
    AssetDecisionModel,
    CategoryPolicyThreshold,
    DecisionReasonCodeEnum,
    DecisionRecommendationEnum,
    PolicyThresholdManager,
    get_asset_decision_model,
    get_policy_manager,
    reset_asset_decision_registry,
)

client = TestClient(app)


def setup_function() -> None:
    reset_asset_decision_registry()


def test_replace_review_recommended_when_cumulative_cost_exceeds_threshold() -> None:
    model = AssetDecisionModel()
    # Road segment default threshold is 0.60 (60%) with baseline replacement cost ₹5,000,000
    # Cumulative repairs: ₹3,200,000 -> Ratio = 64.0%
    asset = AssetDecisionInput(
        asset_id="ast-rd-01",
        asset_name="FC Road Arterial Km 2.4",
        asset_type="ROAD_SEGMENT",
        cumulative_repair_cost_inr=3_200_000.0,
        estimated_replacement_cost_inr=5_000_000.0,
        current_condition_score=42.0,
        age_years=5.5,
        expected_lifespan_years=7.0,
        failure_count=6,
    )

    result = model.evaluate(asset)

    assert result.recommendation == DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED
    assert result.repair_to_replacement_ratio == 0.64
    assert result.applied_threshold_ratio == 0.60
    assert result.cost_overrun_inr == 200_000.0  # ₹3,200,000 - ₹3,000,000
    assert result.cost_headroom_inr == -200_000.0
    assert DecisionReasonCodeEnum.THRESHOLD_EXCEEDED in result.reason_codes
    assert DecisionReasonCodeEnum.CHRONIC_FAILURE_COST_ACCELERATION in result.reason_codes
    assert "Capital replacement review recommended" in result.explanation
    assert "exceeding the municipal 60.0% policy ceiling by ₹200,000.00" in result.explanation
    assert result.is_authoritative is False
    assert "Non-Authoritative" in result.disclaimer


def test_rehabilitate_or_overhaul_when_near_warning_threshold() -> None:
    model = AssetDecisionModel()
    # Transformer default threshold is 0.50 (50%), warning threshold is 0.35 (35%), baseline ₹1,200,000
    # Repairs: ₹500,000 -> Ratio = 41.67% (between 35% and 50%)
    asset = AssetDecisionInput(
        asset_id="ast-tr-01",
        asset_name="Chinchwad Distribution Transformer TR-402",
        asset_type="ELECTRICAL_TRANSFORMER",
        cumulative_repair_cost_inr=500_000.0,
        estimated_replacement_cost_inr=1_200_000.0,
        current_condition_score=55.0,
        age_years=6.0,
        expected_lifespan_years=20.0,
        failure_count=3,
    )

    result = model.evaluate(asset)

    assert result.recommendation == DecisionRecommendationEnum.REHABILITATE_OR_OVERHAUL
    assert result.repair_to_replacement_ratio == 0.4167
    assert result.applied_threshold_ratio == 0.50
    assert result.warning_threshold_ratio == 0.35
    assert result.cost_overrun_inr == 0.0
    assert result.cost_headroom_inr > 0.0  # ₹600,000 - ₹500,000 = ₹100,000
    assert DecisionReasonCodeEnum.NEAR_THRESHOLD_WARNING in result.reason_codes
    assert "Comprehensive overhaul or rehabilitation recommended" in result.explanation


def test_continue_maintenance_when_repairs_cost_effective() -> None:
    model = AssetDecisionModel()
    # Streetlight default threshold is 0.70 (70%), warning threshold is 0.45 (45%), baseline ₹80,000
    # Cumulative repairs: ₹12,000 -> Ratio = 15.0%
    asset = AssetDecisionInput(
        asset_id="ast-sl-01",
        asset_name="Ferguson Gate Smart LED Pole",
        asset_type="STREETLIGHT",
        cumulative_repair_cost_inr=12_000.0,
        estimated_replacement_cost_inr=80_000.0,
        current_condition_score=92.0,
        age_years=1.2,
        expected_lifespan_years=5.0,
        failure_count=1,
    )

    result = model.evaluate(asset)

    assert result.recommendation == DecisionRecommendationEnum.CONTINUE_MAINTENANCE
    assert result.repair_to_replacement_ratio == 0.15
    assert result.applied_threshold_ratio == 0.70
    assert result.warning_threshold_ratio == 0.45
    assert result.cost_headroom_inr == 44_000.0  # ₹56,000 threshold - ₹12,000
    assert DecisionReasonCodeEnum.COST_EFFECTIVE_REPAIRS in result.reason_codes
    assert "Routine maintenance remains cost-effective" in result.explanation


def test_fallback_to_category_baseline_replacement_cost_when_omitted() -> None:
    model = AssetDecisionModel()
    # When estimated_replacement_cost_inr is None, water pipeline policy baseline ₹3,500,000 is used
    asset = AssetDecisionInput(
        asset_id="ast-wp-01",
        asset_type="WATER_PIPELINE",
        cumulative_repair_cost_inr=1_050_000.0,
        estimated_replacement_cost_inr=None,
    )

    result = model.evaluate(asset)

    assert result.estimated_replacement_cost_inr == 3_500_000.0
    assert result.repair_to_replacement_ratio == 0.30
    assert result.applied_threshold_ratio == 0.55  # Water pipeline replacement threshold


def test_exceeded_design_lifespan_and_severe_condition_escalation() -> None:
    model = AssetDecisionModel()
    # Culvert: warning 0.45, replacement 0.65.
    # Cumulative repairs ratio 0.46 (normally overhaul), but age 26 >= 25 lifespan AND condition 32 < 40
    # triggers accelerated capital replacement review!
    asset = AssetDecisionInput(
        asset_id="ast-culvert-01",
        asset_type="DRAINAGE_CULVERT",
        cumulative_repair_cost_inr=1_150_000.0,
        estimated_replacement_cost_inr=2_500_000.0,  # ratio = 0.46
        age_years=26.0,
        expected_lifespan_years=25.0,
        current_condition_score=32.0,
        failure_count=5,
    )

    result = model.evaluate(asset)

    assert result.recommendation == DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED
    assert DecisionReasonCodeEnum.EXCEEDED_DESIGN_LIFESPAN in result.reason_codes
    assert DecisionReasonCodeEnum.SEVERE_CONDITION_WEAR in result.reason_codes
    assert DecisionReasonCodeEnum.CHRONIC_FAILURE_COST_ACCELERATION in result.reason_codes


def test_annual_repair_budget_cap_exceeded() -> None:
    model = AssetDecisionModel()
    # Transformer annual cap is ₹400,000. Annual spend = ₹450,000.
    asset = AssetDecisionInput(
        asset_id="ast-tr-cap",
        asset_type="ELECTRICAL_TRANSFORMER",
        cumulative_repair_cost_inr=300_000.0,
        estimated_replacement_cost_inr=1_200_000.0,  # ratio 0.25 (normally continue maintenance)
        annual_repair_cost_inr=450_000.0,  # exceeds annual cap!
    )

    result = model.evaluate(asset)

    assert result.recommendation == DecisionRecommendationEnum.REHABILITATE_OR_OVERHAUL
    assert DecisionReasonCodeEnum.BUDGET_CAP_EXCEEDED in result.reason_codes


def test_custom_ad_hoc_threshold_overrides() -> None:
    model = AssetDecisionModel()
    asset = AssetDecisionInput(
        asset_id="ast-custom-01",
        asset_type="ROAD_SEGMENT",
        cumulative_repair_cost_inr=2_400_000.0,
        estimated_replacement_cost_inr=5_000_000.0,  # ratio 0.48
        custom_threshold_ratio=0.45,  # Stricter override: 45% instead of 60%
        custom_warning_ratio=0.30,
    )

    result = model.evaluate(asset)

    assert result.applied_threshold_ratio == 0.45
    assert result.warning_threshold_ratio == 0.30
    assert result.recommendation == DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED


def test_policy_manager_update_and_custom_category() -> None:
    policy_mgr = PolicyThresholdManager()
    model = AssetDecisionModel(policy_manager=policy_mgr)

    # Custom update for ROAD_SEGMENT: threshold tightened to 0.50
    custom_policy = CategoryPolicyThreshold(
        asset_type="ROAD_SEGMENT",
        replacement_threshold_ratio=0.50,
        warning_threshold_ratio=0.30,
        baseline_replacement_cost_inr=6_000_000.0,
        annual_repair_budget_cap_inr=1_200_000.0,
        description="PMC Smart City high-density road standard",
    )
    policy_mgr.set_threshold(custom_policy)

    asset = AssetDecisionInput(
        asset_id="ast-rd-tight",
        asset_type="ROAD_SEGMENT",
        cumulative_repair_cost_inr=3_100_000.0,
        estimated_replacement_cost_inr=6_000_000.0,  # ratio = 0.5167 (exceeds new 0.50)
    )

    result = model.evaluate(asset)
    assert result.applied_threshold_ratio == 0.50
    assert result.recommendation == DecisionRecommendationEnum.REPLACE_REVIEW_RECOMMENDED


def test_fastapi_evaluate_asset_decision_endpoint() -> None:
    payload = {
        "asset_id": "ast-api-01",
        "asset_name": "API Test Road Carriageway",
        "asset_type": "ROAD_SEGMENT",
        "cumulative_repair_cost_inr": 3_500_000.0,
        "estimated_replacement_cost_inr": 5_000_000.0,
        "current_condition_score": 48.0,
        "age_years": 4.5,
        "expected_lifespan_years": 7.0,
        "failure_count": 5,
    }

    response = client.post("/v1/asset-decision/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "ast-api-01"
    assert data["recommendation"] == "REPLACE_REVIEW_RECOMMENDED"
    assert data["repair_to_replacement_ratio"] == 0.70
    assert data["cost_overrun_inr"] == 500_000.0
    assert "THRESHOLD_EXCEEDED" in data["reason_codes"]
    assert len(data["contributing_factors"]) >= 1
    assert data["is_authoritative"] is False
    assert "Non-Authoritative" in data["disclaimer"]


def test_fastapi_batch_and_policy_endpoints() -> None:
    # 1. Batch evaluation endpoint
    batch_payload = {
        "assets": [
            {
                "asset_id": "ast-b1",
                "asset_type": "ROAD_SEGMENT",
                "cumulative_repair_cost_inr": 3_500_000.0,
                "estimated_replacement_cost_inr": 5_000_000.0,
            },
            {
                "asset_id": "ast-b2",
                "asset_type": "STREETLIGHT",
                "cumulative_repair_cost_inr": 10_000.0,
                "estimated_replacement_cost_inr": 80_000.0,
            },
        ]
    }
    batch_res = client.post("/v1/asset-decision/evaluate-batch", json=batch_payload)
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["total_evaluated"] == 2
    assert "REPLACE_REVIEW_RECOMMENDED" in batch_data["recommendations_summary"]
    assert "CONTINUE_MAINTENANCE" in batch_data["recommendations_summary"]

    # 2. Get policies endpoint
    policies_res = client.get("/v1/asset-decision/policies")
    assert policies_res.status_code == 200
    policies = policies_res.json()
    assert len(policies) >= 10
    types = [p["asset_type"] for p in policies]
    assert "ROAD_SEGMENT" in types
    assert "ELECTRICAL_TRANSFORMER" in types

    # 3. Update policy endpoint
    update_payload = {
        "replacement_threshold_ratio": 0.52,
        "warning_threshold_ratio": 0.32,
        "baseline_replacement_cost_inr": 5_500_000.0,
        "description": "Updated PMC Road Policy",
    }
    update_res = client.put("/v1/asset-decision/policies/ROAD_SEGMENT", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["replacement_threshold_ratio"] == 0.52
    assert updated_data["baseline_replacement_cost_inr"] == 5_500_000.0
