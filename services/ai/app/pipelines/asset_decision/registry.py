"""
Asset Decision Support Pipeline Registry
Phase 54: Add Cost/Benefit Decision Support
"""

from app.pipelines.asset_decision.model import AssetDecisionModel
from app.pipelines.asset_decision.policy import PolicyThresholdManager

_global_policy_manager: PolicyThresholdManager | None = None
_global_decision_model: AssetDecisionModel | None = None


def get_policy_manager() -> PolicyThresholdManager:
    global _global_policy_manager
    if _global_policy_manager is None:
        _global_policy_manager = PolicyThresholdManager()
    return _global_policy_manager


def get_asset_decision_model() -> AssetDecisionModel:
    global _global_decision_model
    if _global_decision_model is None:
        _global_decision_model = AssetDecisionModel(policy_manager=get_policy_manager())
    return _global_decision_model


def reset_asset_decision_registry() -> None:
    global _global_policy_manager, _global_decision_model
    if _global_policy_manager is not None:
        _global_policy_manager.reset_defaults()
    _global_decision_model = None
