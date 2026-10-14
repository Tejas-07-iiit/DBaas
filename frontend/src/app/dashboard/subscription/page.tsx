/**
 * @file src/app/dashboard/subscription/page.tsx
 * @description Subscription, billing, and plan tier management.
 * Displays active plan details, renewal timeline, plan comparison matrix,
 * checkout flow handling, and cancellation confirmation dialog.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSubscription, listPlans, cancelSubscription, checkoutPlan } from "@/lib/api/subscription";
import { mapSubscription } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import { Check, CreditCard, Sparkles, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";

export default function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pollingStatus, setPollingStatus] = useState<'none' | 'success' | 'cancelled' | 'cancelling' | 'timeout'>('none');
  const [pollStart, setPollStart] = useState(0);

  const checkoutParam = searchParams.get('checkout');
  useEffect(() => {
    if (checkoutParam === 'success') {
       setPollingStatus('success');
       setPollStart(Date.now());
       router.replace('/dashboard/subscription');
    } else if (checkoutParam === 'cancelled') {
       setPollingStatus('cancelled');
       setTimeout(() => setPollingStatus('none'), 5000);
       router.replace('/dashboard/subscription');
    }
  }, [checkoutParam, router]);
  const queryClient = useQueryClient();

  const subQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res: any = await getSubscription();
      return mapSubscription(res.data || res);
    },
    retry: false
  });

  useEffect(() => {
    let interval: any;
    if (pollingStatus === 'success' || pollingStatus === 'cancelling') {
       interval = setInterval(async () => {
          if (Date.now() - pollStart > 60000) {
             setPollingStatus('timeout');
             clearInterval(interval);
             return;
          }
          const newData = await subQuery.refetch();
          if (pollingStatus === 'cancelling' && newData.data?.status !== 'active') {
             setPollingStatus('none');
             toast.info("Cancellation processed successfully");
             clearInterval(interval);
          } else if (pollingStatus === 'success' && newData.data?.planName !== subQuery.data?.planName) {
             setPollingStatus('none');
             toast.success("Plan updated successfully");
             clearInterval(interval);
          }
       }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingStatus, pollStart, subQuery]);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res: any = await listPlans();
      return res.data || res || [];
    }
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      toast.success("Subscription cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to cancel subscription");
    }
  });

  const checkoutMut = useMutation({
    mutationFn: (planId: string) => checkoutPlan(planId),
    onSuccess: (res: any) => {
      const checkoutUrl = res.checkoutUrl || res.data?.checkoutUrl;
      if (checkoutUrl) {
        if (checkoutUrl.startsWith('http')) window.location.assign(checkoutUrl);
        else router.push(checkoutUrl);
      } else {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        toast.success("Plan updated successfully");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Checkout failed");
    }
  });

  const plan = subQuery.data;
  const noPlan = !plan || Object.keys(plan).length === 0;

  if (pollingStatus === 'success' || pollingStatus === 'cancelling') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
         <Loader2 size={32} className="animate-spin text-accent" />
         <h2 className="text-lg font-bold text-text">
           {pollingStatus === 'success' ? "Confirming plan change..." : "Processing cancellation request..."}
         </h2>
         <p className="text-muted text-xs max-w-sm">Please wait while our billing webhook synchronizes your account quotas.</p>
      </div>
    );
  }
  if (pollingStatus === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
         <h2 className="text-lg font-bold text-text">Payment Still Synchronizing</h2>
         <p className="text-muted text-xs max-w-sm">Your new subscription plan will update momentarily.</p>
         <button onClick={() => setPollingStatus('none')} className="px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs">
           Refresh Status
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div className="pb-2 border-b border-border/30">
        <h1 className="text-2xl font-bold tracking-tight text-text">Subscription & Billing</h1>
        <p className="text-muted text-xs mt-1">Manage database platform tiers, compute capacity, and payment methods</p>
      </div>

      {pollingStatus === 'cancelled' && (
        <div className="p-4 border border-border/60 bg-surface/50 rounded-xl text-xs text-muted">
          Checkout was cancelled. No changes have been made to your active tier.
        </div>
      )}

      {/* CURRENT PLAN */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Active Tier</h2>
        
        {subQuery.isLoading && <div className="h-40 bg-surface-2/40 rounded-xl animate-pulse"></div>}
        {subQuery.error && <ErrorState error={subQuery.error} onRetry={subQuery.refetch} />}
        
        {!subQuery.isLoading && !subQuery.error && (
          noPlan ? (
            <EmptyState 
              title="No active paid plan" 
              description="Your account is currently running on the Free Sandbox tier. Upgrade to unlock dedicated compute, higher storage quotas, and production SLAs."
              action={
                <button 
                  onClick={() => document.getElementById('plans')?.scrollIntoView({behavior: 'smooth'})} 
                  className="px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs hover:opacity-90"
                >
                  Explore Production Plans
                </button>
              } 
            />
          ) : (
            <div className="bg-surface/50 border border-border/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start gap-8 shadow-sm">
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-text">{plan.planName}</h3>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      plan.status === 'cancelling' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted font-mono">
                    {plan.status === 'cancelling' 
                      ? `Access ends on ${new Date(plan.renewalDate).toLocaleDateString()}` 
                      : `Automatic renewal on ${new Date(plan.renewalDate).toLocaleDateString()}`}
                  </p>
                </div>
                
                {plan.limits && Object.keys(plan.limits).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30 text-xs">
                    {Object.entries(plan.limits).map(([k, v]) => (
                      <div key={k} className="p-3 bg-surface-2/40 rounded-lg border border-border/40">
                        <span className="text-[11px] text-muted capitalize block mb-0.5">{k}</span>
                        <span className="font-mono font-bold text-sm text-text">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2.5 min-w-[180px] w-full md:w-auto">
                <button 
                  onClick={() => document.getElementById('plans')?.scrollIntoView({behavior: 'smooth'})} 
                  className="w-full px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  Switch Tier
                </button>
                {plan.status !== 'cancelling' && (
                  <button 
                    onClick={() => setCancelOpen(true)} 
                    className="w-full px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg font-medium text-xs transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* PLANS COMPARISON GRID */}
      <div id="plans" className="space-y-4 pt-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Available Platform Tiers</h2>
          <p className="text-xs text-muted mt-0.5">Scale hardware resources transparently across all database instances</p>
        </div>

        {plansQuery.isLoading && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-80 bg-surface-2/40 rounded-xl animate-pulse"></div>
            <div className="h-80 bg-surface-2/40 rounded-xl animate-pulse"></div>
            <div className="h-80 bg-surface-2/40 rounded-xl animate-pulse"></div>
          </div>
        )}

        {plansQuery.error && <ErrorState error={plansQuery.error} onRetry={plansQuery.refetch} />}

        {!plansQuery.isLoading && !plansQuery.error && (
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plansQuery.data.map((p: any) => {
              const isCurrent = plan?.planName === p.name && plan?.status !== 'cancelling';
              return (
                <div 
                  key={p.id} 
                  className={`bg-surface/50 border rounded-xl p-6 flex flex-col justify-between transition-all ${
                    isCurrent 
                      ? 'border-accent shadow-md shadow-accent/5 ring-1 ring-accent/30' 
                      : 'border-border/60 hover:border-accent/40'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-text">{p.name}</h3>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{p.description}</p>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 text-[10px] font-bold tracking-wider uppercase rounded shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="py-2 border-y border-border/30">
                      <span className="text-3xl font-extrabold tracking-tight text-text">${p.price}</span>
                      <span className="text-muted text-xs font-mono ml-1">/{p.interval}</span>
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
                      onClick={() => checkoutMut.mutate(p.id)}
                      disabled={isCurrent || checkoutMut.isPending}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-all disabled:opacity-40 ${
                        isCurrent 
                          ? 'bg-surface-2 text-muted cursor-default' 
                          : 'bg-accent text-bg hover:opacity-90 shadow-sm'
                      }`}
                    >
                      {checkoutMut.isPending && checkoutMut.variables === p.id 
                        ? "Processing..." 
                        : isCurrent 
                        ? "Current Plan" 
                        : `Switch to ${p.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={cancelOpen} 
        onClose={() => setCancelOpen(false)} 
        title="Cancel Active Subscription?" 
        message="Your subscription will remain active until the end of the current billing cycle. After that, database instances will be suspended." 
        confirmText="Cancel Subscription" 
        danger={true} 
        isLoading={cancelMut.isPending} 
        onConfirm={() => cancelMut.mutate()} 
      />
    </div>
  );
}
