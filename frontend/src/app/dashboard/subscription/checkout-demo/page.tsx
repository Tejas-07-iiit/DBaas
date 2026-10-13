/**
 * @file src/app/dashboard/subscription/checkout-demo/page.tsx
 * @description Simulated Stripe checkout flow for Demo Mode.
 * Emulates the payment confirmation and automatically updates mock subscription state in localStorage.
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { updateDemoData, getDemoData } from "@/lib/demo/db";
import { useEffect, useState } from "react";

export default function CheckoutDemo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan');
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    if (!isDemoEnabled()) {
      router.replace('/dashboard/subscription');
      return;
    }
    const db = getDemoData();
    const found = db.plans.find((p: any) => p.id === planId);
    if (found) setPlan(found);
  }, [planId, router]);

  const confirm = () => {
    if (!plan) return;
    const db = getDemoData();
    const now = new Date();
    db.subscription = {
      planName: plan.name,
      status: 'active',
      renewalDate: new Date(now.getTime() + 30 * 86400000).toISOString(),
      limits: plan.limits
    };
    updateDemoData(db);
    router.push('/dashboard/subscription');
  };

  if (!plan) return <div className="p-8 text-center text-muted">Loading plan...</div>;

  return (
    <div className="max-w-md mx-auto mt-12 animate-in fade-in duration-500">
      <div className="bg-surface/30 border border-border/50 p-8 rounded-xl text-center">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">D</div>
        <h1 className="text-2xl font-bold mb-2">Demo checkout</h1>
        <p className="text-muted mb-8">No payment is taken. This is a local simulation.</p>

        <div className="bg-surface-2 rounded p-4 mb-8 text-left">
          <div className="text-sm text-muted uppercase tracking-widest font-mono mb-2">Selected Plan</div>
          <div className="text-xl font-bold">{plan.name}</div>
          <div className="text-accent">${plan.price} / {plan.interval}</div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={confirm} className="w-full px-4 py-3 bg-text text-bg rounded font-bold hover:opacity-90 transition-opacity">Confirm plan change</button>
          <button onClick={() => router.back()} className="w-full px-4 py-3 border border-border/50 rounded font-bold hover:bg-surface-2 transition-colors">Go back</button>
        </div>
      </div>
    </div>
  );
}
