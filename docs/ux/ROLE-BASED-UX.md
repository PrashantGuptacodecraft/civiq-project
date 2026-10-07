# CivIQ: Role-Based UX Patterns

This document defines the mobile-first UX patterns for each primary role in the CivIQ platform. Future coding agents must follow these patterns when implementing role-specific features.

## Core Trust Rules (Platform-Wide)
- AI is advisory only, never autonomous for high-impact decisions.
- Identity verification ≠ truthful report.
- AI recommendation ≠ official decision.
- Emergency actions must never be blocked by decorative UI.
- CivIQ does not replace official emergency services (112, SACHET, CPGRAMS, iRAD).

---

## 1. Citizen (Resident)
**Context:** Fast, trustworthy reporting of civic issues and accessing nearby information. Mobile-primary.

- **Home:** Feed of nearby issues + own issues. Pull-to-refresh. Status cards. Quick report FAB.
- **Report:** Step-by-step wizard (photo → location → category → description → review → submit). Camera-first. GPS auto-detect.
- **My Reports:** List with status badges. Filter by status. Tap for detail.
- **Nearby:** Map with issue markers. Bottom sheet for issue preview. List toggle.
- **Notifications:** Chronological. Mark read. Tap to navigate.
- **Profile:** Account settings, language, notification preferences.

**Pattern Specifications:**
- **Bottom Nav (Mobile):** Home, Nearby, Report (Prominent/Center), My Reports, Profile. (Max 5 items).
- **Primary Action:** FAB (Floating Action Button) for "New Report" on Home and My Reports.
- **Key Gestures:** 
  - Pull-to-refresh on feeds/lists.
  - Swipe to dismiss notifications.
  - Bottom-sheet swipe-down to dismiss.
- **Notification Patterns:** Push notifications for status changes on submitted reports. In-app badge on the 'Profile/Notifications' tab.

---

## 2. Field Worker
**Context:** Operational, task-focused, often in areas with poor connectivity. Needs high contrast and clear actions.

- **Tasks:** Priority-sorted list. Active task pinned at top. Swipe actions.
- **Active Task:** Full task detail, navigation button, status toggle (Start → Hold → Complete), evidence capture.
- **Map:** Task locations with routing. Current location. Cluster view.
- **Evidence Capture:** Camera with timestamp/GPS overlay. Before/after flow. Upload progress.
- **Sync:** Offline queue indicator. Pending count. Manual sync button.
- **History:** Completed tasks. Performance stats.
- **Profile:** Shift status, area, contact.

**Pattern Specifications:**
- **Bottom Nav (Mobile):** Tasks, Map, Sync, History, Profile.
- **Primary Action:** Prominent sticky button at the bottom of an Active Task (e.g., "Capture Evidence" or "Complete Task").
- **Key Gestures:**
  - Swipe right on task list to "Start".
  - Swipe left to "Put on Hold".
  - Pull-to-refresh to manually force task sync.
- **Notification Patterns:** High-priority alerts for emergency reassignment. Banner for offline/sync status always visible when disconnected.

---

## 3. Authority (Department Officer)
**Context:** Desktop-primary for bulk actions, mobile for quick checks. Data-heavy, KPI-driven.

- **Dashboard:** KPI cards (open, in-progress, overdue, resolved today). Charts. Drill-down.
- **Issues:** Filterable table/card list. Bulk actions on desktop. Status filters.
- **Map:** Heat map + markers. Filter by category/status/time. Layer controls.
- **Alerts:** Escalations, SLA breaches, critical issues. Action buttons.
- **More:** Team management, SLA config, reports.

**Pattern Specifications:**
- **Bottom Nav (Mobile):** Dashboard, Issues, Map, Alerts, More. (Desktop uses collapsible side navigation).
- **Primary Action:** Contextual actions per issue (e.g., "Assign Team", "Escalate").
- **Key Gestures:**
  - Long-press on mobile list items to enter bulk-select mode.
  - Pinch-to-zoom on heat maps.
- **Notification Patterns:** SLA breach warnings visually distinct (red/amber). Email summaries + in-app alert badges.

---

## 4. Verification Officer
**Context:** Desktop-primary, focus on fast throughput, high accuracy, and AI-assisted decision making.

- **Verification Queue:** Sortable/filterable queue. Priority indicators. Batch mode on desktop.
- **Evidence Review:** Image viewer with zoom/pan. Metadata sidebar. AI analysis overlay with clear 'AI-assisted' label.
- **Duplicate Review:** Side-by-side comparison. Similarity score. Merge/dismiss actions.
- **Decision:** Approve/reject/request-more-evidence. Mandatory reason for rejection.

**Pattern Specifications:**
- **Bottom Nav (Mobile):** Queue, Review, History, Profile.
- **Primary Action:** "Approve" / "Reject" sticky button group at the bottom of the review form.
- **Key Gestures:**
  - Double-tap to zoom on evidence.
  - Swipe left/right to move to the next/previous item in the queue.
- **Notification Patterns:** Toast notifications for successful batch operations. Alerts for items nearing SLA limits.

---

## 5. Disaster Coordinator
**Context:** High-stress, rapid response. Real-time data, clear hierarchy of information.

- **Events:** Active events with severity badges. Historical events.
- **Situation Room:** Live map + data feeds. Status panels. Resource allocation.
- **Resources:** Shelter list, supply inventory, team deployment.
- **Tasks:** Response task assignment and tracking.

**Pattern Specifications:**
- **Bottom Nav (Mobile):** Events, Situation, Resources, Tasks.
- **Primary Action:** Prominent "Broadcast Alert" or "Dispatch Resource" FAB.
- **Key Gestures:**
  - Map drag/zoom with minimal latency.
  - Long-press on map to drop a quick incident pin.
- **Notification Patterns:** Persistent, un-dismissible banners for active critical events. High-volume audio/visual cues for new escalations.
