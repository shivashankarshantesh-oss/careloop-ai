# CareLoop AI — Closed-Loop Care Coordination Platform

A production-style clinical closed-loop care coordination system ensuring that **no actionable laboratory or imaging finding is dropped between result receipt and documented clinical evidence**.

---

## 1. Problem Overview & Core Philosophy

In healthcare systems, up to 30% of abnormal outpatient test findings (such as suspicious BI-RADS 4 mammograms, positive colorectal FIT tests, or elevated PSAs) experience diagnostic delays or complete loss to follow-up. 
These failures rarely stem from medical misdiagnosis; rather, they arise from **administrative and handoff friction**:
- **Loss of Accountability**: Unassigned cases where no single clinician or coordinator owns the next step.
- **Premature Assumptions**: Treating message dispatch as patient acknowledgement, referral submission as referral acceptance, or appointment attendance as care closure.
- **Dropped Handoffs**: When a specialist clinic rejects a referral due to backlog, the case silently disappears from active queues.
- **Inappropriate AI Usage**: Using generative models to diagnose, assign urgency, or postpone care without qualified clinician sign-off.

### The 4 Non-Negotiable Closed-Loop Invariants
1. **Submission ≠ Acceptance**: A specialist referral is only in progress once formally accepted by the receiving provider.
2. **Acceptance ≠ Attendance**: An accepted referral does not mean the patient attended the biopsy or procedure.
3. **Attendance ≠ Documented Care Closure**: Attending a procedure is not clinical resolution; closure requires permanent histology/pathology reports and documented surveillance intervals.
4. **Rejection Never Causes Auto-Closure**: A rejected referral retains active case ownership in CareLoop and immediately triggers clinician reassessment.

---

## 2. Platform Architecture & Data Models

### Technology Stack
- **Frontend**: React 19 SPA, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend / API**: Express 4 server on Node.js (`server.ts`) with mounted Vite dev middlewares.
- **AI Engine**: Server-side `@google/genai` SDK (`gemini-3.8-flash`) with structured prompts, strict clinical safety guardrails, and offline template fallbacks.
- **State & Persistence**: Real-time React Context (`CareLoopContext.tsx`) with bidirectional `localStorage` synchronization.

### Key Data Entities
- **ScreeningCase**: Central clinical registry record tracking the patient, test name, screening protocol (8 USPSTF/NQF pathways), raw report snippet, clinician-designated urgency, 13-stage workflow progress, responsible owner, due date, exception status, blockers, and the 8-point evidence checklist.
- **EvidenceChecklist**:
  1. `clinicianReviewCompleted` (Physician sign-off & urgency)
  2. `patientNotified` (Channel, timestamp, plain language)
  3. `patientAcknowledged` (Patient confirmation & comprehension check)
  4. `diagnosticConfirmationCompleted` (Biopsy, repeat test, or second view)
  5. `referralAccepted` (Specialist acceptance recorded)
  6. `appointmentAttended` (Verified procedural attendance)
  7. `carePlanDocumented` (Surveillance interval & recall date)
  8. `finalSignoffCompleted` (Authorized human clinician closure sign-off)
- **Referral**: Structured inter-organizational handoff record with 12 explicit states (`DRAFT` to `COMPLETED`), supporting checklist, response deadlines, and milestone history.
- **Escalation**: System-generated SLA breach alerts across 9 distinct triggers, mapped to Tier 1 Critical (24h SLA), Tier 2 Urgent (48h SLA), or Tier 3 Warning (72h SLA).
- **Communication**: Trilingual outreach record (English, Hindi, Marathi) tracking delivery timeline, verification status, and comprehension check responses.

---

## 3. Real Dynamic Analytics Dashboard

CareLoop's Analytics Dashboard calculates all metrics dynamically from active in-memory records with zero hardcoded numbers.

