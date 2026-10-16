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
  return (
    <div
      className={`behery-wordmark wordmark-${size} ${className}`}
      onClick={onClick}
      aria-label="البحيري للدهانات والديكور"
    >
      <span className="wordmark-name">
        البحيري
        <span className="wordmark-square" aria-hidden="true" />
      </span>
      {showText && (
        <span className="wordmark-description">للدهانات والديكور</span>
      )}
    </div>
  );
}
