"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "motion/react";
import { Database, Server, HardDrive, Shield } from "lucide-react";

type NodeId = "app" | "gateway" | "mongo" | "pg" | "qdrant" | "backup" | null;

export default function Architecture() {
  const [hoveredNode, setHoveredNode] = useState<NodeId>(null);
  const [showBackups, setShowBackups] = useState(false);

  // Layout points for viewBox="0 0 900 420"
  const nodes = {
    app: { x: 120, y: 210, w: 140, h: 60, label: "Your App", icon: Server, color: "var(--text)" },
    gateway: { x: 450, y: 210, r: 40, label: "DBaaS Gateway", icon: Shield, color: "var(--accent)" },
    mongo: { x: 780, y: 110, w: 140, h: 50, label: "MongoDB", color: "#3FCF6D", rLabel: "us-east-1" },
    pg: { x: 780, y: 210, w: 140, h: 50, label: "PostgreSQL", color: "#4C8DFF", rLabel: "eu-central-1" },
    qdrant: { x: 780, y: 310, w: 140, h: 50, label: "Qdrant", color: "#FF4D8D", rLabel: "ap-south-1" },
    backup: { x: 450, y: 360, w: 120, h: 40, label: "S3 Backups", color: "var(--muted)", rLabel: "global" }
  };

  // Paths
  const paths = [
    { id: "app-to-gateway", d: `M 190 210 L 410 210`, active: ["app", "gateway"], color: "var(--accent)" },
    { id: "gateway-to-mongo", d: `M 490 210 C 550 210, 600 110, 710 110`, active: ["gateway", "mongo"], color: "#3FCF6D" },
    { id: "gateway-to-pg", d: `M 490 210 L 710 210`, active: ["gateway", "pg"], color: "#4C8DFF" },
    { id: "gateway-to-qdrant", d: `M 490 210 C 550 210, 600 310, 710 310`, active: ["gateway", "qdrant"], color: "#FF4D8D" },
    { id: "pg-to-backup", d: `M 780 235 C 780 360, 650 360, 510 360`, active: ["pg", "backup"], color: "var(--muted)", isDashed: true },
    { id: "mongo-to-backup", d: `M 780 135 C 840 135, 840 380, 510 370`, active: ["mongo", "backup"], color: "var(--muted)", isDashed: true },
  ];

  const getOpacity = (activeList: NodeId[]) => {
    if (!hoveredNode) return 1;
    return activeList.includes(hoveredNode) ? 1 : 0.2;
  };

  return (
    <Section className="overflow-hidden">
      <Container>
        <div className="flex flex-col items-center text-center mb-8">
          <SectionHeader 
            label="// GLOBAL INFRASTRUCTURE" 
            title="How it connects" 
            subtitle="A resilient, multi-region architecture automatically managed for you behind a single connection pooler."
            className="mb-0"
          />
        </div>
        
        <div className="flex justify-center mb-8">
          <label className="flex items-center gap-3 cursor-pointer text-sm font-mono text-muted hover:text-text transition-colors">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showBackups} onChange={(e) => setShowBackups(e.target.checked)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showBackups ? 'bg-accent' : 'bg-surface-2 border border-border'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showBackups ? 'translate-x-4' : ''}`}></div>
            </div>
            Show continuous backups
          </label>
        </div>

        <Card className="p-6 relative overflow-hidden bg-surface-2/30 w-full flex items-center justify-center">
          <div className="w-full max-w-[1000px] overflow-hidden">
            <svg viewBox="0 0 900 420" className="w-full h-auto drop-shadow-xl" style={{ minWidth: 600 }}>
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Paths */}
              {paths.map((p, i) => {
                if (p.active.includes("backup") && !showBackups) return null;
                const opacity = getOpacity(p.active as NodeId[]);
                
                return (
                  <g key={p.id} style={{ opacity, transition: "opacity 0.3s" }}>
                    <path 
                      id={p.id} 
                      d={p.d} 
                      fill="none" 
                      stroke={p.color} 
                      strokeWidth={p.isDashed ? "2" : "3"} 
                      strokeOpacity="0.3"
                      strokeDasharray={p.isDashed ? "6 6" : "none"}
                    />
                    
                    {/* Animated Data Dots */}
                    {!p.isDashed && (
                      <>
                        <circle r="3" fill={p.color} filter="url(#glow)">
                          <animateMotion dur={`${2 + (i % 2)}s`} repeatCount="indefinite">
                            <mpath href={`#${p.id}`} />
                          </animateMotion>
                        </circle>
                        <circle r="3" fill={p.color} filter="url(#glow)">
                          <animateMotion dur={`${2 + (i % 2)}s`} repeatCount="indefinite" begin="1.5s">
                            <mpath href={`#${p.id}`} />
                          </animateMotion>
                        </circle>
                      </>
                    )}
                    {p.isDashed && showBackups && (
                      <circle r="2" fill={p.color}>
                        <animateMotion dur="4s" repeatCount="indefinite">
                          <mpath href={`#${p.id}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Your App Node */}
              <g 
                onMouseEnter={() => setHoveredNode("app")} 
                onMouseLeave={() => setHoveredNode(null)}
                style={{ opacity: getOpacity(["app"]), transition: "opacity 0.3s", cursor: "pointer" }}
              >
                <rect x={nodes.app.x - nodes.app.w/2} y={nodes.app.y - nodes.app.h/2} width={nodes.app.w} height={nodes.app.h} rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
                <text x={nodes.app.x} y={nodes.app.y + 4} fill="var(--text)" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">{nodes.app.label}</text>
              </g>

              {/* Gateway Node */}
              <g 
                onMouseEnter={() => setHoveredNode("gateway")} 
                onMouseLeave={() => setHoveredNode(null)}
                style={{ opacity: getOpacity(["gateway"]), transition: "opacity 0.3s", cursor: "pointer" }}
              >
                <circle cx={nodes.gateway.x} cy={nodes.gateway.y} r={nodes.gateway.r} fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" filter="url(#glow)" />
                <circle cx={nodes.gateway.x} cy={nodes.gateway.y} r={nodes.gateway.r + 8} fill="none" stroke="var(--accent)" strokeOpacity="0.2" strokeWidth="1" />
                <text x={nodes.gateway.x} y={nodes.gateway.y - 55} fill="var(--text)" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">DBaaS Gateway</text>
                <text x={nodes.gateway.x} y={nodes.gateway.y + 4} fill="var(--accent)" fontSize="20" fontWeight="bold" textAnchor="middle">G</text>
              </g>

              {/* Database Nodes */}
              {(["mongo", "pg", "qdrant"] as const).map(db => {
                const node = nodes[db];
                return (
                  <g 
                    key={db}
                    onMouseEnter={() => setHoveredNode(db)} 
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ opacity: getOpacity([db]), transition: "opacity 0.3s", cursor: "pointer" }}
                  >
                    <rect x={node.x - node.w/2} y={node.y - node.h/2} width={node.w} height={node.h} rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                    <circle cx={node.x - node.w/2 + 16} cy={node.y} r="4" fill={node.color} />
                    <text x={node.x - node.w/2 + 28} y={node.y + 4} fill="var(--text)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">{node.label}</text>
                    <text x={node.x + node.w/2 + 12} y={node.y + 4} fill="var(--muted)" fontSize="12" fontFamily="monospace" opacity="0.6">{node.rLabel}</text>
                  </g>
                );
              })}

              {/* Backups Node */}
              <AnimatePresence>
                {showBackups && (
                  <g 
                    onMouseEnter={() => setHoveredNode("backup")} 
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ opacity: getOpacity(["backup"]), transition: "opacity 0.3s", cursor: "pointer" }}
                  >
                    <rect x={nodes.backup.x - nodes.backup.w/2} y={nodes.backup.y - nodes.backup.h/2} width={nodes.backup.w} height={nodes.backup.h} rx="6" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={nodes.backup.x} y={nodes.backup.y + 4} fill="var(--muted)" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">{nodes.backup.label}</text>
                  </g>
                )}
              </AnimatePresence>
            </svg>
          </div>
          
          {/* Tooltip Card - Shown absolutely positioned over the container based on hover state */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-6 right-6 pointer-events-none"
              >
                <div className="bg-surface border border-border shadow-2xl rounded-xl p-4 min-w-[200px] text-sm font-mono">
                  {hoveredNode === "app" && <div><div className="text-muted mb-2 text-xs">SOURCE</div><div className="font-bold text-text">Your Application</div><div className="text-accent mt-2">Active connections: 42</div></div>}
                  {hoveredNode === "gateway" && <div><div className="text-muted mb-2 text-xs">ROUTER</div><div className="font-bold text-text">Global Connection Pooler</div><div className="text-accent mt-2">Latency: ~2ms</div></div>}
                  {hoveredNode === "mongo" && <div><div className="text-muted mb-2 text-xs">DATABASE</div><div className="font-bold text-[#3FCF6D] mb-1">MongoDB</div><div>Region: us-east-1</div><div>Status: Healthy</div></div>}
                  {hoveredNode === "pg" && <div><div className="text-muted mb-2 text-xs">DATABASE</div><div className="font-bold text-[#4C8DFF] mb-1">PostgreSQL</div><div>Region: eu-central-1</div><div>Status: Healthy</div></div>}
                  {hoveredNode === "qdrant" && <div><div className="text-muted mb-2 text-xs">DATABASE</div><div className="font-bold text-[#FF4D8D] mb-1">Qdrant</div><div>Region: ap-south-1</div><div>Status: Healthy</div></div>}
                  {hoveredNode === "backup" && <div><div className="text-muted mb-2 text-xs">STORAGE</div><div className="font-bold text-text mb-1">S3 Bucket</div><div>Retention: 7 days</div><div>State: Syncing WAL</div></div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Container>
    </Section>
  );
}
