"""
Phase 52 Exit Checks: Predictive Maintenance Baseline Tests & Offline Evaluation
Validates breakdown risk scoring across failure frequency, age wear, maintenance deficit,
reason codes, non-authoritative advisory enforcement, offline dataset evaluation,
and REST API endpoints.
"""

from fastapi.testclient import TestClient

from app.main import app
from app.pipelines.maintenance.evaluation import (
    run_offline_evaluation,
)
from app.pipelines.maintenance.model import PredictiveMaintenanceModel
from app.pipelines.maintenance.registry import (
    reset_maintenance_registry,
)
from app.pipelines.maintenance.schemas import (
    AssetMaintenanceInput,
    MaintenanceActionRecommendationEnum,
    ReasonCodeEnum,
    RiskLevelEnum,
)

client = TestClient(app)


def setup_function() -> None:
    reset_maintenance_registry()


def test_chronic_recurrence_detection() -> None:
    model = PredictiveMaintenanceModel()
    asset = AssetMaintenanceInput(
        asset_id="ast-test-01",
        asset_name="High Recurrence Road Section",
        asset_type="ROAD_SEGMENT",
        age_years=4.0,
        expected_lifespan_years=7.0,
        current_condition_score=45.0,
        failure_count=5,
        recent_failure_count=3,  # Chronic recurrence in 90 days
        total_downtime_hours=20.0,
        days_since_last_maintenance=180,
    )

    result = model.predict(asset)

    assert result.risk_score >= 0.65
    assert result.risk_level in [RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL]
    assert (
        result.recommended_action
        == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED
    )
    assert ReasonCodeEnum.CHRONIC_RECURRENCE in result.reason_codes
    assert ReasonCodeEnum.RAPID_CONDITION_DEGRADATION in result.reason_codes
    assert ReasonCodeEnum.ELEVATED_DOWNTIME in result.reason_codes
    # Strict safety constraint: AI is never authoritative
    assert result.is_authoritative is False
    assert "final engineering authority rests" in result.disclaimer


def test_aging_asset_exceeded_lifespan() -> None:
    model = PredictiveMaintenanceModel()
    asset = AssetMaintenanceInput(
        asset_id="ast-test-02",
        asset_name="Vintage Cast Iron Water Main",
        asset_type="WATER_PIPELINE",
        age_years=28.0,
        expected_lifespan_years=25.0,  # Exceeded design life
        current_condition_score=52.0,
        failure_count=3,
        recent_failure_count=1,
        days_since_last_maintenance=300,
    )

    result = model.predict(asset)

    assert result.risk_score >= 0.55
    assert result.risk_level in [RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL]
    assert (
        result.recommended_action
        == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED
    )
    assert ReasonCodeEnum.EXCEEDED_DESIGN_LIFESPAN in result.reason_codes
    assert ReasonCodeEnum.MAINTENANCE_OVERDUE in result.reason_codes


def test_maintenance_overdue_flag() -> None:
    model = PredictiveMaintenanceModel()
    asset = AssetMaintenanceInput(
        asset_id="ast-test-03",
        asset_name="Neglected Stormwater Box Culvert",
        asset_type="DRAINAGE_CULVERT",
        age_years=8.0,
        expected_lifespan_years=25.0,
        current_condition_score=50.0,
        failure_count=1,
        recent_failure_count=0,
        days_since_last_maintenance=420,  # Over 1 year without servicing
    )

    result = model.predict(asset)

    assert ReasonCodeEnum.MAINTENANCE_OVERDUE in result.reason_codes
    assert (
        result.recommended_action
        == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED
    )


def test_pristine_asset_routine_monitoring() -> None:
    model = PredictiveMaintenanceModel()
    asset = AssetMaintenanceInput(
        asset_id="ast-test-04",
        asset_name="Brand New Smart LED Pole",
        asset_type="STREETLIGHT",
        age_years=0.4,
        expected_lifespan_years=5.0,
        current_condition_score=98.0,
        failure_count=0,
        recent_failure_count=0,
        total_downtime_hours=0.0,
        days_since_last_maintenance=15,
    )

    result = model.predict(asset)

    assert result.risk_score < 0.25
    assert result.risk_level == RiskLevelEnum.LOW
    assert result.recommended_action == MaintenanceActionRecommendationEnum.ROUTINE_MONITORING
    assert ReasonCodeEnum.HEALTHY_OPERATIONAL_BASELINE in result.reason_codes


