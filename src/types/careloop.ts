export type Role = 
  | 'Maria Ramos, RN (Care Coordinator)'
  | 'Dr. Sarah Chen, MD (Primary Care)'
  | 'Dr. Kevin Patel, MD (Specialist / GI)'
  | 'Bay Imaging & Quest Diagnostics Liaison'
  | 'Elena Vazquez (Patient)'
  | 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)'
  | string;

export type ScreeningType = 
  | 'MAMMOGRAPHY_BIRADS'
  | 'COLORECTAL_FIT'
  | 'LUNG_LDCT'
  | 'CERVICAL_HPV'
  | 'DIABETIC_RETINOPATHY'
  | 'PROSTATE_PSA'
  | 'THYROID_ULTRASOUND'
  | 'SKIN_BIOPSY';

// The 13 explicit workflow stages
export type WorkflowStage = 
  | 'RESULT_RECEIVED'
  | 'AWAITING_CLINICIAN_REVIEW'
  | 'CLINICIAN_REVIEW_COMPLETED'
  | 'PATIENT_NOTIFICATION_PENDING'
  | 'PATIENT_NOTIFIED'
  | 'AWAITING_ACKNOWLEDGEMENT'
  | 'CONFIRMATION_OR_CONSULTATION_PENDING'
  | 'REFERRAL_PENDING'
  | 'REFERRAL_ACCEPTED'
  | 'APPOINTMENT_OR_CARE_PENDING'
  | 'AWAITING_OUTCOME_DOCUMENTATION'
  | 'READY_FOR_CLOSURE'
  | 'CLOSED_WITH_EVIDENCE';

// Exceptional statuses kept separate from workflow stage
export type ExceptionStatus = 
  | 'NONE'
  | 'ON_HOLD'
  | 'UNABLE_TO_CONTACT'
  | 'REFERRAL_REJECTED'
  | 'APPOINTMENT_MISSED'
  | 'REOPENED';

export type ClinicalUrgency = 
  | 'CRITICAL_72H'
  | 'HIGH_14D'
  | 'MODERATE_30D'
  | 'ROUTINE_60D';

export type ContactPreference = 'sms' | 'email' | 'portal' | 'secure_mail' | 'phone_call';

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Female' | 'Male' | 'Non-binary' | 'Other';
  preferredLanguage: string;
  phone: string;
  email: string;
  address: string;
  safeContactPreference: ContactPreference;
  primaryClinician: string;
  caregiverContact?: string;
}

export interface ClosureEvidence {
  type: 'PATHOLOGY_CONFIRMATION' | 'PROCEDURE_REPORT' | 'SURVEILLANCE_PLAN' | 'SPECIALIST_LETTER';
  documentId: string;
  documentTitle: string;
  completedAt: string;
  verifiedBy: string;
  clinicalNotes: string;
  resectedOrNormalFinding: string;
  nextRecommendedSurveillance: string;
}

export interface ClinicalNote {
  id: string;
  caseId: string;
  author: string;
  role: string;
  timestamp: string;
  content: string;
  category: 'CLINICAL' | 'ADMINISTRATIVE' | 'COMMUNICATION' | 'BARRIER';
}

export interface AppointmentDetail {
  id?: string;
  scheduledDate?: string;
  facility?: string;
  provider?: string;
  procedure?: string;
  status: 'NONE' | 'SCHEDULED' | 'CONFIRMED' | 'ATTENDED' | 'MISSED' | 'CANCELLED';
  notes?: string;
  outcomeRecordedAt?: string;
  attendanceVerifiedAt?: string;
}

export interface EvidenceChecklist {
  clinicianReviewCompleted: boolean;
  clinicianReviewSignedBy?: string;
  clinicianReviewDate?: string;
  patientNotified?: boolean;
  patientNotifiedDate?: string;
  patientAcknowledged: boolean;
  patientAcknowledgedDate?: string;
  diagnosticConfirmationCompleted?: boolean;
  diagnosticConfirmationDate?: string;
  referralAccepted: boolean;
  referralStatus?: string;
  appointmentAttended: boolean;
  appointmentDate?: string;
  carePlanDocumented?: boolean;
  carePlanNotes?: string;
  blockersResolved?: boolean;
  outcomeDocumented: boolean;
  outcomeDocumentRef?: string;
  finalSignoffCompleted: boolean;
  finalSignoffBy?: string;
  finalSignoffDate?: string;
  clinicalExceptionDocumented?: boolean;
  clinicalExceptionRationale?: string;
  clinicalExceptionApprovedBy?: string;
}

