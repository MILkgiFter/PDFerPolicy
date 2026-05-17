import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Save,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { copyBytesFromFile, drawImageOnPdfPage, drawTextOnPdfPage } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { messageFromCaught } from '../i18n/formatError'

const MAX_UNDO = 24

type Tab = 'text' | 'image'

export function EditPdfScreen() {
  const { pushToast } = useToast()
  const { t: tr } = useI18n()
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [past, setPast] = useState<Uint8Array[]>([])
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('text')

  const [numPages, setNumPages] = useState(0)
  const [workPage, setWorkPage] = useState(1)
  const [zoom, setZoom] = useState(1)

  const previewWrapRef = useRef<HTMLDivElement>(null)
  const [previewW, setPreviewW] = useState(320)

  const [text, setText] = useState('')
  const [tx, setTx] = useState(72)
  const [tyBottom, setTyBottom] = useState(72)
  const [fontSize, setFontSize] = useState(14)

  const [imgFile, setImgFile] = useState<File | null>(null)
  const [ix, setIx] = useState(72)
  const [iyBottom, setIyBottom] = useState(200)
  const [imgWidthPt, setImgWidthPt] = useState(180)

  const previewUrl = useMemo(() => {
    if (!pdfBytes) return null
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }, [pdfBytes])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const shownPage = numPages > 0 ? Math.min(Math.max(1, workPage), numPages) : Math.max(1, workPage)
  useLayoutEffect(() => {
    const el = previewWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setPreviewW(Math.max(160, el.clientWidth - 16))
    })
    ro.observe(el)
    setPreviewW(Math.max(160, el.clientWidth - 16))
    return () => ro.disconnect()
  }, [previewUrl])

  const pageWidth = Math.max(80, Math.floor(previewW * zoom))

  const loadPdfFile = useCallback(
    async (f: File | null) => {
      await hapticTap()
      if (!f) return
      try {
        const b = await copyBytesFromFile(f)
        setPast([])
        setPdfBytes(b)
        setWorkPage(1)
        setNumPages(0)
        pushToast(tr('toast_pdf_loaded_sidebar'), 'success')
      } catch (e) {
        pushToast(messageFromCaught(e, tr), 'error')
      }
    },
    [pushToast, tr],
  )

  const snapshotBeforeEdit = useCallback(() => {
    if (!pdfBytes) return
    setPast((p) => [...p.slice(-(MAX_UNDO - 1)), pdfBytes.slice()])
  }, [pdfBytes])

  const undo = useCallback(async () => {
    await hapticTap()
    if (past.length === 0) {
      pushToast(tr('toast_nothing_undo'), 'info')
      return
    }
    const prev = past[past.length - 1]
    setPast((p) => p.slice(0, -1))
    setPdfBytes(prev.slice())
    pushToast(tr('undo_step'), 'info')
  }, [past, pushToast, tr])

  const applyText = useCallback(async () => {
    await hapticTap()
    if (!pdfBytes) {
      pushToast(tr('toast_pick_pdf'), 'error')
      return
    }
    const line = text.trim()
    if (!line) {
      pushToast(tr('toast_enter_text'), 'error')
      return
    }
    setBusy(true)
    try {
      snapshotBeforeEdit()
      const next = await drawTextOnPdfPage(pdfBytes, shownPage - 1, line, {
        x: tx,
        yFromBottom: tyBottom,
        fontSize,
      })
      setPdfBytes(next)
      pushToast(tr('toast_text_added'), 'success')
    } catch (e) {
      setPast((p) => p.slice(0, -1))
      pushToast(messageFromCaught(e, tr), 'error')
    } finally {
      setBusy(false)
    }
  }, [pdfBytes, text, shownPage, tx, tyBottom, fontSize, snapshotBeforeEdit, pushToast, tr])

  const applyImage = useCallback(async () => {
    await hapticTap()
    if (!pdfBytes) {
      pushToast(tr('toast_pick_pdf'), 'error')
      return
    }
    if (!imgFile) {
      pushToast(tr('toast_pick_jpgpng'), 'error')
      return
    }
    setBusy(true)
    try {
      snapshotBeforeEdit()
      const next = await drawImageOnPdfPage(pdfBytes, shownPage - 1, imgFile, {
        x: ix,
        yFromBottom: iyBottom,
        widthPt: imgWidthPt > 0 ? imgWidthPt : undefined,
      })
      setPdfBytes(next)
      pushToast(tr('toast_image_added'), 'success')
    } catch (e) {
      setPast((p) => p.slice(0, -1))
      pushToast(messageFromCaught(e, tr), 'error')
    } finally {
      setBusy(false)
    }
  }, [pdfBytes, imgFile, shownPage, ix, iyBottom, imgWidthPt, snapshotBeforeEdit, pushToast, tr])

  const exportPdf = useCallback(async () => {
    await hapticTap()
    if (!pdfBytes) {
      pushToast(tr('toast_no_doc'), 'error')
      return
    }
    setBusy(true)
    try {
      await saveUint8Array(pdfBytes, 'edited.pdf', 'application/pdf')
      pushToast(isNativeApp() ? tr('toast_saved_share_native') : tr('toast_saved_desktop_dl'), 'success')
      maybeShowInterstitialAfterExport()
    } catch (e) {
      pushToast(messageFromCaught(e, tr), 'error')
    } finally {
      setBusy(false)
    }
  }, [pdfBytes, pushToast, tr])

  const goPrev = async () => {
    await hapticTap()
    setWorkPage((p) => Math.max(1, p - 1))
  }

  const goNext = async () => {
    await hapticTap()
    setWorkPage((p) => (numPages ? Math.min(numPages, p + 1) : p))
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-4">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-950/15 px-4 py-3">
        <p className="text-sm font-medium text-amber-100">{tr('edit_title')}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {tr('edit_intro_before')} <strong className="text-slate-300">{tr('edit_intro_corner')}</strong>
          {tr('edit_intro_mid')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">
          {tr('edit_open')}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void loadPdfFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          disabled={past.length === 0 || busy}
          onClick={() => void undo()}
          className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
        >
          <Undo2 className="size-4" />
          {tr('undo')}
        </button>
        <button
          type="button"
          disabled={!pdfBytes || busy}
          onClick={() => void exportPdf()}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:bg-slate-700"
        >
          <Save className="size-4" />
          {tr('edit_save_file')}
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section
          ref={previewWrapRef}
          className="flex min-h-0 min-w-0 flex-col gap-2 lg:sticky lg:top-2 lg:w-[56%] lg:max-w-[56%]"
        >
          <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <p className="mb-2 text-center text-xs font-medium text-slate-400">{tr('preview_title')}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
              <button
                type="button"
                title={tr('prev_page')}
                disabled={workPage <= 1 || !previewUrl}
                onClick={() => void goPrev()}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                {tr('reader_prev')}
              </button>
              <span className="min-w-[5rem] text-center text-sm tabular-nums text-slate-200">
                {tr('pg_count', { cur: shownPage, total: numPages || '…' })}
              </span>
              <button
                type="button"
                title={tr('reader_next_pdf')}
                disabled={!previewUrl || numPages === 0 || workPage >= numPages}
                onClick={() => void goNext()}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40"
              >
                {tr('reader_next')}
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await hapticTap()
                  setZoom((z) => Math.max(0.65, +(z - 0.1).toFixed(2)))
                }}
                className="rounded-xl border border-white/15 p-2 text-white hover:bg-white/10"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await hapticTap()
                  setZoom((z) => Math.min(2.2, +(z + 0.1).toFixed(2)))
                }}
                className="rounded-xl border border-white/15 p-2 text-white hover:bg-white/10"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>

            {!previewUrl ? (
              <p className="py-16 text-center text-sm text-slate-500">{tr('preview_pick')}</p>
            ) : (
              <div className="max-h-[min(calc(100dvh-14rem),760px)] overflow-auto rounded-xl bg-slate-900/50 [-webkit-overflow-scrolling:touch]">
                <Document
                  file={previewUrl}
                  onLoadSuccess={(doc) => {
                    const n = doc.numPages
                    setNumPages(n)
                    setWorkPage((p) => Math.min(Math.max(1, p), n))
                  }}
                  onLoadError={() => pushToast(tr('preview_error'), 'error')}
                  loading={<p className="py-12 text-center text-sm text-slate-400">{tr('loading')}</p>}
                >
                  <div className="flex justify-center py-2 [&_.react-pdf__Page]:min-w-0 [&_.react-pdf__Page]:shadow-lg">
                    <Page pageNumber={shownPage} width={pageWidth} renderAnnotationLayer renderTextLayer />
                  </div>
                </Document>
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 flex-1 rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="mb-3 text-sm font-semibold text-amber-100">{tr('tools_panel')}</p>

          <div className="mb-4 flex rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => void hapticTap().then(() => setTab('text'))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                tab === 'text' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="size-4" />
              {tr('tab_text')}
            </button>
            <button
              type="button"
              onClick={() => void hapticTap().then(() => setTab('image'))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                tab === 'image' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImagePlus className="size-4" />
              {tr('tab_image')}
            </button>
          </div>

          <label className="mb-4 flex flex-col gap-1 text-sm text-slate-300">
            {tr('edit_page_label')}
            <input
              type="number"
              min={1}
              max={Math.max(1, numPages)}
              value={workPage}
              disabled={!numPages}
              onChange={(e) => setWorkPage(Number.parseInt(e.target.value, 10) || 1)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white disabled:opacity-40"
            />
          </label>

          {tab === 'text' ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                {tr('tab_text')}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  placeholder={tr('ph_caption')}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  {tr('lbl_x_pt')}
                  <input
                    type="number"
                    value={tx}
                    onChange={(e) => setTx(Number.parseFloat(e.target.value) || 0)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  {tr('lbl_y_bottom_pt')}
                  <input
                    type="number"
                    value={tyBottom}
                    onChange={(e) => setTyBottom(Number.parseFloat(e.target.value) || 0)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                {tr('lbl_font_sz')}
                <input
                  type="number"
                  min={6}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number.parseInt(e.target.value, 10) || 12)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
              <button
                type="button"
                disabled={busy || !pdfBytes}
                onClick={() => void applyText()}
                className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-slate-700"
              >
                {busy ? tr('btn_wait_short') : tr('add_text_btn')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-center hover:bg-white/10">
                <span className="text-sm font-medium text-white">{tr('pick_jpgpng_label')}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {imgFile ? (
                <p className="truncate text-xs text-slate-400">{imgFile.name}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  {tr('lbl_x_pt')}
                  <input
                    type="number"
                    value={ix}
                    onChange={(e) => setIx(Number.parseFloat(e.target.value) || 0)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-300">
                  {tr('lbl_y_bottom_pt')}
                  <input
                    type="number"
                    value={iyBottom}
                    onChange={(e) => setIyBottom(Number.parseFloat(e.target.value) || 0)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                {tr('lbl_width_fix')}
                <input
                  type="number"
                  min={12}
                  value={imgWidthPt}
                  onChange={(e) => setImgWidthPt(Number.parseFloat(e.target.value) || 120)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
              <button
                type="button"
                disabled={busy || !pdfBytes}
                onClick={() => void applyImage()}
                className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-slate-700"
              >
                {busy ? tr('btn_wait_short') : tr('embed_image_btn')}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
