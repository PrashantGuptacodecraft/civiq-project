"""
Deterministic Need-to-Resource Matching Pipeline Unit & API Tests
Phase 65: Build need-to-resource matching
"""

from fastapi.testclient import TestClient

from app.main import app
from app.pipelines.resource_matching import (
    DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    NeedMatchInput,
    ResourceMatcher,
    haversine_distance_km,
)

client = TestClient(app)

MOCK_RESOURCES = [
    # Shelter 1: Close (1.5 km), high capacity, active
    {
        "id": "res-shelter-01",
        "title": "Vitthalwadi Municipal Primary School Shelter",
        "resourceType": "EMERGENCY_SHELTER",
        "status": "ACTIVE_OPERATIONAL",
        "verificationStatus": "VERIFIED_OFFICIAL",
        "latitude": 18.4870,
        "longitude": 73.8340,
        "availableCapacity": 70.0,
        "totalCapacity": 350.0,
    },
    # Shelter 2: Farther (12 km), moderate capacity, nearing capacity
    {
        "id": "res-shelter-02",
        "title": "Dapodi Relief Shelter",
        "resourceType": "EMERGENCY_SHELTER",
        "status": "NEARING_CAPACITY",
        "verificationStatus": "VERIFIED_OFFICIAL",
        "latitude": 18.5780,
        "longitude": 73.8290,
        "availableCapacity": 40.0,
        "totalCapacity": 200.0,
    },
    # Supply center: Close (3.5 km), wrong type for shelter need, but right for water/food
    {
        "id": "res-supply-01",
        "title": "Deccan Gymkhana Relief Depot",
        "resourceType": "RELIEF_DISTRIBUTION_CENTER",
        "status": "ACTIVE_OPERATIONAL",
        "verificationStatus": "VERIFIED_OFFICIAL",
        "latitude": 18.5160,
        "longitude": 73.8420,
        "availableCapacity": 1800.0,
        "totalCapacity": 5000.0,
    },
    # Emergency vehicle: Rescue boats (2.8 km), right for boat evacuation
    {
        "id": "res-boats-01",
        "title": "PMC Fire Brigade Inflatable Rescue Boats Unit",
        "resourceType": "EMERGENCY_VEHICLE",
        "status": "ACTIVE_OPERATIONAL",
        "verificationStatus": "VERIFIED_OFFICIAL",
        "latitude": 18.5020,
        "longitude": 73.8560,
        "availableCapacity": 6.0,
        "totalCapacity": 8.0,
    },
    # Decommissioned shelter
    {
        "id": "res-shelter-decom",
        "title": "Old Closed Community Hall",
        "resourceType": "EMERGENCY_SHELTER",
        "status": "DECOMMISSIONED",
        "verificationStatus": "EXPIRED_UNVERIFIED",
        "latitude": 18.4900,
        "longitude": 73.8350,
        "availableCapacity": 100.0,
        "totalCapacity": 100.0,
    },
    # Full capacity shelter
    {
        "id": "res-shelter-full",
        "title": "Full Camp Center",
        "resourceType": "EMERGENCY_SHELTER",
        "status": "AT_FULL_CAPACITY",
        "verificationStatus": "VERIFIED_OFFICIAL",
        "latitude": 18.4890,
        "longitude": 73.8320,
        "availableCapacity": 0.0,
        "totalCapacity": 150.0,
    },
]


def test_haversine_distance() -> None:
    """Accurately calculates geodesic distance between two Pune points."""
    # Vitthalwadi (18.4870, 73.8340) to Deccan (18.5160, 73.8420)
    dist = haversine_distance_km(18.4870, 73.8340, 18.5160, 73.8420)
    assert 3.0 <= dist <= 3.6


