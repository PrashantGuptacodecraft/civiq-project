# Phase 51 — Add maintenance history and cost tracking

**Agent instruction:** Execute Phase 51 only. Do not begin Phase 52.

## Prerequisites
- Phase 50 must be committed/locked before Phase 51 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Record maintenance actions, parts/labor cost, downtime and outcomes.

## Implementation tasks
- Record maintenance actions, parts/labor cost, downtime and outcomes.
- Ensure financial fields are controlled and auditable.
- Build asset timeline.

## Primary files / areas
- `apps/api/src/modules/maintenance/*`

## Exit checks
Timeline and access tests.

## Required commit
`feat(phase-51): add maintenance history`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
