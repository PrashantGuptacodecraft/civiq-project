# CivIQ Acceptance Criteria

## 1. Authentication and Identity
- **AC1.1:** The system must not allow anonymous public reporting of issues or incidents.
- **AC1.2:** All reporters must be authenticated via mobile OTP, Google/email, or a stronger government identity verification path.
- **AC1.3:** Identity verification status must be managed separately from the confidence level of the report itself.

## 2. Emergency and Incident Routing
- **AC2.1:** Emergency reports must be placed on a fast path.
- **AC2.2:** Emergency reports must not be blocked waiting for AI or full verification.
- **AC2.3:** Emergency reports must be immediately handed off to official emergency channels with an `UNVERIFIED` status.

## 3. Trust, AI, and Verification
- **AC3.1:** AI models may recommend classifications, routing, and priorities, but must not autonomously execute high-impact or life-critical actions.
- **AC3.2:** High-impact actions must require explicit approval from an authorized human operator.
- **AC3.3:** Evidence provided by field workers and reporters (e.g., photos, timestamps, GPS) must be auditable. EXIF data alone must not be treated as absolute proof without corroboration.

## 4. Privacy and Security
- **AC4.1:** Sensitive incident information and Personally Identifiable Information (PII) must be private by default.
- **AC4.2:** Every privileged action performed by a verification officer, coordinator, or administrator must be logged and auditable.
- **AC4.3:** The platform must not store raw Aadhaar numbers or other unnecessary identity data.

## 5. Integrations and Boundaries
- **AC5.1:** CivIQ must not present itself as a replacement for official systems (e.g., 112, CPGRAMS, SACHET). Official alerts remain the authoritative source.
- **AC5.2:** Production integrations with government systems must only be enabled when proper authorization and credentials exist.
- **AC5.3:** Development and testing environments must use clearly labeled mocks or adapters, never production endpoints without explicit flags.
