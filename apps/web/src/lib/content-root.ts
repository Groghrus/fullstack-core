import { existsSync } from 'fs'
import path from 'node:path'

/**
 * Определяет корень монорепо (каталог, содержащий packages/content/themes),
 * поднимаясь вверх от process.cwd(). Не зависит от того, откуда запущен
 * next build/dev (apps/web или корень репо).
 */
export function resolveRepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, 'packages', 'content', 'themes'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

export const CONTENT_ROOT = path.join(
  resolveRepoRoot(),
  'packages',
  'content',
  'themes',
)
