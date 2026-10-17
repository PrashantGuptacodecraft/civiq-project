import math
import re
from typing import Literal

from app.api.schemas import AiModelMetadata
from app.pipelines.classification.base import (
    BaseClassifier,
    CategoryScore,
    ClassificationResult,
)
from app.pipelines.classification.taxonomy import (
    CIVIC_TAXONOMY_CATEGORIES,
    EMERGENCY_INDICATORS,
    FALLBACK_CATEGORY,
    CivicCategory,
    SeverityLevel,
)


class RuleBasedClassifier(BaseClassifier):
    """
    Deterministic lexical and semantic rule-based classifier.
    Matches civic issue title and description against versioned civic taxonomy
    with keyword weighting, phrase matching, candidate filtering, and emergency detection.
    """

    def __init__(
        self,
        model_name: str = "civiq-ai-core",
        version: str = "1.0.0",
        provider: str = "baseline-rule-engine",
    ) -> None:
        self.model_name = model_name
        self.version = version
        self.provider = provider
        self.metadata = AiModelMetadata(
            name=self.model_name,
            version=self.version,
            provider=self.provider,
        )

    def get_metadata(self) -> AiModelMetadata:
        return self.metadata

    def _normalize(self, text: str) -> str:
        """Lowercase and normalize punctuation/whitespace."""
        clean = re.sub(r"[^\w\s-]", " ", text.lower())
        return " ".join(clean.split())

    def _score_category(
        self,
        category: CivicCategory,
        norm_title: str,
        norm_text: str,
    ) -> tuple[float, list[str]]:
        """Score a category against title and description using weighted token/phrase match."""
        raw_score = 0.0
        matched_terms: list[str] = []
        combined_text = f"{norm_title} {norm_text}"

        for kw in category.keywords:
            kw_norm = kw.lower()
            # Multi-word phrase exact match
            if " " in kw_norm:
                pattern = r"\b" + re.escape(kw_norm) + r"\b"
                if re.search(pattern, norm_title):
                    raw_score += 4.0
                    matched_terms.append(f"title phrase '{kw}'")
                elif re.search(pattern, norm_text):
                    raw_score += 2.5
                    matched_terms.append(f"body phrase '{kw}'")
                else:
                    # Token co-occurrence check for multi-word phrases
                    tokens = kw_norm.split()
                    if len(tokens) >= 2 and all(
                        re.search(r"\b" + re.escape(t) + r"\w*", combined_text) for t in tokens
                    ):
                        raw_score += 2.2
                        matched_terms.append(f"terms '{kw}'")
            else:
                pattern = r"\b" + re.escape(kw_norm) + r"\b"
                stem_pattern = r"\b" + re.escape(kw_norm) + r"\w*" if len(kw_norm) >= 4 else pattern
                if re.search(pattern, norm_title):
                    raw_score += 2.5
                    matched_terms.append(f"title word '{kw}'")
                elif re.search(pattern, norm_text):
                    raw_score += 1.5
                    matched_terms.append(f"body word '{kw}'")
                elif re.search(stem_pattern, norm_title):
                    raw_score += 1.8
                    matched_terms.append(f"title stem '{kw}'")
                elif re.search(stem_pattern, norm_text):
                    raw_score += 1.0
                    matched_terms.append(f"body stem '{kw}'")

        return raw_score, matched_terms

    def classify(
        self,
        text: str,
        title: str | None = None,
        candidate_categories: list[str] | None = None,
        language: str | None = None,
    ) -> ClassificationResult:
        norm_title = self._normalize(title or "")
        norm_text = self._normalize(text)
        full_text = f"{norm_title} {norm_text}".strip()

        # 1. Emergency detection
        is_emergency = False
        emergency_matched: list[str] = []
        for term in EMERGENCY_INDICATORS:
            if re.search(r"\b" + re.escape(term) + r"\b", full_text):
                is_emergency = True
                emergency_matched.append(term)

        # 2. Score candidate or all taxonomy categories
        target_categories: dict[str, CivicCategory]
        if candidate_categories:
            valid_candidates = {
                cid: CIVIC_TAXONOMY_CATEGORIES[cid]
                for cid in candidate_categories
                if cid in CIVIC_TAXONOMY_CATEGORIES
            }
            target_categories = valid_candidates if valid_candidates else CIVIC_TAXONOMY_CATEGORIES
        else:
            target_categories = CIVIC_TAXONOMY_CATEGORIES

        scores: dict[str, float] = {}
        matches_by_cat: dict[str, list[str]] = {}

        for cat_id, cat in target_categories.items():
            score, matched = self._score_category(cat, norm_title, norm_text)
            scores[cat_id] = score
            matches_by_cat[cat_id] = matched

        # If open manhole keywords matched, enforce strong boost
        if "sanitation_open_manhole" in scores and any(
            t in full_text
            for t in [
                "open manhole",
                "uncovered manhole",
                "manhole cover missing",
                "broken manhole",
                "open sewer",
            ]
        ):
            scores["sanitation_open_manhole"] += 6.0
            is_emergency = True

        # If live/hanging wire keywords matched, boost electrical_hanging_wires
        if "electrical_hanging_wires" in scores and any(
            t in full_text
            for t in [
                "hanging wire",
                "dangling wire",
                "live wire",
                "sparking wire",
                "loose wire",
                "electrocution",
            ]
        ):
            scores["electrical_hanging_wires"] += 6.0
            is_emergency = True

        # Sort categories by raw score descending
        sorted_cats = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        top_cat_id, top_raw_score = sorted_cats[0]

        # 3. Determine primary classification vs fallback
        primary_cat: CivicCategory
        confidence: float
        explanation: str
        predicted_severity: SeverityLevel

        if top_raw_score > 0.0:
            primary_cat = target_categories[top_cat_id]

            # Softmax-inspired calibrated confidence
            total_score = sum(math.exp(min(s, 20.0)) for _, s in sorted_cats)
            top_exp = math.exp(min(top_raw_score, 20.0))
            softmax_prob = top_exp / total_score if total_score > 0 else 0.50

            # Calibrate between 0.72 and 0.98 for high confidence matches
            confidence = round(min(0.98, max(0.72, 0.70 + softmax_prob * 0.28)), 2)

            matched_terms = matches_by_cat[top_cat_id]
            explanation = (
                f"Classified as '{primary_cat.name}' in group '{primary_cat.group_name}'. "
                f"Key indicator signals: {', '.join(matched_terms[:3])}."
            )
            predicted_severity = primary_cat.severity
        elif candidate_categories:
            # Fall back to first requested candidate
            first_candidate_id = list(target_categories.keys())[0]
            primary_cat = target_categories[first_candidate_id]
            confidence = 0.50
            explanation = (
                f"No decisive domain taxonomy keywords identified. "
                f"Selected first candidate '{primary_cat.name}' from specified candidates."
            )
            predicted_severity = primary_cat.severity
        else:
            primary_cat = FALLBACK_CATEGORY
            confidence = 0.50
            explanation = (
                "No decisive domain taxonomy keywords identified. "
                "Defaulting to general municipal issue triage."
            )
            predicted_severity = "MEDIUM"

        # If primary category is inherently critical or emergency term matched, flag emergency
        if primary_cat.severity == "CRITICAL" and primary_cat.id in [
            "sanitation_open_manhole",
            "electrical_hanging_wires",
        ]:
            is_emergency = True

        if is_emergency:
            predicted_severity = "CRITICAL"
            explanation += f" Emergency indicator detected ({', '.join(emergency_matched)})."

        # 4. Generate Alternative Categories
        alternative_categories: list[CategoryScore] = []
        for cat_id, score in sorted_cats:
            if cat_id == primary_cat.id:
                continue
            cat = target_categories[cat_id]
            if score > 0.0:
                alt_conf = round(min(0.65, max(0.20, (score / (top_raw_score + 1.0)) * 0.65)), 2)
                reason = (
                    f"Secondary match based on {', '.join(matches_by_cat[cat_id][:2])}"
                    if matches_by_cat[cat_id]
                    else "Contextual relevance"
                )
            else:
                alt_conf = 0.10
                reason = f"Candidate in {cat.group_name}"

            alternative_categories.append(
                CategoryScore(
                    category_id=cat.id,
                    group_id=cat.group_id,
                    category_name=cat.name,
                    confidence=alt_conf,
                    reasoning=reason,
                    predicted_severity=cat.severity,
                    suggested_department=cat.default_department,
                )
            )

        # Ensure top 3 alternatives are returned
        top_alternatives = alternative_categories[:3]

        # 5. Compile suggested tags
        tags: list[str] = list(primary_cat.tags)
        if is_emergency:
            tags.extend(["emergency", "critical-safety"])
        if primary_cat.group_id != "general":
            tags.append(primary_cat.group_id)

        # Remove duplicates while preserving order
        deduped_tags: list[str] = []
        for t in tags:
            if t not in deduped_tags:
                deduped_tags.append(t)

        severity_result: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = predicted_severity

        return ClassificationResult(
            primary_category=primary_cat.id,
            primary_group=primary_cat.group_id,
            primary_category_name=primary_cat.name,
            confidence=confidence,
            predicted_severity=severity_result,
            alternative_categories=top_alternatives,
            suggested_tags=deduped_tags,
            is_emergency_candidate=is_emergency,
            explanation=explanation,
            model_metadata=self.metadata,
        )
