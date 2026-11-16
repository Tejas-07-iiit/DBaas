/**
 * @file src/app/dashboard/subscription/page.tsx
 * @description Complete Razorpay Subscription Billing & Plan Management.
 * Features:
 * - Active tier details, renewal date, and cancellation status
 * - Resource quota meters vs real-time consumption
 * - Monthly vs Yearly billing toggle (with ~17% annual discount)
 * - Hosted Razorpay Modal Checkout integration
 * - Server-side cryptographic signature verification
 * - Project OWNER RBAC enforcement
 * - Paginated payment transaction history
 * - Offline Demo Mode sandbox compatibility
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  getSubscription,
  listPlans,
  cancelSubscription,
  checkoutPlan,
  verifyPayment,
  getPaymentHistory,
} from "@/lib/api/subscription";
import { listProjects } from "@/lib/api/projects";
import { mapSubscription, mapProject } from "@/lib/api/mappers";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import {
  Check,
  CreditCard,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Calendar,
  Layers,
  Cpu,
  Database,
  HardDrive,
  Receipt,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  FolderGit2,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  // Load user projects to resolve active project ID
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await listProjects();
      return (res.data || res || []).map(mapProject);
    },
  });

  const projects = projectsQuery.data || [];
  const projectParam = searchParams.get("projectId");
  const activeProjectId = useMemo(() => {
    if (projectParam && projects.some((p: any) => p.id === projectParam)) {
      return projectParam;
    }
    return projects[0]?.id || "";
  }, [projectParam, projects]);

  const activeProject = useMemo(() => {
    return projects.find((p: any) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Load subscription for active project
  const subQuery = useQuery({
    queryKey: ["subscription", activeProjectId],
    queryFn: async () => {
      const res: any = await getSubscription(activeProjectId || undefined);
      return mapSubscription(res.data || res);
    },
    enabled: !!activeProjectId || projectsQuery.isSuccess,
  });

  // Load available plans catalog
  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res: any = await listPlans();
      return res.data || res || [];
    },
  });

  // Load payment history
  const paymentsQuery = useQuery({
    queryKey: ["payments", activeProjectId, historyPage],
    queryFn: async () => {
      if (!activeProjectId) return { data: [], pagination: { total: 0 } };
      return getPaymentHistory(activeProjectId, historyPage, 5);
    },
    enabled: !!activeProjectId && (subQuery.data?.isOwner ?? true),
  });

  // Check URL params for checkout callback messages
  useEffect(() => {
    const checkoutParam = searchParams.get("checkout");
    if (checkoutParam === "success") {
      toast.success("Subscription upgraded successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      router.replace(
        activeProjectId
          ? `/dashboard/subscription?projectId=${activeProjectId}`
          : "/dashboard/subscription"
      );
    }
  }, [searchParams, router, activeProjectId, queryClient]);

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: (payload: {
      projectId: string;
      razorpayPaymentId: string;
      razorpaySubscriptionId: string;
      razorpaySignature: string;
    }) => verifyPayment(payload),
    onSuccess: () => {
      toast.success("Payment verified! Subscription activated.");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setIsCheckoutLoading(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Payment verification failed. Please contact support.");
      setIsCheckoutLoading(null);
    },
  });

  // Cancellation Mutation
  const cancelMut = useMutation({
    mutationFn: () => cancelSubscription(activeProjectId),
    onSuccess: (res: any) => {
      toast.info(res.message || "Subscription marked for cancellation at period end");
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to cancel subscription");
      setCancelOpen(false);
    },
  });

  // Checkout Handler
  const handleCheckout = async (plan: any) => {
    if (!activeProjectId) {
      toast.error("Please select a project first");
      return;
    }

    if (!subQuery.data?.isOwner) {
      toast.error("Only Project Owners have permission to manage billing and subscriptions");
      return;
    }

    // Handle Demo Mode Sandbox
    if (isDemoEnabled()) {
      router.push(`/dashboard/subscription/checkout-demo?plan=${encodeURIComponent(plan.id)}`);
      return;
    }

    setIsCheckoutLoading(plan.id);

    try {
      const res: any = await checkoutPlan(activeProjectId, plan.id);

      // If switching to Free tier or payments are disabled, immediate completion
      if (res.isFree || res.paymentEnabled === false || !paymentEnabled) {
        toast.success(res.message || `Switched to ${plan.name}`);
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        setIsCheckoutLoading(null);
        return;
      }

      // Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay payment gateway. Please check your network connection.");
        setIsCheckoutLoading(null);
        return;
      }

      const options = {
        key: res.keyId,
        subscription_id: res.subscriptionId,
        name: "M-DBaaS Platform",
        description: `${res.planName} (${selectedInterval})`,
        handler: async function (response: any) {
          try {
            await verifyMutation.mutateAsync({
              projectId: activeProjectId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            // Handled in onError of verifyMutation
          }
        },
        prefill: {
          name: res.customerName || "",
          email: res.customerEmail || "",
        },
        theme: {
          color: "#0D966B", // Emerald brand color
        },
        modal: {
          ondismiss: function () {
            setIsCheckoutLoading(null);
            toast.info("Checkout was cancelled. No changes have been made.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setIsCheckoutLoading(null);
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate subscription checkout");
      setIsCheckoutLoading(null);
    }
  };

  const plan = subQuery.data;
  const isOwner = plan?.isOwner ?? true;
  const plansData = plansQuery.data;
  const allPlans = Array.isArray(plansData) ? plansData : (plansData?.data || []);
  const paymentEnabled = plan?.paymentEnabled !== false && plansData?.paymentEnabled !== false;

  // Filter plans according to selected interval (monthly vs yearly)
  const filteredPlans = useMemo(() => {
    return allPlans.filter((p: any) => p.interval === selectedInterval);
  }, [allPlans, selectedInterval]);

  return (
    <div className="max-w-6xl space-y-8 pb-12">
      {/* HEADER & PROJECT SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Subscription & Billing</h1>
          <p className="text-muted text-xs mt-1">
            Manage project compute capacity, Razorpay subscriptions, and transaction history
          </p>
        </div>

        {projects.length > 1 && (
          <div className="flex items-center gap-2 bg-surface/70 border border-border/70 rounded-xl px-3 py-1.5 text-xs">
            <FolderGit2 size={14} className="text-accent" />
            <span className="text-muted">Project:</span>
            <select
              value={activeProjectId}
              onChange={(e) => {
                router.push(`/dashboard/subscription?projectId=${e.target.value}`);
              }}
              className="bg-transparent text-text font-medium outline-none cursor-pointer"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-surface text-text">
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FREE ACCESS MODE NOTICE WHEN PAYMENTS ARE DISABLED */}
      {!paymentEnabled && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400">
          <Sparkles size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <span className="font-bold block mb-0.5">Free Access Mode (Payments Disabled)</span>
            Payment requirements are currently disabled on this platform. You can activate and test all tiers (Free, Team, or Enterprise) instantly with zero payment or credit card required.
          </div>
        </div>
      )}

      {/* RBAC PERMISSION NOTICE FOR NON-OWNERS */}
      {!isOwner && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-400">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Read-Only Billing Access</span>
            You are currently viewing billing details as a team member. Only the{" "}
            <strong>Project Owner</strong> can upgrade, downgrade, or cancel this project&apos;s subscription.
          </div>
        </div>
      )}

      {/* ACTIVE TIER & RESOURCE USAGE */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Current Project Plan</h2>

        {subQuery.isLoading && (
          <div className="h-48 bg-surface-2/40 rounded-2xl animate-pulse" />
        )}
        {subQuery.error && (
          <ErrorState error={subQuery.error} onRetry={subQuery.refetch} />
        )}

        {!subQuery.isLoading && !subQuery.error && plan && (
          <div className="bg-surface/70 border border-border/70 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/30">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-text">{plan.planName}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      plan.status === "past_due"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : plan.cancelAtPeriodEnd
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {plan.cancelAtPeriodEnd ? "Cancelling at period end" : plan.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-mono mt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-accent" />
                    {plan.cancelAtPeriodEnd
                      ? `Access ends on: ${new Date(plan.renewalDate).toLocaleDateString()}`
                      : `Next renewal: ${new Date(plan.renewalDate).toLocaleDateString()}`}
                  </span>
                  <span>•</span>
                  <span>Billing Interval: {plan.interval}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() =>
                      document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="flex-1 md:flex-none px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-xs transition-colors shadow-sm"
                  >
                    Change Tier
                  </button>
                  {plan.tier !== "FREE" && !plan.cancelAtPeriodEnd && (
                    <button
                      onClick={() => setCancelOpen(true)}
                      className="flex-1 md:flex-none px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl font-medium text-xs transition-colors"
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RESOURCE METERS (CURRENT CONSUMPTION VS QUOTA) */}
            <div>
              <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">
                Allocated Hardware Resources & Quotas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Databases */}
                <div className="p-4 bg-surface-2/60 rounded-xl border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <Database size={13} className="text-accent" /> Database Instances
                    </span>
                    <span className="font-mono font-bold text-text">
                      {plan.usage?.databaseCount || 0} / {plan.limits?.maxDatabases || 2}
                    </span>
                  </div>
                  <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((plan.usage?.databaseCount || 0) / (plan.limits?.maxDatabases || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* vCPU */}
                <div className="p-4 bg-surface-2/60 rounded-xl border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <Cpu size={13} className="text-accent" /> Total vCPU Cores
                    </span>
                    <span className="font-mono font-bold text-text">
                      {plan.usage?.cpuUsed || 0} / {plan.limits?.maxCpuCores || 4} Cores
                    </span>
                  </div>
                  <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((plan.usage?.cpuUsed || 0) / (plan.limits?.maxCpuCores || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="p-4 bg-surface-2/60 rounded-xl border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <Layers size={13} className="text-accent" /> Memory (RAM)
                    </span>
                    <span className="font-mono font-bold text-text">
                      {((plan.usage?.ramUsedMb || 0) / 1024).toFixed(1)} /{" "}
                      {((plan.limits?.maxRamMb || 4096) / 1024).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((plan.usage?.ramUsedMb || 0) / (plan.limits?.maxRamMb || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Storage */}
                <div className="p-4 bg-surface-2/60 rounded-xl border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <HardDrive size={13} className="text-accent" /> Disk Storage
                    </span>
                    <span className="font-mono font-bold text-text">
                      {((plan.usage?.storageUsedMb || 0) / 1024).toFixed(1)} /{" "}
                      {((plan.limits?.maxStorageMb || 20480) / 1024).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((plan.usage?.storageUsedMb || 0) / (plan.limits?.maxStorageMb || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PLANS CATALOG SECTION */}
      <div id="plans" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text">
              Platform Subscription Tiers
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Select an infrastructure plan powered by official Razorpay recurring billing
            </p>
          </div>

          {/* MONTHLY / YEARLY TOGGLE */}
          <div className="inline-flex items-center p-1 bg-surface-2/80 border border-border/80 rounded-xl">
            <button
              onClick={() => setSelectedInterval("monthly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedInterval === "monthly"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setSelectedInterval("yearly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedInterval === "yearly"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Save ~17%
              </span>
            </button>
          </div>
        </div>

        {plansQuery.isLoading && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-96 bg-surface-2/40 rounded-2xl animate-pulse" />
            <div className="h-96 bg-surface-2/40 rounded-2xl animate-pulse" />
            <div className="h-96 bg-surface-2/40 rounded-2xl animate-pulse" />
          </div>
        )}

        {plansQuery.error && (
          <ErrorState error={plansQuery.error} onRetry={plansQuery.refetch} />
        )}

        {!plansQuery.isLoading && !plansQuery.error && (
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {filteredPlans.map((p: any) => {
              const isCurrent =
                plan?.planName === p.name &&
                !plan?.cancelAtPeriodEnd &&
                plan?.status === "active";
              const isPending = isCheckoutLoading === p.id || verifyMutation.isPending;

              return (
                <div
                  key={p.id}
                  className={`bg-surface/70 border rounded-2xl p-6 flex flex-col justify-between transition-all shadow-sm ${
                    isCurrent
                      ? "border-accent shadow-[0_0_24px_rgba(16,185,129,0.12)] ring-1 ring-accent/30"
                      : "border-border/70 hover:border-accent/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-text">{p.name}</h3>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{p.description}</p>
                      </div>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 bg-accent/10 text-accent border border-accent/30 text-[10px] font-bold tracking-wider uppercase rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="py-3 border-y border-border/30">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-extrabold tracking-tight text-text">
                          ₹{Number(p.price).toLocaleString("en-IN")}
                        </span>
                        <span className="text-muted text-xs font-mono ml-1.5">
                          /{p.interval}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted block mt-0.5">
                        {!paymentEnabled
                          ? "Free access (Payment disabled)"
                          : p.amount === 0
                          ? "No credit card required"
                          : "Recurring Razorpay subscription"}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {p.features?.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 text-text">
                          <Check size={14} className="text-accent shrink-0" strokeWidth={2.5} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/30">
                    <button
                      onClick={() => handleCheckout(p)}
                      disabled={isCurrent || isPending || !isOwner}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                        isCurrent
                          ? "bg-surface-2 text-muted cursor-default"
                          : "bg-primary hover:bg-primary-hover text-white shadow-sm font-medium"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{!paymentEnabled ? "Activating plan..." : "Processing with Razorpay..."}</span>
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : !isOwner ? (
                        "Owner Permission Required"
                      ) : !paymentEnabled ? (
                        `Activate ${p.name}`
                      ) : p.amount === 0 ? (
                        "Switch to Free Tier"
                      ) : (
                        `Upgrade to ${p.name}`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAYMENT TRANSACTION HISTORY TABLE */}
      {isOwner && (
        <div className="space-y-4 pt-6 border-t border-border/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-2">
                <Receipt size={14} className="text-accent" /> Project Payment History
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Verified Razorpay recurring payment receipts and transaction records
              </p>
            </div>
          </div>

          {paymentsQuery.isLoading && (
            <div className="h-32 bg-surface-2/40 rounded-2xl animate-pulse" />
          )}

          {!paymentsQuery.isLoading && paymentsQuery.data?.data?.length === 0 && (
            <div className="p-8 border border-border/60 bg-surface/40 rounded-2xl text-center text-xs text-muted">
              No payment transactions recorded for this project yet.
            </div>
          )}

          {!paymentsQuery.isLoading && paymentsQuery.data?.data?.length > 0 && (
            <div className="overflow-x-auto bg-surface/70 border border-border/70 rounded-2xl shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/60 border-b border-border/40 text-[11px] font-semibold text-muted uppercase">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paymentsQuery.data.data.map((pmt: any) => (
                    <tr key={pmt.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3 text-muted">
                        {new Date(pmt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-text">
                        {pmt.paymentId}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-text">
                        {pmt.amountFormatted}
                      </td>
                      <td className="px-4 py-3 text-muted capitalize">
                        {pmt.method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            pmt.status === "captured"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}
                        >
                          {pmt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {paymentsQuery.data?.pagination?.totalPages > 1 && (
            <div className="flex justify-end gap-2 text-xs">
              <button
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-muted disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-mono text-muted">
                Page {historyPage} of {paymentsQuery.data.pagination.totalPages}
              </span>
              <button
                disabled={historyPage >= paymentsQuery.data.pagination.totalPages}
                onClick={() => setHistoryPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* CANCELLATION CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Active Subscription?"
        message="Your subscription will remain active until the end of the current billing cycle. After that, your project will revert to the Free Sandbox tier. Existing database instances will NOT be deleted or destroyed."
        confirmText="Confirm Cancellation"
        danger={true}
        isLoading={cancelMut.isPending}
        onConfirm={() => cancelMut.mutate()}
      />
    </div>
  );
}
