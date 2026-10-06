# Phase 10 — Add permission/RBAC model

**Agent instruction:** Execute Phase 10 only. Do not begin Phase 11.

## Prerequisites
- Phase 09 must be committed/locked before Phase 10 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create roles, permissions, role assignments and scoped permissions.

## Implementation tasks
- Create roles, permissions, role assignments and scoped permissions.
- Define deny-by-default authorization helper.
- Add permission matrix tests for every planned role.

## Primary files / areas
- `packages/auth/*`
- `apps/api/src/modules/access/*`

## Exit checks
Authorization unit/integration tests.

## Required commit
`feat(phase-10): implement RBAC model`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
