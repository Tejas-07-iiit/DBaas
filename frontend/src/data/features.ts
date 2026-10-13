/**
 * @file src/data/features.ts
 * @description Features page technical specifications, architecture diagrams, and capabilities.
 */

export const featuresData = {
  hero: {
    label: "// FEATURES",
    h1Part1: "Everything a database needs. ",
    h1Highlight: "Nothing to babysit.",
    subtext: "We've built all the critical infrastructure you need for production so you can focus on shipping features.",
    searchPlaceholder: "Search features..."
  },
  sections: [
    {
      id: "backups",
      number: "01",
      title: "Backups & Restore",
      description: "Continuous WAL archiving and daily snapshots mean you can travel back in time. Drop a table by accident? Restore to exactly the second before it happened.",
      bullets: [
        "Continuous point-in-time recovery for 7 days",
        "Automated daily full snapshots retained for 30 days",
        "Zero-downtime cloning to staging environments"
      ]
    },
    {
      id: "autoscaling",
      number: "02",
      title: "Serverless Autoscaling",
      description: "Handle unpredictable traffic spikes without paying for idle capacity. Our platform monitors your load and adds or removes read replicas in milliseconds.",
      bullets: [
        "Scale CPU and RAM vertically without connection drops",
        "Horizontal read replica auto-scaling",
        "Scale to zero for dev databases"
      ]
    },
    {
      id: "monitoring",
      number: "03",
      title: "Deep Monitoring",
      description: "Stop guessing why your app is slow. Get granular visibility into your query performance, connection pools, and resource utilization across all engines.",
      bullets: [
        "Live query metrics and execution plans",
        "Customizable alert thresholds via Slack or PagerDuty",
        "Prometheus & Datadog integration out of the box"
      ]
    },
    {
      id: "security",
      number: "04",
      title: "Enterprise Security",
      description: "Secure by default. All data is encrypted at rest and in transit. Lock down your cluster with IP allowlists, VPC peering, and strict role-based access.",
      bullets: [
        "KMS Encryption at rest with bring-your-own-key",
        "Private networking (VPC peering / AWS PrivateLink)",
        "SOC2 Type II and HIPAA compliance"
      ]
    },
    {
      id: "cli",
      number: "05",
      title: "API & CLI First",
      description: "Everything you can do in the UI, you can do via our API or CLI. Automate your database provisioning, user management, and CI/CD pipelines effortlessly.",
      bullets: [
        "Official Terraform provider",
        "Scriptable CLI for local development",
        "RESTful API with granular scopes"
      ]
    },
    {
      id: "regions",
      number: "06",
      title: "Global Regions",
      description: "Deploy your databases close to your users to minimize latency. We operate in 12+ regions across AWS, GCP, and Azure.",
      bullets: [
        "Multi-region active-active clusters",
        "Cross-region read replicas",
        "Data residency compliance guarantees"
      ]
    },
    {
      id: "teams",
      number: "07",
      title: "Teams & Access",
      description: "Manage who has access to what. Assign granular roles to team members and audit every action taken in your organization.",
      bullets: [
        "Single Sign-On (SAML / OIDC)",
        "Granular project-level permissions",
        "Comprehensive audit logs"
      ]
    }
  ],
  vsSelfHosted: {
    title: "Self-hosted vs DBaaS",
    description: "Operating databases is expensive. See how much effort and money you save by offloading the undifferentiated heavy lifting.",
    labels: { self: "Self-hosted", dbaas: "DBaaS" },
    hoursPerDb: 15,
    costPerHour: 80,
    dbaasHoursPerDb: 1,
    dbaasCostPerHour: 80,
    baseCost: 200
  },
  stack: {
    title: "Works with your stack",
    description: "No proprietary drivers. Connect using the standard tools and frameworks you already love.",
    items: [
      { name: "Next.js", category: "Framework", desc: "Connect serverless functions seamlessly." },
      { name: "Node.js", category: "Runtime", desc: "Native pooling for high-concurrency." },
      { name: "Python", category: "Language", desc: "Perfect for data science and AI." },
      { name: "Go", category: "Language", desc: "Blazing fast connection management." },
      { name: "Docker", category: "DevOps", desc: "Local parity with production." },
      { name: "Containers", category: "DevOps", desc: "Support for container native apps." },
      { name: "Terraform", category: "IaC", desc: "Define your infrastructure as code." },
      { name: "GitHub Actions", category: "CI/CD", desc: "Automate schema migrations." },
      { name: "Prisma", category: "ORM", desc: "Type-safe database access." },
      { name: "LangChain", category: "AI", desc: "Native vector store integration." },
      { name: "Vercel", category: "Hosting", desc: "One-click deployment integration." },
      { name: "Grafana", category: "Observability", desc: "Export metrics via Prometheus." }
    ]
  },
  closing: {
    title: "Ready to stop managing databases?",
    cta: "Get started free"
  }
};
