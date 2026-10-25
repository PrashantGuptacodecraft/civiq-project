import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from app.main import app
from app.pipelines.dedup.embeddings import (
    DenseNgramSemanticEmbedder,
    PerceptualHashEmbedder,
)
from app.pipelines.dedup.ensemble import (
    IssueSummary,
    TransparentEnsembleScorer,
)
from app.pipelines.dedup.evaluator import (
    OfflineDuplicateEvaluator,
)
from app.pipelines.dedup.registry import (
    get_dedup_engine,
    register_dedup_engine,
    reset_dedup_registry,
    set_default_dedup_engine,
)

client = TestClient(app)


def test_text_embedder_dimension_and_similarity() -> None:
    embedder = DenseNgramSemanticEmbedder(dimension=128)

    vec1 = embedder.embed("Pothole on MG Road near Metro Pillar 45")
    assert len(vec1) == 128
    # L2 norm should be approximately 1.0
    norm = sum(x * x for x in vec1) ** 0.5
    assert abs(norm - 1.0) < 1e-4

    empty_vec = embedder.embed("")
    assert len(empty_vec) == 128
    assert all(x == 0.0 for x in empty_vec)

    # Similar text
    vec2 = embedder.embed("Pothole on MG Road near Pillar 45 causing traffic")
    sim_high = embedder.similarity(vec1, vec2)
    assert sim_high > 0.65

    # Dissimilar text
    vec3 = embedder.embed("Music concert in auditorium on Sunday evening")
    sim_low = embedder.similarity(vec1, vec3)
    assert sim_low < 0.40
    assert sim_low < sim_high


def test_image_embedder_perceptual_hash() -> None:
    embedder = PerceptualHashEmbedder()

    # Exact match
    assert embedder.hash_similarity("a1b2c3d4e5f67890", "a1b2c3d4e5f67890") == 1.0

    # 1-bit difference in 64 bits: 0 vs 1
    # 0 = 0000, 1 = 0001 -> 1 bit difference -> (64 - 1) / 64 = 63/64 = 0.984375
    h1 = "0000000000000000"
    h2 = "0000000000000001"
    sim = embedder.hash_similarity(h1, h2)
    assert round(sim, 4) == round(63.0 / 64.0, 4)

    # Inverted hex
    h_zeros = "0000000000000000"
    h_ones = "ffffffffffffffff"
    assert embedder.hash_similarity(h_zeros, h_ones) == 0.0

    # None or invalid values
    assert embedder.hash_similarity("", "1234567812345678") == 0.0
    assert embedder.hash_similarity("1234567812345678", "") == 0.0
    assert embedder.hash_similarity("invalid_hex", "1234567812345678") == 0.0


def test_transparent_ensemble_weights_and_decay() -> None:
    scorer = TransparentEnsembleScorer()

    # Case 1: Identical issues with image hashes
    t1 = IssueSummary(
        id="iss-1",
        title="Huge pothole on Main Street",
        description="Deep crater damaging cars",
        category_id="roads_pothole",
        latitude=18.5204,
        longitude=73.8567,
        created_at="2026-10-15T10:00:00Z",
        image_perceptual_hash="a1b2c3d4e5f67890",
    )
    c1 = IssueSummary(
        id="iss-2",
        title="Huge pothole on Main Street",
        description="Deep crater damaging cars",
        category_id="roads_pothole",
        latitude=18.5204,
        longitude=73.8567,
        created_at="2026-10-15T10:05:00Z",
        image_perceptual_hash="a1b2c3d4e5f67890",
    )

    res1 = scorer.score_pair(t1, c1)
    assert res1.total_score >= 0.95
    assert res1.is_high_impact is True
    assert res1.is_duplicate is True
    assert "components" in res1.decision_evidence
    assert "geo" in res1.decision_evidence["components"]
    assert "text" in res1.decision_evidence["components"]
    assert "image" in res1.decision_evidence["components"]
    assert "time" in res1.decision_evidence["components"]

    # Case 2: Distance decay beyond 500m
    c2 = IssueSummary(
        id="iss-3",
        title="Huge pothole on Main Street",
        description="Deep crater damaging cars",
        category_id="roads_pothole",
        latitude=18.6000,  # ~8.8 km away
        longitude=73.8567,
        created_at="2026-10-15T10:00:00Z",
        image_perceptual_hash="a1b2c3d4e5f67890",
    )
    res2 = scorer.score_pair(t1, c2)
    assert res2.geo_similarity == 0.0
    assert res2.is_duplicate is False
    assert res2.total_score < 0.70

    # Case 3: Category mismatch dampener
    c3 = IssueSummary(
        id="iss-4",
        title="Huge pothole on Main Street",
        description="Deep crater damaging cars",
        category_id="electrical_streetlighting",  # different category
        latitude=18.5204,
        longitude=73.8567,
        created_at="2026-10-15T10:00:00Z",
        image_perceptual_hash="a1b2c3d4e5f67890",
    )
    res3 = scorer.score_pair(t1, c3)
    assert "category_modifier" in res3.decision_evidence
    assert res3.decision_evidence["category_modifier"] < 1.0
    assert res3.total_score < 0.90


