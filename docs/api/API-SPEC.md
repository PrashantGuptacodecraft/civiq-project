# CivIQ API Specification (Pilot Release v1.0.0)
**Phase 72: Production Pilot, Documentation & Release**

---

## 1. Authentication & Security Headers

All API endpoints strictly enforce:
- `Authorization: Bearer <JWT>` for authenticated routes.
- Multi-tier sliding-window rate limiting.
- Mandatory HTTP security headers: `HSTS`, `CSP`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- PII-safe logging and automated audit trails.

---

## 2. API Endpoints Catalog

### 2.1 Public & Citizen Ingress
- `POST /issues` — Submit a civic issue (with GPS coordinates, category, description, and optional media upload).
- `GET /issues` — List issues with role-based privacy redaction (exact location/evidence obscured for non-officials).
- `GET /issues/:id` — Retrieve issue details with immutable verification history.
- `GET /issues/map` — Clustered geospatial operational map with bounding-box query support.
- `POST /feedback/reviews` — Citizen resolution verification and rating submission.
- `POST /integrations/speech/transcribe` — Multilingual voice reporting with BHASHINI speech-to-text.

### 2.2 Operational Command & Department Workflows
- `GET /dashboard/kpis` — Real-time command dashboard metrics (open rate, SLA breach rate, resolution time).
- `POST /verification/verify` — Two-person or officer verification review with trust score updates.
- `POST /assignments/dispatch` — Assign field task to field worker or departmental contractor.
- `GET /sync/delta` — Offline mobile synchronization delta for field workers.
- `POST /sync/batch` — Idempotent batch sync for offline field inspections.

### 2.3 Disaster Emergency Operations & Situation Room
- `POST /disasters/declare` — Authoritative disaster declaration (NDMA/SEOC protocol).
- `GET /disasters/:id/situation-room` — Real-time emergency dashboard with impact radius, responder status, and resource matches.
- `POST /alerts/ingest` — Ingest CAP 1.2 XML/JSON official meteorological/disaster alerts with cryptographic signature checks.
- `POST /resources/match` — Algorithmic resource-to-incident allocation matching.

### 2.4 Governance, Observability & SRE
- `GET /health` — Liveness check (`status: "ok"`).
- `GET /ready` — Readiness check.
- `GET /metrics` — Real-time SRE telemetry (API/AI latency percentiles, queue ages, backlogs, circuit breaker health).
- `POST /reports/export` — Asynchronous background report generation with jurisdiction scoping.
