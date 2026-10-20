"""Pluggable registry for priority scoring engines."""

from app.pipelines.priority.engine import BasePriorityEngine, RuleBasedPriorityEngine

_PRIORITY_ENGINES: dict[str, BasePriorityEngine] = {
    "civiq-priority-rules": RuleBasedPriorityEngine(),
}

_DEFAULT_ENGINE_NAME: str = "civiq-priority-rules"


def get_priority_engine(engine_name: str | None = None) -> BasePriorityEngine:
    """Retrieve priority engine by name, or return the default rule-based engine."""
    name = engine_name or _DEFAULT_ENGINE_NAME
    if name not in _PRIORITY_ENGINES:
        return _PRIORITY_ENGINES[_DEFAULT_ENGINE_NAME]
    return _PRIORITY_ENGINES[name]


def register_priority_engine(name: str, engine: BasePriorityEngine) -> None:
    """Register or replace a priority engine."""
    _PRIORITY_ENGINES[name] = engine


def set_default_priority_engine(name: str) -> None:
    """Set the default priority engine name."""
    global _DEFAULT_ENGINE_NAME
    if name in _PRIORITY_ENGINES:
        _DEFAULT_ENGINE_NAME = name


def reset_priority_registry() -> None:
    """Reset the registry to default rule-based engine."""
    global _DEFAULT_ENGINE_NAME
    _PRIORITY_ENGINES.clear()
    _PRIORITY_ENGINES["civiq-priority-rules"] = RuleBasedPriorityEngine()
    _DEFAULT_ENGINE_NAME = "civiq-priority-rules"
