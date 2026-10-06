# Phase 48 — Add operational reports and exports

**Agent instruction:** Execute Phase 48 only. Do not begin Phase 49.

## Prerequisites
- Phase 47 must be committed/locked before Phase 48 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Export jurisdiction-scoped issue lists, SLA reports, performance and audit summaries.

## Implementation tasks
- Export jurisdiction-scoped issue lists, SLA reports, performance and audit summaries.
- Apply redaction rules and export authorization.
- Add asynchronous generation for larger reports.

## Primary files / areas
- `apps/api/src/modules/reports/*`
- `apps/worker/src/jobs/reports/*`

## Exit checks
Authorization and export tests.

## Required commit
`feat(phase-48): add operational reporting`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
