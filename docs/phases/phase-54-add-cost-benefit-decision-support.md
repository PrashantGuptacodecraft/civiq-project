# Phase 54 — Add cost/benefit decision support

**Agent instruction:** Execute Phase 54 only. Do not begin Phase 55.

## Prerequisites
- Phase 53 must be committed/locked before Phase 54 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Estimate cumulative repair cost vs replacement-review threshold.

## Implementation tasks
- Estimate cumulative repair cost vs replacement-review threshold.
- Allow policy-configured thresholds per asset category.
- Provide explainable recommendations.

## Primary files / areas
- `apps/api/src/modules/asset-decisions/*`
- `services/ai/app/pipelines/asset-decision/*`

## Exit checks
Decision-rule tests.

## Required commit
`feat(phase-54): add asset decision support`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
