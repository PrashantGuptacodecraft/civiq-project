from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from app.api.schemas import AiModelMetadata
from app.pipelines.classification.taxonomy import SeverityLevel


@dataclass
class CategoryScore:
    category_id: str
    group_id: str
    category_name: str
    confidence: float
    reasoning: str
    predicted_severity: SeverityLevel
    suggested_department: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "category_id": self.category_id,
            "group_id": self.group_id,
            "category_name": self.category_name,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "predicted_severity": self.predicted_severity,
            "suggested_department": self.suggested_department,
        }


@dataclass
class ClassificationResult:
    primary_category: str
    primary_group: str
    primary_category_name: str
    confidence: float
    predicted_severity: SeverityLevel
    alternative_categories: list[CategoryScore] = field(default_factory=list)
    suggested_tags: list[str] = field(default_factory=list)
    is_emergency_candidate: bool = False
    explanation: str = ""
    model_metadata: AiModelMetadata = field(
        default_factory=lambda: AiModelMetadata(
            name="civiq-ai-core",
            version="1.0.0",
            provider="pluggable-baseline",
        )
    )


class BaseClassifier(ABC):
    """Abstract base classifier for pluggable text classification models."""

    @abstractmethod
    def classify(
        self,
        text: str,
        title: str | None = None,
        candidate_categories: list[str] | None = None,
        language: str | None = None,
    ) -> ClassificationResult:
        """Classify report text and title into taxonomy categories with confidence scores."""
        pass

    @abstractmethod
    def get_metadata(self) -> AiModelMetadata:
        """Return metadata of current classification model/provider."""
        pass
