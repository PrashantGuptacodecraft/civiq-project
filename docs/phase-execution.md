# Phase Execution Protocol

## Purpose

CivIQ is developed in small, reviewable milestones. Every phase must result in one coherent Git commit.

## Standard agent loop

```text
User: Phase XX
      ↓
Read status + phase spec + dependencies
      ↓
Inspect repo
      ↓
Implement only Phase XX
      ↓
Run tests / lint / typecheck / security checks required for Phase XX
      ↓
Review diff for scope creep
      ↓
Commit with required message
      ↓
STOP
```

## Scope rule

If implementation discovers a requirement belonging to another phase:

1. Do not implement it now.
2. Record it as a limitation or follow-up.
3. Continue only if the current phase can be completed without violating its contract.

## Emergency rule

For emergency/disaster workflows, the system must support an immediate safe handoff to the appropriate official emergency channel while maintaining an `UNVERIFIED` CivIQ incident record. AI verification must not become a safety-critical blocking dependency.

## Definition of done

A phase is done only when its phase-specific exit checks pass, the required commit exists, and no future phase has been silently implemented.

## Frontend phase requirements

For phases that modify `apps/web`, `packages/ui` or any user-facing code:

1. Read the relevant `docs/ux/` files before implementation.
2. Follow the design system (`docs/ux/DESIGN-SYSTEM.md`). Use semantic tokens. No arbitrary values.
3. Validate mobile-first: start with 360px and 390px viewports, then verify tablet (768px) and desktop (1280px, 1440px).
4. Check touch interactions: all targets minimum 44×44px, no hover-only information.
5. Check accessibility: keyboard navigation, visible focus, screen-reader labels, contrast ratios.
6. Check `prefers-reduced-motion`: animations degrade gracefully.
7. Check loading, error, empty and success states exist for every new view.
8. Check responsive behavior: no horizontal overflow at any target viewport.
9. Do not introduce unrelated visual systems, color palettes or component libraries.
10. Pass the quality gate checklist in `docs/ux/UI-QUALITY-GATES.md`.

## Backend-only phase requirements

For phases that only modify `apps/api`, `apps/worker`, `services/ai`, `packages/db` or other non-UI code:

- UX documentation compliance is not required unless the phase explicitly changes the user-facing API contract or introduces a new user-visible status/state.
- All other phase execution rules (one phase, one commit, stop after commit) still apply.
