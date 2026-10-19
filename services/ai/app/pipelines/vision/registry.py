from app.pipelines.vision.base import BaseVisionAnalyzer
from app.pipelines.vision.heuristic import HeuristicVisionAnalyzer

_vision_analyzers: dict[str, BaseVisionAnalyzer] = {}
_default_analyzer_name: str = "civiq-vision-baseline"


def _init_default_registry() -> None:
    global _vision_analyzers, _default_analyzer_name
    default_instance = HeuristicVisionAnalyzer()
    _vision_analyzers = {
        "civiq-vision-baseline": default_instance,
        "default": default_instance,
        "heuristic": default_instance,
    }
    _default_analyzer_name = "civiq-vision-baseline"


_init_default_registry()


def register_analyzer(name: str, analyzer: BaseVisionAnalyzer) -> None:
    """Register a custom vision analyser (e.g. a real CV model) into the registry."""
    _vision_analyzers[name] = analyzer


def get_analyzer(name: str | None = None) -> BaseVisionAnalyzer:
    """
    Get a registered vision analyser by name, or return the default.
    Falls back to HeuristicVisionAnalyzer if requested name is not registered.
    """
    target = name or _default_analyzer_name
    if target in _vision_analyzers:
        return _vision_analyzers[target]
    if "civiq-vision-baseline" in _vision_analyzers:
        return _vision_analyzers["civiq-vision-baseline"]
    fallback = HeuristicVisionAnalyzer()
    register_analyzer("civiq-vision-baseline", fallback)
    return fallback


def set_default_analyzer(name: str) -> None:
    """Set the default vision analyser by registered name."""
    global _default_analyzer_name
    if name not in _vision_analyzers:
        raise ValueError(f"Vision analyser '{name}' is not registered.")
    _default_analyzer_name = name


def reset_registry() -> None:
    """Reset to initial state (primarily for testing)."""
    _init_default_registry()
