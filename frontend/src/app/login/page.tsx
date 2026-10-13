"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/validation/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { GuestOnly } from "@/lib/auth/GuestOnly";
import { getSafeRedirect } from "@/lib/auth/safeRedirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/errors";
import { useRouter, useSearchParams } from "next/navigation";
// DEMO MODE
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegistered = searchParams.get('registered') === '1';
  const isReset = searchParams.get('reset') === '1';
  const next = searchParams.get('next');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setGlobalError("");
    try {
      await login(data);
      const next = searchParams.get('next');
      router.replace(getSafeRedirect(next, '/dashboard'));
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

  return (
    <GuestOnly>
      <AuthShell title="Log in" type="login">
        
        {isRegistered && (
          <div className="mb-6 p-4 rounded-lg bg-[#3FCF6D]/10 border border-[#3FCF6D]/30 text-[#3FCF6D] text-sm">
            Account created successfully. Please log in.
          </div>
        )}
        {isReset && (
          <div className="mb-6 p-4 rounded-lg bg-[#3FCF6D]/10 border border-[#3FCF6D]/30 text-[#3FCF6D] text-sm">
            Password reset successful. Please log in with your new password.
          </div>
        )}
        {globalError && (
          <div aria-live="polite" className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {globalError}
          </div>
        )}

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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-text">Password</label>
              <Link href="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</Link>
            </div>
            <PasswordInput 
              {...register("password")}
              autoComplete="current-password"
              error={errors.password}
            />
            {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
          </div>

          <Button type="submit" className="w-full h-12 mt-2" disabled={loading}>
            {loading ? <span className="animate-pulse">Logging in...</span> : "Log in"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted">
          New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-accent hover:underline">Create an account</Link>
        </div>

        {/* DEMO MODE */}
        {isDemoEnabled() && (
          <div className="mt-8 p-4 border border-dashed border-amber-500/30 rounded-xl bg-surface/30 relative">
            <div className="absolute -top-2.5 left-4 px-2 bg-bg text-[10px] font-bold tracking-widest uppercase text-amber-500 border border-amber-500/30 rounded">Demo</div>
            <p className="text-sm text-muted mb-4 mt-2">Demo mode (local only)</p>
            <div className="flex flex-col gap-2 font-mono text-xs mb-4">
              <div className="flex justify-between items-center bg-surface-2 p-2 rounded">
                <span className="text-text">{process.env.NEXT_PUBLIC_DEMO_EMAIL}</span>
                <button type="button" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_DEMO_EMAIL!)} className="text-accent hover:underline">Copy</button>
              </div>
              <div className="flex justify-between items-center bg-surface-2 p-2 rounded">
                <span className="text-text">{process.env.NEXT_PUBLIC_DEMO_PASSWORD}</span>
                <button type="button" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_DEMO_PASSWORD!)} className="text-accent hover:underline">Copy</button>
              </div>
            </div>
            <Button 
              type="button" 
              className="w-full text-xs h-8 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30"
              onClick={() => {
                setValue("email", process.env.NEXT_PUBLIC_DEMO_EMAIL!);
                setValue("password", process.env.NEXT_PUBLIC_DEMO_PASSWORD!);
              }}
            >
              Fill demo login
            </Button>
          </div>
        )}
      </AuthShell>
    </GuestOnly>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 border-4 border-surface border-t-accent rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
