/**
 * Shared schema.org JSON-LD builders for tool/calculator pages (roadmap P2 #13).
 *
 * Every tool page hand-rolls the same FAQPage / HowTo / WebApplication /
 * BreadcrumbList objects. Import these helpers instead and pass plain data:
 *
 *   import { toolStructuredData } from "../../lib/seo/structured-data";
 *   const structuredData = toolStructuredData({
 *     name: m.title, description: m.description,
 *     steps: c.steps, faqs: c.faqs,
 *   });
 *   // <script type="application/ld+json" is:inline set:html={JSON.stringify(structuredData)} />
 *
 * Keeps schema markup consistent (and one place to fix) across the site.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

const CTX = "https://schema.org" as const;

export function faqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": CTX,
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function howToJsonLd(name: string, description: string, steps: string[]) {
  return {
    "@context": CTX,
    "@type": "HowTo",
    name,
    description,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
}

export function webApplicationJsonLd(opts: {
  name: string;
  description: string;
  url?: string;
  category?: string;
}) {
  return {
    "@context": CTX,
    "@type": "WebApplication",
    name: opts.name,
    description: opts.description,
    ...(opts.url ? { url: opts.url } : {}),
    applicationCategory: opts.category ?? "UtilityApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": CTX,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Build the standard array a tool page emits: HowTo (if steps) + FAQPage
 * (if faqs), plus optional WebApplication / BreadcrumbList.
 */
export function toolStructuredData(opts: {
  name: string;
  description: string;
  steps?: string[];
  faqs?: FaqItem[];
  url?: string;
  category?: string;
  breadcrumbs?: BreadcrumbItem[];
  webApplication?: boolean;
}) {
  const out: Record<string, unknown>[] = [];
  if (opts.webApplication) {
    out.push(webApplicationJsonLd({
      name: opts.name,
      description: opts.description,
      url: opts.url,
      category: opts.category,
    }));
  }
  if (opts.steps?.length) out.push(howToJsonLd(opts.name, opts.description, opts.steps));
  if (opts.faqs?.length) out.push(faqPageJsonLd(opts.faqs));
  if (opts.breadcrumbs?.length) out.push(breadcrumbJsonLd(opts.breadcrumbs));
  return out;
}
