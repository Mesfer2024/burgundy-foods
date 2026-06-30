"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCopy, type Locale } from "@/lib/copy";

type Theme = "light" | "dark";

type LocaleThemeContextValue = {
  locale: Locale;
  theme: Theme;
  isArabic: boolean;
  text: ReturnType<typeof getCopy>;
  toggleLocale: () => void;
  toggleTheme: () => void;
};

const LocaleThemeContext = createContext<LocaleThemeContextValue | null>(null);
const localeKey = "burgundy-locale";
const themeKey = "burgundy-theme";
const preferenceEvent = "burgundy-preference-change";
const legacyLocaleKey = "burgandy-locale";
const legacyThemeKey = "burgandy-theme";

function migrateLegacyKey(legacy: string, current: string): string | null {
  if (typeof window === "undefined") return null;
  const legacyValue = window.localStorage.getItem(legacy);
  if (legacyValue === null) return null;
  if (window.localStorage.getItem(current) === null) {
    window.localStorage.setItem(current, legacyValue);
  }
  window.localStorage.removeItem(legacy);
  return legacyValue;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(localeKey) ?? migrateLegacyKey(legacyLocaleKey, localeKey);
  return stored === "ar" || stored === "en" ? stored : "ar";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(themeKey) ?? migrateLegacyKey(legacyThemeKey, themeKey);
  return stored === "light" || stored === "dark" ? stored : "light";
}

export function LocaleThemeProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const sync = () => {
      setLocale(readStoredLocale());
      setTheme(readStoredTheme());
    };
    // Initial sync after mount picks up persisted preferences without
    // creating an SSR/CSR mismatch (server always renders default ar/light).
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(preferenceEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(preferenceEvent, sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleLocale = useCallback(() => {
    const current = (window.localStorage.getItem(localeKey) === "en" ? "en" : "ar") as Locale;
    const next: Locale = current === "ar" ? "en" : "ar";
    window.localStorage.setItem(localeKey, next);
    setLocale(next);
    window.dispatchEvent(new Event(preferenceEvent));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = (window.localStorage.getItem(themeKey) === "dark" ? "dark" : "light") as Theme;
    const next: Theme = current === "light" ? "dark" : "light";
    window.localStorage.setItem(themeKey, next);
    setTheme(next);
    window.dispatchEvent(new Event(preferenceEvent));
  }, []);

  const value = useMemo<LocaleThemeContextValue>(
    () => ({
      locale,
      theme,
      isArabic: locale === "ar",
      text: getCopy(locale),
      toggleLocale,
      toggleTheme,
    }),
    [locale, theme, toggleLocale, toggleTheme],
  );

  return <LocaleThemeContext.Provider value={value}>{children}</LocaleThemeContext.Provider>;
}

export function useLocaleTheme() {
  const context = useContext(LocaleThemeContext);
  if (!context) {
    throw new Error("useLocaleTheme must be used within LocaleThemeProvider");
  }
  return context;
}
