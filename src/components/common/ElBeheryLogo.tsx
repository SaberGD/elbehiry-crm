import { useLanguage } from "../../context/LanguageContext";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  onClick?: () => void;
}
export function ElBeheryLogo({
  className = "",
  size = "md",
  showText = true,
  onClick,
}: Props) {
  const { tr } = useLanguage();
  return (
    <div
      className={`behery-wordmark wordmark-${size} ${className}`}
      onClick={onClick}
      aria-label={tr("البحيري للدهانات والديكور", "El Behery for Paints and Decor")}
    >
      <span className="wordmark-name">
        البحيري
        <span className="wordmark-square" aria-hidden="true" />
      </span>
      {showText && (
        <span className="wordmark-description">{tr("للدهانات والديكور", "Paints & Decor")}</span>
      )}
    </div>
  );
}
