# Phase 49 — Build asset registry

**Agent instruction:** Execute Phase 49 only. Do not begin Phase 50.

## Prerequisites
- Phase 48 must be committed/locked before Phase 49 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model road segments, streetlights, drains, water assets, public facilities and other maintainable assets.

## Implementation tasks
- Model road segments, streetlights, drains, water assets, public facilities and other maintainable assets.
- Support asset owner department and jurisdiction.
- Add lifecycle status.

## Primary files / areas
- `apps/api/src/modules/assets/*`

## Exit checks
CRUD/authz tests.

## Required commit
`feat(phase-49): add asset registry`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
