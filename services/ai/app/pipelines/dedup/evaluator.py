from dataclasses import dataclass, field
from typing import Any

from app.pipelines.dedup.ensemble import IssueSummary, TransparentEnsembleScorer


@dataclass
class EvalPair:
    pair_id: str
    target: IssueSummary
    candidate: IssueSummary
    expected_is_duplicate: bool
    scenario: str = ""


@dataclass
class ThresholdMetrics:
    threshold: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    accuracy: float


@dataclass
class ThresholdReport:
    total_pairs: int
    positive_pairs: int
    negative_pairs: int
    recommended_threshold: float
    high_impact_threshold: float
    metrics_by_threshold: list[ThresholdMetrics] = field(default_factory=list)
    markdown_report: str = ""


class OfflineDuplicateEvaluator:
    """Evaluates duplicate detection ensemble on labeled pairs and produces threshold reports."""

    def __init__(self, scorer: TransparentEnsembleScorer | None = None) -> None:
        self.scorer = scorer or TransparentEnsembleScorer()

    def evaluate(
        self,
        pairs: list[EvalPair],
        thresholds: list[float] | None = None,
    ) -> ThresholdReport:
        target_thresholds = thresholds or [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]

        # Score all pairs once
        scored_pairs: list[tuple[EvalPair, float]] = []
        for p in pairs:
            result = self.scorer.score_pair(p.target, p.candidate)
            scored_pairs.append((p, result.total_score))

        metrics_list: list[ThresholdMetrics] = []
        best_f1 = -1.0
        recommended_threshold = 0.70

        for t in target_thresholds:
            tp = fp = tn = fn = 0
            for pair, score in scored_pairs:
                predicted = score >= t
                actual = pair.expected_is_duplicate
                if predicted and actual:
                    tp += 1
                elif predicted and not actual:
                    fp += 1
                elif not predicted and not actual:
                    tn += 1
                else:
                    fn += 1

            total = len(pairs)
            precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 1.0
            recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
            f1 = (
                round(2.0 * (precision * recall) / (precision + recall), 4)
                if (precision + recall) > 0
                else 0.0
            )
            accuracy = round((tp + tn) / total, 4) if total > 0 else 0.0

            m = ThresholdMetrics(
                threshold=round(t, 2),
                true_positives=tp,
                false_positives=fp,
                true_negatives=tn,
                false_negatives=fn,
                precision=precision,
                recall=recall,
                f1_score=f1,
                accuracy=accuracy,
            )
            metrics_list.append(m)

            if f1 > best_f1:
                best_f1 = f1
                recommended_threshold = t

        # Markdown formatted report
        pos_count = sum(1 for p in pairs if p.expected_is_duplicate)
        neg_count = sum(1 for p in pairs if not p.expected_is_duplicate)
        high_thresh = TransparentEnsembleScorer.HIGH_IMPACT_THRESHOLD
        md_lines = [
            "# Offline Duplicate Detection Threshold Evaluation Report",
            f"- Total evaluated pairs: {len(pairs)}",
            f"- Ground truth duplicate pairs: {pos_count}",
            f"- Ground truth distinct pairs: {neg_count}",
            f"- Recommended operational threshold: {recommended_threshold:.2f} "
            f"(Max F1: {best_f1:.2%})",
            f"- High-impact manual review threshold: {high_thresh:.2f}",
            "",
            "| Threshold | Precision | Recall | F1 Score | Accuracy | TP | FP | TN | FN |",
            "|---|---|---|---|---|---|---|---|---|",
        ]

        for m in metrics_list:
            md_lines.append(
                f"| {m.threshold:.2f} | {m.precision:.2%} | {m.recall:.2%} | "
                f"{m.f1_score:.2%} | {m.accuracy:.2%} | {m.true_positives} | "
                f"{m.false_positives} | {m.true_negatives} | {m.false_negatives} |"
            )

        report_md = "\n".join(md_lines)

        return ThresholdReport(
            total_pairs=len(pairs),
            positive_pairs=sum(1 for p in pairs if p.expected_is_duplicate),
            negative_pairs=sum(1 for p in pairs if not p.expected_is_duplicate),
            recommended_threshold=round(recommended_threshold, 2),
            high_impact_threshold=TransparentEnsembleScorer.HIGH_IMPACT_THRESHOLD,
            metrics_by_threshold=metrics_list,
            markdown_report=report_md,
        )

    def load_fixtures(self, raw_data: list[dict[str, Any]]) -> list[EvalPair]:
        """Convert fixture dicts into EvalPair instances."""
        pairs: list[EvalPair] = []
        for d in raw_data:
            target = IssueSummary(
                id=d["target"]["id"],
                title=d["target"]["title"],
                description=d["target"]["description"],
                category_id=d["target"].get("category_id"),
                latitude=d["target"].get("latitude"),
                longitude=d["target"].get("longitude"),
                created_at=d["target"].get("created_at"),
                image_perceptual_hash=d["target"].get("image_perceptual_hash"),
            )
            candidate = IssueSummary(
                id=d["candidate"]["id"],
                title=d["candidate"]["title"],
                description=d["candidate"]["description"],
                category_id=d["candidate"].get("category_id"),
                latitude=d["candidate"].get("latitude"),
                longitude=d["candidate"].get("longitude"),
                created_at=d["candidate"].get("created_at"),
                image_perceptual_hash=d["candidate"].get("image_perceptual_hash"),
            )
            pairs.append(
                EvalPair(
                    pair_id=d.get("id", f"{target.id}_{candidate.id}"),
                    target=target,
                    candidate=candidate,
                    expected_is_duplicate=bool(d["expected_is_duplicate"]),
                    scenario=d.get("scenario", ""),
                )
            )
        return pairs
