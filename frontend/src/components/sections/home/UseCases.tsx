"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Rocket, Brain, GraduationCap, Building2 } from "lucide-react";

const USE_CASES = [
  {
    icon: Rocket,
    title: "Startups",
    desc: "Ship features faster without worrying about database provisioning. Start for free and scale infinitely.",
    label: "Sample content"
  },
  {
    icon: Brain,
    title: "AI Applications",
    desc: "Store embeddings and perform semantic search in milliseconds with managed Qdrant clusters.",
    label: "Sample content"
  },
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Learn modern database architecture with our generous free tier and comprehensive documentation.",
    label: "Sample content"
  },
  {
    icon: Building2,
    title: "Agencies",
    desc: "Manage multiple client databases from a single dashboard with isolated billing and permissions.",
    label: "Sample content"
  }
];

export default function UseCases() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
    const updateWidth = () => {
      if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <Section className="py-24 overflow-hidden">
      <Container>
        <SectionHeader 
          label="// BUILT FOR EVERYONE" 
          title="Who uses DBaaS" 
          subtitle="From weekend projects to enterprise deployments, we have a plan for you."
          className="mb-12"
        />
        
        <div ref={carouselRef} className="cursor-grab active:cursor-grabbing">
          <motion.div 
            drag="x" 
            dragConstraints={{ right: 0, left: -width }} 
            className="flex gap-6 w-max"
          >
            {USE_CASES.map((uc, i) => (
              <Card key={i} className="w-80 p-6 flex flex-col shrink-0 select-none bg-surface-2/30 hover:bg-surface-2 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                  <uc.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-text">{uc.title}</h3>
                <p className="text-muted text-sm mb-8 leading-relaxed flex-1">{uc.desc}</p>
                <div className="text-xs font-mono text-border uppercase tracking-widest">{uc.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
