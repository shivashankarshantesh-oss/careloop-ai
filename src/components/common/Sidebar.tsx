import React from 'react';
import { 
  LayoutDashboard, 
  FolderGit2, 
  MessageSquareShare, 
  Share2, 
  AlertOctagon, 
  BarChart3, 
  FileText, 
  Sliders, 
  Activity,
  Layers,
  CheckCircle,
  Menu,
  X,
  Briefcase,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import { useCareLoop } from '../../context/CareLoopContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  isMobileOpen, 
  setIsMobileOpen 
}) => {
  const { metrics, escalations, currentRoleType, currentRoleProfile, permissions, setIsJudgeDemoModalOpen } = useCareLoop();

  // Role workspace labels
  const roleWorkspaceLabel = {
    CARE_COORDINATOR: 'Coordinator Queue',
    PRIMARY_CARE_CLINICIAN: 'Clinician Workspace',
    SPECIALIST_PROVIDER: 'Specialist Triage',
    LABORATORY_PROVIDER: 'Laboratory Portal',
    PATIENT: 'My Patient Portal',
    CLINICAL_SUPERVISOR: 'Supervisor Console',
  }[currentRoleType];

  const navItems = permissions.isPatientPortal ? [
    {
      id: 'workspace',
      label: 'My Care & Next Steps',
      icon: HeartHandshake,
      badge: null,
      isPrimary: true,
    },
  ] : [
    {
      id: 'workspace',
      label: roleWorkspaceLabel,
      icon: Briefcase,
      badge: currentRoleType === 'CARE_COORDINATOR' ? metrics.awaitingPatientAck : null,
      badgeColor: 'text-teal-700 font-bold',
      isPrimary: true,
    },
    {
      id: 'overview',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'cases',
      label: 'Screening Registry',
      icon: FolderGit2,
      badge: metrics.openActionableCases,
      badgeColor: 'text-slate-600',
    },
    {
      id: 'communication',
      label: 'Patient Outreach',
      icon: MessageSquareShare,
      badge: metrics.awaitingPatientAck,
      badgeColor: 'text-amber-700 font-semibold',
    },
    {
      id: 'referrals',
      label: 'Specialist Referrals',
      icon: Share2,
      badge: metrics.pendingReferrals,
      badgeColor: 'text-teal-700',
    },
    {
      id: 'escalations',
      label: 'SLA Escalations',
      icon: AlertOctagon,
      badge: escalations.filter(e => e.status !== 'RESOLVED').length,
      badgeColor: 'text-rose-600 font-bold',
    },
    {
      id: 'analytics',
      label: 'Loop Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: FileText,
      badge: null,
    },
    {
      id: 'protocols',
      label: 'Protocols & SLAs',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Title */}
        <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                CareLoop <span className="text-teal-600 font-extrabold">AI</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 tracking-tight">
                Closed-Loop Care Coordination
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Callout */}
        <div className="px-3 pt-3 pb-2">
          <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600">
            <div className="font-semibold text-slate-800 text-[10px] uppercase tracking-wider">
              Future Health Challenge
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              Ensuring no actionable laboratory or imaging finding is dropped.
            </div>
          </div>
        </div>

        {/* Judge Demo Quick Action */}
        {!permissions.isPatientPortal && (
          <div className="px-3 pb-2">
            <button
              onClick={() => {
                setIsJudgeDemoModalOpen(true);
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-xs transition-colors cursor-pointer border border-amber-500/40 group"
              title="Open Interactive Judge Demonstration Stepper (Steps A-J)"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-900 group-hover:rotate-12 transition-transform" />
                <span>Run Demo Scenario</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/30 text-amber-950 px-1.5 py-0.2 rounded font-extrabold">
                A–J
              </span>
            </button>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : item.isPrimary
                    ? 'bg-teal-50/70 text-teal-950 font-bold border border-teal-200/90 hover:bg-teal-100/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-teal-400' : item.isPrimary ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'text-teal-200 bg-slate-800' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Closed-loop Compliance Summary Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Evidence Closure Goal
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.evidenceClosureRatePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>Verified Closure</span>
            <span className="font-semibold text-teal-800">{metrics.evidenceClosureRatePercent}%</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate">Safety Rule Engine Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};
