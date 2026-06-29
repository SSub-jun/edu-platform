'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultLocale, isSupportedLocale, type Locale } from './config';
import { messages } from './messages';

const STORAGE_KEY = 'edu-platform-locale';
const COOKIE_KEY = 'edu_locale';

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;

  const cookieLocale = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_KEY}=`))
    ?.split('=')[1];
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  return defaultLocale;
}

export function getStoredLocale(): Locale {
  return readInitialLocale();
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(readInitialLocale());
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setStoredLocale(nextLocale);
    setLocaleState(nextLocale);
  };

  return { locale, setLocale };
}

export function useT(locale: Locale) {
  return useMemo(() => {
    return (key: string) => messages[locale][key] ?? messages.ko[key] ?? key;
  }, [locale]);
}

