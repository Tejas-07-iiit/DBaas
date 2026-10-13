"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ArrowRight, Database, Shield, Activity, Terminal, Code2, Server } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { productData } from "@/data/product";
import { MongoDemo, PostgresDemo, QdrantDemo } from "@/components/sections/home/ThreeDatabases";
import Quiz from "@/components/sections/home/Quiz";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function ProductPage() {
  const [activeCategory, setActiveCategory] = useState("Show all");
  const [activeTab, setActiveTab] = useState("online-store");
  const { user, status } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    const targetUrl = "/dashboard/projects?create=true";
    if (status === "authenticated" || user) {
      router.push(targetUrl);
    } else {
      router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
    }
  };

  const scrollToCompare = () => {
    const el = document.getElementById("compare");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const filteredRows = productData.comparison.rows.filter(
    (row) => activeCategory === "Show all" || row.category === activeCategory
  );

  return (
    <div className="bg-bg min-h-screen">
      {/* SECTION 1: HERO */}
      <Section className="min-h-[70vh] flex flex-col justify-center items-center relative overflow-hidden pt-32 pb-24">
        {/* Background Schema Diagram */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-30 mask-image:linear-gradient(to_bottom,black,transparent)">
          <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse duration-3000">
            <rect x="100" y="50" width="80" height="60" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <rect x="420" y="50" width="80" height="60" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <rect x="260" y="250" width="80" height="60" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            
            <path d="M140 110 L140 180 L300 250" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M460 110 L460 180 L300 250" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
            
            <circle cx="140" cy="145" r="3" fill="#19E3C1">
              <animate attributeName="cy" values="110;180" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="460" cy="145" r="3" fill="#19E3C1">
              <animate attributeName="cy" values="110;180" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <Container className="relative z-10 text-center">
          <div className="text-sm font-mono text-accent mb-6">{productData.hero.label}</div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            {productData.hero.h1Part1}
            <span className="text-accent font-serif italic font-normal"> {productData.hero.h1Highlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
            {productData.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-24">
            <Button onClick={handleGetStarted}>{productData.hero.cta1}</Button>
            <Button variant="outline" onClick={scrollToCompare}>{productData.hero.cta2}</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {productData.engines.map((engine, idx) => (
              <Link href={engine.href} key={engine.id}>
                <Card className="group transition-all duration-300 hover:-translate-y-1 hover:border-transparent cursor-pointer h-full flex flex-col"
                      style={{ 
                        "--hover-glow": engine.color 
                      } as any}
                >
                  <style jsx>{`
                    .group:hover {
                      box-shadow: 0 0 20px -5px var(--hover-glow);
                      border-color: var(--hover-glow);
                    }
                  `}</style>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: engine.color }} />
                    <h3 className="text-xl font-bold text-text">{engine.name}</h3>
                  </div>
                  <p className="text-sm text-muted mb-6">{engine.purpose}</p>
                  
                  <div className="h-44 mb-6 rounded-lg overflow-hidden border border-border/50 bg-surface-2 relative pointer-events-none">
                    <div className="absolute inset-0 scale-[0.8] origin-top-left p-4 w-[125%] h-[125%]">
                      {idx === 0 && <MongoDemo />}
                      {idx === 1 && <PostgresDemo />}
                      {idx === 2 && <QdrantDemo />}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {engine.linkText}
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 2: COMPARISON TABLE */}
      <Section id="compare" className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title={productData.comparison.title} className="text-center" />
          
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {productData.comparison.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? "bg-text text-bg" 
                    : "bg-surface border border-border text-muted hover:text-text"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    <th className="p-6 border-b border-border bg-surface sticky left-0 z-10 w-1/4 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">Feature</th>
                    {productData.comparison.columns.map((col, idx) => (
                      <th key={col.id} className="p-6 border-b border-border hover:bg-surface-2/50 transition-colors w-1/4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                          {col.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="relative">
                  <AnimatePresence>
                    {filteredRows.map((row) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        key={row.feature}
                        className="group border-b border-border/50 last:border-0 hover:bg-surface-2/30"
                      >
                        <td className="p-6 font-medium text-text bg-surface group-hover:bg-transparent sticky left-0 z-10">{row.feature}</td>
                        <td className="p-6 text-muted">{row.postgres}</td>
                        <td className="p-6 text-muted">{row.mongodb}</td>
                        <td className="p-6 text-muted">{row.qdrant}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </Section>

      {/* SECTION 3: BETTER TOGETHER */}
      <Section className="py-24">
        <Container>
          <SectionHeader title={productData.betterTogether.title} className="text-center" />
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {productData.betterTogether.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-surface text-muted border border-border hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative h-[400px]">
            <AnimatePresence mode="wait">
              {productData.betterTogether.tabs.map((tab) => {
                if (tab.id !== activeTab) return null;
                return (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex flex-col items-center"
                  >
                    <Card className="w-full max-w-4xl p-8 bg-surface-2/30 border border-border/50 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden h-[320px]">
                      {/* Diagram SVG */}
                      <div className="flex-1 flex justify-center w-full relative z-10">
                         <svg viewBox="0 0 400 200" className="w-full h-full max-h-[200px]" overflow="visible">
                           {/* App Box */}
                           <rect x="20" y="70" width="80" height="60" rx="8" fill="#1A1D24" stroke="var(--border)" strokeWidth="2" />
                           <text x="60" y="105" fill="var(--text)" fontSize="14" textAnchor="middle" fontWeight="bold">App</text>

                           {/* Lines */}
                           <path d="M100 100 L180 50 L220 50" stroke="var(--border)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                           <path d="M100 100 L220 100" stroke="var(--border)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                           <path d="M100 100 L180 150 L220 150" stroke="var(--border)" strokeWidth="2" fill="none" strokeDasharray="4 4" />

                           {/* Dots */}
                           <circle r="4" fill="#4C8DFF">
                             <animateMotion dur="2s" repeatCount="indefinite" path="M100 100 L180 50 L220 50" />
                           </circle>
                           <circle r="4" fill="#3FCF6D">
                             <animateMotion dur="2.5s" repeatCount="indefinite" path="M100 100 L220 100" />
                           </circle>
                           <circle r="4" fill="#FF4D8D">
                             <animateMotion dur="3s" repeatCount="indefinite" path="M100 100 L180 150 L220 150" />
                           </circle>

                           {/* Engines Box */}
                           <rect x="220" y="30" width="160" height="40" rx="6" fill="#1A1D24" stroke="#4C8DFF" strokeWidth="1" />
                           <text x="235" y="55" fill="#4C8DFF" fontSize="12" fontWeight="bold">PG:</text>
                           <text x="260" y="55" fill="var(--muted)" fontSize="12">{tab.apps[0].stores}</text>

                           <rect x="220" y="80" width="160" height="40" rx="6" fill="#1A1D24" stroke="#3FCF6D" strokeWidth="1" />
                           <text x="235" y="105" fill="#3FCF6D" fontSize="12" fontWeight="bold">MDB:</text>
                           <text x="265" y="105" fill="var(--muted)" fontSize="12">{tab.apps[1].stores}</text>

                           <rect x="220" y="130" width="160" height="40" rx="6" fill="#1A1D24" stroke="#FF4D8D" strokeWidth="1" />
                           <text x="235" y="155" fill="#FF4D8D" fontSize="12" fontWeight="bold">QD:</text>
                           <text x="260" y="155" fill="var(--muted)" fontSize="12">{tab.apps[2].stores}</text>
                         </svg>
                      </div>
                    </Card>
                    <p className="text-center text-muted max-w-2xl mt-6">{tab.caption}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Container>
      </Section>

      {/* SECTION 4: INCLUDED WITH EVERY ENGINE */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title="Included with every engine" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
            {productData.included.tiles.map((tile, i) => (
              <Card key={tile.id} className={`flex flex-col group relative overflow-hidden ${
                i === 0 ? "md:col-span-2" : i === 3 ? "md:col-span-2" : "md:col-span-1"
              }`}>
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-accent mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {tile.icon === "backup" && <Database />}
                    {tile.icon === "monitor" && <Activity />}
                    {tile.icon === "lock" && <Shield />}
                    {tile.icon === "terminal" && <Terminal />}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tile.title}</h3>
                  <p className="text-muted text-sm">{tile.description}</p>
                </div>
                <div className="mt-auto">
                  <Link href={tile.href} className="text-accent text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                    Learn more <ArrowRight size={14} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* SECTION 5: WHICH ONE SHOULD I USE */}
      <div className="py-24 relative">
        <Container>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">{productData.quiz.intro}</h2>
          </div>
        </Container>
        <Quiz />
      </div>

      {/* SECTION 6: CLOSING STRIP */}
      <Section className="py-24 border-t border-border bg-bg text-center">
        <Container>
          <h2 className="text-3xl font-bold mb-8">{productData.closing.text}</h2>
          <Button size="lg" onClick={handleGetStarted}>{productData.closing.cta}</Button>
        </Container>
      </Section>

    </div>
  );
}
