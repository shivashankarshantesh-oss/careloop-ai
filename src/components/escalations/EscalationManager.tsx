import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  UserCheck, 
  Plus, 
  Check, 
  ChevronRight,
  ExternalLink,
  Settings,
  Play,
  RotateCcw,
  Sparkles,
  Filter,
  X,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { formatDate, formatDateTime, getScreeningLabel } from '../../utils/formatters';
import { Escalation, EscalationRule, EscalationTriggerType } from '../../types/careloop';

export const EscalationManager: React.FC = () => {
  const { 
    escalations, 
    cases, 
    escalationRules,
    currentRole, 
    permissions,
    acknowledgeEscalation,
    resolveEscalationWithRationale, 
    updateEscalationRule,
    evaluateEscalationRules,
    createEscalation, 
    setSelectedCaseId,
    triggerDemoScenario 
  } = useCareLoop();

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED' | 'SUPERVISOR' | 'RULES'>('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [reviewerFilter, setReviewerFilter] = useState<string>('ALL');
  const [triggerFilter, setTriggerFilter] = useState<string>('ALL');
  const [demoBannerMsg, setDemoBannerMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Resolution Modal
  const [selectedEscalationToResolve, setSelectedEscalationToResolve] = useState<Escalation | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionRationale, setResolutionRationale] = useState('');

  // Manual Trigger Modal
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [targetCaseId, setTargetCaseId] = useState(cases[0]?.id || '');
  const [reason, setReason] = useState('Patient unacknowledged after multi-channel outreach protocols');
  const [severity, setSeverity] = useState<'TIER_1_CRITICAL' | 'TIER_2_URGENT' | 'TIER_3_WARNING'>('TIER_1_CRITICAL');
  const [manualTriggerType, setManualTriggerType] = useState<EscalationTriggerType>('UNACKNOWLEDGED_COMMUNICATION');

  // Rule Editor Modal
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [ruleSlaHours, setRuleSlaHours] = useState(24);
  const [ruleEnabled, setRuleEnabled] = useState(true);

  // Filtered escalations
  const filteredEscalations = escalations.filter(e => {
    if (activeTab === 'ACTIVE' && e.status === 'RESOLVED') return false;
    if (activeTab === 'RESOLVED' && e.status !== 'RESOLVED') return false;
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (reviewerFilter !== 'ALL' && !e.assignedQualifiedReviewer.includes(reviewerFilter)) return false;
    if (triggerFilter !== 'ALL' && e.triggerType !== triggerFilter) return false;
    return true;
  });

  // Reviewers list for filtering
  const allReviewers = Array.from(new Set(escalations.map(e => e.assignedQualifiedReviewer)));

  // Clinician-designated urgent cases alert (Tier 1 Critical)
  const urgentTier1Active = escalations.filter(e => e.status !== 'RESOLVED' && e.severity === 'TIER_1_CRITICAL');

  // Handle Resolution
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalationToResolve || !resolutionRationale.trim()) return;

    resolveEscalationWithRationale(
      selectedEscalationToResolve.id, 
      resolutionRationale.trim()
    );

    setSelectedEscalationToResolve(null);
    setResolutionText('');
    setResolutionRationale('');
    setDemoBannerMsg({ type: 'success', text: `Escalation ${selectedEscalationToResolve.id} resolved with documented clinical rationale.` });
    setTimeout(() => setDemoBannerMsg(null), 5000);
  };

  // Handle Manual Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = cases.find(item => item.id === targetCaseId);
    if (!c) return;

    createEscalation({
      caseId: c.id,
      patientName: c.patientName,
      screeningType: c.screeningType,
      reason,
      severity,
      triggerType: manualTriggerType,
      triggeringRule: `Manual Clinical Escalation: ${reason}`,
      affectedCaseId: c.id,
      currentOwner: c.responsibleOwner,
      assignedQualifiedReviewer: currentRole,
      requiredNextAction: 'Review clinical records and initiate expedited intervention.',
      deadline: new Date(Date.now() + (severity === 'TIER_1_CRITICAL' ? 12 : 24) * 3600 * 1000).toISOString(),
      slaHoursRemaining: severity === 'TIER_1_CRITICAL' ? 12 : severity === 'TIER_2_URGENT' ? 36 : 72,
    });

    setShowTriggerModal(false);
    setDemoBannerMsg({ type: 'success', text: `Manual ${severity} escalation registered for ${c.patientName}.` });
    setTimeout(() => setDemoBannerMsg(null), 5000);
  };

  // Handle Demo Scenarios
  const runDemoScenario = (code: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const res = triggerDemoScenario(code);
    if (res.success) {
      setDemoBannerMsg({ type: 'info', text: res.message });
      setTimeout(() => setDemoBannerMsg(null), 7000);
    }
  };

  // Handle Rule Save
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    updateEscalationRule(editingRule.id, {
      slaHours: ruleSlaHours,
      isEnabled: ruleEnabled,
    });

    setEditingRule(null);
    setDemoBannerMsg({ type: 'success', text: `Rule ${editingRule.id} SLA updated to ${ruleSlaHours}h.` });
    setTimeout(() => setDemoBannerMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Escalation Queue & Supervisor Console
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Human Clinical Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent rule-based intervention queue tracking breached SLAs, unacknowledged communications, and rejected handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => evaluateEscalationRules()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs cursor-pointer transition-colors"
            title="Scan active cases against the 9 administrative escalation rules"
          >
            <Play className="w-3.5 h-3.5 text-teal-600" />
            <span>Evaluate Rules Engine</span>
          </button>

          <button
            onClick={() => setShowTriggerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Escalation</span>
          </button>
        </div>
      </div>

      {/* 5 DEMO SCENARIOS BAR (Quick Action Launchers) */}
      <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Reproducible Interactive Demo Scenarios (Requirements A - E)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            One-click interactive verification workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          <button
            onClick={() => runDemoScenario('A')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded transition-colors cursor-pointer group"
          >
            <div className="font-bold text-amber-300 group-hover:text-amber-200">
              Demo A: Urgent Routing
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              Clinician-designated urgent case routed to CMO Dr. Vance
            </div>
          </button>

          <button
            onClick={() => runDemoScenario('B')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded transition-colors cursor-pointer group"
          >
            <div className="font-bold text-amber-300 group-hover:text-amber-200">
              Demo B: Overdue Referral
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              Past-deadline thyroid referral triggers Tier 1 escalation
            </div>
          </button>

          <button
            onClick={() => runDemoScenario('C')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded transition-colors cursor-pointer group"
          >
            <div className="font-bold text-amber-300 group-hover:text-amber-200">
              Demo C: Blocked Closure
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              Case with missing evidence blocks closure with checklist
            </div>
          </button>

          <button
            onClick={() => runDemoScenario('D')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded transition-colors cursor-pointer group"
          >
            <div className="font-bold text-amber-300 group-hover:text-amber-200">
              Demo D: Authorized Closure
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              Complete melanoma case receives authorized sign-off
            </div>
          </button>

          <button
            onClick={() => runDemoScenario('E')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded transition-colors cursor-pointer group"
          >
            <div className="font-bold text-amber-300 group-hover:text-amber-200">
              Demo E: Reopen Case
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              Reopens closed case with documented clinical justification
            </div>
          </button>
        </div>
      </div>

      {/* Demo Feedback Banner */}
      {demoBannerMsg && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
          demoBannerMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-amber-50 text-amber-900 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{demoBannerMsg.text}</span>
          </div>
          <button onClick={() => setDemoBannerMsg(null)} className="text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PROMINENT URGENT BANNER FOR CLINICIAN-DESIGNATED URGENT CASES */}
      {urgentTier1Active.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-lg shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
              <h3 className="font-bold text-sm tracking-tight">
                IMMEDIATE CLINICAL ATTENTION REQUIRED ({urgentTier1Active.length} Active Tier 1 Critical Incidents)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white uppercase font-mono">
              SLA Priority &lt; 12h
            </span>
          </div>

          <p className="text-xs text-rose-800 leading-relaxed">
            Per clinical safety protocols, urgency must be set or confirmed by a qualified clinician. The following incidents involve clinician-designated urgent findings, unacknowledged high-risk patients, or rejected referrals without recovery plans.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {urgentTier1Active.map(u => (
              <div key={u.id} className="p-2.5 bg-white border border-rose-300 rounded text-xs flex items-center justify-between gap-2 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{u.patientName}</span>
                    <span className="text-[10px] text-rose-700 font-mono">({u.caseId})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate max-w-sm mt-0.5">
                    {u.reason}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Routed to: <strong className="text-slate-800">{u.assignedQualifiedReviewer}</strong>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedCaseId(u.caseId)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    View Case
                  </button>
                  <button
                    onClick={() => setSelectedEscalationToResolve(u)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-2xs cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-2.5 font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'ACTIVE' ? 'border-rose-600 text-rose-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Incidents ({escalations.filter(e => e.status !== 'RESOLVED').length})
        </button>
        <button
          onClick={() => setActiveTab('SUPERVISOR')}
          className={`pb-2.5 font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'SUPERVISOR' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Supervisor View & SLA Matrix
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`pb-2.5 font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'RESOLVED' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Resolved Incidents ({escalations.filter(e => e.status === 'RESOLVED').length})
        </button>
        <button
          onClick={() => setActiveTab('RULES')}
          className={`pb-2.5 font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'RULES' ? 'border-indigo-600 text-indigo-800' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Administrative Rules Configuration ({escalationRules.length})
        </button>
      </div>

      {/* Filter Bar (for Active, Supervisor, and Resolved tabs) */}
      {activeTab !== 'RULES' && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
            >
              <option value="ALL">All Severity Tiers</option>
              <option value="TIER_1_CRITICAL">Tier 1 Critical (&lt;12h SLA)</option>
              <option value="TIER_2_URGENT">Tier 2 Urgent (&lt;24-48h SLA)</option>
              <option value="TIER_3_WARNING">Tier 3 Warning (&lt;72h SLA)</option>
            </select>

            <select
              value={reviewerFilter}
              onChange={(e) => setReviewerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
            >
              <option value="ALL">All Qualified Reviewers</option>
              {allReviewers.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
            >
              <option value="ALL">All 9 Escalation Triggers</option>
              <option value="CLINICIAN_URGENT_AWAITING_REVIEW">Clinician Urgent Awaiting Review</option>
              <option value="OVERDUE_CLINICIAN_REVIEW">Overdue Clinician Review</option>
              <option value="UNACKNOWLEDGED_COMMUNICATION">Unacknowledged Patient Outreach</option>
              <option value="UNASSIGNED_OWNERLESS_CASE">Unassigned / Ownerless Case</option>
              <option value="REJECTED_REFERRAL_NO_RECOVERY">Rejected Referral (No Recovery)</option>
              <option value="MISSED_APPOINTMENT">Missed Diagnostic Appointment</option>
              <option value="MISSING_CONSULTATION_OUTCOME">Missing Consultation Outcome</option>
              <option value="REPEATED_FAILED_CONTACT">Repeated Failed Contact</option>
              <option value="APPROACHING_SLA_DEADLINE">Approaching SLA Deadline</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1 & 3: ACTIVE & RESOLVED INCIDENTS LIST */}
      {(activeTab === 'ACTIVE' || activeTab === 'RESOLVED') && (
        <div className="space-y-3">
          {filteredEscalations.length === 0 ? (
            <div className="bg-white p-8 text-center text-xs text-slate-400 rounded-lg border border-slate-200">
              No escalations found for the current filter criteria.
            </div>
          ) : (
            filteredEscalations.map(esc => {
              const isResolved = esc.status === 'RESOLVED';
              const isTier1 = esc.severity === 'TIER_1_CRITICAL';
              const isTier2 = esc.severity === 'TIER_2_URGENT';

              return (
                <div 
                  key={esc.id} 
                  className={`bg-white p-4 rounded-lg border shadow-2xs space-y-3 transition-colors ${
                    isResolved 
                      ? 'border-slate-200 opacity-80' 
                      : isTier1 
                        ? 'border-rose-300 bg-rose-50/20' 
                        : isTier2
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-blue-200 bg-blue-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isTier1 
                          ? 'bg-rose-100 text-rose-800 border-rose-300' 
                          : isTier2
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {esc.severity.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">{esc.id}</span>
                      <span className="text-slate-400">·</span>
                      <button 
                        onClick={() => setSelectedCaseId(esc.caseId)}
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Case: {esc.caseId} ({esc.patientName})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {esc.status}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        Triggered: {formatDateTime(esc.triggeredAt)}
                      </span>
                    </div>
                  </div>

                  {/* Incident Details & Triggering Rule */}
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-900">
                      {esc.reason}
                    </div>
                    {esc.triggeringRule && (
                      <div className="text-[11px] text-slate-500">
                        Rule: <strong className="text-slate-700">{esc.triggeringRule}</strong>
                      </div>
                    )}
                    {esc.requiredNextAction && (
                      <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-100">
                        Required Action: <strong>{esc.requiredNextAction}</strong>
                      </div>
                    )}
                  </div>

                  {/* Reviewer and Accountability */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4 text-slate-600 flex-wrap text-[11px]">
                      <div>
                        Reviewer: <strong className="text-slate-900">{esc.assignedQualifiedReviewer}</strong>
                      </div>
                      {esc.currentOwner && (
                        <div>
                          Owner: <strong className="text-slate-900">{esc.currentOwner}</strong>
                        </div>
                      )}
                      <div>
                        SLA Remaining: <strong className="text-rose-700">{esc.slaHoursRemaining}h</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {esc.status === 'ACTIVE' && (
                        <button
                          onClick={() => acknowledgeEscalation(esc.id, 'Assigned coordinator review in progress.')}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      {!isResolved && (
                        <button
                          onClick={() => setSelectedEscalationToResolve(esc)}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve with Rationale</span>
                        </button>
                      )}

                      {isResolved && esc.resolutionRationale && (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Rationale: {esc.resolutionRationale}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: SUPERVISOR VIEW & SLA MATRIX */}
      {activeTab === 'SUPERVISOR' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Supervisor Oversight & SLA Breach Risk Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Consolidated supervisory view categorized by severity tier, accountability, overdue duration, and SLA risk.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
                <span className="font-bold text-rose-900 block">Tier 1 Critical Incidents</span>
                <div className="text-2xl font-bold text-rose-700 font-mono">
                  {escalations.filter(e => e.severity === 'TIER_1_CRITICAL' && e.status !== 'RESOLVED').length}
                </div>
                <p className="text-[11px] text-rose-800">
                  Immediate 12h-24h qualified clinician action required
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                <span className="font-bold text-amber-900 block">Tier 2 Urgent Escalations</span>
                <div className="text-2xl font-bold text-amber-700 font-mono">
                  {escalations.filter(e => e.severity === 'TIER_2_URGENT' && e.status !== 'RESOLVED').length}
                </div>
                <p className="text-[11px] text-amber-800">
                  24h-48h care coordination & outreach follow-up required
                </p>
              </div>

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-1">
                <span className="font-bold text-blue-900 block">Tier 3 Operational Warnings</span>
                <div className="text-2xl font-bold text-blue-700 font-mono">
                  {escalations.filter(e => e.severity === 'TIER_3_WARNING' && e.status !== 'RESOLVED').length}
                </div>
                <p className="text-[11px] text-blue-800">
                  Administrative reminders approaching SLA deadlines
                </p>
              </div>
            </div>
          </div>

          {/* Supervisor Incident Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Incident ID</th>
                    <th className="p-3">Case & Patient</th>
                    <th className="p-3">Trigger Type</th>
                    <th className="p-3">Assigned Reviewer</th>
                    <th className="p-3">Current Owner</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action Deadline</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEscalations.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          e.severity === 'TIER_1_CRITICAL' 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : e.severity === 'TIER_2_URGENT'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {e.severity.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{e.id}</td>
                      <td className="p-3">
                        <button onClick={() => setSelectedCaseId(e.caseId)} className="font-bold text-teal-700 hover:underline">
                          {e.patientName} ({e.caseId})
                        </button>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{e.triggerType || 'SLA_TRIGGER'}</td>
                      <td className="p-3 font-semibold text-slate-800">{e.assignedQualifiedReviewer}</td>
                      <td className="p-3 text-slate-600">{e.currentOwner || 'Coordinator'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-rose-700">
                        {formatDate(e.deadline || e.triggeredAt)}
                      </td>
                      <td className="p-3 text-right">
                        {e.status !== 'RESOLVED' && (
                          <button
                            onClick={() => setSelectedEscalationToResolve(e)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMINISTRATIVE RULES CONFIGURATION */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              Configurable Administrative Escalation Rules
            </h3>
            <p className="text-xs text-slate-500">
              Transparent, automated workflow criteria configured by clinical leadership. Urgency is confirmed by authorized clinicians; deadlines generate coordinated tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {escalationRules.map(rule => (
              <div 
                key={rule.id}
                className={`p-4 rounded-lg border bg-white space-y-2.5 transition-colors ${
                  rule.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-slate-500">{rule.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    rule.severity === 'TIER_1_CRITICAL' 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : rule.severity === 'TIER_2_URGENT'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {rule.severity.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {rule.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {rule.description}
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
                  <div>Default Reviewer: <strong className="text-slate-800">{rule.defaultReviewerRole}</strong></div>
                  <div>Service SLA: <strong className="text-teal-700">{rule.slaHours} hours</strong></div>
                  <div>Status: <strong className={rule.isEnabled ? 'text-emerald-700' : 'text-slate-400'}>{rule.isEnabled ? 'Active Rule' : 'Disabled'}</strong></div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setRuleSlaHours(rule.slaHours);
                      setRuleEnabled(rule.isEnabled);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-slate-500" />
                    <span>Configure SLA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL WITH MANDATORY RATIONALE */}
      {selectedEscalationToResolve && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Resolve Escalation ({selectedEscalationToResolve.id})
                </h3>
              </div>
              <button onClick={() => setSelectedEscalationToResolve(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px]">
              <div><strong>Incident:</strong> {selectedEscalationToResolve.reason}</div>
              <div><strong>Case:</strong> {selectedEscalationToResolve.caseId} ({selectedEscalationToResolve.patientName})</div>
              <div><strong>Severity:</strong> {selectedEscalationToResolve.severity.replace(/_/g, ' ')}</div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Documented Resolution Rationale & Clinical Actions Taken <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionRationale}
                  onChange={(e) => setResolutionRationale(e.target.value)}
                  placeholder="Detail the clinical or administrative actions executed to resolve this safety escalation (e.g. reviewed by Dr. Chen; patient contacted via secondary phone; replacement biopsy referral accepted by Sutter Health)..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-600">
                Resolving Actor: <strong>{currentRole}</strong> (Resolution and rationale will be permanently recorded in audit trail).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEscalationToResolve(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ESCALATION MODAL */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">Raise Manual Safety Escalation</h3>
              </div>
              <button onClick={() => setShowTriggerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Case <span className="text-rose-600">*</span>
                </label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.patientName} ({getScreeningLabel(c.screeningType)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Escalation Trigger Type
                </label>
                <select
                  value={manualTriggerType}
                  onChange={(e) => setManualTriggerType(e.target.value as EscalationTriggerType)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="CLINICIAN_URGENT_AWAITING_REVIEW">Clinician Urgent Awaiting Review</option>
                  <option value="OVERDUE_CLINICIAN_REVIEW">Overdue Clinician Review</option>
                  <option value="UNACKNOWLEDGED_COMMUNICATION">Unacknowledged Patient Outreach</option>
                  <option value="REJECTED_REFERRAL_NO_RECOVERY">Rejected Referral Without Recovery Plan</option>
                  <option value="MISSED_APPOINTMENT">Missed Diagnostic Appointment</option>
                  <option value="MISSING_CONSULTATION_OUTCOME">Missing Consultation Outcome</option>
                  <option value="REPEATED_FAILED_CONTACT">Repeated Failed Patient Contact</option>
                  <option value="APPROACHING_SLA_DEADLINE">Approaching SLA Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Severity Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TIER_1_CRITICAL', 'TIER_2_URGENT', 'TIER_3_WARNING'] as const).map(s => (
                    <label 
                      key={s} 
                      className={`p-2 rounded border text-center cursor-pointer font-bold ${
                        severity === s ? 'border-rose-600 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sev"
                        value={s}
                        checked={severity === s}
                        onChange={() => setSeverity(s)}
                        className="sr-only"
                      />
                      <span className="text-[11px]">{s.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason & Clinical Trigger Rationale <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-2xs"
                >
                  Raise Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RULE EDITOR MODAL */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Configure Rule: {editingRule.name}
              </h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Configured SLA Hours (Service Level Agreement)
                </label>
                <input
                  type="number"
                  min={4}
                  max={168}
                  value={ruleSlaHours}
                  onChange={(e) => setRuleSlaHours(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ruleEnabled"
                  checked={ruleEnabled}
                  onChange={(e) => setRuleEnabled(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="ruleEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Rule Enabled in Automated Evaluation Engine
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-2xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
