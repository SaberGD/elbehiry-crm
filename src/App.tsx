import { PWAProvider } from "./pwa/PWAContext";
import { PWAStatus } from "./pwa/PWAControls";
import { canAccessPage } from "./lib/access";
import { PermissionsPage } from "./pages/PermissionsPage";
import React, { useState } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CRMProvider, useCRM } from "./context/CRMContext";
import { LoginPage, LoadingScreen, BlockedScreen } from "./pages/LoginPage";
import { ViewAsBar } from "./components/layout/ViewAsBar";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import {
  LeadDetailsModal,
  LeadQuickAction,
} from "./components/common/LeadDetailsModal";

import { DepartmentDashboardPage } from "./pages/DepartmentDashboardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { AddLeadPage } from "./pages/AddLeadPage";
import { VisitsPage } from "./pages/VisitsPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { BookingsPage } from "./pages/BookingsPage";
import { StaffUsersPage } from "./pages/StaffUsersPage";
import { BranchesTeamsPage } from "./pages/BranchesTeamsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { SettingsPage } from "./pages/SettingsPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { BrokersPage } from "./pages/BrokersPage";
import { Lead } from "./types/crm";

const AppContent: React.FC = () => {
  const { leads, effectiveUser } = useCRM();

  const [requestedTab, setRequestedTab] = useState("dashboard");
  const activeTab = canAccessPage(effectiveUser, requestedTab)
    ? requestedTab
    : "dashboard";
  const setActiveTab = (tab: string) =>
    setRequestedTab(canAccessPage(effectiveUser, tab) ? tab : "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Selected lead modal state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalAction, setLeadModalAction] =
    useState<LeadQuickAction | null>(null);

  const handleOpenLead = (leadId: string) => {
    if (!leads.some((l) => l.id === leadId)) return;
    setSelectedLeadId(leadId);
    setLeadModalAction(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenExistingLead = (lead: Lead, action?: LeadQuickAction) => {
    if (!leads.some((l) => l.id === lead.id)) return;
    setSelectedLeadId(lead.id);
    setLeadModalAction(action ?? null);
    setIsLeadModalOpen(true);
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  return (
    <div className="behery-app">
      <a className="skip-link" href="#main-content">
        انتقل للمحتوى
      </a>
      {/* Executive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout Area with Dynamic Right Padding for Collapsed/Expanded Sidebar */}
      <div className="workspace-content">
        {/* View As Notice Bar */}
        <ViewAsBar />

        {/* Executive Sticky Top Navigation */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeTab}
          onOpenLead={handleOpenLead}
        />

        {/* Viewport Content Area */}
        <main id="main-content" className="workspace-main">
          <div key={activeTab} className="animate-page-enter min-w-0">
            {activeTab === "dept_dashboard" && (
              <DepartmentDashboardPage
                setActiveTab={setActiveTab}
                onOpenLead={handleOpenLead}
              />
            )}

            {(activeTab === "analytics_dashboard" ||
              activeTab === "dashboard") && (
              <DashboardPage
                setActiveTab={setActiveTab}
                onOpenLead={handleOpenLead}
              />
            )}

            {activeTab === "clients" && (
              <LeadsPage
                onOpenLead={handleOpenLead}
                onNavigateAddLead={() => setActiveTab("add_client")}
              />
            )}

            {activeTab === "add_client" && (
              <AddLeadPage
                onSuccessNavigate={() => setActiveTab("clients")}
                onOpenExistingLead={handleOpenExistingLead}
              />
            )}

            {(activeTab === "visits" || activeTab === "record_visit") && (
              <VisitsPage onOpenLead={handleOpenLead} />
            )}

            {(activeTab === "followups" ||
              activeTab === "due_followups" ||
              activeTab === "overdue_followups") && (
              <FollowUpsPage
                initialTab={
                  activeTab === "overdue_followups" ? "overdue" : "due"
                }
                onOpenLead={handleOpenLead}
              />
            )}

            {activeTab === "bookings" && (
              <BookingsPage onOpenLead={handleOpenLead} />
            )}

            {activeTab === "invoices" && <InvoicesPage />}

            {activeTab === "brokers" && <BrokersPage />}

            {activeTab === "users" && <StaffUsersPage />}

            {activeTab === "branches" && (
              <BranchesTeamsPage
                onOpenLead={handleOpenLead}
                onAddClientForBranch={() => setActiveTab("add_client")}
              />
            )}

            {activeTab === "teams" && <TeamsPage onOpenLead={handleOpenLead} />}

            {activeTab === "reports" && <ReportsPage />}

            {activeTab === "audit" && <AuditLogPage />}

            {activeTab === "settings" && <SettingsPage />}
            {activeTab === "permissions" && <PermissionsPage />}
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
        initialAction={leadModalAction}
        onClose={() => {
          setIsLeadModalOpen(false);
          setLeadModalAction(null);
        }}
      />
    </div>
  );
};

function WorkspaceShell() {
  const { effectiveUser } = useCRM();
  return (
    <AppContent
      key={`${effectiveUser.id}:${effectiveUser.role}:${effectiveUser.specialty}:${JSON.stringify(effectiveUser.permissions)}`}
    />
  );
}

const AuthGate: React.FC = () => {
  const { status } = useAuth();
  if (status === "loading") return <LoadingScreen />;
  if (status === "signed_out") return <LoginPage />;
  if (status === "no_profile" || status === "inactive")
    return <BlockedScreen kind={status} />;
  return (
    <CRMProvider>
      <WorkspaceShell />
    </CRMProvider>
  );
};

export default function App() {
  return (
    <PWAProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
      <PWAStatus />
    </PWAProvider>
  );
}
