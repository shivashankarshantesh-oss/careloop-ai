import { EscalationRule, PathwayClosureRequirement } from '../types/careloop';

export const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  {
    id: 'RULE-001',
    name: 'Clinician-Designated Urgent Findings Awaiting Review',
    triggerType: 'CLINICIAN_URGENT_AWAITING_REVIEW',
    description: 'Any screening finding marked CRITICAL_72H by an intake clinician requiring immediate qualified specialist or supervisory sign-off.',
    severity: 'TIER_1_CRITICAL',
    defaultReviewerRole: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
    slaHours: 12,
    isEnabled: true,
  },
  {
    id: 'RULE-002',
    name: 'Overdue Clinician Review Sign-off',
    triggerType: 'OVERDUE_CLINICIAN_REVIEW',
    description: 'Received screening result remains unreviewed by a licensed clinician past protocol SLA (e.g. >24h for High Urgency).',
    severity: 'TIER_1_CRITICAL',
    defaultReviewerRole: 'Dr. Sarah Chen, MD (Primary Care)',
    slaHours: 24,
    isEnabled: true,
  },
  {
    id: 'RULE-003',
    name: 'Unacknowledged High-Risk Patient Outreach',
    triggerType: 'UNACKNOWLEDGED_COMMUNICATION',
    description: 'Dispatched patient outreach for positive screening remains unacknowledged >72 hours without receipt confirmation.',
    severity: 'TIER_2_URGENT',
    defaultReviewerRole: 'Maria Ramos, RN (Care Coordinator)',
    slaHours: 48,
    isEnabled: true,
  },
  {
    id: 'RULE-004',
    name: 'Unassigned or Ownerless Screening Case',
    triggerType: 'UNASSIGNED_OWNERLESS_CASE',
    description: 'Active case has no designated primary coordinator or clinical owner, risking dropped care transitions.',
    severity: 'TIER_2_URGENT',
    defaultReviewerRole: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
    slaHours: 24,
    isEnabled: true,
  },
  {
    id: 'RULE-005',
    name: 'Rejected Referral Without Active Recovery Plan',
    triggerType: 'REJECTED_REFERRAL_NO_RECOVERY',
    description: 'Specialist facility rejected referral and no reassessment task or secondary referral has been initiated within 24h.',
    severity: 'TIER_1_CRITICAL',
    defaultReviewerRole: 'Dr. Sarah Chen, MD (Primary Care)',
    slaHours: 24,
    isEnabled: true,
  },
  {
    id: 'RULE-006',
    name: 'Missed Diagnostic Appointment / No Reschedule',
    triggerType: 'MISSED_APPOINTMENT',
    description: 'Patient failed to appear for diagnostic procedure (colonoscopy, biopsy, colposcopy) without active re-engagement.',
    severity: 'TIER_2_URGENT',
    defaultReviewerRole: 'Maria Ramos, RN (Care Coordinator)',
    slaHours: 48,
    isEnabled: true,
  },
  {
    id: 'RULE-007',
    name: 'Missing Consultation / Operative Outcome Documentation',
    triggerType: 'MISSING_CONSULTATION_OUTCOME',
    description: 'Specialist consultation or procedure was completed >7 days ago, but formal operative/pathology report has not been filed.',
    severity: 'TIER_3_WARNING',
    defaultReviewerRole: 'Maria Ramos, RN (Care Coordinator)',
    slaHours: 72,
    isEnabled: true,
  },
  {
    id: 'RULE-008',
    name: 'Repeated Failed Patient Contact (>= 3 Attempts)',
    triggerType: 'REPEATED_FAILED_CONTACT',
    description: 'Three or more multi-channel outreach attempts (SMS, phone, portal) failed to reach patient. Certified mail protocol required.',
    severity: 'TIER_1_CRITICAL',
    defaultReviewerRole: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
    slaHours: 24,
    isEnabled: true,
  },
  {
    id: 'RULE-009',
    name: 'Case Approaching Configured SLA Service Deadline',
    triggerType: 'APPROACHING_SLA_DEADLINE',
    description: 'Active case has fewer than 48 hours remaining until overall protocol due date without documented care loop closure.',
    severity: 'TIER_3_WARNING',
    defaultReviewerRole: 'Maria Ramos, RN (Care Coordinator)',
    slaHours: 48,
    isEnabled: true,
  }
];

