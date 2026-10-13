/**
 * @file src/data/security.ts
 * @description Security layers, shared responsibility guidelines, and vulnerability reporting data.
 */

export const securityLayers = [
  {
    title: "Encrypted connection (HTTPS)",
    description: "Traffic between you and the dashboard/API uses HTTPS.",
    bullets: ["End-to-end encryption for in-transit data", "Secures all API and management traffic"]
  },
  {
    title: "Verified identity",
    description: "Sign-in is handled by Firebase Authentication (email and password, Google sign-in). The backend verifies the sign-in token on every request.",
    bullets: ["Standardized authentication", "Token verified on every request"]
  },
  {
    title: "Role-based access",
    description: "Access is controlled per project by roles (Owner, Admin, Member). The backend checks the role before allowing an action.",
    bullets: ["Owner, Admin, and Member roles", "Granular endpoint permissions"]
  },
  {
    title: "One gateway",
    description: "All traffic, both management actions and data queries, flows through one API gateway. Customers never connect directly to database servers. The backend validates incoming requests and checks your subscription and plan limits before provisioning resources.",
    bullets: ["No direct database access", "Centralized request validation", "Subscription and plan checks"]
  },
  {
    title: "Isolated customer space",
    description: "Every customer runs in an isolated environment, with a private network, database authentication, and their own dedicated storage.",
    bullets: ["Isolated environment", "Dedicated storage", "Private network"]
  },
  {
    title: "Private network",
    description: "Databases live on a private, isolated network behind a firewall that blocks inbound connections by default.",
    bullets: ["Private isolated network", "Default-deny inbound firewall"]
  },
  {
    title: "Credentials and events",
    description: "Credentials can be rotated from the dashboard. Lifecycle events for each database are recorded and visible in the dashboard.",
    bullets: ["Dashboard credential rotation", "Visible lifecycle events"]
  }
];

export const securityYourPart = {
  title: "Your part",
  description: "Security is a shared responsibility. We handle the platform, but you must:",
  bullets: [
    "Choose strong passwords",
    "Manage who is on your project and with which role",
    "Rotate credentials when needed"
  ]
};

export const securityReport = {
  title: "Report a security issue",
  content: "If you find a security issue, please email us directly with the subject 'Security report'.",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"
};
