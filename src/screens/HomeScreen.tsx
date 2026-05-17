import { Link } from 'react-router-dom'
import {
  Combine,
  Images,
  Layers,
  Shield,
  ImageDown,
  FileDown,
  Droplets,
  RotateCw,
  Scaling,
  SplitSquareHorizontal,
  ScanText,
  LockOpen,
  FilePenLine,
  ShieldQuestion,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

type ToolSpec = {
  to: string
  titleKey: string
  hintKey: string
  icon: LucideIcon
  tone: string
}

const organize: ToolSpec[] = [
  {
    to: '/merge',
    titleKey: 'title_merge',
    hintKey: 'tool_merge_hint',
    icon: Combine,
    tone: 'from-rose-500/30 to-orange-500/20',
  },
  {
    to: '/split',
    titleKey: 'title_split',
    hintKey: 'tool_split_hint',
    icon: SplitSquareHorizontal,
    tone: 'from-fuchsia-500/25 to-rose-500/20',
  },
  {
    to: '/organize',
    titleKey: 'title_organize',
    hintKey: 'tool_organize_hint',
    icon: Layers,
    tone: 'from-indigo-500/25 to-violet-500/20',
  },
]

const optimize: ToolSpec[] = [
  {
    to: '/compress',
    titleKey: 'title_compress',
    hintKey: 'tool_compress_hint',
    icon: Scaling,
    tone: 'from-emerald-500/25 to-teal-500/20',
  },
  {
    to: '/repair-pdf',
    titleKey: 'title_repair',
    hintKey: 'tool_repair_hint',
    icon: Wrench,
    tone: 'from-violet-500/25 to-purple-500/20',
  },
]

const convert: ToolSpec[] = [
  {
    to: '/jpg-to-pdf',
    titleKey: 'title_jpg_pdf',
    hintKey: 'tool_jpg_hint',
    icon: Images,
    tone: 'from-sky-500/25 to-cyan-500/20',
  },
  {
    to: '/pdf-to-jpg',
    titleKey: 'title_pdf_jpg',
    hintKey: 'tool_pdfjpg_hint',
    icon: ImageDown,
    tone: 'from-blue-500/25 to-indigo-500/20',
  },
  {
    to: '/convert-office',
    titleKey: 'home_tool_office_title',
    hintKey: 'tool_office_hint',
    icon: FileDown,
    tone: 'from-orange-500/25 to-amber-500/20',
  },
]

const edit: ToolSpec[] = [
  {
    to: '/edit-pdf',
    titleKey: 'title_edit_pdf',
    hintKey: 'tool_edit_hint',
    icon: FilePenLine,
    tone: 'from-amber-500/25 to-yellow-500/20',
  },
  {
    to: '/watermark',
    titleKey: 'title_watermark',
    hintKey: 'tool_wm_hint',
    icon: Droplets,
    tone: 'from-amber-500/25 to-orange-500/20',
  },
  {
    to: '/rotate',
    titleKey: 'title_rotate',
    hintKey: 'tool_rotate_hint',
    icon: RotateCw,
    tone: 'from-lime-500/20 to-emerald-500/15',
  },
]

const security: ToolSpec[] = [
  {
    to: '/unlock-pdf',
    titleKey: 'title_unlock',
    hintKey: 'tool_unlock_hint',
    icon: LockOpen,
    tone: 'from-emerald-600/25 to-teal-500/20',
  },
  {
    to: '/protect-pdf',
    titleKey: 'title_protect',
    hintKey: 'tool_protect_hint',
    icon: Shield,
    tone: 'from-slate-500/25 to-zinc-500/20',
  },
]

const intelligence: ToolSpec[] = [
  {
    to: '/ocr-pdf',
    titleKey: 'title_ocr_pdf',
    hintKey: 'tool_ocr_hint',
    icon: ScanText,
    tone: 'from-cyan-500/25 to-sky-500/20',
  },
]

function ToolGrid({ items }: { items: ToolSpec[] }) {
  const { t } = useI18n()
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className={[
              'group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-4 shadow-lg transition-transform active:scale-[0.98]',
              item.tone,
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl border border-white/15 bg-black/20 p-2 text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 overflow-hidden">
                <p className="break-words font-semibold leading-snug text-white">{t(item.titleKey)}</p>
                <p className="mt-1 break-words text-xs leading-snug text-slate-200/85">{t(item.hintKey)}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function HomeScreen() {
  const { t } = useI18n()
  const privacyHref = new URL('privacy.html', window.location.href).href

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <section className="rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-600/35 via-slate-900 to-slate-950 p-5 shadow-xl">
        <p className="text-pretty break-words text-sm text-rose-50/90">
          {t('home_intro_a')}
          <strong className="text-white">{t('home_intro_b')}</strong>
          {t('home_intro_c')}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_org')}</h2>
        <ToolGrid items={organize} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_opt')}</h2>
        <ToolGrid items={optimize} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_cv')}</h2>
        <ToolGrid items={convert} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_edit')}</h2>
        <ToolGrid items={edit} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_security')}</h2>
        <ToolGrid items={security} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t('home_section_smart')}</h2>
        <ToolGrid items={intelligence} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex gap-3">
          <ShieldQuestion className="size-10 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm leading-relaxed text-slate-400">
            {t('home_note_part1')}
            <a className="text-rose-300 underline" href="https://developer.ilovepdf.com/" target="_blank" rel="noreferrer">
              {t('home_note_link')}
            </a>
            {t('home_note_part2')}
          </p>
        </div>
        <p className="mt-3 border-t border-white/10 pt-3 text-center text-xs text-slate-500">
          <a className="text-rose-300/90 underline decoration-rose-400/40 underline-offset-2 hover:text-rose-200" href={privacyHref}>
            {t('home_privacy')}
          </a>
        </p>
      </section>
    </div>
  )
}
