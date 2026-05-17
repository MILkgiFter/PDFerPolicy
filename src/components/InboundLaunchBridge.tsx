import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../context/I18nContext'
import { detectReaderKind } from '../lib/readerFormats'
import { fileFromInboundNativeUri, setPendingInboundFile } from '../lib/inboundOpen'
import { messageFromCaught } from '../i18n/formatError'

function isInboundNativeUri(url: string): boolean {
  return url.startsWith('content://') || url.startsWith('file://')
}

/**
 * Обрабатывает открытие файла из другого приложения (Android VIEW / SEND → VIEW).
 */
export function InboundLaunchBridge() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { t } = useI18n()
  const handlingRef = useRef<string | null>(null)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let listener: { remove: () => Promise<void> } | undefined

    const handleUrl = async (url: string | undefined) => {
      if (!url || !isInboundNativeUri(url)) return
      if (handlingRef.current === url) return
      handlingRef.current = url
      try {
        const file = await fileFromInboundNativeUri(url)
        const kind = detectReaderKind(file)
        if (kind === 'unsupported') {
          pushToast(t('inbound_unsupported_open'), 'error')
          return
        }
        setPendingInboundFile(file)
        navigate(
          { pathname: '/reader', search: `?open=inbound&t=${Date.now()}` },
          { replace: true },
        )
      } catch (e) {
        pushToast(messageFromCaught(e, t), 'error')
      } finally {
        handlingRef.current = null
      }
    }

    void App.getLaunchUrl().then((r) => void handleUrl(r?.url))

    void App.addListener('appUrlOpen', ({ url }) => void handleUrl(url)).then((handle) => {
      listener = handle
    })

    return () => {
      void listener?.remove()
    }
  }, [navigate, pushToast, t])

  return null
}
