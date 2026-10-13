export function generateSeedData() {
  const now = new Date();
  const subDays = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  
  return {
    version: 1,
    user: { id: "demo-user", name: "Demo User", email: "demo@dbaas.dev" },
    subscription: { planName: "Pro", status: "active", renewalDate: new Date(now.getTime() + 18 * 86400000).toISOString() },
    plans: [
      { id: 'plan-1', name: 'Starter', price: 0, currency: 'USD', interval: 'month', description: 'For hobbyists.', features: ['1 Project'], limits: { databases: 1 } },
      { id: 'plan-2', name: 'Pro', price: 29, currency: 'USD', interval: 'month', description: 'For pros.', features: ['Unlimited Projects'], limits: { databases: 10 } },
      { id: 'plan-3', name: 'Scale', price: 99, currency: 'USD', interval: 'month', description: 'For teams.', features: ['Everything in Pro', 'Priority Support'], limits: { databases: 100 } }
    ],
    projects: [
      { id: 'p1', name: 'Acme Storefront', description: 'E-commerce backend', createdAt: subDays(90) },
      { id: 'p2', name: 'Mobile Backend', description: 'API for the mobile app', createdAt: subDays(45) },
      { id: 'p3', name: 'Analytics Platform', description: 'Data warehouse', createdAt: subDays(20) },
      { id: 'p4', name: 'Internal Tools', description: 'Company dashboards', createdAt: subDays(5) }
    ],
    members: [
      { id: 'm1', projectId: 'p1', name: 'Demo User', email: 'demo@dbaas.dev', role: 'Owner', joinedAt: subDays(90) },
      { id: 'm2', projectId: 'p2', name: 'Demo User', email: 'demo@dbaas.dev', role: 'Owner', joinedAt: subDays(45) },
      { id: 'm3', projectId: 'p3', name: 'Demo User', email: 'demo@dbaas.dev', role: 'Admin', joinedAt: subDays(20) },
      { id: 'm4', projectId: 'p4', name: 'Demo User', email: 'demo@dbaas.dev', role: 'Member', joinedAt: subDays(5) }
    ],
    databases: [
      { id: 'd1', projectId: 'p1', name: 'orders-db', engine: 'PostgreSQL', status: 'running', statusUpdatedAt: subDays(1), createdAt: subDays(89), cpu: 4, memoryMb: 8192, storageGb: 50 },
      { id: 'd2', projectId: 'p1', name: 'product-search', engine: 'Qdrant', status: 'running', statusUpdatedAt: subDays(1), createdAt: subDays(80), cpu: 2, memoryMb: 4096, storageGb: 20 },
      { id: 'd3', projectId: 'p2', name: 'user-sessions', engine: 'MongoDB', status: 'stopped', statusUpdatedAt: subDays(1), createdAt: subDays(40), cpu: 1, memoryMb: 2048, storageGb: 10 },
      { id: 'd4', projectId: 'p4', name: 'metrics-db', engine: 'PostgreSQL', status: 'provisioning', statusUpdatedAt: now.toISOString(), createdAt: now.toISOString(), cpu: 2, memoryMb: 4096, storageGb: 20 }
    ]
  };
}