### Key Performance Indicators & Formulas
| KPI Metric | Clinical Standard & Formula | Numerator / Denominator |
| :--- | :--- | :--- |
| **Actionable Cases Received** | Total count of enrolled screening cases matching active filters. | Count(Cases) |
| **Open vs Closed Cases** | Proportion of active pathways vs verified closures. | Closed Cases / Total Cases |
| **Documented Owner & Next Step** | Percentage of active cases with an assigned human owner and non-empty action. | Cases with Owner & Action / Total Cases |
| **Median Time to Clinician Review** | Median hours from result receipt to clinician sign-off (`initialReviewTimestamp - receivedDate`). | Median hours (`n` cases evaluated) |
| **Median Time to Patient Notification** | Median hours from result receipt to first outreach dispatch. | Median hours (`n` notified cases) |
| **Patient Acknowledgement Rate** | Proportion of notified patients who verified receipt and comprehension. | Acknowledged Cases / Notified Cases |
| **Referral Acceptance Rate** | Proportion of transmitted referrals accepted by receiving provider. | Accepted Referrals / Transmitted Referrals |
| **Referral Completion Rate** | Proportion of accepted referrals with consultation notes returned. | Completed Referrals / Accepted Referrals |
| **Appointment Attendance Rate** | Proportion of scheduled appointments attended without no-show. | Attended Appointments / Scheduled Appointments |
| **Evidence-Verified Closure Rate** | Proportion of closed cases satisfying 100% of pathway evidence criteria. | Verified Closed Cases / Total Closed Cases |
| **Unresolved Active Cases** | Total open cases currently requiring care coordination. | Count(Stage ≠ Closed) |
| **Overdue Tasks & Escalations** | Outstanding SLA breaches and active supervisor escalations. | Overdue Tasks + Active Escalations |
| **Handoff Drop-offs & Missed** | Combined count of patient appointment no-shows and provider referral rejections. | Missed Appts + Rejected Referrals |

### Multi-Dimensional Filters
The dashboard updates all cards, charts, funnels, and tables synchronously when filtered by:
- **Time Horizon**: All Time, Last 7 Days, Last 30 Days, Last 90 Days, Custom Date Range.
- **Screening Protocol**: Breast (BI-RADS), Colorectal (FIT), Lung (Lung-RADS), Cervical/HPV, Diabetic Retinopathy, Prostate (PSA), Thyroid (TI-RADS), Skin Biopsy.
- **Organization / Facility**: Multi-clinic filtering across primary and specialist centers.
- **Case Owner / Coordinator**: Individual clinician or coordinator workloads.
- **Clinical Urgency Tier**: Critical (72h), High (14d), Moderate (30d), Routine (60d).
- **Referral Specialist Provider**: Specific receiving clinics.
- **Workflow Cohort**: Open Only, Closed Only, Overdue Only, Active Escalations Only.

### Operational Value: "Where Care Gets Stuck"
Scans the dataset in real time to isolate the top operational bottlenecks:
- Unacknowledged Patient Communications (>48h)
- Specialist Referral Rejection without Alternative Routing
- Diagnostic Procedure No-Shows (Transportation/Financial Barriers)
- Missing Permanent Section Histopathology Reports Post-Procedure
- Pending Clinician Initial Review & Urgency Sign-off
*Includes direct one-click intervention links to open the affected cases immediately.*

### Export Filtered Synthetic Data (CSV)
Allows compliance officers and coordinators to export the active filtered cohort as a CSV file with clear synthetic data disclaimers in the header.

---

## 4. Judge Demonstration Mode ("Run Demo Scenario")

A dedicated interactive stepper guiding evaluators through the complete end-to-end closed-loop lifecycle using synthetic case `CASE-JUDGE-001` (Patient Ananya Sharma, age 48, BI-RADS 4B suspicious calcifications).

