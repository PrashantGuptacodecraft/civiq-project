# CivIQ Security Controls, Incident Response & Account Recovery
**Phase 70: Security Hardening & Threat-Model Closure**

---

## 1. Technical Security Controls Catalog

CivIQ implements defense-in-depth across application, network, data, and organizational boundaries.

### 1.1 HTTP Security Headers
Every HTTP response originating from the CivIQ backend API and frontend reverse-proxy enforces the following production headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=(self), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```
- **X-Powered-By:** Explicitly disabled via `app.disable('x-powered-by')` to prevent technology fingerprinting.
- **HSTS:** 1-year duration with subdomains and preload inclusion ensures clients never communicate via unencrypted HTTP.

### 1.2 Multi-Tier Rate Limiting
CivIQ deploys sliding-window rate limiters across all API boundaries:

| Tier | Window | Max Requests | Target Routes | Response on Exceeded |
|---|---|---|---|---|
| **Public / Anonymous** | 15 mins | 100 reqs | `/issues`, `/analytics`, `/map` | HTTP 429 Too Many Requests |
| **Authentication & OTP** | 15 mins | 5 attempts | `/auth/otp/send`, `/auth/otp/verify` | HTTP 429 with 15m `Retry-After` |
| **Field Offline Sync** | 1 min | 30 batches | `/sync/batch` | HTTP 429 with backoff header |
| **Media Uploads** | 1 hour | 20 uploads | `/media/upload` | HTTP 429 with quota alert |
| **Emergency Incident Ingress** | 1 min | 120 reqs | `/incidents/rapid` | Burst-tolerant with priority queue |

### 1.3 Cryptographic Standards & Secret Management
- **In-Transit Encryption:** Mandatory TLS 1.3 (fallback TLS 1.2 with PFS ciphers: ECDHE-RSA-AES128-GCM-SHA256 or better).
- **At-Rest Storage Encryption:** AES-256 for persistent database storage volumes and object storage buckets.
- **Webhook Integrity:** HMAC-SHA256 signature verification with `crypto.timingSafeEqual` and timestamp tolerance windows.
- **Secrets Lifecycle:** Zero hardcoded secrets in repository. All credentials injected via environment variables backed by cloud KMS/Secret Manager. Verified via automated CI secret scanning.

### 1.4 Data Minimization & DPDP Act 2023 Compliance
- **No Raw Aadhaar Storage:** Under no circumstances are raw 12-digit Aadhaar numbers stored in the database. When identity documents are uploaded for verification, optical character masking obscures the first 8 digits.
- **Automated PII Redaction:** AI prompt preprocessing (`sanitizePromptInput`) scrubs Aadhaar and phone numbers prior to inference.
- **Private-by-Default Accident Evidence:** Crash, injury, and disaster casualty evidence is restricted to authorized emergency responders and medical task forces.

---

## 2. Security Incident Response Plan (SIRT)

CivIQ maintains a formal Security Incident Response Plan for rapid containment, eradication, and statutory compliance.

### 2.1 Incident Severity Levels

```
┌────────────────────────────────────────────────────────────────────────┐
│ P1 - CRITICAL                                                          │
│ Data breach affecting citizen PII, unauthorized disaster broadcast,     │
│ or total platform compromise. Maximum triage time: 15 minutes.         │
├────────────────────────────────────────────────────────────────────────┤
│ P2 - HIGH                                                              │
│ Compromise of official privileged account, localized auth bypass,      │
│ or critical service degradation. Maximum triage time: 1 hour.          │
├────────────────────────────────────────────────────────────────────────┤
│ P3 - MEDIUM                                                            │
│ Bypassed rate limiting, non-sensitive data leak, or dependency CVE.    │
│ Maximum triage time: 6 hours.                                          │
├────────────────────────────────────────────────────────────────────────┤
│ P4 - LOW                                                               │
│ Security cosmetic issue, minor header misconfiguration.               │
│ Triage within standard sprint cycle.                                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Incident Response Lifecycle Phases

