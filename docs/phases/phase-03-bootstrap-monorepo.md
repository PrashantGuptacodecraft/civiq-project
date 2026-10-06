# Phase 03 — Bootstrap monorepo

**Agent instruction:** Execute Phase 03 only. Do not begin Phase 04.

## Prerequisites
- Phase 02 must be committed/locked before Phase 03 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Initialize workspace with apps/web, apps/api, apps/worker, services/ai and packages.

## Implementation tasks
- Initialize workspace with apps/web, apps/api, apps/worker, services/ai and packages.
- Add package manager, shared scripts and basic README.
- Pin current compatible runtime versions and record them.

## Primary files / areas
- `package.json`
- `pnpm-workspace.yaml`
- `apps/*`
- `packages/*`
- `services/ai/*`

## Exit checks
Install; workspace build/typecheck; verify directory contracts.

## Required commit
`chore(phase-03): bootstrap monorepo`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
