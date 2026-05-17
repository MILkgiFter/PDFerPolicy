/**
 * После @capacitor/assets: убираем прозрачный padding у legacy и «лужи» у round.
 * Без trim исходника — иначе съедаются мягкие края глифа (иконка «обрезанная»).
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICON_SURFACE } from './icon-surface.mjs'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconPath = join(root, 'assets', 'icon.png')
const resRoot = join(root, 'android', 'app', 'src', 'main', 'res')

const PAD_BG = ICON_SURFACE

const LEGACY = [
  { density: 'ldpi', size: 36 },
  { density: 'mdpi', size: 48 },
  { density: 'hdpi', size: 72 },
  { density: 'xhdpi', size: 96 },
  { density: 'xxhdpi', size: 144 },
  { density: 'xxxhdpi', size: 192 },
]

const ADAPTIVE_FG = [
  { density: 'ldpi', size: 81 },
  { density: 'mdpi', size: 108 },
  { density: 'hdpi', size: 162 },
  { density: 'xhdpi', size: 216 },
  { density: 'xxhdpi', size: 324 },
  { density: 'xxxhdpi', size: 432 },
]

async function loadIconBuffer() {
  return sharp(iconPath).ensureAlpha().png().toBuffer()
}

async function writeLegacySquare(iconBuf, size, destDir) {
  /** Доля полей от стороны слота (фикс 18 на ldpi 36 давал inner≈0 — сильная обрезка). */
  const padding = Math.max(3, Math.min(14, Math.round(size * 0.095)))
  const inner = Math.max(1, size - padding * 2)
  const composited = await sharp(iconBuf)
    .resize(inner, inner, { fit: 'contain', background: PAD_BG })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: PAD_BG,
    })
    .png()
    .toBuffer()
  await sharp(composited).png().toFile(join(destDir, 'ic_launcher.png'))
}

async function writeLegacyRound(iconBuf, size, destDir) {
  const w = size
  const h = size
  /** Чуть крупнее глифа на лаунчере (было 0.9). */
  const innerScale = 0.94
  const iw = Math.max(1, Math.round(w * innerScale))
  const ih = Math.max(1, Math.round(h * innerScale))
  const iconInner = await sharp(iconBuf)
    .resize(iw, ih, { fit: 'contain', background: PAD_BG })
    .png()
    .toBuffer()
  const onSquare = await sharp({
    create: { width: w, height: h, channels: 4, background: PAD_BG },
  })
    .composite([{ input: iconInner, gravity: 'center' }])
    .png()
    .toBuffer()
  const svg = Buffer.from(
    `<svg width="${w}" height="${h}"><circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}" fill="#ffffff"/></svg>`,
  )
  const circled = await sharp(onSquare).composite([{ input: svg, blend: 'dest-in' }]).png().toBuffer()
  const bgBase = await sharp({
    create: { width: w, height: h, channels: 4, background: PAD_BG },
  })
    .png()
    .toBuffer()
  await sharp(bgBase).composite([{ input: circled, blend: 'over' }]).png().toFile(join(destDir, 'ic_launcher_round.png'))
}

async function main() {
  const iconBuf = await loadIconBuffer()
  for (const { density, size } of LEGACY) {
    const destDir = join(resRoot, `mipmap-${density}`)
    await writeLegacySquare(iconBuf, size, destDir)
    await writeLegacyRound(iconBuf, size, destDir)
  }
  for (const { density, size } of ADAPTIVE_FG) {
    const destDir = join(resRoot, `mipmap-${density}`)
    /** ~0.94 слоя — чуть крупнее, всё ещё с запасом под маску. */
    const innerScale = 0.94
    const iw = Math.max(1, Math.round(size * innerScale))
    const iconTile = await sharp(iconBuf)
      .resize(iw, iw, { fit: 'contain', background: PAD_BG })
      .png()
      .toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: PAD_BG },
    })
      .composite([{ input: iconTile, gravity: 'center' }])
      .png()
      .toFile(join(destDir, 'ic_launcher_foreground.png'))
  }
  console.warn('[icons] refined: legacy + adaptive foreground (opaque pad, without trim)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
