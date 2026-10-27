import { ClinicalUrgency, WorkflowStage, ScreeningType, ContactPreference, ExceptionStatus } from '../types/careloop';

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getScreeningLabel(type: ScreeningType): string {
  switch (type) {
    case 'MAMMOGRAPHY_BIRADS':
      return 'Breast Screening (BI-RADS)';
    case 'COLORECTAL_FIT':
      return 'Colorectal (FIT/Stool)';
    case 'LUNG_LDCT':
      return 'Lung CT (Lung-RADS)';
    case 'CERVICAL_HPV':
      return 'Cervical / HPV Cytology';
    case 'DIABETIC_RETINOPATHY':
      return 'Diabetic Retinal Screen';
    case 'PROSTATE_PSA':
      return 'Prostate PSA Screen';
    case 'THYROID_ULTRASOUND':
      return 'Thyroid (TI-RADS)';
    case 'SKIN_BIOPSY':
      return 'Dermatopathology Biopsy';
    default:
      return type;
  }
}

export function getStageLabel(stage: WorkflowStage): string {
  switch (stage) {
    case 'RESULT_RECEIVED':
      return '1. Result received';
    case 'AWAITING_CLINICIAN_REVIEW':
      return '2. Awaiting clinician review';
    case 'CLINICIAN_REVIEW_COMPLETED':
      return '3. Clinician review completed';
    case 'PATIENT_NOTIFICATION_PENDING':
      return '4. Patient notification pending';
    case 'PATIENT_NOTIFIED':
      return '5. Patient notified';
    case 'AWAITING_ACKNOWLEDGEMENT':
      return '6. Awaiting acknowledgement';
    case 'CONFIRMATION_OR_CONSULTATION_PENDING':
      return '7. Confirmation or consultation pending';
    case 'REFERRAL_PENDING':
      return '8. Referral pending';
    case 'REFERRAL_ACCEPTED':
      return '9. Referral accepted';
    case 'APPOINTMENT_OR_CARE_PENDING':
      return '10. Appointment or care pending';
    case 'AWAITING_OUTCOME_DOCUMENTATION':
      return '11. Awaiting outcome documentation';
    case 'READY_FOR_CLOSURE':
      return '12. Ready for closure';
    case 'CLOSED_WITH_EVIDENCE':
      return '13. Closed with evidence';
    default:
      return stage;
  }
}

export function getStageIndex(stage: WorkflowStage): number {
  const STAGES: WorkflowStage[] = [
    'RESULT_RECEIVED',
    'AWAITING_CLINICIAN_REVIEW',
    'CLINICIAN_REVIEW_COMPLETED',
    'PATIENT_NOTIFICATION_PENDING',
    'PATIENT_NOTIFIED',
    'AWAITING_ACKNOWLEDGEMENT',
    'CONFIRMATION_OR_CONSULTATION_PENDING',
    'REFERRAL_PENDING',
    'REFERRAL_ACCEPTED',
    'APPOINTMENT_OR_CARE_PENDING',
    'AWAITING_OUTCOME_DOCUMENTATION',
    'READY_FOR_CLOSURE',
    'CLOSED_WITH_EVIDENCE'
  ];
  return STAGES.indexOf(stage);
}

export function getExceptionBadge(exception: ExceptionStatus): { text: string; bg: string; label: string } | null {
  switch (exception) {
    case 'ON_HOLD':
      return { text: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', label: 'On Hold' };
    case 'UNABLE_TO_CONTACT':
      return { text: 'text-rose-800', bg: 'bg-rose-50 border-rose-200', label: 'Unable to Contact' };
    case 'REFERRAL_REJECTED':
      return { text: 'text-purple-800', bg: 'bg-purple-50 border-purple-200', label: 'Referral Rejected' };
    case 'APPOINTMENT_MISSED':
      return { text: 'text-red-800', bg: 'bg-red-50 border-red-200', label: 'Appointment Missed' };
    case 'REOPENED':
      return { text: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', label: 'Reopened' };
    default:
      return null;
  }
}

export function getUrgencyBadgeClasses(urgency: ClinicalUrgency): { text: string; bg: string; dot: string; label: string } {
  switch (urgency) {
    case 'CRITICAL_72H':
      return {
        text: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Critical (72h SLA)',
      };
    case 'HIGH_14D':
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
        label: 'High (14d SLA)',
      };
    case 'MODERATE_30D':
      return {
        text: 'text-teal-700',
        bg: 'bg-teal-50 border-teal-200',
        dot: 'bg-teal-500',
        label: 'Moderate (30d SLA)',
      };
    case 'ROUTINE_60D':
      return {
        text: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Routine (60d SLA)',
      };
  }
}

export function calculateDaysRemaining(dueDateIso: string): number {
  const diffMs = new Date(dueDateIso).getTime() - new Date().getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatStage(stage: WorkflowStage): string {
  return getStageLabel(stage);
}

export function getStageBadgeColor(stage: WorkflowStage): string {
  switch (stage) {
    case 'RESULT_RECEIVED':
      return 'bg-slate-100 text-slate-800 border border-slate-200';
    case 'AWAITING_CLINICIAN_REVIEW':
      return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'CLINICIAN_REVIEW_COMPLETED':
      return 'bg-cyan-50 text-cyan-800 border border-cyan-200';
    case 'PATIENT_NOTIFICATION_PENDING':
    case 'PATIENT_NOTIFIED':
    case 'AWAITING_ACKNOWLEDGEMENT':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'CONFIRMATION_OR_CONSULTATION_PENDING':
    case 'REFERRAL_PENDING':
    case 'REFERRAL_ACCEPTED':
      return 'bg-purple-50 text-purple-800 border border-purple-200';
    case 'APPOINTMENT_OR_CARE_PENDING':
    case 'AWAITING_OUTCOME_DOCUMENTATION':
      return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
    case 'READY_FOR_CLOSURE':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
    case 'CLOSED_WITH_EVIDENCE':
      return 'bg-teal-50 text-teal-800 border border-teal-200 font-bold';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function getUrgencyBadgeColor(urgency: ClinicalUrgency): string {
  switch (urgency) {
    case 'CRITICAL_72H':
      return 'bg-rose-50 text-rose-800 border border-rose-200';
    case 'HIGH_14D':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'MODERATE_30D':
      return 'bg-teal-50 text-teal-800 border border-teal-200';
    case 'ROUTINE_60D':
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
}

