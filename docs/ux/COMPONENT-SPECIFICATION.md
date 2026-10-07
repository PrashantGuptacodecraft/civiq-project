# CivIQ: Component Specification

This document defines the future reusable component library for CivIQ. It provides structural and behavioral specifications.

> **Note to Coding Agents:** Do NOT implement code directly from this file. Use this as the blueprint for creating actual React/Tailwind components.

---

## 1. Layout Components

### AppShell
- **Purpose:** Root layout wrapper managing navigation and main content area.
- **Variants/props:** `role` (citizen, field_worker, authority, etc.), `sidebarOpen` (boolean).
- **Mobile behavior:** Renders `MobileHeader` at top and `MobileBottomNav` at bottom. Content scrolls between them.
- **Desktop behavior:** Renders `DesktopSidebar` on the left. Main content fills the right.
- **Accessibility requirements:** Navigation landmarks (`<nav>`, `<main>`). Skip-to-main-content link.
- **Animation:** Sidebar toggle slides in/out.
- **When to use:** Wrap every primary page.

### MobileHeader
- **Purpose:** Sticky top bar for mobile context.
- **Variants/props:** `title`, `showBack` (boolean), `actionIcon`.
- **Mobile behavior:** Fixed to top, z-index above content.
- **Desktop behavior:** Hidden (desktop uses page-level headers).
- **Accessibility requirements:** `role="banner"`.

### DesktopSidebar
- **Purpose:** Main navigation for internal tools (Authority, Verification).
- **Variants/props:** `collapsed` (boolean), `navItems` (array).
- **Mobile behavior:** Hidden or converts to a temporary drawer.
- **Desktop behavior:** Left-pinned. Collapses to icons-only on toggle.
- **Accessibility requirements:** `aria-expanded` on toggle, keyboard navigable.

### MobileBottomNav
- **Purpose:** Primary navigation for mobile-first roles.
- **Variants/props:** `items` (max 5), `activeTab`.
- **Mobile behavior:** Fixed to bottom, safe-area padded.
- **Desktop behavior:** Hidden.
- **Accessibility requirements:** `role="tablist"`, active state communicated to screen readers.

### PageContainer
- **Purpose:** Consistent padding and max-width for content.
- **Variants/props:** `maxWidth` (sm, md, lg, xl, full), `noPadding` (boolean).
- **Mobile behavior:** 16px horizontal padding.
- **Desktop behavior:** 24px/32px horizontal padding. Centered if maxWidth is set.

---

## 2. Action Components

### Button
- **Purpose:** Standard interaction element.
- **Variants/props:** `variant` (primary, secondary, ghost, danger, emergency), `size` (sm, md, lg), `isLoading`, `disabled`, `fullWidth`.
- **Mobile behavior:** Full width often used. Min 44px touch target height.
- **Desktop behavior:** Auto-width based on content.
- **Accessibility requirements:** `disabled` attribute, `aria-busy` when loading.
- **Animation:** Ripple or scale-down on active press. Loading spinner cross-fade.

### IconButton
- **Purpose:** Icon-only action for tight spaces.
- **Variants/props:** `icon`, `variant`, `size`.
- **Mobile behavior:** Min 44px touch target (even if icon is visually 24px).
- **Desktop behavior:** Requires tooltip on hover.
- **Accessibility requirements:** `aria-label` is strictly mandatory.

### FAB (Floating Action Button)
- **Purpose:** Primary page action (e.g., Create Report).
- **Variants/props:** `icon`, `label` (optional).
- **Mobile behavior:** Fixed bottom-right above bottom nav. Shrinks to icon-only on scroll down, expands to include label on scroll up.
- **Desktop behavior:** Often hidden in favor of a standard primary button in the page header.
- **Accessibility requirements:** High contrast, clear label.

---

## 3. Input Components

### Input
- **Purpose:** Standard text entry.
- **Variants/props:** `type` (text, email, tel, number, password), `label`, `helperText`, `error`.
- **Mobile behavior:** 44px min height. Triggers correct mobile keyboard (numeric, email).
- **Desktop behavior:** Standard sizing.
- **Accessibility requirements:** `id` linked to `<label htmlFor>`, `aria-describedby` for errors/helper text.

### Select
- **Purpose:** Dropdown selection.
- **Variants/props:** `options`, `label`.
- **Mobile behavior:** Native `<select>` element to trigger OS-level wheels/pickers.
- **Desktop behavior:** Custom styled dropdown for advanced filtering (searchable, multi-select).
- **Accessibility requirements:** ARIA listbox pattern for custom desktop select.

