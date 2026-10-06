# Phase 52 — Build predictive maintenance baseline

**Agent instruction:** Execute Phase 52 only. Do not begin Phase 53.

## Prerequisites
- Phase 51 must be committed/locked before Phase 52 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create baseline model using failure frequency, age, maintenance history and recurrence.

## Implementation tasks
- Create baseline model using failure frequency, age, maintenance history and recurrence.
- Return risk score + reason codes.
- Keep action as “maintenance review recommended”, not automatic replacement.

## Primary files / areas
- `services/ai/app/pipelines/maintenance/*`

## Exit checks
Offline evaluation with synthetic/seeded data.

## Required commit
`feat(phase-52): add predictive maintenance baseline`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
