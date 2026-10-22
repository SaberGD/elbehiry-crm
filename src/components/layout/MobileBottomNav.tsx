import { useCRM } from "../../context/CRMContext";
import { useLanguage } from "../../context/LanguageContext";
import { canAccessPage, isSales, worksOwnCustomers } from "../../lib/access";
import { LayoutDashboard, Users, PhoneCall, Plus, Menu } from "lucide-react";
interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
}
export function MobileBottomNav({
  activeTab,
  setActiveTab,
  setSidebarOpen,
}: Props) {
  const { effectiveUser } = useCRM();
  const { tr } = useLanguage();
  const items = [
    { id: "dashboard", label: tr("الرئيسية", "Home"), Icon: LayoutDashboard },
    { id: "clients", label: tr("العملاء", "Customers"), Icon: Users },
    canAccessPage(effectiveUser, "add_client")
      ? { id: "add_client", label: tr("إضافة عميل", "Add customer"), Icon: Plus }
      : { id: "reports", label: tr("التقارير", "Reports"), Icon: LayoutDashboard },
    {
      id: "followups",
      label: worksOwnCustomers(effectiveUser) ? tr("متابعاتي", "My follow-ups") : tr("المتابعات", "Follow-ups"),
      Icon: PhoneCall,
    },
  ];
  return (
    <nav className="mobile-nav" aria-label={tr("التنقل السريع", "Quick navigation")}>
      {items
        .filter((item) => canAccessPage(effectiveUser, item.id))
        .map(({ id, label, Icon }) => (
          <button
            key={id}
            className={id === "add_client" ? "mobile-add" : ""}
            aria-current={activeTab === id ? "page" : undefined}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      <button onClick={() => setSidebarOpen(true)}>
        <Menu size={21} />
        <span>{tr("المزيد", "More")}</span>
      </button>
    </nav>
  );
}
