/**
 * @file src/components/dashboard/StatusBadge.tsx
 * @description Status indicator badge for database lifecycle states.
 * Renders distinct color tokens and pulsing animation for transitional states (provisioning, restarting, etc.).
 */

export function StatusBadge({ status }: { status: string }) {
  const isTransitional = ['provisioning', 'starting', 'stopping', 'restarting', 'deleting'].includes(status);
  let color = 'text-muted border-border/50 bg-surface-2';
  
  if (status === 'running') color = 'text-[#3FCF6D] border-[#3FCF6D]/30 bg-[#3FCF6D]/10';
  else if (status === 'stopped') color = 'text-amber-500 border-amber-500/30 bg-amber-500/10';
  else if (status === 'failed' || status === 'unknown') color = 'text-red-400 border-red-500/30 bg-red-500/10';
  else if (isTransitional) color = 'text-accent border-accent/30 bg-accent/10';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${color}`}>
      {isTransitional && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
      {status}
    </span>
  );
}