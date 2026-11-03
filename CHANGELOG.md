# Changelog

All notable changes to CivIQ are documented in this file.

## [1.0.0-pilot] - 2026-11-03

### Release Summary
Official pilot release of the CivIQ Civic Intelligence and Disaster Management Platform, completing all 72 phase-gated milestones.

### Added
- **Production Pilot Dataset & UAT Scenarios (Phase 72):**
  - Seeded realistic pilot dataset for Pune Municipal Corporation (PMC) across 10 institutional roles (`scripts/seeds/pilot-dataset.json`).
  - Added role-based user acceptance testing (UAT) scenarios (`tests/load/uat-pilot.test.js`).
  - Added comprehensive production runbooks, security checklist, and project report.
  - Published API specification (`docs/api/API-SPEC.md`) and AI Model Card (`docs/ai/model-card-classification.md`).
- **Performance, Resilience & Observability Closure (Phase 71):**
  - Added real-time SRE metrics collection and `/metrics` endpoint with API/AI latency percentiles (`p50`, `p95`, `p99`).
  - Added high-throughput composite database indexes on `Issue` table.
  - Implemented `SafeCache` with LRU eviction and `withQueryBudget` database protection.
  - Implemented circuit breaker pattern with graceful fallbacks for external integrations (BHASHINI, alerts).
  - Added automated PostgreSQL backup and restore drill scripts (`scripts/backup/db-backup.sh`, `scripts/backup/db-restore.sh`).
- **Security Hardening & Threat Model Closure (Phase 70):**
  - Enforced production HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
  - Multi-tier sliding-window rate limiters across public, auth, sync, and media upload paths.
  - Automated input sanitization and PII redaction (Aadhaar optical masking, DPDP Act 2023 compliance).
  - SIRT incident response plan and out-of-band official account recovery procedures.
- **Offline Field Synchronization (Phase 69):**
  - Added offline task caching, delta sync, and idempotent batch mutation engine for field workers.
- **Multilingual Foundation & Voice Reporting (Phases 67–68):**
  - Integrated MeitY BHASHINI live and sandbox speech-to-text / translation across 12 Indian languages.
- **Disaster Situation Room & Resource Matching (Phases 60–66):**
  - Added authoritative disaster declaration, CAP 1.2 XML/JSON alert ingestion, GIS impact zones, and resource matching engine.
