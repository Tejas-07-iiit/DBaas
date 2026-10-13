import { ProductContent } from "./types";

export const qdrantContent: ProductContent = {
  id: "qdrant",
  name: "Qdrant",
  accentColor: "#FF4D8D",
  hero: {
    breadcrumb: "Product / Qdrant",
    h1Part1: "Search by ",
    h1Highlight: "meaning, not keywords.",
    subtext: "Qdrant stores vectors (numbers that represent meaning) so your apps can find similar items instantly. Built for AI chat, recommendations, and semantic search.",
    primaryCta: "Create a Qdrant database",
    secondaryCta: "Read the docs",
    trustChips: ["Rust-based engine", "High throughput", "Memory efficient"],
    codeExample: `// 1. Insert vector & payload
client.upsert(
  collection_name="articles",
  points=[
    PointStruct(
      id=1,
      vector=[0.05, 0.61, 0.76, 0.74],
      payload={"title": "Introduction to AI"}
    )
  ]
)

// 2. Search by meaning
client.search(
  collection_name="articles",
  query_vector=[0.04, 0.60, 0.70, 0.80],
  limit=3
)`
  },
  numbers: [
    { value: "Millions", label: "vectors per collection" },
    { value: "< 10 ms", label: "latency" },
    { value: "Hybrid", label: "keyword + vector" },
    { value: "1 GB", label: "free tier" }
  ],
  features: [
    {
      label: "// SPEED",
      title: "Fast similarity search",
      description: "Qdrant uses advanced HNSW indexing to find nearest neighbors across millions of high-dimensional vectors in milliseconds. Perfect for large-scale production workloads.",
      bullets: ["HNSW index algorithm", "SIMD hardware acceleration", "Memory-mapped files"]
    },
    {
      label: "// PRECISION",
      title: "Filtering with payloads",
      description: "Attach JSON payloads to your vectors and filter them during the search phase. This prevents 'empty result' problems that occur when filtering is applied after the vector search.",
      bullets: ["Pre-filtering guarantees results", "Support for geo-filtering", "Complex logical conditions"]
    },
    {
      label: "// RELEVANCE",
      title: "Hybrid search",
      description: "Combine semantic vector search with traditional keyword search (BM25) to get the best of both worlds. Perfect when users search for exact product names or SKUs.",
      bullets: ["Native sparse & dense vectors", "Reciprocal Rank Fusion (RRF)", "Customizable weights"]
    },
    {
      label: "// RAG",
      title: "Built for AI",
      description: "Easily build Retrieval-Augmented Generation (RAG) pipelines. Qdrant integrates natively with LangChain, LlamaIndex, OpenAI, and other modern AI frameworks.",
      bullets: ["Direct OpenAI integration", "LangChain & LlamaIndex ready", "Generative AI context engine"]
    }
  ],
  useCases: [
    {
      id: "rag",
      tabLabel: "AI chat & RAG",
      description: "Provide LLMs with accurate, up-to-date context. When a user asks a question, retrieve the most semantically relevant documents and feed them to the AI.",
      sampleDocument: `{\n  "id": "c1f7a...",\n  "vector": [0.1, -0.4, 0.9, ...],\n  "payload": {\n    "source": "manual.pdf",\n    "text": "To restart the router..."\n  }\n}`,
      why: "Why Qdrant: Sub-millisecond retrieval means your AI chat remains highly responsive."
    },
    {
      id: "recommend",
      tabLabel: "Recommendations",
      description: "Represent users and products as embeddings. Find products that share similar feature spaces to a user's past purchases or current browsing context.",
      sampleDocument: `{\n  "id": 9923,\n  "vector": [0.88, 0.12, ...],\n  "payload": {\n    "category": "Shoes",\n    "price": 120\n  }\n}`,
      why: "Why Qdrant: Payload filtering lets you recommend similar items 'in stock' and 'under $100'."
    },
    {
      id: "search",
      tabLabel: "Semantic site search",
      description: "Traditional search fails on synonyms. Semantic search understands that 'sneakers', 'trainers', and 'running shoes' mean the same thing.",
      sampleDocument: `{\n  "id": 441,\n  "vector": [0.55, 0.44, ...],\n  "payload": {\n    "title": "Nike Air Max"\n  }\n}`,
      why: "Why Qdrant: Hybrid search gracefully handles both semantic meaning and exact model numbers."
    },
    {
      id: "duplicates",
      tabLabel: "Duplicate detection",
      description: "Find near-duplicate images, texts, or audio files. Convert media into embeddings and query Qdrant for items closer than a specific distance threshold.",
      sampleDocument: `{\n  "id": "img_01",\n  "vector": [-0.1, 0.8, ...],\n  "payload": {\n    "hash": "a4b8..."\n  }\n}`,
      why: "Why Qdrant: Distance thresholds efficiently identify clusters of similar content."
    }
  ],
  codeSnippets: [
    {
      language: "Python",
      code: `from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

client = QdrantClient(url="https://qdrant.dbaas.com", api_key="API_KEY")

# Search for similar items
hits = client.search(
    collection_name="my_collection",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    limit=3
)

for hit in hits:
    print(hit.payload, "score:", hit.score)`
    },
    {
      language: "Node.js",
      code: `import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
    url: 'https://qdrant.dbaas.com',
    apiKey: 'API_KEY',
});

// Search for similar items
const searchResult = await client.search('my_collection', {
    vector: [0.2, 0.1, 0.9, 0.7],
    limit: 3,
});

console.log(searchResult);`
    },
    {
      language: "Go",
      code: `import (
    "context"
    "github.com/qdrant/go-client/qdrant"
)

client, _ := qdrant.NewClient(&qdrant.Config{
    Host:   "qdrant.dbaas.com",
    APIKey: "API_KEY",
})

// Search
results, _ := client.Query(context.Background(), &qdrant.QueryPoints{
    CollectionName: "my_collection",
    Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
    Limit:          func(i uint64) *uint64 { return &i }(3),
})`
    },
    {
      language: "curl",
      code: `curl -X POST https://qdrant.dbaas.com/collections/my_collection/points/search \\
  -H "Api-Key: API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vector": [0.2, 0.1, 0.9, 0.7],
    "limit": 3
  }'`
    }
  ],
  specs: {
    items: [
      { label: "Engine", value: "Qdrant (Rust)" },
      { label: "Index Types", value: "HNSW, Sparse (BM25)" },
      { label: "Distance Metrics", value: "Cosine, Dot Product, Euclidean, Manhattan" },
      { label: "High Availability", value: "Distributed consensus (Raft)" },
      { label: "Backups", value: "Automated snapshotting" },
      { label: "Storage", value: "Memmap / In-memory" }
    ],
    plans: [
      { name: "Free", limit: "1 GB", price: "$0/mo" },
      { name: "Pro", limit: "20 GB", price: "$49/mo" },
      { name: "Scale", limit: "Unlimited", price: "Custom" }
    ]
  },
  faq: [
    {
      q: "What is an embedding?",
      a: "An embedding is a long list of numbers (a vector) that represents the semantic meaning of text, images, or audio. AI models generate these vectors so that similar concepts have similar numbers."
    },
    {
      q: "Do I need to run my own embedding model?",
      a: "You can generate embeddings using APIs like OpenAI or Cohere, or run open-source models locally using libraries like HuggingFace or SentenceTransformers. You simply send the resulting numbers to Qdrant."
    },
    {
      q: "Does Qdrant store the original text?",
      a: "Yes, you can store the original text, metadata, and JSON properties alongside the vector as a 'Payload'. This allows you to retrieve the actual content immediately upon a successful search."
    },
    {
      q: "Is keyword search still necessary?",
      a: "Vector search excels at conceptual matching, but struggles with exact IDs or part numbers. Qdrant supports 'Hybrid Search' which combines sparse vectors (keyword matching) with dense vectors (meaning)."
    },
    {
      q: "How does filtering perform at scale?",
      a: "Qdrant performs 'pre-filtering' during the HNSW graph traversal. This guarantees that you get the requested number of results without the performance penalty of post-filtering."
    }
  ],
  pairItWith: [
    {
      id: "postgres",
      name: "PostgreSQL",
      reason: "Add PostgreSQL to store your highly structured relational business logic.",
      href: "/product/postgresql"
    },
    {
      id: "mongodb",
      name: "MongoDB",
      reason: "Add MongoDB for flexible content modeling and event streams.",
      href: "/product/mongodb"
    }
  ],
  closing: {
    text: "Ready to build intelligent applications?",
    cta: "Create a database"
  }
};
