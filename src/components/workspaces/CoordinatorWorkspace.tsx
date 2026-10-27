import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  Share2, 
  Calendar, 
  Plus, 
  Filter, 
  Check, 
  ArrowRight, 
  MessageSquare,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { ScreeningCase, Task } from '../../types/careloop';
import { formatStage, getStageBadgeColor, getUrgencyBadgeColor, getExceptionBadge } from '../../utils/formatters';

interface CoordinatorWorkspaceProps {
  onSelectCase: (caseId: string) => void;
  onOpenOutreach: () => void;
  onOpenReferrals: () => void;
}

export const CoordinatorWorkspace: React.FC<CoordinatorWorkspaceProps> = ({
  onSelectCase,
  onOpenOutreach,
  onOpenReferrals,
}) => {
  const { 
    cases, 
    tasks, 
    toggleTask, 
    createTask, 
    reassignOwner, 
    recordPatientAcknowledgement, 
    currentRoleProfile,
    patients 
  } = useCareLoop();

  const getPatientPhone = (patientId: string) => patients.find(p => p.id === patientId)?.phone || 'On file';

  const [activeQueue, setActiveQueue] = useState<'unassigned' | 'acknowledgements' | 'overdueTasks' | 'handoffs' | 'missedAppts'>('unassigned');
  const [assigningCaseId, setAssigningCaseId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('Maria Ramos, RN');
  const [selectedOrg, setSelectedOrg] = useState<string>('MetroHealth Coordination Center');
  
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCaseId, setNewTaskCaseId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');

  // Queues
  const unassignedCases = cases.filter(c => 
    (!c.responsibleOwner || c.responsibleOwner === 'Unassigned' || c.responsibleOwner.toLowerCase().includes('unassigned')) &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const pendingAckCases = cases.filter(c => 
    (c.stage === 'AWAITING_ACKNOWLEDGEMENT' || c.stage === 'PATIENT_NOTIFIED') &&
    !c.evidenceChecklist.patientAcknowledged
  );

  const coordinatorTasks = tasks.filter(t => 
    t.owner.includes('Coordinator') || t.owner.includes('Maria Ramos')
  );
  const pendingTasks = coordinatorTasks.filter(t => t.status === 'PENDING');
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < new Date());

  const missedAppointmentCases = cases.filter(c => 
    c.exceptionStatus === 'APPOINTMENT_MISSED' && c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const handoffCases = cases.filter(c => 
    (c.stage === 'REFERRAL_PENDING' || c.stage === 'CONFIRMATION_OR_CONSULTATION_PENDING' || c.exceptionStatus === 'REFERRAL_REJECTED') &&
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const atRiskCases = cases.filter(c => 
    (c.isOverdue || c.clinicalUrgency === 'CRITICAL_72H') && 
    c.stage !== 'CLOSED_WITH_EVIDENCE'
  );

  const handleAssign = (caseId: string) => {
    reassignOwner(caseId, selectedAssignee, selectedOrg, 'Assigned via Care Coordinator Workspace');
    setAssigningCaseId(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const targetCase = cases.find(c => c.id === newTaskCaseId);
    createTask({
      caseId: newTaskCaseId || 'CASE-2026-001',
      patientName: targetCase?.patientName || 'Assigned Patient',
      title: newTaskTitle.trim(),
      owner: 'Maria Ramos, RN (Care Coordinator)',
      dueDate: new Date(newTaskDueDate).toISOString(),
      priority: newTaskPriority,
    });
    setNewTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-teal-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Care Coordinator Workspace</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Ambulatory Coordination
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Active User: <strong className="text-slate-800">{currentRoleProfile.name}</strong> · {currentRoleProfile.organization}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
            <button
              onClick={onOpenOutreach}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Outreach Hub</span>
            </button>
          </div>
        </div>

        {/* Action Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveQueue('unassigned')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeQueue === 'unassigned' 
                ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Unassigned</span>
              <UserPlus className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{unassignedCases.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Require case manager</div>
          </button>

          <button
            onClick={() => setActiveQueue('acknowledgements')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeQueue === 'acknowledgements' 
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Awaiting Ack</span>
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{pendingAckCases.length}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Patient contact pending</div>
          </button>

          <button
            onClick={() => setActiveQueue('overdueTasks')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeQueue === 'overdueTasks' 
                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Overdue Tasks</span>
              <Clock className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{overdueTasks.length}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">{pendingTasks.length} total pending</div>
          </button>

          <button
            onClick={() => setActiveQueue('handoffs')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeQueue === 'handoffs' 
                ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Referral Handoffs</span>
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 mt-1">{handoffCases.length}</div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Specialty transfer</div>
          </button>

          <button
            onClick={() => setActiveQueue('missedAppts')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeQueue === 'missedAppts' 
                ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300' 
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Missed Appts</span>
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{missedAppointmentCases.length}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Reschedule required</div>
          </button>
        </div>
      </div>

      {/* Main Work Queue List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {activeQueue === 'unassigned' && `Unassigned Cases Queue (${unassignedCases.length})`}
              {activeQueue === 'acknowledgements' && `Pending Patient Acknowledgements (${pendingAckCases.length})`}
              {activeQueue === 'overdueTasks' && `Overdue Coordinator Action Tasks (${overdueTasks.length})`}
              {activeQueue === 'handoffs' && `Referral Handoffs & Transfers (${handoffCases.length})`}
              {activeQueue === 'missedAppts' && `Missed Appointments & At-Risk Rescheduling (${missedAppointmentCases.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeQueue === 'unassigned' && 'Assign a dedicated nurse or coordinator to guarantee accountability for these actionable findings.'}
              {activeQueue === 'acknowledgements' && 'Screening results notified; patient has not yet confirmed receipt and understanding.'}
              {activeQueue === 'overdueTasks' && 'Direct coordinator tasks that have crossed their designated SLA targets.'}
              {activeQueue === 'handoffs' && 'Monitor specialist transmission, acceptance, and resolve rejected consults.'}
              {activeQueue === 'missedAppts' && 'Patients who did not appear for scheduled appointments; prompt outreach prevents drop-offs.'}
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            At-Risk Queue Total: <strong className="text-rose-700">{atRiskCases.length}</strong>
          </div>
        </div>

        {/* Content of Active Queue */}
        <div className="divide-y divide-slate-100">
          {/* QUEUE 1: UNASSIGNED */}
          {activeQueue === 'unassigned' && (
            unassignedCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Zero Unassigned Cases</p>
                <p className="mt-1">Every open screening case in the registry has a designated clinical owner.</p>
              </div>
            ) : (
              unassignedCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
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
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      {c.testName}: <span className="text-slate-600 font-normal">{c.findingsSummary}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Received: {new Date(c.receivedDate).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="text-rose-600 font-medium">Due: {new Date(c.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {assigningCaseId === c.id ? (
                      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                        >
                          <option value="Maria Ramos, RN">Maria Ramos, RN (Care Coordinator)</option>
                          <option value="Dr. Sarah Chen, MD">Dr. Sarah Chen, MD (Lead PCP)</option>
                          <option value="Ambulatory Float Coordinator">Ambulatory Float Coordinator</option>
                        </select>
                        <button
                          onClick={() => handleAssign(c.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setAssigningCaseId(null)}
                          className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setAssigningCaseId(c.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Assign Case
                        </button>
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )
          )}

          {/* QUEUE 2: PENDING ACKNOWLEDGEMENTS */}
          {activeQueue === 'acknowledgements' && (
            pendingAckCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All Patients Acknowledged</p>
                <p className="mt-1">No outstanding unconfirmed patient notifications in this queue.</p>
              </div>
            ) : (
              pendingAckCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="text-xs text-slate-500">Contact: {getPatientPhone(c.patientId)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getUrgencyBadgeColor(c.clinicalUrgency)}`}>
                        {c.clinicalUrgency.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Finding: <strong className="text-slate-800">{c.testName}</strong> — {c.findingsSummary}
                    </div>
                    <div className="text-[11px] text-amber-700 font-medium">
                      Action Required: {c.nextAction}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => recordPatientAcknowledgement(c.id, undefined, 'Coordinator Direct Phone Confirmation', 'Patient verified via telephone with RN Maria Ramos.')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Record Phone Ack
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Case Workspace
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* QUEUE 3: OVERDUE COORDINATOR TASKS */}
          {activeQueue === 'overdueTasks' && (
            coordinatorTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Coordinator Tasks</p>
              </div>
            ) : (
              coordinatorTasks.map(t => {
                const isOverdue = new Date(t.dueDate) < new Date() && t.status === 'PENDING';
                return (
                  <div key={t.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(t.id, 'Completed via Coordinator Action Console')}
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                          t.status === 'COMPLETED'
                            ? 'bg-teal-600 text-white'
                            : 'border-2 border-slate-300 hover:border-teal-500'
                        }`}
                      >
                        {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {t.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Patient: <strong className="text-slate-700">{t.patientName}</strong> · Case: {t.caseId}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-slate-500">
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => onSelectCase(t.caseId)}
                        className="text-xs text-teal-700 hover:text-teal-800 font-medium mt-1 cursor-pointer block"
                      >
                        Open Case →
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* QUEUE 4: REFERRAL HANDOFFS */}
          {activeQueue === 'handoffs' && (
            handoffCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Pending Specialty Handoffs</p>
              </div>
            ) : (
              handoffCases.map(c => (
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStageBadgeColor(c.stage)}`}>
                        {formatStage(c.stage)}
                      </span>
                      {c.exceptionStatus === 'REFERRAL_REJECTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          REFERRAL REJECTED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-700">
                      Destination: <strong className="text-slate-900">{c.assignedOrganization}</strong> · Owner: {c.responsibleOwner}
                    </div>
                    <div className="text-xs text-slate-600">{c.nextAction}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onOpenReferrals}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Manage Referral
                    </button>
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Case Workspace
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* QUEUE 5: MISSED APPOINTMENTS */}
          {activeQueue === 'missedAppts' && (
            missedAppointmentCases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No Missed Appointments</p>
                <p className="mt-1">All scheduled patient appointments are currently confirmed or attended.</p>
              </div>
            ) : (
              missedAppointmentCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-purple-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-purple-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{c.patientName}</span>
                      <span className="text-xs text-slate-500">Phone: {getPatientPhone(c.patientId)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                        MISSED APPOINTMENT
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      Reason: <strong className="text-purple-900">{c.exceptionReason || 'Patient did not appear at scheduled clinic'}</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Scheduled facility: {c.appointmentDetail?.facility || 'Gastroenterology Center'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Reschedule Slot
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* New Coordinator Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create Coordinator Task</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add an action item with explicit due date to prevent patient care drop-offs.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call patient to confirm bowel prep pick-up"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Case
                </label>
                <select
                  value={newTaskCaseId}
                  onChange={(e) => setNewTaskCaseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">-- Select Case --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.patientName} ({c.testName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (SLA Critical)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
