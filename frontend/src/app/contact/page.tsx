"use client";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [status, setStatus] = useState("idle");
  const handleSubmit = (e: any) => {
    e.preventDefault();
    setStatus("success");
  };

  return (
    <div className="bg-bg min-h-screen pt-32 pb-24">
      <Container className="max-w-4xl grid md:grid-cols-2 gap-12">
        <div>
          <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-muted mb-8">We would love to hear from you. Fill out the form or reach out directly.</p>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-1">Sales</h3>
              <p className="text-muted text-sm mb-2">Discuss custom enterprise plans.</p>
              <a href="mailto:sales@dbaas.example.com" className="text-accent">sales@dbaas.example.com</a>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold mb-1">Support</h3>
              <p className="text-muted text-sm mb-2">Technical assistance and troubleshooting.</p>
              <a href="mailto:support@dbaas.example.com" className="text-accent">support@dbaas.example.com</a>
            </Card>
          </div>
        </div>
        
        <Card className="p-8 bg-surface-2/30">
          {status === "success" ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="text-[#3FCF6D] mb-4 text-4xl">✓</div>
              <h3 className="text-xl font-bold mb-2">Message Sent</h3>
              <p className="text-muted">We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Name</label>
                <input required type="text" className="w-full bg-surface border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input required type="email" className="w-full bg-surface border border-border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Message</label>
                <textarea required rows={4} className="w-full bg-surface border border-border rounded-lg px-4 py-2" />
              </div>
              <Button type="submit" className="mt-4">Send Message</Button>
            </form>
          )}
        </Card>
      </Container>
    </div>
  );
}
