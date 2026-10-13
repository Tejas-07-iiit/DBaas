/**
 * @file src/components/dashboard/ErrorState.tsx
 * @description Standardized error boundary / error fallback view for dashboard query failures.
 * Translates HTTP status codes (0, 401, 403, 500) into actionable human-readable explanations
 * and provides a retry button when an `onRetry` callback is provided.
 */

import { ApiError } from "@/lib/api/errors";

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
    <div className="p-8 text-center border border-border/50 rounded-xl bg-surface/30">
      <div className="text-red-400 mb-2 font-bold">Error</div>
      <p className="text-text mb-1">{message || 'Something went wrong.'}</p>
      {reason && <p className="text-muted text-sm mb-4">{reason}</p>}
      {debug && <p className="text-xs font-mono text-muted/50 mb-4">{debug}</p>}
      {onRetry && <button onClick={onRetry} className="text-accent hover:underline text-sm font-medium">Try again</button>}
    </div>
  );
}
