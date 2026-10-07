# CivIQ Information Architecture (IA)

**Notice to AI Coding Agents:** This document outlines the structural hierarchy and navigation of the CivIQ platform. You MUST adhere to these role-based paths and navigation patterns when scaffolding pages, routing, or building layout components. 

## 1. Navigation Philosophy
**Role-Based Navigation:** CivIQ serves multiple distinct user types. Navigation is heavily tailored to the user's role. A Citizen does not see Authority menus, and a Field Worker gets an optimized field-ops interface.

## 2. Global Navigation Structure
- **Mobile Devices**: Bottom navigation bar (maximum 5 items). Overflow items go into a "More" menu or hamburger drawer.
- **Tablet Devices**: Collapsible sidebar to maximize screen real estate.
- **Desktop Devices**: Fixed left sidebar with text labels and icons.

## 3. Navigation by Role

### Citizen / Resident
Focused on local awareness and low-friction reporting.
- **Home**: Feed of nearby/own issues.
- **Report**: Create new issue (Primary FAB or center nav item).
- **My Reports**: Status of own submissions.
- **Nearby**: Map view of local issues.
- **Notifications**: Updates on submitted issues.
- **Profile/Settings**: Account and language preferences.

### Field Worker
Focused on execution, offline capability, and task management.
- **Tasks**: Assigned work queue.
- **Active Task**: Current job details (directions, instructions).
- **Map**: Task locations and routes.
- **Evidence Capture**: Quick access to camera and file upload.
- **Sync**: Offline queue status and manual sync trigger.
- **History**: Completed tasks.
- **Profile**: Shift status, account info.

### Authority (Department Officer / Supervisor)
Focused on analytics, SLA management, and dispatch.
- **Dashboard**: KPI overview, SLA metrics.
- **Issues**: Filterable, sortable list of reported issues.
- **Map**: Operational view of jurisdiction.
- **Alerts**: Escalations, SLA breaches, urgent flags.
- **Reports**: Data analytics and exports.
- **More**: Settings, Team management, Jurisdiction bounds.

### Verification Officer
Focused on high-speed review and fraud prevention.
- **Verification Queue**: Stream of incoming reports.
- **Evidence Review**: Side-by-side evidence viewer (images, metadata, AI confidence).
- **Duplicate Review**: Comparison view against historical/nearby reports.
- **Decision**: Approve, Reject, or Request More Info actions.
- **History**: Log of past verifications.

### Disaster / Emergency Coordinator
Focused on macro-level situational awareness and resource allocation.
- **Events**: Active and past disaster instances.
- **Situation Room**: Real-time command dashboard.
- **Resources**: Tracking shelters, supplies, and response teams.
- **Tasks**: Response assignments and dispatches.
- **Communications**: Broadcasts and internal agency comms.

### Platform Admin
Focused on system integrity and configuration.
- **Organizations**: Managing departments and agencies.
- **Users**: RBAC, provisioning, and offboarding.
- **Jurisdictions**: Boundary configurations and mappings.
- **Configuration**: System parameters, AI thresholds.
- **Audit Log**: Immutable system actions log.
- **System Health**: Uptime, API statuses.

## 4. Information Hierarchy
- **Primary Actions First**: The most important actions (e.g., "Report Issue" for citizens, "Approve/Reject" for verifiers) must be immediately visible without scrolling.
- **Progressive Disclosure**: Hide complex data (metadata, raw AI confidence scores, historical logs) behind "View Details" or expandable sections to avoid cognitive overload.

## 5. Search
- **Global Search**: Available on all roles (often in the top app bar).
- **Contextual Filters**: Search results must be heavily filterable based on the current view (e.g., filtering Issues by date, status, priority, or category).

## 6. Breadcrumbs
- **Desktop**: Use breadcrumbs for deep hierarchical navigation (e.g., `Dashboard > Issues > Road Repair > Report #1245`).
- **Mobile**: Do NOT use breadcrumbs. Rely on standard back navigation (`<-`) and the bottom navigation bar.

## 7. Page Titles
- **Visibility**: Every page must have a clear, descriptive title visible in the top header area.
- **Context**: Ensure titles reflect the exact context (e.g., "Verify Report #1245" instead of just "Verification").
