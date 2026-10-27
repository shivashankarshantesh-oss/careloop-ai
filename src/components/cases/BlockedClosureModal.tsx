import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Square, 
  FileCheck, 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  FileText,
  AlertOctagon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ScreeningCase, ClosureEvidence } from '../../types/careloop';
import { getScreeningLabel } from '../../utils/formatters';

interface BlockedClosureModalProps {
  screeningCase: ScreeningCase;
  onClose: () => void;
  onNavigateToTab: (tab: 'workspace' | 'timeline' | 'outreach' | 'referrals' | 'checklist' | 'notes') => void;
  onCompleteItem: (actionType: string) => void;
  onClosureSuccess?: () => void;
}

export const BlockedClosureModal: React.FC<BlockedClosureModalProps> = ({
  screeningCase,
  onClose,
  onNavigateToTab,
  onCompleteItem,
  onClosureSuccess
}) => {
  const { 
    validateCaseClosure, 
    closeCaseWithAssurance, 
    currentRole, 
    permissions 
  } = useCareLoop();

  const validation = validateCaseClosure(screeningCase.id);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionRationale, setExceptionRationale] = useState('');
  const [exceptionDocId, setExceptionDocId] = useState(`EXC-DOC-${Date.now().toString(36).toUpperCase()}`);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCloseUnderException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionRationale.trim()) {
      setErrorMessage('A detailed clinical rationale is required to override missing closed-loop criteria.');
      return;
    }

    if (!permissions.canCloseCase) {
      setErrorMessage('Unauthorized: Your role does not have authority to grant clinical closure exceptions.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const evidence: ClosureEvidence = {
      type: 'SURVEILLANCE_PLAN',
      documentId: exceptionDocId,
      documentTitle: `Authorized Clinical Closure Exception (${screeningCase.screeningType})`,
      completedAt: new Date().toISOString(),
      verifiedBy: currentRole,
      clinicalNotes: `Authorized clinical exception documented: ${exceptionRationale}`,
      resectedOrNormalFinding: screeningCase.findingsSummary,
      nextRecommendedSurveillance: 'Protocol surveillance interval re-established under physician supervision',
    };

    const res = closeCaseWithAssurance(screeningCase.id, evidence, {
      rationale: exceptionRationale,
      approvedBy: currentRole,
    });

    setSubmitting(false);

    if (res.success) {
      if (onClosureSuccess) onClosureSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || 'Failed to endorse closure under exception.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-60 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-rose-900 text-white flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Care Closure Blocked — Missing Verifiable Evidence</span>
                <span className="text-[10px] font-mono uppercase bg-rose-950 px-2 py-0.5 rounded text-rose-300 border border-rose-800">
                  Closed-Loop Safeguard
                </span>
              </h2>
              <p className="text-xs text-rose-200">
                Case {screeningCase.id} · {screeningCase.patientName} ({getScreeningLabel(screeningCase.screeningType)})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-md hover:bg-rose-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Policy Guardrail Notice */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Closed-Loop Compliance Guarantee:</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                CareLoop AI enforces closed-loop care assurance. A case <strong>cannot</strong> be closed simply because time has passed, a letter was sent, or an appointment was requested. Every stage must satisfy verifiable evidence criteria configured for the <strong>{validation.pathwayName}</strong>.
              </p>
            </div>
          </div>

          {/* Missing Count Status */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-800">
              Evidence Checklist Status ({validation.checklist.filter(i => i.isComplete).length} of {validation.checklist.length} Complete)
            </span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {validation.missingItems.length} Missing Requirement{validation.missingItems.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* 8-Point Criteria List */}
          <div className="space-y-2">
            {validation.checklist.map((item, idx) => (
              <div 
                key={item.key} 
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                  item.isComplete 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {item.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-bold ${item.isComplete ? 'text-emerald-900' : 'text-rose-950'}`}>
                      {item.label}
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {!item.isComplete && (
                  <button
                    onClick={() => {
                      onClose();
                      onCompleteItem(item.key);
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 hover:border-rose-500 text-rose-700 hover:text-rose-900 rounded font-semibold text-[11px] shadow-2xs cursor-pointer transition-colors"
                  >
                    <span>Resolve Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Clinical Exception Override Section */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            {!showExceptionForm ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800">Authorized Human Clinical Exception Override</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    If clinical circumstances justify closure despite missing items (e.g. hospice transition, patient moved out of area, verified outside care completed), document an approved exception.
                  </p>
                </div>
                <button
                  onClick={() => setShowExceptionForm(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-2xs cursor-pointer shrink-0"
                >
                  Document Exception
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloseUnderException} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Document Authorized Clinical Exception</span>
                  <button
                    type="button"
                    onClick={() => setShowExceptionForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Document Ref / Outside Verification ID
                  </label>
                  <input
                    type="text"
                    value={exceptionDocId}
                    onChange={(e) => setExceptionDocId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clinical Exception Justification & Rationale <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={exceptionRationale}
                    onChange={(e) => setExceptionRationale(e.target.value)}
                    placeholder="Provide detailed clinical justification for closing loop without standard verifiable criteria (e.g., patient verified outside colonoscopy completed at Stanford Health on 10/12; records requested and pending)..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Signing Clinician:</strong> {currentRole}</div>
                  <div><strong>Audit Record:</strong> This exception will be permanently logged in the compliance audit trail.</div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExceptionForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Endorse Closure Under Exception'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            CareLoop Clinical Assurance Rule: 8-Point Criteria Verification
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-semibold cursor-pointer shadow-2xs"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
