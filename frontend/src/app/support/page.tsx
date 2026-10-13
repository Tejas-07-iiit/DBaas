"use client";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Search } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="bg-bg min-h-screen pt-32 pb-24">
      <Container className="max-w-4xl text-center">
        <h1 className="text-5xl font-bold mb-6">Help Center</h1>
        <p className="text-xl text-muted mb-12">Find answers, documentation, and contact our team.</p>
        
        <div className="max-w-xl mx-auto mb-16 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search for help..." className="w-full bg-surface-2 border border-border rounded-full py-4 pl-12 pr-6 outline-none" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link href="/docs"><Card className="p-6 hover:border-accent cursor-pointer"><h3 className="font-bold">Documentation</h3></Card></Link>
          <Link href="/status"><Card className="p-6 hover:border-accent cursor-pointer"><h3 className="font-bold">System Status</h3></Card></Link>
          <Link href="/contact"><Card className="p-6 hover:border-accent cursor-pointer"><h3 className="font-bold">Contact Support</h3></Card></Link>
        </div>
      </Container>
    </div>
  );
}
