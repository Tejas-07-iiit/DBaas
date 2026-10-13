"use client";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import Architecture from "@/components/sections/home/Architecture";
import { howItWorksSteps } from "@/data/howItWorks";

export default function AboutPage() {
  return (
    <div className="bg-bg min-h-screen pt-32 pb-24">
      <Container className="max-w-4xl text-center">
        <h1 className="text-5xl font-bold mb-6">How DBaaS Works</h1>
        <p className="text-xl text-muted mb-16">A step-by-step walkthrough of the platform.</p>
        
        <Architecture />

        <div className="mt-24 space-y-8 text-left max-w-2xl mx-auto">
          {howItWorksSteps.map((step, index) => (
            <div key={index} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
