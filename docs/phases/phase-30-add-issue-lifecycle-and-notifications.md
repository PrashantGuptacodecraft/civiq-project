# Phase 30 — Add issue lifecycle and notifications

**Agent instruction:** Execute Phase 30 only. Do not begin Phase 31.

## Prerequisites
- Phase 29 must be committed/locked before Phase 30 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Connect status changes to notification events.

## Implementation tasks
- Connect status changes to notification events.
- Implement in-app notification and email adapter.
- Keep notification delivery idempotent.

## Primary files / areas
- `apps/api/src/modules/notifications/*`
- `apps/worker/src/jobs/notifications/*`

## Exit checks
Event/idempotency tests.

## Required commit
`feat(phase-30): add issue lifecycle notifications`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
