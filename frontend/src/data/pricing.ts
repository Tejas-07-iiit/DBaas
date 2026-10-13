/**
 * @file src/data/pricing.ts
 * @description Pricing plans, feature comparison matrix, calculators, and FAQs.
 */

export const pricingData = {
  hero: {
    label: "// PRICING",
    h1Part1: "Pay for ",
    h1Highlight: "what you store",
    h1Part2: ". Not for what you configure.",
    subtext: "Simple, predictable pricing designed to scale with your application.",
  },
  plans: [
    {
      id: "free",
      name: "Free",
      price: 0,
      description: "Perfect for hobby projects and prototypes.",
      buttonText: "Start for free",
      buttonVariant: "outline",
      href: "/signup",
      features: [
        { text: "1 database per engine" },
        { text: "1 GB storage per engine", tooltip: "Shared across all databases for a given engine." },
        { text: "Community support" },
        { text: "Shared resources" },
        { text: "No credit card required" }
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      highlight: true,
      badge: "Most popular",
      description: "For production applications with predictable traffic.",
      buttonText: "Get started",
      buttonVariant: "primary",
      href: "/signup",
      features: [
        { text: "3 databases per engine" },
        { text: "50 GB storage per engine", tooltip: "Pooled storage you can allocate freely." },
        { text: "Daily backups", tooltip: "7-day retention period." },
        { text: "Email support" },
        { text: "Autoscaling compute" }
      ]
    },
    {
      id: "scale",
      name: "Scale",
      price: 199,
      description: "For high-growth apps needing isolation and scale.",
      buttonText: "Start Scale",
      buttonVariant: "outline",
      href: "/signup",
      features: [
        { text: "Unlimited databases" },
        { text: "1 TB storage per engine" },
        { text: "Hourly backups", tooltip: "30-day retention period." },
        { text: "Priority support" },
        { text: "Dedicated resources" },
        { text: "SSO (SAML/OIDC)" }
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with complex compliance needs.",
      buttonText: "Contact sales",
      buttonVariant: "outline",
      href: "/contact",
      features: [
        { text: "Private networking (VPC)" },
        { text: "Custom SLA (99.99%)" },
        { text: "Dedicated support engineer" },
        { text: "Annual security review" },
        { text: "Custom backup policies" },
        { text: "Bring your own cloud (BYOC)" }
      ]
    }
  ],
  estimator: {
    rates: {
      mongoPerGb: 0.25, // $0.25 per GB
      pgPerGb: 0.30,    // $0.30 per GB
      qdrantPerM: 1.50, // $1.50 per Million vectors
      backupMult: {
        7: 1,
        14: 1.2,
        30: 1.5
      },
      regionMult: 1.25 // +25% per additional region
    },
    note: "How this is calculated: We charge a flat rate per GB of storage or million vectors. Backup retention and multi-region replication add a percentage multiplier to the base cost. (Sample pricing only)"
  },
  compareTable: [
    {
      category: "Databases",
      features: [
        { name: "Max DBs per engine", values: { free: "1", pro: "3", scale: "Unlimited", enterprise: "Unlimited" } },
        { name: "Compute model", values: { free: "Shared", pro: "Autoscaling", scale: "Dedicated", enterprise: "Dedicated isolated" } },
        { name: "Global regions", values: { free: "1 (US East)", pro: "Any 1 region", scale: "Up to 4 regions", enterprise: "Any region globally" } },
      ]
    },
    {
      category: "Storage & Backups",
      features: [
        { name: "Included Storage", values: { free: "1 GB", pro: "50 GB", scale: "1 TB", enterprise: "Custom" } },
        { name: "Automated Backups", values: { free: "None", pro: "Daily", scale: "Hourly", enterprise: "Continuous (PITR)" } },
        { name: "Backup Retention", values: { free: "N/A", pro: "7 days", scale: "30 days", enterprise: "Up to 10 years" } },
        { name: "Point-in-time Recovery", values: { free: false, pro: false, scale: true, enterprise: true } },
      ]
    },
    {
      category: "Security & Networking",
      features: [
        { name: "TLS Encryption", values: { free: true, pro: true, scale: true, enterprise: true } },
        { name: "IP Allowlisting", values: { free: true, pro: true, scale: true, enterprise: true } },
        { name: "VPC Peering", values: { free: false, pro: false, scale: false, enterprise: true } },
        { name: "SSO / SAML", values: { free: false, pro: false, scale: true, enterprise: true } },
      ]
    },
    {
      category: "Support",
      features: [
        { name: "Support Channel", values: { free: "Community", pro: "Email", scale: "Priority Email", enterprise: "Slack + Phone" } },
        { name: "Response Time SLA", values: { free: "N/A", pro: "24 hours", scale: "4 hours", enterprise: "15 minutes" } },
        { name: "Dedicated Engineer", values: { free: false, pro: false, scale: false, enterprise: true } },
      ]
    }
  ],
  freeStrip: [
    { title: "No credit card", desc: "Start building immediately without entering payment details." },
    { title: "Upgrade anytime", desc: "Move to a paid plan only when your application needs it." },
    { title: "No lock-in", desc: "Export your data via standard dump tools whenever you want." }
  ],
  faq: [
    { q: "How does the billing cycle work?", a: "We bill monthly in arrears. You only pay for the exact resources you consumed during the previous month, prorated to the second." },
    { q: "What happens if I exceed my storage limit?", a: "Your database will never go down. If you exceed your plan's storage limit, you will be billed for overages at a flat rate of $0.50/GB per month. We'll send you an email alert when you reach 80% and 100% of your quota." },
    { q: "Are the free plan limits strict?", a: "Yes, the free plan is strictly limited to 1GB per engine. If you need more, you can easily upgrade to the Pro plan." },
    { q: "Can I cancel my subscription anytime?", a: "Absolutely. You can downgrade to the free tier or delete your account at any time from the dashboard. There are no long-term contracts unless you are on a Custom Enterprise agreement." },
    { q: "Do you offer refunds?", a: "We don't offer refunds for partial months, but if you accidentally left a cluster running or made a mistake during your first month, reach out to support and we'll help you out." },
    { q: "How do I export my data?", a: "Since we use standard engines (PostgreSQL, MongoDB, Qdrant), you can use their native CLI tools (`pg_dump`, `mongodump`, etc.) to export your data directly to your local machine or S3." },
    { q: "Do you have discounts for students or startups?", a: "Yes! We offer $1000 in credits for eligible early-stage startups and free Pro accounts for verified students. Contact support to apply." },
    { q: "What happens if my traffic spikes?", a: "On the Pro plan and above, our autoscaler automatically provisions additional compute resources to handle the load without dropping connections. You are billed based on the peak compute used." }
  ],
  closing: {
    text: "Start free. Upgrade when it hurts.",
    primaryCta: "Get started free",
    primaryHref: "/signup",
    secondaryCta: "Talk to sales",
    secondaryHref: "/contact"
  }
};
