import { useState } from 'react'
import { lightenPdfSave } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { messageFromCaught } from '../i18n/formatError'

export function RepairPdfScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await lightenPdfSave(file)
      await saveUint8Array(out, 'repaired.pdf', 'application/pdf')
      pushToast(
        isNativeApp() ? t('toast_repair_done_share') : t('toast_repair_done_desktop'),
        'success',
      )
      maybeShowInterstitialAfterExport()
    } catch (e) {
      pushToast(messageFromCaught(e, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm text-slate-400">{t('repair_intro')}</p>
      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <button type="button" disabled={busy || !file} onClick={run} className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-700">
        {busy ? t('repair_busy') : t('repair_run')}
      </button>
    </div>
  )
}
