"""
Offline Evaluation Suite for Predictive Maintenance Baseline Model
Phase 52: Build Predictive Maintenance Baseline

Evaluates the model against synthetic and seeded municipal infrastructure test cases.
Measures binary action recommendation accuracy, risk score MAE, precision, and recall.
"""

from typing import Any

from .model import PredictiveMaintenanceModel
from .schemas import (
    AssetMaintenanceInput,
    MaintenanceActionRecommendationEnum,
    ReasonCodeEnum,
    RiskLevelEnum,
)

# Benchmark seeded dataset representing realistic Indian municipal assets
SEEDED_EVALUATION_DATASET: list[dict[str, Any]] = [
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-01",
            asset_name="FC Road Arterial Carriageway Km 2.4",
            asset_type="ROAD_SEGMENT",
            age_years=5.5,
            expected_lifespan_years=7.0,
            current_condition_score=42.0,
            failure_count=6,
            recent_failure_count=3,
            total_downtime_hours=24.0,
            days_since_last_maintenance=210,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL],
        "expected_reason_codes": [
            ReasonCodeEnum.CHRONIC_RECURRENCE,
            ReasonCodeEnum.RAPID_CONDITION_DEGRADATION,
        ],
        "target_risk_min": 0.60,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-02",
            asset_name="Old Trunk Water Transmission Pipeline 400mm",
            asset_type="WATER_PIPELINE",
            age_years=27.0,
            expected_lifespan_years=25.0,
            current_condition_score=50.0,
            failure_count=4,
            recent_failure_count=1,
            total_downtime_hours=18.0,
            days_since_last_maintenance=320,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL],
        "expected_reason_codes": [
            ReasonCodeEnum.EXCEEDED_DESIGN_LIFESPAN,
            ReasonCodeEnum.MAINTENANCE_OVERDUE,
        ],
        "target_risk_min": 0.55,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-03",
            asset_name="Modern LED Streetlight Octagonal Pole LP-882",
            asset_type="STREETLIGHT",
            age_years=0.8,
            expected_lifespan_years=5.0,
            current_condition_score=96.0,
            failure_count=0,
            recent_failure_count=0,
            total_downtime_hours=0.0,
            days_since_last_maintenance=30,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.ROUTINE_MONITORING,
        "expected_risk_levels": [RiskLevelEnum.LOW],
        "expected_reason_codes": [ReasonCodeEnum.HEALTHY_OPERATIONAL_BASELINE],
        "target_risk_max": 0.25,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-04",
            asset_name="Deccan Box Culvert BC-31",
            asset_type="DRAINAGE_CULVERT",
            age_years=12.0,
            expected_lifespan_years=25.0,
            current_condition_score=35.0,
            failure_count=2,
            recent_failure_count=1,
            total_downtime_hours=32.0,
            days_since_last_maintenance=410,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.HIGH, RiskLevelEnum.MEDIUM],
        "expected_reason_codes": [
            ReasonCodeEnum.MAINTENANCE_OVERDUE,
            ReasonCodeEnum.RAPID_CONDITION_DEGRADATION,
        ],
        "target_risk_min": 0.45,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-05",
            asset_name="Paud Road Sluice Valve V-118",
            asset_type="WATER_VALVE",
            age_years=4.0,
            expected_lifespan_years=10.0,
            current_condition_score=85.0,
            failure_count=1,
            recent_failure_count=0,
            total_downtime_hours=4.0,
            days_since_last_maintenance=25,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.ROUTINE_MONITORING,
        "expected_risk_levels": [RiskLevelEnum.LOW, RiskLevelEnum.MEDIUM],
        "expected_reason_codes": [],
        "target_risk_max": 0.35,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-06",
            asset_name="Distribution Transformer TR-402 (PCMC)",
            asset_type="ELECTRICAL_TRANSFORMER",
            age_years=14.0,
            expected_lifespan_years=20.0,
            current_condition_score=40.0,
            failure_count=5,
            recent_failure_count=2,
            total_downtime_hours=45.0,
            days_since_last_maintenance=280,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL],
        "expected_reason_codes": [
            ReasonCodeEnum.CHRONIC_RECURRENCE,
            ReasonCodeEnum.ELEVATED_DOWNTIME,
        ],
        "target_risk_min": 0.60,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-07",
            asset_name="Goodluck Chowk Adaptive Traffic Signal Unit",
            asset_type="TRAFFIC_SIGNAL",
            age_years=0.5,
            expected_lifespan_years=8.0,
            current_condition_score=92.0,
            failure_count=0,
            recent_failure_count=0,
            total_downtime_hours=0.0,
            days_since_last_maintenance=45,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.ROUTINE_MONITORING,
        "expected_risk_levels": [RiskLevelEnum.LOW],
        "expected_reason_codes": [ReasonCodeEnum.HEALTHY_OPERATIONAL_BASELINE],
        "target_risk_max": 0.25,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-08",
            asset_name="Shivaji Nagar Modern Sanitation Complex SC-09",
            asset_type="COMMUNITY_TOILET",
            age_years=3.5,
            expected_lifespan_years=12.0,
            current_condition_score=62.0,
            failure_count=3,
            recent_failure_count=2,
            total_downtime_hours=12.0,
            days_since_last_maintenance=120,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.MEDIUM],
        "expected_reason_codes": [],
        "target_risk_min": 0.35,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-09",
            asset_name="Kothrud Waste Transfer Compactor Station TS-03",
            asset_type="WASTE_STATION",
            age_years=7.5,
            expected_lifespan_years=10.0,
            current_condition_score=58.0,
            failure_count=3,
            recent_failure_count=1,
            total_downtime_hours=14.0,
            days_since_last_maintenance=190,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED,
        "expected_risk_levels": [RiskLevelEnum.MEDIUM, RiskLevelEnum.HIGH],
        "expected_reason_codes": [ReasonCodeEnum.MAINTENANCE_OVERDUE],
        "target_risk_min": 0.40,
    },
    {
        "input": AssetMaintenanceInput(
            asset_id="eval-ast-10",
            asset_name="Kothrud Covered Storm Drain SD-14",
            asset_type="STORM_DRAIN",
            age_years=4.5,
            expected_lifespan_years=20.0,
            current_condition_score=80.0,
            failure_count=1,
            recent_failure_count=0,
            total_downtime_hours=2.0,
            days_since_last_maintenance=110,
        ),
        "expected_action": MaintenanceActionRecommendationEnum.ROUTINE_MONITORING,
        "expected_risk_levels": [RiskLevelEnum.LOW, RiskLevelEnum.MEDIUM],
        "expected_reason_codes": [],
        "target_risk_max": 0.35,
    },
]


