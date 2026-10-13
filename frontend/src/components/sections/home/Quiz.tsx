"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ArrowRight, RotateCcw } from "lucide-react";

const QUESTIONS = [
  {
    q: "What type of data are you primarily storing?",
    options: [
      { text: "Highly structured relational data (Users, Transactions)", rec: "pg" },
      { text: "Unstructured or evolving data (JSON, Catalogs)", rec: "mongo" },
      { text: "AI embeddings, text, or semantic search vectors", rec: "qdrant" }
    ]
  },
  {
    q: "What is your main query pattern?",
    options: [
      { text: "Complex JOINs and strict ACID compliance", rec: "pg" },
      { text: "Fast document lookups and flexible schema", rec: "mongo" },
      { text: "Similarity search and nearest-neighbor matching", rec: "qdrant" }
    ]
  },
  {
    q: "How important is exact match vs approximate match?",
    options: [
      { text: "100% exact matches only", rec: "pg" },
      { text: "Mostly exact, but flexible structures", rec: "mongo" },
      { text: "Approximate semantic meaning is key", rec: "qdrant" }
    ]
  }
];

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ pg: 0, mongo: 0, qdrant: 0 });
  const { user, status } = useAuth();
  const router = useRouter();

  const handleSelect = (rec: string) => {
    setScores(prev => ({ ...prev, [rec]: prev[rec as keyof typeof prev] + 1 }));
    setStep(s => s + 1);
  };

  const restart = () => {
    setScores({ pg: 0, mongo: 0, qdrant: 0 });
    setStep(0);
  };

  let result: { name: string; color: string; reason: string } | null = null;
  if (step === QUESTIONS.length) {
    const max = Math.max(scores.pg, scores.mongo, scores.qdrant);
    if (scores.pg === max) {
      result = { 
        name: "PostgreSQL", 
        color: "#4C8DFF", 
        reason: "Your needs strongly align with strict relational schemas, ACID compliance, and complex queries." 
      };
    } else if (scores.mongo === max) {
      result = { 
        name: "MongoDB", 
        color: "#3FCF6D", 
        reason: "You need the flexibility of a document store to handle evolving JSON structures." 
      };
    } else {
      result = { 
        name: "Qdrant", 
        color: "#FF4D8D", 
        reason: "Your focus on semantic meaning and AI embeddings makes a vector database the perfect fit." 
      };
    }
  }

  const handleCreateNow = () => {
    const engineParam = result?.name || "Database";
    const targetUrl = `/dashboard/projects?create=true&engine=${encodeURIComponent(engineParam)}`;

    if (status === "authenticated" || user) {
      router.push(targetUrl);
    } else {
      router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <Section className="py-24 relative">
      <Container>
        <SectionHeader 
          label="// ENGINE FINDER"
          title="Short Quiz" 
          subtitle="Take this short quiz to find out which type of dataset and database engine you require for your project."
          className="text-center flex flex-col items-center mb-12 [&>p]:text-sm sm:[&>p]:text-base [&>p]:text-muted [&>p]:mt-2.5"
        />

        <Card className="max-w-3xl mx-auto p-8 overflow-hidden relative min-h-[400px] flex flex-col bg-surface-2/30 shadow-2xl">
          <div className="absolute top-0 left-0 h-1 bg-border w-full">
            <motion.div 
              className="h-full bg-accent" 
              initial={{ width: 0 }}
              animate={{ width: `${(step / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <div className="text-sm font-mono text-accent mb-4 mt-4">Question {step + 1} of {QUESTIONS.length}</div>
                <h3 className="text-2xl md:text-3xl font-bold mb-8">{QUESTIONS[step].q}</h3>
                
                <div className="space-y-3 mt-auto">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt.rec)}
                      className="w-full text-left py-4 px-5 rounded-xl border border-border bg-surface hover:border-accent hover:bg-accent/5 transition-all text-text"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center mt-4"
              >
                <div className="text-sm font-mono text-muted mb-4 uppercase tracking-widest">Your ideal engine</div>
                <h3 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: result?.color }}>{result?.name}</h3>
                <p className="text-muted text-lg max-w-lg mb-8">{result?.reason}</p>
                <div className="flex gap-4 items-center">
                  <Button size="lg" onClick={handleCreateNow} className="group">
                    Create it now
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <button 
                    onClick={restart} 
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-text underline underline-offset-4 transition-colors"
                  >
                    <RotateCcw size={14} /> Start over
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </Card>
      </Container>
    </Section>
  );
}
