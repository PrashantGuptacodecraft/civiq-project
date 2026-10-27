"""
Predictive Maintenance Pipeline Registry
Phase 52: Build Predictive Maintenance Baseline
"""

from typing import Optional

from .model import PredictiveMaintenanceModel

_maintenance_model: Optional[PredictiveMaintenanceModel] = None


def get_maintenance_predictor() -> PredictiveMaintenanceModel:
    """Returns singleton instance of the PredictiveMaintenanceModel."""
    global _maintenance_model
    if _maintenance_model is None:
        _maintenance_model = PredictiveMaintenanceModel()
    return _maintenance_model


def reset_maintenance_registry() -> None:
    """Resets singleton instance for test isolation."""
    global _maintenance_model
    _maintenance_model = None
