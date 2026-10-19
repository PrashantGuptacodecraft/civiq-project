import re

from app.api.schemas import AiModelMetadata
from app.pipelines.vision.base import (
    QUALITY_THRESHOLD_ACCEPTABLE,
    RELEVANCE_AUTO_ACCEPT,
    RELEVANCE_ROUTE_TO_REVIEW,
    SUPPORTED_IMAGE_TYPES,
    SUPPORTED_VISION_CATEGORIES,
    BaseVisionAnalyzer,
    CategoryRelevanceScore,
    ImageQualityAssessment,
    ReviewDecision,
    VisionAnalysisResult,
)

# ─────────────────────────────────────────────────────────────
# Category visual feature vocabulary
# Maps each civic category to expected visual signals in image context
# (used to score relevance when actual image bytes are unavailable /
#  in the baseline heuristic mode).
# ─────────────────────────────────────────────────────────────

_CATEGORY_VISUAL_KEYWORDS: dict[str, list[str]] = {
    "roads_pothole": [
        "pothole",
        "crater",
        "hole",
        "road damage",
        "asphalt",
        "tarmac",
        "road surface",
        "broken road",
        "pit",
        "ditch",
        "pavement damage",
        "street damage",
        "road crack",
    ],
    "roads_streetlighting": [
        "streetlight",
        "street lamp",
        "lamp post",
        "light pole",
        "dark road",
        "night road",
        "broken lamp",
        "light tower",
        "sodium light",
        "tube light",
    ],
    "roads_footpath_damage": [
        "footpath",
        "sidewalk",
        "walkway",
        "pavement",
        "pedestrian path",
        "broken tiles",
        "paving stones",
        "footpath damage",
        "slabs",
        "curb",
    ],
    "sanitation_blocked_drain": [
        "drain",
        "blocked drain",
        "gutter",
        "overflow",
        "sewage",
        "waterlogging",
        "flooded road",
        "stagnant water",
        "sewer overflow",
        "drain choke",
        "naali",
        "naala",
        "water accumulation",
    ],
    "sanitation_open_manhole": [
        "manhole",
        "open manhole",
        "uncovered manhole",
        "sewer hole",
        "missing cover",
        "manhole cover",
        "open pit",
        "drain opening",
        "gutter hole",
    ],
    "water_pipeline_leak": [
        "water leak",
        "pipe",
        "water gushing",
        "burst pipe",
        "water flowing",
        "puddle",
        "water stream",
        "wet road",
        "water on road",
        "pipeline",
        "water waste",
    ],
    "waste_garbage_dump": [
        "garbage",
        "trash",
        "waste",
        "rubbish",
        "dump",
        "debris",
        "litter",
        "heap",
        "overflowing bin",
        "solid waste",
        "waste pile",
        "kooda",
        "kachra",
    ],
    "waste_dead_animal": [
        "animal",
        "carcass",
        "dead animal",
        "dog",
        "cat",
        "cow",
        "body",
        "decomposing",
        "stray animal",
        "dead bird",
    ],
    "electrical_hanging_wires": [
        "wire",
        "cable",
        "hanging wire",
        "electric wire",
        "loose wire",
        "sparking",
        "power line",
        "dangling cable",
        "electrical hazard",
        "live wire",
        "bijli taar",
    ],
    "facilities_public_toilet": [
        "toilet",
        "restroom",
        "washroom",
        "latrine",
        "urinal",
        "public toilet",
        "sauchalaya",
        "hygiene",
        "commode",
        "facility",
    ],
}

# Safety content indicator keywords — image flagged for safety review if present
_UNSAFE_CONTENT_KEYWORDS = [
    "explicit",
    "violent",
    "gore",
    "blood",
    "nude",
    "pornographic",
    "dead human",
    "human body",
    "adult content",
]

# Quality signal words in filename / storage key
_LOW_QUALITY_SIGNALS = [
    "blurry",
    "blur",
    "dark",
    "thumb",
    "thumbnail",
    "tiny",
    "small",
    "screenshot",
    "compressed",
    "low_res",
    "lowres",
    "low-res",
]


def _normalize(text: str) -> str:
    return re.sub(r"[^\w\s-]", " ", text.lower())


def _match_keywords(source: str, keywords: list[str]) -> list[str]:
    """Return matched keywords from source text."""
    matched: list[str] = []
    for kw in keywords:
        pattern = r"\b" + re.escape(kw.lower()) + r"\b"
        if re.search(pattern, source):
            matched.append(kw)
    return matched


def _score_text_against_category(
    norm_context: str,
    category_id: str,
) -> tuple[float, list[str]]:
    """Score context text (title + description + storage key) against visual keywords."""
    keywords = _CATEGORY_VISUAL_KEYWORDS.get(category_id, [])
    matched = _match_keywords(norm_context, keywords)
    if not matched:
        return 0.0, []
    raw_score = min(1.0, 0.40 + 0.15 * len(matched))
    return raw_score, matched


