interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ label, title, subtitle, className = "" }: SectionHeaderProps) {
  const isCentered = className.includes("text-center") || className.includes("items-center");

  return (
    <div className={`mb-14 ${className}`}>
      {label && <div className="text-xs tracking-widest uppercase text-accent font-mono">{label}</div>}
      <h2 className="text-4xl lg:text-5xl font-semibold mt-4 text-text">{title}</h2>
      {subtitle && (
        <p className={`text-lg text-muted max-w-2xl mt-5 ${isCentered ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
