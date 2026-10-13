export interface ProductContent {
  id: string;
  name: string;
  accentColor: string;
  hero: {
    breadcrumb: string;
    h1Part1: string;
    h1Highlight: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
    trustChips: string[];
    codeExample: string;
  };
  numbers: {
    value: string;
    label: string;
  }[];
  features: {
    label: string;
    title: string;
    description: string;
    bullets: string[];
  }[];
  useCases: {
    id: string;
    tabLabel: string;
    description: string;
    sampleDocument: string;
    why: string;
  }[];
  codeSnippets: {
    language: string;
    code: string;
  }[];
  specs: {
    items: { label: string; value: string }[];
    plans: { name: string; limit: string; price: string }[];
  };
  faq: {
    q: string;
    a: string;
  }[];
  pairItWith: {
    id: string;
    name: string;
    reason: string;
    href: string;
  }[];
  closing: {
    text: string;
    cta: string;
  };
}
