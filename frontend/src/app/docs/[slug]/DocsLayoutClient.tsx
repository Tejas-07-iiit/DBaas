"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, ChevronDown, Menu, Copy, Check, 
  AlertCircle, Lightbulb, Info, Edit, ThumbsUp, ThumbsDown 
} from "lucide-react";

import { Container } from "@/components/ui/Container";
import { sidebarNav, DocArticle, DocBlock } from "@/data/docs";

function CodeBlock({ language, code, filename }: { language: string; code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 bg-[#05080F] rounded-xl border border-border overflow-hidden">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-surface/50">
          <div className="text-xs font-mono text-muted">{filename || language}</div>
          <button onClick={handleCopy} className="text-muted hover:text-text transition-colors">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} p-4 overflow-x-auto text-sm font-mono`} style={{ ...style, backgroundColor: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function Callout({ variant, content }: { variant: "note" | "tip" | "warning"; content: string }) {
  const config = {
    note: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    tip: { icon: Lightbulb, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    warning: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" }
  };
  const { icon: Icon, color, bg, border } = config[variant];

  return (
    <div className={`my-6 flex gap-3 p-4 rounded-lg border ${bg} ${border}`}>
      <Icon className={`${color} shrink-0 mt-0.5`} size={18} />
      <div className="text-sm text-text leading-relaxed">{content}</div>
    </div>
  );
}

export function DocsLayoutClient({ article }: { article: DocArticle }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  // Scrollspy for TOC
  useEffect(() => {
    const handleScroll = () => {
      const headings = article.headings.map(h => document.getElementById(h.id)).filter(Boolean);
      const visible = headings.filter(el => {
        const rect = el!.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight / 2;
      });
      if (visible.length > 0) setActiveHeading(visible[0]!.id);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article.headings]);

  const flatLinks = sidebarNav.flatMap(g => g.links);
  const currentIndex = flatLinks.findIndex(l => `/docs/${l.slug}` === pathname);
  const prevLink = currentIndex > 0 ? flatLinks[currentIndex - 1] : null;
  const nextLink = currentIndex < flatLinks.length - 1 ? flatLinks[currentIndex + 1] : null;

  return (
    <div className="bg-bg min-h-screen pt-20">
      <Container className="max-w-[1400px]">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between py-4 border-b border-border mb-6">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex items-center gap-2 text-text font-medium">
            <Menu size={20} /> Menu
          </button>
          <div className="text-sm text-muted breadcrumbs flex items-center gap-2">
            <Link href="/docs">Docs</Link>
            <ChevronRight size={14} />
            <span className="text-text truncate max-w-[150px]">{article.title}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-24">
          
          {/* LEFT SIDEBAR */}
          <aside className={`${mobileMenuOpen ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto hide-scrollbar pb-10`}>
            <div className="flex flex-col gap-8">
              {sidebarNav.map((group, i) => (
                <div key={i}>
                  <div className="text-xs font-bold font-mono text-muted uppercase tracking-wider mb-3">{group.group}</div>
                  <div className="flex flex-col gap-1 border-l border-border/50 ml-2 pl-4">
                    {group.links.map(link => {
                      const isActive = pathname === `/docs/${link.slug}`;
                      return (
                        <Link 
                          key={link.slug} 
                          href={`/docs/${link.slug}`}
                          className={`text-sm py-1.5 transition-colors relative ${isActive ? "text-accent font-medium" : "text-muted hover:text-text"}`}
                        >
                          {isActive && <motion.div layoutId="sidebar-active" className="absolute -left-[17px] top-0 bottom-0 w-0.5 bg-accent" />}
                          {link.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* MAIN ARTICLE */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted mb-6 font-mono">
              <Link href="/docs" className="hover:text-text transition-colors">Docs</Link>
              <ChevronRight size={14} />
              <span>{article.category}</span>
            </div>

            {/* Header */}
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">{article.title}</h1>
            <p className="text-xl text-muted mb-6 leading-relaxed">{article.description}</p>
            <div className="flex items-center gap-4 text-sm font-mono text-muted mb-12 pb-8 border-b border-border/50">
              <span>{article.readTime}</span>
              <span>•</span>
              <span>Updated {article.updatedAt}</span>
            </div>

            {/* Mobile TOC */}
            {article.headings.length > 0 && (
              <div className="lg:hidden mb-12 bg-surface-2/50 rounded-xl border border-border">
                <button onClick={() => setMobileTocOpen(!mobileTocOpen)} className="w-full flex items-center justify-between p-4 font-bold text-sm">
                  On this page
                  <ChevronDown size={16} className={`transform transition-transform ${mobileTocOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileTocOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 flex flex-col gap-3 text-sm">
                        {article.headings.map(h => (
                          <Link key={h.id} href={`#${h.id}`} onClick={() => setMobileTocOpen(false)} className={`text-muted hover:text-text ${h.level === 3 ? "ml-4" : ""}`}>
                            {h.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Content Blocks */}
            <div className="prose prose-invert max-w-none">
              {article.blocks.map((block, i) => {
                switch (block.type) {
                  case "paragraph":
                    // basic bold formatting replacement for simplicity
                    const parts = block.content.split(/(\*\*.*?\*\*|`.*?`)/).map((p, idx) => {
                      if (p.startsWith("**") && p.endsWith("**")) return <strong key={idx}>{p.slice(2, -2)}</strong>;
                      if (p.startsWith("`") && p.endsWith("`")) return <code key={idx} className="bg-surface border border-border px-1.5 py-0.5 rounded text-xs text-accent">{p.slice(1, -1)}</code>;
                      return p;
                    });
                    return <p key={i} className="mb-6 text-muted leading-relaxed">{parts}</p>;
                  
                  case "heading":
                    const H = `h${block.level}` as any;
                    return (
                      <H key={i} id={block.id} className="group flex items-center mt-12 mb-6 font-bold tracking-tight text-text scroll-mt-24">
                        <Link href={`#${block.id}`} className="absolute -ml-6 opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-all hidden lg:block">#</Link>
                        {block.content}
                      </H>
                    );

                  case "code":
                    return <CodeBlock key={i} language={block.language} code={block.code} filename={block.filename} />;

                  case "callout":
                    return <Callout key={i} variant={block.variant} content={block.content} />;

                  case "steps":
                    return (
                      <ol key={i} className="list-decimal list-outside ml-5 space-y-3 mb-6 text-muted marker:text-accent font-medium">
                        {block.items.map((item, j) => <li key={j} className="pl-2">{item}</li>)}
                      </ol>
                    );

                  case "table":
                    return (
                      <div key={i} className="overflow-x-auto mb-6">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border/50">
                              {block.headers.map((h, j) => <th key={j} className="p-3 font-bold text-text bg-surface/50">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {block.rows.map((row, j) => (
                              <tr key={j}>
                                {row.map((cell, k) => <td key={k} className="p-3 text-muted">{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {/* BOTTOM SECTIONS */}
            <div className="mt-16 pt-8 border-t border-border/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted font-mono">Was this page helpful?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setFeedback("yes")} className={`p-2 rounded border transition-colors ${feedback === "yes" ? "bg-accent/20 border-accent text-accent" : "bg-surface border-border text-muted hover:text-text"}`}>
                      <ThumbsUp size={16} />
                    </button>
                    <button onClick={() => setFeedback("no")} className={`p-2 rounded border transition-colors ${feedback === "no" ? "bg-surface-2 border-border text-text" : "bg-surface border-border text-muted hover:text-text"}`}>
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                  {feedback && <span className="text-xs text-accent font-mono ml-2">Thank you!</span>}
                </div>
                
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {prevLink ? (
                  <Link href={`/docs/${prevLink.slug}`} className="p-6 rounded-xl border border-border bg-surface/30 hover:border-accent transition-colors group">
                    <div className="text-xs font-mono text-muted mb-2 uppercase tracking-widest flex items-center gap-2"><ChevronRight size={14} className="rotate-180" /> Previous</div>
                    <div className="font-bold text-lg group-hover:text-accent transition-colors">{prevLink.title}</div>
                  </Link>
                ) : <div />}
                
                {nextLink && (
                  <Link href={`/docs/${nextLink.slug}`} className="p-6 rounded-xl border border-border bg-surface/30 hover:border-accent transition-colors group text-right">
                    <div className="text-xs font-mono text-muted mb-2 uppercase tracking-widest flex items-center justify-end gap-2">Next <ChevronRight size={14} /></div>
                    <div className="font-bold text-lg group-hover:text-accent transition-colors">{nextLink.title}</div>
                  </Link>
                )}
              </div>
            </div>
          </main>

          {/* RIGHT TOC */}
          {article.headings.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="text-xs font-bold font-mono text-muted uppercase tracking-wider mb-4">On this page</div>
              <div className="flex flex-col gap-2 border-l border-border/50">
                {article.headings.map(h => (
                  <Link 
                    key={h.id} 
                    href={`#${h.id}`}
                    className={`text-sm py-1 pl-4 border-l -ml-[1px] transition-colors ${activeHeading === h.id ? "border-accent text-accent" : "border-transparent text-muted hover:border-border hover:text-text"} ${h.level === 3 ? "ml-2" : ""}`}
                  >
                    {h.title}
                  </Link>
                ))}
              </div>
            </aside>
          )}

        </div>
      </Container>
    </div>
  );
}
