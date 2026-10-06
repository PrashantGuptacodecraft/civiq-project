# Phase 64 — Build resource and shelter registry

**Agent instruction:** Execute Phase 64 only. Do not begin Phase 65.

## Prerequisites
- Phase 63 must be committed/locked before Phase 64 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model shelters, medical camps, relief centers, volunteers, vehicles and supplies as verified resource records.

## Implementation tasks
- Model shelters, medical camps, relief centers, volunteers, vehicles and supplies as verified resource records.
- Track capacity with source and timestamp.
- Support jurisdiction scoping.

## Primary files / areas
- `apps/api/src/modules/resources/*`

## Exit checks
Capacity and authorization tests.

## Required commit
`feat(phase-64): add disaster resources`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
