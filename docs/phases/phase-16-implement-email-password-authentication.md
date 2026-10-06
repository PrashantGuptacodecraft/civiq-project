# Phase 16 — Implement email/password authentication

**Agent instruction:** Execute Phase 16 only. Do not begin Phase 17.

## Prerequisites
- Phase 15 must be committed/locked before Phase 16 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Secure password hashing; verification flow; reset flow.

## Implementation tasks
- Secure password hashing; verification flow; reset flow.
- Add rate limiting and suspicious-attempt monitoring.
- Prevent account enumeration in public responses.

## Primary files / areas
- `apps/api/src/modules/auth/password/*`

## Exit checks
Auth/security tests.

## Required commit
`feat(phase-16): add email authentication`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
