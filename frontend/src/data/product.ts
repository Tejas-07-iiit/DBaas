/**
 * @file src/data/product.ts
 * @description Product overview page data: engine comparisons, feature tabs, and interactive demos.
 */

export const productData = {
  hero: {
    label: "// PRODUCT",
    h1Part1: "Pick an engine. Or use ",
    h1Highlight: "all three.",
    subtitle: "A unified platform giving you the right database for every part of your stack, managed seamlessly in one place.",
    cta1: "Get started free",
    cta2: "Compare engines"
  },
  engines: [
    {
      id: "mongodb",
      name: "MongoDB",
      color: "#3FCF6D",
      purpose: "Document database for flexible JSON structures",
      linkText: "Explore MongoDB",
      href: "/product/mongodb"
    },
    {
      id: "postgres",
      name: "PostgreSQL",
      color: "#4C8DFF",
      purpose: "Relational database for structured tabular data",
      linkText: "Explore PostgreSQL",
      href: "/product/postgresql"
    },
    {
      id: "qdrant",
      name: "Qdrant",
      color: "#FF4D8D",
      purpose: "Vector database for AI and similarity search",
      linkText: "Explore Qdrant",
      href: "/product/qdrant"
    }
  ],
  comparison: {
    title: "Same platform. Different strengths.",
    categories: ["Show all", "Developer experience", "Scale", "AI"],
    columns: [
      { id: "postgres", name: "PostgreSQL", color: "#4C8DFF" },
      { id: "mongodb", name: "MongoDB", color: "#3FCF6D" },
      { id: "qdrant", name: "Qdrant", color: "#FF4D8D" }
    ],
    rows: [
      {
        feature: "Data model",
        category: "Show all",
        postgres: "Relational tables",
        mongodb: "JSON documents",
        qdrant: "Vectors & payload"
      },
      {
        feature: "Best for",
        category: "Developer experience",
        postgres: "Core business logic, users",
        mongodb: "Catalogs, events, logs",
        qdrant: "RAG, recommendations"
      },
      {
        feature: "Query language",
        category: "Developer experience",
        postgres: "SQL",
        mongodb: "MQL",
        qdrant: "REST / gRPC"
      },
      {
        feature: "Transactions",
        category: "Developer experience",
        postgres: "ACID",
        mongodb: "Multi-document ACID",
        qdrant: "Eventual consistency"
      },
      {
        feature: "Scaling",
        category: "Scale",
        postgres: "Vertical (mostly)",
        mongodb: "Horizontal sharding",
        qdrant: "Horizontal sharding"
      },
      {
        feature: "Vector search",
        category: "AI",
        postgres: "pgvector (HNSW/IVFFlat)",
        mongodb: "Atlas Vector Search",
        qdrant: "Native HNSW (Purpose-built)"
      },
      {
        feature: "Typical latency",
        category: "Scale",
        postgres: "1-5ms",
        mongodb: "1-5ms",
        qdrant: "2-10ms"
      },
      {
        feature: "Free tier",
        category: "Show all",
        postgres: "500MB",
        mongodb: "512MB",
        qdrant: "1GB"
      }
    ]
  },
  betterTogether: {
    title: "Most real apps use more than one database.",
    tabs: [
      {
        id: "online-store",
        label: "Online store",
        caption: "PostgreSQL handles the critical transactions and user accounts. MongoDB stores the deeply nested product catalog. Qdrant powers 'Find similar items' by vectorizing images.",
        apps: [
          { name: "PostgreSQL", stores: "Users & Orders" },
          { name: "MongoDB", stores: "Product Catalog" },
          { name: "Qdrant", stores: "Similar Products" }
        ]
      },
      {
        id: "ai-assistant",
        label: "AI assistant",
        caption: "User credentials and billing sit in PostgreSQL. Chat histories are saved as documents in MongoDB. Qdrant retrieves relevant context chunks to feed the LLM prompt.",
        apps: [
          { name: "PostgreSQL", stores: "Billing & Auth" },
          { name: "MongoDB", stores: "Chat History" },
          { name: "Qdrant", stores: "Context Embeddings" }
        ]
      },
      {
        id: "saas",
        label: "SaaS dashboard",
        caption: "Core tenant data is structured in PostgreSQL. High-volume analytics events stream into MongoDB. Qdrant enables semantic search across customer feedback.",
        apps: [
          { name: "PostgreSQL", stores: "Core App Data" },
          { name: "MongoDB", stores: "Event Analytics" },
          { name: "Qdrant", stores: "Semantic Search" }
        ]
      }
    ]
  },
  included: {
    tiles: [
      {
        id: "backups",
        title: "Automated Backups",
        description: "Point-in-time recovery for the last 7 days.",
        href: "/features",
        icon: "backup"
      },
      {
        id: "monitoring",
        title: "Advanced Monitoring",
        description: "Real-time metrics, slow query logs, and custom alerts.",
        href: "/features",
        icon: "monitor"
      },
      {
        id: "security",
        title: "Enterprise Security",
        description: "VPC peering, SSO, and encryption at rest by default.",
        href: "/features",
        icon: "lock"
      },
      {
        id: "cli",
        title: "CLI & API First",
        description: "Manage everything via Terraform or our native CLI tool.",
        href: "/features",
        icon: "terminal"
      }
    ]
  },
  quiz: {
    intro: "Not sure where to start? Answer a few questions to find your engine."
  },
  closing: {
    text: "Start with one. Add the others when you need them.",
    cta: "Get started free"
  }
};
