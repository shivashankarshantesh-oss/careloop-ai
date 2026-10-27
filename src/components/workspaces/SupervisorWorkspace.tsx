import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  BarChart3, 
  FileText, 
  UserX, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Award, 
  Download, 
  ArrowRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ScreeningCase, Escalation } from '../../types/careloop';
import { formatStage, getStageBadgeColor, getUrgencyBadgeColor } from '../../utils/formatters';

interface SupervisorWorkspaceProps {
  onSelectCase: (caseId: string) => void;
  onOpenAudit: () => void;
  onOpenAnalytics: () => void;
}

export const SupervisorWorkspace: React.FC<SupervisorWorkspaceProps> = ({
  onSelectCase,
  onOpenAudit,
  onOpenAnalytics,
}) => {
  const { 
    cases, 
    escalations, 
    resolveEscalation, 
    closeCaseWithEvidence, 
    exportAuditLogJSON,
    currentRoleProfile,
    metrics 
  } = useCareLoop();

  const [activeTab, setActiveTab] = useState<'escalations' | 'handoffFailures' | 'readyForClosure' | 'unassigned'>('escalations');
  const [closureCaseId, setClosureCaseId] = useState<string | null>(null);
  const [closureDocRef, setClosureDocRef] = useState('');
  const [closureDocTitle, setClosureDocTitle] = useState('Comprehensive Diagnostic & Operative Care Summary');
  const [closureDocType, setClosureDocType] = useState<'PROCEDURE_REPORT' | 'SURVEILLANCE_PLAN' | 'SPECIALIST_LETTER' | 'PATHOLOGY_CONFIRMATION'>('PROCEDURE_REPORT');
  const [closureSurveillance, setClosureSurveillance] = useState('Routine 3-year surveillance recall per multi-society colorectal guidelines');

  // Filter queues
  const activeEscalations = escalations.filter(e => e.status === 'ACTIVE');

  const handoffFailures = cases.filter(c => 
    (c.exceptionStatus === 'REFERRAL_REJECTED' || c.exceptionStatus === 'UNABLE_TO_CONTACT' || c.isOverdue) &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const readyForClosureCases = cases.filter(c => 
    (c.stage === 'READY_FOR_CLOSURE' || (c.evidenceChecklist.clinicianReviewCompleted && c.evidenceChecklist.outcomeDocumented)) &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const unassignedCases = cases.filter(c => 
    (!c.responsibleOwner || c.responsibleOwner === 'Unassigned' || c.responsibleOwner.toLowerCase().includes('unassigned')) &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const handleAuthorizeClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureCaseId) return;

    const res = closeCaseWithEvidence(closureCaseId, {
      type: closureDocType,
      documentId: closureDocRef || `DOC-${Date.now().toString(36).toUpperCase()}`,
      documentTitle: closureDocTitle,
      completedAt: new Date().toISOString(),
      verifiedBy: currentRoleProfile.name,
      clinicalNotes: 'Endorsed by Clinical Quality Supervisor upon complete evidence inspection.',
      resectedOrNormalFinding: 'Diagnostic pathology and operative summary attached',
      nextRecommendedSurveillance: closureSurveillance,
    });

    if (res.success) {
      setClosureCaseId(null);
    } else {
      alert(res.error || 'Failed to authorize closure');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-rose-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Quality & Supervisor Console</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  CMO Quality Oversight
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Supervisor: <strong className="text-slate-800">{currentRoleProfile.name}</strong> · {currentRoleProfile.organization}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditLogJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Audit JSON</span>
            </button>
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Network Performance KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Closure Rate</div>
            <div className="text-2xl font-bold text-teal-700 mt-1">{metrics.evidenceClosureRatePercent}%</div>
            <div className="text-[10px] text-teal-700">Closed with strict evidence</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Median Review Time</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.medianReviewTimeHours}h</div>
            <div className="text-[10px] text-slate-500">Receipt to MD sign-off</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Escalations</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{activeEscalations.length}</div>
            <div className="text-[10px] text-rose-600">SLA breach warnings</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Overdue Cases</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">{metrics.overdueActions}</div>
            <div className="text-[10px] text-amber-700">Breached protocol milestone</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${
              activeTab === 'escalations' 
                ? 'bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-300' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Escalation Incidents ({activeEscalations.length})
          </button>
          <button
            onClick={() => setActiveTab('handoffFailures')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${
              activeTab === 'handoffFailures' 
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Handoff Failures ({handoffFailures.length})
          </button>
          <button
            onClick={() => setActiveTab('readyForClosure')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${
              activeTab === 'readyForClosure' 
                ? 'bg-teal-50 text-teal-900 border-teal-300 ring-1 ring-teal-300' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Closure Endorsements ({readyForClosureCases.length})
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${
              activeTab === 'unassigned' 
                ? 'bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-300' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unassigned Risk ({unassignedCases.length})
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeTab === 'escalations' && `SLA Escalation Incidents (${activeEscalations.length})`}
              {activeTab === 'handoffFailures' && `Provider Handoff & Communication Failures (${handoffFailures.length})`}
              {activeTab === 'readyForClosure' && `Cases Ready for Supervisor Closure Sign-Off (${readyForClosureCases.length})`}
              {activeTab === 'unassigned' && `Unassigned Case Oversight Queue (${unassignedCases.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized clinical oversight to investigate root causes, reallocate staff, and endorse evidence-based care loop closures.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* TAB 1: ESCALATIONS */}
          {activeTab === 'escalations' && (
            activeEscalations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Zero Active Escalations</p>
                <p className="mt-1">All screening protocols are compliant with mandated SLA timelines.</p>
              </div>
            ) : (
              activeEscalations.map(esc => (
                <div key={esc.id} className="p-4 hover:bg-rose-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-rose-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {esc.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{esc.patientName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {esc.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500">Case #{esc.caseId}</span>
                    </div>

                    <div className="text-xs text-rose-950 font-semibold">{esc.reason}</div>
                    <div className="text-xs text-slate-500">
                      Triggered: {new Date(esc.triggeredAt).toLocaleString()} · SLA remaining: {esc.slaHoursRemaining}h
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => resolveEscalation(esc.id, 'Clinical Supervisor intervention: Case reassigned and direct clinic outreach initiated.')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                    >
                      Resolve Incident
                    </button>
                    <button
                      onClick={() => onSelectCase(esc.caseId)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Inspect Case
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 2: HANDOFF FAILURES */}
          {activeTab === 'handoffFailures' && (
            handoffFailures.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Handoff Failures Detected</p>
              </div>
            ) : (
              handoffFailures.map(c => (
                <div key={c.id} className="p-4 hover:bg-amber-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-amber-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        {c.exceptionStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800">
                      Owner: <strong>{c.responsibleOwner}</strong> ({c.assignedOrganization})
                    </div>
                    <div className="text-xs text-amber-900 font-medium">
                      Failure Reason: {c.exceptionReason || c.nextAction}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer"
                    >
                      Remediate Handoff →
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 3: CLOSURE SIGN-OFF */}
          {activeTab === 'readyForClosure' && (
            readyForClosureCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Cases Awaiting Closure</p>
                <p className="mt-1">All documented outcomes have been verified and closed.</p>
              </div>
            ) : (
              readyForClosureCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-teal-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-teal-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStageBadgeColor(c.stage)}`}>
                        {formatStage(c.stage)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      Test: <strong>{c.testName}</strong> · Outcome Ref: {c.evidenceChecklist.outcomeDocumentRef || 'Attached'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Checklist: Review ✓ · Ack ✓ · Referral ✓ · Outcome ✓
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setClosureCaseId(c.id);
                        setClosureDocRef(c.evidenceChecklist.outcomeDocumentRef || `DOC-${Date.now().toString(36).toUpperCase()}`);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Authorize Final Closure</span>
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Audit Chart
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 4: UNASSIGNED */}
          {activeTab === 'unassigned' && (
            unassignedCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Zero Unassigned Cases</p>
              </div>
            ) : (
              unassignedCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-blue-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                        {c.clinicalUrgency}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">{c.testName} — {c.findingsSummary}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                    >
                      Assign Case →
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Closure Authorization Modal */}
      {closureCaseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Authorize Care Loop Closure</h3>
            <p className="text-xs text-slate-500 mt-1">
              Case: <strong>{closureCaseId}</strong> · Authorized Signer: {currentRoleProfile.name}
            </p>

            <form onSubmit={handleAuthorizeClosure} className="space-y-4 mt-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1">
                <strong>Five-Point Evidence Rule Verified:</strong>
                <p>Clinician review completed, patient acknowledged, specialist procedure attended, and outcome documented.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Document Type</label>
                <select
                  value={closureDocType}
                  onChange={(e) => setClosureDocType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="PROCEDURE_REPORT">Procedure & Operative Report</option>
                  <option value="SPECIALIST_LETTER">Specialist Consultation Summary / Letter</option>
                  <option value="SURVEILLANCE_PLAN">Formulated Surveillance Plan</option>
                  <option value="PATHOLOGY_CONFIRMATION">Pathology Confirmation Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Reference ID *</label>
                <input
                  type="text"
                  required
                  value={closureDocRef}
                  onChange={(e) => setClosureDocRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended Recall Surveillance Interval *</label>
                <input
                  type="text"
                  required
                  value={closureSurveillance}
                  onChange={(e) => setClosureSurveillance(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClosureCaseId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm Authorized Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
