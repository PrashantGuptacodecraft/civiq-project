# Phase 42 — Add before/after proof and field verification

**Agent instruction:** Execute Phase 42 only. Do not begin Phase 43.

## Prerequisites
- Phase 41 must be committed/locked before Phase 42 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Require configurable evidence for task completion.

## Implementation tasks
- Require configurable evidence for task completion.
- Capture GPS/time context and bind evidence to assignment.
- Supervisor verifies completion; reject/reopen if evidence is insufficient.

## Primary files / areas
- `apps/api/src/modules/field-verification/*`
- `apps/web/features/field/*`

## Exit checks
Evidence-chain tests.

## Required commit
`feat(phase-42): add field verification`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
