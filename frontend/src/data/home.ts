/**
 * @file src/data/home.ts
 * @description Landing page marketing copy, metrics, database specs, code snippets, and FAQs.
 */

export const homeData = {
  hero: {
    label: "// DATABASE-AS-A-SERVICE",
    headingPart1: "One platform.",
    headingHighlight: "Three",
    headingPart3: "databases.",
    subtext: "Deploy MongoDB, PostgreSQL, and Qdrant in seconds. Scale infinitely without managing infrastructure.",
    primaryCTA: "Get started free",
    secondaryCTA: "View docs",
    marquee: ["Next.js", "Node", "Python", "Go", "Docker", "Containers", "LangChain", "Prisma", "Next.js", "Node", "Python", "Go", "Docker", "Containers", "LangChain", "Prisma"],
  },
  numbers: [
    { value: 2.8, suffix: "s", label: "average provision time (sample)" },
    { value: 99.99, suffix: "%", label: "uptime SLA (sample)" },
    { value: 3, suffix: " DBs", label: "1 dashboard (sample)" },
    { value: 4, suffix: "", label: "regions (sample)" },
  ],
  databases: [
    {
      id: "01",
      name: "MongoDB",
      color: "#00ED64",
      for: "For document data and rapid prototyping",
      benefits: ["Flexible JSON schema", "Native geospatial queries", "Instant auto-scaling"],
    },
    {
      id: "02",
      name: "PostgreSQL",
      color: "#336791",
      for: "For relational data and ACID compliance",
      benefits: ["Strict data integrity", "Complex joins & analytics", "Vector extension (pgvector)"],
    },
    {
      id: "03",
      name: "Qdrant",
      color: "#FF3366",
      for: "For AI apps and vector search",
      benefits: ["Ultra-fast similarity search", "High-dimensional vectors", "Hybrid keyword filtering"],
    }
  ],
  codeTabs: [
    {
      language: "Node.js",
      code: `import { connect } from '@dbaas/client';\n\nconst db = await connect(process.env.DB_URL);\nconst users = await db.collection('users').find({});\nconsole.log(users);`
    },
    {
      language: "Python",
      code: `from dbaas import connect\nimport os\n\ndb = connect(os.getenv('DB_URL'))\nusers = db.collection('users').find()\nprint(users)`
    },
    {
      language: "Go",
      code: `package main\n\nimport (\n\t"fmt"\n\t"github.com/dbaas/client-go"\n)\n\nfunc main() {\n\tdb := client.Connect(os.Getenv("DB_URL"))\n\tusers := db.Collection("users").Find()\n\tfmt.Println(users)\n}`
    },
    {
      language: "curl",
      code: `curl -X POST https://api.dbaas.com/v1/query \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -d '{"collection": "users", "action": "find"}'`
    }
  ],
  features: [
    { title: "Point-in-time recovery", description: "Rewind your database to any second in the last 7 days." },
    { title: "Autoscaling", description: "We monitor your CPU and RAM to automatically scale before you hit limits." },
    { title: "Real-time insights", description: "See every query, slow log, and connection drop in your dashboard." },
    { title: "Enterprise security", description: "VPC peering, single sign-on, and end-to-end encryption." },
    { title: "Powerful CLI", description: "Manage clusters right from your terminal without opening a browser." },
    { title: "One unified API", description: "Control Mongo, Postgres, and Qdrant through the same REST interface." },
  ],
  quiz: [
    {
      question: "What are you building?",
      options: ["A SaaS dashboard", "An AI agent", "An ecommerce store", "Internal tools"],
    },
    {
      question: "How is your data shaped?",
      options: ["Highly relational", "Unstructured JSON", "High-dimensional vectors", "Mixed"],
    },
    {
      question: "Do you need semantic search?",
      options: ["Yes, absolutely", "Maybe later", "No, just exact matches", "Not sure"],
    }
  ],
  pricing: {
    free: { name: "Free", price: 0, description: "For side projects and testing." },
    pro: { name: "Pro", price: 29, description: "For production applications." },
    scale: { name: "Scale", price: 199, description: "For high traffic workloads." }
  },
  useCases: [
    { title: "Startups", description: "Ship faster without a DevOps engineer." },
    { title: "AI Apps", description: "Store embeddings and metadata in one place." },
    { title: "Students", description: "Learn database fundamentals for free." },
    { title: "Agencies", description: "Manage client projects from one dashboard." }
  ],
  faq: [
    { question: "Is there a free plan?", answer: "Yes, our Free plan gives you 512MB of storage and shared compute, perfect for testing." },
    { question: "Can I migrate my data?", answer: "Absolutely. We offer zero-downtime migration tools for AWS, GCP, and Azure." },
    { question: "Where is data stored?", answer: "You can choose between AWS, GCP, and Azure in 14+ regions globally." },
    { question: "How are backups done?", answer: "We take continuous WAL backups so you can restore to any second in the last 7 days." },
    { question: "Can I use all three databases together?", answer: "Yes! A single project can have multiple clusters of different types." },
    { question: "What happens if I exceed limits?", answer: "On the Pro plan, we auto-scale your resources. On Free, connections are throttled." }
  ],
  finalCTA: {
    heading: "Ready to stop managing databases?",
    button: "Get started for free"
  }
};
