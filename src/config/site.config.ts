export const OIYO_URL = 'https://oiyo.net';
export const BLOG_URL = 'https://blog.oiyo.net';
export const GAME_URL = 'https://game.oiyo.net';

export const siteConfig = {
  name: "Oiyo",
  title: "Oiyo Blog",
  description: "Practical guides for Korean professional certifications, careers, taxes, and AI tools — with free interactive tests, calculators, and games.",
  url: "https://blog.oiyo.net",
  author: "Oiyo Team",
  locale: "en",
  locales: ["en", "ko", "ja", "fr", "es", "zh"],
  themeColor: "#65a30d",
  features: {
    scrollSnap: false,
    pagination: true,
  },
  // 실존하는 공식 계정이 생기면 채울 것 (가짜 링크 금지). 현재 미운영.
  socials: {
    github: null as string | null,
    twitter: null as string | null,
    linkedin: null as string | null,
  },
  seo: {
    twitterHandle: null as string | null, // 실존 계정 생기면 채울 것
    ogImage: null,
    organization: {
      // 3사(oiyo.net/blog/wiki) 공유 canonical 발행자 — 단일 @id로 권위 통합
      id: "https://oiyo.net/#organization",
      name: "Oiyo",
      canonicalUrl: "https://oiyo.net",
      logo: "https://oiyo.net/icon-512.png",
      // sameAs: 실존하는 외부 공식 프로필이 생기면 추가(가짜 링크는 E-E-A-T에 해로움). 결속은 공유 @id가 담당.
      sameAs: [] as string[]
    }
  },
  analytics: {
    googleAnalyticsId: "G-915L6V38X6",
    googleAdsenseId: "ca-pub-9541920090543312",
  },
  // Hand-placed AdSense units that run alongside Auto ads (세운 2026-10-06, 2-week trial on
  // blog first). enabled:false removes every unit; an empty slot id removes that one spot.
  // Ids are the ad units created in AdSense on 2026-10-06. See components/ads/ManualAds.astro.
  manualAds: {
    enabled: true,
    slots: {
      articleMid: "4081985236", // oiyo-blog-article-mid (in-article)
      articleEnd: "2768903568", // oiyo-blog-article-end (display, responsive)
      toolResult: "4737600514", // oiyo-blog-tool-result (display, responsive)
    },
    // A mid-article unit only in articles long enough to have a middle.
    midArticleMinHeadings: 4,
  },
  newsletter: {
    // Set to your Buttondown account slug to enable API subscription, or null to use mailto fallback
    buttondownUsername: null as string | null,
    fallbackEmail: "support@oiyo.net",
  }
};

export type SiteConfig = typeof siteConfig;
