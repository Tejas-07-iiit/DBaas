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
import { Check } from "lucide-react";

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
             alert("Cancellation requested");
             clearInterval(interval);
          } else if (pollingStatus === 'success' && newData.data?.planName !== subQuery.data?.planName) {
             setPollingStatus('none');
             alert("Plan updated successfully");
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
      // Assume the plans return directly as array or in data
      return res.data || res || [];
    }
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      alert("Subscription cancelled.");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
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
        alert("Plan changed.");
      }
    }
  });

  const plan = subQuery.data;
  const noPlan = !plan || Object.keys(plan).length === 0;

  if (pollingStatus === 'success' || pollingStatus === 'cancelling') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
         <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
         <h2 className="text-xl font-bold">{pollingStatus === 'success' ? "Confirming your payment..." : "Cancellation requested..."}</h2>
         <p className="text-muted mt-2">Please wait while we update your subscription.</p>
      </div>
    );
  }
  if (pollingStatus === 'timeout') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
         <h2 className="text-xl font-bold">Still processing</h2>
         <p className="text-muted mt-2 mb-6">Your plan will update here shortly.</p>
         <button onClick={() => setPollingStatus('none')} className="px-4 py-2 bg-text text-bg rounded font-bold">Check again</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold mb-8">Subscription</h1>
         {pollingStatus === 'cancelled' && <div className="mb-6 p-4 border border-border/50 bg-surface/30 rounded text-muted">Checkout cancelled, no changes made.</div>}

      {/* CURRENT PLAN */}
      <h2 className="text-lg font-bold mb-4">Current plan</h2>
      {subQuery.isLoading && <div className="animate-pulse bg-surface-2 h-32 rounded-xl mb-8"></div>}
      {subQuery.error && <ErrorState error={subQuery.error} onRetry={subQuery.refetch} />}
      {!subQuery.isLoading && !subQuery.error && (
        noPlan ? (
          <EmptyState title="No active plan" action={<button onClick={() => document.getElementById('plans')?.scrollIntoView({behavior: 'smooth'})} className="px-4 py-2 bg-text text-bg rounded mt-4">View plans</button>} />
        ) : (
          <div className="bg-surface/30 border border-border/50 rounded-xl p-6 mb-12 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{plan.planName}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${plan.status === 'cancelling' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-[#3FCF6D]/10 text-[#3FCF6D] border border-[#3FCF6D]/30'}`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-muted mb-6">
                {plan.status === 'cancelling' ? `Ends on ${new Date(plan.renewalDate).toLocaleDateString()}` : `Renews on ${new Date(plan.renewalDate).toLocaleDateString()}`}
              </p>
              
              {plan.limits && Object.keys(plan.limits).length > 0 && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {Object.entries(plan.limits).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 border-b border-border/50 pb-1">
                      <span className="text-muted capitalize">{k}</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <button onClick={() => document.getElementById('plans')?.scrollIntoView({behavior: 'smooth'})} className="w-full px-4 py-2 bg-text text-bg rounded font-bold text-sm hover:opacity-90 transition-opacity">Change plan</button>
              {plan.status !== 'cancelling' && (
                <button onClick={() => setCancelOpen(true)} className="w-full px-4 py-2 border border-red-500/30 text-red-400 rounded font-bold text-sm hover:bg-red-500/10 transition-colors">Cancel subscription</button>
              )}
            </div>
          </div>
        )
      )}

      {/* PLANS GRID */}
      <h2 id="plans" className="text-lg font-bold mb-4 pt-4">Available plans</h2>
      {plansQuery.isLoading && <div className="grid md:grid-cols-3 gap-6"><div className="animate-pulse bg-surface-2 h-64 rounded-xl"></div></div>}
      {plansQuery.error && <ErrorState error={plansQuery.error} onRetry={plansQuery.refetch} />}
      {!plansQuery.isLoading && !plansQuery.error && (
        <div className="grid md:grid-cols-3 gap-6">
          {plansQuery.data.map((p: any) => {
            const isCurrent = plan?.planName === p.name && plan?.status !== 'cancelling';
            return (
              <div key={p.id} className={`bg-surface/30 border rounded-xl p-6 flex flex-col ${isCurrent ? 'border-accent' : 'border-border/50 hover:border-accent/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {isCurrent && <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 text-[10px] font-bold tracking-widest uppercase rounded">Current plan</span>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${p.price}</span>
                  <span className="text-muted">/{p.interval}</span>
                </div>
                <p className="text-sm text-muted mb-6 flex-1">{p.description}</p>
                
                <div className="mb-6 flex flex-col gap-2">
                  {p.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text"><Check size={14} className="text-accent" /> {f}</div>
                  ))}
                </div>

                <button 
                  onClick={() => checkoutMut.mutate(p.id)}
                  disabled={isCurrent || checkoutMut.isPending}
                  className={`w-full px-4 py-2 rounded font-bold text-sm disabled:opacity-50 ${isCurrent ? 'bg-surface-2 text-muted' : 'bg-text text-bg hover:opacity-90 transition-opacity'}`}
                >
                  {checkoutMut.isPending && checkoutMut.variables === p.id ? "Processing..." : isCurrent ? "Current plan" : `Switch to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog 
        isOpen={cancelOpen} 
        onClose={() => setCancelOpen(false)} 
        title="Cancel subscription"
        message="Your subscription will remain active until the end of the current billing period. After that, your databases will be stopped."
        confirmText="Cancel subscription"
        danger={true}
        onConfirm={() => cancelMut.mutate()}
      />
    </div>
  );
}
