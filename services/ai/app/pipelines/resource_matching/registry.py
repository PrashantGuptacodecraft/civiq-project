"""
Resource Matching Pipeline Registry Provider
Phase 65: Build need-to-resource matching
"""

from app.pipelines.resource_matching.matcher import ResourceMatcher

_MATCHER_INSTANCE: ResourceMatcher | None = None


def get_resource_matcher() -> ResourceMatcher:
    """Return singleton deterministic ResourceMatcher instance."""
    global _MATCHER_INSTANCE
    if _MATCHER_INSTANCE is None:
        _MATCHER_INSTANCE = ResourceMatcher()
    return _MATCHER_INSTANCE


def reset_resource_matcher() -> None:
    """Reset singleton for unit tests."""
    global _MATCHER_INSTANCE
    _MATCHER_INSTANCE = None
