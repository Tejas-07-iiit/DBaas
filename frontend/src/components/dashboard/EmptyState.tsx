/**
 * @file src/components/dashboard/EmptyState.tsx
 * @description Presentational empty state component for tables, lists, and resource grids.
 * Displays title, helper description, and optional call-to-action button.
 */

import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="p-12 text-center border border-dashed border-border/50 rounded-xl bg-surface/30 flex flex-col items-center">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {description && <p className="text-muted mb-6 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
