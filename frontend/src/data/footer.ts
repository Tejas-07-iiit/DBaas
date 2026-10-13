/**
 * @file src/data/footer.ts
 * @description Global footer navigation columns, CTA banner, and company metadata.
 */

export const footerData = {
  cta: {
    headingPart1: "Your next database is ",
    headingHighlight: "3 seconds",
    headingPart2: " away.",
    primaryButton: "Get started free",
    secondaryButton: "Read the docs",
  },
  companyInfo: {
    tagline: "MongoDB, PostgreSQL and Qdrant. One platform.",
    status: {
      label: "All systems operational",
      href: "/status"
    }
  },
  columns: [
    {
      title: "Product",
      links: [
        { label: "MongoDB", href: "/product/mongodb" },
        { label: "PostgreSQL", href: "/product/postgresql" },
        { label: "Qdrant", href: "/product/qdrant" },
      ]
    },
    {
      title: "Developers",
      links: [
        { label: "Docs", href: "/docs" },
        { label: "API reference", href: "/docs/api" },
        { label: "CLI", href: "/docs/cli" },
        { label: "SDKs", href: "/docs/sdks" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Support", href: "/support" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Terms", href: "/legal/terms" },
        { label: "Security policy", href: "/legal/security" }
      ]
    }
  ],
  socials: [
    { label: "X", href: "https://x.com/dbaas", icon: "twitter" },
    { label: "LinkedIn", href: "https://linkedin.com/company/dbaas", icon: "linkedin" }
  ],
  bottom: {
    copyright: "© 2026 DBaaS. All rights reserved.",
    location: "Made in India"
  }
};