### The 10-Step Reproducible Lifecycle
- **Step A: Result Intake**: Suspicious mammogram ingested from Bay Imaging. Case opens in Stage 1 (`RESULT_RECEIVED`).
- **Step B: Clinician Review**: Dr. Sarah Chen, MD reviews raw images, signs review, assigns HIGH urgency (14d SLA), and orders diagnostic ultrasound & core needle biopsy. Stage advances to `CLINICIAN_REVIEW_COMPLETED`.
- **Step C: Patient Notification**: Coordinator Maria Ramos dispatches clinician-approved bilingual notification (English/Hindi) via simulated SMS. Stage advances to `PATIENT_NOTIFIED`.
- **Step D: Patient Acknowledgement**: Patient acknowledges receipt in portal and completes comprehension check ("Understands need for biopsy; requests scheduling assistance"). Stage advances to `REFERRAL_PENDING`.
- **Step E: Specialist Rejection Safeguard**: Referral `REF-JUDGE-01` submitted to Metro Diagnostic Breast Center is rejected ("Biopsy backlog > 45 days"). **Safeguard enforced**: Case remains open in queue under exception `REFERRAL_REJECTED`.
- **Step F: Retention of Ownership & Recovery**: Autonomous recovery task created for Dr. Sarah Chen. CareLoop retains accountability; re-routing begins.
- **Step G: Secondary Referral & Attendance**: Replacement referral `REF-JUDGE-02` sent to Valley Health Imaging, accepted immediately, and biopsy appointment is attended. Stage advances to `AWAITING_OUTCOME_DOCUMENTATION`.
- **Step H: Outcome & Pathology Documented**: Definitive surgical pathology report `DOC-PATH-JUDGE-991` received ("Benign fibroadenoma, clear margins, routine 12-month recall"). Stage advances to `READY_FOR_CLOSURE`.
- **Step I: Authorized Verified Closure**: Clinical Supervisor Dr. Eleanor Vance audits the 8-point evidence checklist and executes verified closure. Stage advances to `CLOSED_WITH_EVIDENCE`.
- **Step J: Complete Platform Reflection**: Live Overview Dashboard, Analytics KPIs, and Audit Trail update synchronously with zero delay.

### Parallel Overdue Case Demonstration
Evaluators can switch tabs to inspect `CASE-JUDGE-ESC` (Marcus Thornton, Positive FIT unacknowledged for >21 days, Tier 2 Escalation active). Demonstrates that CareLoop **never auto-closes overdue cases** on elapsed time.

---

## 5. Integrations: Real vs. Simulated

| Feature / Integration | Implementation Type | Details |
| :--- | :--- | :--- |
| **Server-Side AI Assistance** | **REAL Integration** | Connects to `@google/genai` (`gemini-3.8-flash`) via Express proxy (`/api/ai/simplify`, `/api/ai/translate`, `/api/ai/summarize-history`, `/api/ai/draft-outreach`). |
| **Role-Based Access Control** | **REAL Enforced Rules** | Enforces 6 role profiles (Care Coordinator, Primary Care Clinician, Specialist Provider, Lab Liaison, Supervisor, Patient). |
| **Closed-Loop Engine & Checklists**| **REAL State Machine** | 13 explicit stages, 8-point evidence validator, blocked closure gates, and exception states. |
| **Dynamic Analytics & KPI Formulas**| **REAL Calculations** | All medians, counts, and percentages calculated dynamically from active records in memory. |
| **Patient Communications (SMS/WhatsApp)**| **SIMULATED** | Demonstrates delivery states, timelines, and comprehension checks with clear simulation badges; no real SMS carrier dispatch. |
| **Provider Directory & Organizations**| **SYNTHETIC** | All clinics, specialists, NPIs, and addresses are fictional demonstration entities. |
| **Patient Records & Findings** | **SYNTHETIC** | All MRNs, lab findings, and clinical reports are entirely synthetic demonstration data. |

---

## 6. How to Run & Verify

1. **Launch the Judge Demonstration Console**:
   - Click the amber **"Run Demo Scenario"** button in the top navigation bar or sidebar.
   - Click **"Auto-Run All 10 Steps"** or step through manually from **Step A** to **Step J**.
   - Notice the live state inspector updating the stage, exception status, and evidence checklist at each step.
2. **Verify Dynamic Analytics Update**:
   - Navigate to **Loop Analytics** (`currentTab: analytics`).
   - Notice that closed cases count, evidence closure rate, and funnel percentages reflect the completed demonstration case.
   - Apply filters (e.g., filter by *Breast (BI-RADS)* or *MetroHealth Women's Health Center*) and confirm all cards update.
3. **Verify Blocked Closure Gate**:
   - Open case `CASE-2026-004` (Amara Okafor, HSIL Cervical Finding).
   - In Tab 3 (Closure Assurance), click **"Verify & Close Case"**.
   - The **Blocked Closure Modal** appears, showing missing clinical items (colposcopy biopsy report, specialist attendance).
4. **Test Role Permissions**:
   - Use the Role Switcher in the top header to switch to **Elena Vazquez (Patient)** to experience the patient portal, or **Dr. Eleanor Vance (Supervisor)** to review escalations and SLA risks.
5. **Reset Scenario Anytime**:
   - Click **"Reset Demo Scenario"** in the demo modal or **"Reset Demo"** in the top header to restore default demo state.