### LocationPicker
- **Purpose:** Select a geographic location.
- **Variants/props:** `initialCoords`, `addressRequired`.
- **Mobile behavior:** Map snippet. "Detect Location" button uses HTML5 Geolocation API.
- **Desktop behavior:** Larger map, search bar integration.
- **Accessibility requirements:** Manual text entry fallback for address if map is unusable.

### MediaUploader
- **Purpose:** Upload photos/videos as evidence.
- **Variants/props:** `maxFiles`, `acceptedTypes`.
- **Mobile behavior:** Directly prompts OS camera choice (`capture="environment"`).
- **Desktop behavior:** Drag-and-drop zone.
- **Accessibility requirements:** Keyboard accessible delete buttons for uploaded thumbnails.
- **Animation:** Upload progress bar fill.

---

## 4. Data Display Components

### MetricCard
- **Purpose:** KPI display for dashboards.
- **Variants/props:** `label`, `value`, `trend` (up/down/neutral), `trendValue`.
- **Mobile behavior:** Stacked vertically or horizontal scrolling row.
- **Desktop behavior:** Grid layout.

### StatusBadge
- **Purpose:** Indicate the state of an issue or task.
- **Variants/props:** `status` (Open, In Progress, Resolved, Rejected).
- **Mobile & Desktop behavior:** Inline block, rounded corners.
- **Accessibility requirements:** MUST include text, never rely solely on color (Trust Rule).

### PriorityBadge
- **Purpose:** Indicate urgency.
- **Variants/props:** `level` (Critical, High, Medium, Low).
- **Accessibility requirements:** Use icons (e.g., alert triangle for Critical) alongside text.

### IssueCard
- **Purpose:** Summary of a civic issue for feeds.
- **Variants/props:** `issue` object.
- **Mobile behavior:** Full width card, large image thumbnail.
- **Desktop behavior:** Compact card or table row.

### VerificationCard
- **Purpose:** Display report with AI insights for officers.
- **Variants/props:** `evidenceImages`, `aiConfidence`, `aiTags`.
- **Behavior:** AI insights must have a clear "AI-Assisted" label to prevent over-reliance (Trust Rule).

### SLAIndicator
- **Purpose:** Show time remaining for compliance.
- **Variants/props:** `deadline`, `status`.
- **Behavior:** Changes from green → amber → red as deadline approaches.

---

## 5. Overlay Components

### Dialog
- **Purpose:** Modal window requiring user attention.
- **Variants/props:** `title`, `isOpen`, `onClose`.
- **Mobile behavior:** Usually full-screen or bottom sheet to prevent tricky vertical centering.
- **Desktop behavior:** Centered overlay with backdrop blur.
- **Accessibility requirements:** Focus trap, `aria-modal="true"`, `role="dialog"`, Esc key to close.

### BottomSheet
- **Purpose:** Mobile-optimized contextual overlay.
- **Variants/props:** `snapPoints` (e.g., [25%, 50%, 90%]).
- **Mobile behavior:** Slides up. Drag handle at top.
- **Desktop behavior:** Converts to a side Drawer or standard Dialog.
- **Animation:** Physics-based spring slide-up.

### Toast
- **Purpose:** Brief, auto-expiring notification.
- **Variants/props:** `message`, `type` (success, error, info).
- **Mobile behavior:** Drops from top or floats at bottom above nav.
- **Accessibility requirements:** `role="status"` or `role="alert"` (for errors).

---

## 6. Navigation Components

### Tabs
- **Purpose:** Switch between sibling views.
- **Variants/props:** `tabs`, `activeTab`.
- **Mobile behavior:** Horizontal scrollable if many items.
- **Desktop behavior:** Static layout.
- **Accessibility requirements:** `role="tablist"`, keyboard arrow navigation.

---

## 7. Specialized Components

### MapShell
- **Purpose:** Container for map providers (Mapbox/Google/Leaflet).
- **Variants/props:** `center`, `zoom`, `markers`.
- **Behavior:** Manages the canvas and abstracts the underlying map library.

### Skeleton
- **Purpose:** Loading state placeholder.
- **Variants/props:** `type` (text, circular, rectangular).
- **Animation:** Shimmer effect.

### OfflineIndicator
- **Purpose:** Alert field workers to connectivity issues.
- **Variants/props:** `pendingSyncCount`.
- **Behavior:** Persistent banner, usually red or dark grey.
