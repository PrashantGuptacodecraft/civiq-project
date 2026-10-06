# Phase 05 — Add CI foundation

**Agent instruction:** Execute Phase 05 only. Do not begin Phase 06.

## Prerequisites
- Phase 04 must be committed/locked before Phase 05 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create GitHub Actions for install, lint, typecheck, test and build.

## Implementation tasks
- Create GitHub Actions for install, lint, typecheck, test and build.
- Cache dependencies safely and pin action major versions.
- Fail on security-sensitive quality regressions where practical.

## Primary files / areas
- `.github/workflows/ci.yml`

## Exit checks
Run CI-equivalent commands locally.

## Required commit
`ci(phase-05): add continuous integration`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
