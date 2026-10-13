"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductPageTemplate } from "@/components/product/ProductPage";
import { postgresqlContent } from "@/data/products/postgresql";

// --- HERO BACKGROUND ---
function PostgresHeroBackground() {
  const [activeCells, setActiveCells] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCells = Array.from({ length: 3 }).map(() => Math.floor(Math.random() * 200));
      setActiveCells(newCells);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mask-image:linear-gradient(to_bottom,black,transparent)">
      <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(10,minmax(0,1fr))] opacity-20">
        {Array.from({ length: 200 }).map((_, i) => (
          <motion.div
            key={i}
            className={`border border-[var(--engine)]/20 ${activeCells.includes(i) ? "bg-[var(--engine)]/40" : "bg-transparent"}`}
            animate={{ backgroundColor: activeCells.includes(i) ? "rgba(76,141,255,0.4)" : "rgba(76,141,255,0)" }}
            transition={{ duration: 1 }}
          />
        ))}
      </div>
      <motion.div 
        className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--engine)]/50 shadow-[0_0_20px_var(--engine)]"
        animate={{ y: ["-10vh", "110vh"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// --- PLAYGROUND ---
const QUERIES = [
  { id: "select", name: "SELECT with WHERE", sql: "SELECT name, plan FROM customers WHERE plan = 'pro';" },
  { id: "join", name: "JOIN customers & orders", sql: "SELECT c.name, o.amount FROM customers c\\nJOIN orders o ON c.id = o.customer_id;" },
  { id: "group", name: "GROUP BY revenue", sql: "SELECT c.plan, SUM(o.amount) as revenue\\nFROM customers c JOIN orders o ON c.id = o.customer_id\\nGROUP BY c.plan;" },
  { id: "window", name: "Window function", sql: "SELECT name, amount, RANK() OVER(ORDER BY amount DESC)\\nFROM customers c JOIN orders o ON c.id = o.customer_id;" },
  { id: "transaction", name: "Transaction demo", sql: "BEGIN;\\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\\n-- Wait for COMMIT or ROLLBACK" }
];

const INIT_CUSTOMERS = [
  { id: 1, name: "Alice", plan: "pro" },
  { id: 2, name: "Bob", plan: "free" },
  { id: 3, name: "Charlie", plan: "pro" },
  { id: 4, name: "Diana", plan: "free" },
];

const INIT_ORDERS = [
  { id: 101, customer_id: 1, amount: 250 },
  { id: 102, customer_id: 1, amount: 50 },
  { id: 103, customer_id: 3, amount: 400 },
  { id: 104, customer_id: 2, amount: 20 },
];

function PostgresPlayground() {
  const [activeQuery, setActiveQuery] = useState(QUERIES[0].id);
  const [typedSql, setTypedSql] = useState(QUERIES[0].sql);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [showJoinLines, setShowJoinLines] = useState(false);
  
  // Transaction state
  const [accounts, setAccounts] = useState([{ id: 1, balance: 1000 }]);
  const [pendingTx, setPendingTx] = useState(false);

  const queryObj = QUERIES.find(q => q.id === activeQuery)!;

  const handleRun = () => {
    setExecuting(true);
    setResult([]);
    setShowJoinLines(false);
    
    // Fake typing
    setTypedSql("");
    let i = 0;
    const interval = setInterval(() => {
      setTypedSql(queryObj.sql.slice(0, i));
      i++;
      if (i > queryObj.sql.length) {
        clearInterval(interval);
        setTimeout(() => {
          setExecuting(false);
          executeLogic(queryObj.id);
        }, 500);
      }
    }, 15);
  };

  const executeLogic = (id: string) => {
    if (id === "select") {
      setResult([{ name: "Alice", plan: "pro" }, { name: "Charlie", plan: "pro" }]);
    } else if (id === "join") {
      setResult([
        { name: "Alice", amount: 250 },
        { name: "Alice", amount: 50 },
        { name: "Charlie", amount: 400 },
        { name: "Bob", amount: 20 }
      ]);
      setShowJoinLines(true);
    } else if (id === "group") {
      setResult([{ plan: "pro", revenue: 700 }, { plan: "free", revenue: 20 }]);
    } else if (id === "window") {
      setResult([
        { name: "Charlie", amount: 400, rank: 1 },
        { name: "Alice", amount: 250, rank: 2 },
        { name: "Alice", amount: 50, rank: 3 },
        { name: "Bob", amount: 20, rank: 4 }
      ]);
    } else if (id === "transaction") {
      setPendingTx(true);
      setAccounts([{ id: 1, balance: 900 }]); // temporary update
    }
  };

  const handleCommit = () => {
    setPendingTx(false);
    setResult([{ status: "COMMIT SUCCESSFUL" }]);
  };
  const handleRollback = () => {
    setPendingTx(false);
    setAccounts([{ id: 1, balance: 1000 }]);
    setResult([{ status: "ROLLBACK SUCCESSFUL" }]);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Editor & Results */}
      <div className="bg-[#05080F] rounded-2xl border border-[var(--engine)]/30 p-6 flex flex-col h-[600px] shadow-[0_0_30px_rgba(76,141,255,0.1)]">
        <div className="flex justify-between items-center mb-4">
          <select 
            value={activeQuery}
            onChange={e => { setActiveQuery(e.target.value); setTypedSql(QUERIES.find(q => q.id === e.target.value)!.sql); setResult([]); setShowJoinLines(false); }}
            className="bg-surface border border-border rounded-lg p-2 text-sm text-text focus:border-[var(--engine)] outline-none"
          >
            {QUERIES.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
          <button 
            onClick={handleRun}
            disabled={executing || pendingTx}
            className="bg-[var(--engine)] text-[#05080F] px-4 py-1.5 rounded-lg text-sm font-bold hover:shadow-[0_0_15px_var(--engine)] disabled:opacity-50"
          >
            {executing ? "Executing..." : "Run"}
          </button>
        </div>
        
        <div className="bg-bg border border-border/50 p-4 rounded-lg font-mono text-sm text-accent whitespace-pre-wrap min-h-[100px] mb-6">
          {typedSql}
          {executing && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity }} className="inline-block w-2 h-4 bg-accent ml-1 align-middle" />}
        </div>

        {activeQuery === "transaction" && pendingTx && (
          <div className="flex gap-4 mb-6">
            <button onClick={handleCommit} className="flex-1 bg-green-500/20 text-green-400 border border-green-500/50 py-2 rounded">COMMIT</button>
            <button onClick={handleRollback} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/50 py-2 rounded">ROLLBACK</button>
          </div>
        )}

        <div className="flex-1 overflow-auto border border-border/50 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface sticky top-0 z-10">
              <tr>
                {result.length > 0 && Object.keys(result[0]).map(k => (
                  <th key={k} className="p-3 border-b border-border/50 font-mono text-muted uppercase tracking-wider">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {result.map((row, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="border-b border-border/20 last:border-0 hover:bg-surface-2/30"
                  >
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="p-3 text-text font-mono">{String(v)}</td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-muted font-mono flex justify-between">
          {result.length > 0 && <span>{result.length} rows - 3 ms</span>}
          <span>PostgreSQL 16</span>
        </div>
      </div>

      {/* Source Tables Visualization */}
      <div className="bg-surface-2 rounded-2xl border border-border/50 p-6 flex flex-col h-[600px] relative overflow-hidden">
        <h3 className="font-bold mb-4">Database State</h3>
        <div className="flex-1 flex flex-col gap-6 relative">
          
          {/* Customers Table */}
          <div className="border border-border/50 rounded-lg overflow-hidden bg-bg relative z-10">
            <div className="bg-surface p-2 text-xs font-mono font-bold text-[var(--engine)] border-b border-border/50">public.customers</div>
            <table className="w-full text-left text-xs font-mono">
              <tbody>
                {INIT_CUSTOMERS.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border/20 last:border-0 ${showJoinLines && (c.id === 1 || c.id === 3 || c.id === 2) ? 'bg-[var(--engine)]/10' : ''}`}>
                    <td className="p-2 w-10 text-muted">{c.id}</td>
                    <td className="p-2 text-text">{c.name}</td>
                    <td className="p-2 text-accent">{c.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Orders Table */}
          <div className="border border-border/50 rounded-lg overflow-hidden bg-bg relative z-10">
            <div className="bg-surface p-2 text-xs font-mono font-bold text-[var(--engine)] border-b border-border/50">public.orders</div>
            <table className="w-full text-left text-xs font-mono">
              <tbody>
                {INIT_ORDERS.map((o, i) => (
                  <tr key={o.id} className={`border-b border-border/20 last:border-0 ${showJoinLines ? 'bg-[var(--engine)]/10' : ''}`}>
                    <td className="p-2 w-10 text-muted">{o.id}</td>
                    <td className="p-2 text-muted">cust: {o.customer_id}</td>
                    <td className="p-2 text-accent">${o.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Accounts (for TX demo) */}
          {activeQuery === "transaction" && (
            <div className="border border-border/50 rounded-lg overflow-hidden bg-bg relative z-10">
              <div className="bg-surface p-2 text-xs font-mono font-bold text-[var(--engine)] border-b border-border/50">public.accounts</div>
              <table className="w-full text-left text-xs font-mono">
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id}>
                      <td className="p-2 w-10 text-muted">{a.id}</td>
                      <td className="p-2 text-text">
                        Balance: <span className={pendingTx ? "text-red-400 font-bold" : "text-green-400 font-bold"}>${a.balance}</span>
                        {pendingTx && <span className="ml-2 text-muted italic">(Pending)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SVG Animated Lines for JOIN */}
          {showJoinLines && activeQuery === "join" && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ top: 0, left: 0 }}>
               {/* Just simple vertical/diagonal curves for demo between table 1 and 2 */}
               <motion.path d="M 50 100 C 50 150, 50 150, 50 180" stroke="var(--engine)" strokeWidth="2" fill="none" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
               <motion.path d="M 50 100 C 50 150, 80 150, 80 200" stroke="var(--engine)" strokeWidth="2" fill="none" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.1 }} />
               <motion.path d="M 80 130 C 80 180, 50 180, 50 220" stroke="var(--engine)" strokeWidth="2" fill="none" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
            </svg>
          )}

        </div>
      </div>
    </div>
  );
}

// --- FEATURE VISUALS ---

function VisualAcid() {
  const [step, setStep] = useState(0); // 0=start, 1=deduct, 2=fail, 3=rollback
  
  useEffect(() => {
    const int = setInterval(() => setStep(s => (s + 1) % 4), 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 font-mono text-xs">
      <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-[#05080F]">
        <div className="text-muted">Account A</div>
        <div className={`font-bold transition-colors ${step === 1 || step === 2 ? "text-red-400" : "text-text"}`}>
          ${step === 1 || step === 2 ? "900" : "1000"}
        </div>
      </div>
      <div className="flex justify-center text-[var(--engine)]">
        {step === 0 && <span>IDLE</span>}
        {step === 1 && <span>BEGIN; UPDATE A...</span>}
        {step === 2 && <span className="text-red-400">ERROR ON B!</span>}
        {step === 3 && <span className="text-yellow-400">ROLLBACK;</span>}
      </div>
      <div className="flex justify-between items-center p-3 rounded-lg border border-border bg-[#05080F]">
        <div className="text-muted">Account B</div>
        <div className="font-bold text-text">$500</div>
      </div>
    </div>
  );
}

function VisualExtensions() {
  const exts = [
    { id: "pgvector", desc: "Vector similarity search for AI" },
    { id: "postgis", desc: "Geospatial data and queries" },
    { id: "pg_trgm", desc: "Fuzzy string matching" },
    { id: "pg_cron", desc: "Run scheduled jobs in DB" }
  ];
  const [active, setActive] = useState("pgvector");

  return (
    <div className="w-full flex flex-col gap-2">
      {exts.map(ext => (
        <button 
          key={ext.id}
          onClick={() => setActive(ext.id)}
          className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1 ${active === ext.id ? "bg-[var(--engine)]/10 border-[var(--engine)]" : "bg-[#05080F] border-border hover:border-text"}`}
        >
          <div className={`font-bold font-mono text-sm ${active === ext.id ? "text-[var(--engine)]" : "text-text"}`}>{ext.id}</div>
          <div className="text-xs text-muted">{ext.desc}</div>
        </button>
      ))}
    </div>
  );
}

function VisualPooling() {
  return (
    <div className="w-full h-64 min-h-[260px] flex items-center justify-between px-4">
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-8 h-6 bg-surface border border-border rounded flex items-center justify-center text-[8px] text-muted">APP</div>
        ))}
      </div>
      
      <div className="flex-1 relative h-full">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.path 
              key={i}
              d={`M 0 ${40 + i*30} C 50 ${40 + i*30}, 50 150, 100 150`}
              stroke="var(--engine)" strokeWidth="1" strokeOpacity="0.3" fill="none"
            />
          ))}
          {/* Animated connection dots */}
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.circle 
              key={`dot-${i}`}
              r="3" fill="var(--engine)"
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              style={{ offsetPath: `path("M 0 ${40 + (i%8)*30} C 50 ${40 + (i%8)*30}, 50 150, 100 150")` } as any}
            />
          ))}
        </svg>
      </div>
      
      <div className="w-24 bg-[#05080F] border border-[var(--engine)]/50 p-4 rounded-lg flex flex-col items-center shadow-[0_0_15px_rgba(76,141,255,0.1)] z-10">
        <div className="text-[10px] font-bold text-[var(--engine)] mb-2">PgBouncer</div>
        <div className="flex gap-2">
           <div className="w-2 h-8 bg-[var(--engine)] rounded-full" />
           <div className="w-2 h-8 bg-[var(--engine)] rounded-full" />
        </div>
      </div>
    </div>
  );
}

function VisualPitR() {
  const [val, setVal] = useState(50);
  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="bg-[#05080F] px-4 py-2 rounded font-mono text-[var(--engine)] text-sm mb-6 border border-border">
        Restore to: {val > 90 ? "Now" : `Sep ${Math.floor(val/4) + 1} 14:00`}
      </div>
      <input 
        type="range" min="0" max="100" 
        value={val} onChange={e => setVal(Number(e.target.value))}
        className="w-full accent-[var(--engine)]"
      />
      <div className="w-full flex justify-between text-xs text-muted mt-2 font-mono">
        <span>7 days ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

const FEATURE_VISUALS = [
  <VisualAcid key="1" />,
  <VisualExtensions key="2" />,
  <VisualPooling key="3" />,
  <VisualPitR key="4" />
];

// --- PAGE COMPONENT ---
export default function PostgreSQLPage() {
  return (
    <ProductPageTemplate 
      content={postgresqlContent}
      HeroBackground={PostgresHeroBackground}
      Playground={PostgresPlayground}
      FeatureVisuals={FEATURE_VISUALS}
    />
  );
}
