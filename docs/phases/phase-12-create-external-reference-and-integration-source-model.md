# Phase 12 — Create external-reference and integration-source model

**Agent instruction:** Execute Phase 12 only. Do not begin Phase 13.

## Prerequisites
- Phase 11 must be committed/locked before Phase 12 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model provider/source, external IDs, sync cursor, last-success, error state and data provenance.

## Implementation tasks
- Model provider/source, external IDs, sync cursor, last-success, error state and data provenance.
- Support source confidence and source type.
- Prepare adapter contract interfaces.

## Primary files / areas
- `apps/api/src/modules/integrations/*`
- `packages/contracts/*`

## Exit checks
Schema/service tests.

## Required commit
`feat(phase-12): add provenance and integration contracts`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
