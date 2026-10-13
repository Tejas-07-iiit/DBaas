"use client";
import { homeData } from "@/data/home";
import { motion } from "motion/react";
import { useState } from "react";

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="container-site py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold">Built for scale</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[240px]">
        {homeData.features.map((f, i) => (
          <div
            key={i}
            className={`relative p-6 rounded-2xl bg-surface-2 border border-border overflow-hidden group ${i === 0 ? "md:col-span-2" : i === 3 ? "lg:col-span-2" : ""}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative z-10 h-full flex flex-col justify-end">
               <h3 className="text-xl font-bold mb-2">{f.title}</h3>
               <p className="text-muted text-sm">{f.description}</p>
            </div>
            
            {/* Interactive placeholders */}
            <div className="absolute top-0 right-0 w-full h-full p-6 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
              {i === 0 && <div className="w-1/2 h-2 bg-border mt-4 rounded"><div className="w-2/3 h-full bg-accent rounded" /></div>}
              {i === 2 && <div className="text-xs font-mono text-accent">CPU: 42%<br/>RAM: 2.1GB</div>}
            </div>

            {/* Spotlight border effect simulated */}
            {hoveredIndex === i && (
              <motion.div layoutId="spotlight" className="absolute inset-0 border-2 border-accent rounded-2xl z-0 pointer-events-none" transition={{ duration: 0.2 }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
