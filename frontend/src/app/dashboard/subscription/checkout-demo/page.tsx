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
import { CreditCard, ArrowLeft, ShieldCheck } from "lucide-react";

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

  if (!plan) return <div className="p-8 text-center text-muted text-xs">Loading plan details...</div>;

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-surface/50 border border-amber-500/40 p-8 rounded-xl text-center space-y-6 shadow-xl">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto">
          <CreditCard size={22} />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-text">Demo Mode Sandbox Checkout</h1>
          <p className="text-xs text-muted mt-1">Simulated payment workflow. No credit card or real payment required.</p>
        </div>

        <div className="bg-surface-2/60 border border-border/60 rounded-xl p-4 text-left space-y-2">
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Selected Tier</div>
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-bold text-text">{plan.name}</span>
            <span className="text-sm font-bold text-accent">${plan.price} <span className="text-xs text-muted font-normal">/{plan.interval}</span></span>
          </div>
          <p className="text-xs text-muted leading-relaxed pt-1 border-t border-border/30">
            {plan.description}
          </p>
        </div>

        <div className="space-y-2.5">
          <button 
            onClick={confirm} 
            className="w-full py-2.5 px-4 bg-accent text-bg rounded-lg font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Confirm Plan Upgrade (Demo)
          </button>
          <button 
            onClick={() => router.back()} 
            className="w-full py-2 px-4 border border-border/60 text-muted hover:text-text rounded-lg font-medium text-xs hover:bg-surface-2 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Cancel and Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
