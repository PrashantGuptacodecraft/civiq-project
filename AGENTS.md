# CivIQ Agent Instructions

You are working inside the CivIQ repository. This file is mandatory reading before changing code.

## Phase-gated execution

The user will normally provide only a phase number, for example:

- `Execute Phase 07`
- `Phase 32`
- `Implement phase 55`

Interpret that as permission to execute **only that phase**.

### Mandatory procedure

1. Read `docs/PHASE_STATUS.md`.
2. Read `docs/phase-execution.md`.
3. Read the requested `docs/phases/phase-XX-*.md`.
4. Read the prerequisite phase docs and any architecture/security/AI docs referenced by the phase.
5. Inspect the current repository state before editing.
6. Implement only the requested phase.
7. Do not silently pull future-phase functionality into the current phase.
8. Preserve existing working behavior. Prefer additive changes.
9. Run the exit checks listed in the phase document plus relevant existing tests.
10. Update documentation/status only when that phase explicitly requires it.
11. Create the exact required commit message from the phase document.
12. Stop after the commit.

## Never do this

- Do not implement the next phase automatically.
- Do not redesign the architecture because a different approach seems cleaner.
- Do not add a new dependency without checking existing conventions and documenting the reason.
- Do not make AI decisions the final authority for emergency/high-impact actions.
- Do not store raw Aadhaar numbers or other unnecessary identity data.
- Do not expose citizen PII or accident evidence publicly by default.
- Do not claim a government integration is live unless credentials and a real authorized endpoint exist.
- Do not use mocked integrations in production paths without explicit feature flags/source labels.

## Frontend rules

Every AI coding agent implementing a frontend phase MUST:

1. Read the relevant `docs/ux/` documentation before changing frontend code.
2. Build mobile-first. Design for 320px–430px first, then scale up to tablet and desktop.
3. Reuse design tokens from `docs/ux/DESIGN-SYSTEM.md`. No arbitrary color, spacing or typography values.
4. Reuse shared components from `packages/ui/`. Do not duplicate existing components.
5. Respect the motion system in `docs/ux/MOTION-SYSTEM.md`. Use duration and easing tokens.
6. Respect `prefers-reduced-motion`. Wrap non-essential animations in a motion preference check.
7. Implement loading, empty, error and success states for every view. See `docs/ux/UI-STATE-SPECIFICATION.md`.
8. Test mobile (360px, 390px) and desktop (1280px, 1440px) layouts.
9. Never hide important information behind hover. All data must be accessible on touch devices.
10. Never present AI recommendations as unquestionable truth. Label AI outputs clearly.
11. Keep emergency actions accessible and fast. No animation delays on emergency workflows.
12. Avoid UI scope creep beyond the current phase.
13. Never redesign the architecture.
14. Pass the quality gate checks in `docs/ux/UI-QUALITY-GATES.md`.

## Required completion report

After the commit, report only:

- Phase completed
- Commit hash
- Files changed
- Tests/checks executed and result
- Unresolved limitations / follow-ups

Then stop.
