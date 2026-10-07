# Field Worker UX Specification

Define field worker mobile-first patterns:

1. Design principle: Field workers use phones outdoors, often in poor conditions (sun glare, rain, dusty hands). UI must be high-contrast, large-touch-target, minimal-distraction.

2. Task list:
   - Priority-sorted, most urgent first
   - Active task pinned at top with prominent status
   - Each card: issue type icon, address, priority badge, deadline countdown
   - Swipe right to start, swipe left for options
   - Pull-to-refresh for manual sync

3. Active task flow:
   - Step-by-step: Navigate → Arrive → Before Photo → Work → After Photo → Notes → Submit
   - GPS auto-tracks arrival
   - Camera with timestamp/GPS watermark overlay
   - Large action buttons (56px minimum)
   - Cannot skip before/after photo steps (configurable)

4. Evidence capture:
   - Camera launches directly (not file picker)
   - Live preview with GPS coordinates overlay
   - Automatic photo metadata (timestamp, GPS, device ID)
   - Multi-photo support
   - Upload progress with retry
   - Offline queue with visual indicator

5. Offline support:
   - Banner: 'You are offline. Changes will sync when connected.'
   - Cached task data available
   - Evidence captured locally, queued for upload
   - Sync count badge on sync tab
   - Manual sync button
   - Conflict resolution strategy documented

6. Navigation:
   - One-tap navigation link to task location (opens native maps)
   - In-app map with route preview
   - Distance/ETA display

7. Performance:
   - App works on mid-range Android phones
   - Target: <3s initial load
   - Cached content available immediately
   - Images compressed before upload
