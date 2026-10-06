# Phase 56 — Build accident response workflow

**Agent instruction:** Execute Phase 56 only. Do not begin Phase 57.

## Prerequisites
- Phase 55 must be committed/locked before Phase 56 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add rapid incident submission, unverified state, responder confirmation and closure.

## Implementation tasks
- Add rapid incident submission, unverified state, responder confirmation and closure.
- Show Call 112 handoff prominently for actual emergencies.
- Create incident timeline and notifications.

## Primary files / areas
- `apps/web/features/incidents/*`
- `apps/api/src/modules/incidents/*`

## Exit checks
Emergency UX and safety-path tests.

## Required commit
`feat(phase-56): add accident response workflow`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
