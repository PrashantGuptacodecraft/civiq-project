# UI State Specification

Define the UI state system. Every future feature MUST define these states:

1. Loading: Skeleton placeholders matching content shape. Never blank screens. Use shimmer animation (respects reduced-motion).

2. Empty: Friendly illustration + descriptive message + primary action. Examples:
   - No reports yet → 'Report your first issue' button
   - No tasks assigned → 'No tasks right now' message
   - No results for filter → 'Try adjusting your filters' suggestion

3. Error: Clear error message + retry action. Never raw error codes. Log details to console for debugging. Examples:
   - Network error → 'Something went wrong. Tap to retry.'
   - Server error → 'We're having trouble. Please try again.'
   - Timeout → 'This is taking longer than expected.'

4. Success: Confirmation with next action. Brief toast or inline feedback. Redirect where appropriate.

5. Validation error: Inline field-level errors. Error summary at top of form. Scroll to first error on submit.

6. Offline: Banner indicating offline status. Show cached data with 'Last updated' timestamp. Queue mutations for sync.

7. Retry: Exponential backoff for automatic retry. Manual retry button always available. Show attempt count.

8. Permission denied: Clear message explaining why. Link to request access if applicable. Never show raw 403.

9. Stale data: Visual indicator (muted style, timestamp). Auto-refresh option. Pull-to-refresh on mobile.

10. Processing: Inline progress indicator. Disable submit button. Show progress for uploads.

11. Pending verification: Clearly labeled status. Show what's being verified. Estimated time if available.

12. Suspicious: Warning indicator without accusation. Flagged for review. AI-assisted label clearly shown.

13. Rejected: Clear reason. Appeal/resubmit action if allowed. Non-punitive tone.

14. Resolved: Resolution summary. Before/after evidence if available. Citizen verification prompt.

Rules:
- Never leave users with blank screens
- Every async operation must have a loading indicator
- Every error must have a recovery path
- Offline states must be clearly distinguished from errors
- AI-generated states must be clearly labeled
