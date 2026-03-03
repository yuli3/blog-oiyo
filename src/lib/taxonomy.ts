export const ACADEMY_CATEGORIES = [
    "Accounting",
    "Economics",
    "Statistics",
    "Public Admin",
    "Law",
    "Business",
    "Financial Engineering",
    "AI Literacy",
    "Behavioral Economics",
    "Crypto",
    "Game Theory",
    "History",
    "Product Management",
    "Psychology",
    "Actuarial Science",
    "Computer Science",
    "Finance"
];

export const MAGAZINE_CATEGORIES = [
    "Mysticism",
    "Mythology",
    "Philosophy",
    "Insights",
    "Life & Spirit"
];

export function getTrack(category: string | undefined): "academy" | "magazine" {
    if (!category) return "magazine";
    if (ACADEMY_CATEGORIES.includes(category)) return "academy";
    return "magazine";
}
