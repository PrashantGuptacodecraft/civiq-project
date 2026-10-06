# Phase 71 — Performance, resilience and observability closure

**Agent instruction:** Execute Phase 71 only. Do not begin Phase 72.

## Prerequisites
- Phase 70 must be committed/locked before Phase 71 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add caching where safe, DB indexes, query budgets and async jobs for slow work.

## Implementation tasks
- Add caching where safe, DB indexes, query budgets and async jobs for slow work.
- Add metrics for API latency, verification backlog, SLA backlog, queue age and AI latency.
- Test backup/restore and failure behavior for external integrations.

## Primary files / areas
- `apps/api/src/observability/*`
- `docs/operations/sre.md`
- `tests/load/*`

## Exit checks
Load test baseline + backup/restore drill.

## Required commit
`perf(phase-71): harden performance and resilience`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
