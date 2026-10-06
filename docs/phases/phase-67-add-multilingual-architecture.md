# Phase 67 — Add multilingual architecture

**Agent instruction:** Execute Phase 67 only. Do not begin Phase 68.

## Prerequisites
- Phase 66 must be committed/locked before Phase 67 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create locale keys, language preferences and translation adapter.

## Implementation tasks
- Create locale keys, language preferences and translation adapter.
- Integrate text/voice translation provider behind an adapter; BHASHINI-compatible path is preferred for Indian-language support.
- Start with English + Hindi and make additional languages configuration-driven.

## Primary files / areas
- `apps/web/lib/i18n/*`
- `apps/api/src/modules/i18n/*`
- `apps/api/src/integrations/bhashini/*`

## Exit checks
Translation key completeness tests.

## Required commit
`feat(phase-67): add multilingual foundation`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
