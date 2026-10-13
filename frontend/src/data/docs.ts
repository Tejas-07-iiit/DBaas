/**
 * @file src/data/docs.ts
 * @description Technical documentation articles, category sidebar hierarchy, and content blocks.
 */

export type DocHeading = { id: string; title: string; level: number };
export type DocBlock =
  | { type: "paragraph"; content: string }
  | { type: "code"; language: string; filename?: string; code: string }
  | { type: "callout"; variant: "note" | "tip" | "warning"; content: string }
  | { type: "steps"; items: string[] }
  | { type: "heading"; id: string; level: number; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  updatedAt: string;
  category: string;
  headings: DocHeading[];
  blocks: DocBlock[];
}

export const sidebarNav = [
  {
    group: "Getting Started",
    links: [
      { title: "Security overview", slug: "security-overview" },
      { title: "How DBaaS works", slug: "how-dbaas-works" },
      { title: "Quickstart", slug: "quickstart" },
      { title: "Architecture overview", slug: "architecture-overview" },
      { title: "Pricing & Billing", slug: "pricing" }
    ]
  },
  {
    group: "Database Engines",
    links: [
      { title: "Connect to MongoDB", slug: "connect-to-mongodb" },
      { title: "Connect to PostgreSQL", slug: "connect-to-postgresql" },
      { title: "Create your first Qdrant collection", slug: "create-first-qdrant-collection" }
    ]
  },
  {
    group: "Platform Features",
    links: [
      { title: "Roles and permissions", slug: "roles-and-permissions" },
      { title: "Database lifecycle", slug: "database-lifecycle" },
      { title: "Plans and billing", slug: "plans-and-billing" },
      { title: "Backups & Recovery", slug: "backups" },
      { title: "Autoscaling", slug: "autoscaling" },
      { title: "Connection Pooling", slug: "connection-pooling" }
    ]
  },
  {
    group: "API & SDKs",
    links: [
      { title: "REST API Reference", slug: "api-reference" },
      { title: "Node.js SDK", slug: "nodejs-sdk" },
      { title: "Python SDK", slug: "python-sdk" }
    ]
  }
];

