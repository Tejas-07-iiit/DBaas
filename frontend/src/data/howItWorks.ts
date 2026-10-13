/**
 * @file src/data/howItWorks.ts
 * @description Guided architectural steps explaining the DBaaS request lifecycle.
 */

export const howItWorksSteps = [
  {
    title: "You sign in",
    description: "Firebase handles your authentication."
  },
  {
    title: "Create project & invite team",
    description: "You create a project and invite your team members with specific roles."
  },
  {
    title: "Create a database",
    description: "You create a database and pick an engine (MongoDB, PostgreSQL, or Qdrant)."
  },
  {
    title: "Platform provisions",
    description: "The platform checks your role and plan, then provisions an isolated space for your database."
  },
  {
    title: "Manage and monitor",
    description: "You manage and monitor your database from the dashboard (start, stop, restart, credentials, metrics, logs, events)."
  },
  {
    title: "Connect through gateway",
    description: "Your app reaches the database through the gateway. You never connect directly to database servers."
  }
];
