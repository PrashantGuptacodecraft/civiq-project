# Phase 43 — Add citizen resolution verification

**Agent instruction:** Execute Phase 43 only. Do not begin Phase 44.

## Prerequisites
- Phase 42 must be committed/locked before Phase 43 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Notify citizen after proposed resolution.

## Implementation tasks
- Notify citizen after proposed resolution.
- Allow confirm/reopen with reason and optional evidence.
- Feed confirmed/unconfirmed outcomes into quality metrics.

## Primary files / areas
- `apps/web/features/resolution-review/*`
- `apps/api/src/modules/feedback/*`

## Exit checks
E2E resolution and reopen tests.

## Required commit
`feat(phase-43): add citizen resolution verification`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
