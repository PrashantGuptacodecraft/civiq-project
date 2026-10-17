import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.pipelines.classification.taxonomy import get_category


@dataclass
class ClassificationFeedback:
    feedback_id: str
    issue_id: str
    text: str
    title: str | None
    predicted_category: str
    predicted_group: str | None
    corrected_category: str
    corrected_group: str | None
    predicted_severity: str | None = None
    corrected_severity: str | None = None
    reviewer_id: str | None = None
    source: str = "human_review"
    created_at: str = ""
    notes: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "feedback_id": self.feedback_id,
            "issue_id": self.issue_id,
            "text": self.text,
            "title": self.title,
            "predicted_category": self.predicted_category,
            "predicted_group": self.predicted_group,
            "corrected_category": self.corrected_category,
            "corrected_group": self.corrected_group,
            "predicted_severity": self.predicted_severity,
            "corrected_severity": self.corrected_severity,
            "reviewer_id": self.reviewer_id,
            "source": self.source,
            "created_at": self.created_at,
            "notes": self.notes,
        }


class BaseFeedbackStore(ABC):
    """Abstract store for human corrections and labeled feedback."""

    @abstractmethod
    def record_feedback(
        self,
        issue_id: str,
        text: str,
        predicted_category: str,
        corrected_category: str,
        title: str | None = None,
        predicted_severity: str | None = None,
        corrected_severity: str | None = None,
        reviewer_id: str | None = None,
        source: str = "human_review",
        notes: str | None = None,
    ) -> ClassificationFeedback:
        """Store a human correction entry."""
        pass

    @abstractmethod
    def list_feedback(
        self,
        category: str | None = None,
        limit: int = 100,
    ) -> list[ClassificationFeedback]:
        """List feedback entries, optionally filtered by category."""
        pass

    @abstractmethod
    def get_feedback_by_id(self, feedback_id: str) -> ClassificationFeedback | None:
        """Retrieve a specific feedback entry by its ID."""
        pass

    @abstractmethod
    def export_dataset(self) -> list[dict[str, Any]]:
        """Export labeled dataset suitable for fine-tuning or model evaluation."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all stored feedback entries (primarily for testing)."""
        pass


class InMemoryFeedbackStore(BaseFeedbackStore):
    """In-memory implementation of feedback store."""

    def __init__(self) -> None:
        self._records: list[ClassificationFeedback] = []

    def record_feedback(
        self,
        issue_id: str,
        text: str,
        predicted_category: str,
        corrected_category: str,
        title: str | None = None,
        predicted_severity: str | None = None,
        corrected_severity: str | None = None,
        reviewer_id: str | None = None,
        source: str = "human_review",
        notes: str | None = None,
    ) -> ClassificationFeedback:
        pred_cat = get_category(predicted_category)
        corr_cat = get_category(corrected_category)

        feedback_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        entry = ClassificationFeedback(
            feedback_id=feedback_id,
            issue_id=issue_id,
            text=text,
            title=title,
            predicted_category=predicted_category,
            predicted_group=pred_cat.group_id if pred_cat else None,
            corrected_category=corrected_category,
            corrected_group=corr_cat.group_id if corr_cat else None,
            predicted_severity=predicted_severity,
            corrected_severity=corrected_severity,
            reviewer_id=reviewer_id,
            source=source,
            created_at=created_at,
            notes=notes,
        )
        self._records.append(entry)
        return entry

    def list_feedback(
        self,
        category: str | None = None,
        limit: int = 100,
    ) -> list[ClassificationFeedback]:
        if category:
            filtered = [
                f
                for f in self._records
                if f.corrected_category == category or f.predicted_category == category
            ]
            return filtered[-limit:]
        return self._records[-limit:]

    def get_feedback_by_id(self, feedback_id: str) -> ClassificationFeedback | None:
        for r in self._records:
            if r.feedback_id == feedback_id:
                return r
        return None

    def export_dataset(self) -> list[dict[str, Any]]:
        return [
            {
                "input_text": f"{r.title or ''} {r.text}".strip(),
                "label": r.corrected_category,
                "label_group": r.corrected_group,
                "severity": r.corrected_severity,
                "source": r.source,
                "issue_id": r.issue_id,
            }
            for r in self._records
        ]

    def clear(self) -> None:
        self._records.clear()


# Default global singleton feedback store
_global_feedback_store: BaseFeedbackStore = InMemoryFeedbackStore()


def get_feedback_store() -> BaseFeedbackStore:
    return _global_feedback_store


def set_feedback_store(store: BaseFeedbackStore) -> None:
    global _global_feedback_store
    _global_feedback_store = store
