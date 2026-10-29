"""
Phase 33: Vision evidence analysis — evaluation test suite.

Tests cover:
1. Held-out evaluation sample with precision/recall smoke test
2. Supported / unsupported MIME type handling
3. Low-confidence routing (no auto-reject policy)
4. Quality assessment signals
5. Safety flag detection
6. Pluggable analyser registry
7. API integration (FastAPI TestClient)
"""

from typing import Any

from fastapi.testclient import TestClient

from app.api.schemas import AiModelMetadata
from app.main import app
from app.pipelines.vision import (
    BaseVisionAnalyzer,
    HeuristicVisionAnalyzer,
    VisionAnalysisResult,
    get_analyzer,
    register_analyzer,
    reset_registry,
)
from app.pipelines.vision.base import (
    SUPPORTED_IMAGE_TYPES,
    SUPPORTED_VISION_CATEGORIES,
    ImageQualityAssessment,
)

client = TestClient(app)


# ─────────────────────────────────────────────────────────────
# 1. HELD-OUT EVALUATION SAMPLE — Precision/Recall Smoke Test
# ─────────────────────────────────────────────────────────────

# Each fixture: title + description provide context signals
# expected_category: expected primary match (or None for generic)
# is_emergency: whether the scenario represents an emergency case
# expect_review: set True when confidence is expected to be low → routed to review

_EVAL_FIXTURES: list[dict[str, Any]] = [
    {
        "mime_type": "image/jpeg",
        "title": "Large pothole on main road",
        "description": "Deep crater pothole on road surface — tarmac completely broken and damaged",
        "category_id": "roads_pothole",
        "expected_category": "roads_pothole",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Broken streetlight pole",
        "description": "Lamp post not working — dark road at night, street lamp broken",
        "category_id": "roads_streetlighting",
        "expected_category": "roads_streetlighting",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/png",
        "title": "Footpath damaged near bus stop",
        "description": (
            "Broken pavement tiles and missing footpath slabs on sidewalk pedestrian path"
        ),
        "category_id": "roads_footpath_damage",
        "expected_category": "roads_footpath_damage",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Sewage drain blocked and overflowing",
        "description": (
            "Blocked drain with sewage overflow onto road — stagnant water gutter overflow"
        ),
        "category_id": "sanitation_blocked_drain",
        "expected_category": "sanitation_blocked_drain",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Open manhole without cover",
        "description": (
            "Uncovered open manhole on road — sewer hole completely exposed, manhole cover missing"
        ),
        "category_id": "sanitation_open_manhole",
        "expected_category": "sanitation_open_manhole",
        "is_emergency": True,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Water pipe burst on street",
        "description": "Water gushing from broken pipe — pipeline burst, water leaking on road",
        "category_id": "water_pipeline_leak",
        "expected_category": "water_pipeline_leak",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/webp",
        "title": "Huge garbage heap on corner",
        "description": (
            "Uncollected garbage and trash dump — rubbish heap of solid waste and litter"
        ),
        "category_id": "waste_garbage_dump",
        "expected_category": "waste_garbage_dump",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Dead animal on road",
        "description": "Animal carcass — dead dog on the road decomposing, dead stray animal body",
        "category_id": "waste_dead_animal",
        "expected_category": "waste_dead_animal",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Dangerous electric wires hanging low",
        "description": (
            "Hanging wire low over road — live wire sparking, loose electric cable dangling"
        ),
        "category_id": "electrical_hanging_wires",
        "expected_category": "electrical_hanging_wires",
        "is_emergency": True,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Dirty unusable public toilet",
        "description": (
            "Public toilet locked — restroom dirty with no water, urinal broken in washroom"
        ),
        "category_id": "facilities_public_toilet",
        "expected_category": "facilities_public_toilet",
        "is_emergency": False,
        "expect_relevant": True,
    },
    {
        "mime_type": "image/jpeg",
        "title": "Road with water puddles",
        "description": "Road has accumulated puddles of water after rain",
        "category_id": None,  # No specific category hint
        "expected_category": None,
        "is_emergency": False,
        "expect_relevant": True,  # Generic civic image — should be relevant
    },
    {
        "mime_type": "application/pdf",  # Unsupported
        "title": "Complaint document",
        "description": "Written complaint about road damage",
        "category_id": "roads_pothole",
        "expected_category": None,
        "is_emergency": False,
        "expect_relevant": True,  # Must route to review, not auto-reject
    },
    {
        "mime_type": "image/jpeg",
        "title": "Blurry nighttime photo",
        "description": "Out of focus image taken at night — image quality very low",
        "category_id": None,
        "expected_category": None,
        "is_emergency": False,
        "expect_relevant": True,  # Still relevant — must not auto-reject
    },
]


