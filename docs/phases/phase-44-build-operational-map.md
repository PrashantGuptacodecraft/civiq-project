# Phase 44 — Build operational map

**Agent instruction:** Execute Phase 44 only. Do not begin Phase 45.

## Prerequisites
- Phase 43 must be committed/locked before Phase 44 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Show issue points by status, priority, department and verification state.

## Implementation tasks
- Show issue points by status, priority, department and verification state.
- Implement clustering, filters, pagination and privacy-safe public view.
- Keep exact evidence private to authorized roles.

## Primary files / areas
- `apps/web/features/operations-map/*`

## Exit checks
Map and authorization tests.

## Required commit
`feat(phase-44): build operational map`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
