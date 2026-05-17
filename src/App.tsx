import { useMemo } from 'react'
import { NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, BookOpen, LayoutGrid, History } from 'lucide-react'
import { InboundLaunchBridge } from './components/InboundLaunchBridge'
import { AdMobBootstrap } from './components/AdMobBootstrap'
import { ToastProvider, useToast } from './context/ToastContext'
import { useI18n } from './context/I18nContext'
import type { LocalePreference } from './i18n/detectLocale'
import { hapticTap } from './lib/native'
import { HomeScreen } from './screens/HomeScreen'
import { ReaderScreen } from './screens/ReaderScreen'
import { MergeScreen } from './screens/MergeScreen'
import { SplitScreen } from './screens/SplitScreen'
import { CompressScreen } from './screens/CompressScreen'
import { JpgToPdfScreen } from './screens/JpgToPdfScreen'
import { PdfToJpgScreen } from './screens/PdfToJpgScreen'
import { WatermarkScreen } from './screens/WatermarkScreen'
import { RotateScreen } from './screens/RotateScreen'
import { OrganizeScreen } from './screens/OrganizeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { EditPdfScreen } from './screens/EditPdfScreen'
import { UnlockPdfScreen } from './screens/UnlockPdfScreen'
import { RepairPdfScreen } from './screens/RepairPdfScreen'
import { OcrPdfScreen } from './screens/OcrPdfScreen'
import { ConvertOfficeScreen } from './screens/ConvertOfficeScreen'
import { ProtectPdfScreen } from './screens/ProtectPdfScreen'

const ROOT_PATHS = new Set(['/', '/reader', '/history'])

const ROUTE_TITLE_KEY: Record<string, string> = {
  '/': 'title_pdf',
  '/reader': 'title_reader',
  '/history': 'title_history',
  '/merge': 'title_merge',
  '/split': 'title_split',
  '/compress': 'title_compress',
  '/repair-pdf': 'title_repair',
  '/jpg-to-pdf': 'title_jpg_pdf',
  '/pdf-to-jpg': 'title_pdf_jpg',
  '/convert-office': 'title_convert_office',
  '/watermark': 'title_watermark',
  '/rotate': 'title_rotate',
  '/organize': 'title_organize',
  '/edit-pdf': 'title_edit_pdf',
  '/unlock-pdf': 'title_unlock',
  '/protect-pdf': 'title_protect',
  '/ocr-pdf': 'title_ocr_pdf',
}

function ShellLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toasts, dismissToast } = useToast()
  const { t, preference, setPreference } = useI18n()

  const switchPreference = async (next: LocalePreference) => {
    await hapticTap()
    setPreference(next)
  }

  const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')
  const titleKey = ROUTE_TITLE_KEY[path] ?? 'title_pdf'
  const title = useMemo(() => t(titleKey), [t, titleKey])
  const showBack = !ROOT_PATHS.has(path)
  const isReader = path === '/reader'
  const isHome = path === '/'

  const onBack = async () => {
    await hapticTap()
    navigate(-1)
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-[100vw] flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-rose-500/25 bg-gradient-to-b from-slate-900 to-slate-950 px-[max(1rem,env(safe-area-inset-left))] pb-3.5 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.875rem,env(safe-area-inset-top))] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/35 to-transparent"
          aria-hidden
        />
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-xl border border-rose-400/20 bg-rose-950/35 p-2 text-rose-50 shadow-inner shadow-rose-950/50 transition-colors hover:border-rose-400/35 hover:bg-rose-900/45 active:bg-rose-950/60"
            aria-label={t('aria_back')}
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <span className="w-9 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1 overflow-hidden py-0.5">
          {!isHome && ROOT_PATHS.has(path) ? (
            <p className="mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.28em] text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.35)]">
              PDFer
            </p>
          ) : null}
          <h1
            className={[
              'truncate font-extrabold tracking-tight text-white',
              isHome
                ? 'text-[1.75rem] leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:text-[2.05rem]'
                : 'text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-2xl',
            ].join(' ')}
          >
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 rounded-xl border border-white/10 bg-slate-950/60 p-0.5" role="group" aria-label={t('lang_switch_aria')}>
          <button
            type="button"
            title={t('lang_system_aria')}
            className={`rounded-lg px-1.5 py-1 text-[10px] font-semibold tabular-nums leading-tight sm:px-2.5 sm:text-xs ${
              preference === 'system' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => void switchPreference('system')}
          >
            {t('lang_system_short')}
          </button>
          <button
            type="button"
            className={`rounded-lg px-1.5 py-1 text-[10px] font-bold tabular-nums sm:px-2.5 sm:text-xs ${
              preference === 'en' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => void switchPreference('en')}
          >
            {t('lang_en')}
          </button>
          <button
            type="button"
            className={`rounded-lg px-1.5 py-1 text-[10px] font-bold tabular-nums sm:px-2.5 sm:text-xs ${
              preference === 'ru' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => void switchPreference('ru')}
          >
            {t('lang_ru')}
          </button>
        </div>
      </header>

      <main
        className={[
          'min-h-0 flex-1 overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]',
          isReader
            ? 'flex flex-col overflow-hidden pb-0 pt-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]'
            : 'overflow-y-auto px-[max(1rem,env(safe-area-inset-left))] pb-4 pr-[max(1rem,env(safe-area-inset-right))] pt-4',
        ].join(' ')}
      >
        <div
          className={[
            'mx-auto min-h-0 w-full min-w-0',
            isReader ? 'flex flex-1 flex-col max-w-none' : 'max-w-3xl',
          ].join(' ')}
        >
          <Outlet />
        </div>
      </main>

      <nav
        className="shrink-0 border-t border-white/[0.06] bg-[#020617] pb-[max(0.35rem,env(safe-area-inset-bottom))] pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] pt-2"
        aria-label={t('aria_main_nav')}
      >
        <div className="mx-auto flex max-w-lg min-w-0 items-stretch justify-between gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors sm:gap-1 sm:px-2 sm:text-xs',
                isActive ? 'bg-rose-600/25 text-rose-100' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')
            }
            end
          >
            <LayoutGrid className="size-5 shrink-0" aria-hidden />
            <span className="max-w-full truncate text-center leading-tight">{t('nav_tools')}</span>
          </NavLink>
          <NavLink
            to="/reader"
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors sm:gap-1 sm:px-2 sm:text-xs',
                isActive ? 'bg-rose-600/25 text-rose-100' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')
            }
          >
            <BookOpen className="size-5 shrink-0" aria-hidden />
            <span className="max-w-full truncate text-center leading-tight">{t('nav_reader')}</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              [
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors sm:gap-1 sm:px-2 sm:text-xs',
                isActive ? 'bg-rose-600/25 text-rose-100' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')
            }
          >
            <History className="size-5 shrink-0" aria-hidden />
            <span className="max-w-full truncate text-center leading-tight">{t('nav_history')}</span>
          </NavLink>
        </div>
      </nav>

      <div
        className="pointer-events-none fixed inset-x-0 z-50 flex max-h-[40vh] flex-col items-center gap-2 overflow-y-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))' }}
        aria-live="polite"
      >
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              'pointer-events-auto max-w-full rounded-2xl border px-4 py-3 text-left text-sm shadow-lg backdrop-blur-md break-words sm:max-w-lg',
              item.kind === 'success' && 'border-emerald-500/40 bg-emerald-950/90 text-emerald-50',
              item.kind === 'error' && 'border-red-500/40 bg-red-950/90 text-red-50',
              item.kind === 'info' && 'border-white/20 bg-slate-900/95 text-slate-50',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => dismissToast(item.id)}
          >
            {item.message}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <InboundLaunchBridge />
      <AdMobBootstrap />
      <Routes>
        <Route element={<ShellLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="reader" element={<ReaderScreen />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="merge" element={<MergeScreen />} />
          <Route path="split" element={<SplitScreen />} />
          <Route path="compress" element={<CompressScreen />} />
          <Route path="repair-pdf" element={<RepairPdfScreen />} />
          <Route path="jpg-to-pdf" element={<JpgToPdfScreen />} />
          <Route path="pdf-to-jpg" element={<PdfToJpgScreen />} />
          <Route path="convert-office" element={<ConvertOfficeScreen />} />
          <Route path="watermark" element={<WatermarkScreen />} />
          <Route path="rotate" element={<RotateScreen />} />
          <Route path="organize" element={<OrganizeScreen />} />
          <Route path="edit-pdf" element={<EditPdfScreen />} />
          <Route path="unlock-pdf" element={<UnlockPdfScreen />} />
          <Route path="protect-pdf" element={<ProtectPdfScreen />} />
          <Route path="ocr-pdf" element={<OcrPdfScreen />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
