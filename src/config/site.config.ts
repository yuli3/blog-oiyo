export const siteConfig = {
  name: "Oiyo",
  title: "Oiyo Blog",
  description: "Engineering the Future with Astro, MDX, and Cloudflare Pages. FAANG-level precision and performance.",
  url: "https://blog.oiyo.net",
  author: "Oiyo Team",
  locale: "en",
  locales: ["en", "ko", "ja", "fr", "es"],
  themeColor: "#10b981", // Emerald/Green
  features: {
    scrollSnap: false,
    toc: true,
    pagination: true,
  },
  socials: {
    github: "https://github.com/oiyo-net",
    twitter: "https://twitter.com/oiyo_net",
    linkedin: "https://linkedin.com/company/oiyo",
  },
  seo: {
    twitterHandle: "@oiyo_net",
    ogImage: "/og-image.png",
    organization: {
      name: "Oiyo Tech",
      logo: "/logo.svg",
      sameAs: [
        "https://github.com/oiyo-net",
        "https://twitter.com/oiyo_net"
      ]
    }
  },
  analytics: {
    googleAnalyticsId: "G-915L6V38X6",
    googleAdsenseId: "ca-pub-9541920090543312",
  },
  newsletter: {
    // Set to your Buttondown account slug to enable API subscription, or null to use mailto fallback
    buttondownUsername: null as string | null,
    fallbackEmail: "support@oiyo.net",
  }
};

export type SiteConfig = typeof siteConfig;
