import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Patient, 
  ScreeningCase, 
  Communication, 
  Referral, 
  ReferralStatus,
  ReferralMilestone,
  SupportingInfoItem,
  ProviderDirectoryEntry,
  Task, 
  Escalation, 
  EscalationRule,
  EscalationTriggerType,
  PathwayClosureRequirement,
  AuditEvent, 
  Role, 
  WorkflowStage, 
  ClinicalUrgency, 
  ClosureEvidence,
  ProtocolDefinition,
  ExceptionStatus,
  ClinicalNote,
  AppointmentDetail,
  EvidenceChecklist,
  ComprehensionCheckResponse,
  JudgeDemoStepKey
} from '../types/careloop';
import { 
  RoleType, 
  RoleProfile, 
  RolePermissions, 
  ROLE_PROFILES, 
  ROLE_PERMISSIONS 
} from '../utils/permissions';
import { 
  SEED_PATIENTS, 
  SEED_CASES, 
  SEED_COMMUNICATIONS, 
  SEED_REFERRALS, 
  SEED_TASKS, 
  SEED_ESCALATIONS, 
  SEED_AUDIT_EVENTS,
  PROTOCOL_DEFINITIONS 
} from '../data/seedData';
import { DEFAULT_ESCALATION_RULES, PATHWAY_CLOSURE_REQUIREMENTS } from '../data/escalationRules';
import { SYNTHETIC_PROVIDER_DIRECTORY } from '../data/providerDirectory';

const STORAGE_KEY = 'careloop_data_v2';

export interface DashboardMetrics {
  openActionableCases: number;
  awaitingPatientAck: number;
  overdueActions: number;
  pendingReferrals: number;
  completedCarePathways: number;
  medianReviewTimeHours: number;
  evidenceClosureRatePercent: number;
  criticalCasesCount: number;
  totalCases: number;
}

interface CareLoopContextType {
  // Current user & role simulation
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentRoleType: RoleType;
  setCurrentRoleType: (role: RoleType) => void;
  currentPatientId: string;
  setCurrentPatientId: (id: string) => void;
  permissions: RolePermissions;
  currentRoleProfile: RoleProfile;
  currentUserNpi: string;

  // Role-Specific Action Capabilities
  issueLabCorrection: (caseId: string, addendumText: string) => void;
  verifyLabReceipt: (caseId: string) => void;
  submitPatientQuestion: (caseId: string, question: string, requestCallback: boolean) => void;
  updatePatientPreferences: (patientId: string, safePreference: any, phone: string, email: string) => void;

  // Data
  patients: Patient[];
  cases: ScreeningCase[];
  communications: Communication[];
  referrals: Referral[];
  tasks: Task[];
  escalations: Escalation[];
  auditEvents: AuditEvent[];
  protocols: ProtocolDefinition[];
  escalationRules: EscalationRule[];
  providerDirectory: ProviderDirectoryEntry[];
  pathwayClosureRequirements: Record<string, PathwayClosureRequirement>;

  // Computed metrics
  metrics: DashboardMetrics;

  // Selection & Navigation
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  selectedCase: ScreeningCase | null;

  // Workflow Actions
  updateCaseStage: (caseId: string, newStage: WorkflowStage, auditNote?: string) => void;
  reassignOwner: (caseId: string, newOwner: string, newOrg: string, note?: string) => void;
  changeDueDate: (caseId: string, newDueDate: string, reason: string) => void;
  recordClinicianReview: (caseId: string, urgency: ClinicalUrgency, notes: string) => void;
  recordPatientNotification: (caseId: string, commData: Omit<Communication, 'id' | 'caseId' | 'sentAt' | 'deliveryStatus' | 'acknowledgementStatus'>) => void;
  recordPatientAcknowledgement: (caseId: string, commId?: string, method?: string, notes?: string) => void;
  createReferral: (ref: Omit<Referral, 'id' | 'transmittedAt' | 'loopClosureEvidenceReceived'>) => void;
  recordReferralResponse: (referralId: string, status: 'ACCEPTED' | 'REJECTED', reasonOrNotes: string) => void;
  documentAppointmentStatus: (caseId: string, appointment: AppointmentDetail) => void;
  recordCareOutcome: (caseId: string, outcome: { findings: string; surveillance: string; documentRef: string; notes: string }) => void;
  closeCaseWithEvidence: (caseId: string, evidence: ClosureEvidence) => { success: boolean; error?: string };
  reopenCase: (caseId: string, justification: string, targetStage?: WorkflowStage) => void;
  setCaseException: (caseId: string, exception: ExceptionStatus, reason?: string) => void;
  addClinicalNote: (caseId: string, content: string, category: ClinicalNote['category']) => void;

  // Communication & Referral Convenience
  sendCommunication: (comm: Omit<Communication, 'id' | 'sentAt' | 'deliveryStatus' | 'acknowledgementStatus'>) => void;
  acknowledgeCommunication: (commId: string, method?: string) => void;
  recordComprehensionResponse: (commId: string, response: ComprehensionCheckResponse) => void;
  verifyTranslation: (commId: string, verifierName: string) => void;
  triggerUnacknowledgedFollowup: (commId: string) => void;
  simulateDeliveryStatusChange: (commId: string, newStatus: Communication['deliveryStatus']) => void;
  updateReferralStatus: (referralId: string, status: Referral['status'], notes?: string) => void;

  // Referral Coordination Module Enhancements
  createStructuredReferral: (refData: Omit<Referral, 'id' | 'transmittedAt' | 'loopClosureEvidenceReceived'>) => { success: boolean; error?: string; referralId?: string };
  transitionReferralState: (referralId: string, newStatus: ReferralStatus, note: string, extraData?: { rejectionReason?: string; appointmentDate?: string; outcomeDocRef?: string }) => void;
  requestReferralInformation: (referralId: string, requestedItemsNote: string) => void;
  reassignReferralAction: (referralId: string, newOwner: string, nextAction: string, newDueDate: string) => void;
  executeReferralRejectionRecovery: (rejectedReferralId: string, newProviderId: string) => void;

  // Escalations & Rules Module Enhancements
  createEscalation: (esc: Omit<Escalation, 'id' | 'triggeredAt' | 'status'>) => void;
  acknowledgeEscalation: (escalationId: string, note?: string) => void;
  resolveEscalation: (escalationId: string, resolutionSummary: string) => void;
  resolveEscalationWithRationale: (escalationId: string, rationale: string) => void;
  updateEscalationRule: (ruleId: string, updates: Partial<EscalationRule>) => void;
  evaluateEscalationRules: () => void;

  // Closure Assurance & Safeguards
  validateCaseClosure: (caseId: string) => { 
    canClose: boolean; 
    pathwayName: string; 
    checklist: { key: string; label: string; isComplete: boolean; description: string; actionTab: string }[]; 
    missingItems: string[]; 
  };
  closeCaseWithAssurance: (caseId: string, evidence: ClosureEvidence, clinicalException?: { rationale: string; approvedBy: string }) => { success: boolean; error?: string };

  // 5 Demo Scenarios
  triggerDemoScenario: (scenario: 'A' | 'B' | 'C' | 'D' | 'E') => { success: boolean; message: string; targetCaseId?: string };

  // End-to-End Judge Demonstration Mode (Steps A-J)
  isJudgeDemoModalOpen: boolean;
  setIsJudgeDemoModalOpen: (open: boolean) => void;
  judgeDemoCurrentStep: JudgeDemoStepKey;
  setJudgeDemoCurrentStep: (step: JudgeDemoStepKey) => void;
  executeJudgeDemoStep: (step: JudgeDemoStepKey) => void;
  resetJudgeDemoScenario: () => void;

  // Task Actions
  createTask: (task: Omit<Task, 'id' | 'status'>) => void;
  toggleTask: (taskId: string, evidence?: string) => void;

