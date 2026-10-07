# CivIQ Accessibility (a11y) Standards

**Notice to AI Coding Agents:** Accessibility in CivIQ is mandatory, not optional. As a civic platform, we serve all citizens, including those with disabilities, in potentially stressful or emergency situations. You MUST follow these guidelines in every component you write.

## 1. Target Compliance
- **WCAG 2.2 AA** compliance is required where practical and technically feasible across the platform.

## 2. Keyboard Navigation
- **Fully Interactive**: All interactive elements (buttons, links, form fields, tabs) must be keyboard accessible.
- **Logical Tab Order**: Tab order must strictly follow the visual layout (usually left-to-right, top-to-bottom).
- **Skip-to-Content**: A visually hidden (until focused) "Skip to main content" link must be present on every page.
- **Focus Trapping**: Modals, dialogs, and bottom sheets must trap focus while open.
- **Escape Key**: Pressing `Escape` must close any open modals, drawers, or bottom sheets.

## 3. Visible Focus
- **Style**: Focus outline must be a `2px solid ring` using the primary color, with a `2px offset`.
- **Rule**: NEVER remove the focus outline (`outline: none`) without providing an equivalent, highly visible replacement.
- **Implementation**: Use `:focus-visible` to ensure focus rings appear for keyboard users without cluttering the UI for mouse/touch users.

## 4. Screen Reader Support
- **Semantic HTML**: Use native elements properly (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`).
- **ARIA Labels**: All icon-only buttons (e.g., a "close" X, a "menu" hamburger) must have descriptive `aria-label`s.
- **ARIA Live Regions**: Use `aria-live="polite"` or `aria-live="assertive"` for dynamic content updates (e.g., form submissions, toast notifications).
- **Images**: Descriptive `alt` text is required for evidence images and meaningful graphics. Decorative images must use `alt=""`.
- **Forms**: Every input must have an explicitly associated `<label>`.
- **Errors**: Form error messages must be linked to their inputs via `aria-describedby`.
- **Async Feedback**: Screen readers must announce status updates for async operations (e.g., "Uploading evidence...", "Report submitted").

## 5. Color and Contrast
- **Text Contrast**: Minimum `4.5:1` contrast ratio for normal text.
- **Large Text/UI Contrast**: Minimum `3:1` for large text (18pt+) and UI components (icons, input borders).
- **Color Independence**: Never use color alone to convey status, meaning, or feedback. Always pair color with an icon, text, or pattern.
- **Badges**: Status badges (e.g., "Pending", "Verified") must include text labels, not just a colored dot.

## 6. Touch Targets
- **Standard Minimum**: `44x44px` minimum tap area for all interactive elements.
- **Spacing**: Minimum `8px` spacing between adjacent touch targets to prevent accidental taps.
- **Critical Actions**: Larger targets (minimum `56x56px`) for emergency, critical, or high-stress actions (e.g., "SOS", "Submit Report").

## 7. `prefers-reduced-motion`
- **Preference Checks**: Wrap all non-essential animations in a `prefers-reduced-motion` media query or hook check.
- **When Enabled**:
  - Remove transforms (scaling, sliding).
  - Remove large movements.
  - Preserve opacity/color transitions if they provide essential state feedback.
  - Simplify loading spinners.
  - Page transitions become instant cuts.
  - Skeleton shimmer animations become static gray placeholders.

## 8. Accessible Dialogs
- Must use `role="dialog"` or `role="alertdialog"`.
- Must include `aria-modal="true"`.
- Must trap focus while open.
- Must return focus to the triggering element when closed.

## 9. Accessible Forms
- Must have visible labels (no relying solely on placeholders).
- Provide an error summary at the top of the form for complex submissions.
- Field-level errors must be explicitly linked.
- Required fields must have clear visual and programmatic (`aria-required="true"`) indicators.

## 10. Accessible Charts
- **Data Alternatives**: Always provide a screen-reader-accessible data table alternative for complex charts.
- **Tooltips**: Data points must have meaningful tooltips.
- **Keyboard Access**: Data points must be keyboard navigable.

## 11. Map Alternatives
- **Rule**: Always provide a list/table view alongside any map view.
- Screen reader users, keyboard-only users, and those on low bandwidth must be able to access all geographic/spatial data without interacting with the map canvas.

## 12. Language
- The `lang` attribute must be set accurately on the `<html>` tag (e.g., `lang="en"`).
- Future multilingual support (Phase 67) will require language toggles and localized `aria-label`s.
