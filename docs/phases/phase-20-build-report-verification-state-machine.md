# Phase 20 — Build report verification state machine

**Agent instruction:** Execute Phase 20 only. Do not begin Phase 21.

## Prerequisites
- Phase 19 must be committed/locked before Phase 20 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement submitted → verification → verified/rejected/needs evidence/duplicate transitions.

## Implementation tasks
- Implement submitted → verification → verified/rejected/needs evidence/duplicate transitions.
- Enforce allowed transitions and role permissions.
- Write status history on every transition.

## Primary files / areas
- `apps/api/src/modules/verification/*`
- `packages/contracts/verification.*`

## Exit checks
State-machine tests for every transition.

## Required commit
`feat(phase-20): implement verification workflow`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
