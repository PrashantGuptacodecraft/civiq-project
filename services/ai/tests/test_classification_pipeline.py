import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from app.api.schemas import AiModelMetadata
from app.main import app
from app.pipelines.classification import (
    BaseClassifier,
    ClassificationResult,
    InMemoryFeedbackStore,
    RuleBasedClassifier,
    get_classifier,
    get_feedback_store,
    register_classifier,
    reset_registry,
    set_default_classifier,
)

client = TestClient(app)


# ─────────────────────────────────────────────────────────────
# 1. EVALUATION FIXTURE SET & PRECISION / RECALL SMOKE TEST
# ─────────────────────────────────────────────────────────────


def test_classification_eval_precision_recall_smoke_test() -> None:
    fixtures_path = Path(__file__).parent / "fixtures" / "classification_eval_set.json"
    assert fixtures_path.exists(), f"Fixtures file not found: {fixtures_path}"

    with open(fixtures_path, encoding="utf-8") as f:
        fixtures: list[dict[str, Any]] = json.load(f)

    assert len(fixtures) >= 20, "Evaluation fixture set must contain at least 20 test cases"

    classifier = RuleBasedClassifier()

    correct_category_count = 0
    correct_group_count = 0
    emergency_true_positives = 0
    emergency_false_positives = 0
    emergency_false_negatives = 0

    category_confusion: dict[str, dict[str, int]] = {}

    for item in fixtures:
        title = item.get("title")
        text = item["text"]
        expected_cat = item["expected_category"]
        expected_grp = item["expected_group"]
        is_emergency = item.get("is_emergency", False)

        result = classifier.classify(text=text, title=title)

        pred_cat = result.primary_category
        pred_grp = result.primary_group

        if expected_cat not in category_confusion:
            category_confusion[expected_cat] = {"tp": 0, "fp": 0, "fn": 0}
        if pred_cat not in category_confusion:
            category_confusion[pred_cat] = {"tp": 0, "fp": 0, "fn": 0}

        if pred_cat == expected_cat:
            correct_category_count += 1
            category_confusion[expected_cat]["tp"] += 1
        else:
            category_confusion[expected_cat]["fn"] += 1
            category_confusion[pred_cat]["fp"] += 1

        if pred_grp == expected_grp:
            correct_group_count += 1

        # Emergency metrics
        if is_emergency:
            if result.is_emergency_candidate:
                emergency_true_positives += 1
            else:
                emergency_false_negatives += 1
        else:
            if result.is_emergency_candidate:
                emergency_false_positives += 1

    total = len(fixtures)
    accuracy = correct_category_count / total
    group_accuracy = correct_group_count / total

    # Precision & recall calculations
    precisions: list[float] = []
    recalls: list[float] = []
    for _cat, stats in category_confusion.items():
        tp = stats["tp"]
        fp = stats["fp"]
        fn = stats["fn"]
        p = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 1.0
        precisions.append(p)
        recalls.append(r)

    macro_precision = sum(precisions) / len(precisions) if precisions else 0.0
    macro_recall = sum(recalls) / len(recalls) if recalls else 0.0

    # Smoke test thresholds
    assert accuracy >= 0.90, f"Classification accuracy {accuracy:.2%} below 90% threshold"
    assert group_accuracy >= 0.90, f"Group accuracy {group_accuracy:.2%} below 90% threshold"
    assert macro_precision >= 0.85, f"Macro precision {macro_precision:.2%} below 85% threshold"
    assert macro_recall >= 0.85, f"Macro recall {macro_recall:.2%} below 85% threshold"
    assert emergency_false_negatives == 0, "Emergency cases must never be missed (zero FN required)"


# ─────────────────────────────────────────────────────────────
# 2. RULE-BASED CLASSIFIER CAPABILITIES
# ─────────────────────────────────────────────────────────────


def test_rule_based_classifier_returns_alternatives_and_subcategory() -> None:
    classifier = RuleBasedClassifier()
    result = classifier.classify(
        text="Water pipe broke and clean potable water is gushing out on the road.",
        title="Pipeline Leak",
    )

    assert result.primary_category == "water_pipeline_leak"
    assert result.primary_group == "water_supply"
    assert result.confidence > 0.70
    assert result.predicted_severity == "HIGH"

    # Must return alternative categories with subcategory / group
    assert len(result.alternative_categories) >= 1
    top_alt = result.alternative_categories[0]
    assert top_alt.category_id != result.primary_category
    assert 0.0 <= top_alt.confidence <= 1.0
    assert top_alt.group_id != ""
    assert top_alt.suggested_department != ""


def test_candidate_categories_filter() -> None:
    classifier = RuleBasedClassifier()
    # Provide candidate list that restricts the classification scope
    result = classifier.classify(
        text="Dark road at night because street lamp is broken.",
        title="Streetlight fault",
        candidate_categories=["roads_footpath_damage", "waste_garbage_dump"],
    )

    # Since neither was a strong match, one candidate is still returned within candidate scope
    assert result.primary_category in ["roads_footpath_damage", "waste_garbage_dump"]


def test_fallback_unrecognized_text() -> None:
    classifier = RuleBasedClassifier()
    result = classifier.classify(
        text="Quantum mechanics and astrophysics phenomena in distant galaxies.",
        title="Theoretical inquiry",
    )
    assert result.primary_category == "general_civic"
    assert result.primary_group == "general"
    assert result.confidence == 0.50
    assert not result.is_emergency_candidate


