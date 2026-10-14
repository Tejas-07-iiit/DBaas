/**
 * @file src/components/dashboard/ErrorState.tsx
 * @description Standardized error boundary / error fallback view for dashboard query failures.
 * Translates HTTP status codes (0, 401, 403, 500) into actionable human-readable explanations
 * and provides a retry button when an `onRetry` callback is provided.
 */

import { ApiError } from "@/lib/api/errors";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  error?: any;
  onRetry?: () => void;
}

export function ErrorState({ message, error, onRetry }: ErrorStateProps) {
  let reason = "";
  let debug = "";

  if (error instanceof ApiError || error?.status !== undefined) {
    const status = error.status;
    if (status === 0) reason = "Can't reach the server. Check that the backend is running and that NEXT_PUBLIC_API_BASE_URL in .env.local is correct.";
    else if (status === 401) reason = "Your session has expired. Please log in again.";
    else if (status === 403) reason = "You don't have permission to view this.";
    else if (status >= 500) reason = "The server had a problem. Try again in a moment.";

    if (process.env.NODE_ENV !== "production") {
      debug = `Status: ${status}`;
    }
  }

  return (
    <div className="py-12 px-8 text-center border border-border/50 rounded-lg bg-surface/20">
      <AlertCircle size={36} className="text-red-400/60 mx-auto mb-3" strokeWidth={1.5} />
      <div className="text-sm font-semibold text-red-400 mb-1">{message || 'Something went wrong.'}</div>
      {reason && <p className="text-muted text-xs mb-4 max-w-md mx-auto">{reason}</p>}
      {debug && <p className="text-xs font-mono text-muted/40 mb-4">{debug}</p>}
      {onRetry && <button onClick={onRetry} className="text-accent hover:underline text-xs font-medium">Try again</button>}
    </div>
  );
}
