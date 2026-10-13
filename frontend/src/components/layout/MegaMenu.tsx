"use client";
// MegaMenu.tsx
// The big "Product" dropdown showing cards for each database
// with small animated previews and platform links below.

import { motion } from "motion/react";
import Link from "next/link";
import { productDatabases, productPlatformLinks } from "@/data/navigation";
import { useState, useEffect } from "react";

// ── MongoDB preview: lines of JSON code with a blinking cursor ─
function MongoPreview() {
  const lines = [
    '{ "_id": "user_001",',
    '  "name": "Priya",',
    '  "plan": "pro" }',
  ];
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", lineHeight: 1.7 }}>
      {lines.map((l, i) => (
        <div key={i}>
          <span style={{ color: "#3FCF6D", opacity: 0.5, marginRight: 4 }}>›</span>
          {l}
          {/* blinking cursor only on last line */}
          {i === lines.length - 1 && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{ display: "inline-block", width: 6, height: 11, background: "#3FCF6D", marginLeft: 2, verticalAlign: "middle", borderRadius: 1 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── PostgreSQL preview: a 3-row table that highlights rows one by one ─
function PostgresPreview() {
  const [active, setActive] = useState(0);
  const rows = [["Alice", "Pro", "✓"], ["Bob", "Free", "✓"], ["Carol", "Pro", "✓"]];

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % rows.length), 900);
    return () => clearInterval(id);
  }, [rows.length]);

  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 8px", padding: "2px 4px", color: "var(--muted)", borderBottom: "1px solid var(--border)", marginBottom: 2 }}>
        <span>name</span><span>plan</span><span>active</span>
      </div>
      {rows.map((row, i) => (
        <motion.div
          key={i}
          animate={{ backgroundColor: active === i ? "rgba(76,141,255,0.12)" : "rgba(76,141,255,0)" }}
          transition={{ duration: 0.3 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 8px", padding: "3px 4px", borderRadius: 4, color: active === i ? "#4C8DFF" : "var(--muted)" }}
        >
          {row.map((cell, j) => <span key={j}>{cell}</span>)}
        </motion.div>
      ))}
    </div>
  );
}

// ── Qdrant preview: dots where one connects to its nearest neighbours ─
function QdrantPreview() {
  // Fixed dot positions [x%, y%]
  const dots = [[50,50],[20,25],[75,20],[80,70],[25,75],[55,15]];
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => (p + 1) % dots.length), 700);
    return () => clearInterval(id);
  }, [dots.length]);

  const w = 130, h = 70;
  return (
    <svg width={w} height={h} aria-hidden="true">
      {/* Lines from active dot to 2 nearest */}
      {dots.map((d, i) => {
        if (i === pulse || i === (pulse+1)%dots.length || i === (pulse+2)%dots.length) return null;
        const px = dots[pulse][0]/100*w, py = dots[pulse][1]/100*h;
        const dx = d[0]/100*w, dy = d[1]/100*h;
        const dist = Math.hypot(px-dx, py-dy);
        if (dist > 55) return null;
        return <line key={i} x1={px} y1={py} x2={dx} y2={dy} stroke="#FF4D8D" strokeOpacity={0.35} strokeWidth={1} />;
      })}
      {/* All dots */}
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d[0]/100*w} cy={d[1]/100*h} r={i === pulse ? 5 : 3}
          fill={i === pulse ? "#FF4D8D" : "rgba(255,77,141,0.45)"}
          animate={{ r: i === pulse ? [4, 6, 4] : 3 }}
          transition={{ repeat: Infinity, duration: 0.7 }}
        />
      ))}
    </svg>
  );
}

// Preview map — which component to render for each database
const previews: Record<string, React.ReactNode> = {
  mongodb:  <MongoPreview />,
  postgres: <PostgresPreview />,
  qdrant:   <QdrantPreview />,
};

export default function MegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl w-full h-full"
      role="menu"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      {/* Label */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "0.8rem" }}>
        {'// DATABASES'}
      </p>

      {/* Three database cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        {productDatabases.map(db => (
          <Link
            key={db.id}
            href={db.href}
            onClick={onClose}
            role="menuitem"
            style={{ display: "block", textDecoration: "none" }}
          >
            <motion.div
              whileHover={{ borderColor: db.color, backgroundColor: "var(--surface-2)" }}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "0.8rem",
                background: "transparent",
                transition: "border-color 0.2s, background 0.2s",
                cursor: "pointer",
                height: "100%",
              }}
            >
              {/* DB name tag */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: db.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{db.name}</span>
              </div>
              {/* Tagline */}
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: "0.6rem", lineHeight: 1.4 }}>{db.tagline}</p>
              {/* Mini preview */}
              <div style={{
                background: "var(--bg)",
                borderRadius: 8,
                padding: "0.5rem",
                border: "1px solid var(--border)",
                minHeight: 70,
                display: "flex",
                alignItems: "center",
              }}>
                {previews[db.id]}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Platform links below the cards */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
          {'// PLATFORM'}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {productPlatformLinks.map(link => (
            <Link key={link.label} href={link.href} onClick={onClose} role="menuitem">
              <motion.span
                whileHover={{ color: "var(--accent)", borderColor: "var(--accent)" }}
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--muted)",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {link.label}
              </motion.span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