class HeuristicVisionAnalyzer(BaseVisionAnalyzer):
    """
    Heuristic/rule-based image evidence analyser baseline.

    In production this would be replaced by a vision LLM or dedicated CV model.
    This baseline:
    - Validates MIME type support
    - Estimates image quality from metadata signals (size hints, MIME, storage key)
    - Scores relevance to civic categories via textual context analysis
    - Routes low-confidence results to human review (never auto-rejects)
    - Checks for potential unsafe content keywords in context
    - Documents all limitations in model card

    Limitation: Cannot analyse actual pixel data without a vision model.
    All visual relevance is estimated from the issue context text and
    storage key signals only. Category confidence is inherently limited.
    """

    def __init__(
        self,
        model_name: str = "civiq-vision-baseline",
        version: str = "1.0.0",
        provider: str = "heuristic-rule-engine",
    ) -> None:
        self._metadata = AiModelMetadata(
            name=model_name,
            version=version,
            provider=provider,
        )

    def get_metadata(self) -> AiModelMetadata:
        return self._metadata

    @property
    def supported_categories(self) -> frozenset[str]:
        return SUPPORTED_VISION_CATEGORIES

    def _assess_quality(
        self,
        mime_type: str,
        storage_key: str | None,
        media_url: str | None,
        media_base64: str | None,
    ) -> ImageQualityAssessment:
        """Estimate image quality from available metadata signals."""
        quality_flags: list[str] = []
        quality_score = 0.75  # default optimistic score
        is_blurry = False
        is_too_dark = False
        is_too_small = False

        context_hint = " ".join(
            filter(None, [storage_key, media_url])
        ).lower()

        # Low quality signals in filename/URL
        low_q_matches = _match_keywords(context_hint, _LOW_QUALITY_SIGNALS)
        if low_q_matches:
            quality_score -= 0.20 * len(low_q_matches)
            if "blur" in context_hint or "blurry" in context_hint:
                is_blurry = True
                quality_flags.append("BLURRY_DETECTED")
            if "dark" in context_hint:
                is_too_dark = True
                quality_flags.append("LOW_LIGHT")
            if any(k in context_hint for k in ["thumb", "thumbnail", "tiny", "small"]):
                is_too_small = True
                quality_flags.append("LOW_RESOLUTION")

        # Animated GIF lowers quality score
        if mime_type == "image/gif":
            quality_score -= 0.15
            quality_flags.append("ANIMATED_OR_GIF_FORMAT")

        # BMP / TIFF are raw / acceptable
        if mime_type in ("image/bmp", "image/tiff"):
            quality_flags.append("RAW_FORMAT")

        # If base64 provided, treat as direct upload (higher quality signal)
        if media_base64 and len(media_base64) > 100:
            quality_score = max(quality_score, 0.70)

        quality_score = round(max(0.10, min(1.0, quality_score)), 3)

        # Estimate resolution tier
        if quality_score >= QUALITY_THRESHOLD_ACCEPTABLE:
            resolution_tier = "MEDIUM"
        elif quality_score >= 0.70:
            resolution_tier = "HIGH"
        else:
            resolution_tier = "LOW"

        return ImageQualityAssessment(
            quality_score=quality_score,
            is_blurry=is_blurry,
            is_too_dark=is_too_dark,
            is_too_small=is_too_small,
            has_watermark=False,
            estimated_resolution=resolution_tier,
            quality_flags=quality_flags,
        )

    def _check_safety(self, norm_context: str) -> tuple[bool, list[str]]:
        """Check for unsafe content signals in context."""
        unsafe_matched = _match_keywords(norm_context, _UNSAFE_CONTENT_KEYWORDS)
        safety_passed = len(unsafe_matched) == 0
        safety_flags = [f"UNSAFE_CONTENT_SIGNAL:{kw}" for kw in unsafe_matched]
        return safety_passed, safety_flags

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
        # 1. Validate MIME type
        if mime_type not in SUPPORTED_IMAGE_TYPES:
            quality = ImageQualityAssessment(
                quality_score=0.0,
                quality_flags=["UNSUPPORTED_FORMAT"],
            )
            return VisionAnalysisResult(
                is_relevant=False,
                relevance_score=0.0,
                confidence=0.0,
                primary_category_id=None,
                quality=quality,
                detected_objects=[],
                safety_passed=True,
                safety_flags=[],
                quality_flags=["UNSUPPORTED_FORMAT"],
                review_decision="REVIEW_REQUIRED",
                explanation=(
                    f"Unsupported MIME type '{mime_type}'. "
                    f"Supported formats: JPEG, PNG, WebP, BMP, GIF, TIFF. "
                    "Evidence routed to human review — not auto-rejected."
                ),
                is_unsupported_format=True,
                is_low_confidence=True,
                model_metadata=self._metadata,
            )

        # 2. Assess quality
        quality = self._assess_quality(
            mime_type=mime_type,
            storage_key=media_storage_key,
            media_url=media_url,
            media_base64=media_base64,
        )

        # 3. Build normalised context from text signals
        context_parts = [issue_title, issue_description]
        if media_storage_key:
            # Use last path component of storage key as a visual hint
            key_hint = media_storage_key.replace("/", " ").replace("_", " ").replace("-", " ")
            context_parts.append(key_hint)
        norm_context = _normalize(" ".join(context_parts))

        # 4. Safety check
        safety_passed, safety_flags = self._check_safety(norm_context)

        # 5. Relevance scoring
        target_cats: list[str]
        if category_id and category_id in SUPPORTED_VISION_CATEGORIES:
            target_cats = [category_id]
        elif category_id:
            # Category provided but not in supported set — include anyway + all others
            target_cats = [category_id] + [
                c for c in SUPPORTED_VISION_CATEGORIES if c != category_id
            ]
        else:
            target_cats = list(SUPPORTED_VISION_CATEGORIES)

        category_scores: list[CategoryRelevanceScore] = []
        for cat_id in target_cats:
            raw_score, matched_kws = _score_text_against_category(norm_context, cat_id)
            # Confidence is proportional to number of matched keywords
            conf = min(0.95, 0.50 + raw_score * 0.50) if raw_score > 0 else 0.25
            category_scores.append(
                CategoryRelevanceScore(
                    category_id=cat_id,
                    relevance_score=round(raw_score, 3),
                    confidence=round(conf, 3),
                    visual_features=matched_kws[:5],
                    reasoning=(
                        f"Context signals: {', '.join(matched_kws[:3])}"
                        if matched_kws
                        else "No specific visual indicator keywords found in context"
                    ),
                )
            )

        # Sort by relevance score descending
        category_scores.sort(key=lambda c: c.relevance_score, reverse=True)

        primary_score_entry = category_scores[0] if category_scores else None
        primary_category_id: str | None = None
        overall_relevance = 0.0
        overall_confidence = 0.25

        if primary_score_entry and primary_score_entry.relevance_score > 0:
            primary_category_id = primary_score_entry.category_id
            overall_relevance = primary_score_entry.relevance_score
            overall_confidence = primary_score_entry.confidence
        else:
            # No keyword signals — low confidence, route to review
            overall_relevance = 0.30  # soft pass; do not auto-reject
            overall_confidence = 0.20

        # Adjust relevance down if quality is poor
        if quality.quality_score < QUALITY_THRESHOLD_ACCEPTABLE:
            overall_relevance *= 0.85
            overall_confidence *= 0.80

        overall_relevance = round(min(1.0, overall_relevance), 3)
        overall_confidence = round(min(1.0, overall_confidence), 3)

        # 6. Routing decision — NEVER auto-reject; low confidence → human review
        review_decision: ReviewDecision
        is_low_confidence = overall_confidence < 0.50
        is_relevant = overall_relevance >= 0.30

        if not safety_passed:
            review_decision = "REVIEW_REQUIRED"
        elif overall_relevance >= RELEVANCE_AUTO_ACCEPT and overall_confidence >= 0.65:
            review_decision = "AUTO_ACCEPTED"
        elif overall_relevance < RELEVANCE_ROUTE_TO_REVIEW or is_low_confidence:
            review_decision = "REVIEW_REQUIRED"
            is_relevant = True  # Route to review — do NOT auto-reject
        else:
            review_decision = "SOFT_ACCEPTED"

        # 7. Assemble detected objects (from visual feature keywords)
        detected_objects: list[str] = []
        if primary_score_entry:
            detected_objects = primary_score_entry.visual_features[:5]
        if not detected_objects:
            detected_objects = ["civic_scene"]

        # 8. Explanation
        if not safety_passed:
            explanation = (
                "Potential unsafe content signals detected in evidence context. "
                "Image routed to human reviewer before any decision."
            )
        elif primary_category_id:
            cat_display = primary_category_id.replace("_", " ").title()
            explanation = (
                f"Visual context indicates relevance to '{cat_display}'. "
                f"Confidence: {overall_confidence:.0%}. "
                f"Quality score: {quality.quality_score:.0%}. "
                f"Decision: {review_decision.replace('_', ' ')}."
            )
            if is_low_confidence:
                explanation += (
                    " Low confidence — image routed to human review for verification."
                )
        else:
            explanation = (
                "Insufficient visual context signals to determine category relevance. "
                "Image marked for human review. Not auto-rejected."
            )

        all_quality_flags = quality.quality_flags.copy()
        if is_low_confidence:
            all_quality_flags.append("LOW_CONFIDENCE_ROUTED_TO_REVIEW")

        return VisionAnalysisResult(
            is_relevant=is_relevant,
            relevance_score=overall_relevance,
            confidence=overall_confidence,
            primary_category_id=primary_category_id,
            quality=quality,
            alternative_categories=category_scores[1:4],  # top-3 alternatives
            detected_objects=detected_objects,
            safety_passed=safety_passed,
            safety_flags=safety_flags,
            quality_flags=all_quality_flags,
            review_decision=review_decision,
            explanation=explanation,
            is_unsupported_format=False,
            is_low_confidence=is_low_confidence,
            model_metadata=self._metadata,
        )
