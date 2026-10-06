# Phase 11 — Add audit-log model and writer

**Agent instruction:** Execute Phase 11 only. Do not begin Phase 12.

## Prerequisites
- Phase 10 must be committed/locked before Phase 11 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create append-only audit log entity.

## Implementation tasks
- Create append-only audit log entity.
- Record actor, action, object, jurisdiction, request ID and timestamp; never store secrets.
- Add helper for system vs human actors.

## Primary files / areas
- `apps/api/src/modules/audit/*`
- `packages/db/*`

## Exit checks
Audit write/read tests; access control tests.

## Required commit
`feat(phase-11): add audit trail`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
