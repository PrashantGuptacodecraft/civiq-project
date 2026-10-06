# Phase 09 — Add organization and department model

**Agent instruction:** Execute Phase 09 only. Do not begin Phase 10.

## Prerequisites
- Phase 08 must be committed/locked before Phase 09 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create organizations with type, verification status and jurisdiction scope.

## Implementation tasks
- Create organizations with type, verification status and jurisdiction scope.
- Create departments and allowed issue categories.
- Implement organization/dept relationships.

## Primary files / areas
- `apps/api/src/modules/organizations/*`
- `apps/api/src/modules/departments/*`

## Exit checks
Service tests for jurisdiction scoping and CRUD.

## Required commit
`feat(phase-09): add organizations and departments`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
