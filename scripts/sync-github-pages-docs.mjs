/**
 * Copies static Play / AdMob files into docs/ for GitHub Pages (branch + /docs folder).
 * Run after changing public/privacy.html or public/app-ads.txt.
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const docs = join(root, 'docs')

mkdirSync(docs, { recursive: true })
copyFileSync(join(root, 'public', 'privacy.html'), join(docs, 'privacy.html'))
copyFileSync(join(root, 'public', 'app-ads.txt'), join(docs, 'app-ads.txt'))

console.log('Synced → docs/: privacy.html, app-ads.txt (from public/)')
