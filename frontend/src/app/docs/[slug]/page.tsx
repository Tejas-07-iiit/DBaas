import { articles, sidebarNav } from "@/data/docs";
import { notFound } from "next/navigation";
import { DocsLayoutClient } from "./DocsLayoutClient";

export async function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default function DocArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find(a => a.slug === params.slug);
  
  if (!article) {
    // Return a generic layout for coming soon pages
    const genericArticle = {
      slug: params.slug,
      title: "Coming Soon",
      description: "This documentation page is currently being written.",
      readTime: "1 min read",
      updatedAt: "Today",
      category: "Drafts",
      headings: [],
      blocks: [
        { type: "paragraph", content: "We are working hard to complete this documentation. Please check back later!" }
      ]
    };
    return <DocsLayoutClient article={genericArticle as any} />;
  }

  return <DocsLayoutClient article={article} />;
}
