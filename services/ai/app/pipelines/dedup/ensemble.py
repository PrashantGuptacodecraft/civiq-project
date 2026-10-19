import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.pipelines.dedup.embeddings import (
    BaseImageEmbedder,
    BaseTextEmbedder,
    default_image_embedder,
    default_text_embedder,
)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute spherical distance between two WGS-84 coordinate points in meters."""
    radius = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius * c, 2)


def _parse_iso_datetime(dt_str: str | None) -> datetime | None:
    """Parse ISO datetime string safely."""
    if not dt_str:
        return None
    try:
        # Handle trailing Z
        normalized = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


@dataclass
class IssueSummary:
    id: str
    title: str
    description: str
    category_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    created_at: str | None = None
    image_perceptual_hash: str | None = None


@dataclass
class EnsembleScoreBreakdown:
    candidate_id: str
    total_score: float
    semantic_similarity: float
    image_similarity: float | None
    geo_similarity: float | None
    time_similarity: float | None
    geo_distance_meters: float | None
    time_delta_hours: float | None
    is_duplicate: bool
    is_high_impact: bool
    weights_used: dict[str, float]
    match_explanation: str
    decision_evidence: dict[str, Any] = field(default_factory=dict)


class TransparentEnsembleScorer:
    """
    Transparent ensemble scoring engine combining:
    1. Text semantic embeddings (cosine similarity)
    2. Image perceptual hash similarity / embeddings (Hamming distance)
    3. Geospatial proximity (Haversine distance decay)
    4. Temporal proximity (decay over 7 days)
    5. Civic category compatibility

    Weights are dynamically reallocated based on available signals,
    with complete mathematical audit evidence preserved.
    """

    DEFAULT_THRESHOLD = 0.70
    HIGH_IMPACT_THRESHOLD = 0.85
    MAX_DISTANCE_METERS = 500.0
    MAX_TIME_HOURS = 168.0  # 7 days

    def __init__(
        self,
        text_embedder: BaseTextEmbedder | None = None,
        image_embedder: BaseImageEmbedder | None = None,
        base_weights: dict[str, float] | None = None,
    ) -> None:
        self.text_embedder = text_embedder or default_text_embedder
        self.image_embedder = image_embedder or default_image_embedder
        # Default nominal weights when all signals are present
        self.base_weights = base_weights or {
            "geo": 0.35,
            "text": 0.35,
            "image": 0.15,
            "time": 0.15,
        }

    def _calculate_geo_score(
        self,
        target: IssueSummary,
        candidate: IssueSummary,
    ) -> tuple[float | None, float | None]:
        """Returns (geo_score [0..1], distance_meters)."""
        if (
            target.latitude is None
            or target.longitude is None
            or candidate.latitude is None
            or candidate.longitude is None
        ):
            return None, None

        dist = _haversine_meters(
            target.latitude,
            target.longitude,
            candidate.latitude,
            candidate.longitude,
        )

        if dist <= 25.0:
            return 1.0, dist
        if dist > self.MAX_DISTANCE_METERS:
            return 0.0, dist

        # Linear decay between 25m and 500m
        score = 1.0 - ((dist - 25.0) / (self.MAX_DISTANCE_METERS - 25.0))
        return round(max(0.0, min(1.0, score)), 4), dist

    def _calculate_time_score(
        self,
        target: IssueSummary,
        candidate: IssueSummary,
    ) -> tuple[float | None, float | None]:
        """Returns (time_score [0..1], delta_hours)."""
        dt_target = _parse_iso_datetime(target.created_at)
        dt_cand = _parse_iso_datetime(candidate.created_at)

        if not dt_target or not dt_cand:
            return None, None

        # Ensure UTC timezone comparability
        if dt_target.tzinfo is None:
            dt_target = dt_target.replace(tzinfo=timezone.utc)
        if dt_cand.tzinfo is None:
            dt_cand = dt_cand.replace(tzinfo=timezone.utc)

        diff_seconds = abs((dt_target - dt_cand).total_seconds())
        delta_hours = round(diff_seconds / 3600.0, 2)

        if delta_hours <= 1.0:
            return 1.0, delta_hours
        if delta_hours > self.MAX_TIME_HOURS:
            return 0.0, delta_hours

        # Decay over 7 days
        score = 1.0 - (delta_hours / self.MAX_TIME_HOURS)
        return round(max(0.0, min(1.0, score)), 4), delta_hours

    def _calculate_text_score(
        self,
        target: IssueSummary,
        candidate: IssueSummary,
    ) -> float:
        """Compute cosine similarity of dense subword n-gram text embeddings."""
        text_a = f"{target.title} {target.description}".strip()
        text_b = f"{candidate.title} {candidate.description}".strip()

        vec_a = self.text_embedder.embed(text_a)
        vec_b = self.text_embedder.embed(text_b)

        sim = self.text_embedder.similarity(vec_a, vec_b)
        return round(sim, 4)

    def _calculate_image_score(
        self,
        target: IssueSummary,
        candidate: IssueSummary,
    ) -> float | None:
        """Compute perceptual hash similarity if hashes are present on both."""
        if not target.image_perceptual_hash or not candidate.image_perceptual_hash:
            return None

        sim = self.image_embedder.hash_similarity(
            target.image_perceptual_hash,
            candidate.image_perceptual_hash,
        )
        return round(sim, 4)

    def score_pair(
        self,
        target: IssueSummary,
        candidate: IssueSummary,
        threshold: float | None = None,
    ) -> EnsembleScoreBreakdown:
        active_threshold = threshold if threshold is not None else self.DEFAULT_THRESHOLD

        # 1. Compute individual component signals
        geo_score, geo_dist = self._calculate_geo_score(target, candidate)
        time_score, time_delta = self._calculate_time_score(target, candidate)
        text_score = self._calculate_text_score(target, candidate)
        image_score = self._calculate_image_score(target, candidate)

        # 2. Dynamic transparent weight reallocation
        raw_weights: dict[str, float] = {}
        scores: dict[str, float] = {"text": text_score}
        raw_weights["text"] = self.base_weights["text"]

        if geo_score is not None:
            scores["geo"] = geo_score
            raw_weights["geo"] = self.base_weights["geo"]

        if time_score is not None:
            scores["time"] = time_score
            raw_weights["time"] = self.base_weights["time"]

        if image_score is not None:
            scores["image"] = image_score
            raw_weights["image"] = self.base_weights["image"]

        # Normalize weights so they sum strictly to 1.0
        total_raw_weight = sum(raw_weights.values())
        norm_weights = {k: round(w / total_raw_weight, 4) for k, w in raw_weights.items()}

        # 3. Compute weighted ensemble score
        raw_ensemble = sum(scores[k] * norm_weights[k] for k in scores)

        # 4. Category compatibility modifier
        category_modifier = 1.0
        if target.category_id and candidate.category_id:
            if target.category_id == candidate.category_id:
                # Same category gives confidence boost
                category_modifier = 1.02
            else:
                # Different category applies mild penalty (different issues at same spot)
                category_modifier = 0.85

        final_score = round(min(1.0, max(0.0, raw_ensemble * category_modifier)), 4)

        # 5. Build human-readable explanations & decision evidence
        reasons: list[str] = []
        if text_score >= 0.75:
            reasons.append(f"High text semantic overlap ({text_score:.0%})")
        elif text_score >= 0.50:
            reasons.append(f"Moderate text similarity ({text_score:.0%})")

        if geo_score is not None and geo_dist is not None:
            if geo_dist <= 50.0:
                reasons.append(f"Same immediate location ({geo_dist:.0f}m)")
            elif geo_score > 0.50:
                reasons.append(f"Nearby vicinity ({geo_dist:.0f}m)")

        if time_score is not None and time_delta is not None:
            if time_delta <= 12.0:
                reasons.append(f"Reported close in time ({time_delta:.1f}h)")

        if image_score is not None:
            if image_score >= 0.85:
                reasons.append(f"Strong image evidence match ({image_score:.0%})")
            elif image_score >= 0.65:
                reasons.append(f"Partial visual similarity ({image_score:.0%})")

        if not reasons:
            reasons.append(f"Ensemble similarity score {final_score:.0%}")

        match_explanation = "; ".join(reasons)
        is_duplicate = final_score >= active_threshold
        is_high_impact = final_score >= self.HIGH_IMPACT_THRESHOLD

        decision_evidence = {
            "target_id": target.id,
            "candidate_id": candidate.id,
            "final_score": final_score,
            "threshold": active_threshold,
            "high_impact_threshold": self.HIGH_IMPACT_THRESHOLD,
            "is_high_impact": is_high_impact,
            "category_modifier": category_modifier,
            "components": {
                "text": {
                    "score": text_score,
                    "weight": norm_weights.get("text"),
                },
                "geo": {
                    "score": geo_score,
                    "weight": norm_weights.get("geo"),
                    "distance_meters": geo_dist,
                },
                "time": {
                    "score": time_score,
                    "weight": norm_weights.get("time"),
                    "delta_hours": time_delta,
                },
                "image": {
                    "score": image_score,
                    "weight": norm_weights.get("image"),
                },
            },
        }

        return EnsembleScoreBreakdown(
            candidate_id=candidate.id,
            total_score=final_score,
            semantic_similarity=text_score,
            image_similarity=image_score,
            geo_similarity=geo_score,
            time_similarity=time_score,
            geo_distance_meters=geo_dist,
            time_delta_hours=time_delta,
            is_duplicate=is_duplicate,
            is_high_impact=is_high_impact,
            weights_used=norm_weights,
            match_explanation=match_explanation,
            decision_evidence=decision_evidence,
        )

    def score_candidates(
        self,
        target: IssueSummary,
        candidates: list[IssueSummary],
        threshold: float | None = None,
    ) -> list[EnsembleScoreBreakdown]:
        results = [self.score_pair(target, c, threshold=threshold) for c in candidates]
        results.sort(key=lambda r: r.total_score, reverse=True)
        return results
