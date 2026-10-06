# Phase 15 — Implement Google sign-in

**Agent instruction:** Execute Phase 15 only. Do not begin Phase 16.

## Prerequisites
- Phase 14 must be committed/locked before Phase 15 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add Google OAuth/OIDC login through a backend-controlled callback.

## Implementation tasks
- Add Google OAuth/OIDC login through a backend-controlled callback.
- Link verified provider identity to an existing user safely.
- Require mobile verification before report submission.

## Primary files / areas
- `apps/api/src/modules/auth/google/*`
- `apps/web/app/auth/*`

## Exit checks
OAuth callback tests and account-linking tests.

## Required commit
`feat(phase-15): add Google authentication`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
