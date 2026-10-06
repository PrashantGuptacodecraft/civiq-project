# CivIQ Domain Model

```text
User
 ├── AuthIdentity / Session
 ├── TrustProfile
 └── Roles / Permissions

Organization
 └── Department
      └── Workforce / Supervisors

Jurisdiction
 └── State/UT → District → Local Body/Panchayat → Ward/Village

Issue / Incident
 ├── Media/Evidence
 ├── Location
 ├── StatusHistory
 ├── Verification
 ├── DuplicateCandidates
 ├── Assignment
 ├── SLA / Escalation
 └── CitizenFeedback

Asset
 └── MaintenanceHistory

DisasterEvent
 ├── OfficialAlerts
 ├── ImpactReports
 ├── Resources / Shelters
 └── Needs / Matches

AIResult
 ├── Model/provider/version
 ├── Confidence/uncertainty
 ├── Explanation/factors
 └── Human override/correction
```

## Core invariants

- Every public report has an accountable user.
- Every report is bound to a jurisdiction.
- Evidence is private-by-default until policy says otherwise.
- High-impact status changes are auditable.
- An issue can represent multiple duplicate/corroborating reports.
- Accident/disaster incidents have a separate operational lifecycle.
