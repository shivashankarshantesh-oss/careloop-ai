import React, { useState } from 'react';
import { 
  Building2, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { Referral, AppointmentDetail } from '../../types/careloop';
import { formatStage, getStageBadgeColor, getUrgencyBadgeColor } from '../../utils/formatters';

interface SpecialistWorkspaceProps {
  onSelectCase: (caseId: string) => void;
}

export const SpecialistWorkspace: React.FC<SpecialistWorkspaceProps> = ({ onSelectCase }) => {
  const { 
    referrals, 
    cases, 
    recordReferralResponse, 
    documentAppointmentStatus, 
    recordCareOutcome, 
    addClinicalNote,
    currentRoleProfile,
    currentUserNpi 
  } = useCareLoop();

  const [activeTab, setActiveTab] = useState<'incoming' | 'schedule' | 'outcomes'>('incoming');
  
  // Accept / Reject modal
  const [responseModalRef, setResponseModalRef] = useState<Referral | null>(null);
  const [responseType, setResponseType] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [responseReason, setResponseReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState<'INCOMPLETE_RECORDS' | 'OUT_OF_SCOPE' | 'CAPACITY_REACHED' | 'OUT_OF_NETWORK'>('INCOMPLETE_RECORDS');

  // Request info modal
  const [requestInfoRef, setRequestInfoRef] = useState<Referral | null>(null);
  const [requestedInfoText, setRequestedInfoText] = useState('');

  // Schedule modal
  const [schedulingCaseId, setSchedulingCaseId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [appointmentFacility, setAppointmentFacility] = useState('MetroHealth Endoscopy Suite B');
  const [appointmentPrep, setAppointmentPrep] = useState('Full liquid diet 24h prior, Golytely split-dose prep kit.');

  // Outcome modal
  const [outcomeCaseId, setOutcomeCaseId] = useState<string | null>(null);
  const [outcomeFindings, setOutcomeFindings] = useState('Diagnostic Colonoscopy: Two adenomatous polyps completely excised (8mm and 5mm). Hemostasis confirmed. No perforation.');
  const [outcomeSurveillance, setOutcomeSurveillance] = useState('Repeat colonoscopy in 3 years based on multi-adenoma criteria.');
  const [outcomeDocRef, setOutcomeDocRef] = useState(`OP-NOTE-${Date.now().toString(36).toUpperCase()}`);

  // Filter queues
  const incomingReferrals = referrals.filter(r => r.status === 'TRANSMITTED' || r.status === 'DRAFTED');
  const acceptedReferrals = referrals.filter(r => r.status === 'ACCEPTED');

  const pendingAppointmentCases = cases.filter(c => 
    c.stage === 'REFERRAL_ACCEPTED' || c.stage === 'APPOINTMENT_OR_CARE_PENDING'
  );

  const awaitingOutcomeCases = cases.filter(c => 
    (c.stage === 'APPOINTMENT_OR_CARE_PENDING' || c.stage === 'AWAITING_OUTCOME_DOCUMENTATION') &&
    !c.evidenceChecklist.outcomeDocumented
  );

  const handleConfirmResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseModalRef) return;

    let finalReason = responseReason.trim();
    if (responseType === 'REJECTED') {
      if (!finalReason) {
        alert('A detailed clinical reason is required when rejecting a patient referral.');
        return;
      }
      finalReason = `[${rejectionCategory}] ${finalReason}`;
    } else {
      finalReason = finalReason || 'Referral reviewed and accepted for diagnostic endoscopy.';
    }

    recordReferralResponse(responseModalRef.id, responseType, finalReason);
    setResponseModalRef(null);
    setResponseReason('');
  };

  const handleSendInfoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestInfoRef || !requestedInfoText.trim()) return;

    addClinicalNote(
      requestInfoRef.caseId,
      `SPECIALIST REQUEST FOR MISSING INFORMATION: ${requestedInfoText.trim()}`,
      'CLINICAL'
    );
    setRequestInfoRef(null);
    setRequestedInfoText('');
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingCaseId) return;

    const aptDetail: AppointmentDetail = {
      facility: appointmentFacility,
      scheduledDate: `${appointmentDate}T${appointmentTime}:00Z`,
      provider: currentRoleProfile.name,
      status: 'CONFIRMED',
      notes: appointmentPrep,
    };

    documentAppointmentStatus(schedulingCaseId, aptDetail);
    setSchedulingCaseId(null);
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeCaseId) return;

    recordCareOutcome(outcomeCaseId, {
      findings: outcomeFindings,
      surveillance: outcomeSurveillance,
      documentRef: outcomeDocRef,
      notes: `Documented by ${currentRoleProfile.name} (${currentUserNpi})`,
    });
    setOutcomeCaseId(null);
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-purple-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Specialist / Receiving Provider Workspace</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  Gastroenterology & Endoscopy Center
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Active Specialist: <strong className="text-slate-800">{currentRoleProfile.name}</strong> · {currentRoleProfile.organization}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
            <span>Specialist NPI:</span>
            <strong>18290144</strong>
          </div>
        </div>

        {/* Tab KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'incoming' 
                ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Incoming Referrals</span>
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{incomingReferrals.length}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Awaiting triage & acceptance</div>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'schedule' 
                ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Procedure Scheduling</span>
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-900 mt-1">{pendingAppointmentCases.length}</div>
            <div className="text-[10px] text-teal-700 mt-0.5">Accepted; pending appointment</div>
          </button>

          <button
            onClick={() => setActiveTab('outcomes')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeTab === 'outcomes' 
                ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Operative Outcomes</span>
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{awaitingOutcomeCases.length}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Post-procedure reports needed</div>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {activeTab === 'incoming' && `Incoming Referral Triage Queue (${incomingReferrals.length})`}
              {activeTab === 'schedule' && `Specialist Appointment & Procedure Desk (${pendingAppointmentCases.length})`}
              {activeTab === 'outcomes' && `Post-Procedure Outcomes Documentation (${awaitingOutcomeCases.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'incoming' && 'Electronic consults sent from primary care. Accept to schedule, or reject with mandatory rationale.'}
              {activeTab === 'schedule' && 'Coordinate dates, surgical suites, and bowel prep/sedation instructions.'}
              {activeTab === 'outcomes' && 'Document pathology, operative findings, and mandatory surveillance recall interval to advance case closure.'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* TAB 1: INCOMING REFERRALS */}
          {activeTab === 'incoming' && (
            incomingReferrals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Pending Referrals in Triage</p>
                <p className="mt-1">All transmitted consultations have been triaged.</p>
              </div>
            ) : (
              incomingReferrals.map(ref => (
                <div key={ref.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {ref.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{ref.patientName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ref.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ref.priority} PRIORITY
                      </span>
                      <span className="text-xs text-slate-500">Case ID: {ref.caseId}</span>
                    </div>

                    <div className="text-xs text-slate-700">
                      Referring MD: <strong className="text-slate-900">{ref.referringProvider}</strong> · Specialty: {ref.specialty}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Reason: {ref.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setResponseModalRef(ref);
                        setResponseType('ACCEPTED');
                        setResponseReason('Referral accepted. Proceeding with diagnostic colonoscopy intake.');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Accept Referral
                    </button>
                    <button
                      onClick={() => {
                        setResponseModalRef(ref);
                        setResponseType('REJECTED');
                        setResponseReason('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Reject (Reason Req.)
                    </button>
                    <button
                      onClick={() => {
                        setRequestInfoRef(ref);
                        setRequestedInfoText('');
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                      title="Request Missing Information"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 2: SCHEDULING */}
          {activeTab === 'schedule' && (
            pendingAppointmentCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All Consultations Scheduled</p>
              </div>
            ) : (
              pendingAppointmentCases.map(c => (
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
                    </div>

                    <div className="text-xs text-slate-700">
                      Finding: <strong className="text-slate-900">{c.testName}</strong> — {c.findingsSummary}
                    </div>
                    {c.appointmentDetail?.scheduledDate && (
                      <div className="text-xs text-teal-700 font-medium">
                        Current Slot: {new Date(c.appointmentDetail.scheduledDate).toLocaleString()} at {c.appointmentDetail.facility}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSchedulingCaseId(c.id);
                        if (c.appointmentDetail?.scheduledDate) {
                          setAppointmentDate(c.appointmentDetail.scheduledDate.split('T')[0]);
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{c.appointmentDetail?.scheduledDate ? 'Modify Slot' : 'Schedule Procedure'}</span>
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Case Workspace
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* TAB 3: DOCUMENT OUTCOMES */}
          {activeTab === 'outcomes' && (
            awaitingOutcomeCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All Procedure Outcomes Documented</p>
              </div>
            ) : (
              awaitingOutcomeCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-blue-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="text-xs text-slate-500">MRN: {c.mrn}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStageBadgeColor(c.stage)}`}>
                        {formatStage(c.stage)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800">
                      Procedure: <strong>{c.screeningType.replace('_', ' ')} Evaluation</strong>
                    </div>
                    <div className="text-xs text-slate-600">
                      Attended: {c.appointmentDetail?.attendanceVerifiedAt ? new Date(c.appointmentDetail.attendanceVerifiedAt).toLocaleDateString() : 'Awaiting operative note upload'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setOutcomeCaseId(c.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Document Outcome</span>
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Case Workspace
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Response Modal (Accept or Reject) */}
      {responseModalRef && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {responseType === 'ACCEPTED' ? 'Accept Specialist Referral' : 'Reject Specialist Referral'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Patient: <strong>{responseModalRef.patientName}</strong> · Referring MD: {responseModalRef.referringProvider}
            </p>

            <form onSubmit={handleConfirmResponse} className="space-y-4 mt-4">
              {responseType === 'REJECTED' && (
                <>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    <strong>Mandatory Safe Handoff Rule:</strong> You must supply a detailed clinical reason for rejection so the primary care clinician can promptly redirect the patient.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rejection Category *
                    </label>
                    <select
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    >
                      <option value="INCOMPLETE_RECORDS">Incomplete diagnostic reports or imaging missing</option>
                      <option value="OUT_OF_SCOPE">Condition outside subspecialty scope of practice</option>
                      <option value="CAPACITY_REACHED">Clinical capacity reached / SLA cannot be satisfied</option>
                      <option value="OUT_OF_NETWORK">Patient insurance network misalignment</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {responseType === 'ACCEPTED' ? 'Clinical Triage Notes (Optional)' : 'Documented Rejection Rationale *'}
                </label>
                <textarea
                  required={responseType === 'REJECTED'}
                  rows={3}
                  value={responseReason}
                  onChange={(e) => setResponseReason(e.target.value)}
                  placeholder={responseType === 'ACCEPTED' ? 'e.g. Cleared for standard sedation endoscopy...' : 'Explain why referral cannot be accommodated and recommended next destination...'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResponseModalRef(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs ${
                    responseType === 'ACCEPTED' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {responseType === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Missing Info Modal */}
      {requestInfoRef && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Request Missing Clinical Information</h3>
            <p className="text-xs text-slate-500 mt-1">
              Notify the Care Coordinator and Referring Clinician to upload needed documentation.
            </p>

            <form onSubmit={handleSendInfoRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Documents / Information *
                </label>
                <textarea
                  required
                  rows={3}
                  value={requestedInfoText}
                  onChange={(e) => setRequestedInfoText(e.target.value)}
                  placeholder="e.g. Please transmit initial pathology slide report and patient current anticoagulation medication list."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestInfoRef(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {schedulingCaseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Schedule Specialist Procedure</h3>
            <p className="text-xs text-slate-500 mt-1">Case: {schedulingCaseId}</p>

            <form onSubmit={handleSaveAppointment} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Procedure Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Suite</label>
                <input
                  type="text"
                  required
                  value={appointmentFacility}
                  onChange={(e) => setAppointmentFacility(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preparation Instructions</label>
                <textarea
                  rows={2}
                  value={appointmentPrep}
                  onChange={(e) => setAppointmentPrep(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingCaseId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Care Outcome Modal */}
      {outcomeCaseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Document Care / Operative Outcome</h3>
            <p className="text-xs text-slate-500 mt-1">
              Case: <strong>{outcomeCaseId}</strong> · Documenting Provider: {currentRoleProfile.name}
            </p>

            <form onSubmit={handleSaveOutcome} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procedure & Pathology Findings *
                </label>
                <textarea
                  required
                  rows={3}
                  value={outcomeFindings}
                  onChange={(e) => setOutcomeFindings(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Surveillance Recall Interval *
                </label>
                <input
                  type="text"
                  required
                  value={outcomeSurveillance}
                  onChange={(e) => setOutcomeSurveillance(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operative Document Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={outcomeDocRef}
                  onChange={(e) => setOutcomeDocRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOutcomeCaseId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Submit Outcome Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
