export const locales = ['en', 'ko', 'ja', 'fr', 'es'] as const;
export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
  es: 'Español'
};

export const localePaths: Record<Locale, string> = {
  en: '',
  ko: '/ko',
  ja: '/ja',
  fr: '/fr',
  es: '/es'
};

// 번역 함수
export async function getTranslations(locale: Locale) {
  try {
    const translations = await import(`../locales/${locale}.json`);
    return translations.default;
  } catch (error) {
    // Fallback to English
    const translations = await import('../locales/en.json');
    return translations.default;
  }
}

// URL에서 현재 locale 추출
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0] as Locale;
  
  if (locales.includes(potentialLocale)) {
    return potentialLocale;
  }
  
  return 'en'; // Default fallback
}

// 언어별 URL 생성
export function getLocalizedPath(locale: Locale, path: string): string {
  const basePath = localePaths[locale];
  return `${basePath}${path}`;
}