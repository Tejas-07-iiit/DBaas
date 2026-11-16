/**
 * @file src/components/dashboard/RoleBadge.tsx
 * @description RBAC badge component displaying workspace roles ('Owner', 'Admin', 'Member')
 * with distinct theme colors and borders.
 */

export function RoleBadge({ role }: { role: string }) {
  const norm = (role || '').toUpperCase();
  const colors: Record<string, string> = {
    OWNER: 'bg-accent/10 text-accent border-accent/30',
    ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    MEMBER: 'bg-surface-2 text-muted border-border/50'
  };
  const label = norm === 'OWNER' ? 'Owner' : norm === 'ADMIN' ? 'Admin' : 'Member';
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${colors[norm] || colors.MEMBER}`}>
      {label}
    </span>
  );
}

