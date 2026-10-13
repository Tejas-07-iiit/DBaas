/**
 * @file src/data/roles.ts
 * @description RBAC permission matrix for project Owner, Admin, and Member roles.
 */

export const rolePermissions = [
  { action: "View projects/databases/metrics", owner: true, admin: true, member: true },
  { action: "Create/update/delete databases", owner: true, admin: true, member: false },
  { action: "Start/stop/restart databases", owner: true, admin: true, member: false },
  { action: "Rotate credentials", owner: true, admin: true, member: false },
  { action: "Manage members", owner: true, admin: true, member: false },
  { action: "Manage billing", owner: true, admin: false, member: false }, // Billing checkout/cancel needs auth, but assuming owner manages it based on standard practices; WAIT: PROJ-05 delete is Owner only, update is Admin-Owner. The prompt said "If the sheet does not make a permission clear, mark it 'to confirm' in your report". 
  { action: "Delete project", owner: true, admin: false, member: false }
];
