from app.pipelines.classification.base import BaseClassifier
from app.pipelines.classification.rule_based import RuleBasedClassifier

_classifiers: dict[str, BaseClassifier] = {}
_default_classifier_name: str = "civiq-ai-core"


def _init_default_registry() -> None:
    global _classifiers, _default_classifier_name
    default_instance = RuleBasedClassifier()
    _classifiers = {
        "civiq-ai-core": default_instance,
        "default": default_instance,
        "rule_based": default_instance,
    }
    _default_classifier_name = "civiq-ai-core"


_init_default_registry()


def register_classifier(name: str, classifier: BaseClassifier) -> None:
    """Register a custom classifier provider into the registry."""
    _classifiers[name] = classifier


def get_classifier(name: str | None = None) -> BaseClassifier:
    """
    Get a registered classifier provider by name, or return the default classifier.
    Falls back to RuleBasedClassifier if requested name is not found.
    """
    target = name or _default_classifier_name
    if target in _classifiers:
        return _classifiers[target]
    if "civiq-ai-core" in _classifiers:
        return _classifiers["civiq-ai-core"]
    # Fallback to freshly instantiated baseline
    fallback = RuleBasedClassifier()
    register_classifier("civiq-ai-core", fallback)
    return fallback


def set_default_classifier(name: str) -> None:
    """Set default classifier provider name."""
    global _default_classifier_name
    if name not in _classifiers:
        raise ValueError(f"Classifier provider '{name}' is not registered.")
    _default_classifier_name = name


def reset_registry() -> None:
    """Reset registry to initial state (for testing)."""
    _init_default_registry()
