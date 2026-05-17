import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { pdfjs } from 'react-pdf'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './context/I18nContext'

/** В WebView иногда нужен абсолютный URL до worker */
function resolvePdfWorkerSrc(): string {
  const bundled = pdfWorkerUrl as string
  if (!Capacitor.isNativePlatform()) return bundled
  try {
    return new URL(bundled.replace(/^\//, ''), window.location.href).href
  } catch {
    return bundled
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc()

/** Скрывает HTML-splash сразу после первого кадра React (тема как в приложении). */
function dismissAppSplash() {
  const el = document.getElementById('app-splash')
  if (!el) return
  const done = () => el.remove()
  el.addEventListener(
    'transitionend',
    (e) => {
      if (e.propertyName === 'opacity') done()
    },
    { once: true },
  )
  el.classList.add('app-splash--out')
  window.setTimeout(done, 480)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HashRouter>
  </StrictMode>,
)

queueMicrotask(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissAppSplash)
  })
})
