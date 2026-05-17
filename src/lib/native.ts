import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

export async function hapticTap(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* ignore */
  }
}
