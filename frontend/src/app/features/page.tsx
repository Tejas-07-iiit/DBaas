"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { featuresData } from "@/data/features";
import { Check, Search, Server, Shield, Activity, Terminal, Globe2, Users, Database, ShieldCheck, MapPin, Loader2 } from "lucide-react";

// --- HERO BACKGROUND ---
function ChecklistBackground() {
  const [ticks, setTicks] = useState<number[]>([]);
  useEffect(() => {
    let tick = 0;
    const int = setInterval(() => {
      setTicks(prev => {
        if (prev.length >= 20) return [];
        return [...prev, tick++];
      });
    }, 400);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10 flex items-center justify-center mask-image:linear-gradient(to_bottom,black,transparent)">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6 w-full max-w-5xl">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border ${ticks.includes(i) ? "bg-accent border-accent" : "border-border"} flex items-center justify-center transition-colors duration-300`}>
              {ticks.includes(i) && <Check size={12} className="text-bg" />}
            </div>
            <div className="w-32 h-2 bg-border/50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- DEMO 1: BACKUPS ---
function DemoBackups() {
  const [dragX, setDragX] = useState(50);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRestore = () => {
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = dayMap[Math.floor((dragX / 100) * 6.99)];
  const hour = Math.floor((dragX / 100) * 23).toString().padStart(2, "0");

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 justify-between gap-6 border-border/50 shadow-inner">
      <div className="text-center font-mono text-sm text-accent mb-2">
        Restore to: {day} {hour}:32
      </div>
      <div className="relative h-16 flex items-center justify-center px-4">
        <div className="absolute w-full h-2 bg-surface rounded-full border border-border" />
        <input 
          type="range" min="0" max="100" 
          value={dragX} onChange={e => setDragX(Number(e.target.value))}
          disabled={restoring || success}
          className="absolute w-full opacity-0 cursor-pointer h-full z-10"
        />
        <div 
          className="absolute h-8 w-4 bg-accent rounded shadow-[0_0_10px_var(--accent)] transition-all pointer-events-none"
          style={{ left: `calc(${dragX}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted font-mono px-2">
        <span>7 days ago</span>
        <span>Now</span>
      </div>
      <Button 
        onClick={handleRestore} 
        disabled={restoring || success}
        className="w-full mt-auto bg-text text-bg hover:bg-muted"
      >
        {restoring ? <><Loader2 size={16} className="animate-spin" /> Restoring...</> : success ? <><Check size={16} className="text-green-500" /> Restored successfully</> : "Restore cluster"}
      </Button>
    </Card>
  );
}

// --- DEMO 2: AUTOSCALING ---
function DemoAutoscaling() {
  const [traffic, setTraffic] = useState(20);
  const replicas = traffic < 40 ? 2 : traffic < 75 ? 4 : 8;
  const cpu = traffic < 40 ? traffic * 1.5 : traffic < 75 ? traffic * 0.8 : traffic * 0.5;

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 border-border/50 shadow-inner">
      <div className="flex justify-between items-center mb-6 font-mono text-sm">
        <span className="text-muted uppercase">Traffic</span>
        <span className="text-accent">{traffic}k req/s</span>
      </div>
      <input 
        type="range" min="0" max="100" 
        value={traffic} onChange={e => setTraffic(Number(e.target.value))}
        className="w-full accent-accent mb-8"
      />
      <div className="flex-1 flex items-end gap-2 border-b border-border/50 pb-2 mb-6 h-32">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div 
            key={i}
            animate={{ height: i < replicas ? 40 + ((i * 17) % 20) + (traffic/2) : 10 }}
            className={`flex-1 rounded-t-sm transition-colors duration-500 ${i < replicas ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center bg-[#05080F] p-4 rounded-xl border border-border">
        <div className="flex flex-col">
          <span className="text-xs text-muted uppercase tracking-wider">Replicas</span>
          <span className="text-xl font-bold text-text">{replicas} Nodes</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs text-muted uppercase tracking-wider">Avg CPU</span>
          <span className={`text-xl font-bold ${cpu > 80 ? "text-red-400" : "text-green-400"}`}>{cpu.toFixed(0)}%</span>
        </div>
      </div>
    </Card>
  );
}

// --- DEMO 3: MONITORING ---
function DemoMonitoring() {
  const [engine, setEngine] = useState("PostgreSQL");
  const [points, setPoints] = useState([30, 40, 45, 50, 40, 35, 50, 60, 55, 65, 70, 75, 60, 50, 40]);
  
  useEffect(() => {
    const id = setInterval(() => {
      // Deterministic math instead of Math.random
      setPoints(p => [...p.slice(1), Math.max(20, Math.min(80, p[p.length-1] + (((Date.now() % 100) / 100) - 0.5) * 20))]);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const d = `M ${points.map((p, i) => `${(i / (points.length - 1)) * 100} ${100 - p}`).join(" L ")}`;

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 border-border/50 shadow-inner gap-4">
      <div className="flex gap-2 p-1 bg-[#05080F] rounded-lg border border-border w-fit text-xs mb-2">
        {["MongoDB", "PostgreSQL", "Qdrant"].map(e => (
          <button 
            key={e} onClick={() => setEngine(e)}
            className={`px-3 py-1.5 rounded-md transition-colors ${engine === e ? "bg-surface border border-border text-accent" : "text-muted hover:text-text"}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-[120px] bg-[#05080F] border border-border rounded-xl relative overflow-hidden flex items-end">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-70 absolute inset-0">
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={`${d} L 100 100 L 0 100 Z`} fill="var(--accent)" fillOpacity="0.1" />
        </svg>
        <div className="absolute top-4 left-4 text-xs font-mono">QPS: {(points[points.length-1] * 12).toFixed(0)}</div>
        <div className="absolute top-4 right-4 text-xs font-mono text-muted">p95: {(points[points.length-1] * 0.1).toFixed(1)}ms</div>
      </div>
      <div className="bg-[#05080F] border border-border p-3 rounded-xl">
        <div className="text-xs text-muted mb-2 uppercase tracking-widest">Slow Queries</div>
        <div className="font-mono text-xs text-text truncate opacity-80">{engine === "MongoDB" ? 'db.users.find({ status: "active" })' : engine === "PostgreSQL" ? 'SELECT * FROM users JOIN orders...' : 'client.search(collection="docs"...'} <span className="text-red-400 float-right">402ms</span></div>
      </div>
    </Card>
  );
}

// --- DEMO 4: SECURITY ---
function DemoSecurity() {
  const [toggles, setToggles] = useState([true, false, false, true]);
  const score = 40 + toggles.filter(Boolean).length * 15;
  const [ip, setIp] = useState("");
  const [ips, setIps] = useState(["192.168.1.1/32"]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (ip && !ips.includes(ip)) {
      setIps([...ips, ip]);
      setIp("");
    }
  };

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 border-border/50 shadow-inner">
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border/50">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <path className="text-border" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <motion.path 
              className={score === 100 ? "text-green-500" : "text-accent"} strokeWidth="3" strokeDasharray={`${score}, 100`} stroke="currentColor" fill="none" 
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              animate={{ strokeDasharray: `${score}, 100` }} transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute text-xl font-bold font-mono">{score}</div>
        </div>
        <div className="flex-1 space-y-3">
          {["Encryption at rest", "TLS only", "IP allowlist", "SSO required"].map((label, i) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-muted">{label}</span>
              <button 
                onClick={() => setToggles(t => { const nt = [...t]; nt[i] = !nt[i]; return nt; })}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${toggles[i] ? "bg-accent" : "bg-border"}`}
              >
                <motion.div className="w-3 h-3 bg-white rounded-full shadow" animate={{ x: toggles[i] ? 16 : 0 }} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted mb-2 font-mono">IP ALLOWLIST</div>
        <div className="flex flex-wrap gap-2 mb-3">
          <AnimatePresence>
            {ips.map(ip => (
              <motion.div key={ip} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#05080F] border border-border px-2 py-1 rounded text-xs font-mono flex items-center gap-2 text-text">
                {ip}
                <button onClick={() => setIps(ips.filter(i => i !== ip))} className="text-muted hover:text-red-400">&times;</button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input value={ip} onChange={e => setIp(e.target.value)} placeholder="0.0.0.0/0" className="flex-1 bg-[#05080F] border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent font-mono" />
          <Button type="submit" className="py-1.5 px-3 h-auto bg-surface border border-border text-text hover:bg-surface-2 text-sm">Add</Button>
        </form>
      </div>
    </Card>
  );
}

// --- DEMO 5: CLI & API ---
function DemoCli() {
  const [cmdIdx, setCmdIdx] = useState(0);
  const cmds = ["dbaas create db-prod --engine=postgres", "dbaas config set allowed-ips=10.0.0.0/8", "dbaas logs tail db-prod"];
  const resps = [
    `{\n  "id": "db_9x",\n  "status": "provisioning"\n}`,
    `{\n  "updated": true,\n  "ips": ["10.0.0.0/8"]\n}`,
    `{\n  "stream": "connected",\n  "events": []\n}`
  ];

  useEffect(() => {
    const int = setInterval(() => setCmdIdx(i => (i + 1) % 3), 3000);
    return () => clearInterval(int);
  }, []);

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden bg-surface-2/50 border-border/50 shadow-inner">
      <div className="flex-1 flex flex-col">
        <div className="bg-[#05080F] p-4 flex-1 border-b border-border/50 font-mono text-sm flex flex-col justify-center">
          <div className="text-muted mb-2">$ {cmds[cmdIdx]}</div>
          <div className="text-accent flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Processing...</div>
        </div>
        <div className="bg-surface-2 p-4 flex-1 font-mono text-xs flex flex-col justify-center">
          <div className="text-muted mb-2 uppercase tracking-widest text-[10px]">Equivalent REST API</div>
          <div className="text-[#3FCF6D] whitespace-pre">{resps[cmdIdx]}</div>
        </div>
      </div>
    </Card>
  );
}

// --- DEMO 6: REGIONS ---
function DemoRegions() {
  const [active, setActive] = useState(0);
  const regions = [
    { name: "Virginia", x: 25, y: 35, lat: "12ms" },
    { name: "Frankfurt", x: 50, y: 30, lat: "85ms" },
    { name: "Mumbai", x: 68, y: 48, lat: "140ms" },
    { name: "Singapore", x: 78, y: 55, lat: "190ms" }
  ];

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 border-border/50 shadow-inner relative overflow-hidden">
      <div className="text-center font-bold mb-6 relative z-10">Select a region</div>
      <div className="flex-1 relative w-full rounded-xl bg-[#05080F] border border-border flex items-center justify-center min-h-[250px]">
        {/* Fake World Map SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20 pointer-events-none absolute inset-0">
          <path d="M 20 40 Q 30 20 40 40 T 60 30 T 80 50" stroke="var(--text)" strokeWidth="0.5" fill="none" />
        </svg>
        
        {/* Your App Dot */}
        <div className="absolute w-2 h-2 bg-text rounded-full" style={{ left: '20%', top: '40%' }}>
          <div className="absolute -top-5 -left-4 text-[10px] whitespace-nowrap font-mono text-muted">Your App</div>
        </div>

        {/* Region Dots */}
        {regions.map((r, i) => (
          <button 
            key={r.name}
            onClick={() => setActive(i)}
            className="absolute flex items-center justify-center group"
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          >
            <div className={`w-3 h-3 rounded-full transition-colors ${active === i ? "bg-accent shadow-[0_0_10px_var(--accent)]" : "bg-border hover:bg-muted"}`} />
            <div className={`absolute top-4 whitespace-nowrap text-[10px] font-mono px-2 py-1 rounded border bg-[#05080F] transition-opacity ${active === i ? "opacity-100 border-accent text-accent z-20" : "opacity-0 border-border text-muted z-10"}`}>
              {r.name} - {r.lat}
            </div>
          </button>
        ))}

        {/* Connection Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.line 
            x1="20%" y1="40%" x2={`${regions[active].x}%`} y2={`${regions[active].y}%`}
            stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
            key={active}
          />
        </svg>
      </div>
    </Card>
  );
}

// --- DEMO 7: TEAMS ---
function DemoTeams() {
  const [members, setMembers] = useState([{ email: "alice@company.com", role: "Owner" }, { email: "bob@company.com", role: "Admin" }]);
  const [invite, setInvite] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (invite) {
      setMembers([...members, { email: invite, role: "Developer" }]);
      setInvite("");
    }
  };

  return (
    <Card className="h-full flex flex-col p-6 bg-surface-2/50 border-border/50 shadow-inner justify-between gap-6">
      <div className="space-y-2">
        <AnimatePresence>
          {members.map(m => (
            <motion.div key={m.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center bg-[#05080F] p-3 rounded-lg border border-border text-sm">
              <span className="text-text truncate pr-4">{m.email}</span>
              <select className="bg-surface border border-border rounded p-1 text-xs text-muted outline-none focus:border-accent font-mono" defaultValue={m.role}>
                <option>Owner</option>
                <option>Admin</option>
                <option>Developer</option>
                <option>Read-only</option>
              </select>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <form onSubmit={handleInvite} className="flex gap-2 mt-auto">
        <input type="email" value={invite} onChange={e => setInvite(e.target.value)} placeholder="Email address" className="flex-1 bg-[#05080F] border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent" required />
        <Button type="submit" className="py-2 px-4 h-auto bg-text text-bg hover:bg-muted text-sm shrink-0">Invite</Button>
      </form>
    </Card>
  );
}


const DEMOS = [
  <DemoBackups key="backups" />,
  <DemoAutoscaling key="autoscaling" />,
  <DemoMonitoring key="monitoring" />,
  <DemoSecurity key="security" />,
  <DemoCli key="cli" />,
  <DemoRegions key="regions" />,
  <DemoTeams key="teams" />
];


// --- MAIN PAGE COMPONENT ---
export default function FeaturesPage() {

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as any } }
  };

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(featuresData.sections[0].id);

  const filteredSections = featuresData.sections.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  // Scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      const offsets = filteredSections.map(s => {
        const el = document.getElementById(s.id);
        return { id: s.id, offset: el ? el.getBoundingClientRect().top : 9999 };
      });
      const visible = offsets.filter(o => o.offset > 0 && o.offset < window.innerHeight / 2);
      if (visible.length > 0) setActiveId(visible[0].id);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredSections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // VS Doing it yourself
  const [dbCount, setDbCount] = useState(3);
  const selfHours = dbCount * featuresData.vsSelfHosted.hoursPerDb;
  const selfCost = dbCount * featuresData.vsSelfHosted.hoursPerDb * featuresData.vsSelfHosted.costPerHour;
  const dbaasHours = dbCount * featuresData.vsSelfHosted.dbaasHoursPerDb;
  const dbaasCost = featuresData.vsSelfHosted.baseCost + (dbCount * featuresData.vsSelfHosted.dbaasHoursPerDb * featuresData.vsSelfHosted.dbaasCostPerHour);

  return (
    <div className="bg-bg min-h-screen">
      {/* HERO */}
      <Section className="min-h-[60vh] flex flex-col justify-center items-center relative overflow-hidden pt-32 pb-16">
        <ChecklistBackground />
        <Container className="relative z-10 text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
          <motion.div variants={fadeIn} className="text-sm font-mono text-accent mb-6">{featuresData.hero.label}</motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {featuresData.hero.h1Part1}
            <span className="text-accent font-serif italic font-normal block md:inline mt-2 md:mt-0">{featuresData.hero.h1Highlight}</span>
          </motion.h1>
          <motion.p variants={fadeIn} className="text-xl text-muted mb-12 max-w-2xl mx-auto">{featuresData.hero.subtext}</motion.p>
          
          <motion.div variants={fadeIn} className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              type="text"
              placeholder={featuresData.hero.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-full py-4 pl-12 pr-6 text-text outline-none focus:border-accent transition-colors shadow-2xl"
            />
          </motion.div>
          </motion.div>
        </Container>
      </Section>

      {/* STICKY NAV + SECTIONS */}
      <Section className="py-12 lg:py-24 bg-surface/30">
        <Container>
          <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr] gap-12 lg:gap-16 relative items-start">
            
            {/* Nav (Desktop Sticky / Mobile Horizontal) */}
            <div className="lg:sticky lg:top-32 w-full overflow-x-auto lg:overflow-visible flex lg:flex-col gap-2 pb-4 lg:pb-0 hide-scrollbar z-20">
              {filteredSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`relative px-4 py-2 text-sm font-medium text-left whitespace-nowrap transition-colors rounded-lg lg:rounded-none lg:border-l-2 ${activeId === s.id ? "text-accent lg:border-transparent bg-surface-2 lg:bg-transparent" : "text-muted lg:border-border hover:text-text hover:bg-surface-2/50 lg:hover:bg-transparent"}`}
                >
                  {activeId === s.id && (
                    <motion.div 
                      layoutId="activeMarker" 
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent hidden lg:block" 
                    />
                  )}
                  {s.title}
                </button>
              ))}
            </div>

            {/* Sections Content */}
            <div className="flex-1 space-y-32">
              <AnimatePresence>
                {filteredSections.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted py-24">
                    No features matched your search.
                  </motion.div>
                )}
                {filteredSections.map((s, idx) => {
                  const originalIdx = featuresData.sections.findIndex(x => x.id === s.id);
                  return (
                    <motion.div 
                      key={s.id} id={s.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                      <div className="order-2 lg:order-1 h-full min-h-[300px]">
                        {DEMOS[originalIdx]}
                      </div>
                      <div className="order-1 lg:order-2">
                        <div className="text-sm font-mono text-accent mb-4">// {s.number}</div>
                        <h2 className="text-3xl font-bold mb-6">{s.title}</h2>
                        <p className="text-lg text-muted mb-8">{s.description}</p>
                        <ul className="space-y-4">
                          {s.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-3 text-text text-sm">
                              <Check size={16} className="text-accent mt-0.5 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </Section>

      {/* VS DOING IT YOURSELF */}
      <Section className="py-24">
        <Container>
          <SectionHeader title={featuresData.vsSelfHosted.title} subtitle={featuresData.vsSelfHosted.description} className="text-center mb-16" />
          
          <Card className="max-w-4xl mx-auto p-8 lg:p-12 bg-[#05080F] border-border/50">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="text-sm font-bold">Databases: {dbCount}</div>
                <input 
                  type="range" min="1" max="10" 
                  value={dbCount} onChange={e => setDbCount(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="text-xs text-muted mt-8 italic">Illustrative estimate based on typical mid-sized infrastructure requirements.</div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-8 border-l-0 md:border-l border-border/50 pl-0 md:pl-12">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-mono">
                    <span className="text-muted">{featuresData.vsSelfHosted.labels.self}</span>
                    <span className="text-red-400 font-bold">{selfHours} hrs / ${selfCost.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-surface rounded-full overflow-hidden w-full">
                    <motion.div 
                      className="h-full bg-red-400/80 rounded-full"
                      animate={{ width: `${Math.min((selfCost / 20000) * 100, 100)}%` }}
                      transition={{ type: "spring", damping: 20 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 font-mono">
                    <span className="text-muted">{featuresData.vsSelfHosted.labels.dbaas} (Us)</span>
                    <span className="text-accent font-bold">{dbaasHours} hrs / ${dbaasCost.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-surface rounded-full overflow-hidden w-full">
                    <motion.div 
                      className="h-full bg-accent rounded-full"
                      animate={{ width: `${Math.min((dbaasCost / 20000) * 100, 100)}%` }}
                      transition={{ type: "spring", damping: 20 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* WORKS WITH YOUR STACK */}
      <Section className="py-24 bg-surface/30">
        <Container>
          <SectionHeader title={featuresData.stack.title} subtitle={featuresData.stack.description} className="text-center mb-16" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {featuresData.stack.items.map(item => (
              <div key={item.name} className="group bg-bg border border-border p-4 rounded-xl hover:border-accent hover:bg-surface-2 transition-all cursor-default">
                <div className="text-xs font-mono text-muted mb-2">{item.category}</div>
                <div className="font-bold text-text mb-2">{item.name}</div>
                <div className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto">{item.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CLOSING STRIP */}
      <Section className="py-24 border-t border-border bg-bg text-center">
        <Container>
          <h2 className="text-3xl font-bold mb-8">{featuresData.closing.title}</h2>
          <Link href="/signup">
            <Button size="lg">{featuresData.closing.cta}</Button>
          </Link>
        </Container>
      </Section>

    </div>
  );
}