def test_non_authoritative_advisory_guarantee() -> None:
    """Verifies that under no circumstance does the model recommend automatic replacement."""
    model = PredictiveMaintenanceModel()

    # Extreme failure scenario: catastrophic asset failure profile
    worst_case_asset = AssetMaintenanceInput(
        asset_id="ast-catastrophic",
        asset_name="Completely Ruined Transformer",
        asset_type="ELECTRICAL_TRANSFORMER",
        age_years=30.0,
        expected_lifespan_years=20.0,
        current_condition_score=10.0,
        failure_count=15,
        recent_failure_count=8,
        total_downtime_hours=120.0,
        days_since_last_maintenance=600,
    )

    result = model.predict(worst_case_asset)

    assert result.risk_score >= 0.85
    assert result.risk_level == RiskLevelEnum.CRITICAL
    # MUST be 'MAINTENANCE_REVIEW_RECOMMENDED', NOT 'AUTOMATIC_REPLACEMENT'
    assert (
        result.recommended_action
        == MaintenanceActionRecommendationEnum.MAINTENANCE_REVIEW_RECOMMENDED
    )
    assert result.is_authoritative is False
    assert "AI-generated risk advisory" in result.disclaimer


def test_offline_evaluation_with_seeded_data() -> None:
    """
    Phase 52 Mandatory Exit Check:
    Runs offline evaluation against seeded municipal dataset and validates benchmarks.
    """
    eval_metrics = run_offline_evaluation()

    assert eval_metrics["total_cases"] == 10
    assert eval_metrics["action_recommendation_accuracy"] >= 0.90
    assert eval_metrics["precision"] >= 0.90
    assert eval_metrics["recall"] >= 0.90
    assert eval_metrics["f1_score"] >= 0.90
    assert eval_metrics["all_disclaimers_valid"] is True
    assert eval_metrics["all_non_authoritative"] is True

    # Confusion matrix sanity checks
    cm = eval_metrics["confusion_matrix"]
    assert cm["true_positives"] >= 5
    assert cm["true_negatives"] >= 3
    assert cm["false_negatives"] == 0  # No missed maintenance review recommendations


def test_api_predict_maintenance_endpoint() -> None:
    payload = {
        "asset_id": "ast-api-01",
        "asset_name": "FC Road Pavement Section Km 2.4",
        "asset_type": "ROAD_SEGMENT",
        "age_years": 4.5,
        "expected_lifespan_years": 7.0,
        "current_condition_score": 48.0,
        "failure_count": 4,
        "recent_failure_count": 2,
        "total_downtime_hours": 16.0,
        "days_since_last_maintenance": 190,
    }

    response = client.post("/v1/predict/maintenance", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["asset_id"] == "ast-api-01"
    assert data["asset_type"] == "ROAD_SEGMENT"
    assert data["risk_score"] >= 0.50
    assert data["risk_level"] in ["HIGH", "MEDIUM", "CRITICAL"]
    assert data["recommended_action"] == "MAINTENANCE_REVIEW_RECOMMENDED"
    assert len(data["reason_codes"]) > 0
    assert len(data["contributing_factors"]) == 4
    assert data["is_authoritative"] is False
    assert "final engineering authority rests" in data["disclaimer"]


def test_api_predict_trend_asset_integration() -> None:
    """Verifies that POST /v1/predict with entity_type='ASSET' integrates with maintenance model."""
    payload = {
        "entity_type": "ASSET",
        "entity_id": "ast-001",
        "historical_metrics": {
            "asset_type": "ROAD_SEGMENT",
            "age_years": 5.0,
            "expected_lifespan_years": 7.0,
            "current_condition_score": 45.0,
            "failure_count": 5,
            "recent_failure_count": 3,
            "days_since_last_maintenance": 220,
        },
        "horizon_days": 30,
    }

    response = client.post("/v1/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["prediction_type"] == "PREDICTIVE_MAINTENANCE_RISK"
    assert data["risk_probability"] >= 0.60
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    assert data["trend"] == "INCREASING"
    assert len(data["contributing_factors"]) == 4
