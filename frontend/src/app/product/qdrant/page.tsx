"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductPageTemplate } from "@/components/product/ProductPage";
import { qdrantContent } from "@/data/products/qdrant";

// --- HERO BACKGROUND ---
function QdrantHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    const dots = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    
    let mouse = { x: -1000, y: -1000 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    
    let animationId: number;
    
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255, 77, 141, 0.3)";
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (!prefersReduced) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > w) d.vx *= -1;
          if (d.y < 0 || d.y > h) d.vy *= -1;
        }
        
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Connect near mouse
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 77, 141, ${0.3 * (1 - dist/150)})`;
          ctx.stroke();
          
          // Connect to other nearby dots
          for (let j = i + 1; j < dots.length; j++) {
            const d2 = dots[j];
            const dx2 = d.x - d2.x;
            const dy2 = d.y - d2.y;
            const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
            if (dist2 < 80) {
              ctx.beginPath();
              ctx.moveTo(d.x, d.y);
              ctx.lineTo(d2.x, d2.y);
              ctx.strokeStyle = `rgba(255, 77, 141, ${0.1 * (1 - dist2/80)})`;
              ctx.stroke();
            }
          }
        }
      }
      
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 mask-image:linear-gradient(to_bottom,black,transparent)"
    />
  );
}

// --- PLAYGROUND ---

const PLAYGROUND_ITEMS = [
  { id: 1, title: "Wool Winter Sweater", category: "clothing", scores: { cozy: 0.95, laptop: 0.12, dinner: 0.10 }, pos: { x: 20, y: 80 } },
  { id: 2, title: "Fleece Blanket", category: "home", scores: { cozy: 0.92, laptop: 0.05, dinner: 0.15 }, pos: { x: 25, y: 75 } },
  { id: 3, title: "Hot Chocolate Mix", category: "food", scores: { cozy: 0.88, laptop: 0.02, dinner: 0.40 }, pos: { x: 15, y: 85 } },
  { id: 4, title: "MacBook Pro M3", category: "electronics", scores: { cozy: 0.10, laptop: 0.98, dinner: 0.05 }, pos: { x: 80, y: 20 } },
  { id: 5, title: "Dell XPS 15", category: "electronics", scores: { cozy: 0.08, laptop: 0.95, dinner: 0.04 }, pos: { x: 85, y: 25 } },
  { id: 6, title: "ThinkPad X1 Carbon", category: "electronics", scores: { cozy: 0.12, laptop: 0.92, dinner: 0.06 }, pos: { x: 75, y: 15 } },
  { id: 7, title: "Grilled Salmon Recipe", category: "food", scores: { cozy: 0.45, laptop: 0.05, dinner: 0.96 }, pos: { x: 20, y: 20 } },
  { id: 8, title: "Quinoa Salad Bowl", category: "food", scores: { cozy: 0.30, laptop: 0.02, dinner: 0.92 }, pos: { x: 15, y: 25 } },
  { id: 9, title: "Roasted Chicken", category: "food", scores: { cozy: 0.50, laptop: 0.03, dinner: 0.94 }, pos: { x: 25, y: 15 } },
  { id: 10, title: "Noise Cancelling Headphones", category: "electronics", scores: { cozy: 0.60, laptop: 0.70, dinner: 0.05 }, pos: { x: 50, y: 50 } },
  { id: 11, title: "Warm Slippers", category: "clothing", scores: { cozy: 0.94, laptop: 0.05, dinner: 0.10 }, pos: { x: 30, y: 85 } },
  { id: 12, title: "Desk Setup Guide", category: "home", scores: { cozy: 0.30, laptop: 0.80, dinner: 0.15 }, pos: { x: 70, y: 40 } }
];

const QUERIES = {
  cozy: { label: "something cozy for winter", pos: { x: 20, y: 80 } },
  laptop: { label: "fast laptop for coding", pos: { x: 80, y: 20 } },
  dinner: { label: "healthy dinner ideas", pos: { x: 20, y: 20 } }
};

function QdrantPlayground() {
  const [queryKey, setQueryKey] = useState<keyof typeof QUERIES>("cozy");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "vector">("list");
  
  const query = QUERIES[queryKey];
  
  // Calculate results
  const items = PLAYGROUND_ITEMS.map(item => ({
    ...item,
    score: item.scores[queryKey],
    isFiltered: activeCategory !== "all" && item.category !== activeCategory
  }));
  
  const results = items
    .filter(i => !i.isFiltered)
    .sort((a, b) => b.score - a.score);
    
  const top3 = results.slice(0, 3);

  return (
    <div className="bg-[#05080F] rounded-2xl border border-[var(--engine)]/30 overflow-hidden shadow-[0_0_30px_rgba(255,77,141,0.1)]">
      {/* Top Bar */}
      <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(QUERIES) as Array<keyof typeof QUERIES>).map(k => (
            <button
              key={k}
              onClick={() => setQueryKey(k)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${queryKey === k ? "bg-[var(--engine)] text-[#05080F]" : "bg-surface border border-border text-muted hover:text-text"}`}
            >
              {QUERIES[k].label}
            </button>
          ))}
        </div>
        <div className="flex bg-surface-2 p-1 rounded-lg">
          <button onClick={() => setViewMode("list")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "list" ? "bg-[var(--engine)]/20 text-[var(--engine)]" : "text-muted hover:text-text"}`}>List View</button>
          <button onClick={() => setViewMode("vector")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "vector" ? "bg-[var(--engine)]/20 text-[var(--engine)]" : "text-muted hover:text-text"}`}>Vector Space</button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="px-6 py-4 bg-surface-2/30 border-b border-border/50 flex flex-wrap items-center gap-4 text-sm font-mono">
        <span className="text-muted">Payload filter:</span>
        {["all", "clothing", "home", "food", "electronics"].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded transition-colors ${activeCategory === cat ? "bg-text text-bg" : "border border-border text-muted hover:text-text"}`}
          >
            {cat === "all" ? "{}" : `{ category: "${cat}" }`}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="h-[400px] relative">
        {viewMode === "list" ? (
          <div className="p-6 h-full overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {results.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted text-center mt-10">No results match this filter.</motion.div>
              )}
              {results.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-4 border-b border-border/30 hover:bg-surface-2/30 group"
                >
                  <div>
                    <div className="font-bold text-text group-hover:text-[var(--engine)] transition-colors">{item.title}</div>
                    <div className="text-xs font-mono text-muted mt-1">category: {item.category}</div>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs font-mono text-[var(--engine)] mb-1">
                      <span>{item.score.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score * 100}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        className="h-full bg-[var(--engine)] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-6 h-full relative overflow-hidden flex items-center justify-center">
            {/* Vector Space Map */}
            <div className="w-full h-full max-w-lg max-h-lg relative border border-border/30 rounded-xl bg-surface/50">
              {/* Lines to top 3 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {top3.map((item, i) => (
                  <motion.line
                    key={`line-${item.id}-${queryKey}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 - i * 0.15 }}
                    x1={`${query.pos.x}%`} y1={`${query.pos.y}%`}
                    x2={`${item.pos.x}%`} y2={`${item.pos.y}%`}
                    stroke="var(--engine)" strokeWidth="2" strokeDasharray="4 4"
                  />
                ))}
              </svg>

              {/* Items */}
              {items.map(item => (
                <motion.div
                  key={item.id}
                  animate={{ opacity: item.isFiltered ? 0.1 : 1 }}
                  className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-border hover:bg-text cursor-pointer transition-colors group"
                  style={{ left: `${item.pos.x}%`, top: `${item.pos.y}%` }}
                >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bg border border-border px-2 py-1 rounded text-xs font-mono text-text opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {item.title}
                  </div>
                </motion.div>
              ))}
              
              {/* Query Dot */}
              <motion.div
                layout
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-[var(--engine)] shadow-[0_0_15px_var(--engine)] flex items-center justify-center"
                style={{ left: `${query.pos.x}%`, top: `${query.pos.y}%` }}
              >
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-full h-full rounded-full border border-[var(--engine)]"
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// --- FEATURE VISUALS ---

