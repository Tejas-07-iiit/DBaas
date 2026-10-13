/**
 * @file src/components/dashboard/RoleBadge.tsx
 * @description RBAC badge component displaying workspace roles ('Owner', 'Admin', 'Member')
 * with distinct theme colors and borders.
 */

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Owner: 'bg-accent/10 text-accent border-accent/20',
    Admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Member: 'bg-surface-2 text-muted border-border'
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${colors[role] || colors.Member}`}>
      {role}
    </span>
  );
}
