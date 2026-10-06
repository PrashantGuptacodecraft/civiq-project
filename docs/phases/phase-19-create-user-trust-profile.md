# Phase 19 — Create user trust profile

**Agent instruction:** Execute Phase 19 only. Do not begin Phase 20.

## Prerequisites
- Phase 18 must be committed/locked before Phase 19 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Define trust levels and transparent factors: verification status, valid report history, confirmed abuse history.

## Implementation tasks
- Define trust levels and transparent factors: verification status, valid report history, confirmed abuse history.
- Keep trust separate from report truth.
- Create safe score recalculation job design.

## Primary files / areas
- `apps/api/src/modules/trust/*`

## Exit checks
Deterministic scoring tests.

## Required commit
`feat(phase-19): add user trust profiles`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
