"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronRight, Copy, Check, Terminal, ExternalLink, Loader2, Command } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { docsLandingData, sidebarNav } from "@/data/docs";

function CmdKModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const allLinks = sidebarNav.flatMap(group => group.links.map(l => ({ ...l, group: group.group })));
  const results = query ? allLinks.filter(l => l.title.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface-2 border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
      >
        <div className="flex items-center px-4 py-3 border-b border-border/50">
          <Search size={20} className="text-muted mr-3 shrink-0" />
          <input 
            ref={inputRef}
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-text outline-none"
          />
          <button onClick={onClose} className="text-xs bg-surface border border-border px-2 py-1 rounded text-muted ml-3">ESC</button>
        </div>
        
        <div className="overflow-y-auto p-2">
          {!query && (
            <div className="px-3 py-2 text-xs font-mono text-muted uppercase">Recent</div>
          )}
          {query && results.length === 0 && (
            <div className="px-3 py-8 text-center text-muted">No results found for &quot;{query}&quot;</div>
          )}
          {(query ? results : allLinks.slice(0, 5)).map((link, i) => (
            <Link key={i} href={`/docs/${link.slug}`} onClick={onClose} className="block px-3 py-3 rounded-lg hover:bg-surface transition-colors flex items-center justify-between group">
              <div>
                <div className="text-sm font-bold text-text group-hover:text-accent transition-colors">{link.title}</div>
                {query && <div className="text-xs text-muted">{link.group}</div>}
              </div>
              <ChevronRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function DocsLandingPage() {

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as any } }
  };

  const [cmdOpen, setCmdOpen] = useState(false);
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const [qsTab, setQsTab] = useState(0);
  const [qsEngine, setQsEngine] = useState<"mongodb" | "postgresql" | "qdrant">("postgresql");
  const [copiedQs, setCopiedQs] = useState(false);

  const qsStep = docsLandingData.quickstart.steps[qsTab];
  const qsCode = qsStep.code[qsEngine];

  const handleCopyQs = () => {
    navigator.clipboard.writeText(qsCode);
    setCopiedQs(true);
    setTimeout(() => setCopiedQs(false), 2000);
  };

  const [apiIdx, setApiIdx] = useState(0);
  const apiEndpoint = docsLandingData.apiPreview[apiIdx];
  const [apiLoading, setApiLoading] = useState(false);
  const [apiDone, setApiDone] = useState(false);

  const handleSendApi = () => {
    setApiLoading(true);
    setApiDone(false);
    setTimeout(() => {
      setApiLoading(false);
      setApiDone(true);
    }, 800);
  };

  useEffect(() => {
    setApiDone(false); // reset when switching
  }, [apiIdx]);

  return (
    <div className="bg-bg min-h-screen">
      <CmdKModal isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* HERO */}
      <Section className="pt-32 pb-24 border-b border-border/50 bg-surface/30">
        <Container className="text-center max-w-3xl relative z-10">
          <div className="text-sm font-mono text-accent mb-6">{docsLandingData.hero.label}</div>
          <h1 className="text-5xl font-bold tracking-tight mb-10">{docsLandingData.hero.title}</h1>
          
          <button 
            onClick={() => setCmdOpen(true)}
            className="w-full max-w-2xl mx-auto bg-surface-2 border border-border rounded-xl py-4 px-6 flex items-center justify-between text-muted hover:border-accent hover:text-text transition-all group shadow-xl"
          >
            <div className="flex items-center gap-3">
              <Search size={20} className="group-hover:text-accent transition-colors" />
              <span>Search documentation...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs border border-border px-2 py-1 rounded bg-bg">
              <Command size={12} /> K
            </div>
          </button>
        </Container>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-transparent blur-[100px]" />
        </div>
      </Section>

      {/* QUICKSTART */}
      <Section className="py-24">
        <Container>
          <SectionHeader title="Quickstart" subtitle="Get your first database up and running in minutes." />
          <Card className="p-0 overflow-hidden border-border/50 bg-[#05080F]">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col">
                <div className="flex flex-col gap-2 mb-8">
                  {docsLandingData.quickstart.steps.map((step, i) => (
                    <button 
                      key={step.id} 
                      onClick={() => setQsTab(i)}
                      className={`text-left px-4 py-3 rounded-lg transition-colors border ${qsTab === i ? "bg-surface border-border text-text" : "border-transparent text-muted hover:text-text hover:bg-surface/50"}`}
                    >
                      <h3 className="font-bold mb-1">{step.title}</h3>
                      {qsTab === i && <p className="text-sm text-muted">{step.desc}</p>}
                    </button>
                  ))}
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-mono text-muted mb-3 uppercase tracking-widest">Select Engine</div>
                  <div className="flex gap-2">
                    {[
                      { id: "mongodb", label: "MongoDB", c: "#3FCF6D" },
                      { id: "postgresql", label: "PostgreSQL", c: "#4C8DFF" },
                      { id: "qdrant", label: "Qdrant", c: "#FF4D8D" }
                    ].map(e => (
                      <button 
                        key={e.id} 
                        onClick={() => setQsEngine(e.id as any)}
                        className={`flex-1 py-2 text-xs font-mono rounded border transition-colors ${qsEngine === e.id ? "bg-surface-2 text-text" : "bg-transparent text-muted border-border hover:bg-surface"}`}
                        style={{ borderColor: qsEngine === e.id ? e.c : undefined }}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col bg-surface-2/30 relative">
                <button onClick={handleCopyQs} className="absolute top-4 right-4 text-muted hover:text-text p-2 bg-surface rounded border border-border z-10">
                  {copiedQs ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
                <div className="text-xs font-mono text-muted mb-4 uppercase tracking-widest border-b border-border/50 pb-2">Terminal</div>
                <pre className="font-mono text-sm text-accent whitespace-pre-wrap flex-1">
                  {qsCode}
                </pre>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* GUIDES BY ENGINE */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title="Guides by Engine" />
          <div className="grid md:grid-cols-3 gap-8">
            {docsLandingData.guides.map(g => (
              <Card key={g.engine} className="p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: g.color, backgroundColor: g.color }} />
                  <h3 className="text-xl font-bold">{g.engine}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {g.links.map(l => (
                    <Link key={l.title} href={`/docs/${l.slug}`} className="text-muted hover:text-text hover:translate-x-1 transition-all flex items-center justify-between text-sm group">
                      {l.title}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* API REFERENCE PREVIEW */}
      <Section className="py-24">
        <Container>
          <SectionHeader title="REST API Preview" subtitle="Manage your entire infrastructure via code." />
          <Card className="p-0 overflow-hidden border-border/50">
            <div className="grid lg:grid-cols-3 min-h-[400px]">
              <div className="bg-surface-2 p-4 border-r border-border/50 flex flex-col gap-1">
                {docsLandingData.apiPreview.map((api, i) => (
                  <button 
                    key={api.method + " " + api.path}
                    onClick={() => setApiIdx(i)}
                    className={`flex items-center gap-3 px-3 py-2 text-left text-sm font-mono rounded transition-colors ${apiIdx === i ? "bg-bg border border-border/50" : "hover:bg-bg/50 border border-transparent"}`}
                  >
                    <span className={`w-12 text-[10px] px-1 py-0.5 rounded text-center font-bold ${api.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : api.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {api.method}
                    </span>
                    <span className={`truncate ${apiIdx === i ? "text-text" : "text-muted"}`}>{api.path}</span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2 flex flex-col bg-[#05080F]">
                <div className="p-6 border-b border-border/50 flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs font-mono text-muted uppercase">Request</div>
                    <Button size="md" onClick={handleSendApi} disabled={apiLoading || apiDone} className="h-7 text-xs bg-accent text-bg hover:bg-accent/90">
                      {apiLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Terminal size={12} className="mr-1" />}
                      {apiLoading ? "Sending..." : "Send request"}
                    </Button>
                  </div>
                  <pre className="font-mono text-sm text-text whitespace-pre-wrap">{apiEndpoint.req}</pre>
                </div>
                <div className="p-6 flex-1 bg-surface-2/20">
                  <div className="text-xs font-mono text-muted uppercase mb-4">Response</div>
                  {apiLoading ? (
                    <div className="flex items-center justify-center h-20 text-muted">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : apiDone ? (
                    <motion.pre initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-sm text-[#3FCF6D] whitespace-pre-wrap">
                      {apiEndpoint.res}
                    </motion.pre>
                  ) : (
                    <div className="text-muted text-sm italic font-mono">Click "Send request" to see response</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* SDKs & TOOLS */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title="SDKs and Tools" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {docsLandingData.sdks.map(sdk => (
              <Card key={sdk.name} className="p-4 flex flex-col gap-4 hover:border-accent transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sdk.icon}</span>
                  <span className="font-bold">{sdk.name}</span>
                </div>
                <div className="bg-[#05080F] border border-border/50 p-2 rounded text-xs font-mono flex justify-between items-center group cursor-copy" onClick={() => navigator.clipboard.writeText(sdk.cmd)}>
                  <span className="text-accent truncate">{sdk.cmd}</span>
                  <Copy size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* POPULAR ARTICLES */}
      <Section className="py-24">
        <Container>
          <SectionHeader title="Popular Articles" />
          <div className="grid md:grid-cols-2 gap-4">
            {docsLandingData.popular.map(p => (
              <Link key={p.title} href={`/docs/${p.slug}`} className="block">
                <Card className="p-6 hover:bg-surface-2 transition-colors flex items-center justify-between group">
                  <div>
                    <div className="font-bold mb-2 group-hover:text-accent transition-colors">{p.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted font-mono">
                      <span className="bg-surface px-2 py-0.5 rounded">{p.category}</span>
                      <span>{p.readTime}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* HELP STRIP */}
      <Section className="py-24 border-t border-border bg-bg text-center">
        <Container>
          <h2 className="text-2xl font-bold mb-6">Can't find what you're looking for?</h2>
          <Link href="/support">
            <Button variant="outline" className="gap-2">Ask Support <ExternalLink size={16} /></Button>
          </Link>
        </Container>
      </Section>
    </div>
  );
}
