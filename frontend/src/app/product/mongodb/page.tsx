"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductPageTemplate } from "@/components/product/ProductPage";
import { mongodbContent } from "@/data/products/mongodb";

// --- HERO BACKGROUND ---
function MongoHeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      {/* Floating JSON brackets */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[var(--engine)] font-mono text-2xl md:text-5xl opacity-40 font-bold"
          initial={{
            y: "110vh",
            x: `${Math.random() * 100}vw`,
            rotate: Math.random() * 360
          }}
          animate={{
            y: "-10vh",
            rotate: Math.random() * 360 + 180
          }}
          transition={{
            duration: 15 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * -30
          }}
        >
          {i % 2 === 0 ? "{ }" : "[ ]"}
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent z-10" />
    </div>
  );
}

// --- PLAYGROUND ---
const INITIAL_DOCS = [
  { _id: "1", name: "Laptop Pro", category: "electronics", price: 1299, inStock: true },
  { _id: "2", name: "Running Shoes", category: "shoes", price: 99, inStock: true },
  { _id: "3", name: "Coffee Mug", category: "home", price: 15, inStock: false },
  { _id: "4", name: "Wireless Mouse", category: "electronics", price: 45, inStock: true },
  { _id: "5", name: "Sneakers", category: "shoes", price: 110, inStock: true },
  { _id: "6", name: "Desk Lamp", category: "home", price: 35, inStock: false },
  { _id: "7", name: "Mechanical Keyboard", category: "electronics", price: 150, inStock: true },
  { _id: "8", name: "Hiking Boots", category: "shoes", price: 140, inStock: true },
];

function MongoPlayground() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [highlightedDoc, setHighlightedDoc] = useState<string | null>(null);

  const filteredDocs = docs
    .filter(d => category === "all" || d.category === category)
    .filter(d => d.price <= maxPrice)
    .filter(d => inStockOnly ? d.inStock : true)
    .sort((a, b) => sortOrder === "asc" ? a.price - b.price : b.price - a.price);

  const addField = () => {
    if (filteredDocs.length > 0) {
      const targetId = filteredDocs[0]._id;
      setDocs(docs.map(d => d._id === targetId ? { ...d, rating: 4.8 } : d));
      setHighlightedDoc(targetId);
      setTimeout(() => setHighlightedDoc(null), 2000);
    }
  };

  const queryStr = `db.products.find({
  ${category !== "all" ? `category: "${category}",\n  ` : ""}${maxPrice < 2000 ? `price: { $lt: ${maxPrice} },\n  ` : ""}${inStockOnly ? `inStock: true\n` : ""}
}).sort({ price: ${sortOrder === "asc" ? "1" : "-1"} })`.replace(/,\n\n/g, "\n").replace(/\n\n}/g, "\n}");

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* LEFT: Documents */}
      <div className="lg:col-span-2 bg-surface-2 rounded-2xl border border-border/50 p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-[var(--engine)] text-sm">db.products (Collection)</h3>
          <button
            onClick={addField}
            className="text-xs bg-[var(--engine)]/10 text-[var(--engine)] px-3 py-1.5 rounded-md hover:bg-[var(--engine)]/20 transition-colors"
          >
            + Add random field
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map(doc => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  boxShadow: highlightedDoc === doc._id ? "0 0 15px var(--engine)" : "none",
                  borderColor: highlightedDoc === doc._id ? "var(--engine)" : "var(--border)"
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={doc._id}
                className="bg-[#05080F] p-4 rounded-xl border border-border/50 font-mono text-sm text-muted"
              >
                <span className="text-[var(--engine)]">{"{"}</span>
                <div className="pl-4">
                  <div>_id: "{doc._id}",</div>
                  <div>name: <span className="text-text">"{doc.name}"</span>,</div>
                  <div>category: "{doc.category}",</div>
                  <div>price: <span className="text-accent">{doc.price}</span>,</div>
                  <div>inStock: <span className="text-accent">{doc.inStock ? "true" : "false"}</span>{(doc as any).rating ? "," : ""}</div>
                  {(doc as any).rating && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-400 font-bold">
                      rating: {(doc as any).rating}
                    </motion.div>
                  )}
                </div>
                <span className="text-[var(--engine)]">{"}"}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredDocs.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted">No documents match the query.</div>
          )}
        </div>
      </div>

      {/* RIGHT: Query Builder */}
      <div className="bg-[#05080F] rounded-2xl border border-[var(--engine)]/30 p-6 flex flex-col h-[600px] shadow-[0_0_30px_rgba(63,207,109,0.1)]">
        <h3 className="font-bold mb-6 text-lg">Query Builder</h3>

        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-sm text-muted mb-2">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg p-2 text-text focus:border-[var(--engine)] outline-none"
            >
              <option value="all">All</option>
              <option value="electronics">Electronics</option>
              <option value="shoes">Shoes</option>
              <option value="home">Home</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">Max Price: ${maxPrice}</label>
            <input
              type="range"
              min="0" max="2000" step="10"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--engine)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="inStock"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-[var(--engine)]"
            />
            <label htmlFor="inStock" className="text-sm">In Stock Only</label>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">Sort by Price</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder("asc")}
                className={`flex-1 py-1.5 rounded-md text-sm border transition-colors ${sortOrder === "asc" ? "bg-[var(--engine)]/20 border-[var(--engine)] text-text" : "border-border text-muted hover:text-text"}`}
              >
                Lowest First
              </button>
              <button
                onClick={() => setSortOrder("desc")}
                className={`flex-1 py-1.5 rounded-md text-sm border transition-colors ${sortOrder === "desc" ? "bg-[var(--engine)]/20 border-[var(--engine)] text-text" : "border-border text-muted hover:text-text"}`}
              >
                Highest First
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border/50">
          <div className="bg-bg p-3 rounded-lg border border-border/50 font-mono text-xs text-muted mb-4 whitespace-pre-wrap">
            {queryStr}
          </div>
          <div className="flex justify-between items-center text-xs text-muted">
            <span>{filteredDocs.length} documents matched in 4ms</span>
            <button className="hover:text-text transition-colors">Copy query</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- FEATURE VISUALS ---

