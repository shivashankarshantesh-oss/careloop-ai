import { JudgeDemoStepDefinition } from '../types/careloop';

export const JUDGE_DEMO_STEPS: JudgeDemoStepDefinition[] = [
  {
    key: 'A',
    stepNumber: 1,
    title: 'Step A: Suspicious Screening Result Intake & Registry Enrollment',
    shortLabel: 'A. Result Intake',
    description: 'A suspicious screening mammography report (BI-RADS 4B, 1.3 cm irregular mass with grouped microcalcifications) for 48-year-old Ananya Sharma is ingested into the CareLoop registry from Bay Imaging Partners.',
    clinicalInvariant: 'Safeguard 1: Finding intake creates an immutable case record and starts the SLA clock; results cannot be dropped or silently archived without authorized review.',
    actor: 'Bay Imaging Partners Interface',
    actorRole: 'Diagnostic Imaging Provider',
    actionButtonLabel: 'Execute Step A: Ingest Screening Result',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'B',
    stepNumber: 2,
    title: 'Step B: Clinician Review & Urgency Confirmation',
    shortLabel: 'B. Clinician Review',
    description: 'Dr. Sarah Chen, MD reviews the raw tomography findings, signs the clinical review, designates urgency as HIGH (14-day SLA), and approves the diagnostic order: "Diagnostic magnification mammogram and targeted ultrasound-guided core needle biopsy".',
    clinicalInvariant: 'Safeguard 2: Qualified human clinical review is strictly required. AI never infers clinical emergency status, alters urgency, or decides when care can be delayed.',
    actor: 'Dr. Sarah Chen, MD',
    actorRole: 'Primary Care Physician',
    actionButtonLabel: 'Execute Step B: Record Clinician Review',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'C',
    stepNumber: 3,
    title: 'Step C: Simulated Clinician-Approved Patient Notification',
    shortLabel: 'C. Patient Notification',
    description: 'Care coordinator Maria Ramos, RN dispatches a clinician-approved bilingual notification in English and Hindi via simulated SMS. The message provides clear, non-alarming instructions to contact the clinic for diagnostic scheduling.',
    clinicalInvariant: 'Safeguard 3: Patient communications must use only clinician-approved summaries and plain language; delivery is clearly labeled as simulated without false claims of real carrier dispatch.',
    actor: 'Maria Ramos, RN',
    actorRole: 'Care Coordinator',
    actionButtonLabel: 'Execute Step C: Dispatch Patient Notification',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'D',
    stepNumber: 4,
    title: 'Step D: Patient Acknowledgement & Comprehension Check',
    shortLabel: 'D. Patient Ack & Check',
    description: 'Patient Ananya Sharma receives the notification, submits digital acknowledgement, and completes the comprehension check: confirms understanding the need for diagnostic biopsy and requests appointment scheduling assistance.',
    clinicalInvariant: 'Safeguard 4: Patient notification is separate from acknowledgement. True closed-loop requires verifying patient comprehension and addressing care coordination barriers.',
    actor: 'Ananya Sharma',
    actorRole: 'Patient (Digital Portal)',
    actionButtonLabel: 'Execute Step D: Record Patient Acknowledgement',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'E',
    stepNumber: 5,
    title: 'Step E: Referral Submission & Receiving Provider Rejection',
    shortLabel: 'E. Referral Rejection',
    description: 'Coordinator submits structured referral REF-JUDGE-01 to Metro Diagnostic Breast Center. The specialist clinic rejects the referral due to severe backlog ("Biopsy capacity exceeded; waitlist > 45 days").',
    clinicalInvariant: 'Safeguard 5: Submission is not acceptance. A rejected referral MUST NOT disappear from the active queue or auto-close; CareLoop retains case ownership.',
    actor: 'Metro Diagnostic Breast Center',
    actorRole: 'Receiving Specialist Clinic',
    actionButtonLabel: 'Execute Step E: Simulate Specialist Rejection',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'F',
    stepNumber: 6,
    title: 'Step F: Retention of Ownership & Clinician Recovery Task',
    shortLabel: 'F. Recovery Reassignment',
    description: 'CareLoop tags the case with exception status REFERRAL_REJECTED, retains active queue ownership, and automatically assigns an urgent recovery task to Dr. Sarah Chen and Maria Ramos to re-route care within 48 hours.',
    clinicalInvariant: 'Safeguard 6: Closed-loop resilience requires explicit recovery workflows. The referring clinician retains accountability until an accepting provider is verified.',
    actor: 'CareLoop Safety Engine',
    actorRole: 'Autonomous Closed-Loop Guardrail',
    actionButtonLabel: 'Execute Step F: Enforce Recovery Workflow',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'G',
    stepNumber: 7,
    title: 'Step G: Secondary Referral Accepted & Biopsy Attended',
    shortLabel: 'G. Second Referral & Appt',
    description: 'Coordinator creates replacement referral REF-JUDGE-02 to Valley Health Diagnostic Imaging. Valley Health accepts immediately. Biopsy appointment is scheduled for Nov 2, 2026, and attendance is verified.',
    clinicalInvariant: 'Safeguard 7: Acceptance is not attendance, and attendance is not closure. The case advances to awaiting outcome documentation, not premature closure.',
    actor: 'Valley Health Diagnostic Imaging',
    actorRole: 'Secondary Receiving Specialist',
    actionButtonLabel: 'Execute Step G: Accept & Complete Appointment',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'H',
    stepNumber: 8,
    title: 'Step H: Consultation Outcome & Permanent Pathology Documented',
    shortLabel: 'H. Document Outcome',
    description: 'Diagnostic biopsy histopathology is uploaded to the case: "Ultrasound-guided core biopsy: Benign fibroadenoma; no atypia or in situ carcinoma. Recommended routine 12-month annual screening mammography". Stage advances to READY_FOR_CLOSURE.',
    clinicalInvariant: 'Safeguard 8: Documented tissue diagnosis and definitive follow-up surveillance interval are required before a case can be considered for closure.',
    actor: 'Dr. Kevin Patel / Bay Pathologists',
    actorRole: 'Consulting Specialist / Pathologist',
    actionButtonLabel: 'Execute Step H: Record Pathology Outcome',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'I',
    stepNumber: 9,
    title: 'Step I: Authorized Clinical Closure Verification',
    shortLabel: 'I. Authorized Closure',
    description: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor) audits the 8-point evidence checklist (review, notification, ack, procedure, outcome, care plan, blocker resolution, and sign-off) and executes verified clinical closure.',
    clinicalInvariant: 'Safeguard 9: Time elapsed never auto-closes a case. Closure requires verified documentation against all pathway criteria with authorized clinician signature.',
    actor: 'Dr. Eleanor Vance, MD',
    actorRole: 'Clinical Supervisor / CMO',
    actionButtonLabel: 'Execute Step I: Execute Verified Closure',
    targetCaseId: 'CASE-JUDGE-001'
  },
  {
    key: 'J',
    stepNumber: 10,
    title: 'Step J: Live Platform Verification & Audit Trail Reflection',
    shortLabel: 'J. Complete Reflection',
    description: 'Platform verification: Overview Dashboard, Real Analytics KPI cards, and Live Audit Log update synchronously. The full 10-step clinical pathway is preserved in the permanent audit trail.',
    clinicalInvariant: 'Safeguard 10: Complete transparency. All quality metrics derive dynamically from shared clinical records; no hardcoded totals or unverified claims.',
    actor: 'CareLoop Analytics Engine',
    actorRole: 'Quality & Audit Intelligence',
    actionButtonLabel: 'Execute Step J: Verify Platform Reflection',
    targetCaseId: 'CASE-JUDGE-001'
  }
];
