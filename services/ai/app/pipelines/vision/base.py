from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

from app.api.schemas import AiModelMetadata

# Supported MIME types for image evidence
SUPPORTED_IMAGE_TYPES = frozenset(
    [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/gif",
        "image/tiff",
    ]
)

# Supported civic categories for image relevance classification
SUPPORTED_VISION_CATEGORIES = frozenset(
    [
        "roads_pothole",
        "roads_streetlighting",
        "roads_footpath_damage",
        "sanitation_blocked_drain",
        "sanitation_open_manhole",
        "water_pipeline_leak",
        "waste_garbage_dump",
        "waste_dead_animal",
        "electrical_hanging_wires",
        "facilities_public_toilet",
    ]
)

# Image quality thresholds
QUALITY_THRESHOLD_LOW = 0.35
QUALITY_THRESHOLD_ACCEPTABLE = 0.55
QUALITY_THRESHOLD_GOOD = 0.75

# Relevance routing thresholds
RELEVANCE_AUTO_ACCEPT = 0.80  # High confidence: auto-accepted
RELEVANCE_ROUTE_TO_REVIEW = 0.40  # Low confidence: route to human review
# Between 0.40 and 0.80: soft-accept, flagged for audit sample

ReviewDecision = Literal["AUTO_ACCEPTED", "REVIEW_REQUIRED", "SOFT_ACCEPTED"]


@dataclass
class ImageQualityAssessment:
    """Structured image quality metrics."""

    quality_score: float  # 0.0 – 1.0
    is_blurry: bool = False
    is_too_dark: bool = False
    is_too_small: bool = False
    has_watermark: bool = False
    estimated_resolution: str = "UNKNOWN"  # LOW / MEDIUM / HIGH / UNKNOWN
    quality_flags: list[str] = field(default_factory=list)


@dataclass
class CategoryRelevanceScore:
    """Relevance score for one civic category."""

    category_id: str
    relevance_score: float  # 0.0 – 1.0
    confidence: float  # 0.0 – 1.0
    visual_features: list[str] = field(default_factory=list)
    reasoning: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "category_id": self.category_id,
            "relevance_score": self.relevance_score,
            "confidence": self.confidence,
            "visual_features": self.visual_features,
            "reasoning": self.reasoning,
        }


@dataclass
class VisionAnalysisResult:
    """Full result from image relevance/evidence analysis."""

    is_relevant: bool
    relevance_score: float  # overall relevance 0.0 – 1.0
    confidence: float  # classifier confidence 0.0 – 1.0
    primary_category_id: str | None  # best matching civic category if any
    quality: ImageQualityAssessment
    alternative_categories: list[CategoryRelevanceScore] = field(default_factory=list)
    detected_objects: list[str] = field(default_factory=list)
    safety_passed: bool = True
    safety_flags: list[str] = field(default_factory=list)
    quality_flags: list[str] = field(default_factory=list)
    review_decision: ReviewDecision = "AUTO_ACCEPTED"
    explanation: str = ""
    is_unsupported_format: bool = False
    is_low_confidence: bool = False  # uncertain — routed to human review
    model_metadata: AiModelMetadata = field(
        default_factory=lambda: AiModelMetadata(
            name="civiq-vision-baseline",
            version="1.0.0",
            provider="rule-heuristic-baseline",
        )
    )

    def all_flags(self) -> list[str]:
        return list(set(self.safety_flags + self.quality_flags))


class BaseVisionAnalyzer(ABC):
    """Abstract base for pluggable image relevance/evidence analysers."""

    @abstractmethod
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
        """Analyse an image for civic issue relevance and evidence quality."""
        pass

    @abstractmethod
    def get_metadata(self) -> AiModelMetadata:
        """Return model metadata for this analyser."""
        pass

    @property
    @abstractmethod
    def supported_categories(self) -> frozenset[str]:
        """Return set of civic category IDs supported for relevance scoring."""
        pass
