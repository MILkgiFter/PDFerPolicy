import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import { ToolkitError } from './ToolkitError'

const loadOpts = { ignoreEncryption: true as const }

async function bytesFromPdfInput(pdfInput: File | Uint8Array): Promise<Uint8Array> {
  if (pdfInput instanceof Uint8Array) return pdfInput.slice()
  return copyBytesFromFile(pdfInput)
}

function sniffRasterKind(bytes: Uint8Array): 'png' | 'jpeg' | null {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg'
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png'
  }
  return null
}

/** Снимок байтов файла — на Android/WebView `arrayBuffer()` иногда даёт отсоединённый буфер при повторном merge */
export async function copyBytesFromFile(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer()
  const copy = new Uint8Array(buf.byteLength)
  copy.set(new Uint8Array(buf))
  return copy
}

export async function countPdfPages(file: File): Promise<number> {
  const bytes = await copyBytesFromFile(file)
  const doc = await PDFDocument.load(bytes, loadOpts)
  return doc.getPageCount()
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) throw new ToolkitError('err_merge_pick_one_pdf')
  const merged = await PDFDocument.create()
  for (const file of files) {
    const bytes = await copyBytesFromFile(file)
    try {
      const doc = await PDFDocument.load(bytes, loadOpts)
      const copied = await merged.copyPages(doc, doc.getPageIndices())
      copied.forEach((p) => merged.addPage(p))
    } catch (e) {
      throw new ToolkitError('err_merge_read_pdf', { name: file.name }, { cause: e })
    }
  }
  return merged.save()
}

export async function splitPdfEachPage(file: File): Promise<Uint8Array[]> {
  const bytes = await copyBytesFromFile(file)
  const src = await PDFDocument.load(bytes, loadOpts)
  const out: Uint8Array[] = []
  const count = src.getPageCount()
  for (let i = 0; i < count; i++) {
    const doc = await PDFDocument.create()
    const [page] = await doc.copyPages(src, [i])
    doc.addPage(page)
    out.push(await doc.save())
  }
  return out
}

/** ranges are 1-based inclusive pairs */
export async function splitPdfByRanges(
  file: File,
  ranges: readonly [number, number][],
): Promise<Uint8Array[]> {
  const bytes = await copyBytesFromFile(file)
  const src = await PDFDocument.load(bytes, loadOpts)
  const pageCount = src.getPageCount()
  const out: Uint8Array[] = []

  for (const [start1, end1] of ranges) {
    const start = Math.max(1, start1)
    const end = Math.min(pageCount, Math.max(start, end1))
    const indices: number[] = []
    for (let p = start; p <= end; p++) indices.push(p - 1)
    if (indices.length === 0) continue
    const doc = await PDFDocument.create()
    const copied = await doc.copyPages(src, indices)
    copied.forEach((p) => doc.addPage(p))
    out.push(await doc.save())
  }
  return out
}

export function parsePageRanges(input: string): [number, number][] {
  const parts = input.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
  const ranges: [number, number][] = []
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((x) => Number.parseInt(x.trim(), 10))
      if (Number.isNaN(a) || Number.isNaN(b)) throw new ToolkitError('err_parse_bad_range', { part })
      ranges.push([Math.min(a, b), Math.max(a, b)])
    } else {
      const n = Number.parseInt(part, 10)
      if (Number.isNaN(n)) throw new ToolkitError('err_parse_bad_page', { part })
      ranges.push([n, n])
    }
  }
  return ranges
}

async function loadPdfJsDoc(file: File): Promise<PDFDocumentProxy> {
  const data = await copyBytesFromFile(file)
  const task = getDocument({ data })
  return task.promise
}

export async function rasterPagesToJpegDataUrls(
  file: File,
  scale: number,
  jpegQuality: number,
): Promise<string[]> {
  const pdf = await loadPdfJsDoc(file)
  const urls: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    if (!canvas.getContext('2d')) throw new ToolkitError('err_canvas')
    await page.render({ canvas, viewport }).promise
    urls.push(canvas.toDataURL('image/jpeg', jpegQuality))
  }
  await pdf.destroy()
  return urls
}

