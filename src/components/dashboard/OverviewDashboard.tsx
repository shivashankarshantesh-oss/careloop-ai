import React from 'react';
import { 
  FolderGit2, 
  Clock, 
  AlertTriangle, 
  Share2, 
  CheckCircle2, 
  FileCheck, 
  ArrowUpRight, 
  ChevronRight, 
  Zap, 
  User, 
  Calendar,
  AlertOctagon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { formatDate, getScreeningLabel, getUrgencyBadgeClasses, getStageLabel } from '../../utils/formatters';
import { WorkflowStage, ScreeningCase } from '../../types/careloop';

interface OverviewDashboardProps {
  onSelectNav: (nav: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onSelectNav }) => {
  const { 
    metrics, 
    cases, 
    auditEvents, 
    setSelectedCaseId, 
    updateCaseStage 
  } = useCareLoop();

  // Overdue cases (sorted by urgency)
  const overdueCases = cases
    .filter(c => (c.isOverdue || new Date(c.dueDate).getTime() < new Date().getTime()) && c.stage !== 'CLOSED_WITH_EVIDENCE')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Prioritized Action Queue: open cases sorted by priorityScore
  const actionQueue = cases
    .filter(c => c.stage !== 'CLOSED_WITH_EVIDENCE')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  // 13 Stages Pipeline distribution
  const ALL_STAGES: { stage: WorkflowStage; label: string }[] = [
    { stage: 'RESULT_RECEIVED', label: '1. Result received' },
    { stage: 'AWAITING_CLINICIAN_REVIEW', label: '2. Awaiting review' },
    { stage: 'CLINICIAN_REVIEW_COMPLETED', label: '3. Review completed' },
    { stage: 'PATIENT_NOTIFICATION_PENDING', label: '4. Notification pending' },
    { stage: 'PATIENT_NOTIFIED', label: '5. Patient notified' },
    { stage: 'AWAITING_ACKNOWLEDGEMENT', label: '6. Awaiting ack' },
    { stage: 'CONFIRMATION_OR_CONSULTATION_PENDING', label: '7. Confirm / consult pending' },
    { stage: 'REFERRAL_PENDING', label: '8. Referral pending' },
    { stage: 'REFERRAL_ACCEPTED', label: '9. Referral accepted' },
    { stage: 'APPOINTMENT_OR_CARE_PENDING', label: '10. Appt / care pending' },
    { stage: 'AWAITING_OUTCOME_DOCUMENTATION', label: '11. Outcome docs' },
    { stage: 'READY_FOR_CLOSURE', label: '12. Ready for closure' },
    { stage: 'CLOSED_WITH_EVIDENCE', label: '13. Closed with evidence' },
  ];

  const workflowPipeline = ALL_STAGES.map(s => ({
    stage: s.stage,
    label: s.label,
    count: cases.filter(c => c.stage === s.stage).length,
  }));

  return (
    <div className="space-y-6">
      {/* Title & Core Philosophy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Closed-Loop Care Coordination
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of actionable laboratory and imaging findings from intake to documented clinical evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">Loop Reliability Target:</span>
            <span className="font-bold text-slate-900">100% Closure</span>
          </div>
        </div>
      </div>

      {/* 7 Core Dashboard Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Open Actionable Cases */}
        <div 
          onClick={() => onSelectNav('cases')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Open Cases</span>
            <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{metrics.openActionableCases}</span>
            <span className="text-[11px] text-slate-400 font-mono">/ {metrics.totalCases}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Active care pathways
          </div>
        </div>

        {/* 2. Cases Awaiting Patient Ack */}
        <div 
          onClick={() => onSelectNav('communication')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-700 text-[11px] font-medium">
            <span>Awaiting Ack</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-800">{metrics.awaitingPatientAck}</span>
            <span className="text-[11px] text-amber-600 font-medium">cases</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Patient outreach pending
          </div>
        </div>

        {/* 3. Overdue Actions */}
        <div 
          onClick={() => onSelectNav('escalations')}
          className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
            metrics.overdueActions > 0 
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-[11px] font-medium">
            <span>Overdue Actions</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-800">{metrics.overdueActions}</span>
            <span className="text-[11px] text-rose-600 font-medium">breached</span>
          </div>
          <div className="mt-1 text-[10px] text-rose-700 font-medium truncate">
            Immediate escalation required
          </div>
        </div>

        {/* 4. Pending Referrals */}
        <div 
          onClick={() => onSelectNav('referrals')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Pending Referrals</span>
            <Share2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{metrics.pendingReferrals}</span>
            <span className="text-[11px] text-teal-700 font-medium">transferred</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Specialist consults
          </div>
        </div>

        {/* 5. Completed Care Pathways */}
        <div 
          onClick={() => onSelectNav('cases')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-medium">
            <span>Completed Loops</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-800">{metrics.completedCarePathways}</span>
            <span className="text-[11px] text-emerald-600 font-medium">resolved</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Closed with evidence
          </div>
        </div>

        {/* 6. Median Time to Review */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Review Median</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{metrics.medianReviewTimeHours}</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Receipt → Clinician Sign-off
          </div>
        </div>

        {/* 7. Evidence Closure Rate */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Evidence Rate</span>
            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-0.5">
            <span className="text-2xl font-bold text-teal-700">{metrics.evidenceClosureRatePercent}</span>
            <span className="text-xs text-teal-600 font-bold">%</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            Required pathology / notes
          </div>
        </div>
      </div>

      {/* Interactive Case Status Distribution & Visual Pathway */}
      <div className="bg-white p-4 lg:p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Active Workflow Pipeline & Funnel Distribution
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Distribution of screening cases across the 7 milestones of closed-loop management
            </div>
          </div>
          <button 
            onClick={() => onSelectNav('cases')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Cases</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {workflowPipeline.map((step, idx) => {
            const isClosed = step.stage === 'CLOSED_WITH_EVIDENCE';
            return (
              <div 
                key={step.stage}
                onClick={() => onSelectNav('cases')}
                className={`p-3 rounded-md border transition-all cursor-pointer group ${
                  step.count > 0 
                    ? isClosed 
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' 
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-teal-500' 
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-mono">Stage 0{idx + 1}</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate group-hover:text-teal-700">
                  {step.label.split('. ')[1]}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`text-xl font-bold ${
                    isClosed ? 'text-emerald-700' : 'text-slate-900'
                  }`}>
                    {step.count}
                  </span>
                  <span className="text-[10px] text-slate-400">cases</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${isClosed ? 'bg-emerald-500' : 'bg-teal-600'}`}
                    style={{ width: `${Math.min(100, (step.count / metrics.totalCases) * 100 * 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Overdue & Prioritized Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overdue and Prioritized Action Queue (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overdue Items Alert Panel */}
          {overdueCases.length > 0 && (
            <div className="bg-rose-50/40 border border-rose-200 rounded-lg p-4">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                    Overdue Actions Requiring Direct Intervention ({overdueCases.length})
                  </span>
                </div>
                <button 
                  onClick={() => onSelectNav('escalations')}
                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                >
                  Escalation Protocol →
                </button>
              </div>

              <div className="space-y-2">
                {overdueCases.map(c => {
                  const urgencyStyle = getUrgencyBadgeClasses(c.clinicalUrgency);
                  return (
                    <div 
                      key={c.id}
                      className="bg-white p-3 rounded-md border border-rose-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-400 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{c.patientName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{c.mrn}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-600 font-medium">{getScreeningLabel(c.screeningType)}</span>
                        </div>
                        <div className="text-xs text-rose-800 font-medium">
                          Next action: {c.nextAction}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Owner: {c.responsibleOwner.split('(')[0].trim()}</span>
                          <span>·</span>
                          <span className="text-rose-600 font-mono">Due: {formatDate(c.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedCaseId(c.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        >
                          Review Case
                        </button>
                        <button
                          onClick={() => updateCaseStage(c.id, 'REFERRAL_PENDING', 'Expedited via Overdue Action Queue')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors cursor-pointer"
                        >
                          Expedite
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prioritized Action Queue */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Prioritized Action Queue
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  High clinical risk cases ordered by calculated urgency priority score
                </div>
              </div>
              <button
                onClick={() => onSelectNav('cases')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                All Cases ({metrics.openActionableCases}) →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {actionQueue.map((c) => {
                const urgencyStyle = getUrgencyBadgeClasses(c.clinicalUrgency);
                return (
                  <div 
                    key={c.id} 
                    className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-slate-50/60 p-2 rounded-md transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{c.patientName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{c.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-700 font-medium">{getScreeningLabel(c.screeningType)}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgencyStyle.dot}`} />
                          {urgencyStyle.label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 line-clamp-1">
                        <span className="font-semibold text-slate-700">Findings: </span>
                        {c.findingsSummary}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-medium text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">
                          {getStageLabel(c.stage)}
                        </span>
                        <span>Next: {c.nextAction}</span>
                        <span className="font-mono text-slate-400">Due {formatDate(c.dueDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
                      >
                        Open Case
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Feed & Quality Guardrails (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity / Audit Feed */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Audit Activity
              </div>
              <button 
                onClick={() => onSelectNav('audit')}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium"
              >
                Full Trail →
              </button>
            </div>

            <div className="space-y-3">
              {auditEvents.slice(0, 5).map(event => (
                <div key={event.id} className="text-xs space-y-0.5 border-l-2 border-teal-500 pl-2.5 py-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium text-slate-600">{event.actor}</span>
                    <span className="font-mono">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">{event.action.replace(/_/g, ' ')}</div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{event.changeSummary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Guardrail Card */}
          <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>CareLoop Guardrail Rules</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Per National Quality Forum & USPSTF guidelines: A screening result cannot be archived or marked closed without verifiable proof of care completion (e.g. operative colonoscopy report, pathology margin sign-off, or structured 3-year surveillance registry entry).
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Physician Signer Required</span>
              <span className="text-teal-300 font-medium">100% Audit Coverage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
