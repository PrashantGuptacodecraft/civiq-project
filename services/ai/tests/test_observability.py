import json
import logging
from io import StringIO
from typing import Any

from app.observability.logger import JSONFormatter, get_logger


def test_redaction() -> None:
    stream = StringIO()
    handler = logging.StreamHandler(stream)

    logger = get_logger("test_logger")
    logger.handlers = []
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    logger.info("Test login", extra={"extra_fields": {"aadhar_number": "1234", "safe": "ok"}})

    output = stream.getvalue()
    log_obj: dict[str, Any] = json.loads(output)

    assert log_obj["aadhar_number"] == "[REDACTED]"
    assert log_obj["safe"] == "ok"
    assert log_obj["message"] == "Test login"


def test_health() -> None:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.observability.health import router

    app = FastAPI()
    app.include_router(router)

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
