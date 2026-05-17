import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppLocale, LocalePreference } from '../i18n/detectLocale'
import { detectAppLocale } from '../i18n/detectLocale'
import { dictionaries } from '../i18n/dictionaries'

type Params = Record<string, string | number>

function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  )
}

function get(dict: Record<string, string>, key: string): string {
  return dict[key] ?? key
}

const PREF_STORAGE_KEY = 'pdfer-locale-preference'
const LEGACY_OVERRIDE_KEY = 'pdfer-locale-override'

function readPreference(): LocalePreference {
  try {
    const v = localStorage.getItem(PREF_STORAGE_KEY)
    if (v === 'system' || v === 'en' || v === 'ru') return v
    const legacy = localStorage.getItem(LEGACY_OVERRIDE_KEY)
    if (legacy === 'en' || legacy === 'ru') return legacy
  } catch {
    /* ignore */
  }
  return 'system'
}

function writePreference(p: LocalePreference): void {
  try {
    localStorage.setItem(PREF_STORAGE_KEY, p)
    localStorage.removeItem(LEGACY_OVERRIDE_KEY)
  } catch {
    /* ignore */
  }
}

type I18nValue = {
  /** Итоговая локаль (учёт «как в системе» или явный EN/RU). */
  locale: AppLocale
  /** Текущий выбор пользователя в переключателе. */
  preference: LocalePreference
  /** `system` — следовать `detectAppLocale()`, иначе фиксированный язык. */
  setPreference: (p: LocalePreference) => void
  /** То же, что явный `setPreference('en'|'ru')`. */
  setLocale: (l: AppLocale) => void
  t: (key: string, params?: Params) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>(() => readPreference())
  const [systemRev, setSystemRev] = useState(0)

  useEffect(() => {
    const onLang = () => setSystemRev((n) => n + 1)
    window.addEventListener('languagechange', onLang)
    return () => window.removeEventListener('languagechange', onLang)
  }, [])

  const localeFromSystem = useMemo(() => detectAppLocale(), [systemRev])

  const locale = preference === 'system' ? localeFromSystem : preference

  const setPreference = useCallback((p: LocalePreference) => {
    writePreference(p)
    setPreferenceState(p)
  }, [])

  const setLocale = useCallback((l: AppLocale) => {
    writePreference(l)
    setPreferenceState(l)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
  }, [locale])

  const t = useCallback(
    (key: string, params?: Params) => {
      const raw = get(dictionaries[locale], key)
      return interpolate(raw, params)
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, preference, setPreference, setLocale, t }),
    [locale, preference, setPreference, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be inside I18nProvider')
  return ctx
}
