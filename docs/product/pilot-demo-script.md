# CivIQ Production Pilot Demonstration Script
**Pune Municipal Corporation (PMC) Pilot Walkthrough**

---

## 1. Scenario 1: Citizen Multilingual Voice Reporting
- **Actor:** Priya Sharma (`CITIZEN`)
- **Step 1:** Opens CivIQ portal in Marathi (`mr`).
- **Step 2:** Clicks the microphone button and speaks: *"औंध बाणेर रस्त्यावर मोठा खड्डा पडला आहे, अपघात होऊ शकतो."*
- **Step 3:** BHASHINI STT transcribes the speech to Marathi text and translates to English for departmental records.
- **Step 4:** System attaches GPS coordinates (`18.5913, 73.7389`) and submits report `iss_pilot_001`.
- **Outcome:** Issue registered with status `SUBMITTED`, SLA timer initialized.

---

## 2. Scenario 2: Verification Officer Review & Trust Score
- **Actor:** Pooja Patil (`VERIFICATION_OFFICER`)
- **Step 1:** Navigates to `/field-verification` queue.
- **Step 2:** Inspects image evidence, AI duplicate confidence (low), and automated PII redaction.
- **Step 3:** Approves verification. Status updates to `VERIFIED`. Citizen trust score increases by +5 points.

---

## 3. Scenario 3: Department Officer Dispatch & SLA Tracking
- **Actor:** Er. Sunita Kulkarni (`DEPARTMENT_OFFICER`)
- **Step 1:** Opens Road Department dashboard.
- **Step 2:** Observes new verified pothole report within Aundh-Baner Ward.
- **Step 3:** Assigns task to Field Worker Ramesh Jadhav (`usr_pilot_field_worker`).

---

## 4. Scenario 4: Field Worker Offline Inspection & Resolution
- **Actor:** Ramesh Jadhav (`FIELD_WORKER`)
- **Step 1:** Opens mobile field app; downloads offline sync bundle (`GET /sync/delta`).
- **Step 2:** Drives to site; goes offline. Repairs pothole, captures after-repair photo with geotag.
- **Step 3:** Marks task `RESOLVED` while disconnected.
- **Step 4:** Reconnects to network; offline sync engine executes idempotent batch synchronization (`POST /sync/batch`).

---

## 5. Scenario 5: Disaster Situation Room & Rapid Mobilization
- **Actor:** Capt. Milind Joshi (`DISASTER_COORDINATOR`)
- **Step 1:** IMD issues red alert bulletin for Mula-Mutha river basin via CAP XML feed (`POST /alerts/ingest`).
- **Step 2:** Coordinator enters `/disaster-ops/situation-room`.
- **Step 3:** Reviews algorithmic resource matching: 4 rescue boats, 2 water pumps deployed to affected low-lying wards.
- **Step 4:** Broadcasts statutory warning advisory to citizens in affected polygon.
