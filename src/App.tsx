import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { ViewAsBar } from './components/layout/ViewAsBar';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LeadDetailsModal } from './components/common/LeadDetailsModal';

import { DepartmentDashboardPage } from './pages/DepartmentDashboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { AddLeadPage } from './pages/AddLeadPage';
import { VisitsPage } from './pages/VisitsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { BookingsPage } from './pages/BookingsPage';
import { StaffUsersPage } from './pages/StaffUsersPage';
import { BranchesTeamsPage } from './pages/BranchesTeamsPage';
import { TeamsPage } from './pages/TeamsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { BrokersPage } from './pages/BrokersPage';
import { Lead } from './types/crm';

const AppContent: React.FC = () => {
  const { leads } = useCRM();

  const [activeTab, setActiveTab] = useState('dept_dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Selected lead modal state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsLeadModalOpen(true);
  };

  const handleOpenExistingLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setIsLeadModalOpen(true);
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#07090e] text-[#0f172a] dark:text-[#e2e8f0] flex flex-col font-sans selection:bg-[#7295b3] selection:text-white relative overflow-x-hidden transition-colors duration-200 min-w-0">
      {/* Executive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Layout Area with Dynamic Right Padding for Collapsed/Expanded Sidebar */}
      <div className={`${isCollapsed ? 'lg:pr-20' : 'lg:pr-72'} transition-all duration-300 ease-in-out flex-1 flex flex-col min-w-0 w-full`}>
        {/* View As Notice Bar */}
        <ViewAsBar />

        {/* Executive Sticky Top Navigation */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeTab}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1600px] w-full mx-auto pb-24 lg:pb-10 min-w-0">
          <div key={activeTab} className="animate-page-enter min-w-0">
            {activeTab === 'dept_dashboard' && (
              <DepartmentDashboardPage
                setActiveTab={setActiveTab}
                onOpenLead={handleOpenLead}
              />
            )}

            {(activeTab === 'analytics_dashboard' || activeTab === 'dashboard') && (
              <DashboardPage
                setActiveTab={setActiveTab}
                onOpenLead={handleOpenLead}
              />
            )}

            {activeTab === 'clients' && (
              <LeadsPage
                onOpenLead={handleOpenLead}
                onNavigateAddLead={() => setActiveTab('add_client')}
              />
            )}

            {activeTab === 'add_client' && (
              <AddLeadPage
                onSuccessNavigate={() => setActiveTab('clients')}
                onOpenExistingLead={handleOpenExistingLead}
              />
            )}

            {(activeTab === 'visits' || activeTab === 'record_visit') && (
              <VisitsPage onOpenLead={handleOpenLead} />
            )}

            {(activeTab === 'followups' || activeTab === 'due_followups' || activeTab === 'overdue_followups') && (
              <FollowUpsPage onOpenLead={handleOpenLead} />
            )}

            {activeTab === 'bookings' && (
              <BookingsPage onOpenLead={handleOpenLead} />
            )}

            {activeTab === 'invoices' && <InvoicesPage />}

            {activeTab === 'brokers' && <BrokersPage />}

            {activeTab === 'users' && <StaffUsersPage />}

            {activeTab === 'branches' && (
              <BranchesTeamsPage
                onOpenLead={handleOpenLead}
                onAddClientForBranch={() => setActiveTab('add_client')}
              />
            )}

            {activeTab === 'teams' && (
              <TeamsPage onOpenLead={handleOpenLead} />
            )}

            {activeTab === 'reports' && <ReportsPage />}

            {activeTab === 'audit' && <AuditLogPage />}

            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Touch Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Central Lead Detail & Actions Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CRMProvider>
          <AppContent />
        </CRMProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
