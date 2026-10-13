"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Info, ChevronDown, CheckCircle2, XCircle } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { statusData, regions, StatusService, StatusIncident } from "@/data/status";

// --- LIVE LATENCY CHART ---
function LatencyChart({ type }: { type: string }) {
  const [points, setPoints] = useState<number[]>([20, 25, 22, 30, 28, 25, 22, 26, 35, 20]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const newPoints = [...prev.slice(1)];
        // Add random point between 15 and 40, depending on type
        const base = type === "Qdrant" ? 30 : type === "PostgreSQL" ? 15 : 20;
        newPoints.push(base + Math.random() * 10 - 5);
        return newPoints;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [type]);

  const max = Math.max(...points, 50);
  const min = 0;
  
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 100 - ((p - min) / (max - min)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(" ");

  return (
    <div className="w-24 h-8 relative flex items-center shrink-0">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
      </svg>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface border border-border px-1 py-0.5 rounded text-[9px] font-mono shadow-sm">
        {points[points.length - 1].toFixed(0)}ms
      </div>
    </div>
  );
}

// --- UPTIME BAR ---
function UptimeBar({ history }: { history: StatusService['history'] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5 h-8 w-full">
      {history.map((day, i) => {
        let color = "bg-[#3FCF6D]"; // green
        if (day.status === "degraded") color = "bg-amber-500";
        if (day.status === "down") color = "bg-red-500";

        return (
          <div 
            key={i} 
            className="flex-1 h-full relative group cursor-pointer"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <div className={`w-full h-full rounded-[1px] opacity-80 hover:opacity-100 transition-opacity ${color}`} />
            
            {/* Tooltip */}
            {hoverIdx === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#05080F] border border-border rounded-lg shadow-xl p-3 z-20 pointer-events-none">
                <div className="text-xs font-mono text-muted mb-1">{day.date}</div>
                <div className="text-sm font-bold flex items-center gap-1.5 mb-1">
                  {day.status === "up" ? <CheckCircle2 size={14} className="text-[#3FCF6D]"/> : day.status === "degraded" ? <AlertCircle size={14} className="text-amber-500"/> : <XCircle size={14} className="text-red-500"/>}
                  {day.status === "up" ? "No incidents" : day.status === "degraded" ? "Degraded performance" : "Major outage"}
                </div>
                {day.incidentTitle && (
                  <div className="text-xs text-muted border-t border-border/50 pt-1 mt-1">{day.incidentTitle}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- INCIDENT ROW ---
function IncidentRow({ incident }: { incident: StatusIncident }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="border-b border-border/50 last:border-0 py-6">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setOpen(!open)}
      >
        <div>
          <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{incident.title}</h3>
          <div className="text-sm font-mono text-muted mt-1">{incident.date}</div>
        </div>
        <ChevronDown size={20} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 pb-2 space-y-6 relative before:absolute before:inset-y-6 before:left-[11px] before:w-px before:bg-border/50 ml-2">
              {incident.events.map((event, i) => {
                let color = "bg-muted";
                if (event.status === "Investigating") color = "bg-amber-500";
                if (event.status === "Identified") color = "bg-blue-500";
                if (event.status === "Monitoring") color = "bg-teal-500";
                if (event.status === "Resolved") color = "bg-[#3FCF6D]";

                return (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute left-[7.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-bg ${color}`} />
                    <div className="text-sm font-bold mb-1 flex items-center gap-3">
                      {event.status}
                      <span className="text-xs font-mono text-muted font-normal">{event.time}</span>
                    </div>
                    <div className="text-sm text-muted leading-relaxed">{event.message}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StatusPage() {
  const [region, setRegion] = useState(regions[0]);

  const services = (statusData.services as any)[region] as StatusService[];

  return (
    <div className="bg-bg min-h-screen pt-32 pb-24">
      <Container className="max-w-4xl">
        
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">System Status</h1>
          <p className="text-muted text-sm">Real-time performance and uptime across all database clusters.</p>
        </div>

        {/* REGION SELECTOR */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-border/50 pb-4">
          {regions.map(r => (
            <button 
              key={r}
              onClick={() => setRegion(r)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${region === r ? "bg-accent/10 text-accent border border-accent/20" : "bg-surface border border-border text-muted hover:text-text"}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* SERVICES */}
        <Card className="p-0 overflow-hidden bg-surface/30 border-border/50 mb-24">
          {services.map((service, idx) => (
            <div key={service.name} className={`p-6 ${idx > 0 ? "border-t border-border/50" : ""}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <div className={`flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border ${service.status === "Operational" ? "bg-[#3FCF6D]/10 text-[#3FCF6D] border-[#3FCF6D]/20" : service.status === "Degraded" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                    {service.status === "Operational" ? <CheckCircle2 size={12}/> : service.status === "Degraded" ? <AlertCircle size={12}/> : <XCircle size={12}/>}
                    {service.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block">
                    <LatencyChart type={service.type} />
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold">{service.uptime.toFixed(2)}%</div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">90 days</div>
                  </div>
                </div>
              </div>
              
              <UptimeBar history={service.history} />
              
              <div className="flex justify-between items-center mt-2 text-xs font-mono text-muted">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          ))}
        </Card>

        {/* PAST INCIDENTS */}
        <SectionHeader title="Past Incidents" subtitle="Record of outages and degradations over the last 30 days." />
        <Card className="p-6 md:p-8 bg-surface/30 border-border/50">
          {statusData.recentIncidents.map(inc => (
            <IncidentRow key={inc.id} incident={inc as any} />
          ))}
        </Card>

      </Container>
    </div>
  );
}

// Simple internal SectionHeader specifically for this page to match styles
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      <p className="text-muted">{subtitle}</p>
    </div>
  );
}
