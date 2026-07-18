import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${siteConfig.name}.`,
};

export default function AboutPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <article className="prose prose-neutral prose-headings:font-medium prose-headings:tracking-tight">
          <h1>About {siteConfig.name}</h1>
          <p>
            Welcome to {siteConfig.name}. We curate quality products across collections designed to
            make browsing and buying effortless. Every item is chosen with care and backed by a
            commitment to customer satisfaction.
          </p>
          <p>
            Have a question about an order or a product? Reach out through our support channels and
            we will get back to you promptly.
          </p>
        </article>
      </Container>
    </Page>
  );
}
