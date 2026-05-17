/**
 * После @capacitor/assets inset по умолчанию (16.7%) — подгоняем под одну безопасную зону,
 * чтобы foreground/background не расходились на части лаунчеров.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Меньше % — чуть крупнее глиф в маске (слегка выше прежних 18%). */
const ADAPTIVE_INSET = '16%'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = ['ic_launcher.xml', 'ic_launcher_round.xml'].map((f) =>
  join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', f),
)

for (const p of files) {
  let s = readFileSync(p, 'utf8')
  s = s.replace(
    /(<inset android:drawable="@mipmap\/ic_launcher_background" android:inset=")[^"]*("\s*\/>)/,
    `$1${ADAPTIVE_INSET}$2`,
  )
  s = s.replace(
    /(<inset android:drawable="@mipmap\/ic_launcher_foreground" android:inset=")[^"]*("\s*\/>)/,
    `$1${ADAPTIVE_INSET}$2`,
  )
  writeFileSync(p, s)
}
console.warn(`[icons] adaptive inset (background + foreground) → ${ADAPTIVE_INSET}`)
