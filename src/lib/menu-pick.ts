import menuData, { type CountryType, type MenuItem } from '@/lib/menu-data';

export type MealMode = 'any' | 'lunch' | 'dinner';

const MEAL_TAG: Record<Exclude<MealMode, 'any'>, string> = {
  lunch: '점심',
  dinner: '저녁',
};

export function mealFromQuery(value: string | null): MealMode {
  if (value === 'lunch' || value === 'dinner' || value === 'any') return value;
  return 'any';
}

// Device-local hour only. No timezone lock and no location.
export function suggestedMeal(hour: number): Exclude<MealMode, 'any'> | null {
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  return null;
}

function hasTag(item: MenuItem, tag: string): boolean {
  return item.tags?.includes(tag) ?? false;
}

// 2026-09-30: 점메추/저메추 must stay inside the meal tag. An empty
// country×situation intersection used to fall back to the whole country
// pool, which served dinner dishes as lunch.
export function poolFor(country: CountryType, meal: MealMode, tag: string): MenuItem[] {
  const base = menuData[country];
  const source = base.length > 0 ? base : menuData.all;
  const situation = tag === 'all' || tag === '점심' || tag === '저녁' ? null : tag;

  if (meal === 'any') {
    const narrowed = situation ? source.filter((item) => hasTag(item, situation)) : source;
    if (narrowed.length > 0) return narrowed;
    if (source.length > 0) return source;
    return menuData.all;
  }

  const mealTag = MEAL_TAG[meal];
  const inMeal = (items: MenuItem[]) => items.filter((item) => hasTag(item, mealTag));
  const exact = situation ? inMeal(source).filter((item) => hasTag(item, situation)) : inMeal(source);
  if (exact.length > 0) return exact;
  const mealOnly = inMeal(source);
  if (mealOnly.length > 0) return mealOnly;
  return inMeal(menuData.all);
}

export type MapLink = { id: 'kakao' | 'naver' | 'google'; href: string };

export function mapSearchLinks(dish: string, placeWord: string, locale: string): MapLink[] {
  const q = encodeURIComponent(`${dish} ${placeWord}`.trim());
  const google: MapLink = {
    id: 'google',
    href: `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
  if (locale !== 'ko') return [google];
  return [
    { id: 'kakao', href: `https://map.kakao.com/link/search/${q}` },
    { id: 'naver', href: `https://map.naver.com/p/search/${q}` },
    google,
  ];
}