export interface ScreeningCase {
  id: string;
  patientId: string;
  mrn: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  screeningType: ScreeningType;
  testName: string;
  orderingPhysician: string;
  performingFacility: string;
  receivedDate: string; // ISO date string
  findingsSummary: string;
  rawReportSnippet: string;
  clinicalUrgency: ClinicalUrgency;
  urgencyApprovedBy: string;
  urgencyApprovedAt: string;
  stage: WorkflowStage;
  exceptionStatus: ExceptionStatus;
  exceptionReason?: string;
  exceptionTimestamp?: string;
  nextAction: string;
  dueDate: string; // ISO date string
  responsibleOwner: string;
  assignedOrganization: string;
  isOverdue: boolean;
  closureStatus: 'OPEN' | 'CLOSED_EVIDENCE_ATTACHED' | 'CLOSED_CLINICAL_EXCEPTION';
  closureEvidence?: ClosureEvidence;
  evidenceChecklist: EvidenceChecklist;
  appointmentDetail?: AppointmentDetail;
  notes?: ClinicalNote[];
  blockers?: string[];
  initialReviewTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  priorityScore: number; // 1-100 for queue sorting
}

export type CommunicationChannel = 'SMS' | 'WHATSAPP' | 'PORTAL' | 'SECURE_EMAIL' | 'CERTIFIED_MAIL' | 'PHONE_OUTREACH';

export type TranslationStatus = 'NOT_APPLICABLE' | 'DRAFT_NEEDS_HUMAN_REVIEW' | 'VERIFIED_HUMAN_APPROVED';

export interface ComprehensionCheckResponse {
  understood: 'YES' | 'SOMEWHAT' | 'NO';
  needsHelp: 'NO' | 'SCHEDULING' | 'TRANSPORT' | 'FINANCIAL' | 'LANGUAGE';
  callbackRequested: boolean;
  submittedAt: string;
  patientNotes?: string;
}

export interface Communication {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  channel: CommunicationChannel;
  recipientContact: string;
  messageTitle: string;
  messageContent: string;
  language: string;
  sentAt: string;
  sentBy: string;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'READ';
  acknowledgementStatus: 'PENDING' | 'ACKNOWLEDGED' | 'EXPIRED' | 'DECLINED';
  acknowledgedAt?: string;
  acknowledgedMethod?: string;
  consentPreferenceStatus: 'CONSENTED_PRIMARY' | 'BACKUP_OVERRIDE';
  
  // Patient Communication Center Extensions
  templateCategory?: string;
  translationStatus?: TranslationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  isSimulatedDelivery: boolean;
  deliveryTimeline?: {
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
    failureReason?: string;
  };
  acknowledgementDeadline?: string;
  unacknowledgedAttemptCount?: number;
  comprehensionResponse?: ComprehensionCheckResponse;
  clinicianApprovedGuidance: boolean;
  approvedByClinician?: string;
  approvedAt?: string;
}

export type ReferralStatus = 
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'SUBMITTED'
  | 'AWAITING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'INFORMATION_REQUESTED'
  | 'APPOINTMENT_PENDING'
  | 'APPOINTMENT_SCHEDULED'
  | 'CONSULTATION_COMPLETED'
  | 'OUTCOME_PENDING'
  | 'COMPLETED'
  // Legacy aliases
  | 'DRAFTED'
  | 'TRANSMITTED';

export interface SupportingInfoItem {
  id: string;
  label: string;
  isRequired: boolean;
  isAttached: boolean;
  documentRef?: string;
  attachedAt?: string;
  attachedBy?: string;
}

export interface ReferralMilestone {
  id: string;
  status: ReferralStatus;
  timestamp: string;
  actor: string;
  actorRole: string;
  note: string;
  details?: Record<string, any>;
}

export interface ProviderDirectoryEntry {
  id: string;
  name: string;
  facility: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  operatingHours: string;
  supportedReferralTypes: ScreeningType[];
  acceptingReferrals: boolean;
  syntheticNotice: string;
  turnaroundDays: number;
}

export interface Referral {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  referringProvider: string;
  referringOrg?: string;
  receivingProvider: string;
  receivingFacility: string;
  specialty: string;
  reason: string;
  purpose?: string;
  priority: 'URGENT' | 'HIGH' | 'ROUTINE';
  status: ReferralStatus;
  rejectionReason?: string;
  transmittedAt: string;
  expectedResponseDeadline?: string;
  responseDeadline?: string;
  assignedCoordinator?: string;
  responsibleOwner?: string;
  nextAction?: string;
  dueDate?: string;
  appointmentDate?: string;
  procedureType?: string;
  consultationNotes?: string;
  outcomeDocumentRef?: string;
  loopClosureEvidenceReceived: boolean;
  supportingInfoChecklist?: SupportingInfoItem[];
  handoffTimeline?: ReferralMilestone[];
  duplicateOverrideJustification?: string;
}

