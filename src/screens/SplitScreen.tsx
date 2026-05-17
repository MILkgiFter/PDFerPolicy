import { useState, type ChangeEventHandler } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { parsePageRanges, splitPdfByRanges, splitPdfEachPage } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'
import JSZip from 'jszip'

export function SplitScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'each' | 'ranges'>('each')
  const [rangesText, setRangesText] = useState('1-3, 5')
  const [busy, setBusy] = useState(false)

  const onPick: ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
  }

  const downloadZip = async (parts: Uint8Array[], baseName: string) => {
    const zip = new JSZip()
    parts.forEach((data, i) => zip.file(`${baseName}_${i + 1}.pdf`, data))
    const zipped = await zip.generateAsync({ type: 'uint8array' })
    await saveUint8Array(zipped, `${baseName}_parts.zip`, 'application/zip')
  }

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      const stem = file.name.replace(/\.pdf$/i, '') || 'document'
      if (mode === 'each') {
        const parts = await splitPdfEachPage(file)
        if (parts.length === 1) {
          await saveUint8Array(parts[0], `${stem}_page1.pdf`, 'application/pdf')
        } else {
          await downloadZip(parts, stem)
        }
        pushToast(
          parts.length === 1
            ? isNativeApp()
              ? t('toast_split_one_share')
              : t('toast_split_one')
            : isNativeApp()
              ? t('toast_zip_pdfs_share', { count: parts.length })
              : t('toast_zip_pdfs', { count: parts.length }),
          'success',
        )
        maybeShowInterstitialAfterExport()
      } else {
        const ranges = parsePageRanges(rangesText)
        const parts = await splitPdfByRanges(file, ranges)
        if (parts.length === 0) {
          pushToast(t('toast_split_no_ranges'), 'error')
          return
        }
        if (parts.length === 1) {
          await saveUint8Array(parts[0], `${stem}_split.pdf`, 'application/pdf')
        } else {
          await downloadZip(parts, stem)
        }
        pushToast(isNativeApp() ? t('toast_split_done_share') : t('toast_split_done'), 'success')
        maybeShowInterstitialAfterExport()
      }
    } catch (err) {
      pushToast(messageFromCaught(err, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={onPick} />
      </label>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === 'each' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
          onClick={() => setMode('each')}
        >
          {t('split_intro_each')}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === 'ranges' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
          onClick={() => setMode('ranges')}
        >
          {t('split_intro_ranges')}
        </button>
      </div>

      {mode === 'ranges' && (
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          {t('split_pages_label')}
          <textarea
            value={rangesText}
            onChange={(e) => setRangesText(e.target.value)}
            rows={3}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-rose-500/50"
            placeholder={t('split_placeholder')}
          />
        </label>
      )}

      <button
        type="button"
        disabled={busy || !file}
        onClick={run}
        className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {busy ? t('split_busy') : t('split_run')}
      </button>
    </div>
  )
}
