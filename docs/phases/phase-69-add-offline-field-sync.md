# Phase 69 — Add offline field sync

**Agent instruction:** Execute Phase 69 only. Do not begin Phase 70.

## Prerequisites
- Phase 68 must be committed/locked before Phase 69 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create local task cache, mutation queue and sync conflict strategy.

## Implementation tasks
- Create local task cache, mutation queue and sync conflict strategy.
- Use idempotency keys for field updates.
- Show sync state clearly to workers.

## Primary files / areas
- `apps/web/features/offline/*`
- `apps/api/src/modules/sync/*`

## Exit checks
Offline/online E2E simulation.

## Required commit
`feat(phase-69): add offline field sync`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
