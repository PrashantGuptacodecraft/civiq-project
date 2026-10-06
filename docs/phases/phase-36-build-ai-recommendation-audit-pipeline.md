# Phase 36 — Build AI recommendation/audit pipeline

**Agent instruction:** Execute Phase 36 only. Do not begin Phase 37.

## Prerequisites
- Phase 35 must be committed/locked before Phase 36 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Persist AI inference results, model version, prompts/config hash where relevant and human decision.

## Implementation tasks
- Persist AI inference results, model version, prompts/config hash where relevant and human decision.
- Create evaluation record format.
- Add admin view for AI recommendations vs final decisions.

## Primary files / areas
- `apps/api/src/modules/ai-audit/*`
- `packages/db/*`

## Exit checks
Auditability tests; redaction tests.

## Required commit
`feat(phase-36): add AI audit trail`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
