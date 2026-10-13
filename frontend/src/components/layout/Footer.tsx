"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Terminal, ChevronDown, Check, Code, MessageSquare, Briefcase, Video, MessageCircle, LifeBuoy, Headphones, HelpCircle, FileText, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import Logo from "./Logo";
import { footerData } from "@/data/footer";

// ─── CTA BAND ─────────────────────────────────────────────────────────────
export function CtaBand() {
  const words = footerData.cta.headingPart1.split(" ").concat([footerData.cta.headingHighlight], footerData.cta.headingPart2.split(" ").filter(Boolean));
  
  return (
    <div className="relative py-32 overflow-hidden border-b border-border bg-[#05080F]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none">
        <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 8 }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 12, delay: 2 }} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF4D8D]/20 rounded-full blur-[100px]" />
      </div>
      
      <Container className="relative z-10 text-center">
        <motion.h2 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-tight mb-12"
        >
          {words.map((w, i) => (
            <motion.span 
              key={i} 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className={`inline-block mr-3 ${w === footerData.cta.headingHighlight ? 'text-accent' : 'text-text'}`}
            >
              {w}
            </motion.span>
          ))}
        </motion.h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button href="/signup" size="lg" className="w-full sm:w-auto relative group overflow-hidden">
            <span className="relative z-10">{footerData.cta.primaryButton}</span>
            <motion.div 
              className="absolute inset-0 bg-white/20 translate-y-[100%]" 
              whileHover={{ translateY: "0%" }} 
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </Button>
          <Button href="/docs" variant="outline" size="lg" className="w-full sm:w-auto">{footerData.cta.secondaryButton}</Button>
        </div>
      </Container>
    </div>
  );
}

// ─── SUPPORT BOX ──────────────────────────────────────────────────────────
function SupportBox() {
  return (
    <div className="bg-surface/50 border border-border/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm flex flex-col justify-between shadow-2xl hover:border-accent/40 transition-all duration-300 group">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent/10 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/20 transition-all duration-500" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#4C8DFF]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(25,227,193,0.15)]">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text leading-tight">Need Support?</h3>
              <p className="text-[11px] text-muted">We&apos;re here 24/7</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#3FCF6D] bg-[#3FCF6D]/10 px-2.5 py-1 rounded-full border border-[#3FCF6D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FCF6D] animate-ping" />
            Online
          </span>
        </div>

        <p className="text-muted text-xs leading-relaxed mb-5">
          Have questions about database scaling, clustering, or enterprise migration? Our engineers are ready to assist.
        </p>

        {/* Quick Resource Links */}
        <div className="space-y-2 mb-6">
          <Link
            href="/support"
            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 border border-border/50 text-xs text-text hover:border-accent/40 hover:bg-surface-2 transition-all group/item"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle size={15} className="text-muted group-hover/item:text-accent transition-colors" />
              <span className="font-medium">Help Center & FAQ</span>
            </div>
            <ArrowRight size={13} className="text-muted group-hover/item:text-accent group-hover/item:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/docs"
            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 border border-border/50 text-xs text-text hover:border-accent/40 hover:bg-surface-2 transition-all group/item"
          >
            <div className="flex items-center gap-2.5">
              <FileText size={15} className="text-muted group-hover/item:text-accent transition-colors" />
              <span className="font-medium">Developer Documentation</span>
            </div>
            <ArrowRight size={13} className="text-muted group-hover/item:text-accent group-hover/item:translate-x-0.5 transition-all" />
          </Link>

          <a
            href="mailto:support@dbaas.example.com"
            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 border border-border/50 text-xs text-text hover:border-accent/40 hover:bg-surface-2 transition-all group/item"
          >
            <div className="flex items-center gap-2.5">
              <Mail size={15} className="text-muted group-hover/item:text-accent transition-colors" />
              <span className="font-mono text-[11px]">support@dbaas.example.com</span>
            </div>
            <ArrowRight size={13} className="text-muted group-hover/item:text-accent group-hover/item:translate-x-0.5 transition-all" />
          </a>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-4 border-t border-border/40 flex flex-col gap-2">
        <Button href="/contact" size="md" className="w-full text-xs py-2.5 font-semibold flex items-center justify-center gap-2">
          <Headphones size={15} />
          Contact Support Team
        </Button>
        <div className="flex items-center justify-between text-[11px] text-muted pt-1 px-1">
          <span>Target SLA</span>
          <span className="text-accent font-mono font-medium">&lt; 15 min response</span>
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE ACCORDION ─────────────────────────────────────────────────────
function MobileColumn({ col }: { col: typeof footerData.columns[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 md:hidden">
      <button onClick={() => setOpen(!open)} className="w-full py-4 flex justify-between items-center font-bold text-lg">
        {col.title}
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={18} /></motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="pb-4 space-y-3">
              {col.links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted hover:text-text transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// ─── CLOCK & UPTIME ───────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState("");
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    setUptime(Math.floor(Date.now() / 1000) - 1700000000); // Fake giant uptime
    const t = setInterval(() => {
      setTime(new Date().toISOString().split("T")[1].slice(0, 8) + " UTC");
      setUptime(u => u + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-xs font-mono text-muted text-right flex flex-col items-end">
      <div>{time}</div>
      <div className="text-accent/70">UP: {uptime}s</div>
    </div>
  );
}

// ─── MAIN FOOTER ──────────────────────────────────────────────────────────
export default function Footer() {
  const Icons: Record<string, React.ElementType> = { 
    github: Code, 
    twitter: MessageSquare, 
    linkedin: Briefcase, 
    youtube: Video,
    discord: MessageSquare 
  };
  
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-bg border-t border-border pt-0 flex flex-col">
      
      
      <Container className="py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Logo />
            <p className="mt-6 text-muted text-sm max-w-xs leading-relaxed">{footerData.companyInfo.tagline}</p>
            
            <Link href={footerData.companyInfo.status.href} className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-surface-2/50 hover:bg-surface-2 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FCF6D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FCF6D]"></span>
              </span>
              <span className="text-xs font-mono text-text">{footerData.companyInfo.status.label}</span>
            </Link>

            <div className="flex gap-3 mt-12">
              {footerData.socials.map(s => {
                const Icon = Icons[s.icon] || Terminal;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent hover:-translate-y-1 transition-all">
                    <span className="sr-only">{s.label}</span>
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link Columns Desktop */}
          <div className="lg:col-span-5 hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
            {footerData.columns.map(col => (
              <div key={col.title}>
                <h4 className="font-bold mb-6 text-text">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-muted hover:text-text transition-colors text-sm group flex items-center">
                        <span className="relative overflow-hidden flex items-center">
                          <motion.span initial={{ width: 0, opacity: 0 }} whileHover={{ width: 16, opacity: 1, marginRight: 4 }} className="text-accent flex items-center">
                            <ArrowRight size={12} />
                          </motion.span>
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Link Columns Mobile */}
          <div className="lg:hidden">
            {footerData.columns.map(col => <MobileColumn key={col.title} col={col} />)}
          </div>

          {/* Support Box */}
          <div className="lg:col-span-3 flex flex-col">
            <SupportBox />
          </div>

        </div>
      </Container>


      {/* Bottom Bar */}
      <div className="border-t border-border/50 py-6">
        <Container className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted font-mono">{footerData.bottom.copyright}</div>
          <div className="text-xs text-muted font-mono hidden md:block">{footerData.bottom.location}</div>
          <div className="flex items-center gap-8">
            <Clock />
            <button onClick={scrollToTop} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent transition-colors">
              <ArrowRight size={16} className="-rotate-90" />
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}
