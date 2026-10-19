from app.pipelines.dedup.ensemble import TransparentEnsembleScorer

_dedup_engines: dict[str, TransparentEnsembleScorer] = {}
_default_engine_name: str = "civiq-dedup-ensemble"


def _init_default_registry() -> None:
    global _dedup_engines, _default_engine_name
    default_instance = TransparentEnsembleScorer()
    _dedup_engines = {
        "civiq-dedup-ensemble": default_instance,
        "default": default_instance,
        "ensemble": default_instance,
    }
    _default_engine_name = "civiq-dedup-ensemble"


_init_default_registry()


def register_dedup_engine(name: str, engine: TransparentEnsembleScorer) -> None:
    """Register a custom deduplication scorer."""
    _dedup_engines[name] = engine


def get_dedup_engine(name: str | None = None) -> TransparentEnsembleScorer:
    """Retrieve registered deduplication scorer by name or return default."""
    target = name or _default_engine_name
    if target in _dedup_engines:
        return _dedup_engines[target]
    if "civiq-dedup-ensemble" in _dedup_engines:
        return _dedup_engines["civiq-dedup-ensemble"]
    fallback = TransparentEnsembleScorer()
    register_dedup_engine("civiq-dedup-ensemble", fallback)
    return fallback


def set_default_dedup_engine(name: str) -> None:
    global _default_engine_name
    if name not in _dedup_engines:
        raise ValueError(f"Deduplication engine '{name}' is not registered.")
    _default_engine_name = name


def reset_dedup_registry() -> None:
    _init_default_registry()
