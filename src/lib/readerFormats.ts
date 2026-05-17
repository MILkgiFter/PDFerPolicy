import JSZip from 'jszip'

export type ReaderKind =
  | 'pdf'
  | 'image'
  | 'video'
  | 'plain'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'html-file'
  | 'unsupported'

const IMAGE_EXT = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'avif',
  'svg',
  'ico',
  'heic',
  'heif',
])

const VIDEO_EXT = new Set(['mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v', 'mkv', 'avi', '3gp'])

const TEXT_EXT = new Set([
  'txt',
  'text',
  'md',
  'markdown',
  'json',
  'csv',
  'tsv',
  'log',
  'xml',
  'yaml',
  'yml',
  'ini',
  'env',
  'gitignore',
  'sql',
  'sh',
  'bat',
  'ps1',
  'py',
  'rb',
  'java',
  'c',
  'h',
  'cpp',
  'cs',
  'go',
  'rs',
  'vue',
  'css',
  'scss',
  'less',
  'rtf',
])

export function extFromName(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

export function detectReaderKind(file: Pick<File, 'name' | 'type'>): ReaderKind {
  const name = file.name.toLowerCase()
  const mime = (file.type || '').toLowerCase()
  const ext = extFromName(name)

  if (mime.includes('pdf') || ext === 'pdf') return 'pdf'

  if (mime.startsWith('image/') || IMAGE_EXT.has(ext)) return 'image'

  if (mime.startsWith('video/') || VIDEO_EXT.has(ext)) return 'video'

  if (
    ext === 'docx' ||
    mime.includes('wordprocessingml.document') ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx'
  }

  if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    mime.includes('spreadsheetml') ||
    mime.includes('excel') ||
    mime.includes('ms-excel')
  ) {
    return 'xlsx'
  }

  if (
    ext === 'pptx' ||
    mime.includes('presentationml') ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'pptx'
  }

  if (ext === 'htm' || ext === 'html' || mime.includes('text/html')) return 'html-file'

  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript' ||
    mime === 'application/typescript' ||
    mime.includes('csv')
  ) {
    return 'plain'
  }

  if (TEXT_EXT.has(ext)) return 'plain'

  return 'unsupported'
}

export function canPreviewInReader(rec: { title: string; mime: string }): boolean {
  return detectReaderKind({ name: rec.title, type: rec.mime }) !== 'unsupported'
}

export type UnsupportedReaderHintKey =
  | 'reader_unsupported_doc'
  | 'reader_unsupported_ppt'
  | 'reader_unsupported_generic'

export function unsupportedReaderHintKey(file: Pick<File, 'name'>): UnsupportedReaderHintKey {
  const ext = extFromName(file.name)
  if (ext === 'doc' || file.name.toLowerCase().endsWith('.doc')) {
    return 'reader_unsupported_doc'
  }
  if (ext === 'ppt' || file.name.toLowerCase().endsWith('.ppt')) {
    return 'reader_unsupported_ppt'
  }
  return 'reader_unsupported_generic'
}

export const READ_PLAIN_PREVIEW_CHAR_CAP = 1_200_000

export async function readPlainPreview(file: File): Promise<{ text: string; truncated: boolean }> {
  const text = await file.text()
  if (text.length <= READ_PLAIN_PREVIEW_CHAR_CAP) return { text, truncated: false }
  return { text: text.slice(0, READ_PLAIN_PREVIEW_CHAR_CAP), truncated: true }
}

export async function readDocxHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const { value } = await mammoth.convertToHtml({ arrayBuffer: buf })
  return value || '<p>Пустой документ</p>'
}

const MAX_TABLE_ROWS = 400

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function readXlsxTables(file: File): Promise<{ name: string; html: string }[]> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheets: { name: string; html: string }[] = []

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    if (!sheet) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]
    const slice = rows.slice(0, MAX_TABLE_ROWS)
    const truncated = rows.length > MAX_TABLE_ROWS

    if (slice.length === 0) {
      sheets.push({ name, html: '<p class="text-slate-500">Пустой лист</p>' })
      continue
    }

    const body = slice
      .map((row) => {
        const cells = (Array.isArray(row) ? row : []).map((c) => escapeHtml(String(c ?? '')))
        while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop()
        if (cells.length === 0) return '<tr><td class="border border-white/10 px-2 py-1">&nbsp;</td></tr>'
        return `<tr>${cells.map((c) => `<td class="border border-white/10 px-2 py-1 align-top whitespace-pre-wrap">${c}</td>`).join('')}</tr>`
      })
      .join('')

    const note = truncated
      ? `<p class="mt-2 text-xs text-amber-400/90">Показаны первые ${MAX_TABLE_ROWS} строк.</p>`
      : ''

    sheets.push({
      name,
      html: `<div class="overflow-x-auto"><table class="min-w-full border-collapse text-left text-sm">${body}</table></div>${note}`,
    })
  }

  if (sheets.length === 0) sheets.push({ name: 'Книга', html: '<p class="text-slate-500">Нет листов</p>' })
  return sheets
}

function decodeXmlText(raw: string): string {
  return raw
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

export async function readPptxPlainText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buf)
  const paths = Object.keys(zip.files)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const na = Number.parseInt(/slide(\d+)/i.exec(a)?.[1] ?? '0', 10)
      const nb = Number.parseInt(/slide(\d+)/i.exec(b)?.[1] ?? '0', 10)
      return na - nb
    })

  if (paths.length === 0) return 'Не удалось извлечь текст из презентации (нет слайдов в ожидаемом формате).'

  const chunks: string[] = []
  for (let i = 0; i < paths.length; i++) {
    const f = zip.file(paths[i])
    if (!f) continue
    const xml = await f.async('string')
    const parts: string[] = []
    const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(xml)) !== null) {
      const t = decodeXmlText(m[1]).trim()
      if (t) parts.push(t)
    }
    chunks.push(`— Слайд ${i + 1} —\n${parts.join(' ')}`)
  }

  return chunks.join('\n\n').trim() || 'Текст на слайдах не найден.'
}

export function readerKindLabelKey(kind: ReaderKind): string | null {
  switch (kind) {
    case 'pdf':
      return 'reader_kind_pdf'
    case 'image':
      return 'reader_kind_image'
    case 'video':
      return 'reader_kind_video'
    case 'plain':
      return 'reader_kind_plain'
    case 'docx':
      return 'reader_kind_docx'
    case 'xlsx':
      return 'reader_kind_xlsx'
    case 'pptx':
      return 'reader_kind_pptx'
    case 'html-file':
      return 'reader_kind_html_file'
    default:
      return null
  }
}

export function readerKindLabel(kind: ReaderKind): string {
  switch (kind) {
    case 'pdf':
      return 'PDF'
    case 'image':
      return 'Изображение'
    case 'video':
      return 'Видео'
    case 'plain':
      return 'Текст'
    case 'docx':
      return 'Word'
    case 'xlsx':
      return 'Excel'
    case 'pptx':
      return 'PowerPoint'
    case 'html-file':
      return 'HTML'
    default:
      return ''
  }
}
