/**
 * Centralized Route Management for ahoxy.com
 * Ensures consistent URL patterns and locale prefixing using Astro's i18n standards.
 */
import { getRelativeLocaleUrl } from "astro:i18n";

export const SUPPORTED_LOCALES = ["ko", "en", "ja"] as const;
export const supportLocales = SUPPORTED_LOCALES;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const routes = {
  /**
   * Home page for a given locale
   */
  home: (locale: string = "ko") => getRelativeLocaleUrl(locale, "/"),

  /**
   * Interactive Tool Islands (e.g., /ko/bmi)
   */
  tool: (id: string, locale: string = "ko") => getRelativeLocaleUrl(locale, `/${id}/`),

  /**
   * Informational Blog Posts (e.g., /ko/blog/about-bmi)
   */
  blog: (slug: string, locale: string = "ko") => getRelativeLocaleUrl(locale, `/blog/${slug}/`),

  /**
   * About page for a given locale
   */
  about: (locale: string = "ko") => getRelativeLocaleUrl(locale, "/about/"),

  /**
   * Education Landing Pages (e.g., /ko/education-business)
   */
  educationLanding: (category: string, locale: string = "ko") => {
    const sanitized = category.replace("education-", "").replace("-everywhere", "");
    return getRelativeLocaleUrl(locale, `/education-${sanitized}/`);
  },

  /**
   * Education Chapters (e.g., /ko/education-business/ch1)
   */
  educationChapter: (category: string, slug: string, locale: string = "ko") => {
    const sanitized = category.replace("education-", "").replace("-everywhere", "");
    const sanitizedSlug = slug.replace(".mdx", "").replace(".md", "");
    return getRelativeLocaleUrl(locale, `/education-${sanitized}/${sanitizedSlug}/`);
  },
};

/**
 * Standardizes content ID (filename) into a URL-friendly slug.
 * Removes locale suffixes and file extensions.
 */
export function sanitizeIdToSlug(id: string) {
  return id
    .replace(/\.(en|ko|ja)(.mdx|.md)?$/, "")
    .replace(/\.(mdx|md)$/, "")
    .replace(/(en|ko|ja)$/, "");
}

/**
 * Determines the tool ID for education content
 */
export function getEducationToolId(category: string) {
  const sanitized = category.replace("education-", "").replace("-everywhere", "");
  return `education-${sanitized}`;
}

/**
 * Helper to get the base path for a curriculum category
 */
export function getCurriculumSlug(category: string) {
  return category.replace("education-", "").replace("history-everywhere", "history");
}
