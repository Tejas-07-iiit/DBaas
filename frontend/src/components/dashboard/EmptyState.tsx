/**
 * @file src/components/dashboard/EmptyState.tsx
 * @description Presentational empty state component for tables, lists, and resource grids.
 * Displays title, helper description, and optional call-to-action button.
 */

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="py-16 px-8 text-center border border-dashed border-border/50 rounded-lg bg-surface/20 flex flex-col items-center">
      <div className="mb-4 text-muted/40">
        {icon || <Inbox size={40} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold mb-1 text-text">{title}</h3>
      {description && <p className="text-sm text-muted mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
