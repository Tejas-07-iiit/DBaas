"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { GuestOnly } from "@/lib/auth/GuestOnly";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/errors";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";

type ResetForm = z.infer<typeof resetPasswordSchema>;

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

const TOKEN_PARAMS = ["token", "oobCode"];

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = TOKEN_PARAMS.map(p => searchParams.get(p)).find(Boolean);
  
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const passwordVal = watch("password");

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setLoading(true);
    setGlobalError("");
    try {
      await authApi.resetPassword({ token, password: data.password });
      router.replace('/login?reset=1');
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401 || err.status === 410) {
          setGlobalError("This reset link is invalid or has expired.");
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <GuestOnly>
        <AuthShell title="Set new password" type="reset">
          <div className="text-center p-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 mb-8">
            This reset link is invalid or has expired.
          </div>
          <Button onClick={() => router.push('/forgot-password')} className="w-full">
            Request a new link
          </Button>
        </AuthShell>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly>
      <AuthShell title="Set new password" type="reset">
        {globalError && (
          <div aria-live="polite" className="mb-6 p-4 text-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {globalError}
            {(globalError.includes("invalid") || globalError.includes("expired")) && (
              <div className="mt-4">
                <Button onClick={() => router.push('/forgot-password')} variant="outline" className="w-full">
                  Request a new link
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text">New Password</label>
            <PasswordInput 
              {...register("password")}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordStrength password={passwordVal} />
            {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text">Confirm New Password</label>
            <PasswordInput 
              {...register("confirmPassword")}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
            {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>}
          </div>

          <Button type="submit" className="w-full h-12 mt-2" disabled={loading || globalError.includes("invalid")}>
            {loading ? <span className="animate-pulse">Saving...</span> : "Save password"}
          </Button>
        </form>
      </AuthShell>
    </GuestOnly>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 border-4 border-surface border-t-accent rounded-full animate-spin"></div></div>}>
      <ResetContent />
    </Suspense>
  );
}
