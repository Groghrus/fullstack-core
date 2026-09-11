import { readFile } from 'fs/promises'
import path from 'node:path'
import { getAllThemes, getThemeTitle, buildIndex, extractText, search } from '@core/content'
import type { SearchIndex } from '@core/content'
import { CONTENT_ROOT } from './content-root'

let cache: SearchIndex | null = null

async function getIndex(): Promise<SearchIndex> {
  if (cache) return cache
  const themes = getAllThemes()
  const inputs = await Promise.all(
    themes.map(async (t) => {
      const raw = await readFile(
        path.join(CONTENT_ROOT, t.blockId, `${t.themeId}.md`),
        'utf-8',
      )
      return {
        id: t.themeId,
        title: getThemeTitle(t.themeId),
        text: extractText(raw),
        blockId: t.blockId,
        path: t.path,
      }
    }),
  )
  cache = buildIndex(inputs)
  return cache
}

export async function searchThemes(q: string, limit = 15) {
  const index = await getIndex()
  return search(index, q, limit)
}