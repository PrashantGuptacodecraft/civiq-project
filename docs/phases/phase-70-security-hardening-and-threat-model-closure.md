# Phase 70 — Security hardening and threat-model closure

**Agent instruction:** Execute Phase 70 only. Do not begin Phase 71.

## Prerequisites
- Phase 69 must be committed/locked before Phase 70 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Run threat-model review across auth, uploads, RBAC, AI prompt/data paths, webhooks and integrations.

## Implementation tasks
- Run threat-model review across auth, uploads, RBAC, AI prompt/data paths, webhooks and integrations.
- Add security headers, rate limiting, authorization tests, secret scanning and dependency audit.
- Document incident response and account recovery.

## Primary files / areas
- `docs/security/threat-model.md`
- `docs/security/controls.md`
- `.github/workflows/security.yml`

## Exit checks
Security test suite; dependency and secret checks.

## Required commit
`security(phase-70): harden production security`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
