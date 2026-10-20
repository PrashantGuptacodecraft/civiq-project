import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from app.main import app
from app.pipelines.priority.engine import (
    BasePriorityEngine,
    IssuePriorityInput,
    PriorityCalculationResult,
    PriorityWeights,
    RuleBasedPriorityEngine,
)
from app.pipelines.priority.features import (
    extract_age_score,
    extract_corroboration_score,
    extract_impact_score,
    extract_location_context_score,
    extract_safety_risk_score,
    extract_severity_score,
)
from app.pipelines.priority.registry import (
    get_priority_engine,
    register_priority_engine,
    reset_priority_registry,
    set_default_priority_engine,
)

client = TestClient(app)


def test_feature_extraction_severity() -> None:
    score_low, reasons_low = extract_severity_score("LOW", "Park bench broken", "Minor wood chip")
    assert score_low == 25.0
    assert any("LOW" in r for r in reasons_low)

    score_med, _ = extract_severity_score("MEDIUM", "Pothole on street", "Standard crater")
    assert score_med == 50.0

    score_high, _ = extract_severity_score("HIGH", "Main water pipe burst", "Clean water loss")
    assert score_high == 75.0

    score_crit, _ = extract_severity_score("CRITICAL", "Gas pipeline explosion", "Fire hazard")
    assert score_crit == 95.0

    # Escalation on keywords for non-critical
    score_escalated, reasons_esc = extract_severity_score(
        "HIGH", "Electrical pole sparking near road", "danger of electrocution"
    )
    assert score_escalated > 75.0
    assert any("escalated" in r.lower() for r in reasons_esc)


def test_feature_extraction_safety_risk() -> None:
    # High hazard: electrical hanging wire
    score_elec, flags_elec, reasons_elec = extract_safety_risk_score(
        category="electrical_hanging_wires",
        title="Live wire dangling",
        description="Electric wire sparking on pavement",
        severity="CRITICAL",
    )
    assert score_elec >= 90.0
    assert "LIFE_SAFETY_CRITICAL" in flags_elec
    assert any("hazard" in r.lower() for r in reasons_elec)

    # Fall hazard: open manhole
    score_manhole, flags_manhole, _ = extract_safety_risk_score(
        category="sanitation_open_manhole",
        title="Open manhole on 80 feet road",
        description="Uncovered drain pit without cover",
        severity="HIGH",
    )
    assert score_manhole >= 80.0
    assert "FALL_HAZARD" in flags_manhole

    # Low hazard: graffiti
    score_graffiti, flags_graf, _ = extract_safety_risk_score(
        category="general_civic",
        title="Graffiti on boundary wall",
        description="Spray paint markings",
        severity="LOW",
    )
    assert score_graffiti <= 30.0
    assert len(flags_graf) == 0


def test_feature_extraction_impact() -> None:
    # Arterial highway with 10 upvotes
    score_high_imp, reasons_imp = extract_impact_score(
        category="roads_pothole",
        title="Huge crater on Ring Road highway flyover",
        description="Traffic gridlock on main expressway",
        upvotes=10,
        location_context={"is_arterial_road": True},
    )
    assert score_high_imp >= 70.0
    assert any("transportation artery" in r for r in reasons_imp)
    assert any("10 citizen upvotes" in r for r in reasons_imp)

    # Isolated residential lane with 0 upvotes
    score_low_imp, _ = extract_impact_score(
        category="roads_pothole",
        title="Small hole on dead-end alley",
        description="Quiet residential lane",
        upvotes=0,
        location_context=None,
    )
    assert score_low_imp <= 40.0


def test_feature_extraction_corroboration() -> None:
    score_verified, reasons_corrob = extract_corroboration_score(
        reporter_trust=92.0,
        upvotes=12,
        corroboration_count=4,
    )
    assert score_verified >= 85.0
    assert any("high-trust" in r for r in reasons_corrob)
    assert any("multi-citizen corroboration" in r.lower() for r in reasons_corrob)

    # Low trust unverified
    score_unver, _ = extract_corroboration_score(
        reporter_trust=20.0,
        upvotes=0,
        corroboration_count=0,
    )
    assert score_unver <= 25.0


