# Phase 66 — Build disaster situation room and after-action review

**Agent instruction:** Execute Phase 66 only. Do not begin Phase 67.

## Prerequisites
- Phase 65 must be committed/locked before Phase 66 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create event command dashboard: alerts, impact clusters, blocked routes, needs, resources, response tasks.

## Implementation tasks
- Create event command dashboard: alerts, impact clusters, blocked routes, needs, resources, response tasks.
- Add event timeline and post-event metrics.
- Generate AI-assisted after-action summary with source labels.

## Primary files / areas
- `apps/web/features/situation-room/*`
- `apps/api/src/modules/disaster-ops/*`

## Exit checks
End-to-end disaster simulation test.

## Required commit
`feat(phase-66): build disaster situation room`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
