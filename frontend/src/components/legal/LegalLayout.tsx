"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function LegalLayout({ title, lastUpdated, sections, children }: any) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const headingEls = sections.map((s:any) => document.getElementById(s.id)).filter(Boolean);
      const visible = headingEls.filter((el:any) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight / 2;
      });
      if (visible.length > 0) setActive(visible[0].id);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <div className="bg-bg min-h-screen pt-32 pb-24">
      <Container className="max-w-5xl">
        <div className="text-center mb-12">
          <div className="text-xs font-mono text-accent bg-accent/10 inline-block px-3 py-1 rounded-full border border-accent/20 mb-6">This is sample legal text for a student project.</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-muted">Last updated: {lastUpdated}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative">
          <main className="flex-1 max-w-3xl prose prose-invert prose-lg prose-headings:text-text prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
            {children}
            <div className="mt-16 p-8 bg-surface-2 border border-border rounded-xl">
              <h3 className="text-xl font-bold mb-2">Contact us about this policy</h3>
              <p className="text-muted text-sm mb-4">If you have any questions, please reach out to our legal team.</p>
              <a href="mailto:legal@dbaas.example.com" className="text-accent font-mono text-sm">legal@dbaas.example.com</a>
            </div>
          </main>

          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32">
              <div className="text-xs font-bold font-mono text-muted uppercase tracking-wider mb-6">On this page</div>
              <div className="flex flex-col gap-3 border-l border-border/50">
                {sections.map((s:any) => (
                  <Link key={s.id} href={"#"+s.id} className={`text-sm py-1 pl-4 border-l -ml-[1px] transition-colors ${active === s.id ? "border-accent text-accent" : "border-transparent text-muted hover:border-border hover:text-text"}`}>
                    {s.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
