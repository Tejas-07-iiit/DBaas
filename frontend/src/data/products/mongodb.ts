import { ProductContent } from "./types";

export const mongodbContent: ProductContent = {
  id: "mongodb",
  name: "MongoDB",
  accentColor: "#3FCF6D",
  hero: {
    breadcrumb: "Product / MongoDB",
    h1Part1: "Documents that ",
    h1Highlight: "match how you think.",
    subtext: "Store flexible JSON-like documents with zero operational overhead. Perfect for catalogs, profiles, and apps that evolve fast.",
    primaryCta: "Create a MongoDB database",
    secondaryCta: "Read the docs",
    trustChips: ["Highly available", "Fully managed", "Secure by default"],
    codeExample: `// 1. Insert a document
db.products.insertOne({
  name: "Wireless Headphones",
  price: 120,
  inStock: true,
  rating: 4.8
});

// 2. Find it instantly
db.products.find({ price: { $lt: 150 } });`
  },
  numbers: [
    { value: "3 ms", label: "median read" },
    { value: "16 MB", label: "document size" },
    { value: "99.99%", label: "uptime SLA" },
    { value: "512 MB", label: "free tier" }
  ],
  features: [
    {
      label: "// SCHEMA",
      title: "Flexible schema",
      description: "Documents in the same collection don't need to have the same set of fields. Evolve your data model naturally as your app grows without running expensive migration scripts.",
      bullets: ["No downtime migrations", "Nested arrays and objects", "Optional JSON schema validation"]
    },
    {
      label: "// QUERY",
      title: "Indexes and aggregation",
      description: "Filter, group, and process data effortlessly. Build complex analytical pipelines directly in the database to return exactly what your UI needs.",
      bullets: ["Compound and geospatial indexes", "Powerful aggregation framework", "In-place updates"]
    },
    {
      label: "// AVAILABILITY",
      title: "Replica sets",
      description: "We deploy MongoDB in high-availability replica sets. If the primary node fails, a secondary takes over in seconds with no data loss.",
      bullets: ["Automatic failover", "Self-healing clusters", "Zero-downtime scaling"]
    },
    {
      label: "// REAL-TIME",
      title: "Change streams",
      description: "Listen to changes in your database in real-time. Trigger serverless functions, push notifications, or update dashboards the moment a document is inserted or modified.",
      bullets: ["Event-driven architecture", "Filter and route events", "Native pub/sub capabilities"]
    }
  ],
  useCases: [
    {
      id: "content",
      tabLabel: "Content & catalogs",
      description: "Products have diverse attributes. A t-shirt has 'size', while a laptop has 'RAM'. MongoDB handles this polymorphic data naturally.",
      sampleDocument: `{\n  "_id": "p_123",\n  "type": "laptop",\n  "name": "MacBook Pro",\n  "specs": {\n    "ram": "16GB",\n    "cpu": "M3"\n  }\n}`,
      why: "Why MongoDB: Nested objects eliminate the need for complex EAV tables or multiple JOINs."
    },
    {
      id: "profiles",
      tabLabel: "User profiles",
      description: "As you add new features, user profiles evolve. Add 'preferences', 'linked_accounts', or 'history' to any user document instantly.",
      sampleDocument: `{\n  "_id": "u_999",\n  "email": "user@example.com",\n  "preferences": {\n    "dark_mode": true,\n    "notifications": ["email"]\n  }\n}`,
      why: "Why MongoDB: Schema-less design means you don't need to ALTER TABLE every time requirements change."
    },
    {
      id: "iot",
      tabLabel: "IoT & events",
      description: "Ingest thousands of events per second. Group time-series data or logs into buckets for efficient storage and fast analytical queries.",
      sampleDocument: `{\n  "sensorId": "temp_01",\n  "timestamp": "2024-03-10T12:00:00Z",\n  "readings": [22.4, 22.5, 22.6]\n}`,
      why: "Why MongoDB: High write throughput and flexible arrays make it perfect for event logging."
    },
    {
      id: "mobile",
      tabLabel: "Mobile backends",
      description: "Mobile apps often rely on hierarchical JSON APIs. MongoDB maps perfectly to how mobile clients consume and send data.",
      sampleDocument: `{\n  "appVersion": "2.4.1",\n  "deviceId": "ios_xx11",\n  "syncState": {\n    "lastSync": "2024-03-09T...",\n    "pending": []\n  }\n}`,
      why: "Why MongoDB: Data is stored exactly as the API serves it, reducing mapping overhead."
    }
  ],
  codeSnippets: [
    {
      language: "Node.js",
      code: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();

const db = client.db("store");
const users = db.collection("users");

// Insert a user
await users.insertOne({ name: "Alice", status: "active" });

// Find active users
const activeUsers = await users.find({ status: "active" }).toArray();`
    },
    {
      language: "Python",
      code: `from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client.store
users = db.users

# Insert a user
users.insert_one({ "name": "Alice", "status": "active" })

# Find active users
active_users = list(users.find({ "status": "active" }))`
    },
    {
      language: "Go",
      code: `import (
    "context"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/bson"
)

client, _ := mongo.Connect(ctx, options.Client().ApplyURI(uri))
users := client.Database("store").Collection("users")

// Insert a user
users.InsertOne(ctx, bson.M{"name": "Alice", "status": "active"})

// Find active users
cursor, _ := users.Find(ctx, bson.M{"status": "active"})`
    },
    {
      language: "curl",
      code: `curl -X POST https://api.dbaas.com/v1/mongo/query \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "collection": "users",
    "filter": { "status": "active" }
  }'`
    }
  ],
  specs: {
    items: [
      { label: "Versions", value: "MongoDB 6.0, 7.0" },
      { label: "Regions", value: "AWS, GCP, Azure (12+ regions)" },
      { label: "Max connections", value: "Up to 10,000" },
      { label: "Storage Engine", value: "WiredTiger" },
      { label: "Backups", value: "Daily automated + Point-in-time" },
      { label: "Encryption", value: "At rest and in transit (TLS 1.3)" }
    ],
    plans: [
      { name: "Free", limit: "512 MB", price: "$0/mo" },
      { name: "Pro", limit: "50 GB", price: "$29/mo" },
      { name: "Scale", limit: "Unlimited", price: "Custom" }
    ]
  },
  faq: [
    {
      q: "Is this genuine MongoDB or a compatible layer?",
      a: "We run genuine MongoDB Enterprise under the hood, giving you 100% compatibility with all official MongoDB drivers and tools."
    },
    {
      q: "How does scaling work?",
      a: "You can seamlessly scale up your cluster's CPU and RAM without downtime. For massive datasets, we support horizontal sharding."
    },
    {
      q: "Are replica sets included in the free tier?",
      a: "The free tier uses a single-node deployment suitable for development. All paid plans include a 3-node replica set by default."
    },
    {
      q: "Can I use Mongoose with this?",
      a: "Absolutely. Any ODM or driver that works with MongoDB will work perfectly with our platform. Just drop in your connection string."
    },
    {
      q: "Do you support Vector Search?",
      a: "Yes, our MongoDB deployments support standard indexing. For heavy vector workloads, we recommend pairing it with our Qdrant engine."
    }
  ],
  pairItWith: [
    {
      id: "postgres",
      name: "PostgreSQL",
      reason: "Add PostgreSQL for strict transactional consistency like orders and payments.",
      href: "/product/postgresql"
    },
    {
      id: "qdrant",
      name: "Qdrant",
      reason: "Add Qdrant for blazing-fast semantic search and AI recommendations.",
      href: "/product/qdrant"
    }
  ],
  closing: {
    text: "Ready to build with documents?",
    cta: "Create a database"
  }
};
