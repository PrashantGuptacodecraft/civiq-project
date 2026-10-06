# Phase 37 — Implement smart department routing

**Agent instruction:** Execute Phase 37 only. Do not begin Phase 38.

## Prerequisites
- Phase 36 must be committed/locked before Phase 37 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Map taxonomy + jurisdiction to allowed departments.

## Implementation tasks
- Map taxonomy + jurisdiction to allowed departments.
- Add AI recommendation but enforce policy rules and jurisdiction constraints.
- Route only after verification gate except configured low-risk classes.

## Primary files / areas
- `apps/api/src/modules/routing/*`

## Exit checks
Routing matrix tests.

## Required commit
`feat(phase-37): add department routing`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
