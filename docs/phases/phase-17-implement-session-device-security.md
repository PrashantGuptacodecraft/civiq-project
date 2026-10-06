# Phase 17 — Implement session/device security

**Agent instruction:** Execute Phase 17 only. Do not begin Phase 18.

## Prerequisites
- Phase 16 must be committed/locked before Phase 17 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add refresh/session rotation, revocation, device/session listing and logout-all.

## Implementation tasks
- Add refresh/session rotation, revocation, device/session listing and logout-all.
- Add re-authentication requirement for sensitive actions.
- Log auth and authorization events.

## Primary files / areas
- `apps/api/src/modules/auth/session/*`

## Exit checks
Session security tests.

## Required commit
`feat(phase-17): harden sessions and devices`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