function VisualSchema() {
  return (
    <div className="w-full space-y-4 font-mono text-xs">
      <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="bg-[#05080F] p-4 rounded-xl border border-[var(--engine)]/40 shadow-[0_0_15px_rgba(63,207,109,0.1)] text-muted">
        <span className="text-[var(--engine)]">{"{"}</span>
        <div className="pl-4">
          <div>_id: 1,</div>
          <div>name: "T-Shirt",</div>
          <div>sizes: ["S", "M", "L"]</div>
        </div>
        <span className="text-[var(--engine)]">{"}"}</span>
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#05080F] p-4 rounded-xl border border-[var(--engine)]/40 shadow-[0_0_15px_rgba(63,207,109,0.1)] text-muted">
        <span className="text-[var(--engine)]">{"{"}</span>
        <div className="pl-4">
          <div>_id: 2,</div>
          <div>name: "Laptop",</div>
          <div>specs: {"{"} ram: "16GB", cpu: "M3" {"}"}</div>
        </div>
        <span className="text-[var(--engine)]">{"}"}</span>
      </motion.div>
    </div>
  );
}

function VisualPipeline() {
  return (
    <div className="w-full flex flex-col gap-2">
      {[
        { step: "$match", detail: "{ status: 'active' }" },
        { step: "$group", detail: "{ _id: '$category', total: { $sum: 1 } }" },
        { step: "$sort", detail: "{ total: -1 }" }
      ].map((pipe, i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
          className="bg-[#05080F] p-3 rounded-lg border border-border flex items-center gap-4"
        >
          <div className="bg-[var(--engine)]/10 text-[var(--engine)] px-2 py-1 rounded text-xs font-bold font-mono">
            {pipe.step}
          </div>
          <div className="text-xs font-mono text-muted truncate">{pipe.detail}</div>
        </motion.div>
      ))}
    </div>
  );
}

function VisualReplica() {
  const [primary, setPrimary] = useState(0);

  const simulateFailover = () => {
    setPrimary((primary + 1) % 3);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-48 h-48">
        {[0, 1, 2].map((node, i) => {
          const isPrimary = primary === i;
          const angle = (i * 120 - 90) * (Math.PI / 180);
          const x = 50 + 40 * Math.cos(angle);
          const y = 50 + 40 * Math.sin(angle);
          return (
            <motion.div
              key={node}
              layout
              className={`absolute w-14 h-14 -ml-7 -mt-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors duration-500 ${isPrimary ? "bg-[var(--engine)] text-[#05080F] shadow-[0_0_15px_var(--engine)] z-10 scale-110" : "bg-surface border border-border text-muted"}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {isPrimary ? "PRIMARY" : "SEC"}
            </motion.div>
          );
        })}
      </div>
      <button
        onClick={simulateFailover}
        className="mt-6 text-xs border border-border px-4 py-2 rounded-lg hover:bg-surface transition-colors"
      >
        Simulate failure
      </button>
    </div>
  );
}

function VisualStreams() {
  const [events, setEvents] = useState<{ id: number, op: string, coll: string }[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      const ops = ["insert", "update", "delete"];
      const colls = ["users", "orders", "sessions"];
      setEvents(prev => [{
        id: i++,
        op: ops[Math.floor(Math.random() * ops.length)],
        coll: colls[Math.floor(Math.random() * colls.length)]
      }, ...prev].slice(0, 4));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col gap-2 font-mono text-xs">
      <div className="text-muted mb-2 text-center">Live Change Stream</div>
      <AnimatePresence mode="popLayout">
        {events.map(ev => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#05080F] p-3 rounded-lg border border-[var(--engine)]/30 flex items-center justify-between"
          >
            <span className={`uppercase font-bold ${ev.op === 'insert' ? 'text-green-400' : ev.op === 'delete' ? 'text-red-400' : 'text-blue-400'}`}>
              {ev.op}
            </span>
            <span className="text-muted">{ev.coll}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const FEATURE_VISUALS = [
  <VisualSchema key="1" />,
  <VisualPipeline key="2" />,
  <VisualReplica key="3" />,
  <VisualStreams key="4" />
];

// --- PAGE COMPONENT ---
export default function MongoDBPage() {
  return (
    <ProductPageTemplate
      content={mongodbContent}
      HeroBackground={MongoHeroBackground}
      Playground={MongoPlayground}
      FeatureVisuals={FEATURE_VISUALS}
    />
  );
}
