# Phase 18 — Build government organization onboarding

**Agent instruction:** Execute Phase 18 only. Do not begin Phase 19.

## Prerequisites
- Phase 17 must be committed/locked before Phase 18 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create invite flow from an organization admin to employee.

## Implementation tasks
- Create invite flow from an organization admin to employee.
- Require official email/employee identifier and department scope.
- Store who approved the official role and when.

## Primary files / areas
- `apps/api/src/modules/officials/onboarding/*`
- `apps/web/features/official-onboarding/*`

## Exit checks
Invitation, expiry, replay and approval tests.

## Required commit
`feat(phase-18): add official onboarding`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
