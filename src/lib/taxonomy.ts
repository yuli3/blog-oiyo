export type ContentTrack = "academy" | "magazine" | "interactive" | "education";

export const EDUCATION_CATEGORIES = [
  "Humanities",
  "Liberal Arts",
  "Health",
  "Engineering",
  "Education",
  "Mathematics",
  "Science",
] as const;

export const ACADEMY_CATEGORIES = [
  "Accounting",
  "Economics",
  "Statistics",
  "Public Admin",
  "Law",
  "Business",
  "Behavioral Economics",
  "Crypto",
  "History",
  "Product Management",
  "Psychology",
  "Actuarial Science",
  "Computer Science",
  "Finance",
  "Behavioral Science",
  "Nursing",
  "Medicine",
  "Art Psychotherapy",
  "Music History",
  "Zoology",
  "Technical Analysis",
  "Negotiation",
  "Advanced Bonds",
  "Real Estate",
  "Engineering",
  "Trade",
  "Social Welfare",
  "Photography",
  "Library Science",
] as const;

export const MAGAZINE_CATEGORIES = [
  "Philosophy",
  "Life & Spirit",
  "Personality",
  "Generational",
] as const;

export const INTERACTIVE_CATEGORIES = [
  "Tools",
] as const;

export function slugifyCategory(category: string): string {
  const slug = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error(
      `Category "${category}" has no canonical ASCII slug. Use the label from data/catalog/category-registry.yaml.`,
    );
  }

  return slug;
}

export function inferTrackFromCategory(category: string | undefined): ContentTrack {
  if (!category) return "magazine";
  if (EDUCATION_CATEGORIES.includes(category as (typeof EDUCATION_CATEGORIES)[number])) {
    return "education";
  }
  if (ACADEMY_CATEGORIES.includes(category as (typeof ACADEMY_CATEGORIES)[number])) {
    return "academy";
  }
  if (INTERACTIVE_CATEGORIES.includes(category as (typeof INTERACTIVE_CATEGORIES)[number])) {
    return "interactive";
  }
  return "magazine";
}

export function getTrack(
  category: string | undefined,
  explicitTrack?: ContentTrack | null,
): ContentTrack {
  return explicitTrack ?? inferTrackFromCategory(category);
}

export function getTrackFromData(data: {
  category?: string;
  track?: ContentTrack;
}): ContentTrack {
  return getTrack(data.category, data.track);
}

export function matchesTrack(
  data: { category?: string; track?: ContentTrack },
  targetTrack: ContentTrack,
): boolean {
  return getTrackFromData(data) === targetTrack;
}
