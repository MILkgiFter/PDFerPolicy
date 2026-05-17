import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { initAdMobAndShowBanner } from '../lib/admob'

export function AdMobBootstrap() {
  useEffect(() => {
    void initAdMobAndShowBanner()

    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return

    const handle = App.addListener('resume', () => {
      void initAdMobAndShowBanner()
    })

    return () => {
      void handle.then((h) => h.remove())
    }
  }, [])
  return null
}
