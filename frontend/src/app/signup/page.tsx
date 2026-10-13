"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validation/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { GuestOnly } from "@/lib/auth/GuestOnly";
import { getSafeRedirect } from "@/lib/auth/safeRedirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/errors";
import { useRouter, useSearchParams } from "next/navigation";

type RegisterForm = z.infer<typeof registerSchema>;

function PasswordStrength({ password }: { password?: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length > 7) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-amber-500", "bg-[#3FCF6D]", "bg-accent"];

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex gap-1 h-1.5 w-full">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full ${i < score ? colors[Math.max(0, score - 1)] : "bg-surface-2"}`} />
        ))}
      </div>
      <div className="text-[10px] text-muted text-right uppercase tracking-wider">{score > 0 ? labels[score - 1] : ""}</div>
    </div>
  );
}

function SignupContent() {
  const { register: authRegister } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const passwordVal = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    if (!acceptedTerms) {
      setGlobalError("You must accept the Terms of Service.");
      return;
    }
    setLoading(true);
    setGlobalError("");
    try {
      await authRegister(data);
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
      <AuthShell title="Create an account" type="signup">
        {globalError && (
          <div aria-live="polite" className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text">Full Name</label>
            <input 
              {...register("name")}
              type="text"
              autoComplete="name"
              className={`w-full bg-surface border rounded-lg px-4 py-3 h-12 text-text outline-none transition-colors ${errors.name ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
            />
            {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
          </div>

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
            <label className="text-sm font-bold text-text">Password</label>
            <PasswordInput 
              {...register("password")}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordStrength password={passwordVal} />
            {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text">Confirm Password</label>
            <PasswordInput 
              {...register("confirmPassword")}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
            {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>}
          </div>

          <div className="flex items-start gap-3 mt-2">
            <input 
              type="checkbox" 
              id="terms"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-muted">
              I agree to the <Link href="/legal/terms" target="_blank" className="text-accent hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" target="_blank" className="text-accent hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <Button type="submit" className="w-full h-12 mt-2" disabled={loading}>
            {loading ? <span className="animate-pulse">Creating account...</span> : "Create account"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted">
          Already have an account? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-accent hover:underline">Log in</Link>
        </div>
      </AuthShell>
    </GuestOnly>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 border-4 border-surface border-t-accent rounded-full animate-spin"></div></div>}>
      <SignupContent />
    </Suspense>
  );
}
