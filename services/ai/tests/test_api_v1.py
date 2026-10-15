from typing import Any

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")
    assert response.status_code == 200
    data: dict[str, Any] = response.json()
    assert data["service"] == "CivIQ AI Gateway"
    assert data["api_version"] == "v1"
    assert len(data["endpoints"]) == 7


def test_classify_endpoint() -> None:
    payload = {
        "text": "Deep pothole on MG Road causing dangerous vehicle swerving",
        "title": "Severe road pothole",
        "location": {"latitude": 18.5204, "longitude": 73.8567},
    }
    response = client.post("/v1/classify", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["model"]["name"] == "civiq-ai-core"
    assert data["primary_category"] == "roads_pothole"
    assert data["predicted_severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "explanation" in data
    assert data["latency_ms"] >= 0.0
    assert not data["is_emergency_candidate"]


def test_classify_emergency_trigger() -> None:
    payload = {
        "text": "Huge gas leak and explosion risk near residential building",
        "title": "Gas leak hazard",
    }
    response = client.post("/v1/classify", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()
    assert data["is_emergency_candidate"] is True
    assert data["predicted_severity"] == "CRITICAL"


def test_evidence_check_endpoint() -> None:
    payload = {
        "mime_type": "image/jpeg",
        "issue_title": "Broken storm water drain",
        "issue_description": "Water overflowing onto sidewalk",
        "media_storage_key": "quarantine/test-evidence-1.jpg",
    }
    response = client.post("/v1/evidence-check", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["is_relevant"] is True
    assert data["relevance_score"] > 0.5
    assert data["quality_score"] > 0.5
    assert data["safety_passed"] is True
    assert "scene_context" in data["detected_objects"]
    assert data["latency_ms"] >= 0.0


def test_duplicate_score_endpoint() -> None:
    payload = {
        "target_issue": {
            "id": "iss-target",
            "title": "Open manhole cover on 5th main road",
            "description": "Dangerous open manhole near park entrance",
        },
        "candidate_issues": [
            {
                "id": "iss-cand-1",
                "title": "Manhole open on 5th main",
                "description": "Open manhole posing threat to pedestrians",
            },
            {
                "id": "iss-cand-2",
                "title": "Street light broken",
                "description": "No illumination on 2nd cross road",
            },
        ],
        "threshold": 0.30,
    }
    response = client.post("/v1/duplicate-score", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["is_duplicate"] is True
    assert data["matched_candidate_id"] == "iss-cand-1"
    assert len(data["scored_candidates"]) == 2
    assert data["latency_ms"] >= 0.0


def test_priority_score_endpoint() -> None:
    payload = {
        "issue_id": "iss-prio-99",
        "title": "Fallen high voltage electrical line",
        "description": "Live electric line sparking on wet road",
        "category": "electrical_hazard",
        "severity": "CRITICAL",
        "upvotes_count": 8,
        "age_hours": 2.0,
    }
    response = client.post("/v1/priority-score", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["priority_score"] >= 80.0
    assert data["priority_tier"] == "P1_CRITICAL"
    assert data["recommended_sla_hours"] == 4
    assert data["score_breakdown"]["hazard_score"] == 95.0
    assert data["latency_ms"] >= 0.0


def test_route_endpoint() -> None:
    payload = {
        "issue_id": "iss-route-1",
        "title": "Garbage pile unattended",
        "description": "Household waste dumped on vacant plot",
        "category_id": "sanitation_waste",
        "jurisdiction_id": "pune-ulb-zone-1",
        "available_departments": [
            {
                "id": "dept-sanitation",
                "name": "Solid Waste Management Department",
                "categories": ["sanitation_waste", "drain_cleaning"],
            },
            {
                "id": "dept-electrical",
                "name": "Electrical & Lighting",
                "categories": ["electrical_lighting"],
            },
        ],
    }
    response = client.post("/v1/route", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["recommended_department_id"] == "dept-sanitation"
    assert data["recommended_department_name"] == "Solid Waste Management Department"
    assert "taxonomy-to-department" in data["routing_reason"]
    assert data["latency_ms"] >= 0.0


def test_summarize_endpoint() -> None:
    text = (
        "The citizen reported a leak on Monday. "
        "Field staff inspected the site on Tuesday and confirmed pipe rupture. "
        "Replacement parts were ordered on Wednesday."
    )
    payload = {
        "text": text,
        "format": "EXECUTIVE",
        "target_audience": "OFFICIAL",
    }
    response = client.post("/v1/summarize", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert "leak" in data["summary"].lower()
    assert len(data["key_points"]) > 0
    assert data["language"] == "en"
    assert data["latency_ms"] >= 0.0


def test_predict_endpoint() -> None:
    payload = {
        "entity_type": "HOTSPOT",
        "entity_id": "hotspot-water-zone-3",
        "historical_metrics": {
            "unresolved_count": 18,
            "monsoon_month": True,
        },
        "horizon_days": 14,
    }
    response = client.post("/v1/predict", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["prediction_type"] == "RECURRENCE_AND_ESCALATION_RISK"
    assert data["risk_probability"] >= 0.8
    assert data["risk_level"] == "HIGH"
    assert data["trend"] == "INCREASING"
    assert len(data["contributing_factors"]) == 2
    assert data["latency_ms"] >= 0.0


def test_validation_error_on_invalid_input() -> None:
    # Missing required text field
    response = client.post("/v1/classify", json={})
    assert response.status_code == 422
