# Phase 06 — Add observability foundation

**Agent instruction:** Execute Phase 06 only. Do not begin Phase 07.

## Prerequisites
- Phase 05 must be committed/locked before Phase 06 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create request correlation IDs, structured JSON logging and error boundaries.

## Implementation tasks
- Create request correlation IDs, structured JSON logging and error boundaries.
- Define event naming and sensitive-data redaction rules.
- Add health/readiness endpoint contracts for API and AI service.

## Primary files / areas
- `packages/observability/*`
- `apps/api/src/observability/*`
- `services/ai/app/observability/*`

## Exit checks
Unit-test redaction and health endpoints.

## Required commit
`feat(phase-06): add observability foundation`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
