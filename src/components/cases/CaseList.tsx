import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  FolderGit2, 
  Calendar, 
  User, 
  Building,
  Layers, 
  LayoutList, 
  Kanban,
  FileText,
  Clock,
  ChevronLeft,
  X,
  AlertOctagon,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { 
  formatDate, 
  formatDateTime,
  getScreeningLabel, 
  getUrgencyBadgeClasses, 
  getStageLabel, 
  getExceptionBadge,
  calculateDaysRemaining 
} from '../../utils/formatters';
import { ScreeningType, ClinicalUrgency, WorkflowStage, ScreeningCase, ExceptionStatus } from '../../types/careloop';

interface CaseListProps {
  onOpenNewCase: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ onOpenNewCase }) => {
  const { cases, tasks, setSelectedCaseId } = useCareLoop();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [orgFilter, setOrgFilter] = useState<string>('ALL');
  const [referralFilter, setReferralFilter] = useState<string>('ALL');
  const [exceptionFilter, setExceptionFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  
  // View & Sorting & Pagination
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [sortBy, setSortBy] = useState<'dueDate' | 'latestActivity' | 'priority'>('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Unique lists for dropdown filters
  const uniqueOwners = useMemo(() => Array.from(new Set(cases.map(c => c.responsibleOwner))), [cases]);
  const uniqueOrgs = useMemo(() => Array.from(new Set(cases.map(c => c.assignedOrganization))), [cases]);

  // 13 Explicit Workflow Stages for filter tabs
  const STAGES: { id: WorkflowStage | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Stages' },
    { id: 'RESULT_RECEIVED', label: '1. Result received' },
    { id: 'AWAITING_CLINICIAN_REVIEW', label: '2. Awaiting review' },
    { id: 'CLINICIAN_REVIEW_COMPLETED', label: '3. Review completed' },
    { id: 'PATIENT_NOTIFICATION_PENDING', label: '4. Notification pending' },
    { id: 'PATIENT_NOTIFIED', label: '5. Patient notified' },
    { id: 'AWAITING_ACKNOWLEDGEMENT', label: '6. Awaiting ack' },
    { id: 'CONFIRMATION_OR_CONSULTATION_PENDING', label: '7. Confirm / consult pending' },
    { id: 'REFERRAL_PENDING', label: '8. Referral pending' },
    { id: 'REFERRAL_ACCEPTED', label: '9. Referral accepted' },
    { id: 'APPOINTMENT_OR_CARE_PENDING', label: '10. Appt / care pending' },
    { id: 'AWAITING_OUTCOME_DOCUMENTATION', label: '11. Awaiting outcome docs' },
    { id: 'READY_FOR_CLOSURE', label: '12. Ready for closure' },
    { id: 'CLOSED_WITH_EVIDENCE', label: '13. Closed with evidence' },
  ];

  // Helper to check overdue status dynamically
  const isCaseOverdue = (c: ScreeningCase) => {
    if (c.stage === 'CLOSED_WITH_EVIDENCE') return false;
    const now = Date.now();
    const pastDue = new Date(c.dueDate).getTime() < now;
    const hasOverdueTask = tasks.some(
      t => t.caseId === c.id && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < now
    );
    return pastDue || hasOverdueTask || c.isOverdue;
  };

  // Filtered and sorted cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search by case ID, patient name, and MRN
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches = 
          c.id.toLowerCase().includes(query) ||
          c.patientName.toLowerCase().includes(query) ||
          c.mrn.toLowerCase().includes(query) ||
          c.findingsSummary.toLowerCase().includes(query) ||
          c.testName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Stage
      if (stageFilter !== 'ALL' && c.stage !== stageFilter) return false;

      // Owner
      if (ownerFilter !== 'ALL' && c.responsibleOwner !== ownerFilter) return false;

      // Urgency
      if (urgencyFilter !== 'ALL' && c.clinicalUrgency !== urgencyFilter) return false;

      // Organization
      if (orgFilter !== 'ALL' && c.assignedOrganization !== orgFilter) return false;

      // Exception status
      if (exceptionFilter !== 'ALL' && c.exceptionStatus !== exceptionFilter) return false;

      // Referral status
      if (referralFilter !== 'ALL') {
        const refStatus = c.evidenceChecklist?.referralStatus || 'NONE';
        if (referralFilter === 'ACCEPTED' && refStatus !== 'ACCEPTED') return false;
        if (referralFilter === 'SCHEDULED' && refStatus !== 'APPOINTMENT_SCHEDULED') return false;
        if (referralFilter === 'REJECTED' && c.exceptionStatus !== 'REFERRAL_REJECTED') return false;
      }

      // Overdue status
      if (overdueOnly && !isCaseOverdue(c)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priorityScore - a.priorityScore;
      }
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'latestActivity') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });
  }, [cases, tasks, searchTerm, stageFilter, ownerFilter, urgencyFilter, orgFilter, exceptionFilter, referralFilter, overdueOnly, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / itemsPerPage));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage, itemsPerPage]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setStageFilter('ALL');
    setOwnerFilter('ALL');
    setUrgencyFilter('ALL');
    setOrgFilter('ALL');
    setReferralFilter('ALL');
    setExceptionFilter('ALL');
    setOverdueOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    searchTerm || stageFilter !== 'ALL' || ownerFilter !== 'ALL' || 
    urgencyFilter !== 'ALL' || orgFilter !== 'ALL' || referralFilter !== 'ALL' || 
    exceptionFilter !== 'ALL' || overdueOnly;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Screening-to-Care Case Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Governing the full 13-stage lifecycle from diagnostic result intake through specialist referral and evidence closure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table / Board view toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'board' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          <button
            onClick={onOpenNewCase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake Screening Result</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search & Core Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search by Case ID and Patient Name */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search case ID, patient name, MRN..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Assigned Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="ALL">All Assigned Owners</option>
            {uniqueOwners.map(o => (
              <option key={o} value={o}>{o.split('(')[0].trim()}</option>
            ))}
          </select>

          {/* Clinician Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => {
              setUrgencyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="ALL">All Urgency SLAs</option>
            <option value="CRITICAL_72H">Critical (72h SLA)</option>
            <option value="HIGH_14D">High (14d SLA)</option>
            <option value="MODERATE_30D">Moderate (30d SLA)</option>
            <option value="ROUTINE_60D">Routine (60d SLA)</option>
          </select>

          {/* Responsible Organization Filter */}
          <select
            value={orgFilter}
            onChange={(e) => {
              setOrgFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="ALL">All Organizations</option>
            {uniqueOrgs.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Secondary Filters & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
          {/* Exception Status Filter */}
          <select
            value={exceptionFilter}
            onChange={(e) => {
              setExceptionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="ALL">All Exception Statuses</option>
            <option value="NONE">Standard Pathway (No Exception)</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="UNABLE_TO_CONTACT">Unable to Contact</option>
            <option value="REFERRAL_REJECTED">Referral Rejected</option>
            <option value="APPOINTMENT_MISSED">Appointment Missed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          {/* Referral Status Filter */}
          <select
            value={referralFilter}
            onChange={(e) => {
              setReferralFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="ALL">All Referral Statuses</option>
            <option value="ACCEPTED">Referral Accepted</option>
            <option value="SCHEDULED">Appointment Scheduled</option>
            <option value="REJECTED">Referral Rejected</option>
          </select>

          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
          >
            <option value="priority">Sort: Urgency Priority</option>
            <option value="dueDate">Sort: Earliest Due Date</option>
            <option value="latestActivity">Sort: Latest Activity</option>
          </select>

          {/* Overdue Checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-50/70 border border-rose-200/80 px-3 py-1.5 rounded-md cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span className="truncate">Overdue Actions Only</span>
          </label>
        </div>

        {/* 13 Stage Filter Horizontal Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          {STAGES.map(s => {
            const isSelected = stageFilter === s.id;
            const count = s.id === 'ALL' 
              ? cases.length 
              : cases.filter(c => c.stage === s.id).length;

            return (
              <button
                key={s.id}
                onClick={() => {
                  setStageFilter(s.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{s.label}</span>
                <span className={`ml-1.5 font-mono text-[11px] ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Filter Clear */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filteredCases.length} matching cases ({cases.length} total)</span>
        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="text-teal-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Case / Patient ID</th>
                  <th className="py-2.5 px-3">Screening Category</th>
                  <th className="py-2.5 px-3">Clinician Urgency</th>
                  <th className="py-2.5 px-3">Workflow Stage & Exception</th>
                  <th className="py-2.5 px-3">Owner & Organization</th>
                  <th className="py-2.5 px-3">Next Action & Due Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No cases match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map(c => {
                    const urgencyStyle = getUrgencyBadgeClasses(c.clinicalUrgency);
                    const isClosed = c.stage === 'CLOSED_WITH_EVIDENCE';
                    const isOverdue = isCaseOverdue(c);
                    const daysRemaining = calculateDaysRemaining(c.dueDate);
                    const exceptionBadge = getExceptionBadge(c.exceptionStatus);

                    return (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isOverdue && !isClosed ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Case & Patient ID */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setSelectedCaseId(c.id)}
                            className="text-left font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer"
                          >
                            {c.patientName}
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: <span className="font-semibold text-slate-600">{c.mrn}</span> · {c.patientAge}yo {c.patientGender[0]}
                          </div>
                          <div className="text-[10px] text-teal-700 font-mono mt-0.5">
                            {c.id}
                          </div>
                        </td>

                        {/* Screening Category */}
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-slate-800">
                            {getScreeningLabel(c.screeningType)}
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {c.findingsSummary}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Rec\'d: {formatDate(c.receivedDate)}
                          </div>
                        </td>

                        {/* Clinician Urgency */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${urgencyStyle.dot}`} />
                            {urgencyStyle.label}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[130px]">
                            MD: {c.urgencyApprovedBy.split('(')[0].trim()}
                          </div>
                        </td>

                        {/* Current Stage & Exception */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            {isClosed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                            )}
                            <span className={`text-[11px] font-semibold ${isClosed ? 'text-emerald-700' : 'text-slate-800'}`}>
                              {getStageLabel(c.stage)}
                            </span>
                          </div>

                          {exceptionBadge && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded border ${exceptionBadge.bg} ${exceptionBadge.text}`}>
                                {exceptionBadge.label}
                              </span>
                            </div>
                          )}

                          {c.blockers && c.blockers.length > 0 && !isClosed && (
                            <div className="text-[10px] text-amber-700 mt-0.5 line-clamp-1 font-medium">
                              Blocker: {c.blockers[0]}
                            </div>
                          )}
                        </td>

                        {/* Owner & Organization */}
                        <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {c.responsibleOwner.split('(')[0].trim()}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {c.assignedOrganization}
                          </div>
                        </td>

                        {/* Next Action & Due Date */}
                        <td className="py-3 px-3 max-w-xs">
                          <div className="text-slate-800 font-medium text-[11px] line-clamp-1">
                            {c.nextAction}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span className="font-mono text-slate-500">
                              Due: {formatDate(c.dueDate)}
                            </span>
                            {!isClosed && (
                              <span className={`font-semibold ${
                                daysRemaining < 0 || isOverdue
                                  ? 'text-rose-600' 
                                  : daysRemaining <= 3 
                                    ? 'text-amber-600' 
                                    : 'text-slate-400'
                              }`}>
                                {daysRemaining < 0 || isOverdue ? 'Overdue' : `${daysRemaining}d left`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCaseId(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
                          >
                            Open Workspace
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-xs font-semibold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* KANBAN / BOARD VIEW (Organized by Workflow Milestone Clusters) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Intake & Review', stages: ['RESULT_RECEIVED', 'AWAITING_CLINICIAN_REVIEW', 'CLINICIAN_REVIEW_COMPLETED'] as WorkflowStage[] },
            { title: 'Outreach & Acknowledged', stages: ['PATIENT_NOTIFICATION_PENDING', 'PATIENT_NOTIFIED', 'AWAITING_ACKNOWLEDGEMENT', 'CONFIRMATION_OR_CONSULTATION_PENDING'] as WorkflowStage[] },
            { title: 'Referral & Care In-Flight', stages: ['REFERRAL_PENDING', 'REFERRAL_ACCEPTED', 'APPOINTMENT_OR_CARE_PENDING', 'AWAITING_OUTCOME_DOCUMENTATION'] as WorkflowStage[] },
            { title: 'Ready & Closed with Evidence', stages: ['READY_FOR_CLOSURE', 'CLOSED_WITH_EVIDENCE'] as WorkflowStage[] },
          ].map(column => {
            const colCases = filteredCases.filter(c => column.stages.includes(c.stage));
            return (
              <div key={column.title} className="bg-slate-100/70 rounded-lg p-3 border border-slate-200 space-y-2.5 flex flex-col">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{column.title}</span>
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-semibold">
                    {colCases.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                  {colCases.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No cases in this cluster
                    </div>
                  ) : (
                    colCases.map(c => {
                      const urgencyStyle = getUrgencyBadgeClasses(c.clinicalUrgency);
                      const exceptionBadge = getExceptionBadge(c.exceptionStatus);
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCaseId(c.id)}
                          className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs hover:border-teal-500 transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700">
                                {c.patientName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {c.mrn} · {c.id}
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                              {c.clinicalUrgency.split('_')[0]}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 font-semibold truncate">
                            {getStageLabel(c.stage)}
                          </div>

                          {exceptionBadge && (
                            <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded border ${exceptionBadge.bg} ${exceptionBadge.text}`}>
                              {exceptionBadge.label}
                            </span>
                          )}

                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                            {c.nextAction}
                          </p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[120px]">{c.responsibleOwner.split('(')[0]}</span>
                            <span className="font-mono text-slate-500">Due {formatDate(c.dueDate)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
