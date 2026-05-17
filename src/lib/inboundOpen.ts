import { Capacitor } from '@capacitor/core'

let pendingInboundFile: File | null = null

export function setPendingInboundFile(file: File | null): void {
  pendingInboundFile = file
}

export function takePendingInboundFile(): File | null {
  const f = pendingInboundFile
  pendingInboundFile = null
  return f
}

const MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/rtf': 'rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
}

function extFromMime(mime: string): string {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? ''
  return MIME_EXT[base] ?? 'bin'
}

/** Из строки content:/file: URI остаётся грубое имя (часто провайдеры не дают реальный файл в пути). */
export function guessNameFromUriString(uriStr: string): string | null {
  try {
    const pathPart = uriStr.replace(/^[^:]+:\/\//, '')
    const last = pathPart.split('/').pop()
    if (!last) return null
    const decoded = decodeURIComponent(last.split('?')[0] ?? last)
    if (!decoded || decoded.length > 200) return null
    if (decoded.includes(':')) return null
    return decoded.includes('.') ? decoded : null
  } catch {
    return null
  }
}

/**
 * Читает content:// или file:// через локальный мост Capacitor WebView (см. /_capacitor_content_/).
 */
export async function fileFromInboundNativeUri(uriStr: string): Promise<File> {
  const converted = Capacitor.convertFileSrc(uriStr)
  const res = await fetch(converted)
  if (!res.ok) {
    throw new Error(`Не удалось открыть файл (${res.status}).`)
  }
  const blob = await res.blob()
  const mime = blob.type || 'application/octet-stream'
  let name = guessNameFromUriString(uriStr)
  if (!name) {
    name = `document-${Date.now()}.${extFromMime(mime)}`
  }
  return new File([blob], name, { type: mime })
}
