import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pdfer.app',
  appName: 'PDFer',
  webDir: 'dist',
  /** Подложка WebView до отрисовки страницы (без белой вспышки). */
  backgroundColor: '#020617',
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
  },
}

export default config
