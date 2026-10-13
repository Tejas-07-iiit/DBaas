import { ProductContent } from "./types";

export const postgresqlContent: ProductContent = {
  id: "postgres",
  name: "PostgreSQL",
  accentColor: "#4C8DFF",
  hero: {
    breadcrumb: "Product / PostgreSQL",
    h1Part1: "Relational power. ",
    h1Highlight: "Zero ops.",
    subtext: "The world's most advanced open-source database. Fully managed with ACID transactions, complex joins, powerful extensions like pgvector, and built-in connection pooling.",
    primaryCta: "Create a PostgreSQL database",
    secondaryCta: "Read the docs",
    trustChips: ["Fully managed", "High availability", "Automated backups"],
    codeExample: `-- 1. Create table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT
);

-- 2. Insert data
INSERT INTO users (name, plan)
VALUES ('Alice', 'pro'), ('Bob', 'free');

-- 3. Query
SELECT * FROM users
WHERE plan = 'pro';`
  },
  numbers: [
    { value: "ACID", label: "compliant" },
    { value: "PgBouncer", label: "pooling built in" },
    { value: "99.99%", label: "uptime SLA" },
    { value: "1 GB", label: "free tier" }
  ],
  features: [
    {
      label: "// INTEGRITY",
      title: "ACID transactions",
      description: "Guarantee data integrity even during system failures. Group multiple operations into a single transaction that either completely succeeds or fully rolls back.",
      bullets: ["Atomicity & Consistency", "Isolation levels", "Durability guarantees"]
    },
    {
      label: "// ECOSYSTEM",
      title: "Powerful extensions",
      description: "Extend PostgreSQL beyond a simple relational store. Use pgvector for AI, PostGIS for geospatial data, or pg_cron to run scheduled jobs inside your database.",
      bullets: ["Native pgvector support", "Geospatial queries with PostGIS", "Fuzzy text matching"]
    },
    {
      label: "// SCALE",
      title: "Built-in connection pooling",
      description: "Serverless functions and modern edge deployments can quickly exhaust database connections. We include PgBouncer by default so you can scale to thousands of clients.",
      bullets: ["Transaction-level pooling", "Prevents connection exhaustion", "Lower latency for edge apps"]
    },
    {
      label: "// SAFETY",
      title: "Point-in-time recovery",
      description: "Accidentally dropped a critical table? No problem. Restore your database to any specific second within your retention window with just one click.",
      bullets: ["Continuous archiving (WAL)", "Zero data loss", "Clone to new clusters"]
    }
  ],
  useCases: [
    {
      id: "finance",
      tabLabel: "Payments & finance",
      description: "When dealing with ledgers and payments, eventual consistency isn't enough. PostgreSQL guarantees that a money transfer is completely processed or safely reverted.",
      sampleDocument: `BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;`,
      why: "Why PostgreSQL: Strict ACID compliance and transaction isolation ensure zero lost updates."
    },
    {
      id: "saas",
      tabLabel: "SaaS backends",
      description: "Core business logic often relies on strict relationships. Customers have subscriptions, which have invoices. Enforce these rules at the database level with foreign keys.",
      sampleDocument: `CREATE TABLE invoices (\n  id UUID PRIMARY KEY,\n  user_id UUID REFERENCES users(id),\n  amount DECIMAL(10,2)\n);`,
      why: "Why PostgreSQL: Foreign key constraints and complex JOINs make relational modeling a breeze."
    },
    {
      id: "analytics",
      tabLabel: "Analytics",
      description: "Run complex aggregations, window functions, and rollup reports directly where your data lives without moving it to a separate data warehouse.",
      sampleDocument: `SELECT date_trunc('month', created_at),\n       sum(amount)\nFROM sales\nGROUP BY 1 ORDER BY 1;`,
      why: "Why PostgreSQL: Advanced SQL support including window functions and CTEs."
    },
    {
      id: "geo",
      tabLabel: "Geospatial apps",
      description: "Build location-aware applications with PostGIS. Query for drivers near a user, or calculate the distance between two coordinate points.",
      sampleDocument: `SELECT name\nFROM restaurants\nWHERE ST_DWithin(location, ST_MakePoint(-122, 37), 1000);`,
      why: "Why PostgreSQL: PostGIS is the industry standard for geospatial data processing."
    }
  ],
  codeSnippets: [
    {
      language: "Node.js (Prisma)",
      code: `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Run inside a transaction
const transfer = await prisma.$transaction([
  prisma.account.update({
    where: { id: senderId },
    data: { balance: { decrement: 100 } },
  }),
  prisma.account.update({
    where: { id: receiverId },
    data: { balance: { increment: 100 } },
  }),
])`
    },
    {
      language: "Python",
      code: `import psycopg2

conn = psycopg2.connect(dsn="postgres://user:pass@host/db")
cur = conn.cursor()

# Execute a query
cur.execute(
    "SELECT * FROM users WHERE plan = %s",
    ("pro",)
)

users = cur.fetchall()
conn.close()`
    },
    {
      language: "Go",
      code: `import (
    "context"
    "github.com/jackc/pgx/v5"
)

conn, _ := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
defer conn.Close(context.Background())

var name string
err := conn.QueryRow(context.Background(), "SELECT name FROM users WHERE id=$1", 1).Scan(&name)`
    },
    {
      language: "psql",
      code: `# Connect directly from your terminal using psql
psql "postgres://user:password@host.dbaas.com:5432/dbname?sslmode=require"

# Or use our CLI wrapper
dbaas connect my-postgres-db`
    }
  ],
  specs: {
    items: [
      { label: "Versions", value: "PostgreSQL 15, 16" },
      { label: "Extensions", value: "pgvector, PostGIS, pg_stat_statements, +50 more" },
      { label: "Pooling", value: "PgBouncer included" },
      { label: "Max connections", value: "Up to 10,000 via pooler" },
      { label: "Backups", value: "Continuous WAL archiving (7 days)" },
      { label: "High Availability", value: "Synchronous replication (paid plans)" }
    ],
    plans: [
      { name: "Free", limit: "1 GB", price: "$0/mo" },
      { name: "Pro", limit: "50 GB", price: "$29/mo" },
      { name: "Scale", limit: "Unlimited", price: "Custom" }
    ]
  },
  faq: [
    {
      q: "Can I connect using standard PostgreSQL tools?",
      a: "Yes. Our platform provides standard PostgreSQL connection strings, so tools like pgAdmin, DBeaver, DataGrip, or standard psql work out of the box."
    },
    {
      q: "Which extensions do you support?",
      a: "We support over 50 popular extensions including pgvector, PostGIS, pg_trgm, pg_cron, and pgcrypto. You can enable them easily using 'CREATE EXTENSION'."
    },
    {
      q: "How does the connection pooler work?",
      a: "We deploy PgBouncer alongside your database. You receive two connection strings: one direct connection for migrations/admin tasks, and one pooled connection for serverless/edge apps."
    },
    {
      q: "Is it possible to setup read replicas?",
      a: "Yes, on Pro and Scale plans, you can add read replicas in the same or different regions with just a few clicks."
    },
    {
      q: "What happens during a failover?",
      a: "If the primary node fails, our system automatically promotes a standby node to primary. Your connection string automatically routes to the new primary within seconds."
    }
  ],
  pairItWith: [
    {
      id: "qdrant",
      name: "Qdrant",
      reason: "Add Qdrant for semantic search over your rows.",
      href: "/product/qdrant"
    },
    {
      id: "mongodb",
      name: "MongoDB",
      reason: "Add MongoDB for flexible content and JSON catalogs.",
      href: "/product/mongodb"
    }
  ],
  closing: {
    text: "Ready to unleash the power of Postgres?",
    cta: "Create a database"
  }
};