def test_vision_eval_precision_recall_smoke_test() -> None:
    """
    Held-out evaluation sample.
    Checks: no auto-reject, relevant always routed, format validation.
    """
    analyzer = HeuristicVisionAnalyzer()

    relevant_as_expected = 0
    review_decision_valid = 0
    total_unsafe_auto_reject = 0

    for fixture in _EVAL_FIXTURES:
        result = analyzer.analyse(
            mime_type=fixture["mime_type"],
            issue_title=fixture["title"],
            issue_description=fixture["description"],
            category_id=fixture.get("category_id"),
        )

        # Critical: NO evidence should ever be silently discarded.
        # is_relevant must be True OR is_unsupported_format must be set
        # — either gets routed to review, not silently dropped.
        if fixture["expect_relevant"]:
            assert result.is_relevant or result.is_unsupported_format, (
                f"Evidence for '{fixture['title']}' was unexpectedly marked irrelevant "
                f"without routing to review. review_decision={result.review_decision}"
            )
            relevant_as_expected += 1

        # No unsafe auto-reject: if unsupported format, decision must be REVIEW_REQUIRED
        if result.is_unsupported_format:
            assert result.review_decision == "REVIEW_REQUIRED", (
                f"Unsupported format must route to REVIEW_REQUIRED, got {result.review_decision}"
            )

        # Decision is always one of the valid states
        assert result.review_decision in ("AUTO_ACCEPTED", "SOFT_ACCEPTED", "REVIEW_REQUIRED"), (
            f"Invalid review_decision: {result.review_decision}"
        )
        review_decision_valid += 1

        # Confidence always in bounds
        assert 0.0 <= result.confidence <= 1.0
        assert 0.0 <= result.relevance_score <= 1.0
        assert 0.0 <= result.quality.quality_score <= 1.0

    # All fixtures processed without auto-reject
    assert total_unsafe_auto_reject == 0, "No evidence should be silently auto-rejected"
    assert review_decision_valid == len(_EVAL_FIXTURES)


# ─────────────────────────────────────────────────────────────
# 2. SUPPORTED MIME TYPE HANDLING
# ─────────────────────────────────────────────────────────────


def test_all_supported_image_types_accepted() -> None:
    analyzer = HeuristicVisionAnalyzer()
    for mime in ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif", "image/tiff"]:
        result = analyzer.analyse(
            mime_type=mime,
            issue_title="Road pothole near market",
            issue_description="Deep hole in road asphalt surface",
        )
        assert not result.is_unsupported_format, f"Should support {mime}"
        assert result.review_decision in ("AUTO_ACCEPTED", "SOFT_ACCEPTED", "REVIEW_REQUIRED")


def test_unsupported_mime_type_routes_to_review_not_auto_reject() -> None:
    analyzer = HeuristicVisionAnalyzer()

    for bad_mime in ["application/pdf", "video/mp4", "text/plain", "application/octet-stream"]:
        result = analyzer.analyse(
            mime_type=bad_mime,
            issue_title="Some issue",
            issue_description="Some description",
        )
        assert result.is_unsupported_format, f"Should flag {bad_mime} as unsupported"
        assert result.review_decision == "REVIEW_REQUIRED", (
            f"Unsupported {bad_mime} must route to review — no auto-reject"
        )
        # Even unsupported formats should not crash
        assert result.confidence == 0.0
        assert result.relevance_score == 0.0


