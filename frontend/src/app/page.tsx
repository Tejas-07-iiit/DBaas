/**
 * @file src/app/page.tsx
 * @description Marketing homepage for DBaaS.
 * Showcases the multi-engine database platform with interactive architecture,
 * live code snippets, interactive quiz, pricing summary, and FAQs.
 */

import Hero from "@/components/sections/home/Hero";
import Numbers from "@/components/sections/home/Numbers";
import ThreeDatabases from "@/components/sections/home/ThreeDatabases";
import Architecture from "@/components/sections/home/Architecture";
import CodeTabs from "@/components/sections/home/CodeTabs";
import Quiz from "@/components/sections/home/Quiz";
import UseCases from "@/components/sections/home/UseCases";
import FAQ from "@/components/sections/home/FAQ";
import { CtaBand } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col pt-[68px]">
      <Hero />
      <Numbers />
      <ThreeDatabases />
      <Architecture />
      <CodeTabs />
      <Quiz />
      <UseCases />
      <FAQ />
      <CtaBand />
    </main>
  );
}
