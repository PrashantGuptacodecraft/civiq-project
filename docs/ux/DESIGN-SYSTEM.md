# CivIQ Design System Specification

This document defines the design tokens and component specifications for CivIQ. 

**MANDATORY RULE:** All future frontend phases MUST use these tokens. No arbitrary values or hardcoded hex codes are permitted in the implementation. All tokens should map directly to Tailwind theme extensions in `tailwind.config.ts`.

## 1. Typography Scale
Use `Inter` for the UI, with the standard system font stack as a fallback.
- Minimum body text size: **16px on mobile**, 14px on desktop.

**Semantic Tokens:**
- `display-lg`, `display-md`, `display-sm`
- `heading-xl`, `heading-lg`, `heading-md`, `heading-sm`
- `body-lg`, `body-md`, `body-sm`
- `caption`, `overline`, `label`

## 2. Spacing Scale (4px Base Unit)
Use this scale for margin, padding, and gaps:
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-10`: 40px
- `space-12`: 48px
- `space-16`: 64px

## 3. Border Radius
- `radius-sm`: 4px
- `radius-md`: 8px
- `radius-lg`: 12px
- `radius-xl`: 16px
- `radius-full`: 9999px (pill/circle)

## 4. Elevation / Shadows
- `elevation-0`: No shadow
- `elevation-1`: Subtle shadow for cards
- `elevation-2`: Prominent shadow for elevated cards/dropdowns
- `elevation-3`: Heavy shadow for modals/dialogs
- `elevation-4`: Max shadow for overlays/bottom sheets

## 5. Surface Tokens
- `surface-primary`: Main app background
- `surface-secondary`: Section backgrounds, slightly offset
- `surface-tertiary`: Deeply offset backgrounds
- `surface-elevated`: Cards, dropdowns
- `surface-overlay`: Modals, dialogs, drawers

## 6. Semantic Color Tokens
- **Brand**: `primary`, `primary-hover`, `primary-active`
- **Secondary**: `secondary`, `accent`
- **Text**: `text-primary`, `text-secondary`, `text-tertiary`, `text-inverse`
- **Borders**: `border-primary`, `border-secondary`
- **Backgrounds**: `background-page`, `background-card`

## 7. Status Colors
Background/foreground pairs must ensure adequate contrast:
- **Success (Green)**: Resolved, verified tasks.
- **Warning (Amber)**: Needs attention, SLA warnings.
- **Error (Red)**: Critical, rejected, SLA breached.
- **Info (Blue)**: Informational messages.
- **Neutral (Gray)**: Draft, pending.

## 8. CivIQ-Specific Semantic Colors
CivIQ workflows require precise color mappings:
- **Workflow Statuses**: `status-submitted`, `status-under-verification`, `status-verified`, `status-action-in-progress`, `status-resolution-submitted`, `status-citizen-verified`, `status-closed`, `status-needs-evidence`, `status-possible-duplicate`, `status-rejected`, `status-reopened`, `status-unverified-emergency`.
- **Priorities**: `priority-critical`, `priority-high`, `priority-medium`, `priority-low`.
- **Trust Contexts**: `trust-verified-identity`, `trust-basic-identity`.
- **AI Specific**: `ai-recommendation` (Must remain visually distinct from official-decision colors to enforce AI advisory rules).

## 9. Interaction States
- **Focus**: 2px solid ring, 2px offset, using primary color. Must be visible on all interactive elements.
- **Disabled**: 40% opacity, `cursor-not-allowed`. Do not rely solely on color for disabled states.

## 10. Component Styling Specifications
- **Buttons**: Variations include `primary`, `secondary`, `ghost`, `danger`, `emergency`. 
  - Minimum height: 44px (mobile), 40px (desktop).
  - Minimum touch target: 44x44px.
- **Inputs**: 
  - Minimum height: 44px (mobile).
  - Must include clear labels, helper text, and distinct error messages.
- **Cards**: Use `surface-elevated`, `radius-lg`, padding `space-4` to `space-6`.
- **Badges**: `status-badge` matching semantic colors. Minimum 24px height.
- **Dialogs**: Centered, max-width 480px, modal backdrop overlay.
- **Drawers**: Slide from right (desktop) or slide from bottom (mobile).
- **Bottom Sheets**: Mobile-only, must include drag handle and snap points.
- **Tables**: Responsive. Card layout on mobile, sticky headers on desktop.
- **Charts**: Use semantic colors. Ensure accessible patterns (e.g., textures/patterns for colorblindness) and responsive sizing.
- **Toast Notifications**: Top-right (desktop), bottom-center (mobile). Auto-dismiss at 5s, except for error toasts which must be dismissed manually.
- **Icons**: 24px default, 20px compact. Maintain consistent stroke width across the application.

## 11. Dark Mode Architecture
Dark mode support is **PLANNED** but not required in initial phases. However, the design tokens structured above must be used to ensure seamless dark mode implementation in the future.