def test_deterministic_shelter_need_matching() -> None:
    """Matches shelter accommodation need to compatible nearby emergency shelters."""
    matcher = ResourceMatcher()
    need = NeedMatchInput(
        need_id="need-shelter-01",
        need_type="SHELTER_ACCOMMODATION",
        required_quantity=10.0,
        unit="PERSONS",
        latitude=18.4880,
        longitude=73.8310,
        max_distance_km=30.0,
        candidate_resources=MOCK_RESOURCES,
    )

    results = matcher.match(need)
    assert len(results) == len(MOCK_RESOURCES)

    # Top match must be Vitthalwadi shelter (close, compatible, ample capacity)
    top = results[0]
    assert top.resource_id == "res-shelter-01"
    assert top.rank == 1
    assert top.is_eligible is True
    assert top.match_score > 80.0
    assert top.capacity_fit in ("EXCEEDS_REQUIREMENT", "EXACT_FIT")

    # Decommissioned shelter must be ineligible
    decom = next(r for r in results if r.resource_id == "res-shelter-decom")
    assert decom.is_eligible is False
    assert any("decommissioned" in r.lower() for r in decom.ineligibility_reasons)

    # Full capacity shelter must be flagged
    full = next(r for r in results if r.resource_id == "res-shelter-full")
    assert full.capacity_fit == "ZERO_CAPACITY"
    assert full.is_eligible is False


def test_boat_evacuation_need_matching() -> None:
    """Matches boat evacuation need to emergency rescue vehicle fleet."""
    matcher = ResourceMatcher()
    need = NeedMatchInput(
        need_id="need-boat-01",
        need_type="BOAT_EVACUATION",
        required_quantity=2.0,
        unit="BOATS",
        latitude=18.4880,
        longitude=73.8310,
        max_distance_km=25.0,
        candidate_resources=MOCK_RESOURCES,
    )

    results = matcher.match(need)
    top = results[0]
    assert top.resource_id == "res-boats-01"
    assert top.resource_type == "EMERGENCY_VEHICLE"
    assert top.is_eligible is True


def test_distance_decay_and_radius_cutoff() -> None:
    """Penalizes resources that are distant and disqualifies those outside radius."""
    matcher = ResourceMatcher()
    need = NeedMatchInput(
        need_id="need-test-dist",
        need_type="SHELTER_ACCOMMODATION",
        required_quantity=5.0,
        unit="PERSONS",
        latitude=18.4880,
        longitude=73.8310,
        max_distance_km=5.0,  # Short radius: Dapodi (12 km away) must be ineligible
        candidate_resources=MOCK_RESOURCES,
    )

    results = matcher.match(need)
    dapodi = next(r for r in results if r.resource_id == "res-shelter-02")
    assert dapodi.is_eligible is False
    assert any("search radius" in r.lower() for r in dapodi.ineligibility_reasons)


def test_api_v1_resource_matching_endpoint() -> None:
    """POST /v1/resource-matching/match returns deterministic explainable recommendations."""
    payload = {
        "need_id": "need-api-01",
        "need_type": "DRINKING_WATER",
        "required_quantity": 500.0,
        "unit": "LITERS",
        "latitude": 18.5150,
        "longitude": 73.8410,
        "severity": "HIGH_URGENT",
        "max_distance_km": 20.0,
        "candidate_resources": MOCK_RESOURCES,
    }

    res = client.post("/v1/resource-matching/match", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["need_id"] == "need-api-01"
    assert data["need_type"] == "DRINKING_WATER"
    assert data["total_candidates_evaluated"] == len(MOCK_RESOURCES)
    assert data["is_authoritative"] is False
    assert data["disclaimer"] == DISASTER_RESOURCE_MATCHING_DISCLAIMER
    assert len(data["matches"]) > 0

    # Top match for DRINKING_WATER near Deccan should be Deccan Gymkhana Relief Depot
    top_match = data["matches"][0]
    assert top_match["resource_id"] == "res-supply-01"
    assert top_match["rank"] == 1
    assert top_match["is_eligible"] is True
    assert len(top_match["factor_breakdown"]) == 5
