"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How does the pricing work?",
    a: "Our pricing is consumption-based. You pay a base fee for the plan you select, which includes a generous amount of storage and compute. If you exceed the included limits, you pay a simple flat rate per GB of overage. No hidden IOPS or transfer fees."
  },
  {
    q: "Can I migrate from another provider?",
    a: "Yes! We provide zero-downtime migration tools for MongoDB and PostgreSQL. Simply connect your existing database to our replication agent, and we'll sync the data and handle the cutover when you're ready."
  },
  {
    q: "What regions do you support?",
    a: "We currently support 12 core regions across AWS and GCP, including US East, US West, Frankfurt, Singapore, and Sydney. The DBaaS Gateway automatically routes your connection to the nearest available edge node."
  },
  {
    q: "Is my data encrypted?",
    a: "Always. Data is encrypted at rest using AES-256 and in transit via TLS 1.3. On the Pro and Scale plans, you can bring your own KMS keys for full control over encryption."
  },
  {
    q: "How do backups work?",
    a: "Continuous physical backups (WAL streaming) are enabled by default. You can restore your database to any specific second in the last 7 days (Point-in-Time Recovery) with a single click."
  },
  {
    q: "Do you offer SLA guarantees?",
    a: "Yes, our Scale plan includes a financially backed 99.99% uptime SLA. We achieve this through multi-AZ replication and automated failover that takes less than 3 seconds."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <Section className="py-24 bg-surface-2/10">
      <Container>
        <SectionHeader 
          label="// QUESTIONS & ANSWERS" 
          title="Frequently asked" 
          subtitle="Everything you need to know about the product and billing."
          className="mb-12 text-center items-center"
        />
        
        <div className="max-w-3xl mx-auto space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div 
                key={i} 
                className={`border rounded-2xl transition-colors duration-300 ${isOpen ? "border-accent bg-surface-2/30" : "border-border bg-surface hover:bg-surface-2/50"}`}
              >
                <button 
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none"
                >
                  <span className={`font-bold text-lg transition-colors ${isOpen ? "text-accent" : "text-text"}`}>{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-muted shrink-0 ml-4">
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0 text-muted leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
