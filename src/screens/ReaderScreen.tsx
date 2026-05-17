import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type TouchEventHandler,
} from 'react'
import { Document, Page } from 'react-pdf'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { getHistoryRecord } from '../lib/historyDb'
import {
  detectReaderKind,
  canPreviewInReader,
  readPlainPreview,
  readDocxHtml,
  readXlsxTables,
  readPptxPlainText,
  readerKindLabelKey,
  unsupportedReaderHintKey,
  READ_PLAIN_PREVIEW_CHAR_CAP,
} from '../lib/readerFormats'
import { takePendingInboundFile } from '../lib/inboundOpen'
import { hapticTap } from '../lib/native'
import { messageFromCaught } from '../i18n/formatError'

/** Скролл-зона контента: забирает всё оставшееся место под блоком «Открыть файл» */
const READER_SCROLL =
  'min-h-0 min-w-0 w-full flex-1 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]'

/** Область страницы PDF: вертикальный скролл и жесты не блокируются родителем */
const PDF_VIEW_SCROLL =
  `${READER_SCROLL} reader-pdf-view-scroll overflow-y-scroll overflow-x-hidden touch-pan-y`

/** Доля ширины области просмотра под страницу при зуме 1.0 — одинаковая для всех PDF */
const PDF_PAGE_WIDTH_FRACTION = 0.88

type AltPreview =
  | { mode: 'none' }
  | { mode: 'loading'; label: string }
  | { mode: 'plain'; text: string }
  | { mode: 'html'; html: string }
  | { mode: 'iframe'; url: string }
  | { mode: 'image'; url: string }
  | { mode: 'video'; url: string }
  | { mode: 'workbook'; sheets: { name: string; html: string }[]; idx: number }
  | { mode: 'slides'; text: string }
  | { mode: 'error'; message: string }

