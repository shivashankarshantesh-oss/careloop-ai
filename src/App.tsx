/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CareLoopProvider, useCareLoop } from './context/CareLoopContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { CaseList } from './components/cases/CaseList';
import { CaseDetailModal } from './components/cases/CaseDetailModal';
import { CommunicationCenter } from './components/communications/CommunicationCenter';
import { ReferralManager } from './components/referrals/ReferralManager';
import { EscalationManager } from './components/escalations/EscalationManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { ProtocolsView } from './components/protocols/ProtocolsView';
import { CoordinatorWorkspace } from './components/workspaces/CoordinatorWorkspace';
import { ClinicianWorkspace } from './components/workspaces/ClinicianWorkspace';
import { SpecialistWorkspace } from './components/workspaces/SpecialistWorkspace';
import { LaboratoryWorkspace } from './components/workspaces/LaboratoryWorkspace';
import { PatientPortal } from './components/workspaces/PatientPortal';
import { SupervisorWorkspace } from './components/workspaces/SupervisorWorkspace';
import { NewCaseModal } from './components/intake/NewCaseModal';
import { JudgeDemoModal } from './components/demo/JudgeDemoModal';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('workspace');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  const { selectedCaseId, setSelectedCaseId, currentRoleType, permissions } = useCareLoop();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <Header
            onOpenNewCase={() => setIsNewCaseModalOpen(true)}
            onSelectNav={setCurrentTab}
          />

          {/* Mobile menu trigger */}
          <div className="lg:hidden px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-1"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-900 capitalize">
              {currentTab.replace('_', ' ')}
            </span>
          </div>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* When in patient portal simulation, isolate to secure patient view */}
            {permissions.isPatientPortal ? (
              <PatientPortal />
            ) : (
              <>
                {currentTab === 'workspace' && (
                  <>
                    {currentRoleType === 'CARE_COORDINATOR' && (
                      <CoordinatorWorkspace
                        onSelectCase={setSelectedCaseId}
                        onOpenOutreach={() => setCurrentTab('communication')}
                        onOpenReferrals={() => setCurrentTab('referrals')}
                      />
                    )}
                    {currentRoleType === 'PRIMARY_CARE_CLINICIAN' && (
                      <ClinicianWorkspace
                        onSelectCase={setSelectedCaseId}
                        onOpenReferrals={() => setCurrentTab('referrals')}
                      />
                    )}
                    {currentRoleType === 'SPECIALIST_PROVIDER' && (
                      <SpecialistWorkspace
                        onSelectCase={setSelectedCaseId}
                      />
                    )}
                    {currentRoleType === 'LABORATORY_PROVIDER' && (
                      <LaboratoryWorkspace
                        onSelectCase={setSelectedCaseId}
                        onOpenNewCase={() => setIsNewCaseModalOpen(true)}
                      />
                    )}
                    {currentRoleType === 'CLINICAL_SUPERVISOR' && (
                      <SupervisorWorkspace
                        onSelectCase={setSelectedCaseId}
                        onOpenAudit={() => setCurrentTab('audit')}
                        onOpenAnalytics={() => setCurrentTab('analytics')}
                      />
                    )}
                  </>
                )}

                {currentTab === 'overview' && (
                  <OverviewDashboard onSelectNav={setCurrentTab} />
                )}
                {currentTab === 'cases' && (
                  <CaseList onOpenNewCase={() => setIsNewCaseModalOpen(true)} />
                )}
                {currentTab === 'communication' && <CommunicationCenter />}
                {currentTab === 'referrals' && <ReferralManager />}
                {currentTab === 'escalations' && <EscalationManager />}
                {currentTab === 'analytics' && <AnalyticsView />}
                {currentTab === 'audit' && <AuditLogView />}
                {currentTab === 'protocols' && <ProtocolsView />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Case Detail Modal / Drawer */}
      {selectedCaseId && (
        <CaseDetailModal onClose={() => setSelectedCaseId(null)} />
      )}

      {/* New Case Intake Modal */}
      {isNewCaseModalOpen && (
        <NewCaseModal onClose={() => setIsNewCaseModalOpen(false)} />
      )}

      {/* End-to-End Judge Demonstration Stepper Modal */}
      <JudgeDemoModal />
    </div>
  );
};

export default function App() {
  return (
    <CareLoopProvider>
      <AppContent />
    </CareLoopProvider>
  );
}
