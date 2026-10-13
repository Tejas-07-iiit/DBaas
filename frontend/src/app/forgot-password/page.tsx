"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { GuestOnly } from "@/lib/auth/GuestOnly";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/errors";
import { authApi } from "@/lib/api/auth";

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  useEffect(() => {
    let int: any;
    if (cooldown > 0) {
      int = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(int);
  }, [cooldown]);

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    setGlobalError("");
    try {
      await authApi.forgotPassword(data);
      setSuccess(true);
      setCooldown(30);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const email = getValues("email");
    if (!email) return;
    await onSubmit({ email });
  };

  return (
    <GuestOnly>
      <AuthShell title="Reset your password" type="reset">
        {globalError && (
          <div aria-live="polite" className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {globalError}
          </div>
        )}

        {success ? (
          <div className="flex flex-col gap-6 text-center">
            <div className="p-6 rounded-lg bg-surface-2 border border-border">
              <h3 className="font-bold text-lg mb-2 text-[#3FCF6D]">Check your inbox</h3>
              <p className="text-muted text-sm leading-relaxed">
                If an account exists for that email, a reset link is on its way.
              </p>
            </div>
            
            <div className="text-sm text-muted">
              Didn't receive it?{" "}
              <button 
                onClick={handleResend} 
                disabled={cooldown > 0} 
                className="text-accent hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-text">Email</label>
              <input 
                {...register("email")}
                type="email"
                autoComplete="email"
                className={`w-full bg-surface border rounded-lg px-4 py-3 h-12 text-text outline-none transition-colors ${errors.email ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
              />
              {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
            </div>

            <Button type="submit" className="w-full h-12 mt-2" disabled={loading}>
              {loading ? <span className="animate-pulse">Sending...</span> : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">Return to log in</Link>
        </div>
      </AuthShell>
    </GuestOnly>
  );
}