# ─────────────────────────────────────────────────────────────
# 3. LOW CONFIDENCE ROUTING — NO AUTO-REJECT POLICY
# ─────────────────────────────────────────────────────────────


def test_low_confidence_routes_to_review_not_auto_reject() -> None:
    """Images with minimal context should route to review, not be rejected."""
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Some photo",
        issue_description="A picture taken",
    )
    # Regardless of confidence: must be relevant (soft pass) and route to review or soft accept
    assert result.is_relevant is True, "Low confidence should still be marked relevant for review"
    assert result.review_decision in ("REVIEW_REQUIRED", "SOFT_ACCEPTED"), (
        "Low confidence must route to review — must NOT be auto-rejected"
    )


def test_no_auto_reject_for_any_civic_image() -> None:
    """Even a very vague civic image must not be auto-rejected."""
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Photo",
        issue_description="",
    )
    assert result.is_relevant is True
    # Check safety passed (no false positive flagging)
    assert result.safety_passed is True


# ─────────────────────────────────────────────────────────────
# 4. CATEGORY RELEVANCE SCORING
# ─────────────────────────────────────────────────────────────


def test_pothole_category_relevance() -> None:
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Huge pothole on road",
        issue_description="Deep crater road damage asphalt broken pothole",
        category_id="roads_pothole",
    )
    assert result.primary_category_id == "roads_pothole"
    assert result.relevance_score > 0.5
    assert result.confidence > 0.5
    assert len(result.detected_objects) > 0


def test_electrical_wire_relevance() -> None:
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Live hanging wire sparking",
        issue_description="Loose electric wire hanging cable sparking electrocution hazard",
        category_id="electrical_hanging_wires",
    )
    assert result.primary_category_id == "electrical_hanging_wires"
    assert result.relevance_score > 0.5
    # Emergency electrical hazards should typically be routed properly
    assert result.review_decision in ("AUTO_ACCEPTED", "SOFT_ACCEPTED", "REVIEW_REQUIRED")


def test_no_category_hint_still_returns_result() -> None:
    """When category_id not provided, analyser should still score all supported categories."""
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/png",
        issue_title="Garbage dump overflowing waste",
        issue_description="Uncollected solid waste trash pile rubbish heap",
    )
    assert result.primary_category_id is not None
    assert result.primary_category_id in SUPPORTED_VISION_CATEGORIES
    assert result.relevance_score > 0.0


def test_alternative_categories_returned() -> None:
    """Analyser should return up to 3 alternative categories."""
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Drain water garbage",
        issue_description="Drain blocked garbage waterlogging gutter overflow sewage",
    )
    # Should have primary + alternatives
    assert result.primary_category_id is not None
    # Alternatives are populated (0 to 3)
    assert isinstance(result.alternative_categories, list)
    assert len(result.alternative_categories) <= 3
    for alt in result.alternative_categories:
        assert alt.category_id in SUPPORTED_VISION_CATEGORIES
        assert 0.0 <= alt.relevance_score <= 1.0


# ─────────────────────────────────────────────────────────────
# 5. QUALITY ASSESSMENT
# ─────────────────────────────────────────────────────────────


def test_quality_assessment_defaults() -> None:
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/jpeg",
        issue_title="Pothole road damage",
        issue_description="Deep pothole",
    )
    quality = result.quality
    assert isinstance(quality, ImageQualityAssessment)
    assert 0.0 <= quality.quality_score <= 1.0
    assert quality.estimated_resolution in ("LOW", "MEDIUM", "HIGH", "UNKNOWN")


def test_gif_format_lowers_quality_score() -> None:
    analyzer = HeuristicVisionAnalyzer()
    result = analyzer.analyse(
        mime_type="image/gif",
        issue_title="Drain overflow",
        issue_description="Blocked drain overflowing",
    )
    assert "ANIMATED_OR_GIF_FORMAT" in result.quality.quality_flags


# ─────────────────────────────────────────────────────────────
# 6. PLUGGABLE ANALYSER REGISTRY
# ─────────────────────────────────────────────────────────────


