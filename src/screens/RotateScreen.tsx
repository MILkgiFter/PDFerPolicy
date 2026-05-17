import { useMemo, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { countPdfPages, rotatePdfPages } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

function parsePageSelection(spec: string, total: number, allKeywordLc: string): number[] {
  const raw = spec.trim().toLowerCase()
  if (!raw || raw === allKeywordLc || raw === 'all' || raw === 'все') {
    return Array.from({ length: total }, (_, i) => i)
  }
  const parts = raw.split(/[,;\s]+/).filter(Boolean)
  const idx = parts
    .map((p) => Number.parseInt(p, 10))
    .filter((n) => Number.isFinite(n))
    .map((n) => n - 1)
    .filter((i) => i >= 0 && i < total)
  return [...new Set(idx)]
}

export function RotateScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()

  const allKwLc = useMemo(() => t('rotate_kw_all').trim().toLowerCase(), [t])

  const [file, setFile] = useState<File | null>(null)
  const [pagesHint, setPagesHint] = useState('')
  const [total, setTotal] = useState<number | null>(null)
  const [angle, setAngle] = useState<90 | 180 | 270>(90)
  const [busy, setBusy] = useState(false)

  const indices = useMemo(() => {
    if (!total) return []
    return parsePageSelection(pagesHint, total, allKwLc)
  }, [pagesHint, total, allKwLc])

  const onPick = async (f: File | null) => {
    setFile(f)
    setTotal(null)
    if (!f) return
    try {
      const n = await countPdfPages(f)
      setTotal(n)
      setPagesHint(t('rotate_kw_all'))
    } catch {
      pushToast(t('toast_pdf_read_fail'), 'error')
    }
  }

  const run = async () => {
    await hapticTap()
    if (!file || !total) {
      pushToast(t('toast_pick_pdf'), 'error')
      return
    }
    const target = parsePageSelection(pagesHint, total, allKwLc)
    if (target.length === 0) {
      pushToast(t('toast_rotate_nopages'), 'error')
      return
    }
    setBusy(true)
    try {
      const out = await rotatePdfPages(file, target, angle)
      await saveUint8Array(out, 'rotated.pdf', 'application/pdf')
      pushToast(isNativeApp() ? t('toast_rotate_done_share') : t('toast_split_done'), 'success')
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
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
      </label>

      {total !== null && (
        <p className="text-sm text-slate-400">
          {t('rotate_total_line', { total })}
          {' '}
          <span className="tabular-nums text-slate-200">{indices.length}</span>
        </p>
      )}

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        {t('rotate_pages_label', { kw: t('rotate_kw_all') })}
        <input
          value={pagesHint}
          onChange={(e) => setPagesHint(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-rose-500/50"
          placeholder={t('rotate_placeholder', { kw: t('rotate_kw_all') })}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        {t('rotate_angle')}
        <select
          value={angle}
          onChange={(e) => setAngle(Number.parseInt(e.target.value, 10) as 90 | 180 | 270)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-rose-500/50"
        >
          <option value={90}>{t('rotate_opt_90cw')}</option>
          <option value={180}>{t('rotate_opt_180')}</option>
          <option value={270}>{t('rotate_opt_270')}</option>
        </select>
      </label>

      <button
        type="button"
        disabled={busy || !file || !total}
        onClick={run}
        className="rounded-2xl bg-lime-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-950/40 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {busy ? t('rotate_busy') : t('rotate_run')}
      </button>
    </div>
  )
}
