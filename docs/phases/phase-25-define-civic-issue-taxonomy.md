# Phase 25 — Define civic issue taxonomy

**Agent instruction:** Execute Phase 25 only. Do not begin Phase 26.

## Prerequisites
- Phase 24 must be committed/locked before Phase 25 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create categories for roads, drainage, sanitation, electrical, water, waste, public facilities and other civic services.

## Implementation tasks
- Create categories for roads, drainage, sanitation, electrical, water, waste, public facilities and other civic services.
- Attach default department/SLA metadata.
- Keep taxonomy versioned.

## Primary files / areas
- `packages/contracts/issue-taxonomy/*`
- `packages/db/seeds/taxonomy.*`

## Exit checks
Taxonomy validation tests.

## Required commit
`feat(phase-25): add civic issue taxonomy`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
