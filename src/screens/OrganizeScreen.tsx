import { useMemo, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { countPdfPages, reorganizePdfPages } from '../lib/pdfToolkit'
import { ToolkitError } from '../lib/ToolkitError'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

function parseOrder(input: string, total: number): number[] {
  const parts = input.split(/[,;\s]+/).filter(Boolean)
  if (parts.length === 0) throw new ToolkitError('err_organize_empty')
  const nums = parts.map((p) => {
    const n = Number.parseInt(p, 10)
    if (!Number.isFinite(n)) throw new ToolkitError('err_organize_bad_num', { part: p })
    return n
  })
  const zero = nums.map((n) => {
    if (n < 1 || n > total) throw new ToolkitError('err_organize_oob', { n, total })
    return n - 1
  })
  return [...new Set(zero)]
}

export function OrganizeScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [orderText, setOrderText] = useState('')
  const [busy, setBusy] = useState(false)

  const preview = useMemo(() => {
    if (!total || !orderText.trim()) return null
    try {
      return parseOrder(orderText, total)
    } catch {
      return null
    }
  }, [orderText, total])

  const onPick = async (f: File | null) => {
    setFile(f)
    setTotal(null)
    setOrderText('')
    if (!f) return
    try {
      const n = await countPdfPages(f)
      setTotal(n)
      setOrderText(Array.from({ length: n }, (_, i) => String(i + 1)).join(', '))
    } catch {
      pushToast(t('toast_organize_read_fail'), 'error')
    }
  }

  const run = async () => {
    await hapticTap()
    if (!file || !total) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    let order: number[]
    try {
      order = parseOrder(orderText, total)
    } catch (err) {
      pushToast(messageFromCaught(err, t), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await reorganizePdfPages(file, order)
      await saveUint8Array(out, 'organized.pdf', 'application/pdf')
      pushToast(
        isNativeApp() ? t('toast_organize_done_share') : t('toast_organize_done'),
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
      <p className="text-sm leading-relaxed text-slate-400">
        {t('organize_intro')} {t('organize_intro_tail')}
      </p>

      <label className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center hover:bg-white/10">
        <span className="text-sm font-medium text-white">{t('pick_pdf')}</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
      </label>

      {total !== null && (
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          {t('organize_order_label', { count: total })}
          <textarea
            rows={3}
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-rose-500/50"
          />
        </label>
      )}

      {preview && (
        <p className="text-xs text-slate-500">
          {t('organize_preview_total')} <span className="tabular-nums">{preview.length}</span>
        </p>
      )}

      <button
        type="button"
        disabled={busy || !file || !total || preview === null}
        onClick={run}
        className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {busy ? t('organize_busy') : t('organize_run')}
      </button>
    </div>
  )
}
