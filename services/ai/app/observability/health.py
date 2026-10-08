from typing import Any

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, Any]:
    return {"status": "ok"}


@router.get("/ready")
def readiness_check() -> dict[str, Any]:
    return {"status": "ready"}
