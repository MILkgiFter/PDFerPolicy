import { useState } from 'react'
import JSZip from 'jszip'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { countPdfPages, pdfPagesToJpegBlobs } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

export function PdfToJpgScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<number | null>(null)
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(0.86)
  const [busy, setBusy] = useState(false)

  const onPick = async (f: File | null) => {
    setFile(f)
    setPages(null)
    if (!f) return
    try {
      const n = await countPdfPages(f)
      setPages(n)
    } catch {
      pushToast(t('toast_pdf_read_fail'), 'error')
    }
  }

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      const blobs = await pdfPagesToJpegBlobs(file, scale, quality)
      const zip = new JSZip()
      blobs.forEach((blob, i) => zip.file(`page_${String(i + 1).padStart(3, '0')}.jpg`, blob))
      const zipped = await zip.generateAsync({ type: 'uint8array' })
      const stem = file.name.replace(/\.pdf$/i, '') || 'pages'
      await saveUint8Array(zipped, `${stem}_jpg.zip`, 'application/zip')
      pushToast(
        isNativeApp() ? t('toast_zip_jpeg_share', { count: blobs.length }) : t('toast_zip_jpeg', { count: blobs.length }),
        'success',
      )
      maybeShowInterstitialAfterExport()
    } catch (err) {
      pushToast(messageFromCaught(err, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm text-slate-400">{t('pdf_jpg_intro')}</p>

      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => void onPick(e.target.files?.[0] ?? null)} />
      </label>

      {pages !== null && (
        <p className="text-sm text-slate-300">
          {t('pdf_jpg_pages')} <span className="tabular-nums">{pages}</span>
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          {t('pdf_jpg_scale')} {scale.toFixed(2)}×
          <input type="range" min={1} max={3} step={0.05} value={scale} onChange={(e) => setScale(Number.parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          {t('pdf_jpg_quality')} {Math.round(quality * 100)}%
          <input type="range" min={0.55} max={0.95} step={0.01} value={quality} onChange={(e) => setQuality(Number.parseFloat(e.target.value))} />
        </label>
      </div>

      <button type="button" disabled={busy || !file} onClick={run} className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/35 disabled:cursor-not-allowed disabled:bg-slate-700">
        {busy ? t('pdf_jpg_busy') : t('pdf_jpg_run')}
      </button>
    </div>
  )
}
