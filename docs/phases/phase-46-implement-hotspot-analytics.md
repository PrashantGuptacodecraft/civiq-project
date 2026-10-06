# Phase 46 — Implement hotspot analytics

**Agent instruction:** Execute Phase 46 only. Do not begin Phase 47.

## Prerequisites
- Phase 45 must be committed/locked before Phase 46 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Detect geographic concentration of incidents using configurable spatial windows/clustering.

## Implementation tasks
- Detect geographic concentration of incidents using configurable spatial windows/clustering.
- Show trends by time/category.
- Label analytics as analytical, not causal proof.

## Primary files / areas
- `apps/api/src/modules/analytics/hotspots/*`
- `apps/web/features/analytics/*`

## Exit checks
Synthetic hotspot fixtures and correctness tests.

## Required commit
`feat(phase-46): add hotspot analytics`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