function VisualNN() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setActive(a => (a + 1) % 3), 1500);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="w-full h-64 min-h-[250px] flex justify-center items-center relative">
      <div className="absolute w-4 h-4 bg-[var(--engine)] rounded-full shadow-[0_0_15px_var(--engine)]" />
      {[0, 1, 2].map((i) => {
        const angle = (i * 120 - 90) * (Math.PI / 180);
        const distance = active === i ? 40 : 80;
        const x = distance * Math.cos(angle);
        const y = distance * Math.sin(angle);
        return (
          <motion.div
            key={i}
            animate={{ x, y, opacity: active === i ? 1 : 0.3 }}
            className="absolute w-3 h-3 bg-white rounded-full"
          />
        );
      })}
    </div>
  );
}

function VisualPayload() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 bg-[#05080F] p-3 rounded-lg border border-[var(--engine)]/50 cursor-pointer" onClick={() => setEnabled(!enabled)}>
        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${enabled ? "bg-[var(--engine)]" : "bg-border"}`}>
          <motion.div className="w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: enabled ? 20 : 0 }} />
        </div>
        <span className="font-mono text-xs text-text">filter: {'{'} in_stock: true {'}'}</span>
      </div>
      <div className="flex gap-4">
        <motion.div animate={{ opacity: enabled ? 1 : 0.2 }} className="w-16 h-16 rounded bg-surface border border-border flex flex-col items-center justify-center text-xs">
          <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center mb-1 font-bold">YES</div>
          item A
        </motion.div>
        <motion.div animate={{ opacity: 0.2 }} className="w-16 h-16 rounded bg-surface border border-border flex flex-col items-center justify-center text-xs">
          <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center mb-1 font-bold">NO</div>
          item B
        </motion.div>
      </div>
    </div>
  );
}

function VisualHybrid() {
  const [weight, setWeight] = useState(0.5);
  return (
    <div className="w-full flex flex-col items-center gap-6 w-3/4 max-w-[200px] mx-auto">
      <div className="text-center font-mono text-xs text-muted mb-2">BM25 / Vector Weight</div>
      <input 
        type="range" min="0" max="1" step="0.1" 
        value={weight} onChange={e => setWeight(Number(e.target.value))}
        className="w-full accent-[var(--engine)]"
      />
      <div className="flex justify-between w-full text-xs font-mono">
        <span style={{ color: `rgba(255,255,255,${1-weight})` }}>Keyword<br/>{(1-weight).toFixed(1)}</span>
        <span style={{ color: `rgba(255,77,141,${0.5+weight/2})`, textAlign: 'right' }}>Semantic<br/>{weight.toFixed(1)}</span>
      </div>
    </div>
  );
}

function VisualRag() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setStep(s => (s + 1) % 4), 1500);
    return () => clearInterval(int);
  }, []);

  const nodes = [
    { label: "Question", id: 0 },
    { label: "Qdrant", id: 1 },
    { label: "Context", id: 2 },
    { label: "LLM Answer", id: 3 }
  ];

  return (
    <div className="w-full flex flex-col gap-4 font-mono text-[10px]">
      {nodes.map(n => (
        <div key={n.id} className="relative flex items-center">
          <motion.div 
            animate={{ 
              borderColor: step === n.id ? "var(--engine)" : "var(--border)",
              color: step === n.id ? "var(--engine)" : "var(--muted)",
              scale: step === n.id ? 1.05 : 1
            }}
            className="px-4 py-2 rounded border bg-surface-2 z-10"
          >
            {n.label}
          </motion.div>
          {n.id < 3 && (
            <div className="w-8 border-b border-dashed border-border ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}

const FEATURE_VISUALS = [
  <VisualNN key="1" />,
  <VisualPayload key="2" />,
  <VisualHybrid key="3" />,
  <VisualRag key="4" />
];

// --- PAGE COMPONENT ---
export default function QdrantPage() {
  return (
    <ProductPageTemplate 
      content={qdrantContent}
      HeroBackground={QdrantHeroBackground}
      Playground={QdrantPlayground}
      FeatureVisuals={FEATURE_VISUALS}
    />
  );
}
