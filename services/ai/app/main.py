from typing import Any

from fastapi import FastAPI

from app.api.v1 import router as v1_router
from app.observability.health import router as health_router

app = FastAPI(
    title="CivIQ AI Gateway",
    description="Provider-agnostic AI Gateway microservice for CivIQ civic intelligence platform.",
    version="1.0.0",
)

app.include_router(health_router)
app.include_router(v1_router)


@app.get("/")
def root_info() -> dict[str, Any]:
    return {
        "service": "CivIQ AI Gateway",
        "status": "online",
        "api_version": "v1",
        "endpoints": [
            "/v1/classify",
            "/v1/evidence-check",
            "/v1/duplicate-score",
            "/v1/priority-score",
            "/v1/route",
            "/v1/summarize",
            "/v1/predict",
        ],
    }
