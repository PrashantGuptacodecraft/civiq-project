# Phase 65 — Build need-to-resource matching

**Agent instruction:** Execute Phase 65 only. Do not begin Phase 66.

## Prerequisites
- Phase 64 must be committed/locked before Phase 65 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Match requests to verified resources using distance, capacity, type and status.

## Implementation tasks
- Match requests to verified resources using distance, capacity, type and status.
- Provide recommended matches; authorized coordinator accepts assignment.
- Track fulfilment and confirmation.

## Primary files / areas
- `apps/api/src/modules/resource-matching/*`
- `services/ai/app/pipelines/resource-matching/*`

## Exit checks
Deterministic matching tests.

## Required commit
`feat(phase-65): add resource matching`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
