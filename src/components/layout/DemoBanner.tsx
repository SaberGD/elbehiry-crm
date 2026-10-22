import { FlaskConical } from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { useLanguage } from "../../context/LanguageContext";

/** Reminder for whoever loaded the sample data: what is on screen is not real until it is removed. */
export function DemoBanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { demoSummary, currentUser } = useCRM();
  const { tr } = useLanguage();
  if (!demoSummary.any || currentUser.role !== "admin") return null;
  return (
    <div className="notice" role="status" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <FlaskConical size={17} />
      <span style={{ flex: 1, minWidth: 200 }}>
        <strong>{tr("بيانات تجريبية محمّلة", "Sample data loaded")}</strong> ({demoSummary.customers} {tr("عميل", "customers")} · {demoSummary.branches} {tr("فرع", "branches")} · {demoSummary.staff} {tr("موظف", "staff")}). {tr("الأرقام اللي قدامك فيها بيانات وهمية.", "The numbers on screen include fake data.")}
      </span>
      <button onClick={onOpenSettings}>{tr("الإعدادات", "Settings")}</button>
    </div>
  );
}
