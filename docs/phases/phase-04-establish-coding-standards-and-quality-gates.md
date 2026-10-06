# Phase 04 — Establish coding standards and quality gates

**Agent instruction:** Execute Phase 04 only. Do not begin Phase 05.

## Prerequisites
- Phase 03 must be committed/locked before Phase 04 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add ESLint, Prettier, TypeScript strict mode and Python formatting/linting.

## Implementation tasks
- Add ESLint, Prettier, TypeScript strict mode and Python formatting/linting.
- Create shared scripts for lint, typecheck, test and build.
- Add basic pre-commit guidance without blocking local work unexpectedly.

## Primary files / areas
- `eslint.config.*`
- `prettier.config.*`
- `tsconfig.*`
- `pyproject.toml`

## Exit checks
Run lint/typecheck across active packages.

## Required commit
`chore(phase-04): establish quality gates`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