def test_feature_extraction_age_and_starvation() -> None:
    # Fresh report
    score_fresh, decay_fresh, _ = extract_age_score(1.0)
    assert score_fresh <= 20.0
    assert decay_fresh == 1.0

    # Overdue report (> 7 days)
    score_overdue, decay_overdue, reasons_overdue = extract_age_score(200.0)
    assert score_overdue >= 90.0
    assert decay_overdue >= 1.40
    assert any("urgency escalation" in r.lower() for r in reasons_overdue)


def test_feature_extraction_location_context() -> None:
    # Hospital context via text and flag
    score_hosp, reasons_hosp = extract_location_context_score(
        location={"latitude": 18.5204, "longitude": 73.8567},
        title="Water leak outside City Hospital emergency ward",
        description="Flooding near clinic entry",
        location_context={"is_hospital_zone": True},
    )
    assert score_hosp >= 90.0
    assert any("hospital" in r.lower() for r in reasons_hosp)

    # School context via text
    score_school, reasons_school = extract_location_context_score(
        location=None,
        title="Broken pavement outside secondary school",
        description="Students walking on street",
        location_context=None,
    )
    assert score_school >= 80.0
    assert any("school" in r.lower() for r in reasons_school)


def test_explainable_priority_engine_rules() -> None:
    engine = RuleBasedPriorityEngine()

    # Life safety critical override rule
    payload_crit = IssuePriorityInput(
        issue_id="test-rule-1",
        title="Live electric wire snapped on road",
        description="Sparking cable on street, electrocution risk",
        category="electrical_hanging_wires",
        severity="CRITICAL",
        upvotes_count=0,
        age_hours=0.5,
    )
    res_crit = engine.calculate_priority(payload_crit)
    assert res_crit.priority_tier == "P1_CRITICAL"
    assert res_crit.priority_score >= 85.0
    assert res_crit.recommended_sla_hours == 4
    assert any("Life-safety critical override" in r for r in res_crit.reasons)

    # Overdue starvation prevention rule
    payload_overdue = IssuePriorityInput(
        issue_id="test-rule-2",
        title="Small pothole in alleyway",
        description="Low traffic road crater",
        category="roads_pothole",
        severity="LOW",
        upvotes_count=0,
        age_hours=200.0,  # 8.3 days overdue
    )
    res_overdue = engine.calculate_priority(payload_overdue)
    assert res_overdue.priority_score >= 60.0
    assert res_overdue.priority_tier in ["P2_HIGH", "P1_CRITICAL"]
    assert any("starvation" in r.lower() for r in res_overdue.reasons)


def test_configurable_weights() -> None:
    # Standard weights
    engine_std = RuleBasedPriorityEngine()
    payload = IssuePriorityInput(
        issue_id="iss-weights-1",
        title="Water leak on market road",
        description="Clean water pipeline leak",
        category="water_pipeline_leak",
        severity="HIGH",
        upvotes_count=20,
        age_hours=12.0,
    )
    res_std = engine_std.calculate_priority(payload)

    # Custom weights prioritizing impact and age heavily
    custom_weights = PriorityWeights(
        severity=0.10,
        safety_risk=0.10,
        impact=0.40,
        corroboration=0.10,
        age=0.25,
        location_context=0.05,
    )
    engine_custom = RuleBasedPriorityEngine(weights=custom_weights)
    res_custom = engine_custom.calculate_priority(payload)

    assert res_std.priority_score != res_custom.priority_score
    assert "weights" in res_custom.decision_evidence
    assert res_custom.decision_evidence["weights"]["impact"] == 0.40


