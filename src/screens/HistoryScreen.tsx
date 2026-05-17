import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import type { HistoryRecord } from '../lib/historyDb'
import { deleteHistoryRecord, listHistory, clearHistory } from '../lib/historyDb'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { hapticTap } from '../lib/native'
import { shareOrDownloadExisting } from '../lib/saveOutput'
import { canPreviewInReader } from '../lib/readerFormats'

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}\u202fB`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}\u202fKB`
  return `${(n / (1024 * 1024)).toFixed(1)}\u202fMB`
}

export function HistoryScreen() {
  const { locale, t } = useI18n()
  const { pushToast } = useToast()
  const navigate = useNavigate()

  const [rows, setRows] = useState<HistoryRecord[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const localeTag = locale === 'ru' ? 'ru-RU' : 'en-US'

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [localeTag],
  )

  const load = useCallback(async () => {
    const list = await listHistory()
    setRows(list)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onClear = async () => {
    await hapticTap()
    await clearHistory()
    pushToast(t('toast_history_cleared'), 'success')
    void load()
  }

  const onOpen = async (id: string) => {
    await hapticTap()
    navigate(`/reader?h=${encodeURIComponent(id)}`)
  }

  const onShare = async (rec: HistoryRecord) => {
    await hapticTap()
    setBusyId(rec.id)
    try {
      await shareOrDownloadExisting(rec.blob, rec.title, rec.mime)
    } catch (e) {
      pushToast(e instanceof Error ? e.message : t('err_generic'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id: string) => {
    await hapticTap()
    await deleteHistoryRecord(id)
    pushToast(t('toast_history_removed'), 'info')
    void load()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm leading-relaxed text-slate-400">{t('history_intro')}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() => void onClear()}
          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('history_clear')}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-12 text-center text-sm text-slate-400">
          {t('history_empty')}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{r.title}</p>
                <p className="tabular-nums text-xs text-slate-500">
                  {formatter.format(new Date(r.createdAt))}
                  {' · '}
                  {fmtBytes(r.size)}
                  {' · '}
                  {(r.mime || '—').slice(0, 48)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canPreviewInReader({ title: r.title, mime: r.mime })}
                  onClick={() => void onOpen(r.id)}
                  className="rounded-xl bg-rose-600/85 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {t('history_open')}
                </button>

                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void onShare(r)}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-white/10 disabled:opacity-50"
                >
                  {busyId === r.id ? t('office_opening') : t('history_share_again')}
                </button>

                <button
                  type="button"
                  aria-label={t('history_delete')}
                  onClick={() => void onDelete(r.id)}
                  className="rounded-xl border border-rose-500/30 p-2 text-rose-200 hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
