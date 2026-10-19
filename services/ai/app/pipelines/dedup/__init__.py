from app.pipelines.dedup.embeddings import (
    BaseImageEmbedder,
    BaseTextEmbedder,
    DenseNgramSemanticEmbedder,
    PerceptualHashEmbedder,
    default_image_embedder,
    default_text_embedder,
)
from app.pipelines.dedup.ensemble import (
    EnsembleScoreBreakdown,
    IssueSummary,
    TransparentEnsembleScorer,
)
from app.pipelines.dedup.evaluator import (
    EvalPair,
    OfflineDuplicateEvaluator,
    ThresholdMetrics,
    ThresholdReport,
)
from app.pipelines.dedup.registry import (
    get_dedup_engine,
    register_dedup_engine,
    reset_dedup_registry,
    set_default_dedup_engine,
)

__all__ = [
    "BaseTextEmbedder",
    "DenseNgramSemanticEmbedder",
    "BaseImageEmbedder",
    "PerceptualHashEmbedder",
    "default_text_embedder",
    "default_image_embedder",
    "IssueSummary",
    "EnsembleScoreBreakdown",
    "TransparentEnsembleScorer",
    "EvalPair",
    "ThresholdMetrics",
    "ThresholdReport",
    "OfflineDuplicateEvaluator",
    "get_dedup_engine",
    "register_dedup_engine",
    "set_default_dedup_engine",
    "reset_dedup_registry",
]
