import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const standalone = join(root, '.next', 'standalone')

if (!existsSync(standalone)) {
  console.error('Standalone output not found. Run `next build` first.')
  process.exit(1)
}

cpSync(join(root, '.next', 'static'), join(standalone, '.next', 'static'), { recursive: true })
cpSync(join(root, 'public'), join(standalone, 'public'), { recursive: true })

console.log('Copied static assets into standalone output.')
