import React, { useState } from 'react';
import { 
  FlaskConical, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  FileEdit, 
  Plus, 
  Clock, 
  AlertTriangle, 
  Check, 
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ScreeningCase } from '../../types/careloop';
import { formatStage, getStageBadgeColor, getUrgencyBadgeColor } from '../../utils/formatters';

interface LaboratoryWorkspaceProps {
  onSelectCase: (caseId: string) => void;
  onOpenNewCase: () => void;
}

export const LaboratoryWorkspace: React.FC<LaboratoryWorkspaceProps> = ({
  onSelectCase,
  onOpenNewCase,
}) => {
  const { 
    cases, 
    issueLabCorrection, 
    verifyLabReceipt, 
    currentRoleProfile,
    permissions 
  } = useCareLoop();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCaseForAddendum, setSelectedCaseForAddendum] = useState<ScreeningCase | null>(null);
  const [addendumText, setAddendumText] = useState('');
  const [confirmedCases, setConfirmedCases] = useState<Record<string, boolean>>({});

  const labCases = cases.filter(c => 
    c.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.testName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.mrn.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleVerifyReceipt = (caseId: string) => {
    verifyLabReceipt(caseId);
    setConfirmedCases(prev => ({ ...prev, [caseId]: true }));
  };

  const handleIssueAddendum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForAddendum || !addendumText.trim()) return;

    issueLabCorrection(selectedCaseForAddendum.id, addendumText.trim());
    setSelectedCaseForAddendum(null);
    setAddendumText('');
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-emerald-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Laboratory & Screening Provider Workspace</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Diagnostic Network Interface
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Active Organization: <strong className="text-slate-800">{currentRoleProfile.name}</strong> · {currentRoleProfile.organization}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewCase}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Screening Result</span>
            </button>
          </div>
        </div>

        {/* CLINICAL GUARDRAIL ENFORCEMENT BANNER */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong className="font-semibold block">Regulatory & Clinical Guardrail:</strong>
            Screening facilities and pathology laboratories provide diagnostic findings and amendments, but 
            <strong className="underline ml-1">CANNOT independently close patient care pathways</strong>. 
            Loop closure requires authorized primary care or specialist clinician sign-off with documented follow-up care evidence.
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Submitted</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{cases.length}</div>
            <div className="text-[10px] text-slate-500">Transmitted into CareLoop</div>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Critical Findings</div>
            <div className="text-xl font-bold text-rose-700 mt-1">
              {cases.filter(c => c.clinicalUrgency === 'CRITICAL_72H').length}
            </div>
            <div className="text-[10px] text-rose-600">Urgent 72h alert triggered</div>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Receipt Verified</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {cases.filter(c => c.evidenceChecklist.clinicianReviewCompleted).length}
            </div>
            <div className="text-[10px] text-emerald-700">Attending physician inbox</div>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Lab Amendments</div>
            <div className="text-xl font-bold text-indigo-700 mt-1">
              {cases.filter(c => c.notes?.some(n => n.category === 'CLINICAL' && n.content.includes('ADDENDUM'))).length}
            </div>
            <div className="text-[10px] text-indigo-600">Corrections logged</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Screening Results Registry & Transmission Log ({labCases.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify receipt by clinical care teams and transmit diagnostic amendments or addenda.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search lab submissions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {labCases.map(c => {
            const hasAddendum = c.notes?.some(n => n.category === 'CLINICAL' && n.content.includes('ADDENDUM'));
            const isConfirmed = confirmedCases[c.id] || c.evidenceChecklist.clinicianReviewCompleted;

            return (
              <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.id}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                    <span className="text-xs text-slate-400">MRN: {c.mrn}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                      {c.clinicalUrgency.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStageBadgeColor(c.stage)}`}>
                      {formatStage(c.stage)}
                    </span>
                    {hasAddendum && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        AMENDMENT ATTACHED
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-800">
                    <strong className="text-slate-900">{c.testName}</strong>: <span className="text-slate-700 font-medium">{c.findingsSummary}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Issued: {new Date(c.receivedDate).toLocaleString()}</span>
                    <span>·</span>
                    <span>Recipient: {c.responsibleOwner} ({c.assignedOrganization})</span>
                    <span>·</span>
                    <span className={isConfirmed ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                      {isConfirmed ? '✓ Recipient Receipt Confirmed' : '⌛ Awaiting Recipient Confirmation'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isConfirmed ? (
                    <button
                      onClick={() => handleVerifyReceipt(c.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Verify Receipt
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 rounded-lg font-medium flex items-center gap-1 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCaseForAddendum(c);
                      setAddendumText('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Issue Addendum</span>
                  </button>

                  <button
                    onClick={() => onSelectCase(c.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Addendum Modal */}
      {selectedCaseForAddendum && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Issue Diagnostic Addendum / Correction</h3>
            <p className="text-xs text-slate-500 mt-1">
              Case: <strong>{selectedCaseForAddendum.id}</strong> · Patient: {selectedCaseForAddendum.patientName}
            </p>

            <form onSubmit={handleIssueAddendum} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-slate-500">Current Reported Finding:</div>
                <div className="font-medium text-slate-800">{selectedCaseForAddendum.findingsSummary}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amended Finding / Corrected Value *
                </label>
                <textarea
                  required
                  rows={3}
                  value={addendumText}
                  onChange={(e) => setAddendumText(e.target.value)}
                  placeholder="e.g. Addendum: Specimen re-analyzed with supplemental immunohistochemical staining. Histopathology reveals high-grade dysplasia..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
                <strong>Audit Notice:</strong> This addendum will be permanently attached to the patient case timeline and alert the responsible care team of the diagnostic revision.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForAddendum(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Transmit Addendum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
