import type { Locale } from "./i18n";

/**
 * External / cross-page links for the legal pages.
 *
 * Kept in code (not in the locale JSON) so translators never touch URLs and the
 * rendered markup never needs `set:html`. Keyed by document and 0-based section
 * index; each entry renders as a "See:" line under that section's last paragraph.
 * Source of truth for the copy: company-brain/intent/faang-p0-batch-a.legal-master-en.md
 */

export interface LegalLink {
  label: string;
  href: string;
}

const CONTACT_EMAIL = "support@oiyo.net";

type LinkTable = Record<number, LegalLink[]>;

const PRIVACY_LINKS: LinkTable = {
  // §3 Google Analytics
  2: [
    {
      label: "Google Analytics Opt-out Browser Add-on",
      href: "https://tools.google.com/dlpage/gaoptout",
    },
  ],
  // §4 Google AdSense and Advertising
  3: [
    { label: "Google Ads Settings", href: "https://www.google.com/settings/ads" },
    { label: "aboutads.info", href: "https://optout.aboutads.info/" },
  ],
  // §8 Your Rights
  7: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
  // §11 Contact
  10: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
};

const TERMS_LINKS: LinkTable = {
  // §9 Privacy — cross-link to the privacy page (locale-substituted)
  8: [{ label: "@@PRIVACY@@", href: "@@PRIVACY_HREF@@" }],
  // §12 Contact
  11: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
};

/**
 * Links for a given legal doc + section index, with locale-dependent
 * placeholders resolved. `privacyLabel` is the translated "Privacy Policy"
 * string for the current locale (passed from the page so it stays localized).
 */
export function legalLinks(
  doc: "privacy" | "terms",
  sectionIndex: number,
  locale: Locale,
  privacyLabel: string,
): LegalLink[] {
  const table = doc === "privacy" ? PRIVACY_LINKS : TERMS_LINKS;
  const entries = table[sectionIndex];
  if (!entries) return [];
  return entries.map((link) => ({
    label: link.label === "@@PRIVACY@@" ? privacyLabel : link.label,
    href:
      link.href === "@@PRIVACY_HREF@@" ? `/${locale}/privacy/` : link.href,
  }));
}