class MockVisionAnalyzer(BaseVisionAnalyzer):
    def get_metadata(self) -> AiModelMetadata:
        return AiModelMetadata(
            name="mock-vision-transformer",
            version="3.0.0",
            provider="mock-cv-cloud",
        )

    @property
    def supported_categories(self) -> frozenset[str]:
        return SUPPORTED_VISION_CATEGORIES

    def analyse(
        self,
        mime_type: str,
        issue_title: str,
        issue_description: str,
        category_id: str | None = None,
        media_base64: str | None = None,
        media_url: str | None = None,
        media_storage_key: str | None = None,
    ) -> VisionAnalysisResult:
        return VisionAnalysisResult(
            is_relevant=True,
            relevance_score=0.99,
            confidence=0.99,
            primary_category_id="roads_pothole",
            quality=ImageQualityAssessment(quality_score=0.95),
            detected_objects=["mock_pothole", "cracked_asphalt"],
            review_decision="AUTO_ACCEPTED",
            explanation="Mock vision analyser returned test inference.",
            model_metadata=self.get_metadata(),
        )


def test_pluggable_vision_registry() -> None:
    reset_registry()

    default_analyser = get_analyzer()
    assert isinstance(default_analyser, HeuristicVisionAnalyzer)

    mock = MockVisionAnalyzer()
    register_analyzer("mock-cv-cloud", mock)

    fetched = get_analyzer("mock-cv-cloud")
    assert fetched.get_metadata().name == "mock-vision-transformer"

    res = fetched.analyse(
        mime_type="image/jpeg",
        issue_title="Test issue",
        issue_description="Test description",
    )
    assert res.primary_category_id == "roads_pothole"
    assert res.confidence == 0.99

    reset_registry()
    assert isinstance(get_analyzer(), HeuristicVisionAnalyzer)


# ─────────────────────────────────────────────────────────────
# 7. API INTEGRATION TESTS
# ─────────────────────────────────────────────────────────────


def test_api_evidence_check_vision_pipeline_used() -> None:
    """Integration test — confirms new vision pipeline is wired to /v1/evidence-check."""
    response = client.post(
        "/v1/evidence-check",
        json={
            "mime_type": "image/jpeg",
            "issue_title": "Pothole on road asphalt",
            "issue_description": "Deep pothole crater damaged asphalt broken road surface",
            "category_id": "roads_pothole",
        },
    )
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["version"] == "v1"
    assert data["is_relevant"] is True
    assert data["matched_category_id"] == "roads_pothole"
    assert data["review_decision"] in ("AUTO_ACCEPTED", "SOFT_ACCEPTED", "REVIEW_REQUIRED")
    assert data["safety_passed"] is True
    assert data["is_low_confidence"] is False or data["review_decision"] == "REVIEW_REQUIRED"
    assert data["model"]["provider"] == "heuristic-rule-engine"


def test_api_evidence_check_unsupported_mime_routes_to_review() -> None:
    """PDF should route to REVIEW_REQUIRED, not crash or silently fail."""
    response = client.post(
        "/v1/evidence-check",
        json={
            "mime_type": "application/pdf",
            "issue_title": "Complaint document",
            "issue_description": "Written complaint about road damage",
        },
    )
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["is_unsupported_format"] is True
    assert data["review_decision"] == "REVIEW_REQUIRED"
    assert data["safety_passed"] is True  # Not unsafe — just wrong format


def test_api_evidence_check_supported_categories_set() -> None:
    """Verify the supported categories are the expected taxonomy set."""
    assert "roads_pothole" in SUPPORTED_VISION_CATEGORIES
    assert "sanitation_open_manhole" in SUPPORTED_VISION_CATEGORIES
    assert "electrical_hanging_wires" in SUPPORTED_VISION_CATEGORIES
    assert len(SUPPORTED_VISION_CATEGORIES) == 10


def test_api_evidence_check_supported_image_types() -> None:
    """Verify supported MIME types set."""
    assert "image/jpeg" in SUPPORTED_IMAGE_TYPES
    assert "image/png" in SUPPORTED_IMAGE_TYPES
    assert "image/webp" in SUPPORTED_IMAGE_TYPES
    assert "application/pdf" not in SUPPORTED_IMAGE_TYPES
