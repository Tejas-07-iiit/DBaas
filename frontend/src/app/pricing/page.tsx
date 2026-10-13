"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Info, ChevronDown, Database, HardDrive, Share2 } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { pricingData } from "@/data/pricing";

// --- ANIMATED NUMBER ---
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(start + (end - start) * easeOut);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{displayValue.toFixed(0)}</span>;
}

// --- FLOATING BACKGROUND ---
function PriceBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent blur-[100px]" />
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[...Array(15)].map((_, i) => (
          <motion.circle
            key={i}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r={Math.random() * 4 + 2}
            fill="var(--accent)"
            initial={{ y: 0, opacity: 0.1 }}
            animate={{ 
              y: [0, -100, 0],
              opacity: [0.1, 0.5, 0.1]
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -20
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function PricingPage() {

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as any } }
  };

  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Estimator State
  const [estMongo, setEstMongo] = useState(50);
  const [estPg, setEstPg] = useState(50);
  const [estQdrant, setEstQdrant] = useState(5);
  const [estBackup, setEstBackup] = useState<7|14|30>(7);
  const [estRegions, setEstRegions] = useState(1);

  // Calculate costs
  const { rates } = pricingData.estimator;
  const mongoCost = estMongo * rates.mongoPerGb;
  const pgCost = estPg * rates.pgPerGb;
  const qdrantCost = estQdrant * rates.qdrantPerM;
  const baseTotal = mongoCost + pgCost + qdrantCost;
  
  const backupMultiplier = rates.backupMult[estBackup] || 1;
  const regionMultiplier = 1 + ((estRegions - 1) * (rates.regionMult - 1));
  
  const finalTotal = baseTotal * backupMultiplier * regionMultiplier;
  
  // Dynamic Rec
  let recPlan = "Free";
  if (finalTotal > 0) recPlan = "Pro";
  if (finalTotal > 200) recPlan = "Scale";
  if (finalTotal > 1000) recPlan = "Enterprise";

  // Table collapse
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const toggleCat = (cat: string) => setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="bg-bg min-h-screen">
      
      {/* HERO & PLANS */}
      <Section className="pt-32 pb-24 relative">
        <PriceBackground />
        <Container className="relative z-10 text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
          <div className="text-sm font-mono text-accent mb-6">{pricingData.hero.label}</div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {pricingData.hero.h1Part1}
            <span className="text-accent font-serif italic font-normal block md:inline mt-2 md:mt-0">{pricingData.hero.h1Highlight}</span>
            {pricingData.hero.h1Part2}
          </h1>
          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto">{pricingData.hero.subtext}</p>
          
          <div className="flex items-center justify-center mb-16">
            <div className="bg-surface-2 p-1 rounded-full border border-border grid grid-cols-2 relative w-[280px] sm:w-[320px]">
              <div 
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-surface border border-border rounded-full shadow transition-transform duration-300 ease-out pointer-events-none"
                style={{ transform: yearly ? "translateX(100%)" : "translateX(0%)" }}
              />
              <button 
                type="button"
                onClick={() => setYearly(false)}
                className={`relative z-10 py-2 text-sm font-bold rounded-full transition-colors flex items-center justify-center ${!yearly ? "text-text" : "text-muted hover:text-text"}`}
              >
                Monthly
              </button>
              <button 
                type="button"
                onClick={() => setYearly(true)}
                className={`relative z-10 py-2 text-sm font-bold rounded-full transition-colors flex items-center justify-center gap-2 ${yearly ? "text-text" : "text-muted hover:text-text"}`}
              >
                <span>Yearly</span>
                <span className="bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 text-left">
            {pricingData.plans.map((plan) => {
              const displayPrice = plan.price === "Custom" 
                ? "Custom" 
                : typeof plan.price === 'number' 
                  ? yearly ? plan.price * 0.8 : plan.price
                  : 0;
                  
              return (
                <Card 
                  key={plan.id} 
                  className={`flex flex-col relative p-6 transition-transform hover:-translate-y-1 duration-300 ${plan.highlight ? "border-accent shadow-[0_0_30px_rgba(63,207,109,0.1)] xl:-translate-y-2" : "border-border/50"}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4 h-[60px]">
                    <div className="text-4xl font-bold text-text flex items-baseline gap-1">
                      {plan.price !== "Custom" && <span className="text-2xl text-muted">$</span>}
                      {plan.price === "Custom" ? (
                        "Custom"
                      ) : (
                        <AnimatedNumber value={displayPrice as number} />
                      )}
                      {plan.price !== "Custom" && <span className="text-sm text-muted font-normal">/mo</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted mb-6 flex-1 min-h-[40px]">{plan.description}</p>
                  <Button 
                    href={(plan as any).href || (plan.id === "enterprise" ? "/contact" : "/signup")}
                    className={`w-full mb-8 ${plan.buttonVariant === 'primary' ? "bg-accent text-[#05080F] hover:shadow-[0_0_15px_var(--accent)]" : ""}`}
                    variant={plan.buttonVariant as any}
                  >
                    {plan.buttonText}
                  </Button>
                  
                  <div className="border-t border-border/50 pt-6 space-y-4 flex-1">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-muted group">
                        <Check size={16} className="text-accent shrink-0 mt-0.5" />
                        <span className="flex-1">
                          {feat.text}
                          {(feat as any).tooltip && (
                            <span className="inline-block ml-1 cursor-help relative" title={(feat as any).tooltip}>
                              <Info size={12} className="text-border hover:text-muted transition-colors" />
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
        </Container>
      </Section>

      {/* ESTIMATOR */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title="Calculate your cost" subtitle="Estimate your monthly bill based on actual usage." className="text-center" />
          <Card className="max-w-5xl mx-auto p-0 overflow-hidden border-border/50">
            <div className="grid lg:grid-cols-5 min-h-[500px]">
              
              {/* Sliders */}
              <div className="lg:col-span-3 p-8 border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col gap-8 bg-surface-2/30">
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold flex items-center gap-2"><Database size={16} className="text-[#3FCF6D]"/> MongoDB Storage</label>
                    <span className="text-sm font-mono text-accent">{estMongo} GB</span>
                  </div>
                  <input type="range" min="0" max="500" value={estMongo} onChange={e => setEstMongo(Number(e.target.value))} className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-[#3FCF6D]" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold flex items-center gap-2"><Database size={16} className="text-[#4C8DFF]"/> PostgreSQL Storage</label>
                    <span className="text-sm font-mono text-accent">{estPg} GB</span>
                  </div>
                  <input type="range" min="0" max="500" value={estPg} onChange={e => setEstPg(Number(e.target.value))} className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-[#4C8DFF]" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold flex items-center gap-2"><Database size={16} className="text-[#FF4D8D]"/> Qdrant Vectors</label>
                    <span className="text-sm font-mono text-accent">{estQdrant}M</span>
                  </div>
                  <input type="range" min="0" max="50" step="1" value={estQdrant} onChange={e => setEstQdrant(Number(e.target.value))} className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-[#FF4D8D]" />
                </div>
                
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/50">
                  <div>
                    <label className="text-sm font-bold mb-4 flex items-center gap-2"><HardDrive size={16} className="text-muted"/> Backup Retention</label>
                    <div className="flex bg-bg rounded-lg border border-border p-1">
                      {[7, 14, 30].map(days => (
                        <button 
                          key={days} 
                          onClick={() => setEstBackup(days as any)}
                          className={`flex-1 text-xs py-2 rounded transition-colors ${estBackup === days ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold flex items-center gap-2"><Share2 size={16} className="text-muted"/> Regions</label>
                      <span className="text-sm font-mono text-accent">{estRegions}</span>
                    </div>
                    <input type="range" min="1" max="4" step="1" value={estRegions} onChange={e => setEstRegions(Number(e.target.value))} className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent" />
                  </div>
                </div>
                
              </div>
              
              {/* Receipt */}
              <div className="lg:col-span-2 p-8 bg-[#05080F] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
                <h3 className="text-xl font-bold mb-6 flex justify-between items-center z-10">
                  Estimated Cost
                  <span className="text-xs font-mono bg-surface-2 px-2 py-1 rounded-full text-muted border border-border/50 uppercase tracking-widest">Monthly</span>
                </h3>
                
                <div className="space-y-4 flex-1 z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">MongoDB ({estMongo} GB)</span>
                    <span className="font-mono text-text">$<AnimatedNumber value={mongoCost} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">PostgreSQL ({estPg} GB)</span>
                    <span className="font-mono text-text">$<AnimatedNumber value={pgCost} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Qdrant ({estQdrant}M vectors)</span>
                    <span className="font-mono text-text">$<AnimatedNumber value={qdrantCost} /></span>
                  </div>
                  <div className="h-px w-full bg-border/50 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Base Storage</span>
                    <span className="font-mono text-text">$<AnimatedNumber value={baseTotal} /></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Backups ({estBackup}d)</span>
                    <span className="font-mono text-muted">x{backupMultiplier.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Replication ({estRegions} region{estRegions>1?'s':''})</span>
                    <span className="font-mono text-muted">x{regionMultiplier.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border z-10">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-lg font-bold">Total</span>
                    <div className="text-4xl font-bold text-accent font-mono">$<AnimatedNumber value={finalTotal} /></div>
                  </div>
                  
                  {/* Visual Bar */}
                  {baseTotal > 0 && (
                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-2 mb-6 border border-border/50">
                      <div className="h-full bg-[#3FCF6D] transition-all" style={{ width: `${(mongoCost/baseTotal)*100}%` }} />
                      <div className="h-full bg-[#4C8DFF] transition-all" style={{ width: `${(pgCost/baseTotal)*100}%` }} />
                      <div className="h-full bg-[#FF4D8D] transition-all" style={{ width: `${(qdrantCost/baseTotal)*100}%` }} />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50 border border-border text-sm">
                    <span className="text-muted font-mono uppercase tracking-widest text-xs">Recommended</span>
                    <span className="font-bold text-text">{recPlan}</span>
                  </div>
                  <div className="text-xs text-muted mt-6 text-center italic">{pricingData.estimator.note}</div>
                </div>
              </div>
              
            </div>
          </Card>
        </Container>
      </Section>

      {/* COMPARE TABLE */}
      <Section className="py-24">
        <Container className="max-w-6xl">
          <SectionHeader title="Compare Plans" subtitle="Detailed feature breakdown across all tiers." className="text-center mb-16" />
          
          <div className="overflow-x-auto pb-8 hide-scrollbar">
            <table className="w-full text-left min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 sticky left-0 bg-bg z-20 font-mono text-xs uppercase tracking-widest text-muted">Feature</th>
                  {pricingData.plans.map(p => (
                    <th key={p.id} className="p-4 text-lg font-bold">
                      {p.name}
                      {p.id === 'pro' && <span className="ml-2 bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingData.compareTable.map((cat, catIdx) => (
                  <React.Fragment key={cat.category}>
                    <tr 
                      className="border-b border-border/30 bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors group"
                      onClick={() => toggleCat(cat.category)}
                    >
                      <td colSpan={5} className="p-4 font-bold text-sm flex items-center justify-between sticky left-0 w-full max-w-full z-10">
                        {cat.category}
                        <ChevronDown size={16} className={`text-muted transition-transform ${collapsedCats[cat.category] ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    
                    {!collapsedCats[cat.category] && cat.features.map((feat, featIdx) => (
                      <tr key={featIdx} className="border-b border-border/20 hover:bg-surface/30 transition-colors group">
                        <td className="p-4 text-sm text-muted sticky left-0 bg-bg group-hover:bg-surface/90 transition-colors z-10 border-r border-transparent group-hover:border-border/30">{feat.name}</td>
                        {pricingData.plans.map(p => {
                          const val = (feat.values as any)[p.id];
                          return (
                            <td key={p.id} className="p-4 text-sm font-medium">
                              {typeof val === 'boolean' ? (
                                val ? <Check size={16} className="text-accent" /> : <X size={16} className="text-muted/30" />
                              ) : (
                                <span className="text-text">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* FREE TIER STRIP */}
      <Section className="py-24 bg-surface/30 border-y border-border/50">
        <Container>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingData.freeStrip.map((item, i) => (
              <div key={i} className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Check size={20} className="text-accent" />
                </div>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="py-24">
        <Container className="max-w-3xl">
          <SectionHeader title="Frequently asked questions" className="text-center" />
          <div className="space-y-4">
            {pricingData.faq.map((faq, i) => (
              <Card key={i} className="p-0 overflow-hidden bg-surface/30 hover:bg-surface-2/50 transition-colors">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-text pr-8">{faq.q}</span>
                  <ChevronDown className={`transform transition-transform shrink-0 ${openFaq === i ? "rotate-180 text-accent" : "text-muted"}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-muted text-sm leading-relaxed"
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

      {/* CLOSING CTA */}
      <Section className="py-24 bg-surface/30 border-t border-border">
        <Container className="text-center max-w-2xl relative">
          <div className="absolute inset-0 bg-accent/5 blur-[100px] z-0 rounded-full" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">{pricingData.closing.text}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                href={pricingData.closing.primaryHref || "/signup"} 
                size="lg" 
                className="bg-accent text-[#05080F] hover:shadow-[0_0_20px_var(--accent)]"
              >
                {pricingData.closing.primaryCta}
              </Button>
              <Button 
                href={pricingData.closing.secondaryHref || "/contact"} 
                size="lg" 
                variant="outline"
              >
                {pricingData.closing.secondaryCta}
              </Button>
            </div>
          </div>
        </Container>
      </Section>

    </div>
  );
}
