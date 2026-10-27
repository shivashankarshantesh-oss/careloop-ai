import React from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  FileCheck2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Layers 
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { getScreeningLabel, getUrgencyBadgeClasses } from '../../utils/formatters';

export const ProtocolsView: React.FC = () => {
  const { protocols } = useCareLoop();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Clinical Protocols, Quality Guidelines & SLAs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evidence-based standard operating guidelines defining mandatory closed-loop requirements and turnaround times.
          </p>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-lg space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Evidence-Based Care Quality Framework</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Actionable findings are governed by national specialty taskforces (USPSTF, ACR, ASCCP, USMSTF, AAO). 
          Under CareLoop AI protocol governance, clinical urgency may never be generated automatically without licensed clinician sign-off, 
          and no screening case may be archived without concrete documented proof.
        </p>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((p) => {
          const urgencyStyle = getUrgencyBadgeClasses(p.defaultUrgency);
          return (
            <div 
              key={p.type} 
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    Protocol Definition
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">
                    {p.title}
                  </h3>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                  Default: {p.defaultUrgency.split('_')[0]}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{p.guidelineSource}</span>
              </div>

              {/* SLA Targets */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">MD Review SLA</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{p.clinicianReviewSlaHours}h</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Outreach SLA</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{p.patientContactSlaDays} days</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Closure SLA</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{p.referralCompletedSlaDays} days</div>
                </div>
              </div>

              {/* Required Evidence to close loop */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mandatory Evidence Required for Loop Closure:
                </div>
                <ul className="text-xs text-slate-700 space-y-1">
                  {p.requiredEvidenceTypes.map(ev => (
                    <li key={ev} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