export const articles: DocArticle[] = [
  {
    slug: "security-overview",
    title: "Security overview",
    description: "Learn how we secure your data and the platform.",
    readTime: "3 min read",
    updatedAt: "Oct 4, 2026",
    category: "Security",
    headings: [
      { id: "overview", title: "Security Layers", level: 2 },
      { id: "responsibility", title: "Who is responsible for what", level: 2 }
    ],
    blocks: [
      { type: "callout", variant: "warning", content: "Customers never connect directly to databases." },
      { type: "heading", id: "overview", level: 2, content: "Security Layers" },
      { type: "paragraph", content: "1. Encrypted connection (HTTPS): Traffic between you and the dashboard/API uses HTTPS." },
      { type: "paragraph", content: "2. Verified identity: Sign-in is handled by Firebase Authentication. The backend verifies the sign-in token on every request." },
      { type: "paragraph", content: "3. Role-based access: Access is controlled per project by roles (Owner, Admin, Member)." },
      { type: "paragraph", content: "4. One gateway: All traffic flows through one API gateway. Customers never connect directly to database servers." },
      { type: "paragraph", content: "5. Isolated customer space: Every customer runs in an isolated environment, with a private network, database authentication, and their own dedicated storage." },
      { type: "paragraph", content: "6. Private network: Databases live on a private, isolated network behind a firewall that blocks inbound connections by default." },
      { type: "paragraph", content: "7. Credentials and events: Credentials can be rotated from the dashboard. Lifecycle events for each database are recorded." },
      { type: "heading", id: "responsibility", level: 2, content: "Who is responsible for what" },
      { type: "table", headers: ["DBaaS", "You"], rows: [
        ["Platform infrastructure", "Choose strong passwords"],
        ["Network security", "Manage project members and roles"],
        ["Data isolation", "Rotate credentials when needed"]
      ]}
    ]
  },
  {
    slug: "roles-and-permissions",
    title: "Roles and permissions",
    description: "Understand what each role can do.",
    readTime: "2 min read",
    updatedAt: "Oct 4, 2026",
    category: "Security",
    headings: [
      { id: "permissions", title: "Permissions", level: 2 }
    ],
    blocks: [
      { type: "heading", id: "permissions", level: 2, content: "Permissions" },
      { type: "table", headers: ["Action", "Owner", "Admin", "Member"], rows: [
        ["View projects/databases/metrics", "Yes", "Yes", "Yes"],
        ["Create/update/delete databases", "Yes", "Yes", "No"],
        ["Start/stop/restart databases", "Yes", "Yes", "No"],
        ["Rotate credentials", "Yes", "Yes", "No"],
        ["Manage members", "Yes", "Yes", "No"],
        ["Manage billing", "Yes", "No", "No"],
        ["Delete project", "Yes", "No", "No"]
      ]}
    ]
  },
  {
    slug: "database-lifecycle",
    title: "Database lifecycle",
    description: "Understand the lifecycle of a database.",
    readTime: "2 min read",
    updatedAt: "Oct 4, 2026",
    category: "Guides",
    headings: [
      { id: "flow", title: "Lifecycle Flow", level: 2 },
      { id: "actions", title: "Lifecycle Actions", level: 2 }
    ],
    blocks: [
      { type: "heading", id: "flow", level: 2, content: "Lifecycle Flow" },
      { type: "steps", items: [
        "Request -> Accepted",
        "Platform works in the background",
        "State updates (e.g. provisioning, running, stopped)"
      ]},
      { type: "heading", id: "actions", level: 2, content: "Lifecycle Actions" },
      { type: "table", headers: ["Action", "Method", "Path", "Who", "Purpose"], rows: [
        ["Create", "POST", "/projects/:projectId/databases", "Admin/Owner", "Create a new database"],
        ["Start", "POST", "/projects/:projectId/databases/:databaseId/start", "Admin/Owner", "Start a stopped database"],
        ["Stop", "POST", "/projects/:projectId/databases/:databaseId/stop", "Admin/Owner", "Stop a running database"],
        ["Restart", "POST", "/projects/:projectId/databases/:databaseId/restart", "Admin/Owner", "Restart a running database"],
        ["Delete", "DELETE", "/projects/:projectId/databases/:databaseId", "Admin/Owner", "Delete a database"]
      ]}
    ]
  },
  {
    slug: "how-dbaas-works",
    title: "How DBaaS works",
    description: "A step-by-step walkthrough of the platform.",
    readTime: "3 min read",
    updatedAt: "Oct 4, 2026",
    category: "Guides",
    headings: [
      { id: "walkthrough", title: "Walkthrough", level: 2 }
    ],
    blocks: [
      { type: "heading", id: "walkthrough", level: 2, content: "Walkthrough" },
      { type: "steps", items: [
        "1. You sign in (Firebase)",
        "2. You create a project and invite your team",
        "3. You create a database and pick an engine (MongoDB, PostgreSQL or Qdrant)",
        "4. The platform checks your role and plan, then provisions an isolated space for it",
        "5. You manage and monitor it from the dashboard",
        "6. Your app reaches the database through the gateway, never directly"
      ]}
    ]
  },
  {
    slug: "plans-and-billing",
    title: "Plans and billing",
    description: "Understand how plans and billing work.",
    readTime: "2 min read",
    updatedAt: "Oct 4, 2026",
    category: "Guides",
    headings: [
      { id: "billing", title: "Billing Details", level: 2 }
    ],
    blocks: [
      { type: "heading", id: "billing", level: 2, content: "Billing Details" },
      { type: "paragraph", content: "Plans come from the pricing page. Before a database is created the platform checks your subscription and the resources your plan allows. Checkout is handled by Stripe. Subscriptions can be cancelled from the dashboard. Billing is managed by project Owners." }
    ]
  }
  ,
  {
    slug: "quickstart",
    title: "Quickstart",
    description: "Get up and running with DBaaS in less than 5 minutes.",
    readTime: "3 min read",
    updatedAt: "Oct 1, 2026",
    category: "Guides",
    headings: [
      { id: "create-account", title: "1. Create an account", level: 2 },
      { id: "provision-database", title: "2. Provision a database", level: 2 },
      { id: "connect", title: "3. Connect to your database", level: 2 }
    ],
    blocks: [
      { type: "paragraph", content: "Welcome to DBaaS! This guide will walk you through the process of setting up your first database cluster and connecting to it from your application." },
      { type: "heading", id: "create-account", level: 2, content: "1. Create an account" },
      { type: "paragraph", content: "If you haven't already, sign up for a free account. You'll get 1 GB of storage for free forever across any of our three engines (MongoDB, PostgreSQL, or Qdrant)." },
      { type: "callout", variant: "tip", content: "You can sign up using GitHub or Google for faster access." },
      { type: "heading", id: "provision-database", level: 2, content: "2. Provision a database" },
      { type: "paragraph", content: "Once logged in, click the **New Database** button in the top right corner of the dashboard." },
      { type: "steps", items: [
        "Select your preferred engine.",
        "Choose a region closest to your application servers.",
        "Select the 'Free' tier to get started.",
        "Click 'Create Cluster'."
      ]},
      { type: "paragraph", content: "Your cluster will take roughly 10-15 seconds to provision." },
      { type: "heading", id: "connect", level: 2, content: "3. Connect to your database" },
      { type: "paragraph", content: "Navigate to the 'Connection' tab in your cluster settings to retrieve your connection string. Make sure to replace `<password>` with the password you saved during creation." },
      { type: "code", language: "bash", filename: ".env", code: "DATABASE_URL=\"postgres://user:password@host.dbaas.com:5432/dbname?sslmode=require\"" },
      { type: "callout", variant: "warning", content: "Never commit your database credentials to version control. Always use environment variables." }
    ]
  },
  {
    slug: "connect-to-postgresql",
    title: "Connect to PostgreSQL",
    description: "Learn how to connect your application to your new PostgreSQL cluster.",
    readTime: "4 min read",
    updatedAt: "Sep 28, 2026",
    category: "PostgreSQL",
    headings: [
      { id: "connection-strings", title: "Connection Strings", level: 2 },
      { id: "using-prisma", title: "Using Prisma (Node.js)", level: 2 },
      { id: "pgbouncer", title: "Connection Pooling", level: 2 }
    ],
    blocks: [
      { type: "paragraph", content: "Our PostgreSQL clusters are fully compatible with standard drivers and ORMs. You can connect using the direct URL or through the built-in PgBouncer pooler." },
      { type: "heading", id: "connection-strings", level: 2, content: "Connection Strings" },
      { type: "table", headers: ["Type", "Port", "Use Case"], rows: [
        ["Direct", "5432", "Migrations, long-running scripts, direct terminal access"],
        ["Pooled (PgBouncer)", "6543", "Serverless functions, high-concurrency web servers"]
      ]},
      { type: "heading", id: "using-prisma", level: 2, content: "Using Prisma (Node.js)" },
      { type: "paragraph", content: "If you're using Prisma in a serverless environment (like Vercel or AWS Lambda), you should use the pooled connection string." },
      { type: "code", language: "prisma", filename: "schema.prisma", code: "datasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\") // Must end with ?pgbouncer=true\n}" },
      { type: "callout", variant: "note", content: "Remember to append `?pgbouncer=true` to the end of your connection URL when using Prisma with the pooled port (6543)." }
    ]
  },
  {
    slug: "create-first-qdrant-collection",
    title: "Create your first Qdrant collection",
    description: "Initialize a vector collection and insert your first semantic data.",
    readTime: "5 min read",
    updatedAt: "Sep 25, 2026",
    category: "Qdrant",
    headings: [
      { id: "overview", title: "Overview", level: 2 },
      { id: "create-collection", title: "Create a Collection", level: 2 },
      { id: "upsert-points", title: "Upsert Points", level: 2 }
    ],
    blocks: [
      { type: "paragraph", content: "In Qdrant, data is organized into 'Collections'. A collection is a set of points (vectors with an optional payload) among which you can search." },
      { type: "heading", id: "overview", level: 2, content: "Overview" },
      { type: "paragraph", content: "Before creating a collection, you need to know the dimensionality of the vectors you'll be storing. For example, OpenAI's `text-embedding-ada-002` produces vectors with 1536 dimensions." },
      { type: "heading", id: "create-collection", level: 2, content: "Create a Collection" },
      { type: "code", language: "python", filename: "main.py", code: "from qdrant_client import QdrantClient\nfrom qdrant_client.models import VectorParams, Distance\n\nclient = QdrantClient(url=\"https://qdrant.dbaas.com\", api_key=\"YOUR_API_KEY\")\n\nclient.create_collection(\n    collection_name=\"articles\",\n    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),\n)" },
      { type: "heading", id: "upsert-points", level: 2, content: "Upsert Points" },
      { type: "paragraph", content: "Now you can insert vectors along with JSON payloads." },
      { type: "code", language: "python", filename: "main.py", code: "from qdrant_client.models import PointStruct\n\nclient.upsert(\n    collection_name=\"articles\",\n    points=[\n        PointStruct(\n            id=1,\n            vector=[0.05, 0.61, 0.76, 0.74, ...], # 1536 floats\n            payload={\"title\": \"Intro to AI\", \"author\": \"Alice\"}\n        )\n    ]\n)" },
      { type: "callout", variant: "tip", content: "You can update existing points using the exact same `upsert` method. If a point with the given ID exists, it will be overwritten." }
    ]
  }
];

