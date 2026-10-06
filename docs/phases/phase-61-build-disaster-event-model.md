# Phase 61 — Build disaster event model

**Agent instruction:** Execute Phase 61 only. Do not begin Phase 62.

## Prerequisites
- Phase 60 must be committed/locked before Phase 61 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model disaster types, official alert references, affected polygons, severity, state and lifecycle.

## Implementation tasks
- Model disaster types, official alert references, affected polygons, severity, state and lifecycle.
- Store source provenance and official-vs-user signal distinction.
- Support concurrent disasters.

## Primary files / areas
- `apps/api/src/modules/disasters/*`

## Exit checks
Event model tests.

## Required commit
`feat(phase-61): add disaster event model`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
