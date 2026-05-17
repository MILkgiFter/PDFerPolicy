import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { compressPdfByRaster, lightenPdfSave } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

export function CompressScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'light' | 'deep'>('deep')
  const [scale, setScale] = useState(1.35)
  const [quality, setQuality] = useState(0.72)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      if (mode === 'light') {
        const out = await lightenPdfSave(file)
        await saveUint8Array(out, 'compressed_light.pdf', 'application/pdf')
        pushToast(isNativeApp() ? t('toast_done_share') : t('toast_light_done'), 'success')
      } else {
        const out = await compressPdfByRaster(file, { scale, jpegQuality: quality })
        await saveUint8Array(out, 'compressed_deep.pdf', 'application/pdf')
        pushToast(isNativeApp() ? t('toast_done_share') : t('toast_deep_done'), 'success')
      }
      maybeShowInterstitialAfterExport()
    } catch (err) {
      pushToast(messageFromCaught(err, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm leading-relaxed text-slate-400">{t('compress_intro')}</p>

      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === 'light' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
          onClick={() => setMode('light')}
        >
          {t('compress_light')}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === 'deep' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
          onClick={() => setMode('deep')}
        >
          {t('compress_deep')}
        </button>
      </div>

      {mode === 'deep' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            {t('compress_detail')} {scale.toFixed(2)}×
            <input
              type="range"
              min={1}
              max={2}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number.parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            {t('compress_jpeg_q')} {Math.round(quality * 100)}%
            <input
              type="range"
              min={0.45}
              max={0.92}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(Number.parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={busy || !file}
        onClick={run}
        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {busy ? t('compress_busy') : t('compress_run')}
      </button>
    </div>
  )
}
