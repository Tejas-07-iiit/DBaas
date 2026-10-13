/**
 * @file src/data/status.ts
 * @description System status services, 90-day uptime history generators, and incident reports.
 */

export interface StatusIncident {
  id: string;
  date: string;
  title: string;
  events: { time: string; status: "Investigating" | "Identified" | "Monitoring" | "Resolved"; message: string }[];
}

export interface StatusService {
  name: string;
  type: "MongoDB" | "PostgreSQL" | "Qdrant" | "Dashboard" | "API" | "Backups";
  status: "Operational" | "Degraded" | "Outage";
  uptime: number; // 99.99
  history: { date: string; status: "up" | "degraded" | "down"; incidentTitle?: string }[];
}

export const regions = ["Mumbai", "Singapore", "Frankfurt", "Virginia"];

// Helper to generate 90 days of history
function generateHistory(incidents: { daysAgo: number; status: "degraded" | "down"; title: string }[]) {
  const history = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const incident = incidents.find(inc => inc.daysAgo === i);
    history.push({
      date: dateStr,
      status: incident ? incident.status : "up",
      incidentTitle: incident?.title
    });
  }
  return history;
}

export const statusData = {
  overall: "Operational",
  services: {
    "Mumbai": [
      { name: "MongoDB clusters", type: "MongoDB", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "PostgreSQL clusters", type: "PostgreSQL", status: "Operational", uptime: 99.98, history: generateHistory([{ daysAgo: 14, status: "degraded", title: "Elevated connection latencies" }]) },
      { name: "Qdrant clusters", type: "Qdrant", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "Control Plane API", type: "API", status: "Operational", uptime: 99.95, history: generateHistory([{ daysAgo: 42, status: "down", title: "API Gateway outage" }]) },
      { name: "Dashboard UI", type: "Dashboard", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "Automated Backups", type: "Backups", status: "Operational", uptime: 100, history: generateHistory([]) },
    ],
    "Singapore": [
      { name: "MongoDB clusters", type: "MongoDB", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "PostgreSQL clusters", type: "PostgreSQL", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "Qdrant clusters", type: "Qdrant", status: "Operational", uptime: 99.99, history: generateHistory([{ daysAgo: 5, status: "degraded", title: "Search latency spike" }]) },
      { name: "Control Plane API", type: "API", status: "Operational", uptime: 99.95, history: generateHistory([{ daysAgo: 42, status: "down", title: "API Gateway outage" }]) },
      { name: "Dashboard UI", type: "Dashboard", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "Automated Backups", type: "Backups", status: "Operational", uptime: 100, history: generateHistory([]) },
    ],
    // Copying structure for Frankfurt/Virginia for simplicity
    "Frankfurt": [
      { name: "MongoDB clusters", type: "MongoDB", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "PostgreSQL clusters", type: "PostgreSQL", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "Qdrant clusters", type: "Qdrant", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "Control Plane API", type: "API", status: "Operational", uptime: 99.95, history: generateHistory([{ daysAgo: 42, status: "down", title: "API Gateway outage" }]) },
      { name: "Dashboard UI", type: "Dashboard", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "Automated Backups", type: "Backups", status: "Operational", uptime: 100, history: generateHistory([]) },
    ],
    "Virginia": [
      { name: "MongoDB clusters", type: "MongoDB", status: "Operational", uptime: 99.95, history: generateHistory([{ daysAgo: 20, status: "down", title: "Storage volume attachment failures" }]) },
      { name: "PostgreSQL clusters", type: "PostgreSQL", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "Qdrant clusters", type: "Qdrant", status: "Operational", uptime: 100, history: generateHistory([]) },
      { name: "Control Plane API", type: "API", status: "Operational", uptime: 99.95, history: generateHistory([{ daysAgo: 42, status: "down", title: "API Gateway outage" }]) },
      { name: "Dashboard UI", type: "Dashboard", status: "Operational", uptime: 99.99, history: generateHistory([]) },
      { name: "Automated Backups", type: "Backups", status: "Operational", uptime: 100, history: generateHistory([]) },
    ]
  },
  recentIncidents: [
    {
      id: "inc-003",
      date: "Oct 01, 2026",
      title: "Search latency spike in Singapore",
      events: [
        { time: "08:15 UTC", status: "Investigating", message: "We are observing elevated query latencies on Qdrant clusters in the Singapore region." },
        { time: "08:32 UTC", status: "Identified", message: "A misconfigured load balancer rule is causing uneven distribution of traffic. We are rolling out a fix." },
        { time: "08:45 UTC", status: "Monitoring", message: "The fix has been deployed. Latency metrics are returning to normal levels." },
        { time: "09:10 UTC", status: "Resolved", message: "This incident has been resolved." }
      ]
    },
    {
      id: "inc-002",
      date: "Sep 22, 2026",
      title: "Elevated connection latencies in Mumbai",
      events: [
        { time: "14:20 UTC", status: "Investigating", message: "We are investigating reports of slow connection establishments to PostgreSQL clusters in Mumbai." },
        { time: "14:55 UTC", status: "Identified", message: "Our connection pooling layer is experiencing resource exhaustion due to a sudden surge in tenant traffic." },
        { time: "15:30 UTC", status: "Resolved", message: "Additional pooling nodes have been provisioned and traffic has stabilized." }
      ]
    },
    {
      id: "inc-001",
      date: "Sep 15, 2026",
      title: "Storage volume attachment failures in Virginia",
      events: [
        { time: "10:05 UTC", status: "Investigating", message: "New cluster creations in Virginia are failing to attach storage volumes." },
        { time: "10:40 UTC", status: "Identified", message: "An upstream issue with the underlying cloud provider's block storage API is causing timeouts." },
        { time: "12:15 UTC", status: "Resolved", message: "The cloud provider has resolved the API issue and all pending cluster creations have completed." }
      ]
    }
  ]
};
