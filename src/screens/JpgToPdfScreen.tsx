import { useState, type ChangeEventHandler } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { imagesToPdf } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

export function JpgToPdfScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const onPick: ChangeEventHandler<HTMLInputElement> = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    const noWebp = list.filter((f) => !(f.type.includes('webp') || f.name.toLowerCase().endsWith('.webp')))
    if (noWebp.length !== list.length) pushToast(t('toast_webp'), 'info')
    setFiles(noWebp)
    e.target.value = ''
  }

  const run = async () => {
    await hapticTap()
    if (!files.length) {
      pushToast(t('toast_pick_images'), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await imagesToPdf(files)
      await saveUint8Array(out, 'images.pdf', 'application/pdf')
      pushToast(isNativeApp() ? t('toast_jpg_done_share') : t('toast_jpg_done'), 'success')
      maybeShowInterstitialAfterExport()
    } catch (err) {
      pushToast(messageFromCaught(err, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm text-slate-400">{t('jpg_intro')}</p>
      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_images')}</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
      </label>

      <p className="text-sm text-slate-300">
        {t('jpg_selected')} <span className="tabular-nums text-white">{files.length}</span>
      </p>

      <button
        type="button"
        disabled={busy || !files.length}
        onClick={run}
        className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-700"
      >
        {busy ? t('jpg_busy') : t('jpg_build')}
      </button>
    </div>
  )
}
