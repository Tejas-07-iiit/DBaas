"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { motion } from "motion/react";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";

const CODE_TABS = [
  {
    language: "Node.js",
    langCode: "javascript",
    code: `import { connect } from '@dbaas/client';\n\n// Connect to global edge pooler\nconst db = await connect(process.env.DB_URL);\n\n// Query runs on the nearest replica\nconst users = await db.collection('users')\n  .find({ plan: 'pro' })\n  .limit(10);\n\nconsole.log(\`Found \${users.length} pro users\`);`
  },
  {
    language: "Python",
    langCode: "python",
    code: `from dbaas import connect\nimport os\n\n# Connect to global edge pooler\ndb = connect(os.getenv('DB_URL'))\n\n# Query runs on the nearest replica\nusers = db.collection('users').find(\n    {"plan": "pro"}\n).limit(10)\n\nprint(f"Found {len(list(users))} pro users")`
  },
  {
    language: "Go",
    langCode: "go",
    code: `package main\n\nimport (\n\t"fmt"\n\t"os"\n\t"github.com/dbaas/client-go"\n)\n\nfunc main() {\n\t// Connect to global edge pooler\n\tdb := client.Connect(os.Getenv("DB_URL"))\n\n\t// Query runs on the nearest replica\n\tusers := db.Collection("users").Find(\n\t\tclient.Filter{"plan": "pro"},\n\t).Limit(10)\n\n\tfmt.Printf("Found %d pro users\\n", len(users))\n}`
  },
  {
    language: "curl",
    langCode: "bash",
    code: `curl -X POST https://api.dbaas.com/v1/query \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -d '{\n    "collection": "users", \n    "action": "find",\n    "filter": { "plan": "pro" },\n    "limit": 10\n  }'`
  }
];

// Custom syntax theme using the brand palette
const customTheme = {
  plain: { color: "var(--text)", backgroundColor: "#05080F" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--muted)", fontStyle: "italic" as const } },
    { types: ["namespace"], style: { opacity: 0.7 } },
    { types: ["string", "attr-value"], style: { color: "#3FCF6D" } },
    { types: ["punctuation", "operator"], style: { color: "var(--muted)" } },
    { types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"], style: { color: "#FF4D8D" } },
    { types: ["atrule", "keyword", "attr-name", "selector"], style: { color: "var(--accent)" } },
    { types: ["function", "deleted", "tag"], style: { color: "#4C8DFF" } },
    { types: ["function-variable"], style: { color: "#FFB224" } },
    { types: ["tag", "selector", "keyword"], style: { color: "var(--accent)" } }
  ]
};

export default function CodeTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_TABS[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { title: "Create a cluster", desc: "Select your engine and region from the dashboard or CLI." },
    { title: "Connect with our SDK", desc: "Use a single connection string. We route you to the nearest edge." },
    { title: "Ship to production", desc: "You write code. We handle replication, backups, and autoscaling." }
  ];

  return (
    <Section className="bg-surface-2/20 border-y border-border">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          <div className="space-y-8 lg:pt-12">
            <SectionHeader 
              label="// DEVELOPER EXPERIENCE"
              title="Connect in seconds" 
              subtitle="Stop managing infrastructure. Build your app using our unified SDKs available in all major languages."
              className="mb-8"
            />
            
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-surface border border-accent flex items-center justify-center font-mono text-accent font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text mb-1">{step.title}</h3>
                    <p className="text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Card className="p-0 overflow-hidden bg-[#05080F] shadow-2xl">
              <div className="flex justify-between items-center bg-surface-2/80 border-b border-border px-4 pt-4">
                <div className="flex gap-4 relative">
                  {CODE_TABS.map((t, i) => (
                    <button
                      key={t.language}
                      onClick={() => setActiveTab(i)}
                      className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === i ? 'text-accent' : 'text-muted hover:text-text'}`}
                    >
                      {t.language}
                      {activeTab === i && (
                        <motion.div 
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleCopy} 
                  className="text-muted hover:text-accent p-2 pb-4 transition-colors flex items-center gap-1 text-xs font-mono"
                  aria-label="Copy code"
                >
                  {copied ? <><Check size={14} className="text-accent" /> Copied</> : <Copy size={14} />}
                </button>
              </div>
              
              <div className="p-6 overflow-x-auto text-sm font-mono leading-relaxed min-h-[300px]">
                <Highlight
                  theme={customTheme}
                  code={CODE_TABS[activeTab].code}
                  language={CODE_TABS[activeTab].langCode}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={className} style={style}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="table-row">
                          <span className="table-cell select-none opacity-30 text-right pr-6">{i + 1}</span>
                          <span className="table-cell">
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </Card>
          </div>
          
        </div>
      </Container>
    </Section>
  );
}
