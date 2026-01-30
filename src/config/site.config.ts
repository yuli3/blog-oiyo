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
    googleAnalyticsId: "", 
  }
};

export type SiteConfig = typeof siteConfig;
