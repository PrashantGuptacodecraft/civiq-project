# Phase 35 — Build explainable priority engine

**Agent instruction:** Execute Phase 35 only. Do not begin Phase 36.

## Prerequisites
- Phase 34 must be committed/locked before Phase 35 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement deterministic feature extraction for severity, safety risk, impact, corroboration, age and location context.

## Implementation tasks
- Implement deterministic feature extraction for severity, safety risk, impact, corroboration, age and location context.
- Use configurable weights/rules and optionally a model behind the same contract.
- Return reasons alongside score.

## Primary files / areas
- `apps/api/src/modules/priority/*`
- `services/ai/app/pipelines/priority/*`

## Exit checks
Unit tests with explainability assertions.

## Required commit
`feat(phase-35): add explainable priority engine`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
