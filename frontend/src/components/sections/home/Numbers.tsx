"use client";
import { homeData } from "@/data/home";
import { useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";

import { animate } from "motion/react";

function Counter({ value, suffix, label, index }: { value: number, suffix: string, label: string, index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setCount(value);
      return;
    }

    const controls = animate(0, value, {
      duration: 2.4,
      delay: index * 0.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(v),
      onComplete: () => setCount(value),
    });

    return () => controls.stop();
  }, [inView, value, index]);

  let displayCount = count.toString();
  if (value === 2.8) displayCount = count.toFixed(1);
  else if (value === 99.99) displayCount = count.toFixed(2);
  else displayCount = Math.round(count).toString();

  return (
    <div ref={ref} className="text-center py-6">
      <div className="text-5xl lg:text-6xl font-bold font-serif text-text mb-3">
        {displayCount}{suffix}
      </div>
      <div className="text-sm text-muted font-mono tracking-wide">
        {label} <span className="text-xs opacity-50"></span>
      </div>
    </div>
  );
}

export default function Numbers() {
  return (
    <section className="py-16 border-b border-border bg-surface-2/20 relative">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12">
          {homeData.numbers.map((n, i) => (
            <div key={i} className="relative group">
              <Counter value={n.value} suffix={n.suffix} label={n.label.replace(' ', '')} index={i} />
              {/* Vertical hairline divider for all but the last item in a row */}
              <div className="absolute right-0 top-[10%] h-[80%] w-px bg-border hidden md:block" style={{ display: i === 3 ? 'none' : '' }} />
              <div className="absolute right-0 top-[10%] h-[80%] w-px bg-border block md:hidden" style={{ display: i % 2 === 1 ? 'none' : '' }} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
