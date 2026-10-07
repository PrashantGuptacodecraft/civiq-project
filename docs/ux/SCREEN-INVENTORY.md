# CivIQ: Screen Inventory

This document serves as the canonical screen inventory for the CivIQ project. It defines the purpose, layout, and states for all required screens.

> **Note to Coding Agents:** Do NOT implement these screens directly from this file. This is a documentation reference only. Check the phase reference to see when a screen should be implemented.

---

## 1. Citizen Screens

### Login/Register
- **Purpose:** Authenticate citizens using standard methods or Gov SSO.
- **Primary User:** Citizen
- **Primary Action:** "Sign In" / "Continue with Google"
- **Mobile Layout:** Centered logo, stacked input fields, social auth buttons.
- **Desktop Layout:** Split screen: imagery on left, login form centered on right.
- **Key States:** Loading (spinner on button), Error (inline validation), Success (redirect).
- **Accessibility Needs:** High contrast text, clear focus rings, screen reader support for social auth.
- **Animation Needs:** Subtle fade-in on load.
- **Phase Reference:** Phase 15 (Google sign-in)

### Home Feed
- **Purpose:** Display nearby issues and user's own reports.
- **Primary User:** Citizen
- **Primary Action:** "New Report" FAB
- **Mobile Layout:** Vertical feed of `IssueCard` components. Sticky top header. Bottom nav.
- **Desktop Layout:** Grid of issue cards. Left sidebar nav.
- **Key States:** Loading (skeleton cards), Empty (illustration "No issues nearby").
- **Accessibility Needs:** Meaningful structure (H1, H2), aria-labels on interaction points.
- **Animation Needs:** Pull-to-refresh spinner, smooth list transition.
- **Phase Reference:** Phase 27 (Citizen report UI)

### Create Report (Wizard)
- **Purpose:** Step-by-step submission of a civic issue.
- **Primary User:** Citizen
- **Primary Action:** "Next" / "Submit"
- **Mobile Layout:** Full-screen wizard. Progress bar at top. Content area. Sticky bottom buttons.
- **Desktop Layout:** Centered modal or constrained width card.
- **Key States:** Offline (save to draft), Success (confetti + ID generated), Error (upload failed).
- **Accessibility Needs:** Progress announcer ("Step 1 of 4").
- **Animation Needs:** Slide left/right transitions between steps.
- **Phase Reference:** Phase 27, Phase 68 (Voice reporting)

### Report Detail
- **Purpose:** View full context, timeline, and status of a specific report.
- **Primary User:** Citizen
- **Primary Action:** "Share" or "Verify Resolution" (if resolved)
- **Mobile Layout:** Hero image, status badge, description, vertical timeline.
- **Desktop Layout:** Two-column (Image/details left, timeline right).
- **Key States:** Resolved (prominent success state).
- **Accessibility Needs:** Image alt text (auto-generated or user-provided).
- **Animation Needs:** Expandable timeline entries.
- **Phase Reference:** Phase 27, Phase 43 (Resolution verification)

### My Reports List
- **Purpose:** Overview of user's submitted reports.
- **Primary User:** Citizen
- **Primary Action:** Tap to view details
- **Mobile Layout:** Filter chips at top, vertical list.
- **Desktop Layout:** Table or detailed list view.
- **Key States:** Empty ("You haven't reported anything yet").
- **Accessibility Needs:** Clear status text (not just color).
- **Animation Needs:** List item stagger on load.
- **Phase Reference:** Phase 27

### Nearby Map
- **Purpose:** Spatial view of issues in the user's vicinity.
- **Primary User:** Citizen
- **Primary Action:** Tap marker for details
- **Mobile Layout:** Full-screen map, search bar overlay, bottom sheet for details.
- **Desktop Layout:** Full-screen map with sidebar for details.
- **Key States:** Loading (map skeleton/spinner), Offline (cached tiles or offline warning).
- **Accessibility Needs:** Map alternatives (list view toggle is mandatory).
- **Animation Needs:** Smooth bottom sheet slide up.
- **Phase Reference:** Phase 29 (Geolocation/map)

