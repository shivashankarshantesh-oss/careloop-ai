import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  FileCheck, 
  Clock, 
  Share2, 
  AlertOctagon, 
  Eye, 
  Zap, 
  Sparkles,
  Info
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { JUDGE_DEMO_STEPS } from '../../data/judgeDemoSteps';
import { JudgeDemoStepKey } from '../../types/careloop';
import { getStageLabel } from '../../utils/formatters';

export const JudgeDemoModal: React.FC = () => {
  const { 
    isJudgeDemoModalOpen, 
    setIsJudgeDemoModalOpen,
    judgeDemoCurrentStep,
    setJudgeDemoCurrentStep,
    executeJudgeDemoStep,
    resetJudgeDemoScenario,
    cases,
    referrals,
    communications,
    tasks,
    escalations,
    setSelectedCaseId
  } = useCareLoop();

  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAIN_SCENARIO' | 'OVERDUE_ESCALATION'>('MAIN_SCENARIO');

  // Find the target demonstration case
  const judgeCase = cases.find(c => c.id === 'CASE-JUDGE-001') || cases[0];
  const overdueCase = cases.find(c => c.id === 'CASE-JUDGE-ESC') || cases.find(c => c.isOverdue) || cases[1];

  const currentStepDef = JUDGE_DEMO_STEPS.find(s => s.key === judgeDemoCurrentStep) || JUDGE_DEMO_STEPS[0];
  const currentStepIndex = JUDGE_DEMO_STEPS.findIndex(s => s.key === judgeDemoCurrentStep);

  // Auto-run stepper effect
  useEffect(() => {
    let timer: any;
    if (isAutoRunning) {
      if (currentStepIndex < JUDGE_DEMO_STEPS.length - 1) {
        timer = setTimeout(() => {
          const nextStep = JUDGE_DEMO_STEPS[currentStepIndex + 1].key;
          executeJudgeDemoStep(nextStep);
        }, 1800);
      } else {
        setIsAutoRunning(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoRunning, currentStepIndex]);

  if (!isJudgeDemoModalOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < JUDGE_DEMO_STEPS.length - 1) {
      const nextKey = JUDGE_DEMO_STEPS[currentStepIndex + 1].key;
      executeJudgeDemoStep(nextKey);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevKey = JUDGE_DEMO_STEPS[currentStepIndex - 1].key;
      executeJudgeDemoStep(prevKey);
    }
  };

  const completedStepsCount = currentStepIndex + 1;

  // Active referrals for judge case
  const judgeReferrals = referrals.filter(r => r.caseId === 'CASE-JUDGE-001');
  const judgeComms = communications.filter(c => c.caseId === 'CASE-JUDGE-001');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Judge Demonstration Console
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Live State Stepper (Steps A–J)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Reproducible end-to-end closed-loop scenario demonstrating clinical safety invariants and handoff recovery.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAutoRunning(false);
              setIsJudgeDemoModalOpen(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Primary End-to-End Loop vs Parallel Overdue Escalation */}
        <div className="bg-slate-100 px-4 sm:px-6 pt-2 border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('MAIN_SCENARIO')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'MAIN_SCENARIO'
                  ? 'border-teal-600 text-teal-900 bg-white rounded-t-md'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Main Scenario: Complete 10-Step Care Pathway (Steps A–J)
            </button>
            <button
              onClick={() => setActiveTab('OVERDUE_ESCALATION')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'OVERDUE_ESCALATION'
                  ? 'border-rose-600 text-rose-900 bg-white rounded-t-md'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Parallel Overdue SLA Case (Never Auto-Closes)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <span className="text-[11px] font-mono text-slate-500">
              Target: <strong className="text-slate-900">Ananya Sharma (MRN: SYN-88019)</strong>
            </span>
          </div>
        </div>

        {activeTab === 'MAIN_SCENARIO' ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Step Navigation Pill Strip */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Pathway Progress: Step {currentStepIndex + 1} of {JUDGE_DEMO_STEPS.length}</span>
                <span className="font-mono text-teal-700">
                  {Math.round((completedStepsCount / JUDGE_DEMO_STEPS.length) * 100)}% Complete
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {JUDGE_DEMO_STEPS.map((step, idx) => {
                  const isCurrent = step.key === judgeDemoCurrentStep;
                  const isPast = idx < currentStepIndex;
                  return (
                    <button
                      key={step.key}
                      onClick={() => executeJudgeDemoStep(step.key)}
                      className={`p-1.5 sm:p-2 rounded border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : isPast
                          ? 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-teal-200' : 'text-slate-400'}`}>
                          {step.key}
                        </span>
                        {isPast && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                      </div>
                      <div className="text-[10px] font-semibold truncate mt-0.5">
                        {step.shortLabel.split('. ')[1]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Step Spotlight Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      Step {currentStepDef.key}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {currentStepDef.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Actor: <strong className="text-slate-800">{currentStepDef.actor}</strong> ({currentStepDef.actorRole})
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => setSelectedCaseId('CASE-JUDGE-001')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>Open Case Drawer</span>
                  </button>
                </div>
              </div>

              {/* What Happens Description */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
                {currentStepDef.description}
              </div>

              {/* Closed-Loop Safeguard Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-950">Closed-Loop Safeguard Enforced:</div>
                  <div className="leading-snug text-emerald-800">{currentStepDef.clinicalInvariant}</div>
                </div>
              </div>

              {/* Real-time State Inspector */}
              <div className="border border-slate-200 bg-white rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Live Case In-Memory State:</span>
                  <span className="font-mono text-teal-700 text-[11px]">CASE-JUDGE-001</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Workflow Stage</div>
                    <div className="font-bold text-slate-900 truncate mt-0.5">{getStageLabel(judgeCase.stage)}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Exception Status</div>
                    <div className={`font-bold truncate mt-0.5 ${judgeCase.exceptionStatus !== 'NONE' ? 'text-rose-700' : 'text-slate-900'}`}>
                      {judgeCase.exceptionStatus}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Clinical Urgency</div>
                    <div className="font-bold text-amber-700 truncate mt-0.5">{judgeCase.clinicalUrgency}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Closure Status</div>
                    <div className={`font-bold truncate mt-0.5 ${judgeCase.closureStatus.includes('CLOSED') ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {judgeCase.closureStatus}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Active Next Action:</div>
                  <div className="font-medium text-slate-800">{judgeCase.nextAction}</div>
                </div>

                {/* Evidence checklist badges */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase">Evidence:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.clinicianReviewCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    1. Review
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.patientNotified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    2. Notified
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.patientAcknowledged ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    3. Acked
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.referralAccepted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    4. Ref Accepted
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.appointmentAttended ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    5. Appt Attended
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.evidenceChecklist.outcomeDocumented ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    6. Outcome
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${judgeCase.stage === 'CLOSED_WITH_EVIDENCE' ? 'bg-teal-50 text-teal-800 border-teal-200 font-bold' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    7. Final Closure
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Parallel Overdue Case Explanation */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-rose-950">
                  Parallel Demonstration: Overdue Case That Triggers Escalation & Never Auto-Closes
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-rose-900/90 leading-relaxed">
                As required by closed-loop patient safety guidelines: <strong>A screening case never automatically marks itself resolved merely because an SLA deadline or timer has passed.</strong> If contact cannot be established or an appointment is missed, CareLoop escalates the case to qualified clinical supervision, alerts the accountable owner, and keeps the case open until explicit human resolution.
              </p>

              {/* Overdue Case Details */}
              <div className="bg-white p-4 rounded-lg border border-rose-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">{overdueCase.patientName}</div>
                    <div className="text-xs text-slate-500 font-mono">Case ID: {overdueCase.id} · MRN: {overdueCase.mrn}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    OVERDUE SLA (Tier 2 Escalation)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Test</span>
                    <div className="font-bold text-slate-900">{overdueCase.testName}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Finding</span>
                    <div className="font-bold text-rose-700">{overdueCase.findingsSummary}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Owner</span>
                    <div className="font-bold text-slate-900">{overdueCase.responsibleOwner}</div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Active Blocker & Required Next Action:</span>
                  </div>
                  <div className="text-amber-800">{overdueCase.nextAction}</div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Status: <strong className="text-rose-700">Open & Escalated</strong> (Audit logged)
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCaseId(overdueCase.id);
                      setIsJudgeDemoModalOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                  >
                    Open Overdue Case in Drawer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAutoRunning(false);
                resetJudgeDemoScenario();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Demo Scenario</span>
            </button>

            <button
              onClick={() => setIsAutoRunning(!isAutoRunning)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer ${
                isAutoRunning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isAutoRunning ? 'Pause Auto-Play' : 'Auto-Run All 10 Steps'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0 || isAutoRunning}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev Step</span>
            </button>

            <button
              onClick={() => executeJudgeDemoStep(currentStepDef.key)}
              disabled={isAutoRunning}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-teal-200" />
              <span>{currentStepDef.actionButtonLabel}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === JUDGE_DEMO_STEPS.length - 1 || isAutoRunning}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-900 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
