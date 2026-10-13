export function Section({ className = "", id, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section id={id} className={`relative py-24 lg:py-32 ${className}`} {...props}>
      {children}
    </section>
  );
}
