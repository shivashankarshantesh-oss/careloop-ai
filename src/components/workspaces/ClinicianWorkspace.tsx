import React, { useState } from 'react';
import { 
  Stethoscope, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ArrowRight, 
  FileText, 
  Share2, 
  UserCheck, 
  Sparkles,
  ClipboardCheck,
  Check
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ClinicalUrgency, ScreeningCase, WorkflowStage } from '../../types/careloop';
import { formatStage, getStageBadgeColor, getUrgencyBadgeColor } from '../../utils/formatters';

interface ClinicianWorkspaceProps {
  onSelectCase: (caseId: string) => void;
  onOpenReferrals: () => void;
}

export const ClinicianWorkspace: React.FC<ClinicianWorkspaceProps> = ({
  onSelectCase,
  onOpenReferrals,
}) => {
  const { 
    cases, 
    recordClinicianReview, 
    createReferral, 
    currentRoleProfile,
    currentRole,
    currentUserNpi 
  } = useCareLoop();

  const [activeTab, setActiveTab] = useState<'awaitingReview' | 'assignedCases' | 'consults' | 'decisions'>('awaitingReview');
  const [reviewingCase, setReviewingCase] = useState<ScreeningCase | null>(null);
  
  // Review form states
  const [reviewUrgency, setReviewUrgency] = useState<ClinicalUrgency>('HIGH_14D');
  const [reviewNotes, setReviewNotes] = useState('');
  const [orderReferral, setOrderReferral] = useState(true);
  const [referralSpecialty, setReferralSpecialty] = useState('Gastroenterology');
  const [referralFacility, setReferralFacility] = useState('MetroHealth Endoscopy & GI Center of Excellence');

  // Queues
  const awaitingReviewCases = cases.filter(c => 
    (!c.evidenceChecklist.clinicianReviewCompleted || c.stage === 'RESULT_RECEIVED' || c.stage === 'AWAITING_CLINICIAN_REVIEW') &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const assignedCases = cases.filter(c => 
    c.responsibleOwner.includes('Chen') || c.assignedOrganization.includes('Primary Care')
  );

  const consultPendingCases = cases.filter(c => 
    c.stage === 'CONFIRMATION_OR_CONSULTATION_PENDING' || c.stage === 'REFERRAL_PENDING'
  );

  const decisionRequiredCases = cases.filter(c => 
    c.clinicalUrgency === 'CRITICAL_72H' || c.exceptionStatus === 'REFERRAL_REJECTED'
  );

  const handleStartReview = (c: ScreeningCase) => {
    setReviewingCase(c);
    setReviewUrgency(c.clinicalUrgency || 'HIGH_14D');
    setReviewNotes(`Reviewed diagnostic finding: ${c.findingsSummary}. Confirmed clinical risk. Recommend immediate specialty diagnostic evaluation.`);
    setOrderReferral(c.screeningType === 'COLORECTAL_FIT' || c.screeningType === 'CERVICAL_HPV' || c.screeningType === 'LUNG_LDCT');
  };

  const handleCompleteReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingCase) return;

    recordClinicianReview(reviewingCase.id, reviewUrgency, reviewNotes);

    if (orderReferral) {
      createReferral({
        caseId: reviewingCase.id,
        patientId: reviewingCase.patientId,
        patientName: reviewingCase.patientName,
        referringProvider: currentRole,
        receivingProvider: 'Dr. Kevin Patel, MD (Specialist / GI)',
        specialty: referralSpecialty,
        receivingFacility: referralFacility,
        reason: `Clinician order following abnormal ${reviewingCase.testName}: ${reviewingCase.findingsSummary}. Recommended evaluation urgency: ${reviewUrgency}.`,
        status: 'TRANSMITTED',
        priority: reviewUrgency === 'CRITICAL_72H' ? 'URGENT' : 'HIGH',
      });
    }

    setReviewingCase(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-blue-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Primary Care Clinician Workspace</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  Authorized Clinical Signer
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Active Provider: <strong className="text-slate-800">{currentRoleProfile.name}</strong> · {currentRoleProfile.title} · {currentRoleProfile.organization}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Provider Credential:</span>
            <strong className="text-blue-700">{currentUserNpi}</strong>
          </div>
        </div>

        {/* Tab KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('awaitingReview')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'awaitingReview' 
                ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Awaiting Review</span>
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{awaitingReviewCases.length}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">New findings requiring sign-off</div>
          </button>

          <button
            onClick={() => setActiveTab('assignedCases')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'assignedCases' 
                ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>My Panel Cases</span>
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-900 mt-1">{assignedCases.length}</div>
            <div className="text-[10px] text-teal-700 mt-0.5">Under primary care supervision</div>
          </button>

          <button
            onClick={() => setActiveTab('consults')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'consults' 
                ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Consults Pending</span>
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 mt-1">{consultPendingCases.length}</div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Specialist handoffs</div>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'decisions' 
                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Decisions & SLA</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{decisionRequiredCases.length}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">Urgent clinical exceptions</div>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {activeTab === 'awaitingReview' && `Results Awaiting Clinician Review & Urgency Sign-off (${awaitingReviewCases.length})`}
              {activeTab === 'assignedCases' && `Primary Care Clinician Caseload (${assignedCases.length})`}
              {activeTab === 'consults' && `Consultation Requests & Confirmations (${consultPendingCases.length})`}
              {activeTab === 'decisions' && `Clinical Decision & Escalation Queue (${decisionRequiredCases.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'awaitingReview' && 'Diagnostic results received from laboratory. Review findings, confirm or adjust urgency, and endorse the next care step.'}
              {activeTab === 'assignedCases' && 'Active patient screening pathways where Dr. Sarah Chen is the designated clinical lead.'}
              {activeTab === 'consults' && 'Specialist consult handoffs pending confirmation or referral transmission.'}
              {activeTab === 'decisions' && 'Cases requiring direct MD intervention due to rejected referrals or critical urgency SLA targets.'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {activeTab === 'awaitingReview' && (
            awaitingReviewCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All Diagnostic Results Reviewed</p>
                <p className="mt-1">Zero unreviewed laboratory or imaging reports pending sign-off.</p>
              </div>
            ) : (
              awaitingReviewCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="text-xs text-slate-400">MRN: {c.mrn}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                        {c.clinicalUrgency.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                      <span>{c.testName}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-rose-700 font-medium">{c.findingsSummary}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Lab Transmitted: {new Date(c.receivedDate).toLocaleString()}</span>
                      <span>·</span>
                      <span className="text-amber-700 font-medium">Review SLA: 24h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStartReview(c)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Review & Endorse</span>
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Full Chart
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'assignedCases' && (
            assignedCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <p className="text-slate-600 font-medium">No assigned panel cases.</p>
              </div>
            ) : (
              assignedCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStageBadgeColor(c.stage)}`}>
                        {formatStage(c.stage)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                        {c.clinicalUrgency.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      {c.testName} — {c.findingsSummary}
                    </div>
                    <div className="text-xs text-slate-500">
                      Next: {c.nextAction}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      View Workspace →
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'consults' && (
            consultPendingCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Consultations Pending</p>
              </div>
            ) : (
              consultPendingCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                        {c.clinicalUrgency.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      Specialist Facility: {c.assignedOrganization}
                    </div>
                    <div className="text-xs text-slate-600">{c.nextAction}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onOpenReferrals}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                    >
                      Referral Console
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Case Chart
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'decisions' && (
            decisionRequiredCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Clinical Exceptions Pending</p>
              </div>
            ) : (
              decisionRequiredCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-rose-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-rose-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {c.clinicalUrgency}
                      </span>
                      {c.exceptionStatus !== 'NONE' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {c.exceptionStatus}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-rose-900 font-semibold">
                      Reason: {c.exceptionReason || c.findingsSummary}
                    </div>
                    <div className="text-xs text-slate-600">{c.nextAction}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      Resolve Exception
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Review Modal Dialog */}
      {reviewingCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Clinician Review & Endorsement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized Signer: {currentRoleProfile.name} ({currentUserNpi})
                </p>
              </div>
              <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded font-bold">
                {reviewingCase.id}
              </span>
            </div>

            <form onSubmit={handleCompleteReview} className="space-y-4 mt-4">
              {/* Patient and Finding Context */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <strong className="text-slate-900">{reviewingCase.patientName} (MRN: {reviewingCase.mrn})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Screening Test:</span>
                  <strong className="text-slate-900">{reviewingCase.testName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Reported Finding:</span>
                  <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-rose-800">
                    {reviewingCase.findingsSummary}
                  </div>
                </div>
              </div>

              {/* Urgency Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Assign Clinical Urgency Tier *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewUrgency('CRITICAL_72H')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      reviewUrgency === 'CRITICAL_72H'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold ring-1 ring-rose-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">CRITICAL</div>
                    <div className="text-[10px] text-slate-500">Within 72 Hours</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewUrgency('HIGH_14D')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      reviewUrgency === 'HIGH_14D'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold ring-1 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">HIGH RISK</div>
                    <div className="text-[10px] text-slate-500">Within 14 Days</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewUrgency('ROUTINE_60D')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      reviewUrgency === 'ROUTINE_60D'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold ring-1 ring-slate-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">ROUTINE</div>
                    <div className="text-[10px] text-slate-500">Within 60 Days</div>
                  </button>
                </div>
              </div>

              {/* Recommendations and Rationale */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Clinical Recommendations & Decision Rationale *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Order Referral Switch */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderReferral}
                    onChange={(e) => setOrderReferral(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Transmit Electronic Specialist Referral Order Immediately
                  </span>
                </label>

                {orderReferral && (
                  <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Specialty</label>
                      <input
                        type="text"
                        value={referralSpecialty}
                        onChange={(e) => setReferralSpecialty(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Receiving Facility</label>
                      <input
                        type="text"
                        value={referralFacility}
                        onChange={(e) => setReferralFacility(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clinician Human Signature Confirmation */}
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Human Endorsement:</strong> Clicking confirm records Dr. Sarah Chen's digital verification timestamp and moves the case to Clinician Review Completed.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingCase(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Sign & Endorse Care Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
