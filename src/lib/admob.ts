import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdPluginEvents,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob'

const metaEnv = (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env
/** В `.env` задайте `VITE_ADMOB_USE_GOOGLE_DEMO_UNITS=true`, пересоберите — проверка, что SDK и слоты работают (демо-блоки Google). */
const USE_GOOGLE_DEMO_ADS = String(metaEnv?.VITE_ADMOB_USE_GOOGLE_DEMO_UNITS) === 'true'

/** Продакшен-блоки (видны в APK — это нормально). */
const PROD_BANNER = 'ca-app-pub-7222055770291725/8115290166'
const PROD_INTERSTITIAL = 'ca-app-pub-7222055770291725/8334553108'
/** Официальные тестовые ID Google для проверки интеграции. */
const DEMO_BANNER = 'ca-app-pub-3940256099942544/6300978111'
const DEMO_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712'

const BANNER_AD_UNIT_ID = USE_GOOGLE_DEMO_ADS ? DEMO_BANNER : PROD_BANNER
const INTERSTITIAL_AD_UNIT_ID = USE_GOOGLE_DEMO_ADS ? DEMO_INTERSTITIAL : PROD_INTERSTITIAL

const ANDROID_ADS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

/** true, если инициализация завершилась (успех, либо UMP окончательно запретил рекламу). */
let initFinished = false
let initInFlight = false
let adsAllowed = false
let dismissListenerAttached = false
let debugListenersAttached = false

const INTERSTITIAL_COOLDOWN_MS = 90_000
let lastInterstitialShownAt = 0

function resolveAdsAllowed(consent: {
  canRequestAds: boolean
  status: AdmobConsentStatus
}): boolean {
  if (consent.canRequestAds) return true
  /** В регионах без UMP Google не требует формы; иногда SDK всё равно отдаёт canRequestAds: false — иначе баннер никогда не запросится. */
  if (consent.status === AdmobConsentStatus.NOT_REQUIRED) return true
  return false
}

async function attachDebugAdListeners(): Promise<void> {
  if (!ANDROID_ADS || debugListenersAttached) return
  debugListenersAttached = true
  await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
    console.warn('[AdMob] баннер загружен')
  })
  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
    console.warn('[AdMob] баннер не загрузился', err)
  })
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err) => {
    console.warn('[AdMob] interstitial не загрузился', err)
  })
}

async function attachDismissListener(): Promise<void> {
  if (!ANDROID_ADS || dismissListenerAttached) return
  dismissListenerAttached = true
  await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    void prepareInterstitialAd()
  })
}

async function prepareInterstitialAd(): Promise<void> {
  if (!ANDROID_ADS || !adsAllowed) return
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_UNIT_ID })
  } catch {
    /* попытка повторится после закрытия предыдущего или следующего экспорта */
  }
}

export async function initAdMobAndShowBanner(): Promise<void> {
  if (!ANDROID_ADS || initFinished || initInFlight) return
  initInFlight = true

  try {
    if (USE_GOOGLE_DEMO_ADS) {
      await AdMob.initialize({ initializeForTesting: true })
    } else {
      await AdMob.initialize()
    }

    let consent = await AdMob.requestConsentInfo()
    /** В Android-плагине это `loadAndShowConsentFormIfRequired`: окно только при необходимости. */
    try {
      const afterForm = await AdMob.showConsentForm()
      consent = { ...consent, ...afterForm, canRequestAds: afterForm.canRequestAds }
    } catch (e) {
      console.warn('[AdMob] consent form', e)
    }

    adsAllowed = resolveAdsAllowed(consent as { canRequestAds: boolean; status: AdmobConsentStatus })
    if (!adsAllowed) {
      console.warn('[AdMob] запрос рекламы запрещён (UMP)', {
        status: consent.status,
        canRequestAds: consent.canRequestAds,
      })
      initFinished = true
      return
    }

    await attachDebugAdListeners()
    await attachDismissListener()

    await AdMob.showBanner({
      adId: BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 84,
    })

    void prepareInterstitialAd()
    initFinished = true
  } catch (e) {
    console.warn('[AdMob] init (повтор при следующем открытии приложения)', e)
    adsAllowed = false
    /** initFinished не ставим — при resume можно повторить после сети / Play Services */
  } finally {
    initInFlight = false
  }
}

/** После успешного экспорта (шторка «Поделиться» и т.п.). Не чаще INTERSTITIAL_COOLDOWN_MS. */
export function maybeShowInterstitialAfterExport(): void {
  if (!ANDROID_ADS || !adsAllowed) return

  const now = Date.now()
  if (now - lastInterstitialShownAt < INTERSTITIAL_COOLDOWN_MS) return

  void (async () => {
    try {
      await AdMob.showInterstitial()
      lastInterstitialShownAt = Date.now()
    } catch {
      void prepareInterstitialAd()
    }
  })()
}
