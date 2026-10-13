"use client";
import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function AuthShell({ 
  children, 
  title, 
  type = "login" 
}: { 
  children: React.ReactNode, 
  title: string, 
  type?: "login" | "signup" | "reset" 
}) {
  const [terminalText, setTerminalText] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    const cmd = type === "signup" ? "$ dbaas create postgres" : type === "reset" ? "$ dbaas auth reset" : "$ dbaas connect";
    let i = 0;
    setShowProgress(false);
    setShowReady(false);
    setTerminalText("");
    
    const interval = setInterval(() => {
      setTerminalText(cmd.slice(0, i));
      i++;
      if (i > cmd.length) {
        clearInterval(interval);
        setTimeout(() => setShowProgress(true), 500);
        setTimeout(() => setShowReady(true), 1500);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [type]);

  const valueProps = [
    "Zero-downtime migrations",
    "Point-in-time recovery to the second",
    "Autoscaling serverless compute"
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left Column (Form) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="absolute top-8 left-8 w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-text font-bold text-xl mb-4 group">
            <span className="text-accent group-hover:scale-110 transition-transform">{'//'}</span> DBaaS
          </Link>
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>
          
          <h1 className="text-3xl font-bold mb-8 tracking-tight">{title}</h1>
          
          {children}

          <div className="mt-12 text-center text-xs text-muted flex items-center justify-center gap-4">
            <Link href="/legal/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/legal/terms" className="hover:text-text transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Right Column (Decoration) */}
      <div className="hidden lg:flex flex-1 relative bg-[#05080F] border-l border-border/50 flex-col items-center justify-center p-12 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 50%)' }} />
        
        {/* Fake Terminal */}
        <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden mb-12 relative z-10">
          <div className="bg-surface-2 border-b border-border px-4 py-3 flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-border/80" />
            <div className="w-3 h-3 rounded-full bg-border/80" />
            <div className="w-3 h-3 rounded-full bg-border/80" />
          </div>
          <div className="p-6 font-mono text-sm text-muted h-48 flex flex-col">
            <div>
              <span className="text-accent">{terminalText}</span>
              <span className="animate-pulse bg-accent w-2 h-4 inline-block align-middle ml-1" />
            </div>
            
            {showProgress && (
              <div className="mt-6 flex flex-col gap-2">
                <div className="text-xs">Provisioning resources...</div>
                <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }} className="h-full bg-accent" />
                </div>
              </div>
            )}
            
            {showReady && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-auto text-[#3FCF6D] flex items-center gap-2">
                <Terminal size={14} /> Ready in 2.8s
              </motion.div>
            )}
          </div>
        </div>

        {/* Value props */}
        <div className="flex flex-col gap-4 relative z-10 max-w-sm w-full text-center">
          {valueProps.map((prop, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
              className="text-muted text-sm"
            >
              ✓ {prop}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
