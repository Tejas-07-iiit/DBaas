// navigation.ts
// ─────────────────────────────────────────────────────────
// All navbar links, mega-menu content, and dropdown items.
// To change a link: just find it here and edit the text or href.
// ─────────────────────────────────────────────────────────

// Main nav links shown at the top
export const mainNavLinks = [
  { label: "Product",   href: "/product",   hasMega: true,  hasDropdown: false },
  { label: "Features",  href: "/features",  hasMega: false, hasDropdown: false },
  { label: "Docs",      href: "/docs",      hasMega: false, hasDropdown: false },
  { label: "Pricing",   href: "/pricing",   hasMega: false, hasDropdown: false },
  { label: "Status",    href: "/status",    hasMega: false, hasDropdown: false },
] as const;

// The three database cards shown inside the Product mega-menu
export const productDatabases = [
  {
    id:       "mongodb",
    name:     "MongoDB",
    tagline:  "Documents that match how you think",
    desc:     "Store flexible JSON-like data. No fixed schema. Perfect for apps that evolve quickly.",
    color:    "#3FCF6D",
    href:     "/product/mongodb",
  },
  {
    id:       "postgres",
    name:     "PostgreSQL",
    tagline:  "Relational data, zero ops",
    desc:     "The gold standard database. Tables, joins, ACID transactions — fully managed.",
    color:    "#4C8DFF",
    href:     "/product/postgresql",
  },
  {
    id:       "qdrant",
    name:     "Qdrant",
    tagline:  "Vector search for AI apps",
    desc:     "Store and search embeddings. Find similar content by meaning, not just keywords.",
    color:    "#FF4D8D",
    href:     "/product/qdrant",
  },
] as const;

// Small links shown below the database cards in the mega-menu
export const productPlatformLinks: {label: string, href: string}[] = [];
