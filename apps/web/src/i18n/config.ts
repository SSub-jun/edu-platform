export const supportedLocales = ['ko', 'en', 'th', 'bn'] as const;

export type Locale = (typeof supportedLocales)[number];

export const localeLabels: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  th: 'ไทย',
  bn: 'বাংলা',
};

export const defaultLocale: Locale = 'ko';

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

