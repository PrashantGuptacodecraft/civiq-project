# Phase 47 — Implement recurring issue analytics

**Agent instruction:** Execute Phase 47 only. Do not begin Phase 48.

## Prerequisites
- Phase 46 must be committed/locked before Phase 47 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Link issues to assets where available.

## Implementation tasks
- Link issues to assets where available.
- Detect repeated failures by asset/category/location/time.
- Generate maintenance-review candidates.

## Primary files / areas
- `apps/api/src/modules/analytics/recurrence/*`

## Exit checks
Recurrence tests.

## Required commit
`feat(phase-47): add recurring issue intelligence`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
