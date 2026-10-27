import React, { useState } from 'react';
import { 
  Share2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building, 
  User, 
  Plus, 
  Search, 
  ArrowUpRight,
  Filter,
  Check,
  AlertTriangle,
  X,
  FileText,
  AlertOctagon,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { formatDate, formatDateTime, getScreeningLabel, getUrgencyBadgeClasses } from '../../utils/formatters';
import { Referral, ReferralStatus, ProviderDirectoryEntry, SupportingInfoItem } from '../../types/careloop';

export const ReferralManager: React.FC = () => {
  const { 
    referrals, 
    cases, 
    patients, 
    providerDirectory,
    currentRole,
    permissions,
    createStructuredReferral,
    transitionReferralState,
    requestReferralInformation,
    reassignReferralAction,
    executeReferralRejectionRecovery,
    setSelectedCaseId 
  } = useCareLoop();

  // Filters & Views
  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST'>('BOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [selectedReferralForTimeline, setSelectedReferralForTimeline] = useState<Referral | null>(null);
  const [rejectingReferralId, setRejectingReferralId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [requestInfoReferralId, setRequestInfoReferralId] = useState<string | null>(null);
  const [requestedInfoInput, setRequestedInfoInput] = useState('');
  const [demoBannerMsg, setDemoBannerMsg] = useState<string | null>(null);

  // New Structured Referral Form
  const [newCaseId, setNewCaseId] = useState(cases[0]?.id || '');
  const [selectedProviderId, setSelectedProviderId] = useState(providerDirectory[0]?.id || '');
  const [referralPurpose, setReferralPurpose] = useState('Diagnostic Colonoscopy with Polypectomy Prep');
  const [referralReason, setReferralReason] = useState('Diagnostic intervention following positive screening finding');
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'ROUTINE'>('HIGH');
  const [duplicateOverrideReason, setDuplicateOverrideReason] = useState('');
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);

  // Helper: check if referral is overdue for response
  const isReferralOverdue = (r: Referral): boolean => {
    if (r.status === 'COMPLETED' || r.status === 'REJECTED') return false;
    const deadline = r.expectedResponseDeadline || r.responseDeadline || r.dueDate;
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  // Filtered referrals list
  const filteredReferrals = referrals.filter(r => {
    if (providerFilter !== 'ALL' && r.receivingProvider !== providerFilter) return false;
    if (facilityFilter !== 'ALL' && r.receivingFacility !== facilityFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (ownerFilter !== 'ALL' && (r.responsibleOwner !== ownerFilter && r.assignedCoordinator !== ownerFilter)) return false;
    if (overdueOnly && !isReferralOverdue(r)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.receivingProvider.toLowerCase().includes(q) ||
        r.receivingFacility.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.purpose && r.purpose.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Providers & Facilities for filters
  const allProviders = Array.from(new Set(referrals.map(r => r.receivingProvider)));
  const allFacilities = Array.from(new Set(referrals.map(r => r.receivingFacility)));
  const allOwners = Array.from(new Set(referrals.map(r => r.responsibleOwner || r.assignedCoordinator || 'Unassigned')));

  // 7 Coordination Board Columns
  const boardColumns = [
    {
      id: 'AWAITING_ACCEPTANCE',
      title: '1. Awaiting Provider Acceptance',
      description: 'Submitted or draft handoffs awaiting specialist triage review',
      count: filteredReferrals.filter(r => ['DRAFT', 'READY_FOR_REVIEW', 'SUBMITTED', 'AWAITING_ACCEPTANCE', 'TRANSMITTED', 'DRAFTED'].includes(r.status)).length,
      items: filteredReferrals.filter(r => ['DRAFT', 'READY_FOR_REVIEW', 'SUBMITTED', 'AWAITING_ACCEPTANCE', 'TRANSMITTED', 'DRAFTED'].includes(r.status)),
      headerColor: 'border-blue-400 bg-blue-50/60 text-blue-900',
    },
    {
      id: 'REJECTED',
      title: '2. Rejected (Action Required)',
      description: 'Rejected by receiving specialist; case active with reassessment task',
      count: filteredReferrals.filter(r => r.status === 'REJECTED').length,
      items: filteredReferrals.filter(r => r.status === 'REJECTED'),
      headerColor: 'border-rose-400 bg-rose-50/60 text-rose-900',
    },
    {
      id: 'INFORMATION_REQUESTED',
      title: '3. Missing Info Requested',
      description: 'Receiving clinic requested additional tests, images, or history',
      count: filteredReferrals.filter(r => r.status === 'INFORMATION_REQUESTED').length,
      items: filteredReferrals.filter(r => r.status === 'INFORMATION_REQUESTED'),
      headerColor: 'border-amber-400 bg-amber-50/60 text-amber-900',
    },
    {
      id: 'APPOINTMENT_PENDING',
      title: '4. Appointments Not Yet Scheduled',
      description: 'Referral accepted by clinic; booking slot pending coordination',
      count: filteredReferrals.filter(r => r.status === 'ACCEPTED' || r.status === 'APPOINTMENT_PENDING').length,
      items: filteredReferrals.filter(r => r.status === 'ACCEPTED' || r.status === 'APPOINTMENT_PENDING'),
      headerColor: 'border-indigo-400 bg-indigo-50/60 text-indigo-900',
    },
    {
      id: 'MISSED_APPOINTMENT',
      title: '5. Missed Appointments',
      description: 'Patient no-show; immediate callback and reschedule required',
      count: filteredReferrals.filter(r => {
        const linkedCase = cases.find(c => c.id === r.caseId);
        return linkedCase?.exceptionStatus === 'APPOINTMENT_MISSED' || r.consultationNotes?.toLowerCase().includes('missed') || r.consultationNotes?.toLowerCase().includes('no-show');
      }).length,
      items: filteredReferrals.filter(r => {
        const linkedCase = cases.find(c => c.id === r.caseId);
        return linkedCase?.exceptionStatus === 'APPOINTMENT_MISSED' || r.consultationNotes?.toLowerCase().includes('missed') || r.consultationNotes?.toLowerCase().includes('no-show');
      }),
      headerColor: 'border-orange-400 bg-orange-50/60 text-orange-900',
    },
    {
      id: 'CONSULTATION_COMPLETED',
      title: '6. Consult Completed (Outcome Pending)',
      description: 'Procedure performed; awaiting formal operative or pathology note',
      count: filteredReferrals.filter(r => r.status === 'CONSULTATION_COMPLETED' || r.status === 'OUTCOME_PENDING').length,
      items: filteredReferrals.filter(r => r.status === 'CONSULTATION_COMPLETED' || r.status === 'OUTCOME_PENDING'),
      headerColor: 'border-purple-400 bg-purple-50/60 text-purple-900',
    },
    {
      id: 'OVERDUE_HANDOFFS',
      title: '7. Overdue Handoffs',
      description: 'Past expected response deadline without documented acceptance',
      count: filteredReferrals.filter(r => isReferralOverdue(r)).length,
      items: filteredReferrals.filter(r => isReferralOverdue(r)),
      headerColor: 'border-red-500 bg-red-100/70 text-red-950 font-bold',
    }
  ];

  // Handle Create Referral Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrorMessage(null);

    const targetCase = cases.find(c => c.id === newCaseId);
    if (!targetCase) return;

    const provider = providerDirectory.find(p => p.id === selectedProviderId) || providerDirectory[0];

    const res = createStructuredReferral({
      caseId: targetCase.id,
      patientId: targetCase.patientId,
      patientName: targetCase.patientName,
      referringProvider: targetCase.orderingPhysician || currentRole,
      referringOrg: targetCase.assignedOrganization || 'CareLoop Health Network',
      receivingProvider: provider.name,
      receivingFacility: provider.facility,
      specialty: provider.specialty,
      reason: referralReason,
      purpose: referralPurpose,
      priority,
      status: 'SUBMITTED',
      assignedCoordinator: 'Maria Ramos, RN',
      responsibleOwner: provider.name,
      nextAction: `Electronic referral submitted to ${provider.name}. Awaiting triage acceptance.`,
      duplicateOverrideJustification: duplicateOverrideReason.trim() || undefined,
    });

    if (res.success) {
      setShowCreateModal(false);
      setDuplicateOverrideReason('');
      setDemoBannerMsg(`Referral ${res.referralId} successfully transmitted to ${provider.name}!`);
      setTimeout(() => setDemoBannerMsg(null), 5000);
    } else {
      setCreateErrorMessage(res.error || 'Failed to dispatch referral.');
    }
  };

  // Handle Reject Submission
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReferralId || !rejectionReasonInput.trim()) return;

    transitionReferralState(
      rejectingReferralId,
      'REJECTED',
      rejectionReasonInput,
      { rejectionReason: rejectionReasonInput }
    );

    setRejectingReferralId(null);
    setRejectionReasonInput('');
    setDemoBannerMsg('Referral rejected. Case remains visible in active registry and clinician reassessment task was generated.');
    setTimeout(() => setDemoBannerMsg(null), 5000);
  };

  // Handle Request Info Submission
  const handleRequestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestInfoReferralId || !requestedInfoInput.trim()) return;

    requestReferralInformation(requestInfoReferralId, requestedInfoInput);
    setRequestInfoReferralId(null);
    setRequestedInfoInput('');
    setDemoBannerMsg('Information request dispatched to Care Coordinator with action task.');
    setTimeout(() => setDemoBannerMsg(null), 5000);
  };

  // Trigger Demo Rejection Recovery Flow
  const handleTriggerRejectionRecoveryDemo = () => {
    // Find rejected referral REF-005 or first rejected
    const targetRef = referrals.find(r => r.status === 'REJECTED') || referrals[0];
    executeReferralRejectionRecovery(targetRef.id, 'PROV-005');
    setDemoBannerMsg(`Demo Flow Executed: Referral ${targetRef.id} rejection managed without closing case; replacement referral accepted and completed!`);
    setTimeout(() => setDemoBannerMsg(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Referral Coordination & Specialist Handoff Board
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Closed-Loop Protocol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized electronic handoffs between primary care screening centers, specialty clinics, and diagnostic suites.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDirectoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Provider Directory ({providerDirectory.length})</span>
          </button>

          <button
            onClick={handleTriggerRejectionRecoveryDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md shadow-2xs cursor-pointer transition-colors"
            title="Demonstrates rejection handling where case stays active, coordinator reassigns, and new referral completes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Demo: Rejection Recovery Flow</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Structured Referral</span>
          </button>
        </div>
      </div>

      {/* Demo Alert Feedback Banner */}
      {demoBannerMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{demoBannerMsg}</span>
          </div>
          <button onClick={() => setDemoBannerMsg(null)} className="text-teal-600 hover:text-teal-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Closed-Loop Safeguards Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-lg border border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Closed-Loop Safeguards Active
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Submission ≠ Acceptance · Acceptance ≠ Attendance · Attendance ≠ Loop Closure. A rejected referral never disappears from the active case queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
              Active Referrals: <strong>{referrals.filter(r => r.status !== 'COMPLETED').length}</strong>
            </span>
            <span className="text-[11px] text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
              Overdue Handoffs: <strong>{referrals.filter(isReferralOverdue).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search referrals..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
          >
            <option value="ALL">All Receiving Specialists</option>
            {allProviders.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
          >
            <option value="ALL">All Receiving Facilities</option>
            {allFacilities.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="AWAITING_ACCEPTANCE">Awaiting Acceptance</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="INFORMATION_REQUESTED">Info Requested</option>
            <option value="APPOINTMENT_SCHEDULED">Appointment Scheduled</option>
            <option value="CONSULTATION_COMPLETED">Consultation Completed</option>
            <option value="COMPLETED">Loop Completed</option>
          </select>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs font-semibold">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Overdue Handoffs Only</span>
            </label>

            <div className="flex items-center border border-slate-200 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('BOARD')}
                className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  viewMode === 'BOARD' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7-COLUMN COORDINATION BOARD VIEW */}
      {viewMode === 'BOARD' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-3.5 min-w-[1700px]">
            {boardColumns.map(col => (
              <div 
                key={col.id} 
                className="w-64 shrink-0 bg-slate-100/70 rounded-lg border border-slate-200 flex flex-col max-h-[750px]"
              >
                {/* Column Header */}
                <div className={`p-2.5 rounded-t-lg border-b text-xs ${col.headerColor}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate" title={col.title}>{col.title}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-slate-900 border shadow-2xs">
                      {col.count}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5 line-clamp-1" title={col.description}>
                    {col.description}
                  </p>
                </div>

                {/* Column Body Cards */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {col.items.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 italic bg-white/50 rounded border border-dashed border-slate-200">
                      No referrals in this stage
                    </div>
                  ) : (
                    col.items.map(r => {
                      const isOverdue = isReferralOverdue(r);
                      const priorityColor = r.priority === 'URGENT' 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : r.priority === 'HIGH' 
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <div 
                          key={r.id} 
                          className={`bg-white p-3 rounded-lg border shadow-2xs space-y-2 hover:border-teal-400 transition-colors ${
                            isOverdue ? 'border-red-300 ring-1 ring-red-400 bg-red-50/20' : 'border-slate-200'
                          }`}
                        >
                          {/* Card Top: ID & Priority */}
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <button
                              onClick={() => setSelectedCaseId(r.caseId)}
                              className="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{r.id}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityColor}`}>
                              {r.priority}
                            </span>
                          </div>

                          {/* Patient and Specialist */}
                          <div>
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {r.patientName}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate mt-0.5">
                              To: <strong>{r.receivingProvider}</strong>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {r.receivingFacility}
                            </div>
                          </div>

                          {/* Reason or Purpose */}
                          <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="font-semibold text-slate-900 block truncate">
                              {r.purpose || r.specialty}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                              {r.reason}
                            </span>
                          </div>

                          {/* Rejection / Request Reason Banner if present */}
                          {r.status === 'REJECTED' && r.rejectionReason && (
                            <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-900 font-semibold leading-tight">
                              Rejection: {r.rejectionReason}
                            </div>
                          )}

                          {/* Next Action & Responsible Owner */}
                          <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                            <div className="truncate">
                              Owner: <span className="font-medium text-slate-700">{r.responsibleOwner || r.assignedCoordinator}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={isOverdue ? 'text-red-700 font-bold' : 'text-slate-500'}>
                                Due: {formatDate(r.expectedResponseDeadline || r.dueDate)}
                              </span>
                              {r.supportingInfoChecklist && (
                                <span className="text-slate-400 font-mono text-[9px]">
                                  {r.supportingInfoChecklist.filter(i => i.isAttached).length}/{r.supportingInfoChecklist.length} Attachments
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="pt-1.5 flex items-center justify-between gap-1 border-t border-slate-100">
                            <button
                              onClick={() => setSelectedReferralForTimeline(r)}
                              className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Timeline ({r.handoffTimeline?.length || 1})</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            {/* State-specific fast actions */}
                            {['SUBMITTED', 'AWAITING_ACCEPTANCE', 'TRANSMITTED'].includes(r.status) && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => transitionReferralState(r.id, 'ACCEPTED', 'Accepted by specialist triage desk.')}
                                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  title="Accept Referral"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => setRejectingReferralId(r.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  title="Reject Referral with Reason"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => setRequestInfoReferralId(r.id)}
                                  className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  title="Request Information"
                                >
                                  Info?
                                </button>
                              </div>
                            )}

                            {r.status === 'REJECTED' && (
                              <button
                                onClick={() => executeReferralRejectionRecovery(r.id, 'PROV-005')}
                                className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Re-route
                              </button>
                            )}

                            {['ACCEPTED', 'APPOINTMENT_PENDING'].includes(r.status) && (
                              <button
                                onClick={() => transitionReferralState(r.id, 'APPOINTMENT_SCHEDULED', 'Appointment scheduled with patient.', { appointmentDate: new Date(Date.now() + 7 * 86400000).toISOString() })}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Schedule
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST / TABLE VIEW */}
      {viewMode === 'LIST' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Referral ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Specialist & Facility</th>
                  <th className="p-3">Purpose & Reason</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Due / Overdue</th>
                  <th className="p-3">Responsible Owner</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReferrals.map(r => {
                  const isOverdue = isReferralOverdue(r);
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-teal-700">
                        <button onClick={() => setSelectedCaseId(r.caseId)} className="hover:underline">
                          {r.id}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{r.patientName}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{r.receivingProvider}</div>
                        <div className="text-[10px] text-slate-400">{r.receivingFacility}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{r.purpose || r.specialty}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{r.reason}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.priority === 'URGENT' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs ${isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                          {formatDate(r.expectedResponseDeadline || r.dueDate)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{r.responsibleOwner || r.assignedCoordinator}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedReferralForTimeline(r)}
                          className="px-2 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded cursor-pointer"
                        >
                          Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SYNTHETIC PROVIDER DIRECTORY */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Synthetic Specialist & Diagnostic Provider Directory
                </h2>
              </div>
              <button onClick={() => setShowDirectoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Synthetic Notice:</strong> All listed specialty providers and clinics are simulated entries for demonstration. No real-world referrals or private health disclosures are executed.
              </span>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {providerDirectory.map(prov => (
                <div key={prov.id} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-teal-400 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{prov.name}</span>
                      <span className="text-xs text-teal-700 font-semibold ml-2">· {prov.specialty}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start">
                      Accepting E-Referrals (Turnaround ~{prov.turnaroundDays}d)
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    <div><strong>Facility:</strong> {prov.facility}</div>
                    <div><strong>Address:</strong> {prov.address}</div>
                    <div><strong>Hours:</strong> {prov.operatingHours}</div>
                    <div><strong>Contact:</strong> {prov.phone} · {prov.email}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Supported Pathways: <strong>{prov.supportedReferralTypes.join(', ')}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProviderId(prov.id);
                        setShowDirectoryModal(false);
                        setShowCreateModal(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-2xs cursor-pointer"
                    >
                      Select For Referral
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW STRUCTURED REFERRAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Create Structured Specialist Referral
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {createErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Closed-Loop Safeguard Alert</span>
                  </div>
                  <p className="text-[11px] font-normal leading-relaxed">{createErrorMessage}</p>
                </div>
              )}

              {/* Linked Case */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Linked Active Case <span className="text-rose-600">*</span>
                </label>
                <select
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-900"
                >
                  {cases.filter(c => c.stage !== 'CLOSED_WITH_EVIDENCE').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.patientName} ({getScreeningLabel(c.screeningType)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Receiving Provider Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Receiving Specialist & Facility (Synthetic Directory) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-900"
                >
                  {providerDirectory.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.specialty} ({p.facility})
                    </option>
                  ))}
                </select>
              </div>

              {/* Referral Purpose */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Referral Purpose / Procedure Category <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={referralPurpose}
                  onChange={(e) => setReferralPurpose(e.target.value)}
                  placeholder="e.g. Diagnostic Colonoscopy with Polypectomy Prep"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>

              {/* Referral Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Clinician-Approved Referral Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>

              {/* Priority / Expected Deadline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Clinical Priority & Expected Response Deadline
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['URGENT', 'HIGH', 'ROUTINE'] as const).map(p => (
                    <label 
                      key={p} 
                      className={`p-2 rounded border text-center cursor-pointer font-bold ${
                        priority === p ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="sr-only"
                      />
                      <span>{p}</span>
                      <span className="block text-[9px] font-normal opacity-80">
                        {p === 'URGENT' ? '24h SLA' : p === 'HIGH' ? '48h SLA' : '72h SLA'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duplicate Override Justification (if applicable) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Duplicate Override Rationale (Optional unless active referral exists)
                </label>
                <input
                  type="text"
                  value={duplicateOverrideReason}
                  onChange={(e) => setDuplicateOverrideReason(e.target.value)}
                  placeholder="Required if an active referral already exists for this case and specialty..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Transmit Structured Referral</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REFERRAL TIMELINE & HANDOFF AUDIT */}
      {selectedReferralForTimeline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Referral Handoff Timeline: {selectedReferralForTimeline.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-400">
                    {selectedReferralForTimeline.status}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedReferralForTimeline.patientName} · {selectedReferralForTimeline.receivingProvider} ({selectedReferralForTimeline.receivingFacility})
                </p>
              </div>
              <button onClick={() => setSelectedReferralForTimeline(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Supporting info checklist */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800">Supporting Information Checklist</span>
                <div className="space-y-1">
                  {(selectedReferralForTimeline.supportingInfoChecklist || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700">{item.label}</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                        item.isAttached ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.isAttached ? `Attached (${item.documentRef || 'Verified'})` : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones list */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800">Handoff Chronology & Audit Events</span>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(selectedReferralForTimeline.handoffTimeline || []).map((m, idx) => (
                    <div key={m.id || idx} className="relative">
                      <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-2xs" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{m.status.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(m.timestamp)}</span>
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1 rounded">
                            {m.actor} ({m.actorRole})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                          {m.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReferralForTimeline(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingReferralId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Record Referral Rejection</h3>
            </div>
            <p className="text-slate-600 text-[11px]">
              Per closed-loop safeguards, a rejection requires a documented clinical reason. The case will remain visible in the active queue with a reassessment task.
            </p>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Missing outside contrast DICOM imaging; outside specialist scope..."
              className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectingReferralId(null);
                  setRejectionReasonInput('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Rejection & Alert PCP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFO MODAL */}
      {requestInfoReferralId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-amber-700">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Request Supporting Information</h3>
            </div>
            <p className="text-slate-600 text-[11px]">
              Specify missing clinical data required by the receiving provider before scheduling can occur.
            </p>
            <textarea
              rows={3}
              value={requestedInfoInput}
              onChange={(e) => setRequestedInfoInput(e.target.value)}
              placeholder="e.g. Please provide quantitative FIT lab numerical values and recent CBC report..."
              className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRequestInfoReferralId(null);
                  setRequestedInfoInput('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfoSubmit}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded"
              >
                Submit Request to Coordinator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