export const PATHWAY_CLOSURE_REQUIREMENTS: Record<string, PathwayClosureRequirement> = {
  MAMMOGRAPHY_BIRADS: {
    pathway: 'MAMMOGRAPHY_BIRADS',
    pathwayName: 'Breast Cancer Diagnostic Pathway (BI-RADS 4/5)',
    requiredItems: [
      { key: 'clinicianReviewCompleted', label: '1. Clinician Urgency Review Documented', description: 'Qualified clinician must confirm BIRADS categorization and urgency.', isRequired: true },
      { key: 'patientNotified', label: '2. Required Patient Communication Recorded', description: 'Patient notified in preferred language with plain language summary.', isRequired: true },
      { key: 'patientAcknowledged', label: '3. Patient Acknowledgement / Approved Exception', description: 'Patient receipt acknowledged or certified mail tracking attached.', isRequired: true },
      { key: 'diagnosticConfirmationCompleted', label: '4. Diagnostic Imaging / Biopsy Performed', description: 'Diagnostic spot-compression mammogram or core-needle biopsy attended.', isRequired: true },
      { key: 'referralAccepted', label: '5. Breast Center Referral & Acceptance', description: 'Electronic handoff to breast surgical oncology / imaging accepted.', isRequired: true },
      { key: 'outcomeDocumented', label: '6. Pathology & Concordance Outcome Documented', description: 'Core needle biopsy histopathology with radio-pathologic concordance.', isRequired: true },
      { key: 'carePlanDocumented', label: '7. Documented Follow-up & Surveillance Plan', description: 'Defined multidisciplinary tumor board plan or 6-month recall interval.', isRequired: true },
      { key: 'blockersResolved', label: '8. Unresolved Blockers Addressed & Authorized Closure', description: 'No active safety blockers; final human closure endorsement signed.', isRequired: true }
    ]
  },
  COLORECTAL_FIT: {
    pathway: 'COLORECTAL_FIT',
    pathwayName: 'Colorectal Diagnostic Pathway (Positive FIT)',
    requiredItems: [
      { key: 'clinicianReviewCompleted', label: '1. Clinician Urgency Review Documented', description: 'PCP or Gastroenterologist reviewed quantitative fecal hemoglobin level.', isRequired: true },
      { key: 'patientNotified', label: '2. Required Patient Communication Recorded', description: 'Bilingual notification of positive screening result sent to patient.', isRequired: true },
      { key: 'patientAcknowledged', label: '3. Patient Acknowledgement Documented', description: 'Patient acknowledges receipt and prep instructions explained.', isRequired: true },
      { key: 'diagnosticConfirmationCompleted', label: '4. Complete Colonoscopy Attended', description: 'Diagnostic colonoscopy performed with photo documentation of cecal landmarks.', isRequired: true },
      { key: 'referralAccepted', label: '5. GI Endoscopy Referral Acceptance', description: 'Endoscopy suite confirmed intake and pre-procedure clearance.', isRequired: true },
      { key: 'outcomeDocumented', label: '6. Operative Note & Polyp Histopathology', description: 'Complete operative note with polyp resection margins and dysplasia grading.', isRequired: true },
      { key: 'carePlanDocumented', label: '7. Multi-Society Post-Polypectomy Recall Plan', description: 'Standardized 3, 5, or 10-year post-polypectomy surveillance interval.', isRequired: true },
      { key: 'blockersResolved', label: '8. Blockers Cleared & Authorized Closure Sign-off', description: 'All prep and transport barriers resolved; authorized clinician sign-off.', isRequired: true }
    ]
  },
  CERVICAL_HPV: {
    pathway: 'CERVICAL_HPV',
    pathwayName: 'Cervical Cancer Pathway (HSIL / HPV 16/18)',
    requiredItems: [
      { key: 'clinicianReviewCompleted', label: '1. Clinician Urgency Review Documented', description: 'ASCCP-aligned urgency confirmation by clinician.', isRequired: true },
      { key: 'patientNotified', label: '2. Required Patient Communication Recorded', description: 'Empathetic culturally appropriate notification dispatched.', isRequired: true },
      { key: 'patientAcknowledged', label: '3. Patient Acknowledgement Documented', description: 'Patient confirmed receipt and appointment attendance feasibility.', isRequired: true },
      { key: 'diagnosticConfirmationCompleted', label: '4. Colposcopic Examination Completed', description: 'Colposcopy with directed biopsies / ECC performed.', isRequired: true },
      { key: 'referralAccepted', label: '5. Gynecology Specialty Referral Acceptance', description: 'Receiving clinic acceptance confirmed.', isRequired: true },
      { key: 'outcomeDocumented', label: '6. Cervical Biopsy Pathology Documented', description: 'CIN grade 1/2/3 or benign histologic diagnosis verified.', isRequired: true },
      { key: 'carePlanDocumented', label: '7. ASCCP Surveillance / Treatment Plan', description: 'LEEP excision referral or repeat co-testing at 12 months specified.', isRequired: true },
      { key: 'blockersResolved', label: '8. Authorized Human Closure Sign-off', description: 'Authorized clinical supervisor or PCP final closure endorsement.', isRequired: true }
    ]
  },
  DEFAULT: {
    pathway: 'MAMMOGRAPHY_BIRADS',
    pathwayName: 'Standard Diagnostic Pathway',
    requiredItems: [
      { key: 'clinicianReviewCompleted', label: '1. Clinician Review Documented', description: 'Qualified clinician urgency sign-off and recommendation recorded.', isRequired: true },
      { key: 'patientNotified', label: '2. Required Patient Communication Recorded', description: 'Notification sent in preferred language via consented channel.', isRequired: true },
      { key: 'patientAcknowledged', label: '3. Patient Acknowledgement Documented', description: 'Patient confirmed receipt or approved outreach exception logged.', isRequired: true },
      { key: 'diagnosticConfirmationCompleted', label: '4. Required Confirmation / Testing Completed', description: 'Confirmatory encounter, imaging, or laboratory evaluation attended.', isRequired: true },
      { key: 'referralAccepted', label: '5. Referral Acceptance & Coordination Recorded', description: 'Receiving provider handoff confirmed with explicit responsibilities.', isRequired: true },
      { key: 'outcomeDocumented', label: '6. Verifiable Outcome Documented', description: 'Pathology report, operative note, or specialist consultation filed.', isRequired: true },
      { key: 'carePlanDocumented', label: '7. Documented Follow-up Care Plan', description: 'Surveillance interval, therapy, or discharge instructions logged.', isRequired: true },
      { key: 'blockersResolved', label: '8. Authorized Human Closure Approval', description: 'Final human sign-off by licensed clinician or clinical supervisor.', isRequired: true }
    ]
  }
};
