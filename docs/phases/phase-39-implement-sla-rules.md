# Phase 39 — Implement SLA rules

**Agent instruction:** Execute Phase 39 only. Do not begin Phase 40.

## Prerequisites
- Phase 38 must be committed/locked before Phase 39 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create configurable SLA by issue category, priority, jurisdiction and working-hours policy.

## Implementation tasks
- Create configurable SLA by issue category, priority, jurisdiction and working-hours policy.
- Compute due times and aging.
- Show countdown and overdue state.

## Primary files / areas
- `apps/api/src/modules/sla/*`

## Exit checks
Time-zone and boundary tests.

## Required commit
`feat(phase-39): add SLA engine`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
