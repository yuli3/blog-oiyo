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
  // §3 Intellectual Property — cross-link to the license page (2026-10-17 세운 결정)
  2: [{ label: "@@LICENSE@@", href: "@@LICENSE_HREF@@" }],
  // §9 Privacy — cross-link to the privacy page (locale-substituted)
  8: [{ label: "@@PRIVACY@@", href: "@@PRIVACY_HREF@@" }],
  // §12 Contact
  11: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
};

// License page (2026-10-17 세운 승인: company-brain/thinktank/site-license-2026-10-17.md).
// One canonical page for all OIYO sites; their footers link here.
const LICENSE_LINKS: LinkTable = {
  // §2 Text — CC BY-NC 4.0
  1: [{ label: "CC BY-NC 4.0", href: "https://creativecommons.org/licenses/by-nc/4.0/" }],
  // §3 Own data — CC BY 4.0
  2: [{ label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/" }],
  // §4 Trademarks excluded — CC BY 4.0 legal code §2(b)(2)
  3: [{ label: "CC BY 4.0 Legal Code", href: "https://creativecommons.org/licenses/by/4.0/legalcode" }],
  // §9 Contact
  8: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
};

/**
 * Links for a given legal doc + section index, with locale-dependent
 * placeholders resolved. `privacyLabel` is the translated "Privacy Policy"
 * string for the current locale (passed from the page so it stays localized).
 */
export function legalLinks(
  doc: "privacy" | "terms" | "license",
  sectionIndex: number,
  locale: Locale,
  privacyLabel: string,
  licenseLabel = "License",
): LegalLink[] {
  const table =
    doc === "privacy" ? PRIVACY_LINKS : doc === "license" ? LICENSE_LINKS : TERMS_LINKS;
  const entries = table[sectionIndex];
  if (!entries) return [];
  return entries.map((link) => ({
    label:
      link.label === "@@PRIVACY@@"
        ? privacyLabel
        : link.label === "@@LICENSE@@"
          ? licenseLabel
          : link.label,
    href:
      link.href === "@@PRIVACY_HREF@@"
        ? `/${locale}/privacy/`
        : link.href === "@@LICENSE_HREF@@"
          ? `/${locale}/license/`
          : link.href,
  }));
}
