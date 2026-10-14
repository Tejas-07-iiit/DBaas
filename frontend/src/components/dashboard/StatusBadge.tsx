/**
 * @file src/components/dashboard/StatusBadge.tsx
 * @description Status indicator badge for database lifecycle states.
 * Renders distinct color tokens and pulsing animation for transitional states (provisioning, restarting, etc.).
 */

export function StatusBadge({ status }: { status: string }) {
  const isTransitional = ['provisioning', 'starting', 'stopping', 'restarting', 'deleting'].includes(status);
  let color = 'text-muted border-border/50 bg-surface-2';
  
  if (status === 'running') color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  else if (status === 'stopped') color = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  else if (status === 'failed' || status === 'unknown') color = 'text-red-400 border-red-500/30 bg-red-500/10';
  else if (isTransitional) color = 'text-accent border-accent/30 bg-accent/10';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${color}`}>
      {isTransitional && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
      {status}
    </span>
  );
}