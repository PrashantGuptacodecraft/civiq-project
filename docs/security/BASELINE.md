# Security & Privacy Baseline

## Authentication
- Mobile OTP for citizen onboarding.
- Google/email sign-in options with verified mobile for report submission.
- MFA for privileged officials.
- Strong organization-controlled onboarding for government roles.
- Session/device controls and rate limiting.

## Authorization
Use deny-by-default RBAC plus jurisdiction/organization scoping. Every privileged mutation is audited.

## Abuse controls
- Rate limits
- CAPTCHA/step-up verification when suspicious
- duplicate/reuse detection
- device/IP behavioral signals as secondary risk signals
- report throttling
- moderation queue
- progressive restrictions rather than instant permanent punishment

## Media security
- validate MIME/type and size
- virus/malware scanning where available
- sanitize filenames
- store outside executable paths
- signed URLs for private media
- EXIF is informational only, not proof
- perceptual hashing/embedding for reuse detection

## Privacy
- collect minimum necessary data
- private-by-default citizen identity and accident evidence
- clear consent and purpose
- retention/deletion policy
- audit access to sensitive records
- do not store raw Aadhaar numbers for convenience

## Production compliance
For production deployment in India, map controls to the Digital Personal Data Protection Act/Rules, applicable security requirements, sectoral policies and contractual requirements.

## Emergency data
Emergency reporting should have a clear official-service handoff. CivIQ is not the emergency authority.
