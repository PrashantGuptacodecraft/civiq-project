# Phase 23 — Add abuse/fraud controls

**Agent instruction:** Execute Phase 23 only. Do not begin Phase 24.

## Prerequisites
- Phase 22 must be committed/locked before Phase 23 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Detect burst reporting, repeated media, suspicious device/account patterns and API abuse.

## Implementation tasks
- Detect burst reporting, repeated media, suspicious device/account patterns and API abuse.
- Implement temporary throttles and verification escalation.
- Do not automatically label a person criminal/fraudulent; store risk signal and reviewer decision.

## Primary files / areas
- `apps/api/src/modules/abuse/*`
- `apps/api/src/modules/risk/*`

## Exit checks
Abuse scenario tests.

## Required commit
`feat(phase-23): add anti-abuse controls`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
