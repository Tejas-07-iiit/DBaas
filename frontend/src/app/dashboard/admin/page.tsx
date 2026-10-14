/**
 * @file src/app/dashboard/admin/page.tsx
 * @description Platform Administrator master overview.
 * Guarded by AdminGuard; displays high-level status across platform users, projects, databases, and health.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { Shield, Users, FolderKanban, Database, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminOverview() {
  const sections = [
    { title: "Registered Users", icon: Users, desc: "Inspect account roster and platform roles", href: "/dashboard/admin/users" },
    { title: "Global Projects", icon: FolderKanban, desc: "Review all multi-tenant projects", href: "/dashboard/admin/projects" },
    { title: "Global Databases", icon: Database, desc: "Inspect provisioned clusters and engines", href: "/dashboard/admin/databases" },
    { title: "System Health", icon: Activity, desc: "Hypervisor, VM and API endpoint monitors", href: "/dashboard/admin/health" },
  ];

  return (
    <AdminGuard>
      <div className="max-w-5xl space-y-6">
        <div className="pb-2 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Shield size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Platform Administration</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-semibold uppercase">
              Root Console
            </span>
          </div>
          <p className="text-muted text-xs mt-1">
            Global fleet management and infrastructure telemetry across all DBaaS tenants
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.title}
                href={s.href}
                className="p-5 bg-surface/50 hover:bg-surface-2/40 border border-border/60 hover:border-amber-500/40 rounded-xl transition-all group block"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-amber-500 group-hover:border-amber-500/40 transition-colors">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={14} className="text-muted group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-semibold text-sm text-text group-hover:text-amber-500 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminGuard>
  );
}