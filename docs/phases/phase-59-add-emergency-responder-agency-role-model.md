# Phase 59 — Add emergency responder/agency role model

**Agent instruction:** Execute Phase 59 only. Do not begin Phase 60.

## Prerequisites
- Phase 58 must be committed/locked before Phase 59 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model authorized responder organizations and scoped access.

## Implementation tasks
- Model authorized responder organizations and scoped access.
- Add dispatch recommendation without pretending CivIQ is the official emergency dispatch center.
- Audit sensitive incident access.

## Primary files / areas
- `apps/api/src/modules/responders/*`

## Exit checks
RBAC/incident data access tests.

## Required commit
`feat(phase-59): add responder roles`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
