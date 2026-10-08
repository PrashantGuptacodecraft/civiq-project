import logging
import json
import uuid
import datetime

REDACT_KEYS = {"password", "token", "authorization", "cookie", "aadhar", "aadhar_number", "pan", "upi_id"}

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "level": record.levelname,
            "message": record.getMessage(),
            "time": datetime.datetime.fromtimestamp(record.created).isoformat(),
        }
        
        # Add correlation_id if present
        if hasattr(record, "correlation_id"):
            log_obj["correlation_id"] = record.correlation_id

        # Merge extra fields
        if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
            for k, v in record.extra_fields.items():
                if k.lower() in REDACT_KEYS:
                    log_obj[k] = "[REDACTED]"
                else:
                    log_obj[k] = v

        return json.dumps(log_obj)

def get_logger(name="civiq_ai"):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

def generate_correlation_id() -> str:
    return str(uuid.uuid4())
