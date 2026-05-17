export type AppLocale = 'en' | 'ru'

export type LocalePreference = 'system' | AppLocale

/** Коды регионов постсоветского пространства: при сборке приложения русский интерфейс по умолчанию для этого региона. */
const CIS_REGIONS = new Set([
  'RU',
  'BY',
  'KZ',
  'KG',
  'TJ',
  'TM',
  'UZ',
  'AM',
  'AZ',
  'MD',
  'UA',
  'GE',
])

/** Языки, для которых в приложении выбирается русская локаль как запасная к региону. */
const CIS_LANG_PREFIXES = ['be', 'kk', 'ky', 'tg', 'tk', 'uz', 'hy', 'az', 'mo']

/**
 * По умолчанию — английский. Русский, если язык системы ru* или регион СНГ/связанный язык.
 */
export function detectAppLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en'
  const list = navigator.languages?.length ? [...navigator.languages] : [navigator.language]
  for (const raw of list) {
    const tag = raw.replace(/_/g, '-')
    const lower = tag.toLowerCase()
    const parts = lower.split('-')
    const lang = parts[0] ?? ''
    const region = parts[1]?.toUpperCase()
    if (lang.startsWith('ru')) return 'ru'
    if (region && CIS_REGIONS.has(region)) return 'ru'
    if (CIS_LANG_PREFIXES.some((p) => lang === p)) return 'ru'
  }
  return 'en'
}