# ─────────────────────────────────────────────────────────────
# 3. PLUGGABLE MODEL / PROVIDER REGISTRY
# ─────────────────────────────────────────────────────────────


class MockPluggableClassifier(BaseClassifier):
    def get_metadata(self) -> AiModelMetadata:
        return AiModelMetadata(
            name="mock-experimental-transformer",
            version="2.0.0-alpha",
            provider="mock-llm-cloud",
        )

    def classify(
        self,
        text: str,
        title: str | None = None,
        candidate_categories: list[str] | None = None,
        language: str | None = None,
    ) -> ClassificationResult:
        return ClassificationResult(
            primary_category="electrical_hanging_wires",
            primary_group="electrical",
            primary_category_name="Dangerous Hanging Wires",
            confidence=0.99,
            predicted_severity="CRITICAL",
            is_emergency_candidate=True,
            explanation="Mock pluggable classifier returned test inference.",
            model_metadata=self.get_metadata(),
        )


def test_pluggable_classifier_registry() -> None:
    reset_registry()
    default_classifier = get_classifier()
    assert isinstance(default_classifier, RuleBasedClassifier)

    # Register custom provider
    custom_model = MockPluggableClassifier()
    register_classifier("experimental-mock", custom_model)

    fetched = get_classifier("experimental-mock")
    assert fetched.get_metadata().name == "mock-experimental-transformer"

    res = fetched.classify(text="Test input")
    assert res.primary_category == "electrical_hanging_wires"
    assert res.confidence == 0.99

    # Test setting custom default and reverting
    set_default_classifier("experimental-mock")
    assert get_classifier().get_metadata().provider == "mock-llm-cloud"

    reset_registry()
    assert get_classifier().get_metadata().name == "civiq-ai-core"


# ─────────────────────────────────────────────────────────────
# 4. HUMAN CORRECTION & LABELED FEEDBACK STORE
# ─────────────────────────────────────────────────────────────


def test_feedback_store_operations() -> None:
    store = InMemoryFeedbackStore()

    entry = store.record_feedback(
        issue_id="issue-101",
        text="Water is accumulating near the sewer drain",
        predicted_category="water_pipeline_leak",
        corrected_category="sanitation_blocked_drain",
        title="Water issue",
        predicted_severity="HIGH",
        corrected_severity="HIGH",
        reviewer_id="moderator-42",
        source="human_review",
        notes="Misclassified clean water vs blocked sewage overflow",
    )

    assert entry.feedback_id != ""
    assert entry.issue_id == "issue-101"
    assert entry.predicted_category == "water_pipeline_leak"
    assert entry.corrected_category == "sanitation_blocked_drain"
    assert entry.predicted_group == "water_supply"
    assert entry.corrected_group == "drainage_sanitation"

    # Query feedback
    all_feedback = store.list_feedback()
    assert len(all_feedback) == 1
    assert all_feedback[0].feedback_id == entry.feedback_id

    # Filter by category
    filtered = store.list_feedback(category="sanitation_blocked_drain")
    assert len(filtered) == 1

    empty_filtered = store.list_feedback(category="roads_pothole")
    assert len(empty_filtered) == 0

    # Retrieve by ID
    retrieved = store.get_feedback_by_id(entry.feedback_id)
    assert retrieved is not None
    assert retrieved.notes == "Misclassified clean water vs blocked sewage overflow"

    # Export dataset
    dataset = store.export_dataset()
    assert len(dataset) == 1
    assert dataset[0]["label"] == "sanitation_blocked_drain"
    assert dataset[0]["label_group"] == "drainage_sanitation"


# ─────────────────────────────────────────────────────────────
# 5. FASTAPI GATEWAY INTEGRATION
# ─────────────────────────────────────────────────────────────


def test_api_classify_returns_taxonomy_and_alternatives() -> None:
    response = client.post(
        "/v1/classify",
        json={
            "text": "Dead dog on the side of the highway requiring immediate removal",
            "title": "Animal carcass",
        },
    )
    assert response.status_code == 200
    data: dict[str, Any] = response.json()

    assert data["primary_category"] == "waste_dead_animal"
    assert data["primary_group"] == "waste_management"
    assert data["primary_subcategory"] == "waste_management"
    assert data["predicted_severity"] == "HIGH"
    assert len(data["alternative_categories"]) > 0

    alt = data["alternative_categories"][0]
    assert "category_id" in alt
    assert "confidence" in alt
    assert "group_id" in alt
    assert "subcategory" in alt


def test_api_submit_and_list_feedback() -> None:
    get_feedback_store().clear()

    payload = {
        "issue_id": "issue-999",
        "text": "Broken footpath tiles near station",
        "title": "Footpath broken",
        "predicted_category": "roads_pothole",
        "corrected_category": "roads_footpath_damage",
        "reviewer_id": "staff-admin-01",
        "notes": "Pothole was incorrect; this is a pedestrian footpath tile issue",
    }
    post_res = client.post("/v1/classify/feedback", json=payload)
    assert post_res.status_code == 200
    post_data: dict[str, Any] = post_res.json()

    assert post_data["success"] is True
    assert post_data["feedback_id"] != ""
    assert post_data["predicted_group"] == "roads"
    assert post_data["corrected_group"] == "roads"

    list_res = client.get("/v1/classify/feedback")
    assert list_res.status_code == 200
    list_data: list[dict[str, Any]] = list_res.json()
    assert len(list_data) == 1
    assert list_data[0]["issue_id"] == "issue-999"
