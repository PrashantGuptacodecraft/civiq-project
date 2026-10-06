# Phase 50 — Link issues to assets

**Agent instruction:** Execute Phase 50 only. Do not begin Phase 51.

## Prerequisites
- Phase 49 must be committed/locked before Phase 50 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Allow confirmed issues to be linked to one or more assets.

## Implementation tasks
- Allow confirmed issues to be linked to one or more assets.
- Maintain link history and confidence.
- Use nearest-asset candidate suggestions.

## Primary files / areas
- `apps/api/src/modules/assets-links/*`

## Exit checks
Geospatial candidate tests.

## Required commit
`feat(phase-50): link issues to assets`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