def test_offline_evaluator_and_threshold_report() -> None:
    fixture_path = Path(__file__).parent / "fixtures" / "duplicate_eval_set.json"
    with open(fixture_path, encoding="utf-8") as f:
        raw_data: list[dict[str, Any]] = json.load(f)

    evaluator = OfflineDuplicateEvaluator()
    pairs = evaluator.load_fixtures(raw_data)

    assert len(pairs) == 15
    report = evaluator.evaluate(pairs)

    assert report.total_pairs == 15
    assert report.positive_pairs == 8
    assert report.negative_pairs == 7
    assert 0.60 <= report.recommended_threshold <= 0.75

    # Verify best threshold metrics meet quality expectations (>=85% across key metrics)
    best_metrics = next(
        m for m in report.metrics_by_threshold if m.threshold == report.recommended_threshold
    )
    assert best_metrics.precision >= 0.85
    assert best_metrics.recall >= 0.85
    assert best_metrics.f1_score >= 0.85
    assert best_metrics.accuracy >= 0.85

    # Verify markdown table generation
    assert "# Offline Duplicate Detection Threshold Evaluation Report" in report.markdown_report
    assert "| Threshold | Precision | Recall | F1 Score |" in report.markdown_report
    assert f"| {report.recommended_threshold:.2f} |" in report.markdown_report


def test_duplicate_score_api_endpoint() -> None:
    payload = {
        "target_issue": {
            "id": "iss-target",
            "title": "Severe pothole on MG Road near Pillar 45",
            "description": "Deep asphalt crater causing traffic backup and vehicle damage",
            "category_id": "roads_pothole",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "created_at": "2026-10-18T10:00:00Z",
            "image_perceptual_hash": "a1b2c3d4e5f67890",
        },
        "candidate_issues": [
            {
                "id": "iss-cand-dup",
                "title": "Road pothole near Pillar 45 on MG Road",
                "description": "Large crater on road asphalt damaging two wheelers",
                "category_id": "roads_pothole",
                "latitude": 18.52042,
                "longitude": 73.85671,
                "created_at": "2026-10-18T10:30:00Z",
                "image_perceptual_hash": "a1b2c3d4e5f67891",
            },
            {
                "id": "iss-cand-diff",
                "title": "Broken streetlight in Indiranagar",
                "description": "Dark streetlight pole not working",
                "category_id": "roads_streetlighting",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "created_at": "2026-10-18T12:00:00Z",
                "image_perceptual_hash": None,
            },
        ],
        "threshold": 0.65,
    }

    response = client.post("/v1/duplicate-score", json=payload)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["is_duplicate"] is True
    assert data["matched_candidate_id"] == "iss-cand-dup"
    assert data["top_similarity_score"] >= 0.70
    assert len(data["scored_candidates"]) == 2

    top_cand = data["scored_candidates"][0]
    assert top_cand["candidate_id"] == "iss-cand-dup"
    assert top_cand["geo_score"] is not None
    assert top_cand["text_score"] is not None
    assert top_cand["time_score"] is not None
    assert top_cand["image_score"] is not None
    assert "components" in top_cand["decision_evidence"]
    assert "geo" in top_cand["decision_evidence"]["components"]
    assert "text" in top_cand["decision_evidence"]["components"]


def test_registry_pluggability() -> None:
    reset_dedup_registry()
    default_engine = get_dedup_engine()
    assert isinstance(default_engine, TransparentEnsembleScorer)

    custom_scorer = TransparentEnsembleScorer()
    register_dedup_engine("custom-dedup", custom_scorer)
    set_default_dedup_engine("custom-dedup")

    current = get_dedup_engine()
    assert current is custom_scorer

    reset_dedup_registry()
    reverted = get_dedup_engine()
    assert isinstance(reverted, TransparentEnsembleScorer)
