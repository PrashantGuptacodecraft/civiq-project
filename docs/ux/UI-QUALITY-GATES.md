# CivIQ UI Quality Gates

This document defines the frontend phase exit checks. Any future frontend phase or coding agent MUST pass ALL of the following checks before completion.

## Responsive Checks
- [ ] 320px viewport works (no overflow, readable, usable)
- [ ] 360px viewport works
- [ ] 390px viewport works
- [ ] 412px viewport works
- [ ] 430px viewport works
- [ ] 768px tablet viewport works
- [ ] 1280px desktop viewport works
- [ ] 1440px desktop viewport works
- [ ] No horizontal overflow at any viewport

## Interaction Checks
- [ ] All touch targets are minimum 44x44px
- [ ] Emergency touch targets are minimum 56x56px
- [ ] No important information hidden behind hover (must be accessible on touch)
- [ ] Pull-to-refresh works where expected (mobile)
- [ ] Swipe gestures have button alternatives

## State Checks
- [ ] Loading state exists (skeleton or spinner)
- [ ] Error state exists with retry action
- [ ] Empty state exists with guidance
- [ ] Success state exists with feedback
- [ ] Offline/retry behavior exists (where relevant)
- [ ] Validation errors shown inline with summary

## Accessibility Checks
- [ ] Visible focus state on all interactive elements
- [ ] Keyboard navigation works (tab, enter, escape)
- [ ] Screen reader labels on all icon-only buttons
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 text, 3:1 UI)
- [ ] Status conveyed by more than color alone
- [ ] Semantic HTML used (headings, landmarks, lists)
- [ ] Form inputs have associated labels
- [ ] Dialogs have focus trap and aria-modal

## Animation Checks
- [ ] `prefers-reduced-motion` supported
- [ ] Animations use duration tokens from MOTION-SYSTEM.md
- [ ] No infinite decorative animations (except loaders)
- [ ] Animations do not block user actions
- [ ] Emergency actions have no animation delay

## Performance Checks
- [ ] No console errors related to UI
- [ ] No broken images
- [ ] Images are optimized (WebP/AVIF where possible)
- [ ] Heavy components are lazy-loaded
- [ ] Maps are lazy-loaded
- [ ] Large lists are virtualized if >50 items
- [ ] No unnecessary client-side JavaScript
- [ ] Skeleton loading used instead of spinners for content areas

## Design System Checks
- [ ] Design tokens from DESIGN-SYSTEM.md used (no arbitrary values)
- [ ] Shared components from packages/ui used where applicable
- [ ] Consistent with existing implemented screens
- [ ] AI outputs clearly labeled as 'AI-assisted' or 'AI recommendation'
- [ ] AI recommendation visually distinct from official decision
- [ ] Emergency UI follows EMERGENCY-UX.md rules

## Trust and Safety Checks
- [ ] AI recommendations not presented as unquestionable truth
- [ ] Emergency handoff to official services clearly visible
- [ ] CivIQ not presented as replacement for official services
- [ ] Sensitive information protected by default
- [ ] Verification status clearly visible

## Critical Action Visibility
- [ ] Primary action button visible without scrolling on mobile
- [ ] Emergency actions accessible within 2 taps
- [ ] Critical information visible above the fold
