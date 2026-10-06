# Phase 08 — Build India jurisdiction model

**Agent instruction:** Execute Phase 08 only. Do not begin Phase 09.

## Prerequisites
- Phase 07 must be committed/locked before Phase 08 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Model country, state/UT, district, local body, block, ward/village and jurisdiction types.

## Implementation tasks
- Model country, state/UT, district, local body, block, ward/village and jurisdiction types.
- Support LGD code fields and external references without hard dependency.
- Create sample India hierarchy data for the pilot.

## Primary files / areas
- `packages/db/schema/*`
- `scripts/seeds/jurisdiction.*`

## Exit checks
Seed hierarchy; test parent/child integrity.

## Required commit
`feat(phase-08): add jurisdiction model`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
