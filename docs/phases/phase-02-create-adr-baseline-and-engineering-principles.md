# Phase 02 — Create ADR baseline and engineering principles

**Agent instruction:** Execute Phase 02 only. Do not begin Phase 03.

## Prerequisites
- Phase 01 must be committed/locked before Phase 02 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Record monorepo choice, API-first design, modular backend, AI gateway, RBAC, auditability and human-in-the-loop rules.

## Implementation tasks
- Record monorepo choice, API-first design, modular backend, AI gateway, RBAC, auditability and human-in-the-loop rules.
- Record “no replacement of 112/SACHET/CPGRAMS/iRAD” boundary.
- Define change-control rule for future architecture changes.

## Primary files / areas
- `docs/adr/0001-architecture-baseline.md`
- `docs/adr/0002-safety-boundaries.md`

## Exit checks
Validate ADR format; no app tests yet.

## Required commit
`docs(phase-02): record architecture decisions`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