export async function compressPdfByRaster(
  file: File,
  opts: { scale: number; jpegQuality: number },
): Promise<Uint8Array> {
  const dataUrls = await rasterPagesToJpegDataUrls(file, opts.scale, opts.jpegQuality)
  const outDoc = await PDFDocument.create()

  for (const dataUrl of dataUrls) {
    const res = await fetch(dataUrl)
    const jpgBytes = await res.arrayBuffer()
    const image = await outDoc.embedJpg(jpgBytes)
    const page = outDoc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  return outDoc.save()
}

export async function pdfPagesToJpegBlobs(
  file: File,
  scale: number,
  jpegQuality: number,
): Promise<Blob[]> {
  const pdf = await loadPdfJsDoc(file)
  const blobs: Blob[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    if (!canvas.getContext('2d')) throw new ToolkitError('err_canvas')
    await page.render({ canvas, viewport }).promise
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new ToolkitError('err_canvas'))), 'image/jpeg', jpegQuality)
    })
    blobs.push(blob)
  }
  await pdf.destroy()
  return blobs
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) throw new ToolkitError('err_pick_images')
  const doc = await PDFDocument.create()
  const pageWidth = 595
  const pageHeight = 842

  for (const file of files) {
    const raw = await copyBytesFromFile(file)
    const lower = file.name.toLowerCase()
    const isPng = file.type.includes('png') || lower.endsWith('.png')
    const embedded = isPng ? await doc.embedPng(raw) : await doc.embedJpg(raw)
    const scaled = embedded.scaleToFit(pageWidth, pageHeight)
    const page = doc.addPage([pageWidth, pageHeight])
    page.drawImage(embedded, {
      x: (pageWidth - scaled.width) / 2,
      y: (pageHeight - scaled.height) / 2,
      width: scaled.width,
      height: scaled.height,
    })
  }

  return doc.save()
}

export async function rotatePdfPages(
  file: File,
  pageIndices0: readonly number[],
  angle: 90 | 180 | 270,
): Promise<Uint8Array> {
  const bytes = await copyBytesFromFile(file)
  const doc = await PDFDocument.load(bytes, loadOpts)
  const set = new Set(pageIndices0)
  const indices = doc.getPageIndices().filter((i) => set.has(i))
  for (const i of indices.length ? indices : doc.getPageIndices()) {
    const page = doc.getPage(i)
    const cur = page.getRotation().angle
    page.setRotation(degrees(((cur + angle) % 360) as 0 | 90 | 180 | 270))
  }
  return doc.save()
}

export async function watermarkPdf(
  file: File,
  text: string,
  opacity: number,
  angleDeg: number,
): Promise<Uint8Array> {
  const bytes = await copyBytesFromFile(file)
  const doc = await PDFDocument.load(bytes, loadOpts)

  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i)
    const { width, height } = page.getSize()
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width)
    canvas.height = Math.ceil(height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ToolkitError('err_canvas')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((-angleDeg * Math.PI) / 180)
    ctx.globalAlpha = opacity
    const fontSize = Math.min(width, height) / 14
    ctx.font = `600 ${fontSize}px system-ui,Segoe UI,sans-serif`
    ctx.fillStyle = 'rgba(120,120,120,0.9)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)
    ctx.restore()

    const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new ToolkitError('err_wm_png_failed'))
          return
        }
        void blob
          .arrayBuffer()
          .then((b) => resolve(new Uint8Array(b)))
          .catch(reject)
      }, 'image/png')
    })

    const png = await doc.embedPng(pngBytes)
    page.drawImage(png, {
      x: 0,
      y: 0,
      width,
      height,
    })
  }

  return doc.save()
}

export async function reorganizePdfPages(file: File, newOrder0: readonly number[]): Promise<Uint8Array> {
  const bytes = await copyBytesFromFile(file)
  const src = await PDFDocument.load(bytes, loadOpts)
  const total = src.getPageCount()
  const uniq = [...new Set(newOrder0)].filter((i) => i >= 0 && i < total)
  if (uniq.length === 0) throw new ToolkitError('err_reorganize_nopages')
  const doc = await PDFDocument.create()
  const copied = await doc.copyPages(src, uniq)
  copied.forEach((p) => doc.addPage(p))
  return doc.save()
}

export async function lightenPdfSave(file: File): Promise<Uint8Array> {
  const bytes = await copyBytesFromFile(file)
  const doc = await PDFDocument.load(bytes, loadOpts)
  return doc.save({ useObjectStreams: true })
}

/** Расшифровка по паролю: pdf-lib не умеет пароль — через pdf.js и пересборку страниц (растр). */
export async function unlockPdfWithPassword(file: File, password: string): Promise<Uint8Array> {
  const bytes = await copyBytesFromFile(file)
  try {
    const plain = await PDFDocument.load(bytes, { ignoreEncryption: false })
    return plain.save()
  } catch {
    /* зашифрован или не читается без ignoreEncryption — ниже pdf.js */
  }
  let pdf: PDFDocumentProxy
  try {
    pdf = await getDocument(password ? { data: bytes, password } : { data: bytes }).promise
  } catch (e) {
    throw new ToolkitError(
      password ? 'unlock_wrong_or_corrupt' : 'unlock_need_pw_or_corrupt',
      undefined,
      { cause: e },
    )
  }
  const doc = await PDFDocument.create()
  const scale = 2
  const jpegQuality = 0.92
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      if (!canvas.getContext('2d')) throw new ToolkitError('err_canvas')
      await page.render({ canvas, viewport }).promise
      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new ToolkitError('err_canvas'))),
          'image/jpeg',
          jpegQuality,
        )
      })
      const jpgBytes = new Uint8Array(await jpegBlob.arrayBuffer())
      const image = await doc.embedJpg(jpgBytes)
      const pdfPage = doc.addPage([image.width, image.height])
      pdfPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    }
  } finally {
    await pdf.destroy()
  }
  return doc.save()
}

