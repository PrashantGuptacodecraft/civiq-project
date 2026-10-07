# CivIQ Motion & Animation System

**Notice to AI Coding Agents:** This document is a strict specification. All animations and transitions implemented in the CivIQ platform MUST adhere to these rules. Decorative or non-purposeful animations are forbidden. Do not introduce new animation libraries without an explicit ADR (Architecture Decision Record).

## 1. Philosophy
Animation in CivIQ is **purposeful**. It aids understanding, provides immediate feedback, and creates spatial continuity. It must never be decorative-only. CivIQ handles emergency and high-impact civic actions; animations must never block, delay, or confuse user interactions.

## 2. Primary Animation Library
- **Framer Motion (React)**: Use for orchestrated, physics-based, or complex layout transitions.
- **CSS Transitions**: Use for simple hover, focus, and state changes.
- **Rule**: Do NOT use multiple animation libraries (e.g., GSAP, React Spring, Lottie) unless explicitly justified in an ADR.

## 3. Duration Tokens
Standardize all animation timings using these tokens:
- **`duration-micro` (120-180ms)**: Button press, toggle switch, checkbox, basic hover state.
- **`duration-normal` (180-280ms)**: Card entrance, panel slide, dropdown, toast notification.
- **`duration-large` (280-450ms)**: Page transitions, drawer open, modal entrance.
- **`duration-xl` (450-600ms)**: Complex orchestrated sequences only.

## 4. Easing Tokens
Use standard easing curves to ensure natural movement:
- **`ease-default`**: `cubic-bezier(0.4, 0, 0.2, 1)` - Standard for most movements.
- **`ease-in`**: `cubic-bezier(0.4, 0, 1, 1)` - For elements entering the screen.
- **`ease-out`**: `cubic-bezier(0, 0, 0.2, 1)` - For elements exiting the screen.
- **`ease-spring`**: `spring(1, 100, 10, 0)` - Reserved for playful or tactile micro-interactions (e.g., success checkmark pop).

## 5. Animation Patterns
Implement the following exact patterns for common interactions:
- **Button interaction**: `scale(0.97)` on press, `duration-micro`.
- **Card entrance**: `fade-up 8px`, stagger `50ms` between siblings, `duration-normal`.
- **Status changes**: Color transition, `duration-normal`.
- **Navigation**: Slide + fade, `duration-normal`.
- **Drawers/bottom sheets**: Slide from edge, `duration-large`, with backdrop fade.
- **Toast/notification**: Slide-in from edge, `duration-normal`.
- **Upload progress**: Smooth width transition on progress bar.
- **Task state changes**: Highlight flash + icon transition.
- **Map transitions**: Smooth pan/zoom (handled via Mapbox/Leaflet API).
- **Chart animations**: Data points animate in, `duration-large`.
- **Skeleton loading**: Shimmer pulse animation.
- **Page transitions**: Fade, `duration-normal`.

## 6. Forbidden Patterns
- **Infinite decorative animations** (except explicit loading spinners).
- **Excessive bounce effects**.
- **Excessive parallax**.
- **Animations that block user actions**.
- **Animation delays on emergency/critical actions**.
- **Multiple simultaneous complex animations**.
- **Layout-thrashing animations** (animate `transform` and `opacity` only).

## 7. Performance Rules
- **GPU Acceleration**: Animate `transform` and `opacity` only. Avoid animating layout properties (`width`, `height`, `top`, `left`, `margin`).
- **Will-Change**: Use the `will-change` CSS property sparingly, only for known performance bottlenecks.
- **Device Support**: Test all animations on low-end Android devices. If performance drops, default to instant transitions.

## 8. Orchestration
- When animating lists or grids, stagger children at a maximum of **50ms** apart.
- Max **5** staggered items should animate visibly to prevent endless cascading delays.
