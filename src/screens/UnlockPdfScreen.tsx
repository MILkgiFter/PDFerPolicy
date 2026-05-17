import { useState } from 'react'
import { unlockPdfWithPassword } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { messageFromCaught } from '../i18n/formatError'

export function UnlockPdfScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await unlockPdfWithPassword(file, password)
      await saveUint8Array(out, 'unlocked.pdf', 'application/pdf')
      pushToast(isNativeApp() ? t('toast_unlock_done_share') : t('toast_unlock_done'), 'success')
      maybeShowInterstitialAfterExport()
    } catch (e) {
      pushToast(messageFromCaught(e, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm text-slate-400">{t('unlock_intro')}</p>
      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_encrypted')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-300">
        {t('unlock_pw_label')}
        <input
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
        />
      </label>
      <button type="button" disabled={busy || !file} onClick={run} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-700">
        {busy ? t('unlock_busy') : t('unlock_run')}
      </button>
    </div>
  )
}
