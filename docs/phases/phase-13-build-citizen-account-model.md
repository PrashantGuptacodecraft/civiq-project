# Phase 13 — Build citizen account model

**Agent instruction:** Execute Phase 13 only. Do not begin Phase 14.

## Prerequisites
- Phase 12 must be committed/locked before Phase 13 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create user profile, contact methods, verification states and privacy preferences.

## Implementation tasks
- Create user profile, contact methods, verification states and privacy preferences.
- Separate public profile fields from private contact data.
- Add account status and consent timestamps.

## Primary files / areas
- `apps/api/src/modules/users/*`

## Exit checks
Unit/integration tests; migration.

## Required commit
`feat(phase-13): add user accounts`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
