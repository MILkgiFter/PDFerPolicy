import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { watermarkPdf } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

export function WatermarkScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [opacity, setOpacity] = useState(0.33)
  const [angle, setAngle] = useState(-35)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    const trimmed = (text.trim() || t('watermark_default')).trim()
    if (!trimmed) {
      pushToast(t('toast_watermark_text'), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await watermarkPdf(file, trimmed, opacity, angle)
      await saveUint8Array(out, 'watermarked.pdf', 'application/pdf')
      pushToast(isNativeApp() ? t('toast_done_share') : t('toast_split_done'), 'success')
      maybeShowInterstitialAfterExport()
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
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        {t('watermark_text_label')}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('watermark_default')}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-rose-500/50"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        {t('watermark_opacity')} {opacity.toFixed(2)}
        <input
          type="range"
          min={0.1}
          max={0.7}
          step={0.01}
          value={opacity}
          onChange={(e) => setOpacity(Number.parseFloat(e.target.value))}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        {t('watermark_angle')} {angle}°
        <input type="range" min={-60} max={60} step={5} value={angle} onChange={(e) => setAngle(Number.parseInt(e.target.value, 10))} />
      </label>

      <button type="button" disabled={busy || !file} onClick={run} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-700">
        {busy ? t('watermark_busy') : t('watermark_run')}
      </button>
    </div>
  )
}
