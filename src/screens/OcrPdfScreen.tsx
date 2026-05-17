import { useState } from 'react'
import { getDocument } from 'pdfjs-dist'
import { copyBytesFromFile } from '../lib/pdfToolkit'
import { ToolkitError } from '../lib/ToolkitError'
import { OCR_LANG_PRESETS } from '../lib/ocrLanguages'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { messageFromCaught } from '../i18n/formatError'

export function OcrPdfScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [scope, setScope] = useState<'first' | 'few'>('first')
  const [langPreset, setLangPreset] = useState(OCR_LANG_PRESETS[0].value)
  const [customLang, setCustomLang] = useState('rus+eng')
  const [useCustomLang, setUseCustomLang] = useState(false)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')

  const run = async () => {
    await hapticTap()
    if (!file) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    setBusy(true)
    setLog(t('ocr_log_loading'))
    try {
      const { createWorker } = await import('tesseract.js')
      const bytes = await copyBytesFromFile(file)
      const pdfTask = getDocument({ data: bytes })
      const pdf = await pdfTask.promise
      const langs = (useCustomLang ? customLang.trim() : langPreset) || 'eng'
      const worker = await createWorker(langs)

      const limit = scope === 'first' ? 1 : Math.min(6, pdf.numPages)
      const chunks: string[] = []

      for (let i = 1; i <= limit; i++) {
        setLog(t('ocr_log_page', { i, limit }))
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.65 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new ToolkitError('err_canvas')
        await page.render({ canvas, viewport }).promise

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new ToolkitError('err_canvas'))), 'image/png')
        })
        const {
          data: { text },
        } = await worker.recognize(blob)
        chunks.push(`${t('ocr_separator', { i })}\n${text.trim()}`)
      }

      await worker.terminate()
      pdf.destroy()

      const out = new TextEncoder().encode(chunks.join('\n\n'))
      const stem = file.name.replace(/\.pdf$/i, '') || 'scan'
      await saveUint8Array(out, `${stem}_ocr.txt`, 'text/plain;charset=utf-8')
      pushToast(isNativeApp() ? t('toast_ocr_saved_share') : t('toast_ocr_saved_file', { stem }), 'success')
      maybeShowInterstitialAfterExport()
      setLog(t('ocr_log_done'))
    } catch (e) {
      pushToast(messageFromCaught(e, t), 'error')
      setLog('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-4">
      <p className="text-sm text-slate-400">{t('ocr_intro')}</p>

      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          {t('ocr_langs')}
          <select
            value={langPreset}
            disabled={useCustomLang || busy}
            onChange={(e) => setLangPreset(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white disabled:opacity-40"
          >
            {OCR_LANG_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={useCustomLang} disabled={busy} onChange={(e) => setUseCustomLang(e.target.checked)} className="size-4 accent-cyan-600" />
          {t('ocr_custom_lang')}
        </label>
        {useCustomLang ? (
          <input
            type="text"
            value={customLang}
            disabled={busy}
            onChange={(e) => setCustomLang(e.target.value)}
            placeholder="rus+eng"
            autoComplete="off"
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600"
          />
        ) : null}
      </div>
      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${scope === 'first' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}
          onClick={() => setScope('first')}
        >
          {t('ocr_scope_1')}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${scope === 'few' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}
          onClick={() => setScope('few')}
        >
          {t('ocr_scope_6')}
        </button>
      </div>

      {log ? <p className="text-xs text-slate-500">{log}</p> : null}

      <button type="button" disabled={busy || !file} onClick={run} className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-700">
        {busy ? t('ocr_busy') : t('ocr_run')}
      </button>
    </div>
  )
}
