"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductContent } from "@/data/products/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";

// --- CountUp Component ---
function CountUp({ to, duration = 2.4, trigger }: { to: string; duration?: number; trigger: boolean }) {
  // Simple fade up and number render if complex parsing is hard, 
  // but let's try a simple spring if it's a pure number.
  // Many values are "3 ms" or "99.99%". We'll just fade them in 
  // for now or do a simple string reveal to avoid complex parsing.
  // A true count-up for mixed strings:
  return (
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      animate={trigger ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.8, ease: "easeOut" as any }}
    >
      {to}
    </motion.span>
  );
}

// --- TypingCode Component ---
function TypingCode({ code }: { code: string }) {
  const [displayed, setDisplayed] = useState("");
  const inViewRef = useRef(null);
  const isInView = useInView(inViewRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(code.slice(0, i));
      i++;
      if (i > code.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [isInView, code]);

  return (
    <div ref={inViewRef} className="font-mono text-sm text-text whitespace-pre-wrap">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-[var(--engine)] align-middle ml-1" />
    </div>
  );
}

// --- Main Template ---
interface ProductPageProps {
  content: ProductContent;
  HeroBackground: React.FC;
  Playground: React.FC;
  FeatureVisuals: React.ReactNode[];
}

export function ProductPageTemplate({ content, HeroBackground, Playground, FeatureVisuals }: ProductPageProps) {

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as any } }
  };

  const numbersRef = useRef(null);
  const numbersInView = useInView(numbersRef, { once: true, margin: "-100px" });

  const [activeUseCase, setActiveUseCase] = useState(content.useCases[0].id);
  const activeCaseData = content.useCases.find(c => c.id === activeUseCase) || content.useCases[0];

  const [activeCodeTab, setActiveCodeTab] = useState(content.codeSnippets[0].language);
  const activeCode = content.codeSnippets.find(c => c.language === activeCodeTab)?.code || "";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { user, status } = useAuth();
  const router = useRouter();

  const handleCreateDatabase = () => {
    const engineParam = content.name;
    const targetUrl = `/dashboard/projects?create=true&engine=${encodeURIComponent(engineParam)}`;

    if (status === "authenticated" || user) {
      router.push(targetUrl);
    } else {
      router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
    }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-bg min-h-screen" style={{ "--engine": content.accentColor } as any}>
      
      {/* SECTION 1: HERO */}
      <Section className="min-h-[85vh] flex flex-col justify-center relative overflow-hidden pt-32 pb-24 border-b border-border/50">
        <HeroBackground />
        <Container className="relative z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }} className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div variants={fadeIn} className="flex items-center gap-2 text-sm font-mono text-muted mb-8">
                <span className="w-2 h-2 rounded-full bg-[var(--engine)] shadow-[0_0_8px_var(--engine)]" />
                {content.hero.breadcrumb}
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                {content.hero.h1Part1}
                <span className="font-serif italic text-[var(--engine)]">{content.hero.h1Highlight}</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted mb-10 max-w-lg">
                {content.hero.subtext}
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4 mb-12">
                <Button 
                  className="bg-[var(--engine)] text-[#05080F] hover:shadow-[0_0_20px_var(--engine)]"
                  onClick={handleCreateDatabase}
                >
                  {content.hero.primaryCta}
                </Button>
                <Link href="/docs">
                  <Button variant="outline">{content.hero.secondaryCta}</Button>
                </Link>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4 text-sm text-muted">
                {content.hero.trustChips.map(chip => (
                  <div key={chip} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[var(--engine)]" />
                    {chip}
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={fadeIn} className="relative">
              <Card className="bg-surface-2/80 backdrop-blur border-border p-6 shadow-2xl relative z-10 min-h-[300px]">
                <div className="flex gap-1.5 mb-6">
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                </div>
                <TypingCode code={content.hero.codeExample} />
              </Card>
              <div className="absolute -inset-1 bg-[var(--engine)]/20 blur-[100px] z-0 rounded-full" />
            </motion.div>
          </motion.div>
        </Container>
      </Section>

      {/* SECTION 2: NUMBER STRIP */}
      <Section className="py-16 border-b border-border/50 bg-surface/30">
        <Container>
          <div ref={numbersRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
            {content.numbers.map((num, i) => (
              <div key={i} className={`pl-8 ${i === 0 ? "pl-0 border-0" : ""}`}>
                <div className="text-3xl md:text-4xl font-bold text-text mb-2 tracking-tight">
                  <CountUp to={num.value} trigger={numbersInView} />
                </div>
                <div className="text-sm text-muted font-mono uppercase tracking-widest">{num.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 3: PLAYGROUND */}
      <Section className="py-32 overflow-hidden">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">Try the {content.name} Playground</h2>
          </div>
          <Playground />
        </Container>
      </Section>

      {/* SECTION 4: FEATURES */}
      <div className="border-t border-border/40 divide-y divide-border/40">
        {content.features.map((feature, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <Section key={idx} className="py-24 lg:py-32 relative overflow-hidden">
              <Container>
                <div className={`flex flex-col gap-12 lg:gap-20 items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className="flex-1 w-full max-w-xl">
                    <div className="text-xs font-mono tracking-widest text-[var(--engine)] uppercase mb-4">{feature.label}</div>
                    <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-text">{feature.title}</h3>
                    <p className="text-lg text-muted mb-8 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-4">
                      {feature.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-text text-base">
                          <ArrowRight size={18} className="text-[var(--engine)] mt-1 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 w-full max-w-xl flex items-center justify-center">
                    <div className="w-full aspect-square max-w-lg flex items-center justify-center p-8 sm:p-10 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group hover:border-[var(--engine)]/30 transition-all duration-500 shadow-2xl">
                      {/* Ambient transparent glass glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--engine)]/[0.06] via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />
                      
                      <div className="relative z-10 w-full flex items-center justify-center">
                        {FeatureVisuals[idx]}
                      </div>
                    </div>
                  </div>
                </div>
              </Container>
            </Section>
          );
        })}
      </div>

      {/* SECTION 5: USE CASES */}
      <Section className="py-24">
        <Container>
          <SectionHeader title="Built for every workload" className="text-center" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 flex flex-col gap-2">
              {content.useCases.map(uc => (
                <button
                  key={uc.id}
                  onClick={() => setActiveUseCase(uc.id)}
                  className={`text-left p-4 rounded-xl transition-all border ${activeUseCase === uc.id ? "bg-surface-2 border-[var(--engine)]/30 text-text" : "border-transparent text-muted hover:bg-surface hover:text-text"}`}
                >
                  <h4 className="font-bold mb-1">{uc.tabLabel}</h4>
                </button>
              ))}
            </div>
            <div className="w-full lg:w-2/3">
              <Card className="p-8 h-full flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeUseCase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col"
                  >
                    <p className="text-lg text-text mb-8">{activeCaseData.description}</p>
                    <div className="bg-[#05080F] p-6 rounded-lg border border-border/50 font-mono text-sm text-accent whitespace-pre-wrap flex-1 mb-8">
                      {activeCaseData.sampleDocument}
                    </div>
                    <div className="text-[var(--engine)] font-medium mt-auto flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      {activeCaseData.why}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* SECTION 6: CODE */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title="Connect in seconds" className="text-center" />
          <Card className="max-w-4xl mx-auto p-0 overflow-hidden bg-[#05080F]">
            <div className="flex items-center justify-between border-b border-border/50 px-4 bg-surface-2/50">
              <div className="flex gap-2">
                {content.codeSnippets.map(snippet => (
                  <button
                    key={snippet.language}
                    onClick={() => setActiveCodeTab(snippet.language)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeCodeTab === snippet.language ? "border-[var(--engine)] text-text" : "border-transparent text-muted hover:text-text"}`}
                  >
                    {snippet.language}
                  </button>
                ))}
              </div>
              <button onClick={handleCopy} className="text-muted hover:text-text p-2 transition-colors flex items-center gap-2 text-sm">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono text-accent">
                <code>{activeCode}</code>
              </pre>
            </div>
          </Card>
        </Container>
      </Section>

      {/* SECTION 7: SPECS AND LIMITS */}
      <Section className="py-24">
        <Container>
          <SectionHeader title="Specs & Limits" className="text-center" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="p-8 border-border">
              <h3 className="text-xl font-bold mb-6 border-b border-border/50 pb-4">Technical Specs</h3>
              <dl className="space-y-4">
                {content.specs.items.map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                    <dt className="text-muted">{item.label}</dt>
                    <dd className="font-medium text-text text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <div className="flex flex-col justify-center gap-4">
              <h3 className="text-xl font-bold mb-2">Platform Limits</h3>
              {content.specs.plans.map(plan => (
                <Card key={plan.name} className="p-6 flex items-center justify-between bg-surface-2/30 hover:border-[var(--engine)]/50 transition-colors">
                  <div>
                    <div className="font-bold text-lg">{plan.name}</div>
                    <div className="text-muted text-sm">{plan.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted uppercase tracking-wider mb-1">Storage limit</div>
                    <div className="font-mono font-bold text-[var(--engine)]">{plan.limit}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* SECTION 8: FAQ */}
      <Section className="py-24 bg-surface/30">
        <Container className="max-w-3xl">
          <SectionHeader title="Frequently asked questions" className="text-center" />
          <div className="space-y-4">
            {content.faq.map((faq, i) => (
              <Card key={i} className="p-0 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-2/50 transition-colors"
                >
                  <span className="font-bold text-lg">{faq.q}</span>
                  <ChevronDown className={`transform transition-transform ${openFaq === i ? "rotate-180 text-[var(--engine)]" : "text-muted"}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-muted"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 9: PAIR IT WITH */}
      <Section className="py-24 border-b border-border/50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pair it with</h2>
            <p className="text-muted">Most applications use more than one engine.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
            {content.pairItWith.map(pair => (
              <Link href={pair.href} key={pair.id}>
                <Card className="p-6 h-full hover:-translate-y-1 hover:border-text transition-all group">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors flex items-center gap-2">
                    {pair.name} <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-muted text-sm">{pair.reason}</p>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center bg-surface-2 border border-border rounded-2xl p-12 max-w-4xl mx-auto relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[var(--engine)]/10 to-transparent opacity-50" />
             <div className="relative z-10">
               <h2 className="text-3xl font-bold mb-6">{content.closing.text}</h2>
               <Button 
                 size="lg" 
                 className="bg-[var(--engine)] text-[#05080F] hover:shadow-[0_0_20px_var(--engine)]"
                 onClick={handleCreateDatabase}
               >
                 {content.closing.cta}
               </Button>
             </div>
          </div>
        </Container>
      </Section>

    </div>
  );
}
