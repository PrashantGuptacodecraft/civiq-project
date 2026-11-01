"""
Resource Matching Pipeline Package
Phase 65: Build need-to-resource matching
"""

from app.pipelines.resource_matching.matcher import (
    DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    ResourceMatcher,
    haversine_distance_km,
)
from app.pipelines.resource_matching.registry import (
    get_resource_matcher,
    reset_resource_matcher,
)
from app.pipelines.resource_matching.schemas import (
    MatchFactorScore,
    NeedMatchInput,
    ResourceMatchResult,
)

__all__ = [
    "DISASTER_RESOURCE_MATCHING_DISCLAIMER",
    "MatchFactorScore",
    "NeedMatchInput",
    "ResourceMatchResult",
    "ResourceMatcher",
    "get_resource_matcher",
    "haversine_distance_km",
    "reset_resource_matcher",
]
