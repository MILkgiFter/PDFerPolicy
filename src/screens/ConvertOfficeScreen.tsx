import { useState } from 'react'
import { openInSystemBrowser } from '../lib/openExternal'
import { hapticTap } from '../lib/native'
import { useI18n } from '../context/I18nContext'

const ROUTES = [
  { slug: 'pdf_to_word', labelKey: 'office_word' as const },
  { slug: 'pdf_to_excel', labelKey: 'office_excel' as const },
  { slug: 'pdf_to_powerpoint', labelKey: 'office_ppt' as const },
]

export function ConvertOfficeScreen() {
  const [opening, setOpening] = useState<string | null>(null)
  const { locale, t } = useI18n()
  const base = locale === 'ru' ? 'https://www.ilovepdf.com/ru/' : 'https://www.ilovepdf.com/'

  const open = async (slug: string) => {
    await hapticTap()
    setOpening(slug)
    try {
      await openInSystemBrowser(`${base}${slug}`)
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm leading-relaxed text-slate-400">{t('office_intro')}</p>
      <div className="flex flex-col gap-3">
        {ROUTES.map(({ slug, labelKey }) => {
          const label = t(labelKey)
          return (
            <button
              key={slug}
              type="button"
              disabled={opening !== null}
              onClick={() => void open(slug)}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-left text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {opening === slug ? t('office_opening') : t('office_button', { label })}
            </button>
          )
        })}
      </div>
    </div>
  )
}
