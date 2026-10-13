"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { homeData } from "@/data/home";
import { ArrowRight, RotateCcw, Database } from "lucide-react";

// ─── MONGO DEMO ──────────────────────────────────────────────
const MONGO_DOCS = [
  { id: 1, name: "Alice", plan: "pro", role: "admin" },
  { id: 2, name: "Bob", plan: "free", role: "user" },
  { id: 3, name: "Charlie", plan: "pro", role: "user" },
  { id: 4, name: "Diana", plan: "free", role: "editor" },
  { id: 5, name: "Eve", plan: "pro", role: "user" }
];

export function MongoDemo() {
  const [filter, setFilter] = useState<"all" | "free" | "pro">("all");
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (interacted) return;
    const filters: ("all" | "free" | "pro")[] = ["all", "pro", "free"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % filters.length;
      setFilter(filters[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [interacted]);

  const handleFilter = (f: "all" | "free" | "pro") => {
    setFilter(f);
    setInteracted(true);
  };

  const filteredDocs = MONGO_DOCS.filter(d => filter === "all" || d.plan === filter);
  
  return (
    <div className="flex flex-col h-full font-mono text-xs">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2 text-muted">
          <span>db.users.find({filter === "all" ? "{}" : `{ plan: "${filter}" }`})</span>
        </div>
        <div className="flex gap-2">
          {(["all", "free", "pro"] as const).map(f => (
            <button 
              key={f} 
              onClick={() => handleFilter(f)}
              className={`px-2 py-1 rounded transition-colors ${filter === f ? "bg-accent/20 text-accent" : "bg-surface-2 text-muted hover:text-text"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map(doc => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={doc.id}
                className="bg-[#05080F] p-3 rounded-lg border border-border/50 text-muted"
              >
                <span className="text-[#3FCF6D]">{"{"}</span>
                <span className="ml-4">_id: {doc.id}, name: "{doc.name}", plan: "{doc.plan}"</span>
                <span className="text-[#3FCF6D]">{"}"}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-muted">
        <span>{filteredDocs.length} documents matched in 3ms</span>
        <span className="flex items-center gap-1"><Database size={12} /> MongoDB</span>
      </div>
    </div>
  );
}

// ─── POSTGRES DEMO ───────────────────────────────────────────
const PG_ROWS = [
  { id: 101, name: "Alice", plan: "pro", created_at: "2023-01-15" },
  { id: 102, name: "Bob", plan: "free", created_at: "2023-02-10" },
  { id: 103, name: "Charlie", plan: "pro", created_at: "2023-03-22" },
  { id: 104, name: "Diana", plan: "free", created_at: "2023-04-05" },
  { id: 105, name: "Eve", plan: "pro", created_at: "2023-05-18" },
  { id: 106, name: "Frank", plan: "free", created_at: "2023-06-30" },
];

export function PostgresDemo() {
  const targetSql = "SELECT * FROM users WHERE plan = 'pro' ORDER BY created_at DESC;";
  const [sql, setSql] = useState("");
  const [phase, setPhase] = useState<"typing" | "running" | "done">("typing");
  const [highlightRows, setHighlightRows] = useState<number[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setSql(targetSql.slice(0, i));
      i++;
      if (i > targetSql.length) {
        clearInterval(typingInterval);
        setPhase("running");
        
        setTimeout(() => {
          setPhase("done");
          const proIndices = PG_ROWS.map((r, idx) => r.plan === "pro" ? idx : -1).filter(idx => idx !== -1);
          // Highlight them one after another
          proIndices.forEach((rowIndex, step) => {
            setTimeout(() => {
              setHighlightRows(prev => [...prev, rowIndex]);
            }, step * 150);
          });
        }, 400);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, [key]);

  // Reset state when key changes if needed, but since it's an effect, we can just let it run.
  // Actually, to avoid cascading render, we should clear it via a ref or before effect.
  // We'll just ignore the initial reset and let the typingInterval overwrite it.

  return (
    <div className="flex flex-col h-full font-mono text-xs">
      <div className="bg-[#05080F] p-3 rounded-lg border border-border mb-4 min-h-[44px] flex items-center">
        <span className="text-[#4C8DFF] mr-2">{"=>"}</span>
        <span className="text-text">{sql}</span>
        {phase === "typing" && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-[#4C8DFF] ml-1 inline-block" />}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-4 gap-2 pb-2 text-muted border-b border-border/50 mb-2 font-semibold">
          <div>id</div><div>name</div><div>plan</div><div>created_at</div>
        </div>
        <div className="space-y-1">
          {PG_ROWS.map((row, i) => {
            const isHighlighted = highlightRows.includes(i);
            return (
              <motion.div 
                key={row.id}
                animate={{ 
                  backgroundColor: isHighlighted ? "rgba(76, 141, 255, 0.15)" : "transparent",
                  color: isHighlighted ? "#4C8DFF" : "var(--text)"
                }}
                className="grid grid-cols-4 gap-2 px-2 py-1.5 rounded"
              >
                <div>{row.id}</div>
                <div>{row.name}</div>
                <div>{row.plan}</div>
                <div className="text-muted">{row.created_at}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setKey(k => k + 1)} className="flex items-center gap-1 text-muted hover:text-text transition-colors">
            <RotateCcw size={12} /> Run again
          </button>
        </div>
        <div className="text-muted flex items-center gap-3">
          {phase === "done" && <span className="text-[#4C8DFF]">3 rows - 4ms</span>}
          <span className="flex items-center gap-1"><Database size={12} /> PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}

// ─── QDRANT DEMO ─────────────────────────────────────────────
const DOTS = [
  // Cluster 1
  {x: 15, y: 25}, {x: 20, y: 15}, {x: 25, y: 35}, {x: 10, y: 40}, {x: 30, y: 20}, {x: 22, y: 28}, {x: 18, y: 35},
  // Cluster 2
  {x: 75, y: 15}, {x: 80, y: 25}, {x: 85, y: 10}, {x: 70, y: 20}, {x: 88, y: 30}, {x: 78, y: 35}, {x: 82, y: 18},
  // Cluster 3
  {x: 45, y: 70}, {x: 50, y: 85}, {x: 55, y: 75}, {x: 40, y: 80}, {x: 60, y: 85}, {x: 48, y: 60}, {x: 52, y: 65},
  // Scatter
  {x: 35, y: 50}, {x: 65, y: 45}, {x: 50, y: 40}, {x: 30, y: 65}, {x: 70, y: 60}, {x: 85, y: 75}, {x: 15, y: 70}
];

export function QdrantDemo() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (interacted) return;
    let i = 0;
    const interval = setInterval(() => {
      // Pick random dot
      const randomIdx = Math.floor(Math.random() * DOTS.length);
      setActiveIdx(randomIdx);
    }, 2500);
    return () => clearInterval(interval);
  }, [interacted]);

  const handleInteract = (idx: number) => {
    setActiveIdx(idx);
    setInteracted(true);
  };

  // Find 3 nearest
  let nearest: {idx: number, dist: number, score: number}[] = [];
  if (activeIdx !== null) {
    const activeDot = DOTS[activeIdx];
    const dists = DOTS.map((d, i) => {
      const dx = d.x - activeDot.x;
      const dy = d.y - activeDot.y;
      return { idx: i, dist: Math.sqrt(dx*dx + dy*dy) };
    });
    // Sort by dist, take top 3 excluding self (dist > 0)
    const top3 = dists.filter(d => d.idx !== activeIdx).sort((a,b) => a.dist - b.dist).slice(0, 3);
    // map dist to a fake similarity score between 0.85 and 0.98
    nearest = top3.map((n, i) => ({ ...n, score: 0.98 - i * 0.03 - Math.abs(Math.sin(activeIdx + i))*0.01 }));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative bg-[#05080F] rounded-lg border border-border/50 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Lines */}
          {activeIdx !== null && nearest.map((n, i) => (
            <g key={`line-${n.idx}`}>
              <line 
                x1={DOTS[activeIdx].x} y1={DOTS[activeIdx].y} 
                x2={DOTS[n.idx].x} y2={DOTS[n.idx].y} 
                stroke="#FF4D8D" strokeWidth="0.5" strokeOpacity="0.5"
                strokeDasharray="2 1"
              />
              <text 
                x={(DOTS[activeIdx].x + DOTS[n.idx].x)/2} 
                y={(DOTS[activeIdx].y + DOTS[n.idx].y)/2 - 2}
                fill="#FF4D8D" fontSize="3" fontFamily="monospace" textAnchor="middle"
              >
                {n.score.toFixed(2)}
              </text>
            </g>
          ))}
          
          {/* Dots */}
          {DOTS.map((d, i) => {
            const isActive = i === activeIdx;
            const isNearest = nearest.some(n => n.idx === i);
            return (
              <circle
                key={i}
                cx={d.x} cy={d.y}
                r={isActive ? 2 : (isNearest ? 1.5 : 1)}
                fill={isActive || isNearest ? "#FF4D8D" : "rgba(138, 151, 171, 0.4)"}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => handleInteract(i)}
                style={{ filter: isActive || isNearest ? "drop-shadow(0 0 4px #FF4D8D)" : "none" }}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted font-mono">
        <span>Similarity search across 1M+ vectors</span>
        <span className="flex items-center gap-1"><Database size={12} /> Qdrant</span>
      </div>
    </div>
  );
}


// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function ThreeDatabases() {
  const renderDemo = (index: number) => {
    switch (index) {
      case 0: return <MongoDemo />;
      case 1: return <PostgresDemo />;
      case 2: return <QdrantDemo />;
      default: return null;
    }
  };

  return (
    <section className="bg-bg py-24 lg:py-32 relative overflow-hidden">
      <Container className="flex flex-col gap-32 lg:gap-48">
        {homeData.databases.map((db, idx) => (
          <motion.div 
            key={db.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            {/* Left Side: Animated Text */}
            <div className="relative flex flex-col justify-center order-2 lg:order-1">
              <div className="text-[120px] lg:text-[160px] leading-none font-serif font-black opacity-[0.03] absolute -top-10 -left-6 lg:-left-12 select-none">
                {db.id}
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4 lg:mb-6">
                  <span className="w-4 h-4 rounded-full shadow-[0_0_15px_currentColor]" style={{ background: db.color, color: db.color }}/>
                  <h3 className="text-4xl lg:text-6xl font-bold tracking-tight">{db.name}</h3>
                </div>
                
                {/* Typewriter effect for description */}
                <motion.p 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={{
                    visible: { transition: { staggerChildren: 0.015 } }
                  }}
                  className="text-accent mb-8 lg:mb-10 font-mono text-sm lg:text-base tracking-wide"
                >
                  {db.for.split("").map((char, i) => (
                    <motion.span 
                      key={i}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.p>
                
                <ul className="space-y-4 mb-8 lg:mb-12">
                  {db.benefits.map((b, i) => (
                    <motion.li 
                      key={b} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: "easeOut" }}
                      className="flex gap-3 items-center text-lg text-text"
                    >
                      <ArrowRight size={18} className="text-muted shrink-0 mt-0.5" /> 
                      <span>{b}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Side: Demo Window */}
            <div className="relative h-[360px] lg:h-[420px] order-1 lg:order-2">
              <Card className="h-full flex flex-col p-4 shadow-2xl relative z-20 bg-surface/95 backdrop-blur-xl border-border">
                {/* Fake window top bar */}
                <div className="flex gap-1.5 mb-6 px-2">
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                  <div className="w-3 h-3 rounded-full bg-border/60" />
                  <div className="ml-4 font-mono text-[10px] text-muted tracking-widest uppercase flex items-center">
                    Live Preview
                  </div>
                </div>
                
                <div className="flex-1 relative min-h-0">
                  {renderDemo(idx)}
                </div>
              </Card>
              
              {/* Background ambient glow matching the DB color */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.15 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-0 blur-[80px] lg:blur-[100px] -z-10 rounded-full"
                style={{ background: db.color }}
              />
            </div>
          </motion.div>
        ))}
      </Container>
    </section>
  );
}
