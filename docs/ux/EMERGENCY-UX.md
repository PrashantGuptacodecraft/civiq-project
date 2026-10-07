# Emergency UX Specification

Define emergency UI principles:

1. Core principle: Emergency workflows MUST remain immediately accessible. No decorative delays.

2. Emergency report flow:
   - Prominent emergency toggle/button on report screen
   - When marked emergency: simplified form, fewer required fields
   - Immediate official emergency handoff (call 112 link, prominent)
   - CivIQ records as UNVERIFIED
   - Confirmation shows: 'This has been recorded. For immediate help, contact [official service].'

3. Visual treatment:
   - Emergency banner: high-contrast, red/orange, persistent at top
   - UNVERIFIED badge: clearly visible, distinct from VERIFIED
   - Official handoff: large, prominent call/link button
   - No decorative animations on emergency screens
   - Simplified UI: reduce non-essential elements

4. CivIQ boundary:
   - CivIQ is NOT a replacement for 112 or official emergency services
   - UI must never suggest CivIQ handles emergency dispatch
   - Official emergency contact always visible in emergency context
   - AI remains advisory for emergency severity assessment

5. Performance:
   - Emergency screens must load fast (target <1s)
   - Minimal JavaScript
   - Works on low bandwidth
   - Works offline (queue for sync)

6. Accessibility:
   - Large touch targets (56px minimum for emergency actions)
   - High contrast
   - Screen reader announcements for status changes
   - No animation delays
