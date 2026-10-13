export function Card({ className = "", children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