1. **Phase 1: Detection & Triage (T0 to T+15m)**
   - Alerts triggered via audit logs, WAF rate anomalies, or CERT-In notifications.
   - Incident Commander (IC) designated; incident channel created.
   - Initial classification of Severity (P1 through P4).

2. **Phase 2: Immediate Containment (T+15m to T+1h)**
   - **Compromised Sessions:** Execute global token revocation (`syncService.reset()` / Redis session flush).
   - **Compromised Endpoints:** Route-level firewall blocking via WAF or environment feature flag deactivation.
   - **Database Isolation:** Read-only replica failover or network isolation if exfiltration is detected.
   - Preserve forensic snapshots and audit logs.

3. **Phase 3: Eradication & Remediation (T+1h to T+6h)**
   - Rotate all compromised credentials, API keys, and JWT signing keys.
   - Apply hotfix patches, invalidate affected cache records, and close vulnerable ingress paths.
   - Re-run security test suite (`npm run test:backend -- src/middleware/security.test.js`).

4. **Phase 4: Recovery & Verification (T+6h to T+12h)**
   - Gradual restoration of services with enhanced telemetry and rate limits.
   - Monitor ingress logs for secondary exploit attempts.
   - Confirm normal operational telemetry across situation room and citizen portals.

5. **Phase 5: Statutory Reporting & Post-Incident Review (T+6h to T+24h)**
   - **CERT-In Mandatory Reporting:** Under CERT-In Directions (April 2022), cybersecurity incidents must be formally reported within **6 hours** of notice to `incident@cert-in.org.in`.
   - **DPDP Act 2023 Reporting:** Notify the Data Protection Board of India and affected data principals regarding unauthorized personal data disclosures.
   - Author After-Action Review (AAR) document detailing root cause analysis (RCA), timeline chronology, and preventative actions.

### 2.3 Escalation Tree & Emergency Contacts
- **Incident Commander:** Head of Engineering (`security-lead@civiq.in`)
- **Data Protection Officer (DPO):** Legal & Privacy Lead (`dpo@civiq.in`)
- **Emergency Dispatch Liaison:** 112 / State Disaster Emergency Operations Center (SEOC)
- **CERT-In Incident Desk:** `incident@cert-in.org.in` | Phone: 1800-11-4949

---

## 3. Account Recovery & Identity Protection

CivIQ balances accessible account recovery for citizens with strict anti-takeover protections for government officials.

### 3.1 Citizen Account Recovery Workflow
1. **Primary Recovery Channel:** Mobile OTP to registered Indian phone number.
2. **SIM Swap Protection:**
   - When a login occurs from an unrecognized device after a SIM reissuance or password change, a mandatory **12-hour cool-off period** applies before high-risk mutations (e.g. deleting reports, changing contact info) are permitted.
3. **Multi-Factor Step-Up:**
   - If risk score is elevated (unrecognized IP, VPN exit node, anomalous geography), step-up verification via Google SSO or secondary email confirmation is required.

### 3.2 Privileged Official Account Recovery
- **No Self-Service Recovery:** Officials (`DEPARTMENT_OFFICER`, `DISASTER_COORDINATOR`, `DISTRICT_ULB_ADMIN`) cannot reset credentials solely via SMS.
- **Out-of-Band Municipal Authorization:** Recovery requires verification by the Organization's `AGENCY_ADMIN` or `PLATFORM_SUPER_ADMIN` with signed digital authorization.
- **Forced Session Revocation:** Any account recovery automatically revokes all active refresh tokens, sessions, and mobile offline caches across all devices.

### 3.3 Session Invalidation & Device Termination
- **User-Initiated Invalidation:** Users can view active sessions in Settings and click "Log Out All Other Devices".
- **Security-Triggered Invalidation:** Password changes, role permission modifications, or privilege elevation immediately invalidates existing JWT tokens.
- **Field Worker Shift Handover:** At the end of an 8-hour shift, local offline caches lock automatically, requiring worker re-authentication before pending mutations can be altered.
