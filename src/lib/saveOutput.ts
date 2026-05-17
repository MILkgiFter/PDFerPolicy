import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { dictionaries } from '../i18n/dictionaries'
import type { AppLocale } from '../i18n/detectLocale'
import { addHistoryRecord } from './historyDb'

function activeDict(): Record<string, string> {
  const raw = typeof document !== 'undefined' ? document.documentElement.lang : ''
  const loc: AppLocale = raw.toLowerCase().startsWith('ru') ? 'ru' : 'en'
  return dictionaries[loc]
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim()
  const base = cleaned.length ? cleaned : 'export.bin'
  return base.length > 120 ? base.slice(-120) : base
}

/** Base64 для Filesystem API без раздувания стека на больших файлах */
function uint8ToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    const blob = new Blob([copy])
    const reader = new FileReader()
    reader.onloadend = () => {
      const s = reader.result as string
      const idx = s.indexOf(',')
      resolve(idx >= 0 ? s.slice(idx + 1) : s)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader'))
    reader.readAsDataURL(blob)
  })
}

function webDownload(data: Uint8Array, filename: string, mime: string): void {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  const blob = new Blob([copy], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}

/**
 * Сохранение результата: в браузере — скачивание; в приложении — запись в кэш и шторка «Поделиться»
 * (Сохранить в файлы, Telegram, Drive и т.д.).
 */
export async function saveUint8Array(
  data: Uint8Array,
  filename: string,
  mime: string,
  options?: { skipHistory?: boolean },
): Promise<void> {
  const safe = sanitizeFilename(filename)

  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  if (!options?.skipHistory) {
    void addHistoryRecord({
      title: safe,
      mime,
      blob: new Blob([copy], { type: mime }),
    }).catch(() => {})
  }

  if (!Capacitor.isNativePlatform()) {
    webDownload(copy, safe, mime)
    return
  }

  const write = await Filesystem.writeFile({
    path: `exports/${safe}`,
    data: await uint8ToBase64(copy),
    directory: Directory.Cache,
    recursive: true,
  })

  const uri = write.uri

  const dlg = activeDict()

  try {
    if (uri.startsWith('file:')) {
      await Share.share({
        title: safe,
        files: [uri],
        dialogTitle: dlg.office_share_dialog_title!,
      })
      return
    }

    await Share.share({
      title: safe,
      url: uri,
      dialogTitle: dlg.office_share_dialog_title!,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/cancel|canceled|unsupported url/i.test(msg)) return
    throw new Error(
      msg.includes('Unsupported')
        ? dlg.office_share_sheet_error!
        : msg,
      { cause: e },
    )
  }
}

/**
 * Выгрузить существующий blob (повторное «Поделиться» без дубля в истории).
 */
export async function shareOrDownloadExisting(blob: Blob, filename: string, mime: string): Promise<void> {
  const safe = sanitizeFilename(filename)
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf.byteLength)
  bytes.set(new Uint8Array(buf))

  if (!Capacitor.isNativePlatform()) {
    webDownload(bytes, safe, mime)
    return
  }

  const write = await Filesystem.writeFile({
    path: `exports/${safe}`,
    data: await uint8ToBase64(bytes),
    directory: Directory.Cache,
    recursive: true,
  })

  const uri = write.uri

  try {
    const dlg = activeDict()
    if (uri.startsWith('file:')) {
      await Share.share({
        title: safe,
        files: [uri],
        dialogTitle: dlg.office_share_dialog_title!,
      })
      return
    }

    await Share.share({
      title: safe,
      url: uri,
      dialogTitle: dlg.office_share_dialog_title!,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const dlg = activeDict()
    if (/cancel|canceled|unsupported url/i.test(msg)) return
    throw new Error(msg.includes('Unsupported') ? dlg.office_share_sheet_error! : msg, { cause: e })
  }
}