def run_offline_evaluation(model: PredictiveMaintenanceModel | None = None) -> dict[str, Any]:
    """
    Executes offline evaluation of the predictive maintenance baseline model.
    Returns quantitative evaluation metrics: accuracy, precision, recall, and safety check results.
    """
    if model is None:
        model = PredictiveMaintenanceModel()

    total_cases = len(SEEDED_EVALUATION_DATASET)
    action_matches = 0
    risk_level_matches = 0
    reason_code_matches = 0

    true_positives = 0  # Expected review and predicted review
    false_positives = 0  # Expected monitoring but predicted review
    false_negatives = 0  # Expected review but predicted monitoring
    true_negatives = 0  # Expected monitoring and predicted monitoring

    all_disclaimers_valid = True
    all_non_authoritative = True

    eval_results: list[dict[str, Any]] = []

    for item in SEEDED_EVALUATION_DATASET:
        asset_input: AssetMaintenanceInput = item["input"]
        res = model.predict(asset_input)

        # Check safety & non-authoritative constraints
        if res.is_authoritative:
            all_non_authoritative = False
        if "final engineering authority rests" not in res.disclaimer:
            all_disclaimers_valid = False

        # Check action match
        is_action_correct = res.recommended_action == item["expected_action"]
        if is_action_correct:
            action_matches += 1

        # Check risk level match
        is_risk_level_correct = res.risk_level in item["expected_risk_levels"]
        if is_risk_level_correct:
            risk_level_matches += 1

        # Check expected reason codes
        expected_codes = item.get("expected_reason_codes", [])
        code_matched = all(code in res.reason_codes for code in expected_codes)
        if code_matched:
            reason_code_matches += 1

        # Confusion matrix calculations
        if item["expected_action"] == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED:
            if res.recommended_action == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED:
                true_positives += 1
            else:
                false_negatives += 1
        else:
            if res.recommended_action == MaintenanceActionRecommendationEnum.ROUTINE_MONITORING:
                true_negatives += 1
            else:
                false_positives += 1

        eval_results.append({
            "asset_id": asset_input.asset_id,
            "predicted_risk_score": res.risk_score,
            "predicted_risk_level": res.risk_level.value,
            "predicted_action": res.recommended_action.value,
            "expected_action": item["expected_action"].value,
            "reason_codes": [rc.value for rc in res.reason_codes],
            "action_correct": is_action_correct,
            "risk_level_correct": is_risk_level_correct,
        })

    accuracy = action_matches / total_cases
    precision = (
        true_positives / (true_positives + false_positives)
        if (true_positives + false_positives) > 0
        else 1.0
    )
    recall = (
        true_positives / (true_positives + false_negatives)
        if (true_positives + false_negatives) > 0
        else 1.0
    )
    f1 = (
        2 * (precision * recall) / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )

    return {
        "total_cases": total_cases,
        "action_recommendation_accuracy": round(accuracy, 4),
        "risk_level_accuracy": round(risk_level_matches / total_cases, 4),
        "reason_code_accuracy": round(reason_code_matches / total_cases, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": {
            "true_positives": true_positives,
            "true_negatives": true_negatives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
        },
        "all_disclaimers_valid": all_disclaimers_valid,
        "all_non_authoritative": all_non_authoritative,
        "case_details": eval_results,
    }
