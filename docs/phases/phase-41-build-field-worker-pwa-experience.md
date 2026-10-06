# Phase 41 — Build field worker PWA experience

**Agent instruction:** Execute Phase 41 only. Do not begin Phase 42.

## Prerequisites
- Phase 40 must be committed/locked before Phase 41 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create installable/mobile-first task list, task detail, status updates and navigation handoff.

## Implementation tasks
- Create installable/mobile-first task list, task detail, status updates and navigation handoff.
- Restrict data to assigned jurisdiction/tasks.
- Add retry-safe mutations.

## Primary files / areas
- `apps/web/features/field/*`

## Exit checks
PWA smoke test + authz E2E.

## Required commit
`feat(phase-41): build field worker workflow`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
