import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ShieldAlert, 
  FolderPlus, 
  Calendar, 
  User, 
  Building 
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ScreeningType, ClinicalUrgency, WorkflowStage } from '../../types/careloop';

interface NewCaseModalProps {
  onClose: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ onClose }) => {
  const { patients, currentRole, createNewCase, setSelectedCaseId } = useCareLoop();

  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [screeningType, setScreeningType] = useState<ScreeningType>('COLORECTAL_FIT');
  const [testName, setTestName] = useState('Quantitative Fecal Immunochemical Test (FIT)');
  const [facility, setFacility] = useState('Quest Diagnostics Regional Lab');
  const [orderingPhysician, setOrderingPhysician] = useState('Dr. Sarah Chen, MD');
  const [findingsSummary, setFindingsSummary] = useState('Positive FIT result: 220 ng Hb/mL. Diagnostic colonoscopy indicated.');
  const [rawReportSnippet, setRawReportSnippet] = useState('OCCULT BLOOD: POSITIVE (220 ng/mL). Exceeds cutoff of 100 ng/mL. Per clinical protocol, mandates secondary diagnostic evaluation.');
  const [clinicalUrgency, setClinicalUrgency] = useState<ClinicalUrgency>('MODERATE_30D');
  const [responsibleOwner, setResponsibleOwner] = useState('Maria Ramos, RN (Care Coordinator)');
  const [organization, setOrganization] = useState('MetroHealth Ambulatory Care');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [nextAction, setNextAction] = useState('Initiate telephone outreach and secure portal message to schedule diagnostic procedure');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const newId = createNewCase({
      patientId: selectedPatient.id,
      mrn: selectedPatient.mrn,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      patientAge: 56,
      patientGender: selectedPatient.gender,
      screeningType,
      testName,
      orderingPhysician,
      performingFacility: facility,
      receivedDate: new Date().toISOString(),
      findingsSummary,
      rawReportSnippet,
      clinicalUrgency,
      urgencyApprovedBy: currentRole.includes('MD') ? currentRole : 'Dr. Sarah Chen, MD (Lead PCP)',
      urgencyApprovedAt: new Date().toISOString(),
      stage: 'RESULT_RECEIVED',
      nextAction,
      dueDate: new Date(dueDate).toISOString(),
      responsibleOwner,
      assignedOrganization: organization,
      isOverdue: false,
      closureStatus: 'OPEN',
      initialReviewTimestamp: new Date().toISOString(),
    });

    setSelectedCaseId(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 border border-slate-200 space-y-4 max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Intake Actionable Screening Result
              </h2>
              <p className="text-xs text-slate-500">
                Register a new diagnostic finding into the CareLoop coordination queue.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Selection */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Select Synthetic Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.mrn} (Language: {p.preferredLanguage}, {p.safeContactPreference.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Screening Type & Test Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Screening Protocol
              </label>
              <select
                value={screeningType}
                onChange={(e) => setScreeningType(e.target.value as ScreeningType)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 font-medium"
              >
                <option value="MAMMOGRAPHY_BIRADS">Mammography (BI-RADS)</option>
                <option value="COLORECTAL_FIT">Colorectal (FIT)</option>
                <option value="LUNG_LDCT">Lung CT (Lung-RADS)</option>
                <option value="CERVICAL_HPV">Cervical / HPV</option>
                <option value="DIABETIC_RETINOPATHY">Diabetic Retinal Screen</option>
                <option value="PROSTATE_PSA">Prostate PSA</option>
                <option value="THYROID_ULTRASOUND">Thyroid TI-RADS</option>
                <option value="SKIN_BIOPSY">Cutaneous Skin Biopsy</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Diagnostic Test Name
              </label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          {/* Facility & Ordering MD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Performing Laboratory / Center
              </label>
              <input
                type="text"
                required
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Ordering Physician
              </label>
              <input
                type="text"
                required
                value={orderingPhysician}
                onChange={(e) => setOrderingPhysician(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          {/* Finding summary & Raw report */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Findings Summary
            </label>
            <input
              type="text"
              required
              value={findingsSummary}
              onChange={(e) => setFindingsSummary(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Laboratory / Imaging Narrative Report Snippet
            </label>
            <textarea
              rows={2}
              required
              value={rawReportSnippet}
              onChange={(e) => setRawReportSnippet(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 font-mono text-[11px]"
            />
          </div>

          {/* Urgency & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Clinical Urgency (MD Approved)
              </label>
              <select
                value={clinicalUrgency}
                onChange={(e) => setClinicalUrgency(e.target.value as ClinicalUrgency)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 font-bold"
              >
                <option value="CRITICAL_72H">Critical (72h SLA)</option>
                <option value="HIGH_14D">High (14d SLA)</option>
                <option value="MODERATE_30D">Moderate (30d SLA)</option>
                <option value="ROUTINE_60D">Routine (60d SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Target Action Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Initial Action Step
            </label>
            <input
              type="text"
              required
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Register Case in Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
