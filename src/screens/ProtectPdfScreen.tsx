import { useState } from 'react'
import { openInSystemBrowser } from '../lib/openExternal'
import { hapticTap } from '../lib/native'
import { useI18n } from '../context/I18nContext'

export function ProtectPdfScreen() {
  const [busy, setBusy] = useState(false)
  const { locale, t } = useI18n()
  const base = locale === 'ru' ? 'https://www.ilovepdf.com/ru/' : 'https://www.ilovepdf.com/'

  const open = async (path: string) => {
    await hapticTap()
    setBusy(true)
    try {
      await openInSystemBrowser(`${base}${path}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm leading-relaxed text-slate-400">{t('protect_intro')}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void open('protect-pdf')}
        className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
      >
        {busy ? t('protect_busy_dots') : t('protect_main_btn')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void open('unlock-pdf')}
        className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
      >
        {t('protect_alt_btn')}
      </button>
    </div>
  )
}
