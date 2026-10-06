# Phase 29 — Add geolocation and jurisdiction resolution

**Agent instruction:** Execute Phase 29 only. Do not begin Phase 30.

## Prerequisites
- Phase 28 must be committed/locked before Phase 29 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Capture user-selected/available GPS and map point.

## Implementation tasks
- Capture user-selected/available GPS and map point.
- Resolve point to jurisdiction and store resolver version/source.
- Handle ambiguous boundaries and manual correction.

## Primary files / areas
- `apps/api/src/modules/geography/*`
- `apps/web/features/map/*`

## Exit checks
Geospatial resolution tests with boundary fixtures.

## Required commit
`feat(phase-29): add geolocation resolution`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