export function ReaderScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  const iframeUrlRef = useRef<string | null>(null)
  const mediaUrlRef = useRef<string | null>(null)
  const [alt, setAlt] = useState<AltPreview>({ mode: 'none' })

  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  /** Множитель поверх базовой ширины (= доля экрана × viewport); новый файл → 1 */
  const [zoomFactor, setZoomFactor] = useState(1)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(320)

  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  const revokeIframe = () => {
    if (iframeUrlRef.current) {
      URL.revokeObjectURL(iframeUrlRef.current)
      iframeUrlRef.current = null
    }
  }

  const revokeMedia = () => {
    if (mediaUrlRef.current) {
      URL.revokeObjectURL(mediaUrlRef.current)
      mediaUrlRef.current = null
    }
  }

  const swapPdfUrl = (next: string | null) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    if (next) urlRef.current = next
    setDocUrl(next)
  }

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
      revokeIframe()
      revokeMedia()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      revokeIframe()
      revokeMedia()

      let fileFromInbound: File | null = null
      if (searchParams.get('open') === 'inbound') {
        fileFromInbound = takePendingInboundFile()
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('open')
            next.delete('t')
            return next
          },
          { replace: true },
        )
      }

      const h = searchParams.get('h')
      const effectivePicked = fileFromInbound ?? pickedFile

      if (!h && !effectivePicked) {
        swapPdfUrl(null)
        setAlt({ mode: 'none' })
        return
      }

      let file: File
      let pdfSourceBlob: Blob

      if (h) {
        const rec = await getHistoryRecord(h)
        if (cancelled) return
        if (!rec) {
          pushToast(t('toast_history_missing'), 'error')
          swapPdfUrl(null)
          setAlt({ mode: 'none' })
          return
        }
        if (!canPreviewInReader(rec)) {
          pushToast(t(unsupportedReaderHintKey({ name: rec.title })), 'error')
          swapPdfUrl(null)
          setAlt({ mode: 'none' })
          return
        }
        file = new File([rec.blob], rec.title, { type: rec.mime })
        pdfSourceBlob = rec.blob
      } else {
        file = effectivePicked!
        pdfSourceBlob = effectivePicked!
      }

      if (fileFromInbound) {
        setPickedFile(fileFromInbound)
      }

      const kind = detectReaderKind(file)

      if (kind === 'pdf') {
        setAlt({ mode: 'none' })
        swapPdfUrl(URL.createObjectURL(pdfSourceBlob))
        setPage(1)
        setNumPages(0)
        return
      }

      swapPdfUrl(null)
      setAlt({ mode: 'loading', label: t(readerKindLabelKey(kind) ?? 'reader_unsupported_generic') })
      setPage(1)
      setNumPages(0)

      try {
        if (kind === 'image') {
          const u = URL.createObjectURL(file)
          if (cancelled) {
            URL.revokeObjectURL(u)
            return
          }
          mediaUrlRef.current = u
          setAlt({ mode: 'image', url: u })
          return
        }
        if (kind === 'video') {
          const u = URL.createObjectURL(file)
          if (cancelled) {
            URL.revokeObjectURL(u)
            return
          }
          mediaUrlRef.current = u
          setAlt({ mode: 'video', url: u })
          return
        }
        if (kind === 'plain') {
          const { text, truncated } = await readPlainPreview(file)
          if (cancelled) return
          const body =
            truncated && text.length > 0 ? `${text}${t('reader_plain_trunc', { count: READ_PLAIN_PREVIEW_CHAR_CAP })}` : text
          setAlt({ mode: 'plain', text: body })
          return
        }
        if (kind === 'docx') {
          const html = await readDocxHtml(file)
          if (cancelled) return
          setAlt({ mode: 'html', html })
          return
        }
        if (kind === 'xlsx') {
          const sheets = await readXlsxTables(file)
          if (cancelled) return
          setAlt({ mode: 'workbook', sheets, idx: 0 })
          return
        }
        if (kind === 'pptx') {
          const text = await readPptxPlainText(file)
          if (cancelled) return
          setAlt({ mode: 'slides', text })
          return
        }
        if (kind === 'html-file') {
          const u = URL.createObjectURL(file)
          if (cancelled) {
            URL.revokeObjectURL(u)
            return
          }
          iframeUrlRef.current = u
          setAlt({ mode: 'iframe', url: u })
          return
        }
        setAlt({ mode: 'error', message: t(unsupportedReaderHintKey(file)) })
      } catch (e) {
        if (cancelled) return
        setAlt({
          mode: 'error',
          message: messageFromCaught(e, t),
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, pickedFile, pushToast, setSearchParams, t])

  useEffect(() => {
    setZoomFactor(1)
  }, [docUrl])

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const measure = () => {
      const style = getComputedStyle(el)
      const pl = parseFloat(style.paddingLeft) || 0
      const pr = parseFloat(style.paddingRight) || 0
      // clientWidth включает padding — для react-pdf нужна ширина контентной области
      const w = el.clientWidth - pl - pr
      setViewportWidth(Math.max(120, Math.floor(w)))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [docUrl])

  const pageWidth = Math.max(
    96,
    Math.floor(viewportWidth * PDF_PAGE_WIDTH_FRACTION * zoomFactor),
  )

  const goPrevPdf = useCallback(async () => {
    await hapticTap()
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const goNextPdf = useCallback(async () => {
    await hapticTap()
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p))
  }, [numPages])

  const onPdfTouchStart: TouchEventHandler<HTMLDivElement> = useCallback((e) => {
    const t = e.changedTouches[0]
    swipeRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onPdfTouchEnd: TouchEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const start = swipeRef.current
      swipeRef.current = null
      if (!start || numPages === 0) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.25) return
      void hapticTap()
      if (dx > 0) setPage((p) => Math.max(1, p - 1))
      else setPage((p) => (numPages ? Math.min(numPages, p + 1) : p))
    },
    [numPages],
  )

  const onPick: ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const kind = detectReaderKind(f)
    if (kind === 'unsupported') {
      pushToast(t(unsupportedReaderHintKey(f)), 'error')
      return
    }
    setSearchParams({})
    setPickedFile(f)
  }

  const docxHtmlClass =
    'reader-docx max-w-none text-[15px] leading-relaxed text-slate-200 [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:ml-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_a]:text-cyan-400 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-white/15 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-white/15 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left'

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col gap-2">
      <label className="flex min-w-0 shrink-0 cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('open_file')}</span>
        <span className="text-xs leading-snug text-slate-400">{t('reader_supported')}</span>
        <input type="file" className="hidden" onChange={onPick} />
      </label>

      {alt.mode === 'loading' ? (
        <p className="shrink-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 text-center text-sm text-slate-400">
          {t('reader_loading_alt', { label: alt.label })}
        </p>
      ) : null}

      {alt.mode === 'error' ? (
        <p className="shrink-0 rounded-2xl border border-red-500/25 bg-red-950/25 px-4 py-4 text-sm text-red-200">{alt.message}</p>
      ) : null}

      {alt.mode === 'plain' ? (
        <div className={`${READER_SCROLL} rounded-2xl border border-white/10 bg-black/35 p-4`}>
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-slate-200">
            {alt.text}
          </pre>
        </div>
      ) : null}

      {alt.mode === 'html' ? (
        <div className={`${READER_SCROLL} rounded-2xl border border-white/10 bg-black/35 p-4`}>
          <div className={docxHtmlClass} dangerouslySetInnerHTML={{ __html: alt.html }} />
        </div>
      ) : null}

      {alt.mode === 'iframe' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white">
          <iframe
            title="HTML"
            src={alt.url}
            sandbox="allow-same-origin"
            className="min-h-0 w-full flex-1 bg-white"
          />
        </div>
      ) : null}

      {alt.mode === 'image' ? (
        <div className={`${READER_SCROLL} flex items-center justify-center rounded-2xl border border-white/10 bg-black/50 p-2`}>
          <img
            src={alt.url}
            alt=""
            draggable={false}
            className="h-auto max-h-full w-full max-w-full object-contain"
          />
        </div>
      ) : null}

      {alt.mode === 'video' ? (
        <div className={`${READER_SCROLL} flex items-center justify-center rounded-2xl border border-white/10 bg-black p-2`}>
          <video
            src={alt.url}
            controls
            playsInline
            className="h-auto max-h-full w-full max-w-full rounded-lg"
            aria-label={t('reader_video')}
          />
        </div>
      ) : null}

      {alt.mode === 'slides' ? (
        <div className={`${READER_SCROLL} rounded-2xl border border-white/10 bg-black/35 p-4`}>
          <pre className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-slate-200">{alt.text}</pre>
        </div>
      ) : null}

      {alt.mode === 'workbook' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="flex min-w-0 shrink-0 gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {alt.sheets.map((s, i) => (
              <button
                key={`${i}-${s.name}`}
                type="button"
                onClick={async () => {
                  await hapticTap()
                  setAlt((prev) =>
                    prev.mode === 'workbook' ? { ...prev, idx: i } : prev,
                  )
                }}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium ${
                  i === alt.idx ? 'bg-emerald-700 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className={`${READER_SCROLL} rounded-xl border border-white/10 bg-black/20 p-2`}>
            <div dangerouslySetInnerHTML={{ __html: alt.sheets[alt.idx]?.html ?? '' }} />
          </div>
        </div>
      ) : null}

      {docUrl && (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-1 sm:gap-3">
            <button
              type="button"
              title={t('reader_prev_pdf')}
              disabled={page <= 1}
              onClick={() => void goPrevPdf()}
              className="inline-flex items-center gap-0.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-medium leading-tight text-white hover:bg-white/15 disabled:opacity-40 sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm sm:leading-normal"
            >
              <ChevronLeft className="size-3.5 shrink-0 sm:size-5" aria-hidden />
              {t('reader_prev')}
            </button>
            <span className="min-w-[4.5rem] text-center text-[11px] font-medium tabular-nums text-slate-200 sm:min-w-[6rem] sm:text-sm">
              {page} / {numPages || '…'}
            </span>
            <button
              type="button"
              title={t('reader_next_pdf')}
              disabled={numPages === 0 || page >= numPages}
              onClick={() => void goNextPdf()}
              className="inline-flex items-center gap-0.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-medium leading-tight text-white hover:bg-white/15 disabled:opacity-40 sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm sm:leading-normal"
            >
              {t('reader_next')}
              <ChevronRight className="size-3.5 shrink-0 sm:size-5" aria-hidden />
            </button>
          </div>

          <Document
            file={docUrl}
            onLoadSuccess={(doc) => {
              setNumPages(doc.numPages)
              pushToast(t('toast_pdf_loaded', { pages: doc.numPages }), 'success')
            }}
            onLoadError={() => pushToast(t('toast_pdf_open_fail'), 'error')}
            loading={<p className="py-8 text-center text-sm text-slate-400">{t('reader_pdf_loading')}</p>}
          >
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
              <button
                type="button"
                aria-label={t('reader_prev')}
                disabled={page <= 1}
                onClick={() => void goPrevPdf()}
                className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-md border border-white/20 bg-black/60 p-1 text-white shadow backdrop-blur-sm hover:bg-black/75 disabled:opacity-25 sm:rounded-r-2xl sm:p-3 sm:shadow-lg"
              >
                <ChevronLeft className="size-[1.125rem] sm:size-7" />
              </button>
              <button
                type="button"
                aria-label={t('reader_next')}
                disabled={numPages === 0 || page >= numPages}
                onClick={() => void goNextPdf()}
                className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-md border border-white/20 bg-black/60 p-1 text-white shadow backdrop-blur-sm hover:bg-black/75 disabled:opacity-25 sm:rounded-l-2xl sm:p-3 sm:shadow-lg"
              >
                <ChevronRight className="size-[1.125rem] sm:size-7" />
              </button>
              <div
                ref={viewportRef}
                role="application"
                aria-label={t('reader_pdf_page_swipe_arialabel')}
                onTouchStart={onPdfTouchStart}
                onTouchEnd={onPdfTouchEnd}
                className={`${PDF_VIEW_SCROLL} rounded-xl bg-slate-900/40 px-2 py-2 sm:px-3`}
              >
                <div className="flex min-h-min justify-center pb-6 [&_.react-pdf__Page]:mx-auto [&_.react-pdf__Page]:block [&_.react-pdf__Page]:min-w-0 [&_.react-pdf__Page]:shadow-lg">
                  <Page pageNumber={page} width={pageWidth} renderAnnotationLayer renderTextLayer />
                </div>
              </div>
            </div>
          </Document>

          <p className="text-center text-[11px] text-slate-500">
            {t('reader_swipe_hint')}
          </p>

          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                className="shrink-0 rounded-md border border-white/15 bg-white/5 px-1.5 py-1 hover:bg-white/10 disabled:opacity-40 sm:rounded-xl sm:px-3 sm:py-2"
                disabled={page <= 1}
                onClick={() => void goPrevPdf()}
              >
                <ChevronLeft className="size-3 sm:size-4" aria-hidden />
              </button>
              <span className="min-w-0 truncate text-[11px] tabular-nums text-slate-200 sm:text-sm">
                {page} / {numPages || '…'}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md border border-white/15 bg-white/5 px-1.5 py-1 hover:bg-white/10 disabled:opacity-40 sm:rounded-xl sm:px-3 sm:py-2"
                disabled={numPages === 0 || page >= numPages}
                onClick={() => void goNextPdf()}
              >
                <ChevronRight className="size-3 sm:size-4" aria-hidden />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                className="rounded-md border border-white/15 bg-white/5 px-1.5 py-1 hover:bg-white/10 sm:rounded-xl sm:px-3 sm:py-2"
                onClick={async () => {
                  await hapticTap()
                  setZoomFactor((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))
                }}
              >
                <ZoomOut className="size-3 sm:size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="rounded-md border border-white/15 bg-white/5 px-1.5 py-1 hover:bg-white/10 sm:rounded-xl sm:px-3 sm:py-2"
                onClick={async () => {
                  await hapticTap()
                  setZoomFactor((z) => Math.min(3, +(z + 0.15).toFixed(2)))
                }}
              >
                <ZoomIn className="size-3 sm:size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