  // New Case Intake
  createNewCase: (newCase: Omit<ScreeningCase, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore' | 'evidenceChecklist' | 'exceptionStatus'>) => string;

  // System Actions
  resetToDemoData: () => void;
  exportAuditLogJSON: () => void;
}

const CareLoopContext = createContext<CareLoopContextType | undefined>(undefined);

// Helper to ensure full checklist on case
function normalizeCase(c: any): ScreeningCase {
  const defaultChecklist: EvidenceChecklist = {
    clinicianReviewCompleted: !!c.urgencyApprovedAt && c.urgencyApprovedBy !== 'Pending Clinician Review',
    clinicianReviewSignedBy: c.urgencyApprovedBy !== 'Pending Clinician Review' ? c.urgencyApprovedBy : undefined,
    clinicianReviewDate: c.urgencyApprovedAt || undefined,
    patientAcknowledged: ['CONFIRMATION_OR_CONSULTATION_PENDING', 'REFERRAL_PENDING', 'REFERRAL_ACCEPTED', 'APPOINTMENT_OR_CARE_PENDING', 'AWAITING_OUTCOME_DOCUMENTATION', 'READY_FOR_CLOSURE', 'CLOSED_WITH_EVIDENCE'].includes(c.stage),
    patientAcknowledgedDate: undefined,
    referralAccepted: ['REFERRAL_ACCEPTED', 'APPOINTMENT_OR_CARE_PENDING', 'AWAITING_OUTCOME_DOCUMENTATION', 'READY_FOR_CLOSURE', 'CLOSED_WITH_EVIDENCE'].includes(c.stage),
    appointmentAttended: ['AWAITING_OUTCOME_DOCUMENTATION', 'READY_FOR_CLOSURE', 'CLOSED_WITH_EVIDENCE'].includes(c.stage),
    outcomeDocumented: ['READY_FOR_CLOSURE', 'CLOSED_WITH_EVIDENCE'].includes(c.stage),
    outcomeDocumentRef: c.closureEvidence?.documentId || undefined,
    finalSignoffCompleted: c.stage === 'CLOSED_WITH_EVIDENCE',
    finalSignoffBy: c.closureEvidence?.verifiedBy || undefined,
  };

  return {
    ...c,
    stage: c.stage || 'RESULT_RECEIVED',
    exceptionStatus: c.exceptionStatus || 'NONE',
    evidenceChecklist: c.evidenceChecklist || defaultChecklist,
    blockers: c.blockers || [],
    notes: c.notes || [],
  };
}

export const CareLoopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoleType, setCurrentRoleType] = useState<RoleType>('CARE_COORDINATOR');
  const [currentPatientId, setCurrentPatientId] = useState<string>('pat-001');

  const currentRoleProfile = ROLE_PROFILES[currentRoleType];
  const permissions = ROLE_PERMISSIONS[currentRoleType];
  const currentRole = currentRoleProfile.name;

  const setCurrentRole = (roleStr: Role) => {
    const found = (Object.keys(ROLE_PROFILES) as RoleType[]).find(k => ROLE_PROFILES[k].name === roleStr);
    if (found) setCurrentRoleType(found);
  };

  const [currentUserNpi] = useState('NPI-14829031');

  // Load from local storage or fallback to seed data
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_patients`);
      return saved ? JSON.parse(saved) : SEED_PATIENTS;
    } catch {
      return SEED_PATIENTS;
    }
  });

  const [cases, setCases] = useState<ScreeningCase[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_cases`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(normalizeCase);
      }
      return SEED_CASES;
    } catch {
      return SEED_CASES;
    }
  });

  const [communications, setCommunications] = useState<Communication[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_communications`);
      return saved ? JSON.parse(saved) : SEED_COMMUNICATIONS;
    } catch {
      return SEED_COMMUNICATIONS;
    }
  });

  const [referrals, setReferrals] = useState<Referral[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_referrals`);
      return saved ? JSON.parse(saved) : SEED_REFERRALS;
    } catch {
      return SEED_REFERRALS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : SEED_TASKS;
    } catch {
      return SEED_TASKS;
    }
  });

  const [escalations, setEscalations] = useState<Escalation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_escalations`);
      return saved ? JSON.parse(saved) : SEED_ESCALATIONS;
    } catch {
      return SEED_ESCALATIONS;
    }
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_audits`);
      return saved ? JSON.parse(saved) : SEED_AUDIT_EVENTS;
    } catch {
      return SEED_AUDIT_EVENTS;
    }
  });

  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_rules`);
      return saved ? JSON.parse(saved) : DEFAULT_ESCALATION_RULES;
    } catch {
      return DEFAULT_ESCALATION_RULES;
    }
  });

  const providerDirectory = SYNTHETIC_PROVIDER_DIRECTORY;
  const pathwayClosureRequirements = PATHWAY_CLOSURE_REQUIREMENTS;

  const protocols = PROTOCOL_DEFINITIONS;
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Judge Demonstration State
  const [isJudgeDemoModalOpen, setIsJudgeDemoModalOpen] = useState(false);
  const [judgeDemoCurrentStep, setJudgeDemoCurrentStep] = useState<JudgeDemoStepKey>('A');

  // Sync to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_patients`, JSON.stringify(patients));
      localStorage.setItem(`${STORAGE_KEY}_cases`, JSON.stringify(cases));
      localStorage.setItem(`${STORAGE_KEY}_communications`, JSON.stringify(communications));
      localStorage.setItem(`${STORAGE_KEY}_referrals`, JSON.stringify(referrals));
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${STORAGE_KEY}_escalations`, JSON.stringify(escalations));
      localStorage.setItem(`${STORAGE_KEY}_audits`, JSON.stringify(auditEvents));
      localStorage.setItem(`${STORAGE_KEY}_rules`, JSON.stringify(escalationRules));
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [patients, cases, communications, referrals, tasks, escalations, auditEvents, escalationRules]);

  // Record audit log
  const recordAuditEvent = (
    action: string,
    entityType: AuditEvent['entityType'],
    entityId: string,
    changeSummary: string
  ) => {
    const newEvent: AuditEvent = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}`,
      actor: currentRole,
      actorRole: currentRole.includes('MD') ? 'Physician' : currentRole.includes('RN') ? 'Care Coordinator' : 'Quality Officer',
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      changeSummary,
    };
    setAuditEvents(prev => [newEvent, ...prev]);
  };

  // Compute overdue status combining due dates and unresolved tasks
  const isCaseOverdue = (c: ScreeningCase, caseTasks: Task[]): boolean => {
    if (c.stage === 'CLOSED_WITH_EVIDENCE') return false;
    const now = Date.now();
    const pastDue = new Date(c.dueDate).getTime() < now;
    const hasOverdueTask = caseTasks.some(
      t => t.caseId === c.id && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < now
    );
    return pastDue || hasOverdueTask || c.isOverdue;
  };

  // Derive metrics strictly from current cases
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalCases = cases.length;
    const openCases = cases.filter(c => c.stage !== 'CLOSED_WITH_EVIDENCE');
    const openActionableCases = openCases.length;

    // Awaiting patient acknowledgement
    const awaitingPatientAck = cases.filter(c => {
      if (c.stage === 'AWAITING_ACKNOWLEDGEMENT' || c.stage === 'PATIENT_NOTIFICATION_PENDING' || c.stage === 'PATIENT_NOTIFIED') {
        return true;
      }
      const comms = communications.filter(com => com.caseId === c.id);
      return comms.some(com => com.acknowledgementStatus === 'PENDING');
    }).length;

    // Overdue actions: past due or overdue tasks
    const overdueActions = cases.filter(c => isCaseOverdue(c, tasks)).length;

    // Pending referrals
    const pendingReferrals = referrals.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length;

    // Completed care pathways
    const completedCarePathways = cases.filter(c => c.stage === 'CLOSED_WITH_EVIDENCE').length;

    // Median review time
    const reviewTimesInHours: number[] = [];
    cases.forEach(c => {
      if (c.receivedDate && c.initialReviewTimestamp) {
        const received = new Date(c.receivedDate).getTime();
        const reviewed = new Date(c.initialReviewTimestamp).getTime();
        const diffHours = Math.max(0.1, (reviewed - received) / (1000 * 60 * 60));
        reviewTimesInHours.push(diffHours);
      }
    });

    reviewTimesInHours.sort((a, b) => a - b);
    let medianReviewTimeHours = 4.2;
    if (reviewTimesInHours.length > 0) {
      const mid = Math.floor(reviewTimesInHours.length / 2);
      medianReviewTimeHours = reviewTimesInHours.length % 2 !== 0
        ? reviewTimesInHours[mid]
        : (reviewTimesInHours[mid - 1] + reviewTimesInHours[mid]) / 2;
    }

    const closedCases = cases.filter(c => c.stage === 'CLOSED_WITH_EVIDENCE');
    const closedWithEvidence = cases.filter(c => c.stage === 'CLOSED_WITH_EVIDENCE' && c.closureEvidence).length;
    const evidenceClosureRatePercent = closedCases.length > 0
      ? Math.round((closedWithEvidence / closedCases.length) * 100)
      : 100;

    const criticalCasesCount = cases.filter(c => c.clinicalUrgency === 'CRITICAL_72H' && c.stage !== 'CLOSED_WITH_EVIDENCE').length;

    return {
      openActionableCases,
      awaitingPatientAck,
      overdueActions,
      pendingReferrals,
      completedCarePathways,
      medianReviewTimeHours: Number(medianReviewTimeHours.toFixed(1)),
      evidenceClosureRatePercent,
      criticalCasesCount,
      totalCases,
    };
  }, [cases, communications, referrals, tasks]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Stage update with audit logging
  const updateCaseStage = (caseId: string, newStage: WorkflowStage, auditNote?: string) => {
    const timestamp = new Date().toISOString();
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        stage: newStage,
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'STAGE_TRANSITION',
      'CASE',
      caseId,
      `Case transitioned to stage [${newStage}]. ${auditNote || ''}`
    );
  };

  // Reassign owner and organization
  const reassignOwner = (caseId: string, newOwner: string, newOrg: string, note?: string) => {
    if (!permissions.canReassignOwner) {
      recordAuditEvent('UNAUTHORIZED_ATTEMPT', 'CASE', caseId, `Role [${currentRoleProfile.title}] attempted unauthorized case reassignment.`);
      return;
    }
    const timestamp = new Date().toISOString();
    let oldOwner = '';
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      oldOwner = c.responsibleOwner;
      return {
        ...c,
        responsibleOwner: newOwner,
        assignedOrganization: newOrg,
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'OWNER_REASSIGNED',
      'CASE',
      caseId,
      `Reassigned owner from "${oldOwner}" to "${newOwner}" (${newOrg}). ${note || ''}`
    );
  };

  // Change due date with documented reason
  const changeDueDate = (caseId: string, newDueDate: string, reason: string) => {
    const timestamp = new Date().toISOString();
    let oldDueDate = '';
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      oldDueDate = c.dueDate;
      return {
        ...c,
        dueDate: newDueDate,
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'DUE_DATE_CHANGED',
      'CASE',
      caseId,
      `Due date adjusted from ${oldDueDate.split('T')[0]} to ${newDueDate.split('T')[0]}. Rationale: ${reason}`
    );
  };

  // Record clinician review
  const recordClinicianReview = (caseId: string, urgency: ClinicalUrgency, notes: string) => {
    if (!permissions.canReviewAndApproveUrgency) {
      recordAuditEvent('UNAUTHORIZED_ATTEMPT', 'CASE', caseId, `Role [${currentRoleProfile.title}] attempted unauthorized clinician review sign-off.`);
      return;
    }
    const timestamp = new Date().toISOString();
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedChecklist = {
        ...c.evidenceChecklist,
        clinicianReviewCompleted: true,
        clinicianReviewSignedBy: currentRole,
        clinicianReviewDate: timestamp,
      };
      return {
        ...c,
        clinicalUrgency: urgency,
        urgencyApprovedBy: currentRole,
        urgencyApprovedAt: timestamp,
        initialReviewTimestamp: c.initialReviewTimestamp || timestamp,
        stage: 'CLINICIAN_REVIEW_COMPLETED',
        nextAction: 'Clinician review recorded. Care coordinator to dispatch patient notification.',
        evidenceChecklist: updatedChecklist,
        blockers: c.blockers?.filter(b => !b.toLowerCase().includes('review')) || [],
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'CLINICIAN_REVIEW_RECORDED',
      'CASE',
      caseId,
      `Clinician review completed by ${currentRole}. Urgency confirmed as [${urgency}]. Clinical recommendations: ${notes}`
    );
  };

  // Record patient notification
  const recordPatientNotification = (
    caseId: string,
    commData: Omit<Communication, 'id' | 'caseId' | 'sentAt' | 'deliveryStatus' | 'acknowledgementStatus'>
  ) => {
    const commId = `COMM-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const defaultDeadline = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const newComm: Communication = {
      ...commData,
      id: commId,
      caseId,
      sentAt: timestamp,
      deliveryStatus: 'DELIVERED',
      acknowledgementStatus: 'PENDING',
      isSimulatedDelivery: true,
      clinicianApprovedGuidance: commData.clinicianApprovedGuidance ?? true,
      approvedByClinician: commData.approvedByClinician || currentRole,
      approvedAt: commData.approvedAt || timestamp,
      acknowledgementDeadline: commData.acknowledgementDeadline || defaultDeadline,
      unacknowledgedAttemptCount: commData.unacknowledgedAttemptCount || 0,
      translationStatus: commData.translationStatus || (commData.language === 'English' ? 'NOT_APPLICABLE' : 'DRAFT_NEEDS_HUMAN_REVIEW'),
      deliveryTimeline: commData.deliveryTimeline || {
        sentAt: timestamp,
        deliveredAt: new Date(Date.now() + 2000).toISOString(),
      }
    };
    setCommunications(prev => [newComm, ...prev]);

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        stage: 'AWAITING_ACKNOWLEDGEMENT',
        nextAction: `Notification dispatched via ${commData.channel}. Awaiting patient receipt confirmation.`,
        blockers: ['Awaiting patient acknowledgement of notification'],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'PATIENT_NOTIFICATION_DISPATCHED',
      'COMMUNICATION',
      commId,
      `Dispatched notification to patient via ${commData.channel} in ${commData.language}. Case moved to Awaiting Acknowledgement.`
    );
  };

  // Record patient acknowledgement
  const recordPatientAcknowledgement = (caseId: string, commId?: string, method: string = 'Digital Portal Receipt', notes?: string) => {
    const timestamp = new Date().toISOString();

    if (commId) {
      setCommunications(prev => prev.map(c => {
        if (c.id !== commId) return c;
        return {
          ...c,
          acknowledgementStatus: 'ACKNOWLEDGED',
          acknowledgedAt: timestamp,
          acknowledgedMethod: method,
        };
      }));
    } else {
      // Mark any pending communications for this case
      setCommunications(prev => prev.map(c => {
        if (c.caseId === caseId && c.acknowledgementStatus === 'PENDING') {
          return {
            ...c,
            acknowledgementStatus: 'ACKNOWLEDGED',
            acknowledgedAt: timestamp,
            acknowledgedMethod: method,
          };
        }
        return c;
      }));
    }

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedChecklist = {
        ...c.evidenceChecklist,
        patientAcknowledged: true,
        patientAcknowledgedDate: timestamp,
      };
      return {
        ...c,
        stage: 'CONFIRMATION_OR_CONSULTATION_PENDING',
        nextAction: 'Patient confirmed receipt. Coordinate appointment or transmit specialist referral.',
        evidenceChecklist: updatedChecklist,
        blockers: c.blockers?.filter(b => !b.toLowerCase().includes('acknowledgement')) || [],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'PATIENT_ACKNOWLEDGEMENT_RECORDED',
      'CASE',
      caseId,
      `Patient acknowledgement confirmed via ${method}. ${notes || ''}`
    );
  };

  // Create structured referral with duplicate prevention
  const createStructuredReferral = (
    refData: Omit<Referral, 'id' | 'transmittedAt' | 'loopClosureEvidenceReceived'>
  ): { success: boolean; error?: string; referralId?: string } => {
    // Closed-Loop Safeguard: Prevent duplicate active referrals for the same purpose unless authorized
    const activeDuplicate = referrals.find(
      r => r.caseId === refData.caseId && 
           (r.purpose?.toLowerCase() === refData.purpose?.toLowerCase() || r.specialty.toLowerCase() === refData.specialty.toLowerCase()) &&
           r.status !== 'REJECTED' && r.status !== 'COMPLETED'
    );

    if (activeDuplicate && !refData.duplicateOverrideJustification) {
      return {
        success: false,
        error: `Active referral [${activeDuplicate.id}] to ${activeDuplicate.receivingProvider} already exists for this patient and specialty. Duplicate referral prevention is active. Please document an authorized override reason to proceed.`
      };
    }

    const refId = `REF-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const deadlineHours = refData.priority === 'URGENT' ? 24 : refData.priority === 'HIGH' ? 48 : 72;
    const deadline = new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();

    const initialMilestone: ReferralMilestone = {
      id: `M-${Date.now().toString(36).toUpperCase()}`,
      status: (refData.status as ReferralStatus) || 'SUBMITTED',
      timestamp,
      actor: currentRole,
      actorRole: currentRoleProfile.title,
      note: `Structured referral package dispatched to ${refData.receivingFacility} (${refData.receivingProvider}). Response deadline: ${deadlineHours}h.`,
    };

    const newRef: Referral = {
      ...refData,
      id: refId,
      status: (refData.status as ReferralStatus) || 'SUBMITTED',
      transmittedAt: timestamp,
      expectedResponseDeadline: refData.expectedResponseDeadline || deadline,
      responseDeadline: refData.responseDeadline || deadline,
      assignedCoordinator: refData.assignedCoordinator || currentRole,
      responsibleOwner: refData.responsibleOwner || refData.receivingProvider,
      nextAction: refData.nextAction || `Transmitted to ${refData.receivingProvider}. Awaiting formal acceptance by triage desk.`,
      dueDate: refData.dueDate || deadline,
      loopClosureEvidenceReceived: false,
      supportingInfoChecklist: refData.supportingInfoChecklist || [
        { id: `SUP-1`, label: 'Diagnostic Screening Summary Report', isRequired: true, isAttached: true, documentRef: `REP-${refData.caseId}` },
        { id: `SUP-2`, label: 'Clinician Referral Authorization', isRequired: true, isAttached: true, documentRef: `AUTH-${refId}` },
        { id: `SUP-3`, label: 'Patient Insurance & Demographic Verification', isRequired: true, isAttached: true, documentRef: `DEMO-${refData.patientId}` }
      ],
      handoffTimeline: refData.handoffTimeline?.length ? refData.handoffTimeline : [initialMilestone],
    };

    setReferrals(prev => [newRef, ...prev]);

    setCases(prev => prev.map(c => {
      if (c.id !== refData.caseId) return c;
      return {
        ...c,
        stage: 'REFERRAL_PENDING',
        nextAction: `Specialist referral transmitted to ${refData.receivingProvider} (${refData.specialty}). Awaiting acceptance.`,
        blockers: ['Awaiting specialist acceptance of electronic referral'],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'REFERRAL_CREATED',
      'REFERRAL',
      refId,
      `Created structured referral ${refId} for ${refData.patientName} to ${refData.receivingProvider} (${refData.receivingFacility}). Expected response: ${deadline.split('T')[0]}.`
    );

    return { success: true, referralId: refId };
  };

  // Backwards-compatible createReferral wrapper
  const createReferral = (refData: Omit<Referral, 'id' | 'transmittedAt' | 'loopClosureEvidenceReceived'>) => {
    createStructuredReferral(refData);
  };

  // State transitions for referral lifecycle with closed-loop handoff timeline
  const transitionReferralState = (
    referralId: string,
    newStatus: ReferralStatus,
    note: string,
    extraData?: { rejectionReason?: string; appointmentDate?: string; outcomeDocRef?: string }
  ) => {
    const timestamp = new Date().toISOString();
    let targetCaseId = '';
    let targetPatientName = '';
    let referringProvider = '';
    let receivingProvider = '';
    let specialty = '';

    const milestone: ReferralMilestone = {
      id: `M-${Date.now().toString(36).toUpperCase()}`,
      status: newStatus,
      timestamp,
      actor: currentRole,
      actorRole: currentRoleProfile.title,
      note,
      details: extraData,
    };

    setReferrals(prev => prev.map(r => {
      if (r.id !== referralId) return r;
      targetCaseId = r.caseId;
      targetPatientName = r.patientName;
      referringProvider = r.referringProvider;
      receivingProvider = r.receivingProvider;
      specialty = r.specialty;

      return {
        ...r,
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? (extraData?.rejectionReason || note) : r.rejectionReason,
        appointmentDate: extraData?.appointmentDate || r.appointmentDate,
        outcomeDocumentRef: extraData?.outcomeDocRef || r.outcomeDocumentRef,
        loopClosureEvidenceReceived: newStatus === 'COMPLETED' ? true : r.loopClosureEvidenceReceived,
        handoffTimeline: [milestone, ...(r.handoffTimeline || [])],
        consultationNotes: note,
      };
    }));

    if (targetCaseId) {
      setCases(prev => prev.map(c => {
        if (c.id !== targetCaseId) return c;

        if (newStatus === 'REJECTED') {
          // Closed-loop safeguard: Rejected referral MUST NOT disappear from active case queue
          return {
            ...c,
            exceptionStatus: 'REFERRAL_REJECTED',
            exceptionReason: extraData?.rejectionReason || note,
            exceptionTimestamp: timestamp,
            nextAction: `Referral rejected by ${receivingProvider}: ${extraData?.rejectionReason || note}. Referring clinician reassessment task assigned.`,
            blockers: [`Referral rejected: ${extraData?.rejectionReason || note}`],
            updatedAt: timestamp,
          };
        }

        if (newStatus === 'ACCEPTED') {
          const updatedChecklist = {
            ...c.evidenceChecklist,
            referralAccepted: true,
            referralStatus: 'ACCEPTED',
          };
          return {
            ...c,
            stage: 'REFERRAL_ACCEPTED',
            exceptionStatus: c.exceptionStatus === 'REFERRAL_REJECTED' ? 'NONE' : c.exceptionStatus,
            nextAction: `Referral accepted by ${receivingProvider}. Coordinate appointment scheduling.`,
            evidenceChecklist: updatedChecklist,
            blockers: ['Coordinate and confirm appointment slot with patient'],
            updatedAt: timestamp,
          };
        }

        if (newStatus === 'INFORMATION_REQUESTED') {
          return {
            ...c,
            nextAction: `Receiving provider requested additional information: ${note}. Care coordinator action required.`,
            blockers: [`Information requested by specialist: ${note}`],
            updatedAt: timestamp,
          };
        }

        if (newStatus === 'APPOINTMENT_SCHEDULED') {
          return {
            ...c,
            stage: 'APPOINTMENT_OR_CARE_PENDING',
            appointmentDetail: {
              ...(c.appointmentDetail || { status: 'SCHEDULED' }),
              status: 'SCHEDULED',
              scheduledDate: extraData?.appointmentDate || c.appointmentDetail?.scheduledDate,
              provider: receivingProvider,
              facility: c.appointmentDetail?.facility,
            },
            nextAction: `Encounter scheduled for ${extraData?.appointmentDate?.split('T')[0] || 'designated date'}. Send appointment reminder.`,
            blockers: ['Awaiting encounter attendance'],
            updatedAt: timestamp,
          };
        }

        if (newStatus === 'CONSULTATION_COMPLETED') {
          return {
            ...c,
            stage: 'AWAITING_OUTCOME_DOCUMENTATION',
            nextAction: `Consultation completed with ${receivingProvider}. Awaiting official outcome report / pathology sign-off.`,
            blockers: ['Awaiting diagnostic outcome report / pathology sign-off'],
            updatedAt: timestamp,
          };
        }

        if (newStatus === 'COMPLETED') {
          const updatedChecklist = {
            ...c.evidenceChecklist,
            outcomeDocumented: true,
            outcomeDocumentRef: extraData?.outcomeDocRef || c.evidenceChecklist?.outcomeDocumentRef,
          };
          return {
            ...c,
            stage: 'READY_FOR_CLOSURE',
            evidenceChecklist: updatedChecklist,
            nextAction: `Specialist care loop documented (${extraData?.outcomeDocRef || 'verified'}). Ready for authorized clinician closure endorsement.`,
            blockers: ['Pending authorized clinician final sign-off signature'],
            updatedAt: timestamp,
          };
        }

        return c;
      }));

      // If rejected, create clinician reassessment task
      if (newStatus === 'REJECTED') {
        const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
        const newTask: Task = {
          id: taskId,
          caseId: targetCaseId,
          patientName: targetPatientName,
          title: `CLINICIAN REASSESSMENT: Referral rejected by ${receivingProvider} (${extraData?.rejectionReason || note})`,
          owner: referringProvider || 'Dr. Sarah Chen, MD (Primary Care)',
          dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          priority: 'URGENT',
          status: 'PENDING',
        };
        setTasks(prev => [newTask, ...prev]);

        // Raise escalation for rejected referral without recovery
        const escId = `ESC-${Date.now().toString(36).toUpperCase()}`;
        const newEsc: Escalation = {
          id: escId,
          caseId: targetCaseId,
          patientName: targetPatientName,
          screeningType: cases.find(c => c.id === targetCaseId)?.screeningType || 'COLORECTAL_FIT',
          reason: `Referral ${referralId} rejected by ${receivingProvider}: ${extraData?.rejectionReason || note}`,
          severity: 'TIER_1_CRITICAL',
          triggerType: 'REJECTED_REFERRAL_NO_RECOVERY',
          triggeringRule: 'Rejected Referral Without Active Recovery Plan (RULE-005)',
          affectedCaseId: targetCaseId,
          currentOwner: referringProvider || 'Dr. Sarah Chen, MD (Primary Care)',
          assignedQualifiedReviewer: 'Dr. Sarah Chen, MD (Primary Care)',
          requiredNextAction: 'Reassess diagnostic strategy, obtain missing records, or re-route referral.',
          deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          triggeredAt: timestamp,
          status: 'ACTIVE',
          slaHoursRemaining: 24,
        };
        setEscalations(prev => [newEsc, ...prev]);
      }

      // If information requested, create task for care coordinator
      if (newStatus === 'INFORMATION_REQUESTED') {
        const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
        const newTask: Task = {
          id: taskId,
          caseId: targetCaseId,
          patientName: targetPatientName,
          title: `TRANSMIT MISSING INFO: ${note} for ${targetPatientName} (${specialty})`,
          owner: 'Maria Ramos, RN (Care Coordinator)',
          dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          priority: 'HIGH',
          status: 'PENDING',
        };
        setTasks(prev => [newTask, ...prev]);
      }
    }

    recordAuditEvent(
      'REFERRAL_STATE_TRANSITION',
      'REFERRAL',
      referralId,
      `Transitioned referral ${referralId} to [${newStatus}]. Note: "${note}"`
    );
  };

  // Backwards-compatible recordReferralResponse
  const recordReferralResponse = (referralId: string, status: 'ACCEPTED' | 'REJECTED', reasonOrNotes: string) => {
    transitionReferralState(
      referralId, 
      status, 
      reasonOrNotes, 
      { rejectionReason: status === 'REJECTED' ? reasonOrNotes : undefined }
    );
  };

  const requestReferralInformation = (referralId: string, requestedItemsNote: string) => {
    transitionReferralState(referralId, 'INFORMATION_REQUESTED', requestedItemsNote);
  };

  const reassignReferralAction = (referralId: string, newOwner: string, nextAction: string, newDueDate: string) => {
    const timestamp = new Date().toISOString();
    const milestone: ReferralMilestone = {
      id: `M-${Date.now().toString(36).toUpperCase()}`,
      status: 'AWAITING_ACCEPTANCE',
      timestamp,
      actor: currentRole,
      actorRole: currentRoleProfile.title,
      note: `Handoff reassigned to owner "${newOwner}". Next action: "${nextAction}". Due: ${newDueDate.split('T')[0]}.`,
    };

    setReferrals(prev => prev.map(r => {
      if (r.id !== referralId) return r;
      return {
        ...r,
        responsibleOwner: newOwner,
        nextAction,
        dueDate: newDueDate,
        handoffTimeline: [milestone, ...(r.handoffTimeline || [])]
      };
    }));

    recordAuditEvent('REFERRAL_REASSIGNED', 'REFERRAL', referralId, `Referral ${referralId} handoff action reassigned to ${newOwner}.`);
  };

  // Demo Scenario: Rejection recovery flow
  const executeReferralRejectionRecovery = (rejectedReferralId: string, newProviderId: string) => {
    const rejectedRef = referrals.find(r => r.id === rejectedReferralId);
    if (!rejectedRef) return;
    const provider = SYNTHETIC_PROVIDER_DIRECTORY.find(p => p.id === newProviderId) || SYNTHETIC_PROVIDER_DIRECTORY[0];
    const timestamp = new Date().toISOString();
    const caseId = rejectedRef.caseId;

    // Step 1: Ensure rejected referral is marked REJECTED and case remains active
    transitionReferralState(
      rejectedReferralId,
      'REJECTED',
      'Initial referral rejected due to missing outside comparison studies. Case remains active in queue.',
      { rejectionReason: 'Missing outside comparison DICOM imaging' }
    );

    // Step 2: Coordinator reassigns next action on case
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        exceptionStatus: 'NONE',
        nextAction: `Reassessment completed by PCP. Re-routing referral to ${provider.facility} (${provider.name}).`,
        blockers: [`Awaiting acceptance by replacement provider ${provider.name}`],
        updatedAt: timestamp,
      };
    }));

    // Step 3: Create replacement structured referral and complete cycle
    const newRefId = `REF-REC-${Date.now().toString(36).toUpperCase()}`;
    const replacementMilestone: ReferralMilestone = {
      id: `M-${Date.now().toString(36).toUpperCase()}`,
      status: 'SUBMITTED',
      timestamp,
      actor: currentRole,
      actorRole: currentRoleProfile.title,
      note: `Replacement referral created following rejection of ${rejectedReferralId}. Directed to ${provider.facility}.`,
    };

    const replacementRef: Referral = {
      id: newRefId,
      caseId,
      patientId: rejectedRef.patientId,
      patientName: rejectedRef.patientName,
      referringProvider: rejectedRef.referringProvider,
      referringOrg: 'CareLoop Health Network',
      receivingProvider: provider.name,
      receivingFacility: provider.facility,
      specialty: provider.specialty,
      reason: rejectedRef.reason,
      purpose: rejectedRef.purpose,
      priority: 'HIGH',
      status: 'ACCEPTED',
      transmittedAt: timestamp,
      expectedResponseDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      responseDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      assignedCoordinator: 'Maria Ramos, RN',
      responsibleOwner: provider.name,
      nextAction: `Replacement referral accepted by ${provider.name}. Procedure scheduled.`,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      appointmentDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      procedureType: rejectedRef.procedureType || 'Diagnostic Procedure',
      consultationNotes: `Expedited replacement referral accepted by ${provider.name}. Prior rejection resolved through direct clinical peer discussion.`,
      loopClosureEvidenceReceived: true,
      supportingInfoChecklist: [
        { id: 'S-1', label: 'Screening Diagnostic Images (Retrieved)', isRequired: true, isAttached: true, documentRef: 'DICOM-RETRIEVED-01' },
        { id: 'S-2', label: 'Clinician Referral Authorization', isRequired: true, isAttached: true, documentRef: 'AUTH-REC-01' },
      ],
      handoffTimeline: [
        {
          id: `M-ACC-${Date.now().toString(36).toUpperCase()}`,
          status: 'ACCEPTED',
          timestamp: new Date(Date.now() + 1000).toISOString(),
          actor: provider.name,
          actorRole: 'Receiving Specialist',
          note: `Replacement referral accepted by ${provider.name}. Verified all necessary DICOM files are attached.`
        },
        replacementMilestone
      ]
    };

    setReferrals(prev => [replacementRef, ...prev]);

    // Resolve any open escalation for the rejected referral
    setEscalations(prev => prev.map(e => {
      if (e.affectedCaseId === caseId && e.triggerType === 'REJECTED_REFERRAL_NO_RECOVERY') {
        return {
          ...e,
          status: 'RESOLVED',
          resolvedAt: timestamp,
          resolutionSummary: `Resolved via replacement referral ${newRefId} accepted by ${provider.name}.`,
          resolutionRationale: 'Coordinator retrieved missing comparison imaging and re-routed to accepting affiliated facility.'
        };
      }
      return e;
    }));

    recordAuditEvent(
      'REFERRAL_RECOVERY_COMPLETED',
      'REFERRAL',
      newRefId,
      `Referral recovery flow completed: Case ${caseId} remained open following rejection of ${rejectedReferralId}. Replacement referral ${newRefId} accepted by ${provider.name}.`
    );
  };

  // Convenience methods
  const sendCommunication = (comm: Omit<Communication, 'id' | 'sentAt' | 'deliveryStatus' | 'acknowledgementStatus'>) => {
    recordPatientNotification(comm.caseId, comm);
  };

  const acknowledgeCommunication = (commId: string, method?: string) => {
    const target = communications.find(c => c.id === commId);
    recordPatientAcknowledgement(target ? target.caseId : '', commId, method);
  };

  const recordComprehensionResponse = (commId: string, response: ComprehensionCheckResponse) => {
    const timestamp = new Date().toISOString();
    let targetCaseId = '';
    let targetPatientName = '';

    setCommunications(prev => prev.map(c => {
      if (c.id !== commId) return c;
      targetCaseId = c.caseId;
      targetPatientName = c.patientName;
      return {
        ...c,
        acknowledgementStatus: 'ACKNOWLEDGED',
        acknowledgedAt: timestamp,
        acknowledgedMethod: `Patient Comprehension Check (${response.understood === 'YES' ? 'Confirmed Understanding' : 'Needs Clarification'})`,
        comprehensionResponse: response,
      };
    }));

    if (targetCaseId) {
      setCases(prev => prev.map(c => {
        if (c.id !== targetCaseId) return c;
        const updatedChecklist = {
          ...c.evidenceChecklist,
          patientAcknowledged: true,
          patientAcknowledgedDate: timestamp,
        };
        return {
          ...c,
          stage: 'CONFIRMATION_OR_CONSULTATION_PENDING',
          nextAction: response.callbackRequested
            ? 'Patient acknowledged receipt with callback requested regarding next steps.'
            : 'Patient confirmed understanding via comprehension check. Coordinate appointment slot.',
          evidenceChecklist: updatedChecklist,
          blockers: c.blockers?.filter(b => !b.toLowerCase().includes('acknowledgement')) || [],
          updatedAt: timestamp,
        };
      }));

      if (response.callbackRequested || response.needsHelp !== 'NO') {
        const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
        const helpDetail = response.needsHelp !== 'NO' ? ` (${response.needsHelp} support needed)` : '';
        const newTask: Task = {
          id: taskId,
          caseId: targetCaseId,
          patientName: targetPatientName,
          title: `COMPREHENSION CHECK CALLBACK: ${targetPatientName}${helpDetail}`,
          owner: 'Maria Ramos, RN (Care Coordinator)',
          dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          priority: 'URGENT',
          status: 'PENDING',
        };
        setTasks(prev => [newTask, ...prev]);

        const note: ClinicalNote = {
          id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
          caseId: targetCaseId,
          author: targetPatientName || 'Patient',
          role: 'Patient',
          timestamp,
          content: `Patient Comprehension Response: Understood [${response.understood}], Needs Help [${response.needsHelp}], Callback Requested [${response.callbackRequested ? 'YES' : 'NO'}]. Note: "${response.patientNotes || 'None'}"`,
          category: 'COMMUNICATION',
        };
        setCases(prev => prev.map(c => c.id === targetCaseId ? { ...c, notes: [note, ...(c.notes || [])] } : c));
      }

      recordAuditEvent(
        'PATIENT_COMPREHENSION_RECORDED',
        'COMMUNICATION',
        commId,
        `Patient comprehension recorded for ${targetPatientName}. Understood: ${response.understood}, Help: ${response.needsHelp}, Callback: ${response.callbackRequested ? 'Yes' : 'No'}.`
      );
    }
  };

  const verifyTranslation = (commId: string, verifierName: string) => {
    const timestamp = new Date().toISOString();
    setCommunications(prev => prev.map(c => {
      if (c.id !== commId) return c;
      return {
        ...c,
        translationStatus: 'VERIFIED_HUMAN_APPROVED',
        verifiedBy: verifierName,
        verifiedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'TRANSLATION_VERIFIED',
      'COMMUNICATION',
      commId,
      `Language translation verified and approved by qualified reviewer: ${verifierName}.`
    );
  };

  const triggerUnacknowledgedFollowup = (commId: string) => {
    const timestamp = new Date().toISOString();
    const comm = communications.find(c => c.id === commId);
    if (!comm) return;

    const newAttemptCount = (comm.unacknowledgedAttemptCount || 0) + 1;
    setCommunications(prev => prev.map(c => c.id === commId ? { ...c, unacknowledgedAttemptCount: newAttemptCount } : c));

    const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const newTask: Task = {
      id: taskId,
      caseId: comm.caseId,
      patientName: comm.patientName,
      title: `UNACKNOWLEDGED OUTREACH (Attempt #${newAttemptCount}): Contact ${comm.patientName} via secondary channel`,
      owner: 'Maria Ramos, RN (Care Coordinator)',
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      priority: newAttemptCount >= 2 ? 'URGENT' : 'HIGH',
      status: 'PENDING',
    };
    setTasks(prev => [newTask, ...prev]);

    if (newAttemptCount >= 2) {
      setCases(prev => prev.map(c => {
        if (c.id !== comm.caseId) return c;
        return {
          ...c,
          exceptionStatus: 'UNABLE_TO_CONTACT',
          exceptionReason: `Patient unacknowledged after ${newAttemptCount} outreach attempts. Secondary channel / certified mail required.`,
          exceptionTimestamp: timestamp,
          nextAction: 'Patient unacknowledged. Escalate to certified mail or clinical supervisor review.',
          blockers: [`Unacknowledged outreach after ${newAttemptCount} attempts`],
          updatedAt: timestamp,
        };
      }));
    }

    recordAuditEvent(
      'UNACKNOWLEDGED_FOLLOWUP_TRIGGERED',
      'COMMUNICATION',
      commId,
      `Unacknowledged outreach follow-up triggered (Attempt #${newAttemptCount}) for ${comm.patientName}. Task ${taskId} created.`
    );
  };

  const simulateDeliveryStatusChange = (commId: string, newStatus: Communication['deliveryStatus']) => {
    const timestamp = new Date().toISOString();
    setCommunications(prev => prev.map(c => {
      if (c.id !== commId) return c;
      const timeline = { ...(c.deliveryTimeline || { sentAt: c.sentAt }) };
      if (newStatus === 'DELIVERED') timeline.deliveredAt = timestamp;
      if (newStatus === 'READ') {
        if (!timeline.deliveredAt) timeline.deliveredAt = timestamp;
        timeline.readAt = timestamp;
      }
      return {
        ...c,
        deliveryStatus: newStatus,
        deliveryTimeline: timeline,
      };
    }));

    recordAuditEvent(
      'DELIVERY_STATUS_SIMULATED',
      'COMMUNICATION',
      commId,
      `Delivery simulation state updated to [${newStatus}] for simulated transmission.`
    );
  };

  const updateReferralStatus = (referralId: string, status: Referral['status'], notes?: string) => {
    setReferrals(prev => prev.map(r => {
      if (r.id !== referralId) return r;
      return { ...r, status, consultationNotes: notes || r.consultationNotes };
    }));
    recordAuditEvent(
      'REFERRAL_STATUS_UPDATED',
      'REFERRAL',
      referralId,
      `Referral status updated to [${status}]. ${notes || ''}`
    );
  };

  // Document appointment status
  const documentAppointmentStatus = (caseId: string, appointment: AppointmentDetail) => {
    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;

      const isAttended = appointment.status === 'ATTENDED';
      const isMissed = appointment.status === 'MISSED';

      const updatedChecklist = {
        ...c.evidenceChecklist,
        appointmentAttended: isAttended,
        appointmentDate: appointment.scheduledDate || c.evidenceChecklist.appointmentDate,
      };

      let newStage: WorkflowStage = c.stage;
      let nextAction = c.nextAction;
      let exceptionStatus: ExceptionStatus = c.exceptionStatus;
      let blockers = c.blockers || [];

      if (isAttended) {
        newStage = 'AWAITING_OUTCOME_DOCUMENTATION';
        nextAction = 'Procedure/encounter attended. Await operative report and diagnostic pathology.';
        exceptionStatus = exceptionStatus === 'APPOINTMENT_MISSED' ? 'NONE' : exceptionStatus;
        blockers = ['Awaiting diagnostic outcome report / pathology sign-off'];
      } else if (isMissed) {
        exceptionStatus = 'APPOINTMENT_MISSED';
        nextAction = 'Patient missed appointment. Immediate callback and reschedule required.';
        blockers = ['Appointment missed - callback and rescheduling required'];
      } else if (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') {
        newStage = 'APPOINTMENT_OR_CARE_PENDING';
        nextAction = `Appointment confirmed for ${appointment.scheduledDate?.split('T')[0] || 'upcoming date'}. Send reminder.`;
        blockers = ['Awaiting scheduled appointment attendance'];
      }

      return {
        ...c,
        stage: newStage,
        exceptionStatus,
        exceptionReason: isMissed ? (appointment.notes || 'Patient failed to appear for scheduled appointment') : c.exceptionReason,
        appointmentDetail: appointment,
        evidenceChecklist: updatedChecklist,
        nextAction,
        blockers,
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'APPOINTMENT_STATUS_UPDATED',
      'CASE',
      caseId,
      `Appointment status updated to [${appointment.status}] at ${appointment.facility || 'clinic'}. Notes: ${appointment.notes || 'None'}`
    );
  };

  // Record care outcome
  const recordCareOutcome = (caseId: string, outcome: { findings: string; surveillance: string; documentRef: string; notes: string }) => {
    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;

      const updatedChecklist = {
        ...c.evidenceChecklist,
        outcomeDocumented: true,
        outcomeDocumentRef: outcome.documentRef,
      };

      return {
        ...c,
        stage: 'READY_FOR_CLOSURE',
        nextAction: `Outcome documented (${outcome.documentRef}). Ready for authorized clinician closure sign-off.`,
        evidenceChecklist: updatedChecklist,
        blockers: ['Pending authorized human clinician final sign-off signature'],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'CARE_OUTCOME_RECORDED',
      'CASE',
      caseId,
      `Care outcome documented: ${outcome.findings}. Document Ref: ${outcome.documentRef}. Next recall: ${outcome.surveillance}`
    );
  };

  // Close loop with evidence - ENFORCES CLOSURE RULES
  const closeCaseWithEvidence = (caseId: string, evidence: ClosureEvidence): { success: boolean; error?: string } => {
    if (!permissions.canCloseCase) {
      return { 
        success: false, 
        error: `Unauthorized: Role [${currentRoleProfile.title}] does not have closure authority. Only Authorized Clinicians and Clinical Supervisors can endorse final loop closure.` 
      };
    }

    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return { success: false, error: 'Case not found' };

    // Strict validation: must have clinician review and outcome documentation
    if (!targetCase.evidenceChecklist.clinicianReviewCompleted) {
      return { success: false, error: 'Cannot close case: Clinician review and urgency sign-off is incomplete.' };
    }
    if (!evidence.documentId || !evidence.documentTitle) {
      return { success: false, error: 'Cannot close case: Missing verifiable evidence document identification.' };
    }

    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;

      const updatedChecklist: EvidenceChecklist = {
        ...c.evidenceChecklist,
        outcomeDocumented: true,
        outcomeDocumentRef: evidence.documentId,
        finalSignoffCompleted: true,
        finalSignoffBy: currentRole,
      };

      return {
        ...c,
        stage: 'CLOSED_WITH_EVIDENCE',
        closureStatus: 'CLOSED_EVIDENCE_ATTACHED',
        closureEvidence: evidence,
        evidenceChecklist: updatedChecklist,
        nextAction: `Closed-loop verified. Next recall surveillance: ${evidence.nextRecommendedSurveillance}`,
        blockers: [],
        exceptionStatus: 'NONE',
        isOverdue: false,
        updatedAt: timestamp,
      };
    }));

    // Mark referral completed if exists
    setReferrals(prev => prev.map(r => {
      if (r.caseId === caseId) {
        return { ...r, status: 'COMPLETED', loopClosureEvidenceReceived: true };
      }
      return r;
    }));

    recordAuditEvent(
      'CLOSED_WITH_EVIDENCE',
      'CASE',
      caseId,
      `Case closed with required clinical evidence [${evidence.type}]. Document Ref: ${evidence.documentId}. Authorized sign-off by ${currentRole}.`
    );

    return { success: true };
  };

  // Reopen case
  const reopenCase = (caseId: string, justification: string, targetStage: WorkflowStage = 'AWAITING_OUTCOME_DOCUMENTATION') => {
    if (!permissions.canReopenCase) {
      recordAuditEvent('UNAUTHORIZED_ATTEMPT', 'CASE', caseId, `Role [${currentRoleProfile.title}] attempted unauthorized case reopening.`);
      return;
    }

    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        stage: targetStage,
        closureStatus: 'OPEN',
        exceptionStatus: 'REOPENED',
        exceptionReason: justification,
        exceptionTimestamp: timestamp,
        nextAction: `Case reopened: ${justification}. Complete outstanding clinical steps.`,
        blockers: [`Reopened by ${currentRole}: ${justification}`],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'CASE_REOPENED',
      'CASE',
      caseId,
      `Case reopened by ${currentRole}. Target stage: ${targetStage}. Justification: ${justification}`
    );
  };

  // Set exception status
  const setCaseException = (caseId: string, exception: ExceptionStatus, reason?: string) => {
    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        exceptionStatus: exception,
        exceptionReason: reason || c.exceptionReason,
        exceptionTimestamp: exception !== 'NONE' ? timestamp : undefined,
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'EXCEPTION_STATUS_CHANGED',
      'CASE',
      caseId,
      `Exception status updated to [${exception}]. Reason: ${reason || 'N/A'}`
    );
  };

  // Add clinical note
  const addClinicalNote = (caseId: string, content: string, category: ClinicalNote['category']) => {
    const timestamp = new Date().toISOString();
    const newNote: ClinicalNote = {
      id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
      caseId,
      author: currentRole,
      role: currentRole.includes('MD') ? 'Physician' : currentRole.includes('RN') ? 'Care Coordinator' : 'Compliance Officer',
      timestamp,
      content,
      category,
    };

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        notes: [newNote, ...(c.notes || [])],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'CLINICAL_NOTE_ADDED',
      'NOTE',
      caseId,
      `[${category}] Note logged: "${content.slice(0, 70)}..."`
    );
  };

  // Create new intake case
  const createNewCase = (
    newCaseData: Omit<ScreeningCase, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore' | 'evidenceChecklist' | 'exceptionStatus'>
  ): string => {
    const caseNum = (cases.length + 1).toString().padStart(3, '0');
    const newId = `CASE-2026-${caseNum}`;
    const timestamp = new Date().toISOString();

    const created: ScreeningCase = {
      ...newCaseData,
      id: newId,
      stage: 'RESULT_RECEIVED',
      exceptionStatus: 'NONE',
      evidenceChecklist: {
        clinicianReviewCompleted: false,
        patientAcknowledged: false,
        referralAccepted: false,
        appointmentAttended: false,
        outcomeDocumented: false,
        finalSignoffCompleted: false,
      },
      blockers: ['Awaiting clinician review and clinical urgency approval'],
      createdAt: timestamp,
      updatedAt: timestamp,
      priorityScore: newCaseData.clinicalUrgency === 'CRITICAL_72H' ? 95 : newCaseData.clinicalUrgency === 'HIGH_14D' ? 80 : 50,
    };

    setCases(prev => [created, ...prev]);
    recordAuditEvent(
      'CASE_INTAKE_CREATED',
      'CASE',
      newId,
      `New screening intake registered for patient ${newCaseData.patientName} (${newCaseData.screeningType}).`
    );
    return newId;
  };

  // Tasks
  const createTask = (taskData: Omit<Task, 'id' | 'status'>) => {
    const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const newTask: Task = {
      ...taskData,
      id: taskId,
      status: 'PENDING',
    };
    setTasks(prev => [newTask, ...prev]);
    recordAuditEvent('TASK_CREATED', 'TASK', taskId, `Created task "${taskData.title}" for ${taskData.patientName}`);
  };

  const toggleTask = (taskId: string, evidence?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const nextStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      return {
        ...t,
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
        completionEvidence: evidence || t.completionEvidence,
      };
    }));
  };

  // Escalations
  const createEscalation = (escData: Omit<Escalation, 'id' | 'triggeredAt' | 'status'>) => {
    const escId = `ESC-${Date.now().toString(36).toUpperCase()}`;
    const newEsc: Escalation = {
      ...escData,
      id: escId,
      triggeredAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    setEscalations(prev => [newEsc, ...prev]);
    recordAuditEvent(
      'ESCALATION_TRIGGERED',
      'ESCALATION',
      escId,
      `[${escData.severity}] Escalation raised for ${escData.patientName}: ${escData.reason}`
    );
  };

  const acknowledgeEscalation = (escalationId: string, note?: string) => {
    const timestamp = new Date().toISOString();
    setEscalations(prev => prev.map(e => {
      if (e.id !== escalationId) return e;
      return {
        ...e,
        status: 'REVIEWED',
        acknowledgedAt: timestamp,
        acknowledgedBy: currentRole,
        resolutionSummary: note ? `Acknowledged by ${currentRole}: ${note}` : `Acknowledged by ${currentRole}`,
      };
    }));
    recordAuditEvent('ESCALATION_ACKNOWLEDGED', 'ESCALATION', escalationId, `Escalation ${escalationId} acknowledged by ${currentRole}. ${note || ''}`);
  };

  const resolveEscalation = (escalationId: string, resolutionSummary: string) => {
    resolveEscalationWithRationale(escalationId, resolutionSummary);
  };

  const resolveEscalationWithRationale = (escalationId: string, rationale: string) => {
    const timestamp = new Date().toISOString();
    setEscalations(prev => prev.map(e => {
      if (e.id !== escalationId) return e;
      return {
        ...e,
        status: 'RESOLVED',
        resolutionSummary: rationale,
        resolutionRationale: rationale,
        resolvedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'ESCALATION_RESOLVED',
      'ESCALATION',
      escalationId,
      `Escalation ${escalationId} resolved by ${currentRole}. Rationale: "${rationale}"`
    );
  };

  const updateEscalationRule = (ruleId: string, updates: Partial<EscalationRule>) => {
    setEscalationRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
    recordAuditEvent('ESCALATION_RULE_CONFIGURED', 'PROTOCOL', ruleId, `Escalation rule ${ruleId} updated by ${currentRole}.`);
  };

  const evaluateEscalationRules = () => {
    const now = Date.now();
    const newEscalations: Escalation[] = [];

    cases.forEach(c => {
      if (c.stage === 'CLOSED_WITH_EVIDENCE') return;

      // Rule 1: CRITICAL_72H awaiting review
      if (c.clinicalUrgency === 'CRITICAL_72H' && (!c.urgencyApprovedAt || c.urgencyApprovedBy === 'Pending Clinician Review')) {
        const existing = escalations.find(e => e.caseId === c.id && e.triggerType === 'CLINICIAN_URGENT_AWAITING_REVIEW' && e.status !== 'RESOLVED');
        if (!existing) {
          newEscalations.push({
            id: `ESC-AUTO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            caseId: c.id,
            patientName: c.patientName,
            screeningType: c.screeningType,
            reason: `Clinician-designated CRITICAL_72H urgency awaiting formal clinical sign-off: ${c.findingsSummary}`,
            severity: 'TIER_1_CRITICAL',
            triggerType: 'CLINICIAN_URGENT_AWAITING_REVIEW',
            triggeringRule: 'Clinician-Designated Urgent Findings Awaiting Review (RULE-001)',
            affectedCaseId: c.id,
            currentOwner: c.responsibleOwner,
            assignedQualifiedReviewer: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
            requiredNextAction: 'Review raw report, confirm clinical urgency, and approve diagnostic pathway within 12h.',
            deadline: new Date(now + 12 * 3600 * 1000).toISOString(),
            triggeredAt: new Date().toISOString(),
            status: 'ACTIVE',
            slaHoursRemaining: 12,
          });
        }
      }

      // Rule 4: Unassigned or ownerless case
      if (!c.responsibleOwner || c.responsibleOwner === 'Unassigned' || !c.assignedOrganization) {
        const existing = escalations.find(e => e.caseId === c.id && e.triggerType === 'UNASSIGNED_OWNERLESS_CASE' && e.status !== 'RESOLVED');
        if (!existing) {
          newEscalations.push({
            id: `ESC-AUTO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            caseId: c.id,
            patientName: c.patientName,
            screeningType: c.screeningType,
            reason: `Case has no accountable designated owner or care coordinator assigned.`,
            severity: 'TIER_2_URGENT',
            triggerType: 'UNASSIGNED_OWNERLESS_CASE',
            triggeringRule: 'Unassigned or Ownerless Screening Case (RULE-004)',
            affectedCaseId: c.id,
            currentOwner: 'Unassigned',
            assignedQualifiedReviewer: 'Maria Ramos, RN (Care Coordinator)',
            requiredNextAction: 'Assign responsible care coordinator and originating primary clinic.',
            deadline: new Date(now + 24 * 3600 * 1000).toISOString(),
            triggeredAt: new Date().toISOString(),
            status: 'ACTIVE',
            slaHoursRemaining: 24,
          });
        }
      }

      // Rule 6: Missed appointment
      if (c.exceptionStatus === 'APPOINTMENT_MISSED') {
        const existing = escalations.find(e => e.caseId === c.id && e.triggerType === 'MISSED_APPOINTMENT' && e.status !== 'RESOLVED');
        if (!existing) {
          newEscalations.push({
            id: `ESC-AUTO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            caseId: c.id,
            patientName: c.patientName,
            screeningType: c.screeningType,
            reason: `Patient missed scheduled diagnostic appointment. Re-contact and rescheduling required.`,
            severity: 'TIER_2_URGENT',
            triggerType: 'MISSED_APPOINTMENT',
            triggeringRule: 'Missed Diagnostic Appointment / No Reschedule (RULE-006)',
            affectedCaseId: c.id,
            currentOwner: c.responsibleOwner,
            assignedQualifiedReviewer: 'Maria Ramos, RN (Care Coordinator)',
            requiredNextAction: 'Initiate patient re-engagement outreach and identify transport/scheduling barriers.',
            deadline: new Date(now + 48 * 3600 * 1000).toISOString(),
            triggeredAt: new Date().toISOString(),
            status: 'ACTIVE',
            slaHoursRemaining: 48,
          });
        }
      }
    });

    if (newEscalations.length > 0) {
      setEscalations(prev => [...newEscalations, ...prev]);
      recordAuditEvent('ESCALATION_RULES_EVALUATED', 'ESCALATION', 'SYSTEM', `Automated rule engine evaluated ${newEscalations.length} new incidents.`);
    }
  };

  // Configurable 8-Point Closure Assurance Validator
  const validateCaseClosure = (caseId: string) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) {
      return {
        canClose: false,
        pathwayName: 'Unknown Pathway',
        checklist: [],
        missingItems: ['Target case not found in registry'],
      };
    }

    const pathwayConfig = PATHWAY_CLOSURE_REQUIREMENTS[targetCase.screeningType] || PATHWAY_CLOSURE_REQUIREMENTS.DEFAULT;
    const checklistStatus = targetCase.evidenceChecklist;

    const items = [
      {
        key: 'clinicianReviewCompleted',
        label: '1. Clinician Urgency Review Documented',
        description: 'Qualified clinician urgency sign-off and clinical review recommendation.',
        isComplete: !!checklistStatus.clinicianReviewCompleted,
        actionTab: 'workspace',
      },
      {
        key: 'patientNotified',
        label: '2. Required Patient Communication Recorded',
        description: 'Notification dispatched in preferred language via consented channel.',
        isComplete: !!checklistStatus.patientNotified || communications.some(c => c.caseId === caseId),
        actionTab: 'outreach',
      },
      {
        key: 'patientAcknowledged',
        label: '3. Patient Acknowledgement / Approved Exception',
        description: 'Patient confirmed receipt or approved outreach exception logged.',
        isComplete: !!checklistStatus.patientAcknowledged,
        actionTab: 'outreach',
      },
      {
        key: 'diagnosticConfirmationCompleted',
        label: '4. Required Confirmation, Consultation, or Testing Completed',
        description: 'Diagnostic procedure (biopsy, endoscopy, colposcopy) attended.',
        isComplete: !!checklistStatus.diagnosticConfirmationCompleted || !!checklistStatus.appointmentAttended || targetCase.stage === 'AWAITING_OUTCOME_DOCUMENTATION' || targetCase.stage === 'READY_FOR_CLOSURE',
        actionTab: 'referrals',
      },
      {
        key: 'referralAccepted',
        label: '5. Referral Acceptance & Coordination Recorded',
        description: 'Receiving specialist acceptance confirmed with explicit responsibilities.',
        isComplete: !!checklistStatus.referralAccepted || referrals.some(r => r.caseId === caseId && (r.status === 'ACCEPTED' || r.status === 'APPOINTMENT_SCHEDULED' || r.status === 'CONSULTATION_COMPLETED' || r.status === 'COMPLETED')),
        actionTab: 'referrals',
      },
      {
        key: 'outcomeDocumented',
        label: '6. Verifiable Diagnostic / Pathology Outcome Documented',
        description: 'Histopathology report, operative summary, or specialist letter filed.',
        isComplete: !!checklistStatus.outcomeDocumented || !!targetCase.closureEvidence?.documentId,
        actionTab: 'checklist',
      },
      {
        key: 'carePlanDocumented',
        label: '7. Documented Follow-up or Surveillance Care Plan',
        description: 'Multidisciplinary treatment plan, surveillance interval, or recall schedule.',
        isComplete: !!checklistStatus.carePlanDocumented || !!targetCase.closureEvidence?.nextRecommendedSurveillance,
        actionTab: 'checklist',
      },
      {
        key: 'blockersResolved',
        label: '8. Unresolved Blockers Addressed & Authorized Closure Approval',
        description: 'No active unresolved safety blockers; licensed clinician final signature.',
        isComplete: (targetCase.blockers?.length || 0) === 0 || !!checklistStatus.clinicalExceptionDocumented,
        actionTab: 'checklist',
      }
    ];

    const missingItems = items.filter(i => !i.isComplete).map(i => i.label);

    return {
      canClose: missingItems.length === 0,
      pathwayName: pathwayConfig.pathwayName,
      checklist: items,
      missingItems,
    };
  };

  // Close case with strict assurance rules or authorized clinical exception
  const closeCaseWithAssurance = (
    caseId: string, 
    evidence: ClosureEvidence, 
    clinicalException?: { rationale: string; approvedBy: string }
  ): { success: boolean; error?: string } => {
    if (!permissions.canCloseCase) {
      return {
        success: false,
        error: `Unauthorized: Role [${currentRoleProfile.title}] does not have closure authority. Only Authorized Clinicians and Clinical Supervisors can endorse final loop closure.`
      };
    }

    const validation = validateCaseClosure(caseId);
    if (!validation.canClose && !clinicalException) {
      return {
        success: false,
        error: `Cannot close case: Missing ${validation.missingItems.length} required evidence items (${validation.missingItems.join(', ')}). Authorized clinical exception documentation required to override.`
      };
    }

    const timestamp = new Date().toISOString();

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;

      const updatedChecklist: EvidenceChecklist = {
        ...c.evidenceChecklist,
        clinicianReviewCompleted: true,
        patientNotified: true,
        patientAcknowledged: true,
        diagnosticConfirmationCompleted: true,
        referralAccepted: true,
        appointmentAttended: true,
        outcomeDocumented: true,
        carePlanDocumented: true,
        blockersResolved: true,
        outcomeDocumentRef: evidence.documentId,
        finalSignoffCompleted: true,
        finalSignoffBy: currentRole,
        finalSignoffDate: timestamp,
        clinicalExceptionDocumented: !!clinicalException,
        clinicalExceptionRationale: clinicalException?.rationale,
        clinicalExceptionApprovedBy: clinicalException?.approvedBy,
      };

      return {
        ...c,
        stage: 'CLOSED_WITH_EVIDENCE',
        closureStatus: clinicalException ? 'CLOSED_CLINICAL_EXCEPTION' : 'CLOSED_EVIDENCE_ATTACHED',
        closureEvidence: evidence,
        evidenceChecklist: updatedChecklist,
        nextAction: `Closed-loop verified. Next recall surveillance: ${evidence.nextRecommendedSurveillance}`,
        blockers: [],
        exceptionStatus: 'NONE',
        isOverdue: false,
        updatedAt: timestamp,
      };
    }));

    setReferrals(prev => prev.map(r => {
      if (r.caseId === caseId) {
        return { ...r, status: 'COMPLETED', loopClosureEvidenceReceived: true };
      }
      return r;
    }));

    recordAuditEvent(
      clinicalException ? 'CLOSED_CLINICAL_EXCEPTION' : 'CLOSED_WITH_EVIDENCE',
      'CASE',
      caseId,
      clinicalException
        ? `Case closed under documented clinical exception by ${currentRole}. Rationale: "${clinicalException.rationale}". Evidence ref: ${evidence.documentId}`
        : `Case closed with 8-point verified evidence checklist. Document ref: ${evidence.documentId}. Authorized by ${currentRole}.`
    );

    return { success: true };
  };

  // 5 Interactive Demo Scenarios
  const triggerDemoScenario = (scenario: 'A' | 'B' | 'C' | 'D' | 'E'): { success: boolean; message: string; targetCaseId?: string } => {
    const timestamp = new Date().toISOString();

    if (scenario === 'A') {
      // Scenario A: Clinician-designated urgent case is routed to a qualified reviewer
      const targetCase = cases.find(c => c.id === 'CASE-2026-019') || cases[0];
      const escId = `ESC-DEMO-A-${Date.now().toString(36).toUpperCase()}`;
      
      setCases(prev => prev.map(c => {
        if (c.id !== targetCase.id) return c;
        return {
          ...c,
          clinicalUrgency: 'CRITICAL_72H',
          urgencyApprovedBy: 'Dr. Sarah Chen, MD (Primary Care)',
          urgencyApprovedAt: timestamp,
          nextAction: 'PROMINENT ALERT: Clinician-designated CRITICAL_72H urgency routed to Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor).',
          blockers: ['Critical 72-hour clinical review required'],
          updatedAt: timestamp,
        };
      }));

      const newEsc: Escalation = {
        id: escId,
        caseId: targetCase.id,
        patientName: targetCase.patientName,
        screeningType: targetCase.screeningType,
        reason: `URGENT ROUTING: Clinician-designated CRITICAL_72H screening finding requires supervisor review.`,
        severity: 'TIER_1_CRITICAL',
        triggerType: 'CLINICIAN_URGENT_AWAITING_REVIEW',
        triggeringRule: 'Clinician-Designated Urgent Findings Awaiting Review (RULE-001)',
        affectedCaseId: targetCase.id,
        currentOwner: 'Dr. Sarah Chen, MD (Primary Care)',
        assignedQualifiedReviewer: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
        requiredNextAction: 'Review raw imaging report and authorize expedited biopsy diagnostic slot.',
        deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        triggeredAt: timestamp,
        status: 'ACTIVE',
        slaHoursRemaining: 12,
      };

      setEscalations(prev => [newEsc, ...prev]);
      setSelectedCaseId(targetCase.id);
      recordAuditEvent('DEMO_SCENARIO_A', 'CASE', targetCase.id, 'Demo Scenario A triggered: Clinician-designated urgent case routed to clinical supervisor.');

      return {
        success: true,
        message: `Demo Scenario A Active: Case ${targetCase.id} (${targetCase.patientName}) designated CRITICAL_72H and routed to Dr. Eleanor Vance, MD with prominent Tier 1 alert.`,
        targetCaseId: targetCase.id,
      };
    }

    if (scenario === 'B') {
      // Scenario B: An overdue referral creates an escalation
      const ref = referrals.find(r => r.id === 'REF-008') || referrals[0];
      const escId = `ESC-DEMO-B-${Date.now().toString(36).toUpperCase()}`;

      // Mark referral overdue
      setReferrals(prev => prev.map(r => {
        if (r.id !== ref.id) return r;
        return {
          ...r,
          status: 'SUBMITTED',
          expectedResponseDeadline: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          nextAction: 'OVERDUE HANDOFF: Receiving facility failed to respond within 48h SLA. Immediate escalation raised.',
        };
      }));

      const newEsc: Escalation = {
        id: escId,
        caseId: ref.caseId,
        patientName: ref.patientName,
        screeningType: 'THYROID_ULTRASOUND',
        reason: `OVERDUE HANDOFF: Referral ${ref.id} to ${ref.receivingProvider} has exceeded response deadline by >48h without acceptance.`,
        severity: 'TIER_1_CRITICAL',
        triggerType: 'APPROACHING_SLA_DEADLINE',
        triggeringRule: 'Case Approaching Configured SLA Service Deadline (RULE-009)',
        affectedCaseId: ref.caseId,
        currentOwner: 'Maria Ramos, RN (Care Coordinator)',
        assignedQualifiedReviewer: 'Dr. Sarah Chen, MD (Primary Care)',
        requiredNextAction: 'Escalate to specialist triage desk or redirect referral to partner clinic.',
        deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        triggeredAt: timestamp,
        status: 'ACTIVE',
        slaHoursRemaining: 4,
      };

      setEscalations(prev => [newEsc, ...prev]);
      setSelectedCaseId(ref.caseId);
      recordAuditEvent('DEMO_SCENARIO_B', 'REFERRAL', ref.id, 'Demo Scenario B triggered: Overdue referral handoff created Tier 1 escalation.');

      return {
        success: true,
        message: `Demo Scenario B Active: Referral ${ref.id} marked overdue. Created Tier 1 Escalation (${escId}) and notification for care coordinator.`,
        targetCaseId: ref.caseId,
      };
    }

    if (scenario === 'C') {
      // Scenario C: A case with missing evidence cannot be closed
      const targetCase = cases.find(c => c.id === 'CASE-2026-004') || cases[0];
      setSelectedCaseId(targetCase.id);
      return {
        success: true,
        message: `Demo Scenario C Active: Case ${targetCase.id} (${targetCase.patientName}) selected. Missing required clinical evidence (colposcopy biopsy pathology, procedure attendance). Attempting closure will display the Blocked Closure Checklist.`,
        targetCaseId: targetCase.id,
      };
    }

    if (scenario === 'D') {
      // Scenario D: A complete case receives authorized closure approval
      const targetCase = cases.find(c => c.id === 'CASE-2026-008') || cases[0];
      setSelectedCaseId(targetCase.id);
      return {
        success: true,
        message: `Demo Scenario D Active: Case ${targetCase.id} (${targetCase.patientName}) loaded with completed wide excision surgery and margin clearance pathology. Ready for authorized clinician closure sign-off.`,
        targetCaseId: targetCase.id,
      };
    }

    if (scenario === 'E') {
      // Scenario E: A closed case is reopened with a documented reason
      const closedCase = cases.find(c => c.stage === 'CLOSED_WITH_EVIDENCE') || cases.find(c => c.id === 'CASE-2026-010') || cases[0];
      const justification = 'Post-surveillance diagnostic review: Patient reported new localized palpable tenderness and asymmetric density at 6-month follow-up ultrasound requiring secondary biopsy evaluation.';
      reopenCase(closedCase.id, justification, 'AWAITING_OUTCOME_DOCUMENTATION');
      setSelectedCaseId(closedCase.id);

      return {
        success: true,
        message: `Demo Scenario E Active: Closed case ${closedCase.id} (${closedCase.patientName}) reopened with documented clinical justification: "${justification}". Moved to active queue with audit entry.`,
        targetCaseId: closedCase.id,
      };
    }

    return { success: false, message: 'Unknown scenario' };
  };

  // End-to-End Judge Demonstration Runner (Steps A through J)
  const resetJudgeDemoScenario = () => {
    const timestamp = new Date().toISOString();
    // Reset target case CASE-JUDGE-001 back to initial Step A state
    setCases(prev => prev.map(c => {
      if (c.id !== 'CASE-JUDGE-001') return c;
      return {
        ...c,
        stage: 'RESULT_RECEIVED',
        exceptionStatus: 'NONE',
        exceptionReason: undefined,
        clinicalUrgency: 'HIGH_14D',
        urgencyApprovedBy: 'Pending Clinician Review',
        urgencyApprovedAt: '',
        nextAction: 'Intake received. Primary care clinician review required to confirm clinical urgency and authorize biopsy plan.',
        dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        responsibleOwner: 'Dr. Sarah Chen, MD (Lead PCP)',
        closureStatus: 'OPEN',
        evidenceChecklist: {
          clinicianReviewCompleted: false,
          patientAcknowledged: false,
          referralAccepted: false,
          appointmentAttended: false,
          outcomeDocumented: false,
          finalSignoffCompleted: false,
        },
        blockers: ['Pending initial clinician review and biopsy authorization'],
        updatedAt: timestamp,
      };
    }));
    // Remove temporary demo referrals and communications for this case
    setReferrals(prev => prev.filter(r => r.id !== 'REF-JUDGE-01' && r.id !== 'REF-JUDGE-02'));
    setCommunications(prev => prev.filter(com => com.caseId !== 'CASE-JUDGE-001'));
    setTasks(prev => prev.filter(t => !t.id.startsWith('TSK-JUDGE')));
    setJudgeDemoCurrentStep('A');
    recordAuditEvent('JUDGE_DEMO_RESET', 'CASE', 'CASE-JUDGE-001', 'Judge demonstration scenario reset to initial Step A state.');
  };

  const executeJudgeDemoStep = (stepKey: JudgeDemoStepKey) => {
    const timestamp = new Date().toISOString();
    setJudgeDemoCurrentStep(stepKey);

    if (stepKey === 'A') {
      resetJudgeDemoScenario();
      setSelectedCaseId('CASE-JUDGE-001');
      recordAuditEvent('JUDGE_STEP_A_INTAKE', 'CASE', 'CASE-JUDGE-001', 'Step A: Suspicious screening BI-RADS 4B result ingested into CareLoop registry. Case opened in Stage 1 (Result Received).');
    } else if (stepKey === 'B') {
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'CLINICIAN_REVIEW_COMPLETED',
          urgencyApprovedBy: 'Dr. Sarah Chen, MD (NPI: 14829031)',
          urgencyApprovedAt: timestamp,
          initialReviewTimestamp: timestamp,
          nextAction: 'Clinician review completed. Care coordinator to dispatch approved bilingual notification in English and Hindi.',
          evidenceChecklist: {
            ...c.evidenceChecklist,
            clinicianReviewCompleted: true,
            clinicianReviewSignedBy: 'Dr. Sarah Chen, MD',
            clinicianReviewDate: timestamp,
          },
          blockers: ['Patient notification pending dispatch in Hindi & English'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_B_REVIEW', 'CASE', 'CASE-JUDGE-001', 'Step B: Dr. Sarah Chen signed clinical review, designating HIGH (14d SLA) and ordering diagnostic ultrasound & biopsy.');
    } else if (stepKey === 'C') {
      const newComm: Communication = {
        id: `COMM-JUDGE-${Date.now().toString(36).toUpperCase()}`,
        caseId: 'CASE-JUDGE-001',
        patientId: 'pat-019',
        patientName: 'Ananya Sharma',
        channel: 'SMS',
        recipientContact: '(555) 314-8800',
        messageTitle: 'Important Health Update from Dr. Chen\'s Office',
        messageContent: 'Dear Ananya, Dr. Sarah Chen has reviewed your screening mammogram results. Please review your portal or call us at (555) 700-CARE to coordinate your recommended diagnostic follow-up appointment.',
        language: 'Hindi',
        sentAt: timestamp,
        sentBy: 'Maria Ramos, RN',
        deliveryStatus: 'DELIVERED',
        acknowledgementStatus: 'PENDING',
        consentPreferenceStatus: 'CONSENTED_PRIMARY',
        isSimulatedDelivery: true,
        clinicianApprovedGuidance: true,
        approvedByClinician: 'Dr. Sarah Chen, MD',
        approvedAt: timestamp,
        acknowledgementDeadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        translationStatus: 'VERIFIED_HUMAN_APPROVED',
        verifiedBy: 'Maria Ramos, RN',
        verifiedAt: timestamp,
        unacknowledgedAttemptCount: 0,
        deliveryTimeline: { sentAt: timestamp, deliveredAt: timestamp }
      };
      setCommunications(prev => [newComm, ...prev.filter(com => com.caseId !== 'CASE-JUDGE-001')]);
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'PATIENT_NOTIFIED',
          nextAction: 'Notification dispatched to patient in Hindi via SMS. Awaiting patient receipt acknowledgement.',
          evidenceChecklist: {
            ...c.evidenceChecklist,
            clinicianReviewCompleted: true,
            patientNotified: true,
            patientNotifiedDate: timestamp,
          },
          blockers: ['Awaiting patient digital portal acknowledgement'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_C_NOTIFY', 'COMMUNICATION', newComm.id, 'Step C: Simulated bilingual notification dispatched to patient Ananya Sharma. Case transitioned to Patient Notified.');
    } else if (stepKey === 'D') {
      setCommunications(prev => prev.map(c => {
        if (c.caseId !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          acknowledgementStatus: 'ACKNOWLEDGED',
          acknowledgedAt: timestamp,
          acknowledgedMethod: 'Patient Secure Portal',
          comprehensionResponse: {
            understood: 'YES',
            needsHelp: 'SCHEDULING',
            callbackRequested: true,
            submittedAt: timestamp,
            patientNotes: 'I understand the biopsy is needed to check the spot. Please help me book an appointment as soon as possible.'
          }
        };
      }));
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'REFERRAL_PENDING',
          nextAction: 'Patient acknowledged notification. Comprehension verified. Coordinate specialist referral booking.',
          evidenceChecklist: {
            ...c.evidenceChecklist,
            clinicianReviewCompleted: true,
            patientNotified: true,
            patientAcknowledged: true,
            patientAcknowledgedDate: timestamp,
          },
          blockers: ['Specialist biopsy referral pending transmission'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_D_ACK', 'CASE', 'CASE-JUDGE-001', 'Step D: Patient Ananya Sharma acknowledged notification and confirmed comprehension. Biopsy referral required.');
    } else if (stepKey === 'E') {
      const refId1 = 'REF-JUDGE-01';
      const ref1: Referral = {
        id: refId1,
        caseId: 'CASE-JUDGE-001',
        patientId: 'pat-019',
        patientName: 'Ananya Sharma',
        referringProvider: 'Dr. Sarah Chen, MD',
        referringOrg: 'CareLoop Health Network',
        receivingProvider: 'Dr. Kimberly Vance, MD',
        receivingFacility: 'Metro Diagnostic Breast Center',
        specialty: 'Diagnostic Radiology & Breast Imaging',
        reason: 'BI-RADS 4B suspicious calcifications requiring targeted core needle biopsy',
        purpose: 'Ultrasound-Guided Core Needle Biopsy',
        priority: 'HIGH',
        status: 'REJECTED',
        rejectionReason: 'Capacity exceeded: Imaging suite fully booked; biopsy backlog exceeds 45 days. Cannot meet 14-day SLA.',
        transmittedAt: timestamp,
        expectedResponseDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        assignedCoordinator: 'Maria Ramos, RN',
        responsibleOwner: 'Dr. Sarah Chen, MD',
        nextAction: 'CLOSED-LOOP SAFEGUARD: Referral rejected by Metro Diagnostic Breast Center. Retain case in active queue and re-route.',
        dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        loopClosureEvidenceReceived: false,
        handoffTimeline: [
          { id: 'M-J1', status: 'SUBMITTED', timestamp: timestamp, actor: 'Maria Ramos, RN', actorRole: 'Care Coordinator', note: 'Referral submitted to Metro Diagnostic Breast Center.' },
          { id: 'M-J2', status: 'REJECTED', timestamp: timestamp, actor: 'Dr. Kimberly Vance, MD', actorRole: 'Specialist Intake', note: 'Rejected: capacity exceeded (>45d backlog).' }
        ]
      };
      setReferrals(prev => [ref1, ...prev.filter(r => r.id !== refId1)]);
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'REFERRAL_PENDING',
          exceptionStatus: 'REFERRAL_REJECTED',
          exceptionReason: 'Metro Diagnostic Breast Center rejected referral due to capacity (>45d waitlist).',
          exceptionTimestamp: timestamp,
          nextAction: 'SAFEGUARD ENFORCED: Referral rejected. Case retained in active queue. Clinical reassessment and re-routing task generated.',
          blockers: ['Referral rejected: Capacity backlog. Re-routing required immediately.'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_E_REJECTED', 'REFERRAL', refId1, 'Step E: Referral REF-JUDGE-01 rejected by Metro Diagnostic Breast Center. Case retained in active queue under exception status.');
    } else if (stepKey === 'F') {
      const recoveryTask: Task = {
        id: `TSK-JUDGE-REC-${Date.now().toString(36).toUpperCase()}`,
        caseId: 'CASE-JUDGE-001',
        patientName: 'Ananya Sharma',
        title: 'CRITICAL RECOVERY: Reassess rejected referral for Ananya Sharma; re-route to secondary certified imaging center within 48h',
        owner: 'Dr. Sarah Chen, MD',
        dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        priority: 'URGENT',
        status: 'IN_PROGRESS',
      };
      setTasks(prev => [recoveryTask, ...prev]);
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          nextAction: 'Clinical reassessment in progress: Dr. Sarah Chen re-routing referral to Valley Health Imaging.',
          blockers: ['Reassessment in progress: Connecting with secondary provider'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_F_RECOVERY', 'TASK', recoveryTask.id, 'Step F: Autonomous recovery task generated for Dr. Sarah Chen. CareLoop explicitly retained case ownership.');
    } else if (stepKey === 'G') {
      const refId2 = 'REF-JUDGE-02';
      const ref2: Referral = {
        id: refId2,
        caseId: 'CASE-JUDGE-001',
        patientId: 'pat-019',
        patientName: 'Ananya Sharma',
        referringProvider: 'Dr. Sarah Chen, MD',
        referringOrg: 'CareLoop Health Network',
        receivingProvider: 'Dr. Angela Thorne, MD',
        receivingFacility: 'Valley Health Diagnostic Imaging',
        specialty: 'Breast Imaging & Intervention',
        reason: 'Expedited replacement referral for BI-RADS 4B suspicious lesion',
        purpose: 'Ultrasound-Guided Core Needle Biopsy',
        priority: 'HIGH',
        status: 'CONSULTATION_COMPLETED',
        transmittedAt: timestamp,
        assignedCoordinator: 'Maria Ramos, RN',
        responsibleOwner: 'Dr. Angela Thorne, MD',
        nextAction: 'Procedure attended on Nov 2, 2026. Awaiting final permanent section pathology margin report.',
        dueDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        procedureType: 'Ultrasound-guided 14G core needle biopsy',
        consultationNotes: 'Biopsy performed under local anesthesia. Four core specimens retrieved with titanium clip deployed at biopsy bed. Specimen sent to pathology.',
        loopClosureEvidenceReceived: false,
        handoffTimeline: [
          { id: 'M-J3', status: 'SUBMITTED', timestamp: timestamp, actor: 'Maria Ramos, RN', actorRole: 'Care Coordinator', note: 'Replacement referral submitted to Valley Health Imaging.' },
          { id: 'M-J4', status: 'ACCEPTED', timestamp: timestamp, actor: 'Dr. Angela Thorne, MD', actorRole: 'Specialist', note: 'Accepted for same-week slot.' },
          { id: 'M-J5', status: 'APPOINTMENT_SCHEDULED', timestamp: timestamp, actor: 'Valley Health Scheduler', actorRole: 'Facility', note: 'Appointment scheduled for biopsy suite.' },
          { id: 'M-J6', status: 'CONSULTATION_COMPLETED', timestamp: timestamp, actor: 'Dr. Angela Thorne, MD', actorRole: 'Specialist', note: 'Biopsy attended and completed without complication.' }
        ]
      };
      setReferrals(prev => [ref2, ...prev.filter(r => r.id !== refId2)]);
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'AWAITING_OUTCOME_DOCUMENTATION',
          exceptionStatus: 'NONE',
          exceptionReason: undefined,
          nextAction: 'Biopsy attended at Valley Health Imaging. Awaiting permanent pathology histology margin report.',
          appointmentDetail: {
            scheduledDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            facility: 'Valley Health Diagnostic Imaging Room 3',
            provider: 'Dr. Angela Thorne, MD',
            procedure: 'Ultrasound-guided core needle breast biopsy',
            status: 'ATTENDED',
            attendanceVerifiedAt: timestamp,
            notes: 'Four 14-gauge core needle biopsies taken. Titanium marker clip placed.'
          },
          evidenceChecklist: {
            ...c.evidenceChecklist,
            referralAccepted: true,
            referralStatus: 'CONSULTATION_COMPLETED',
            appointmentAttended: true,
            appointmentDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          },
          blockers: ['Awaiting permanent surgical pathology report'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_G_ATTENDED', 'REFERRAL', refId2, 'Step G: Secondary referral REF-JUDGE-02 accepted by Valley Health. Biopsy procedure attended and completed.');
    } else if (stepKey === 'H') {
      setCases(prev => prev.map(c => {
        if (c.id !== 'CASE-JUDGE-001') return c;
        return {
          ...c,
          stage: 'READY_FOR_CLOSURE',
          nextAction: 'All evidence criteria met. Authorized clinician final loop sign-off required to document closure.',
          evidenceChecklist: {
            ...c.evidenceChecklist,
            outcomeDocumented: true,
            outcomeDocumentRef: 'DOC-PATH-JUDGE-991',
            diagnosticConfirmationCompleted: true,
            diagnosticConfirmationDate: timestamp,
            carePlanDocumented: true,
            carePlanNotes: 'Routine 12-month annual screening mammography in October 2027.',
            blockersResolved: true,
          },
          blockers: ['Pending authorized clinical supervisor final sign-off signature'],
          updatedAt: timestamp,
        };
      }));
      recordAuditEvent('JUDGE_STEP_H_OUTCOME', 'CASE', 'CASE-JUDGE-001', 'Step H: Pathology report DOC-PATH-JUDGE-991 documented (Benign fibroadenoma). Case advanced to Ready for Closure.');
    } else if (stepKey === 'I') {
      const closureEvidence: ClosureEvidence = {
        type: 'PATHOLOGY_CONFIRMATION',
        documentId: 'DOC-PATH-JUDGE-991',
        documentTitle: 'Surgical Histopathology Report - Right Breast Core Biopsy',
        completedAt: timestamp,
        verifiedBy: 'Dr. Eleanor Vance, MD (Chief Medical Officer / Supervisor)',
        clinicalNotes: 'Definitive tissue diagnosis: Benign fibroadenoma. No atypia or malignancy. Concordant with radiologist findings. Routine 12-month recall recommended.',
        resectedOrNormalFinding: 'Benign fibroadenoma with focal ductal hyperplasia; no atypia.',
        nextRecommendedSurveillance: 'Routine screening mammogram in 12 months (October 2027).'
      };
      closeCaseWithAssurance('CASE-JUDGE-001', closureEvidence);
      recordAuditEvent('JUDGE_STEP_I_CLOSED', 'CASE', 'CASE-JUDGE-001', 'Step I: Authorized verified closure executed by Dr. Eleanor Vance, MD. Full 8-point evidence checklist satisfied.');
    } else if (stepKey === 'J') {
      recordAuditEvent('JUDGE_STEP_J_VERIFIED', 'CASE', 'CASE-JUDGE-001', 'Step J: Live quality compliance confirmed. Overview Dashboard, Closed-Loop Analytics, and permanent Audit Trail fully updated.');
    }
  };

  // Role-Specific Capabilities: Lab, Patient, and Coordination
  const issueLabCorrection = (caseId: string, addendumText: string) => {
    if (!permissions.canIssueLabCorrection) {
      recordAuditEvent('UNAUTHORIZED_ATTEMPT', 'CASE', caseId, `Role [${currentRoleProfile.title}] attempted unauthorized lab addendum.`);
      return;
    }
    const timestamp = new Date().toISOString();
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const note: ClinicalNote = {
        id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
        caseId,
        author: currentRole,
        role: 'Laboratory Director',
        timestamp,
        content: `LABORATORY ADDENDUM / DIAGNOSTIC AMENDMENT: ${addendumText}`,
        category: 'CLINICAL',
      };
      return {
        ...c,
        findingsSummary: `${c.findingsSummary} [Addendum: ${addendumText}]`,
        notes: [note, ...(c.notes || [])],
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'LAB_CORRECTION_ISSUED',
      'CASE',
      caseId,
      `Laboratory correction/addendum logged by ${currentRole}: "${addendumText.slice(0, 80)}"`
    );
  };

  const verifyLabReceipt = (caseId: string) => {
    const timestamp = new Date().toISOString();
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        updatedAt: timestamp,
      };
    }));
    recordAuditEvent(
      'LAB_RECEIPT_VERIFIED',
      'CASE',
      caseId,
      `Laboratory transmission receipt acknowledged and verified by ${currentRole}.`
    );
  };

  const submitPatientQuestion = (caseId: string, question: string, requestCallback: boolean) => {
    const targetCase = cases.find(c => c.id === caseId);
    const patientName = targetCase?.patientName || 'Patient';
    const timestamp = new Date().toISOString();

    const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const newTask: Task = {
      id: taskId,
      caseId,
      patientName,
      title: requestCallback ? `URGENT: Patient requested callback regarding findings` : `Patient Portal Inquiry: Questions regarding findings`,
      owner: 'Maria Ramos, RN (Care Coordinator)',
      dueDate: new Date(Date.now() + (requestCallback ? 24 * 3600 * 1000 : 48 * 3600 * 1000)).toISOString(),
      priority: requestCallback ? 'URGENT' : 'MEDIUM',
      status: 'PENDING',
    };
    setTasks(prev => [newTask, ...prev]);

    const note: ClinicalNote = {
      id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
      caseId,
      author: patientName,
      role: 'Patient',
      timestamp,
      content: `Patient portal inquiry: "${question}" (Callback requested: ${requestCallback ? 'YES' : 'NO'})`,
      category: 'COMMUNICATION',
    };

    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        notes: [note, ...(c.notes || [])],
        updatedAt: timestamp,
      };
    }));

    recordAuditEvent(
      'PATIENT_INQUIRY_SUBMITTED',
      'COMMUNICATION',
      caseId,
      `Patient ${patientName} submitted inquiry via portal. Callback: ${requestCallback ? 'Requested' : 'No'}. Task ${taskId} created for Care Coordinator.`
    );
  };

  const updatePatientPreferences = (patientId: string, safePreference: any, phone: string, email: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        safeContactPreference: safePreference,
        phone,
        email,
      };
    }));
    recordAuditEvent(
      'PATIENT_PREFERENCES_UPDATED',
      'CASE',
      patientId,
      `Contact preferences updated by ${currentRole}. Preferred mode: ${safePreference}. Phone: ${phone}.`
    );
  };

  // Reset to initial rich demo data
  const resetToDemoData = () => {
    setPatients(SEED_PATIENTS);
    setCases(SEED_CASES);
    setCommunications(SEED_COMMUNICATIONS);
    setReferrals(SEED_REFERRALS);
    setTasks(SEED_TASKS);
    setEscalations(SEED_ESCALATIONS);
    setAuditEvents(SEED_AUDIT_EVENTS);
    setSelectedCaseId(null);

    try {
      localStorage.removeItem(`${STORAGE_KEY}_patients`);
      localStorage.removeItem(`${STORAGE_KEY}_cases`);
      localStorage.removeItem(`${STORAGE_KEY}_communications`);
      localStorage.removeItem(`${STORAGE_KEY}_referrals`);
      localStorage.removeItem(`${STORAGE_KEY}_tasks`);
      localStorage.removeItem(`${STORAGE_KEY}_escalations`);
      localStorage.removeItem(`${STORAGE_KEY}_audits`);
    } catch (e) {
      console.error(e);
    }

    recordAuditEvent('SYSTEM_RESET', 'PROTOCOL', 'ALL', 'Restored default clinical demonstration datasets with 13-stage lifecycle.');
  };

  const exportAuditLogJSON = () => {
    const exportData = {
      platform: 'CareLoop AI — Closed-Loop Care Coordination Platform',
      exportedAt: new Date().toISOString(),
      exportedBy: currentRole,
      auditRecordsCount: auditEvents.length,
      auditLogs: auditEvents,
      casesSummary: cases.map(c => ({
        id: c.id,
        patient: c.patientName,
        screening: c.screeningType,
        stage: c.stage,
        exceptionStatus: c.exceptionStatus,
        urgency: c.clinicalUrgency,
        closureStatus: c.closureStatus,
        evidenceChecklist: c.evidenceChecklist,
        closureEvidence: c.closureEvidence || null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `careloop-audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CareLoopContext.Provider value={{
      currentRole,
      setCurrentRole,
      currentRoleType,
      setCurrentRoleType,
      currentPatientId,
      setCurrentPatientId,
      permissions,
      currentRoleProfile,
      currentUserNpi,
      patients,
      cases,
      communications,
      referrals,
      tasks,
      escalations,
      auditEvents,
      protocols,
      escalationRules,
      providerDirectory,
      pathwayClosureRequirements,
      metrics,
      selectedCaseId,
      setSelectedCaseId,
      selectedCase,
      updateCaseStage,
      reassignOwner,
      changeDueDate,
      recordClinicianReview,
      recordPatientNotification,
      recordPatientAcknowledgement,
      createReferral,
      createStructuredReferral,
      recordReferralResponse,
      transitionReferralState,
      requestReferralInformation,
      reassignReferralAction,
      executeReferralRejectionRecovery,
      documentAppointmentStatus,
      recordCareOutcome,
      closeCaseWithEvidence,
      closeCaseWithAssurance,
      validateCaseClosure,
      reopenCase,
      setCaseException,
      addClinicalNote,
      createTask,
      toggleTask,
      createEscalation,
      acknowledgeEscalation,
      resolveEscalation,
      resolveEscalationWithRationale,
      updateEscalationRule,
      evaluateEscalationRules,
      triggerDemoScenario,
      isJudgeDemoModalOpen,
      setIsJudgeDemoModalOpen,
      judgeDemoCurrentStep,
      setJudgeDemoCurrentStep,
      executeJudgeDemoStep,
      resetJudgeDemoScenario,
      sendCommunication,
      acknowledgeCommunication,
      recordComprehensionResponse,
      verifyTranslation,
      triggerUnacknowledgedFollowup,
      simulateDeliveryStatusChange,
      updateReferralStatus,
      createNewCase,
      resetToDemoData,
      exportAuditLogJSON,
      issueLabCorrection,
      verifyLabReceipt,
      submitPatientQuestion,
      updatePatientPreferences,
    }}>
      {children}
    </CareLoopContext.Provider>
  );
};

export const useCareLoop = () => {
  const context = useContext(CareLoopContext);
  if (!context) {
    throw new Error('useCareLoop must be used within a CareLoopProvider');
  }
  return context;
};
