import { useCallback, useState, type ChangeEventHandler } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Shuffle } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { mergePdfs } from '../lib/pdfToolkit'
import { hapticTap, isNativeApp } from '../lib/native'
import { saveUint8Array } from '../lib/saveOutput'
import { maybeShowInterstitialAfterExport } from '../lib/admob'
import { messageFromCaught } from '../i18n/formatError'

type MergeItem = { id: string; file: File }

function SortableRow({
  item,
  onRemove,
  ariaDrag,
  ariaRemove,
}: {
  item: MergeItem
  onRemove: (id: string) => void
  ariaDrag: string
  ariaRemove: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-2 py-2"
    >
      <button
        type="button"
        className="touch-none rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        aria-label={ariaDrag}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5 shrink-0" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{item.file.name}</span>
      <button
        type="button"
        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-200"
        aria-label={ariaRemove}
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export function MergeScreen() {
  const { pushToast } = useToast()
  const { t } = useI18n()
  const [items, setItems] = useState<MergeItem[]>([])
  const [busy, setBusy] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const appendFiles = useCallback(
    (list: File[]) => {
      const pdfs = list.filter((f) => f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf'))
      if (pdfs.length !== list.length) pushToast(t('merge_skip_non_pdf'), 'info')
      setItems((prev) => [...prev, ...pdfs.map((file) => ({ id: crypto.randomUUID(), file }))])
    },
    [pushToast, t],
  )

  const onPickMulti: ChangeEventHandler<HTMLInputElement> = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    appendFiles(list)
    e.target.value = ''
  }

  const onPickSingle: ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (f) appendFiles([f])
    e.target.value = ''
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id)
      const newIndex = prev.findIndex((x) => x.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const shuffle = async () => {
    await hapticTap()
    setItems((prev) => {
      const a = [...prev]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    })
    pushToast(t('toast_order_shuffled'), 'info')
  }

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id))

  const clear = () => setItems([])

  const run = async () => {
    await hapticTap()
    if (items.length < 2) {
      pushToast(t('toast_min_two_pdf'), 'error')
      return
    }
    setBusy(true)
    try {
      const files = items.map((i) => i.file)
      const out = await mergePdfs(files)
      await saveUint8Array(out, 'merged.pdf', 'application/pdf')
      pushToast(
        isNativeApp() ? t('toast_merge_done_share') : t('toast_merge_done_desktop'),
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
      <p className="text-sm leading-relaxed text-slate-400">{t('merge_intro')}</p>

      <div className="flex flex-wrap gap-2">
        <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-center hover:bg-white/10">
          <span className="text-sm font-medium text-white">{t('merge_add_pdf')}</span>
          <input type="file" accept="application/pdf" multiple className="hidden" onChange={onPickMulti} />
        </label>
        <label className="flex-1 cursor-pointer rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center hover:bg-white/10">
          <span className="text-sm text-slate-200">{t('merge_one_by_one')}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={onPickSingle} />
        </label>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void shuffle()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            <Shuffle className="size-4" />
            {t('merge_shuffle')}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-400 hover:bg-white/5"
          >
            {t('merge_clear_list')}
          </button>
        </div>
      )}

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onRemove={remove}
                  ariaDrag={t('aria_drag_sort')}
                  ariaRemove={t('aria_remove')}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        disabled={busy || items.length < 2}
        onClick={run}
        className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {busy ? t('merge_processing') : t('merge_save')}
      </button>
    </div>
  )
}