export interface Task {
  id: string;
  caseId: string;
  patientName: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completionEvidence?: string;
  completedAt?: string;
}

export type EscalationTriggerType = 
  | 'CLINICIAN_URGENT_AWAITING_REVIEW'
  | 'OVERDUE_CLINICIAN_REVIEW'
  | 'UNACKNOWLEDGED_COMMUNICATION'
  | 'UNASSIGNED_OWNERLESS_CASE'
  | 'REJECTED_REFERRAL_NO_RECOVERY'
  | 'MISSED_APPOINTMENT'
  | 'MISSING_CONSULTATION_OUTCOME'
  | 'REPEATED_FAILED_CONTACT'
  | 'APPROACHING_SLA_DEADLINE'
  | 'MANUAL_OVERRIDE';

export interface EscalationRule {
  id: string;
  name: string;
  triggerType: EscalationTriggerType;
  description: string;
  severity: 'TIER_1_CRITICAL' | 'TIER_2_URGENT' | 'TIER_3_WARNING';
  defaultReviewerRole: string;
  slaHours: number;
  isEnabled: boolean;
}

export interface Escalation {
  id: string;
  caseId: string;
  patientName: string;
  screeningType: ScreeningType;
  reason: string;
  severity: 'TIER_1_CRITICAL' | 'TIER_2_URGENT' | 'TIER_3_WARNING';
  assignedQualifiedReviewer: string;
  triggeredAt: string;
  status: 'ACTIVE' | 'REVIEWED' | 'RESOLVED';
  resolutionSummary?: string;
  resolutionRationale?: string;
  resolvedAt?: string;
  slaHoursRemaining: number;
  triggerType?: EscalationTriggerType;
  triggeringRule?: string;
  affectedCaseId?: string;
  currentOwner?: string;
  requiredNextAction?: string;
  deadline?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface PathwayClosureRequirement {
  pathway: ScreeningType;
  pathwayName: string;
  requiredItems: {
    key: string;
    label: string;
    description: string;
    isRequired: boolean;
  }[];
}

export interface AuditEvent {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: 'CASE' | 'COMMUNICATION' | 'REFERRAL' | 'ESCALATION' | 'TASK' | 'PROTOCOL' | 'NOTE';
  entityId: string;
  timestamp: string;
  changeSummary: string;
  ipAddress?: string;
}

export interface ProtocolDefinition {
  type: ScreeningType;
  title: string;
  guidelineSource: string;
  defaultUrgency: ClinicalUrgency;
  clinicianReviewSlaHours: number;
  patientContactSlaDays: number;
  referralCompletedSlaDays: number;
  requiredEvidenceTypes: string[];
}

// Analytics and Operational Intelligence Types
export interface AnalyticsFilters {
  dateRange: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
  customStartDate?: string;
  customEndDate?: string;
  screeningType: 'ALL' | ScreeningType;
  organization: string;
  owner: string;
  urgency: 'ALL' | ClinicalUrgency;
  referralProvider: string;
  workflowStatus: 'ALL' | 'OPEN_ONLY' | 'CLOSED_ONLY' | 'OVERDUE_ONLY' | 'ESCALATED_ONLY';
}

export interface KPIMetricItem {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  numerator?: number;
  denominator?: number;
  numeratorLabel?: string;
  denominatorLabel?: string;
  calculationWindow: string;
  definition: string;
  formula: string;
  isRate: boolean;
  hasInsufficientData: boolean;
  benchmark?: string;
  status: 'good' | 'warning' | 'alert' | 'neutral';
}

export interface CareBottleneck {
  id: string;
  title: string;
  category: string;
  caseCount: number;
  avgDelayHours: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  affectedCaseIds: string[];
}

export interface CohortComparisonMetric {
  metric: string;
  cohortAValue: string | number;
  cohortBValue: string | number;
  deltaText: string;
  interpretation: string;
  unit?: string;
}

export type JudgeDemoStepKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export interface JudgeDemoStepDefinition {
  key: JudgeDemoStepKey;
  stepNumber: number;
  title: string;
  shortLabel: string;
  description: string;
  clinicalInvariant: string;
  actor: string;
  actorRole: string;
  actionButtonLabel: string;
  targetCaseId: string;
}

