# Phase 07 — Create database foundation

**Agent instruction:** Execute Phase 07 only. Do not begin Phase 08.

## Prerequisites
- Phase 06 must be committed/locked before Phase 07 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Initialize PostgreSQL/Prisma and migration workflow.

## Implementation tasks
- Initialize PostgreSQL/Prisma and migration workflow.
- Create base schema conventions: UUID/ULID strategy, createdAt/updatedAt, soft-delete policy, optimistic version field where needed.
- Add local development seed framework.

## Primary files / areas
- `packages/db/*`

## Exit checks
Migration apply/reset/seed; schema validation.

## Required commit
`feat(phase-07): initialize database foundation`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