### Notifications
- **Purpose:** Alert users to updates on their reports.
- **Primary User:** Citizen
- **Primary Action:** Tap to view related issue
- **Mobile Layout:** Simple list with unread indicators.
- **Desktop Layout:** Dropdown from header or dedicated page.
- **Key States:** Empty ("You're all caught up").
- **Accessibility Needs:** "Mark all read" accessible button.
- **Animation Needs:** Swipe-to-delete animation.
- **Phase Reference:** Phase 27

### Profile/Settings
- **Purpose:** Manage account, language, and preferences.
- **Primary User:** Citizen
- **Primary Action:** "Save Settings" / "Log Out"
- **Mobile Layout:** List of menu items grouped by category.
- **Desktop Layout:** Grid or detailed list.
- **Key States:** Saved (toast notification).
- **Accessibility Needs:** Standard form accessibility.
- **Animation Needs:** None specific.
- **Phase Reference:** Phase 67 (Multilingual)

### Resolution Verification
- **Purpose:** Allow citizen to confirm if a fixed issue is actually resolved.
- **Primary User:** Citizen
- **Primary Action:** "Yes, Fixed" / "No, Reopen"
- **Mobile Layout:** Side-by-side Before/After photos, simple boolean choice, optional comment.
- **Desktop Layout:** Similar, centered.
- **Key States:** Success (Thank you screen).
- **Accessibility Needs:** Clear labels on the comparison photos.
- **Animation Needs:** Fade between choices.
- **Phase Reference:** Phase 43

---

## 2. Field Worker Screens

### Task List
- **Purpose:** View assigned operational tasks.
- **Primary User:** Field Worker
- **Primary Action:** Open active task
- **Mobile Layout:** Priority-sorted list. High contrast. Sticky active task.
- **Desktop Layout:** N/A (Mobile-primary).
- **Key States:** Offline (Offline banner active).
- **Accessibility Needs:** Large touch targets.
- **Animation Needs:** Swipe actions.
- **Phase Reference:** Phase 41 (Field worker PWA)

### Task Detail / Active Task
- **Purpose:** Execute a specific field task.
- **Primary User:** Field Worker
- **Primary Action:** "Start Task" / "Capture Evidence"
- **Mobile Layout:** Task metadata, map snippet, sticky action footer.
- **Desktop Layout:** N/A.
- **Key States:** In Progress, On Hold, Completed.
- **Accessibility Needs:** High contrast for outdoor visibility.
- **Animation Needs:** Status transition pulse.
- **Phase Reference:** Phase 41

### Evidence Capture
- **Purpose:** Take verified photos with GPS/timestamp to prove work.
- **Primary User:** Field Worker
- **Primary Action:** "Shutter" / "Upload"
- **Mobile Layout:** Full-screen camera view, overlay with guidelines.
- **Desktop Layout:** N/A.
- **Key States:** Uploading (progress bar), Error (retry prompt).
- **Accessibility Needs:** Audio feedback on capture.
- **Animation Needs:** Flash/shutter animation.
- **Phase Reference:** Phase 42 (Field verification evidence)

### Map Navigation
- **Purpose:** Route to task location.
- **Primary User:** Field Worker
- **Primary Action:** "Start Navigation"
- **Mobile Layout:** Map view with route line.
- **Desktop Layout:** N/A.
- **Key States:** Rerouting.
- **Accessibility Needs:** Turn-by-turn text readable by screen reader.
- **Animation Needs:** Smooth marker movement.
- **Phase Reference:** Phase 29, Phase 41

### Sync Dashboard
- **Purpose:** Manage offline data queues and synchronization.
- **Primary User:** Field Worker
- **Primary Action:** "Force Sync"
- **Mobile Layout:** Queue list, sync status circle.
- **Desktop Layout:** N/A.
- **Key States:** Syncing (spinner), Offline (paused).
- **Accessibility Needs:** Clear status announcements.
- **Animation Needs:** Sync rotation animation.
- **Phase Reference:** Phase 69 (Offline field sync)

### Task History
- **Purpose:** Review completed work.
- **Primary User:** Field Worker
- **Primary Action:** View details
- **Mobile Layout:** Chronological list.
- **Desktop Layout:** N/A.
- **Key States:** Empty.
- **Accessibility Needs:** Standard list.
- **Animation Needs:** None.
- **Phase Reference:** Phase 41

---

## 3. Verification Officer Screens

