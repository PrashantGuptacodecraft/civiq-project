# Phase 60 — Add public safety communication templates

**Agent instruction:** Execute Phase 60 only. Do not begin Phase 61.

## Prerequisites
- Phase 59 must be committed/locked before Phase 60 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create approved templates for verified issue alerts, incident updates and official-source notices.

## Implementation tasks
- Create approved templates for verified issue alerts, incident updates and official-source notices.
- Include emergency disclaimer/handoff.
- Prevent unreviewed AI text from becoming an official warning.

## Primary files / areas
- `apps/api/src/modules/communications/*`
- `docs/operations/communications-policy.md`

## Exit checks
Template safety tests.

## Required commit
`feat(phase-60): add safety communications`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
