import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Share2, 
  Send, 
  FileCheck, 
  FileText, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Globe, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Check,
  Building,
  AlertOctagon,
  Copy,
  UserCheck,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  MessageSquare,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { BlockedClosureModal } from './BlockedClosureModal';
import { 
  formatDate, 
  formatDateTime, 
  getScreeningLabel, 
  getUrgencyBadgeClasses, 
  getStageLabel,
  getStageIndex,
  getExceptionBadge,
  calculateDaysRemaining
} from '../../utils/formatters';
import { 
  WorkflowStage, 
  ClinicalUrgency, 
  ClosureEvidence, 
  Communication, 
  Referral,
  ExceptionStatus,
  AppointmentDetail,
  ClinicalNote
} from '../../types/careloop';

interface CaseDetailModalProps {
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ onClose }) => {
  const { 
    selectedCase, 
    patients, 
    communications, 
    referrals, 
    tasks,
    escalations, 
    auditEvents, 
    currentRole, 
    updateCaseStage, 
    reassignOwner,
    changeDueDate,
    recordClinicianReview,
    recordPatientNotification,
    recordPatientAcknowledgement,
    createReferral,
    recordReferralResponse,
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
    createEscalation 
  } = useCareLoop();

  if (!selectedCase) return null;

  const patient = patients.find(p => p.id === selectedCase.patientId);
  const caseComms = communications.filter(c => c.caseId === selectedCase.id);
  const caseReferrals = referrals.filter(r => r.caseId === selectedCase.id);
  const caseTasks = tasks.filter(t => t.caseId === selectedCase.id);
  const caseEscalations = escalations.filter(e => e.caseId === selectedCase.id);
  const caseAudits = auditEvents.filter(a => a.entityId === selectedCase.id || a.changeSummary.includes(selectedCase.id));

  const [activeTab, setActiveTab] = useState<'workspace' | 'timeline' | 'outreach' | 'referrals' | 'checklist' | 'notes' | 'audit'>('workspace');

  // Interactive Action Modals
  const [modalAction, setModalAction] = useState<
    'NONE' | 'REASSIGN_OWNER' | 'CHANGE_DUE_DATE' | 'RECORD_REVIEW' | 'RECORD_OUTCOME' | 
    'SET_EXCEPTION' | 'REOPEN_CASE' | 'NEW_TASK' | 'NEW_NOTE' | 'RECORD_APPT' | 'CONFIRM_CLOSE'
  >('NONE');

  // Form states
  const [reassignName, setReassignName] = useState(selectedCase.responsibleOwner);
  const [reassignOrg, setReassignOrg] = useState(selectedCase.assignedOrganization);
  const [reassignNote, setReassignNote] = useState('');

  const [newDueDateVal, setNewDueDateVal] = useState(selectedCase.dueDate.split('T')[0]);
  const [dueDateReason, setDueDateReason] = useState('Patient request / clinical scheduling coordination');

  const [reviewUrgency, setReviewUrgency] = useState<ClinicalUrgency>(selectedCase.clinicalUrgency);
  const [reviewNotes, setReviewNotes] = useState('Reviewed diagnostic findings. Concordant with protocol guidelines. Secondary diagnostic intervention indicated.');

  const [exceptionType, setExceptionType] = useState<ExceptionStatus>('ON_HOLD');
  const [exceptionReasonInput, setExceptionReasonInput] = useState('');

  const [reopenReason, setReopenReason] = useState('');
  const [reopenTargetStage, setReopenTargetStage] = useState<WorkflowStage>('AWAITING_OUTCOME_DOCUMENTATION');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<ClinicalNote['category']>('CLINICAL');

  const [apptStatus, setApptStatus] = useState<AppointmentDetail['status']>('CONFIRMED');
  const [apptDate, setApptDate] = useState('2026-11-04T09:00');
  const [apptFacility, setApptFacility] = useState('MetroHealth Endoscopy Center');
  const [apptProvider, setApptProvider] = useState('Dr. Kevin Patel, MD');
  const [apptNotes, setApptNotes] = useState('');

  const [outcomeFindings, setOutcomeFindings] = useState('Diagnostic procedure completed. Tubular adenoma x 2 completely resected with negative margins.');
  const [outcomeDocRef, setOutcomeDocRef] = useState(`DOC-PATH-${Math.floor(10000 + Math.random() * 90000)}`);
  const [outcomeSurveillance, setOutcomeSurveillance] = useState('Repeat surveillance colonoscopy in 3 years');
  const [outcomeNotes, setOutcomeNotes] = useState('Complete resection confirmed. No high-grade dysplasia.');
  const [showBlockedClosureModal, setShowBlockedClosureModal] = useState(false);

  // Notification / Feedback alert
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const isClosed = selectedCase.stage === 'CLOSED_WITH_EVIDENCE';
  const urgencyStyle = getUrgencyBadgeClasses(selectedCase.clinicalUrgency);
  const exceptionBadge = getExceptionBadge(selectedCase.exceptionStatus);
  const daysRemaining = calculateDaysRemaining(selectedCase.dueDate);

  // 13 Stages for progress tracker
  const ALL_STAGES: WorkflowStage[] = [
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

  const currentStageIndex = getStageIndex(selectedCase.stage);

  // Handlers
  const handleReassignOwner = (e: React.FormEvent) => {
    e.preventDefault();
    reassignOwner(selectedCase.id, reassignName, reassignOrg, reassignNote);
    setModalAction('NONE');
    showFeedback('success', `Case reallocated to ${reassignName} (${reassignOrg}).`);
  };

  const handleChangeDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    changeDueDate(selectedCase.id, new Date(newDueDateVal).toISOString(), dueDateReason);
    setModalAction('NONE');
    showFeedback('success', `Target due date updated to ${newDueDateVal}.`);
  };

  const handleRecordReview = (e: React.FormEvent) => {
    e.preventDefault();
    recordClinicianReview(selectedCase.id, reviewUrgency, reviewNotes);
    setModalAction('NONE');
    showFeedback('success', 'Clinician review recorded and urgency approved.');
  };

  const handleSetException = (e: React.FormEvent) => {
    e.preventDefault();
    setCaseException(selectedCase.id, exceptionType, exceptionReasonInput);
    setModalAction('NONE');
    showFeedback('success', `Exception status changed to [${exceptionType}].`);
  };

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    reopenCase(selectedCase.id, reopenReason, reopenTargetStage);
    setModalAction('NONE');
    showFeedback('success', `Case successfully reopened to ${getStageLabel(reopenTargetStage)}.`);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      caseId: selectedCase.id,
      patientName: selectedCase.patientName,
      title: taskTitle,
      owner: currentRole,
      dueDate: new Date(taskDue).toISOString(),
      priority: taskPriority,
    });
    setTaskTitle('');
    setModalAction('NONE');
    showFeedback('success', 'Task created successfully.');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    addClinicalNote(selectedCase.id, noteContent, noteCategory);
    setNoteContent('');
    setModalAction('NONE');
    showFeedback('success', 'Clinical note recorded to audit trail.');
  };

  const handleRecordAppt = (e: React.FormEvent) => {
    e.preventDefault();
    documentAppointmentStatus(selectedCase.id, {
      status: apptStatus,
      scheduledDate: new Date(apptDate).toISOString(),
      facility: apptFacility,
      provider: apptProvider,
      notes: apptNotes,
      attendanceVerifiedAt: apptStatus === 'ATTENDED' ? new Date().toISOString() : undefined,
    });
    setModalAction('NONE');
    showFeedback('success', `Appointment status recorded as [${apptStatus}].`);
  };

  const handleRecordOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    recordCareOutcome(selectedCase.id, {
      findings: outcomeFindings,
      surveillance: outcomeSurveillance,
      documentRef: outcomeDocRef,
      notes: outcomeNotes,
    });
    setModalAction('NONE');
    showFeedback('success', 'Care outcome and evidence document attached.');
  };

  const handleFinalClose = () => {
    const validation = validateCaseClosure(selectedCase.id);
    if (!validation.canClose) {
      setShowBlockedClosureModal(true);
      return;
    }

    const res = closeCaseWithAssurance(selectedCase.id, {
      type: 'PROCEDURE_REPORT',
      documentId: selectedCase.evidenceChecklist?.outcomeDocumentRef || `DOC-EVD-${Math.floor(10000 + Math.random() * 90000)}`,
      documentTitle: 'Final Diagnostic & Procedural Care Sign-off',
      completedAt: new Date().toISOString(),
      verifiedBy: currentRole,
      clinicalNotes: 'All clinical loop closure criteria satisfied per pathway protocol.',
      resectedOrNormalFinding: selectedCase.findingsSummary,
      nextRecommendedSurveillance: 'Protocol recall surveillance documented',
    });

    if (res.success) {
      setModalAction('NONE');
      showFeedback('success', 'Closed-Loop Care Confirmed! Case closed with verifiable evidence.');
    } else {
      showFeedback('error', res.error || 'Unable to close case.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Workspace Top Header & Breadcrumbs */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-400">Registry</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300 font-medium">{getScreeningLabel(selectedCase.screeningType)}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-teal-400 font-mono font-bold">{selectedCase.id}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-200 font-semibold">{selectedCase.patientName}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback / Alert Banner */}
        {feedbackMsg && (
          <div className={`px-5 py-2 text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 13-Stage Progress Stepper Strip */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between text-xs mb-1.5 min-w-[750px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Stage Progress:</span>
              <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {getStageLabel(selectedCase.stage)}
              </span>
              {exceptionBadge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${exceptionBadge.bg} ${exceptionBadge.text}`}>
                  {exceptionBadge.label}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Step {currentStageIndex + 1} of 13
            </div>
          </div>

          {/* Stepper bubbles */}
          <div className="flex items-center gap-1 min-w-[750px]">
            {ALL_STAGES.map((st, idx) => {
              const isPast = idx < currentStageIndex || isClosed;
              const isCurrent = idx === currentStageIndex && !isClosed;
              return (
                <button
                  key={st}
                  title={getStageLabel(st)}
                  onClick={() => updateCaseStage(selectedCase.id, st, `Manual progression to step ${idx + 1}`)}
                  className={`flex-1 py-1 px-1 rounded text-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                      : isPast
                        ? 'bg-teal-100 text-teal-900 hover:bg-teal-200'
                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[9px] font-mono leading-none">{idx + 1}</div>
                  <div className="text-[10px] truncate leading-tight font-medium">
                    {st.split('_')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blockers & Exception Alert Banner (if any) */}
        {((selectedCase.blockers && selectedCase.blockers.length > 0) || selectedCase.exceptionStatus !== 'NONE') && !isClosed && (
          <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-amber-950">
                <strong className="font-semibold">Active Blocker / Exception: </strong>
                <span>
                  {selectedCase.exceptionStatus !== 'NONE' 
                    ? `[${selectedCase.exceptionStatus}] ${selectedCase.exceptionReason || ''}` 
                    : selectedCase.blockers?.[0]}
                </span>
              </div>
            </div>
            <button
              onClick={() => setModalAction('SET_EXCEPTION')}
              className="px-2 py-0.5 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300"
            >
              Update Exception
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-2 border-b border-slate-200 bg-white flex items-center gap-4 text-xs overflow-x-auto">
          {[
            { id: 'workspace', label: 'Case Workspace' },
            { id: 'timeline', label: 'Chronological Timeline' },
            { id: 'checklist', label: 'Evidence Checklist' },
            { id: 'outreach', label: `Outreach (${caseComms.length})` },
            { id: 'referrals', label: `Referral & Appt (${caseReferrals.length})` },
            { id: 'notes', label: `Tasks & Notes (${caseTasks.length + (selectedCase.notes?.length || 0)})` },
            { id: 'audit', label: `Audit Trail (${caseAudits.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 font-bold transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          
          {/* TAB 1: CASE WORKSPACE */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Patient Summary */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient Summary
                    </span>
                    <span className="text-xs font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {selectedCase.mrn}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedCase.patientName}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>DOB: {patient?.dob || '1975-01-01'} ({selectedCase.patientAge}y, {selectedCase.patientGender})</div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span>Language: <strong>{patient?.preferredLanguage || 'English'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{patient?.phone || '(555) 000-0000'}</span>
                    </div>
                    <div className="text-[11px] text-teal-800 bg-teal-50/60 p-1 rounded font-medium">
                      Safe Contact: {patient?.safeContactPreference.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Screening & Laboratory Finding */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actionable Diagnostic Result
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Received: {formatDateTime(selectedCase.receivedDate)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {selectedCase.testName}
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 leading-relaxed">
                    {selectedCase.rawReportSnippet}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Facility: {selectedCase.performingFacility}</span>
                    <span>Ordering MD: {selectedCase.orderingPhysician}</span>
                  </div>
                </div>
              </div>

              {/* Responsible Owner, Next Action & Urgency Strip */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                      <span className={`w-2 h-2 rounded-full ${urgencyStyle.dot}`} />
                      {urgencyStyle.label}
                    </span>
                    <span className="text-xs text-slate-600">
                      Signer: <strong>{selectedCase.urgencyApprovedBy}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalAction('RECORD_REVIEW')}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 cursor-pointer"
                    >
                      Record Clinician Review
                    </button>
                    <button
                      onClick={() => setModalAction('SET_EXCEPTION')}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                    >
                      Set Exception Status
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      <span>Responsible Case Owner</span>
                      <button 
                        onClick={() => setModalAction('REASSIGN_OWNER')}
                        className="text-teal-700 hover:underline cursor-pointer"
                      >
                        Reassign
                      </button>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedCase.responsibleOwner}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedCase.assignedOrganization}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      <span>Next Action & Target Due Date</span>
                      <button 
                        onClick={() => setModalAction('CHANGE_DUE_DATE')}
                        className="text-teal-700 hover:underline cursor-pointer"
                      >
                        Change Due Date
                      </button>
                    </div>
                    <div className="font-semibold text-slate-900">
                      {selectedCase.nextAction}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      <span className="font-mono text-slate-600">Due: {formatDate(selectedCase.dueDate)}</span>
                      {!isClosed && (
                        <span className={`font-semibold ${daysRemaining < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {daysRemaining < 0 ? `(${Math.abs(daysRemaining)}d overdue)` : `(${daysRemaining}d remaining)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Dock */}
              <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lifecycle Transition Actions
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('outreach')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs cursor-pointer"
                  >
                    ✉ Patient Outreach
                  </button>

                  <button
                    onClick={() => recordPatientAcknowledgement(selectedCase.id, undefined, 'Portal Confirmation Form')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs cursor-pointer"
                  >
                    ✓ Record Patient Ack
                  </button>

                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs cursor-pointer"
                  >
                    → Dispatch Referral
                  </button>

                  <button
                    onClick={() => setModalAction('RECORD_APPT')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs cursor-pointer"
                  >
                    📅 Document Appt Status
                  </button>

                  <button
                    onClick={() => setModalAction('RECORD_OUTCOME')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs cursor-pointer"
                  >
                    📄 Record Care Outcome
                  </button>

                  {!isClosed ? (
                    <button
                      onClick={handleFinalClose}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Close with Evidence</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setModalAction('REOPEN_CASE')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen Case</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHRONOLOGICAL EVENT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Chronological Care Journey & Audit Timeline
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {caseAudits.length} events logged
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {caseAudits.map((event, idx) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-2xs" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{event.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(event.timestamp)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 rounded">
                          {event.actor}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed font-sans">
                        {event.changeSummary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE CHECKLIST & CLOSURE CRITERIA */}
          {activeTab === 'checklist' && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Closed-Loop Completion Criteria Checklist
                  </h3>
                  <p className="text-xs text-slate-500">
                    A case cannot be closed simply because a notification or referral was created. All verifiable criteria must be satisfied.
                  </p>
                </div>

                {!isClosed && (
                  <button
                    onClick={handleFinalClose}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Close Case</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {validateCaseClosure(selectedCase.id).checklist.map(item => (
                  <div 
                    key={item.key} 
                    className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
                      item.isComplete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {item.isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`text-xs font-bold ${item.isComplete ? 'text-emerald-950' : 'text-slate-800'}`}>
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {!item.isComplete && !isClosed && (
                      <button
                        onClick={() => {
                          if (item.key === 'clinicianReviewCompleted') setModalAction('RECORD_REVIEW');
                          else if (item.key === 'patientNotified' || item.key === 'patientAcknowledged') setActiveTab('outreach');
                          else if (item.key === 'referralAccepted' || item.key === 'diagnosticConfirmationCompleted') setActiveTab('referrals');
                          else if (item.key === 'outcomeDocumented' || item.key === 'carePlanDocumented') setModalAction('RECORD_OUTCOME');
                          else handleFinalClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-white border border-teal-200 hover:bg-teal-50 rounded shadow-2xs cursor-pointer shrink-0"
                      >
                        Action Item
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OUTREACH & NOTIFICATIONS */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Patient Communication Log & Acknowledgement
                </h3>
                <button
                  onClick={() => recordPatientAcknowledgement(selectedCase.id, undefined, 'Direct Phone Confirmation')}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200"
                >
                  Record Direct Patient Ack
                </button>
              </div>

              {caseComms.length === 0 ? (
                <div className="bg-white p-6 rounded-lg text-center text-xs text-slate-400 border border-slate-200">
                  No outreach dispatched yet for this case.
                </div>
              ) : (
                caseComms.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{c.channel}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({c.recipientContact})</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600">{c.language}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.acknowledgementStatus === 'ACKNOWLEDGED' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {c.acknowledgementStatus}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-slate-800">{c.messageTitle}</div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 font-sans leading-relaxed">
                      {c.messageContent}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Dispatched by {c.sentBy} at {formatDateTime(c.sentAt)}</span>
                      {c.acknowledgedAt && (
                        <span className="text-emerald-700 font-semibold">
                          Confirmed: {formatDateTime(c.acknowledgedAt)} ({c.acknowledgedMethod})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: REFERRALS & APPOINTMENTS */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Specialist Referral & Encounter Details
                </h3>
                <button
                  onClick={() => setModalAction('RECORD_APPT')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
                >
                  Document Appointment Status
                </button>
              </div>

              {caseReferrals.map(r => (
                <div key={r.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{r.id}</span>
                      <h4 className="font-bold text-xs text-slate-900">{r.specialty} — {r.receivingProvider}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {r.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Facility: {r.receivingFacility}</div>
                    <div>Indication: {r.reason}</div>
                    {r.appointmentDate && (
                      <div className="text-teal-800 font-semibold">
                        Scheduled Slot: {formatDateTime(r.appointmentDate)}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {r.status !== 'ACCEPTED' && r.status !== 'COMPLETED' && (
                      <button
                        onClick={() => recordReferralResponse(r.id, 'ACCEPTED', 'Specialty clinic confirmed triage acceptance.')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                      >
                        Accept Referral
                      </button>
                    )}
                    {r.status !== 'REJECTED' && r.status !== 'COMPLETED' && (
                      <button
                        onClick={() => recordReferralResponse(r.id, 'REJECTED', 'Capacity exceeded / Out of clinical scope')}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      >
                        Record Rejection
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {selectedCase.appointmentDetail && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-500">
                    Recorded Procedure Appointment
                  </div>
                  <div className="text-xs text-slate-800">
                    Status: <strong className="text-teal-800">{selectedCase.appointmentDetail.status}</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: {formatDateTime(selectedCase.appointmentDetail.scheduledDate)}
                  </div>
                  <div className="text-xs text-slate-600">
                    Facility: {selectedCase.appointmentDetail.facility}
                  </div>
                  {selectedCase.appointmentDetail.notes && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                      Note: {selectedCase.appointmentDetail.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TASKS & CLINICAL NOTES */}
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tasks List */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase text-slate-700">Action Tasks ({caseTasks.length})</h4>
                  <button
                    onClick={() => setModalAction('NEW_TASK')}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    + Add Task
                  </button>
                </div>

                <div className="space-y-2">
                  {caseTasks.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">No open tasks for this case.</div>
                  ) : (
                    caseTasks.map(t => (
                      <div 
                        key={t.id}
                        className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${
                          t.status === 'COMPLETED' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.status === 'COMPLETED'}
                          onChange={() => toggleTask(t.id, 'Task verified')}
                          className="mt-0.5 rounded text-teal-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className={`font-semibold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {t.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Owner: {t.owner} · Due {formatDate(t.dueDate)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Clinical Notes Feed */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase text-slate-700">Clinical & Admin Notes ({selectedCase.notes?.length || 0})</h4>
                  <button
                    onClick={() => setModalAction('NEW_NOTE')}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    + Add Note
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {!selectedCase.notes || selectedCase.notes.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">No clinical notes recorded yet.</div>
                  ) : (
                    selectedCase.notes.map(note => (
                      <div key={note.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-700">{note.author} ({note.role})</span>
                          <span className="font-mono">{formatDateTime(note.timestamp)}</span>
                        </div>
                        <p className="text-slate-700 leading-snug">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT HISTORY */}
          {activeTab === 'audit' && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-700">Immutable Audit Trail for {selectedCase.id}</h4>
                <span className="text-xs text-slate-400 font-mono">{caseAudits.length} recorded entries</span>
              </div>

              <div className="divide-y divide-slate-100">
                {caseAudits.map(a => (
                  <div key={a.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{a.action}</div>
                      <div className="text-slate-600 mt-0.5 text-[11px]">{a.changeSummary}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Actor: {a.actor} ({a.actorRole})
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(a.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            Case: {selectedCase.id} · MRN: {selectedCase.mrn} · Stage: {selectedCase.stage}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </div>

      {/* ACTION DIALOG MODALS */}

      {/* 1. Reassign Owner Modal */}
      {modalAction === 'REASSIGN_OWNER' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleReassignOwner} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Reassign Case Owner & Organization</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">New Responsible Owner</label>
              <input
                type="text"
                required
                value={reassignName}
                onChange={(e) => setReassignName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Organization</label>
              <input
                type="text"
                required
                value={reassignOrg}
                onChange={(e) => setReassignOrg(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Reallocation Rationale</label>
              <textarea
                rows={2}
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
                placeholder="Reason for owner handoff..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded">Confirm Reassignment</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Change Due Date Modal */}
      {modalAction === 'CHANGE_DUE_DATE' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleChangeDueDate} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Adjust Target Due Date</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">New Due Date</label>
              <input
                type="date"
                required
                value={newDueDateVal}
                onChange={(e) => setNewDueDateVal(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Documented Reason</label>
              <textarea
                rows={2}
                required
                value={dueDateReason}
                onChange={(e) => setDueDateReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded">Update Due Date</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Record Clinician Review Modal */}
      {modalAction === 'RECORD_REVIEW' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleRecordReview} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Record Clinician Urgency Review</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Approved Urgency</label>
              <select
                value={reviewUrgency}
                onChange={(e) => setReviewUrgency(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold"
              >
                <option value="CRITICAL_72H">Critical (72h SLA)</option>
                <option value="HIGH_14D">High (14d SLA)</option>
                <option value="MODERATE_30D">Moderate (30d SLA)</option>
                <option value="ROUTINE_60D">Routine (60d SLA)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Clinical Recommendations</label>
              <textarea
                rows={3}
                required
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              Signer: <strong>{currentRole}</strong> (Digitally authenticated)
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded">Confirm Review Sign-off</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Set Exception Status Modal */}
      {modalAction === 'SET_EXCEPTION' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleSetException} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Manage Exception Status</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Exception Flag</label>
              <select
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-semibold"
              >
                <option value="NONE">NONE (Standard Pathway)</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="UNABLE_TO_CONTACT">UNABLE TO CONTACT</option>
                <option value="REFERRAL_REJECTED">REFERRAL REJECTED</option>
                <option value="APPOINTMENT_MISSED">APPOINTMENT MISSED</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Clinical Rationale</label>
              <textarea
                rows={2}
                value={exceptionReasonInput}
                onChange={(e) => setExceptionReasonInput(e.target.value)}
                placeholder="Document cause for exception status..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded">Save Status</button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Document Appointment Modal */}
      {modalAction === 'RECORD_APPT' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleRecordAppt} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Document Procedure / Appointment Encounter</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Encounter Status</label>
              <select
                value={apptStatus}
                onChange={(e) => setApptStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-bold"
              >
                <option value="CONFIRMED">CONFIRMED (Upcoming)</option>
                <option value="ATTENDED">ATTENDED (Procedure Completed)</option>
                <option value="MISSED">MISSED / NO-SHOW</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Facility / Suite</label>
              <input
                type="text"
                value={apptFacility}
                onChange={(e) => setApptFacility(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Encounter Notes</label>
              <textarea
                rows={2}
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                placeholder="Clinical encounter summary..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded">Save Appointment</button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Record Outcome Modal */}
      {modalAction === 'RECORD_OUTCOME' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleRecordOutcome} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Record Diagnostic Care Outcome</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Diagnostic / Histopathology Finding</label>
              <input
                type="text"
                required
                value={outcomeFindings}
                onChange={(e) => setOutcomeFindings(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Document Reference Number</label>
              <input
                type="text"
                required
                value={outcomeDocRef}
                onChange={(e) => setOutcomeDocRef(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Recommended Recall Surveillance</label>
              <input
                type="text"
                required
                value={outcomeSurveillance}
                onChange={(e) => setOutcomeSurveillance(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded">Attach Outcome</button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Reopen Case Modal */}
      {modalAction === 'REOPEN_CASE' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleReopen} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Reopen Closed Care Pathway</h3>
            <p className="text-slate-600 text-xs">
              Requires clinical justification. The case will be marked with the REOPENED exception status and restored to active tracking.
            </p>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Target Workflow Stage</label>
              <select
                value={reopenTargetStage}
                onChange={(e) => setReopenTargetStage(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              >
                <option value="AWAITING_OUTCOME_DOCUMENTATION">11. Awaiting outcome documentation</option>
                <option value="READY_FOR_CLOSURE">12. Ready for closure</option>
                <option value="CONFIRMATION_OR_CONSULTATION_PENDING">7. Confirmation or consultation pending</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Clinical Justification</label>
              <textarea
                rows={3}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Reason for reopening (e.g. new clinical symptoms reported, discordant pathology)..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-blue-700 rounded">Confirm Reopen</button>
            </div>
          </form>
        </div>
      )}

      {/* 8. Add Task Modal */}
      {modalAction === 'NEW_TASK' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleCreateTask} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create Care Coordination Task</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Task Action</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Coordinate interpreter for telephonic pre-op instructions..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="URGENT">URGENT</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-slate-900 rounded">Create Task</button>
            </div>
          </form>
        </div>
      )}

      {/* 9. Add Note Modal */}
      {modalAction === 'NEW_NOTE' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <form onSubmit={handleAddNote} className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Timestamped Clinical / Admin Note</h3>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Category</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              >
                <option value="CLINICAL">Clinical Note</option>
                <option value="COMMUNICATION">Communication Encounter</option>
                <option value="BARRIER">Care Barrier / Transport Issue</option>
                <option value="ADMINISTRATIVE">Administrative</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Note Content</label>
              <textarea
                rows={3}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter clinical encounter note..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setModalAction('NONE')} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded">Save Note</button>
            </div>
          </form>
        </div>
      )}

      {/* Blocked Closure Modal */}
      {showBlockedClosureModal && (
        <BlockedClosureModal
          screeningCase={selectedCase}
          onClose={() => setShowBlockedClosureModal(false)}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            setShowBlockedClosureModal(false);
          }}
          onCompleteItem={(actionType) => {
            setShowBlockedClosureModal(false);
            if (actionType === 'clinicianReviewCompleted') {
              setModalAction('RECORD_REVIEW');
            } else if (actionType === 'patientNotified' || actionType === 'patientAcknowledged') {
              setActiveTab('outreach');
            } else if (actionType === 'referralAccepted' || actionType === 'diagnosticConfirmationCompleted') {
              setActiveTab('referrals');
            } else if (actionType === 'outcomeDocumented' || actionType === 'carePlanDocumented') {
              setModalAction('RECORD_OUTCOME');
            } else {
              setActiveTab('checklist');
            }
          }}
          onClosureSuccess={() => {
            showFeedback('success', 'Case closed under documented clinical exception.');
          }}
        />
      )}

    </div>
  );
};
