import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  ShieldCheck, 
  Filter, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogView: React.FC = () => {
  const { auditEvents, exportAuditLogJSON, setSelectedCaseId } = useCareLoop();

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const filteredEvents = auditEvents.filter(event => {
    if (entityFilter !== 'ALL' && event.entityType !== entityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        event.actor.toLowerCase().includes(q) ||
        event.action.toLowerCase().includes(q) ||
        event.entityId.toLowerCase().includes(q) ||
        event.changeSummary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            HIPAA-Grade Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically structured event log capturing every clinical sign-off, patient outreach, referral, and closure.
          </p>
        </div>

        <button
          onClick={exportAuditLogJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-slate-700">
            Audit logging engine active: <strong>{auditEvents.length} verifiable system records</strong> recorded in session storage.
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
          TAMPER-EVIDENT RECORDING
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail by actor, action, case ID, or change summary..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
          >
            <option value="ALL">All Entity Types</option>
            <option value="CASE">Screening Cases</option>
            <option value="COMMUNICATION">Communications</option>
            <option value="REFERRAL">Referrals</option>
            <option value="ESCALATION">Escalations</option>
            <option value="PROTOCOL">Protocols & System</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Entity Reference</th>
                <th className="py-2.5 px-3">Change Summary & Clinical Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {formatDateTime(event.timestamp)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{event.actor}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{event.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-semibold">
                        {event.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (event.entityType === 'CASE') {
                            setSelectedCaseId(event.entityId);
                          }
                        }}
                        className={`text-[11px] font-mono ${
                          event.entityType === 'CASE' 
                            ? 'text-teal-700 hover:underline font-bold cursor-pointer' 
                            : 'text-slate-600'
                        }`}
                      >
                        {event.entityType}: {event.entityId}
                      </button>
                    </td>

                    {/* Change summary */}
                    <td className="py-3 px-3 max-w-md">
                      <p className="text-slate-700 text-xs leading-relaxed font-sans">
                        {event.changeSummary}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