### Verification Queue
- **Purpose:** Triage and process incoming reports.
- **Primary User:** Verification Officer
- **Primary Action:** Open report
- **Mobile Layout:** Condensed list.
- **Desktop Layout:** Dense data table with advanced filters.
- **Key States:** Empty ("Queue is clear").
- **Accessibility Needs:** Keyboard navigation for table rows.
- **Animation Needs:** Row highlight on hover/focus.
- **Phase Reference:** Phase 24 (Verification officer console)

### Evidence Review
- **Purpose:** Scrutinize citizen submissions and AI analysis.
- **Primary User:** Verification Officer
- **Primary Action:** Approve/Reject
- **Mobile Layout:** Stacked: Image -> AI details -> Actions.
- **Desktop Layout:** Split: Large image viewer left, AI metadata right.
- **Key States:** AI Processing (spinner over metadata).
- **Accessibility Needs:** AI insights must be read out explicitly.
- **Animation Needs:** Image pan/zoom.
- **Phase Reference:** Phase 24, Phase 42

### Duplicate Comparison
- **Purpose:** Identify and merge duplicate reports.
- **Primary User:** Verification Officer
- **Primary Action:** "Merge" / "Keep Separate"
- **Mobile Layout:** Stacked cards.
- **Desktop Layout:** Side-by-side visual comparison.
- **Key States:** Loading similarity score.
- **Accessibility Needs:** Clear indication of which is the "primary" record.
- **Animation Needs:** Card merge animation.
- **Phase Reference:** Phase 24

### Decision Form
- **Purpose:** Finalize verification status and provide reasoning.
- **Primary User:** Verification Officer
- **Primary Action:** "Submit Decision"
- **Mobile Layout:** Form with required dropdowns/text areas.
- **Desktop Layout:** Modal or side drawer.
- **Key States:** Validation Error (missing reason).
- **Accessibility Needs:** Mandatory fields clearly marked.
- **Animation Needs:** Shake on error.
- **Phase Reference:** Phase 24

---

## 4. Department Officer Screens

### Command Dashboard
- **Purpose:** High-level overview of department metrics.
- **Primary User:** Department Officer
- **Primary Action:** Drill down into charts
- **Mobile Layout:** Stacked metric cards.
- **Desktop Layout:** Grid of charts and KPI widgets.
- **Key States:** Loading data (skeletons).
- **Accessibility Needs:** Data tables available for all charts.
- **Animation Needs:** Chart entry animations.
- **Phase Reference:** Phase 45 (Authority command dashboard)

### Issue List
- **Purpose:** Detailed management of civic issues.
- **Primary User:** Department Officer
- **Primary Action:** Assign / Update Status
- **Mobile Layout:** Standard list.
- **Desktop Layout:** Complex data table with inline editing capabilities.
- **Key States:** Filtered state (clear indicators of active filters).
- **Accessibility Needs:** Column headers focusable and sortable.
- **Animation Needs:** None specific.
- **Phase Reference:** Phase 45

### Issue Detail
- **Purpose:** Deep dive into a single issue lifecycle.
- **Primary User:** Department Officer
- **Primary Action:** Add internal note / Escalate
- **Mobile Layout:** Tabbed view (Details, History, Team).
- **Desktop Layout:** Multi-panel dashboard for the specific issue.
- **Key States:** Escalated (red warning borders).
- **Accessibility Needs:** Tab panel ARIA roles.
- **Animation Needs:** Tab transitions.
- **Phase Reference:** Phase 45

### Operational Map
- **Purpose:** Spatial overview of infrastructure and issues.
- **Primary User:** Department Officer
- **Primary Action:** Toggle layers
- **Mobile Layout:** Map with expandable layer drawer.
- **Desktop Layout:** Full map with persistent right sidebar for controls/analytics.
- **Key States:** Layer loading.
- **Accessibility Needs:** SR summary of visible markers.
- **Animation Needs:** Heatmap intensity transitions.
- **Phase Reference:** Phase 44 (Operational map), Phase 46 (Hotspot analytics), Phase 53 (Asset intelligence)

### Alert Center
- **Purpose:** Manage SLA breaches and critical escalations.
- **Primary User:** Department Officer
- **Primary Action:** Acknowledge alert
- **Mobile Layout:** High-contrast list.
- **Desktop Layout:** Split pane (Alert list left, details right).
- **Key States:** Critical (flashing indicator or harsh red).
- **Accessibility Needs:** Urgent ARIA live regions for new critical alerts.
- **Animation Needs:** Pulse on unacknowledged critical alerts.
- **Phase Reference:** Phase 45