/** Текст на странице: координаты от левого нижнего угла PDF (как в pdf-lib). Для кириллицы — через PNG. */
export async function drawTextOnPdfPage(
  pdfInput: File | Uint8Array,
  pageIndex0: number,
  text: string,
  opts: { x: number; yFromBottom: number; fontSize: number },
): Promise<Uint8Array> {
  const bytes = await bytesFromPdfInput(pdfInput)
  const doc = await PDFDocument.load(bytes, loadOpts)
  const n = doc.getPageCount()
  if (pageIndex0 < 0 || pageIndex0 >= n) {
    throw new ToolkitError('err_pdf_page_oob', { page: pageIndex0 + 1, total: n })
  }
  const page = doc.getPage(pageIndex0)
  const asciiOnly = /^[\x20-\x7E]*$/.test(text)

  if (asciiOnly && text.length > 0) {
    const font = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText(text, {
      x: opts.x,
      y: opts.yFromBottom,
      size: opts.fontSize,
      font,
      color: rgb(0.05, 0.08, 0.12),
    })
    return doc.save()
  }

  const pad = 6
  const fs = Math.max(8, opts.fontSize)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ToolkitError('err_canvas')
  ctx.font = `${fs}px system-ui,Segoe UI,sans-serif`
  const w = Math.ceil(ctx.measureText(text || ' ').width + pad * 2)
  const h = Math.ceil(fs * 1.4 + pad * 2)
  canvas.width = Math.max(w, 24)
  canvas.height = Math.max(h, 24)
  ctx.font = `${fs}px system-ui,Segoe UI,sans-serif`
  ctx.fillStyle = '#0f172a'
  ctx.fillText(text || ' ', pad, fs + pad / 2)

  const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new ToolkitError('err_canvas'))
      void blob.arrayBuffer().then((b) => resolve(new Uint8Array(b))).catch(reject)
    }, 'image/png')
  })
  const png = await doc.embedPng(pngBytes)
  page.drawImage(png, {
    x: opts.x,
    y: opts.yFromBottom,
    width: png.width,
    height: png.height,
  })
  return doc.save()
}

/** Вставка JPEG или PNG на страницу (координаты — левый нижний угол). */
export async function drawImageOnPdfPage(
  pdfInput: File | Uint8Array,
  pageIndex0: number,
  imageFile: File,
  opts: { x: number; yFromBottom: number; widthPt?: number; heightPt?: number },
): Promise<Uint8Array> {
  const bytes = await bytesFromPdfInput(pdfInput)
  const doc = await PDFDocument.load(bytes, loadOpts)
  const n = doc.getPageCount()
  if (pageIndex0 < 0 || pageIndex0 >= n) {
    throw new ToolkitError('err_pdf_page_oob', { page: pageIndex0 + 1, total: n })
  }
  const page = doc.getPage(pageIndex0)
  const imgBytes = await copyBytesFromFile(imageFile)
  const sniffed = sniffRasterKind(imgBytes)
  const kind =
    sniffed ??
    (imageFile.type.includes('png') || imageFile.name.toLowerCase().endsWith('.png') ? 'png' : null) ??
    (imageFile.type.includes('jpeg') ||
    imageFile.type.includes('jpg') ||
    /\.jpe?g$/i.test(imageFile.name)
      ? 'jpeg'
      : null)

  if (!kind) {
    throw new ToolkitError('err_draw_image_formats')
  }

  const embedded = kind === 'png' ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes)
  let w = embedded.width
  let h = embedded.height

  if (opts.widthPt != null && opts.heightPt != null) {
    w = opts.widthPt
    h = opts.heightPt
  } else if (opts.widthPt != null) {
    const sc = opts.widthPt / embedded.width
    w = opts.widthPt
    h = embedded.height * sc
  } else if (opts.heightPt != null) {
    const sc = opts.heightPt / embedded.height
    h = opts.heightPt
    w = embedded.width * sc
  }

  page.drawImage(embedded, {
    x: opts.x,
    y: opts.yFromBottom,
    width: w,
    height: h,
  })
  return doc.save()
}
