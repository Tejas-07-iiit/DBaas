"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { homeData } from "@/data/home";
import HeroWordmark from "@/components/effects/HeroWordmark";

// ─── HERO COMPONENT ────────────────────────────────────────────────────────
export default function Hero() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <section 
      className="relative isolate w-full min-h-[calc(100vh-68px)] flex items-center pt-20 pb-24 border-b border-border overflow-hidden"
    >
      <HeroWordmark />

      <Container className="relative z-10 flex flex-col items-center justify-center text-center mx-auto max-w-4xl -translate-y-8 md:-translate-y-16">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="flex flex-col items-center"
        >
          {/* Label */}
          <motion.div variants={fadeIn} className="font-mono text-sm text-accent mb-6 uppercase tracking-wider">
            {homeData.hero.label}
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6 text-text">
            {homeData.hero.headingPart1} <span className="text-accent font-serif italic font-normal">{homeData.hero.headingHighlight}</span> {homeData.hero.headingPart3}
          </motion.h1>

          {/* Description */}
          <motion.p variants={fadeIn} className="text-lg text-muted max-w-2xl mb-10 leading-relaxed">
            {homeData.hero.subtext}
          </motion.p>

          {/* Buttons */}
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 bg-accent text-[#05080F] hover:shadow-[0_0_20px_rgba(25,227,193,0.3)] px-8 py-4 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              {homeData.hero.primaryCTA}
            </Link>
            <Link 
              href="/docs" 
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 border border-border bg-transparent hover:border-text text-text px-8 py-4 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 focus:ring-offset-bg hover:bg-surface-2"
            >
              {homeData.hero.secondaryCTA}
            </Link>
          </motion.div>

          {/* DB Chips */}
          <motion.div variants={fadeIn} className="flex flex-wrap gap-3 justify-center relative z-10 pointer-events-auto">
            {[
              { name: "MongoDB", color: "#3FCF6D" },
              { name: "PostgreSQL", color: "#4C8DFF" },
              { name: "Qdrant", color: "#FF4D8D" }
            ].map((chip) => (
              <div
                key={chip.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-sm font-mono text-text transition-colors hover:bg-surface-2"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chip.color }}
                />
                {chip.name}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
