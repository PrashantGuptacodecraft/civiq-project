# Phase 40 — Implement escalation workflow

**Agent instruction:** Execute Phase 40 only. Do not begin Phase 41.

## Prerequisites
- Phase 39 must be committed/locked before Phase 40 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Warn at configurable thresholds; escalate to supervisor/department officer when breached.

## Implementation tasks
- Warn at configurable thresholds; escalate to supervisor/department officer when breached.
- Prevent duplicate escalation storms.
- Audit every escalation.

## Primary files / areas
- `apps/api/src/modules/escalation/*`

## Exit checks
Escalation/idempotency tests.

## Required commit
`feat(phase-40): add SLA escalation`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
