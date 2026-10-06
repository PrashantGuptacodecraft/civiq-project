# Phase 53 — Add asset intelligence dashboard

**Agent instruction:** Execute Phase 53 only. Do not begin Phase 54.

## Prerequisites
- Phase 52 must be committed/locked before Phase 53 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Show high-recurrence/high-downtime assets, failure trend and maintenance candidates.

## Implementation tasks
- Show high-recurrence/high-downtime assets, failure trend and maintenance candidates.
- Link dashboard to source issues and proof.
- Add drill-down to asset timeline.

## Primary files / areas
- `apps/web/features/assets/*`

## Exit checks
Dashboard correctness tests.

## Required commit
`feat(phase-53): add asset intelligence dashboard`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
