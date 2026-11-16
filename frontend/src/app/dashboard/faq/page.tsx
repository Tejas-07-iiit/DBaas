/**
 * @file src/app/dashboard/faq/page.tsx
 * @description In-console Frequently Asked Questions (FAQ) guide for M-DBaaS.
 * Provides instant answers on billing, compute resources, database migrations, security, and SLAs.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, ChevronDown, Search, ArrowRight, ExternalLink, 
  CreditCard, ShieldCheck, Database, Server, LifeBuoy
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category: "Billing" | "Architecture" | "Databases" | "Security";
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Billing",
    q: "How does M-DBaaS pricing and billing work?",
    a: "Billing is subscription and capacity-based. Each tier includes guaranteed vCPU cores, dedicated RAM buffers, and persistent NVMe disk storage. If you require additional capacity, you can upgrade your plan at any time under Billing & Plans with immediate resource allocation.",
  },
  {
    category: "Billing",
    q: "Can I cancel or downgrade my subscription at any time?",
    a: "Yes. You can switch plans or cancel your active subscription under 'Billing & Plans'. When you cancel, your current cluster access remains active until the end of your billing cycle.",
  },
  {
    category: "Architecture",
    q: "How are project workspaces isolated?",
    a: "Each project workspace provisions a dedicated KVM host virtual machine with hardware-assisted virtualization. This ensures strict tenant isolation, dedicated kernel memory, and private virtual bridge networking (virbr0) across all database clusters.",
  },
  {
    category: "Architecture",
    q: "Can I run multiple database engines in the same project?",
    a: "Yes. Within each dedicated project VM, you can run multiple PostgreSQL, MongoDB, and Qdrant clusters concurrently, sharing the project's allocated compute and storage quotas.",
  },
  {
    category: "Databases",
    q: "What database engines and versions are supported?",
    a: "M-DBaaS natively supports PostgreSQL (v16+), MongoDB (v7+), and Qdrant vector database (v1.8+). All clusters include automated configuration tuning, connection pooling, and live telemetry.",
  },
  {
    category: "Databases",
    q: "How do database backups and persistence work?",
    a: "All database instances utilize persistent host NVMe block storage with write-ahead logging (WAL) and automated snapshotting. Data persists across instance stops, restarts, and host reboots.",
  },
  {
    category: "Security",
    q: "Is network traffic and data encrypted?",
    a: "Yes. All database connections support TLS 1.3 encryption in transit. Host virtual disks are encrypted at rest with AES-256. Database passwords and credentials can be rotated on-demand with zero downtime.",
  },
  {
    category: "Security",
    q: "How does Role-Based Access Control (RBAC) work?",
    a: "Each project supports granular roles: Owner (full admin & deletion), Admin (database provisioning & member invites), and Member (read-only inspection of telemetry and connection strings).",
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const categories = ["All", "Billing", "Architecture", "Databases", "Security"];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* HEADER */}
      <div className="pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-primary-light">
            <HelpCircle size={17} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Comprehensive guidance on platform architecture, compute provisioning, and billing.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-elevated border border-border/70 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-primary-light transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary-subtle text-primary-light font-semibold border border-primary-light/30 shadow-xs"
                  : "bg-surface hover:bg-surface-elevated text-foreground-muted hover:text-foreground border border-border/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ACCORDION FAQ ITEMS */}
      <div className="space-y-2.5 pt-1">
        {filteredFaqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={faq.q}
              className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "border-primary-light/40 bg-surface/90 shadow-sm"
                  : "border-border/70 bg-surface/60 hover:bg-surface-elevated/80"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3 pr-4">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-elevated text-foreground-muted border border-border/50 shrink-0">
                    {faq.category}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-foreground">
                    {faq.q}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-foreground-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary-light" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-foreground-muted leading-relaxed border-t border-border/30 mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-foreground-muted text-xs bg-surface/40 border border-border/50 rounded-2xl">
            No questions matched &quot;{search}&quot;. Try a different keyword or reach out to Support.
          </div>
        )}
      </div>

      {/* STILL HAVE QUESTIONS STRIP */}
      <div className="p-6 bg-surface/70 border border-border/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mt-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LifeBuoy size={16} className="text-primary-light" />
            <h3 className="font-bold text-sm text-foreground">
              Still have questions?
            </h3>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Our engineering support team is available 24/7 to assist with database migrations, architecture, or custom quotas.
          </p>
        </div>
        <Link
          href="/support"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <span>Contact Support</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