export const docsLandingData = {
  hero: {
    label: "// DOCUMENTATION",
    title: "Build with DBaaS",
  },
  quickstart: {
    steps: [
      {
        id: "create",
        title: "1. Create a database",
        desc: "Sign up and deploy a cluster in seconds. No credit card required.",
        code: {
          mongodb: "# Install the CLI\nnpm i -g dbaas-cli\n\n# Create a Mongo cluster\ndbaas create --engine mongodb my-cluster",
          postgresql: "# Install the CLI\nnpm i -g dbaas-cli\n\n# Create a Postgres cluster\ndbaas create --engine postgres my-cluster",
          qdrant: "# Install the CLI\nnpm i -g dbaas-cli\n\n# Create a Qdrant cluster\ndbaas create --engine qdrant my-cluster"
        }
      },
      {
        id: "connect",
        title: "2. Get connection string",
        desc: "Retrieve your secure credentials from the dashboard or CLI.",
        code: {
          mongodb: "$ dbaas config get-uri my-cluster\n\nmongodb+srv://admin:pass@my-cluster.dbaas.com/db",
          postgresql: "$ dbaas config get-uri my-cluster\n\npostgres://admin:pass@my-cluster.dbaas.com:5432/db",
          qdrant: "$ dbaas config get-uri my-cluster\n\nhttps://my-cluster.dbaas.com (Api-Key: pass)"
        }
      },
      {
        id: "code",
        title: "3. Connect from code",
        desc: "Use standard drivers to connect securely to your database.",
        code: {
          mongodb: "import { MongoClient } from 'mongodb';\n\nconst client = new MongoClient(process.env.DB_URI);\nawait client.connect();\nconsole.log('Connected!');",
          postgresql: "import { Client } from 'pg';\n\nconst client = new Client(process.env.DB_URI);\nawait client.connect();\nconsole.log('Connected!');",
          qdrant: "import { QdrantClient } from '@qdrant/js-client-rest';\n\nconst client = new QdrantClient({ url: process.env.DB_URI });\nconsole.log('Ready!');"
        }
      }
    ]
  },
  guides: [
    {
      engine: "MongoDB",
      color: "#3FCF6D",
      links: [
        { title: "Connect with Mongoose", slug: "connect-to-mongodb" },
        { title: "Setup Change Streams", slug: "connect-to-mongodb" },
        { title: "Index Optimization", slug: "connect-to-mongodb" },
        { title: "Migrating from Atlas", slug: "connect-to-mongodb" }
      ]
    },
    {
      engine: "PostgreSQL",
      color: "#4C8DFF",
      links: [
        { title: "Connect to PostgreSQL", slug: "connect-to-postgresql" },
        { title: "Connection Pooling with PgBouncer", slug: "connect-to-postgresql" },
        { title: "Setup pgvector", slug: "connect-to-postgresql" },
        { title: "Point-in-time Recovery", slug: "connect-to-postgresql" }
      ]
    },
    {
      engine: "Qdrant",
      color: "#FF4D8D",
      links: [
        { title: "Create your first collection", slug: "create-first-qdrant-collection" },
        { title: "Hybrid Search (BM25)", slug: "create-first-qdrant-collection" },
        { title: "Filtering with Payloads", slug: "create-first-qdrant-collection" },
        { title: "LangChain Integration", slug: "create-first-qdrant-collection" }
      ]
    }
  ],
  apiPreview: [
    {
      method: "GET",
      path: "/v1/databases",
      req: "curl -H \"Authorization: Bearer $TOKEN\" \\\n  https://api.dbaas.com/v1/databases",
      res: "{\n  \"data\": [\n    { \"id\": \"db_123\", \"engine\": \"postgres\", \"status\": \"active\" }\n  ]\n}"
    },
    {
      method: "POST",
      path: "/v1/databases",
      req: "curl -X POST https://api.dbaas.com/v1/databases \\\n  -H \"Authorization: Bearer $TOKEN\" \\\n  -d '{\"engine\":\"mongodb\", \"region\":\"us-east-1\"}'",
      res: "{\n  \"id\": \"db_456\",\n  \"status\": \"provisioning\"\n}"
    },
    {
      method: "DELETE",
      path: "/v1/databases/:id",
      req: "curl -X DELETE https://api.dbaas.com/v1/databases/db_123 \\\n  -H \"Authorization: Bearer $TOKEN\"",
      res: "{\n  \"deleted\": true,\n  \"id\": \"db_123\"\n}"
    },
    {
      method: "POST",
      path: "/v1/backups",
      req: "curl -X POST https://api.dbaas.com/v1/backups \\\n  -H \"Authorization: Bearer $TOKEN\" \\\n  -d '{\"database_id\":\"db_123\"}'",
      res: "{\n  \"id\": \"bkp_789\",\n  \"status\": \"in_progress\"\n}"
    },
    {
      method: "GET",
      path: "/v1/metrics",
      req: "curl -H \"Authorization: Bearer $TOKEN\" \\\n  https://api.dbaas.com/v1/metrics?db=db_123",
      res: "{\n  \"cpu\": 45.2,\n  \"connections\": 120,\n  \"qps\": 850\n}"
    },
    {
      method: "POST",
      path: "/v1/api-keys",
      req: "curl -X POST https://api.dbaas.com/v1/api-keys \\\n  -H \"Authorization: Bearer $TOKEN\" \\\n  -d '{\"name\":\"prod-key\"}'",
      res: "{\n  \"id\": \"key_abc\",\n  \"secret\": \"db_sk_...\"\n}"
    }
  ],
  sdks: [
    { name: "Node.js", icon: "📦", cmd: "npm install @dbaas/node" },
    { name: "Python", icon: "🐍", cmd: "pip install dbaas-client" },
    { name: "Go", icon: "🐹", cmd: "go get github.com/dbaas/go-sdk" },
    { name: "CLI", icon: "💻", cmd: "npm install -g dbaas-cli" },
    { name: "Terraform", icon: "🏗️", cmd: "terraform init" },
    { name: "REST API", icon: "🌐", cmd: "curl https://api.dbaas.com/v1" }
  ],
  popular: [
    { title: "Connection pooling explained", readTime: "4 min", category: "Concepts", slug: "quickstart" },
    { title: "How to setup VPC peering", readTime: "8 min", category: "Security", slug: "quickstart" },
    { title: "Zero-downtime migrations", readTime: "12 min", category: "Guides", slug: "quickstart" },
    { title: "Vector search vs Hybrid search", readTime: "6 min", category: "Concepts", slug: "create-first-qdrant-collection" },
    { title: "Automating backups via API", readTime: "5 min", category: "API", slug: "quickstart" },
    { title: "Managing IAM roles", readTime: "7 min", category: "Security", slug: "quickstart" }
  ]
};
