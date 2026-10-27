import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  RotateCcw, 
  Plus, 
  ShieldAlert, 
  UserCheck, 
  ChevronDown, 
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';
import { RoleType, ROLE_PROFILES } from '../../utils/permissions';

interface HeaderProps {
  onOpenNewCase: () => void;
  onSelectNav: (nav: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewCase, onSelectNav }) => {
  const { 
    currentRole, 
    setCurrentRole, 
    currentRoleType,
    setCurrentRoleType,
    currentRoleProfile,
    permissions,
    currentPatientId,
    setCurrentPatientId,
    patients,
    cases, 
    escalations, 
    resetToDemoData, 
    setSelectedCaseId,
    setIsJudgeDemoModalOpen
  } = useCareLoop();

  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roleTypes: RoleType[] = [
    'CARE_COORDINATOR',
    'PRIMARY_CARE_CLINICIAN',
    'SPECIALIST_PROVIDER',
    'LABORATORY_PROVIDER',
    'PATIENT',
    'CLINICAL_SUPERVISOR',
  ];

  // Active notifications: active escalations & overdue cases
  const activeEscalations = escalations.filter(e => e.status === 'ACTIVE');
  const overdueCases = cases.filter(c => c.isOverdue && c.stage !== 'CLOSED_WITH_EVIDENCE');
  const totalAlertCount = activeEscalations.length + overdueCases.length;

  // Search matching
  const searchResults = searchQuery.trim().length > 1
    ? cases.filter(c => 
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.testName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Synthetic Data Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-950">SYNTHETIC CLINICAL ENVIRONMENT:</strong> All patient records, MRNs, and lab findings are entirely synthetic test data for demonstration purposes. Not connected to live EHR systems; not for actual clinical use.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-amber-800 font-mono">
          <span>SLA Monitor: Active</span>
          <span>·</span>
          <span>Protocol Rules: Enforced</span>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, MRN, case ID, or test..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-colors text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-100">
                Matching Screening Cases ({searchResults.length})
              </div>
              {searchResults.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{c.patientName}</span>
                    <span className="text-slate-400 ml-1.5 font-mono text-[11px]">{c.mrn}</span>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.testName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {c.id}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Judge Demo Scenario Button */}
          <button
            onClick={() => setIsJudgeDemoModalOpen(true)}
            title="Open Interactive Judge Demonstration Stepper (Steps A-J)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-md shadow-xs transition-colors cursor-pointer border border-amber-500/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span className="font-extrabold tracking-tight">Run Demo Scenario</span>
          </button>

          {/* New Case Intake Button */}
          <button
            onClick={onOpenNewCase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Intake Result</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset data to initial demonstration state"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Escalations and Overdue Alerts"
            >
              <Bell className="w-4 h-4" />
              {totalAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {totalAlertCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-900">Urgent Loop Alerts</div>
                  <span className="text-[10px] font-mono text-slate-500">{totalAlertCount} items</span>
                </div>
                
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {activeEscalations.length === 0 && overdueCases.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                      All screening cases currently compliant with SLA targets.
                    </div>
                  ) : (
                    <>
                      {activeEscalations.map(esc => (
                        <div 
                          key={esc.id} 
                          className="p-2.5 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedCaseId(esc.caseId);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{esc.severity.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="font-semibold text-slate-900 mt-0.5">{esc.patientName}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{esc.reason}</p>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {esc.slaHoursRemaining}h remaining SLA
                          </div>
                        </div>
                      ))}

                      {overdueCases.map(c => (
                        <div 
                          key={c.id} 
                          className="p-2.5 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                            <span>OVERDUE ACTION</span>
                          </div>
                          <div className="font-semibold text-slate-900">{c.patientName}</div>
                          <div className="text-[11px] text-slate-600">{c.nextAction}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[11px]">
                  <button 
                    onClick={() => {
                      onSelectNav('escalations');
                      setShowNotifications(false);
                    }}
                    className="text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
                  >
                    View Escalation Console →
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Active Role Selector with Simulation Disclaimer */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <div className="text-left hidden lg:block">
                <div className="leading-tight font-bold text-slate-900 max-w-[180px] truncate">
                  {currentRoleProfile.name}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold leading-tight">
                  {currentRoleProfile.title.split('(')[0].trim()}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                <div className="px-3.5 py-2 border-b border-slate-100 bg-amber-50/60">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>DEMO SIMULATION: Role Switcher</span>
                  </div>
                  <p className="text-[10px] text-amber-900/80 mt-0.5 leading-snug">
                    Testing prototype: Experience specific clinical, administrative, and patient views with enforced role permissions.
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                  {roleTypes.map(rType => {
                    const prof = ROLE_PROFILES[rType];
                    const isSelected = currentRoleType === rType;
                    return (
                      <button
                        key={rType}
                        onClick={() => {
                          setCurrentRoleType(rType);
                          setShowRoleMenu(false);
                          onSelectNav('workspace');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                            {prof.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${prof.badgeColor}`}>
                            {rType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                          {prof.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {prof.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectNav('workspace');
                      setShowRoleMenu(false);
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    Open Active Workspace →
                  </button>
                  <button
                    onClick={() => setShowRoleMenu(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Reset Demo Data?</h3>
            <p className="text-xs text-slate-600 mt-2">
              This will restore all 14 synthetic patient cases, communication records, tasks, and referrals to their default demonstration states.
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
