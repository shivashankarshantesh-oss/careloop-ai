export type RoleType = 
  | 'CARE_COORDINATOR'
  | 'PRIMARY_CARE_CLINICIAN'
  | 'SPECIALIST_PROVIDER'
  | 'LABORATORY_PROVIDER'
  | 'PATIENT'
  | 'CLINICAL_SUPERVISOR';

export interface RoleProfile {
  id: RoleType;
  name: string;
  title: string;
  organization: string;
  description: string;
  badgeColor: string;
  patientId?: string; // For patient role simulation
}

export interface RolePermissions {
  canReviewAndApproveUrgency: boolean;
  canDispatchOutreach: boolean;
  canManageReferrals: boolean;
  canAcceptRejectReferral: boolean;
  canRecordOutcome: boolean;
  canCloseCase: boolean;
  canReopenCase: boolean;
  canSubmitLabIntake: boolean;
  canIssueLabCorrection: boolean;
  canReassignOwner: boolean;
  canManageTasks: boolean;
  canManageEscalations: boolean;
  canViewAuditLog: boolean;
  canViewFullRegistry: boolean;
  isPatientPortal: boolean;
}

export const ROLE_PROFILES: Record<RoleType, RoleProfile> = {
  CARE_COORDINATOR: {
    id: 'CARE_COORDINATOR',
    name: 'Maria Ramos, RN',
    title: 'Lead Care Coordinator',
    organization: 'MetroHealth Ambulatory Coordination Center',
    description: 'Manages outreach, patient acknowledgements, scheduling, and closes handoff gaps.',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  PRIMARY_CARE_CLINICIAN: {
    id: 'PRIMARY_CARE_CLINICIAN',
    name: 'Dr. Sarah Chen, MD',
    title: 'Lead Primary Care Clinician (NPI: 14829031)',
    organization: 'MetroHealth Primary Care Clinic',
    description: 'Reviews diagnostic findings, assigns clinical urgency, orders referrals, and endorses care plans.',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  SPECIALIST_PROVIDER: {
    id: 'SPECIALIST_PROVIDER',
    name: 'Dr. Kevin Patel, MD',
    title: 'Specialist / Receiving Gastroenterologist (NPI: 18290144)',
    organization: 'MetroHealth Endoscopy & GI Center of Excellence',
    description: 'Triages e-referrals, accepts/rejects consults, schedules procedures, and files operative outcomes.',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  LABORATORY_PROVIDER: {
    id: 'LABORATORY_PROVIDER',
    name: 'Bay Imaging & Quest Diagnostics Liaison',
    title: 'Screening Facility & Laboratory Director',
    organization: 'Regional Pathology & Diagnostic Imaging Network',
    description: 'Submits screening findings, verifies clinical receipt, and transmits corrections/addenda.',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  PATIENT: {
    id: 'PATIENT',
    name: 'Elena Vazquez',
    title: 'Patient (MRN: SYN-48201)',
    organization: 'Patient Secure Portal View',
    description: 'Reviews clinician-approved screening results, confirms receipt, and requests care team callback.',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    patientId: 'pat-001',
  },
  CLINICAL_SUPERVISOR: {
    id: 'CLINICAL_SUPERVISOR',
    name: 'Dr. Eleanor Vance, MD',
    title: 'Chief Medical Officer & Clinical Quality Supervisor',
    organization: 'MetroHealth Clinical Quality Oversight Board',
    description: 'Monitors network SLAs, manages escalation incidents, investigates handoff failures, and verifies loop closures.',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export const ROLE_PERMISSIONS: Record<RoleType, RolePermissions> = {
  CARE_COORDINATOR: {
    canReviewAndApproveUrgency: false,
    canDispatchOutreach: true,
    canManageReferrals: true,
    canAcceptRejectReferral: false,
    canRecordOutcome: false,
    canCloseCase: false, // Clinician / Supervisor only
    canReopenCase: false,
    canSubmitLabIntake: true,
    canIssueLabCorrection: false,
    canReassignOwner: true,
    canManageTasks: true,
    canManageEscalations: true,
    canViewAuditLog: true,
    canViewFullRegistry: true,
    isPatientPortal: false,
  },
  PRIMARY_CARE_CLINICIAN: {
    canReviewAndApproveUrgency: true,
    canDispatchOutreach: true,
    canManageReferrals: true,
    canAcceptRejectReferral: false,
    canRecordOutcome: true,
    canCloseCase: true,
    canReopenCase: true,
    canSubmitLabIntake: true,
    canIssueLabCorrection: false,
    canReassignOwner: true,
    canManageTasks: true,
    canManageEscalations: true,
    canViewAuditLog: true,
    canViewFullRegistry: true,
    isPatientPortal: false,
  },
  SPECIALIST_PROVIDER: {
    canReviewAndApproveUrgency: false,
    canDispatchOutreach: false,
    canManageReferrals: true,
    canAcceptRejectReferral: true,
    canRecordOutcome: true,
    canCloseCase: false,
    canReopenCase: false,
    canSubmitLabIntake: false,
    canIssueLabCorrection: false,
    canReassignOwner: false,
    canManageTasks: true,
    canManageEscalations: false,
    canViewAuditLog: true,
    canViewFullRegistry: true,
    isPatientPortal: false,
  },
  LABORATORY_PROVIDER: {
    canReviewAndApproveUrgency: false,
    canDispatchOutreach: false,
    canManageReferrals: false,
    canAcceptRejectReferral: false,
    canRecordOutcome: false,
    canCloseCase: false, // STRICT RULE: Laboratories cannot close clinical pathways
    canReopenCase: false,
    canSubmitLabIntake: true,
    canIssueLabCorrection: true,
    canReassignOwner: false,
    canManageTasks: false,
    canManageEscalations: false,
    canViewAuditLog: true,
    canViewFullRegistry: true,
    isPatientPortal: false,
  },
  PATIENT: {
    canReviewAndApproveUrgency: false,
    canDispatchOutreach: false,
    canManageReferrals: false,
    canAcceptRejectReferral: false,
    canRecordOutcome: false,
    canCloseCase: false,
    canReopenCase: false,
    canSubmitLabIntake: false,
    canIssueLabCorrection: false,
    canReassignOwner: false,
    canManageTasks: false,
    canManageEscalations: false,
    canViewAuditLog: false,
    canViewFullRegistry: false,
    isPatientPortal: true,
  },
  CLINICAL_SUPERVISOR: {
    canReviewAndApproveUrgency: true,
    canDispatchOutreach: true,
    canManageReferrals: true,
    canAcceptRejectReferral: true,
    canRecordOutcome: true,
    canCloseCase: true,
    canReopenCase: true,
    canSubmitLabIntake: true,
    canIssueLabCorrection: true,
    canReassignOwner: true,
    canManageTasks: true,
    canManageEscalations: true,
    canViewAuditLog: true,
    canViewFullRegistry: true,
    isPatientPortal: false,
  },
};

export function checkPermission(role: RoleType, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
