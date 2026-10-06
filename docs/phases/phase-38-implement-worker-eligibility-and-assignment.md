# Phase 38 — Implement worker eligibility and assignment

**Agent instruction:** Execute Phase 38 only. Do not begin Phase 39.

## Prerequisites
- Phase 37 must be committed/locked before Phase 38 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model worker skills, coverage area, availability and workload.

## Implementation tasks
- Model worker skills, coverage area, availability and workload.
- Create assignment recommendation: skill + jurisdiction + proximity + workload.
- Allow officer override with reason.

## Primary files / areas
- `apps/api/src/modules/assignments/*`

## Exit checks
Deterministic assignment tests.

## Required commit
`feat(phase-38): add worker assignment`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