def test_priority_registry_and_pluggability() -> None:
    reset_priority_registry()
    default_engine = get_priority_engine()
    assert isinstance(default_engine, RuleBasedPriorityEngine)

    class MockCustomEngine(BasePriorityEngine):
        def calculate_priority(self, p: IssuePriorityInput) -> PriorityCalculationResult:
            return PriorityCalculationResult(
                issue_id=p.issue_id,
                priority_score=99.0,
                priority_tier="P1_CRITICAL",
                recommended_sla_hours=1,
                hazard_score=95.0,
                impact_radius_score=90.0,
                vulnerability_score=90.0,
                time_decay_factor=1.0,
                safety_risk_score=90.0,
                impact_score=90.0,
                corroboration_score=90.0,
                age_score=90.0,
                location_context_score=90.0,
                reasons=["Custom mock priority model"],
            )

    register_priority_engine("mock-engine", MockCustomEngine())
    set_default_priority_engine("mock-engine")
    active = get_priority_engine()
    assert isinstance(active, MockCustomEngine)

    reset_priority_registry()
    reverted = get_priority_engine()
    assert isinstance(reverted, RuleBasedPriorityEngine)


def test_evaluation_fixtures_with_explainability_assertions() -> None:
    fixture_path = Path(__file__).parent / "fixtures" / "priority_eval_set.json"
    with open(fixture_path, encoding="utf-8") as f:
        eval_cases: list[dict[str, Any]] = json.load(f)

    engine = RuleBasedPriorityEngine()

    for case in eval_cases:
        p_input = IssuePriorityInput(
            issue_id=case["id"],
            title=case["title"],
            description=case["description"],
            category=case["category"],
            severity=case["severity"],
            reporter_trust_score=case.get("reporter_trust_score"),
            location=case.get("location"),
            upvotes_count=case.get("upvotes_count"),
            age_hours=case.get("age_hours"),
            corroboration_count=case.get("corroboration_count"),
            location_context=case.get("location_context"),
        )

        result = engine.calculate_priority(p_input)

        # Tier and SLA assertions
        assert result.priority_tier == case["expected_tier"], (
            f"Failed on {case['id']}: got {result.priority_tier}, expected {case['expected_tier']}"
        )
        assert result.recommended_sla_hours <= case["expected_max_sla_hours"]

        if "expected_min_score" in case:
            assert result.priority_score >= case["expected_min_score"]
        if "expected_max_score" in case:
            assert result.priority_score <= case["expected_max_score"]

        # Explainability assertions: verify reasons explain the decision
        assert len(result.reasons) > 0
        all_reasons_text = " ".join(result.reasons).lower()
        for kw in case["expected_keywords_in_reasons"]:
            assert kw.lower() in all_reasons_text, (
                f"Missing expected explainability keyword '{kw}' in reasons for {case['id']}: "
                f"{result.reasons}"
            )


def test_api_v1_priority_score_full_contract() -> None:
    payload = {
        "issue_id": "iss-full-test",
        "title": "Severe sewage contamination in drinking water pipe",
        "description": (
            "Black contaminated wastewater mixing with municipal drinking line outside school"
        ),
        "category": "water_contamination",
        "severity": "CRITICAL",
        "reporter_trust_score": 88.0,
        "location": {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "jurisdiction_id": "pune-ward-1",
        },
        "upvotes_count": 18,
        "age_hours": 3.5,
        "corroboration_count": 4,
        "location_context": {
            "is_school_zone": True,
        },
    }

    response = client.post("/v1/priority-score", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["priority_tier"] == "P1_CRITICAL"
    assert data["priority_score"] >= 80.0
    assert data["recommended_sla_hours"] == 4

    # Breakdown has all new explainability components
    bd = data["score_breakdown"]
    assert bd["hazard_score"] == 95.0
    assert bd["safety_risk_score"] is not None and bd["safety_risk_score"] >= 80.0
    assert bd["impact_score"] is not None and bd["impact_score"] >= 60.0
    assert bd["corroboration_score"] is not None and bd["corroboration_score"] >= 70.0
    assert bd["location_context_score"] is not None and bd["location_context_score"] >= 80.0

    # Reasons & decision evidence are populated
    assert len(data["reasons"]) >= 4
    assert "weights" in data["decision_evidence"]
    assert "subscores" in data["decision_evidence"]
