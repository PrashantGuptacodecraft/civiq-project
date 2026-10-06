# Phase 57 — Add road-safety correlation analytics

**Agent instruction:** Execute Phase 57 only. Do not begin Phase 58.

## Prerequisites
- Phase 56 must be committed/locked before Phase 57 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Correlate incident clusters with civic issue/asset history and official accident data when legally/technically available.

## Implementation tasks
- Correlate incident clusters with civic issue/asset history and official accident data when legally/technically available.
- Avoid claiming causality.
- Produce “investigation recommended” hotspots.

## Primary files / areas
- `apps/api/src/modules/analytics/safety/*`

## Exit checks
Correlation correctness tests.

## Required commit
`feat(phase-57): add road safety analytics`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
