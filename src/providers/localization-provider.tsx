"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import en from "@/assets/l10n/en.json";
import tr from "@/assets/l10n/tr.json";

export type Language = "en" | "tr";
export type TranslationKey = keyof typeof en;
export type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  tr,
};
const storageKey = "gemini-qa-language";
const listeners = new Set<() => void>();
let sessionLanguage: Language | undefined;

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "tr";
}

function getLanguage(): Language {
  if (sessionLanguage) return sessionLanguage;
  try {
    return localStorage.getItem(storageKey) === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setLanguage(language: Language) {
  sessionLanguage = language;
  try {
    localStorage.setItem(storageKey, language);
  } catch (error) {
    console.warn("Could not save the language preference.", error);
  }
  listeners.forEach((listener) => listener());
}

const LocalizationContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
} | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<Language>(
    subscribe,
    getLanguage,
    () => "en",
  );
  const value = useMemo(() => {
    const t: Translate = (key, values) =>
      dictionaries[language][key].replace(
        /\{(\w+)\}/g,
        (placeholder, name: string) => String(values?.[name] ?? placeholder),
      );
    return { language, setLanguage, t };
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = value.t("appTitle");
  }, [language, value]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
}

export function fullLanguageName(language: Language): string {
  switch (language) {
    case "en":
      return "english";
    case "tr":
      return "turkish";
  }
}
