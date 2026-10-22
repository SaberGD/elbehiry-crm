import { Eye, X } from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { useLanguage } from "../../context/LanguageContext";
export function ViewAsBar() {
  const { viewAsUser, setViewAsUser } = useCRM();
  const { tr } = useLanguage();
  if (!viewAsUser) return null;
  return (
    <div className="preview-bar">
      <span>
        <Eye size={15} />
        {tr("أنت بتشوف النظام كـ:", "You are viewing the system as:")} {viewAsUser.name}
      </span>
      <button onClick={() => setViewAsUser(null)}>
        {tr("إنهاء المعاينة", "End preview")}
        <X size={14} />
      </button>
    </div>
  );
}