### Team Management
- **Purpose:** Oversee field workers and dispatching.
- **Primary User:** Department Officer
- **Primary Action:** Modify schedules / zones
- **Mobile Layout:** Simple roster list.
- **Desktop Layout:** Kanban or calendar-style resource view.
- **Key States:** Worker Offline (greyed out).
- **Accessibility Needs:** Drag-and-drop requires keyboard alternatives.
- **Animation Needs:** Drop-target highlights.
- **Phase Reference:** Phase 45

---

## 5. Disaster Coordinator Screens

### Event List
- **Purpose:** Overview of all active and past emergency events.
- **Primary User:** Disaster Coordinator
- **Primary Action:** "Declare New Event"
- **Mobile Layout:** Prominent severity cards.
- **Desktop Layout:** Grid/List with quick-stat summaries.
- **Key States:** Active Event (highlighted).
- **Accessibility Needs:** Severity levels described via text, not just color.
- **Animation Needs:** None specific.
- **Phase Reference:** Phase 63 (Disaster impact reporting)

### Situation Room
- **Purpose:** Centralized command center during a disaster.
- **Primary User:** Disaster Coordinator
- **Primary Action:** Send Broadcast / Update Status
- **Mobile Layout:** Tabs (Map, Comms, Summary) due to space.
- **Desktop Layout:** Multi-monitor optimized, heavily widgetized. Live map central.
- **Key States:** Live updates active (green indicator).
- **Accessibility Needs:** Auto-updating regions must use aria-live appropriately so as not to overwhelm.
- **Animation Needs:** Real-time data flash.
- **Phase Reference:** Phase 66 (Disaster situation room)

### Impact Report Form
- **Purpose:** Intake structured data on damage and casualties.
- **Primary User:** Disaster Coordinator / Verified Field Agent
- **Primary Action:** Submit Report
- **Mobile Layout:** Multi-step wizard optimized for speed.
- **Desktop Layout:** Dense form.
- **Key States:** Offline storage.
- **Accessibility Needs:** Clear error states for fast correction.
- **Animation Needs:** Minimal (performance focus).
- **Phase Reference:** Phase 63

### Resource Registry
- **Purpose:** Track shelters, supplies, and available personnel.
- **Primary User:** Disaster Coordinator
- **Primary Action:** "Add Resource"
- **Mobile Layout:** Searchable list.
- **Desktop Layout:** Table with status indicators (Available, Depleted).
- **Key States:** Depleted (red text, strike-through optionally).
- **Accessibility Needs:** Standard data grid.
- **Animation Needs:** None.
- **Phase Reference:** Phase 66

### Need-Resource Matching
- **Purpose:** Match incoming needs with available resources.
- **Primary User:** Disaster Coordinator
- **Primary Action:** "Approve Allocation"
- **Mobile Layout:** Stacked cards with a clear connection line/UI.
- **Desktop Layout:** Split screen or visual node graph.
- **Key States:** Match found, No resources.
- **Accessibility Needs:** Complex relationships require clear semantic text explanations.
- **Animation Needs:** Allocation success checkmark.
- **Phase Reference:** Phase 66

### After-Action Review
- **Purpose:** Post-event analysis and reporting.
- **Primary User:** Disaster Coordinator
- **Primary Action:** Generate PDF Report
- **Mobile Layout:** Read-only summary.
- **Desktop Layout:** Document builder style interface.
- **Key States:** Generating report (progress bar).
- **Accessibility Needs:** Standard reading structure.
- **Animation Needs:** None.
- **Phase Reference:** Phase 66

---

## 6. Platform Admin Screens

### Organization Management
- **Purpose:** Manage departments and agencies on the platform.
- **Phase Reference:** Phase 18 (Government onboarding)

### User Management
- **Purpose:** Global user roles, access control, and auditing.
- **Phase Reference:** Phase 18

### Jurisdiction Management
- **Purpose:** Define spatial boundaries and responsibilities.
- **Phase Reference:** Phase 18, Phase 29

### System Configuration
- **Purpose:** Global settings, API keys, AI thresholds.
- **Phase Reference:** General Admin

### Audit Log Viewer
- **Purpose:** Security and compliance tracking.
- **Phase Reference:** General Admin
