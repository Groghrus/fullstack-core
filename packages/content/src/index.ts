import registry from '../registry.json'
import titles from '../titles.json'

export interface ThemeRef {
  id: string
  file: string
}

/** Русское (человекочитаемое) название темы по её id */
export function getThemeTitle(themeId: string): string {
  return (titles as Record<string, string>)[themeId] ?? themeId.replace(/-/g, ' ')
}

export interface Block {
  id: string
  title: string
  order: number
  themes: string[]
}

export type Registry = {
  blocks: Block[]
}

export const contentRegistry: Registry = registry as Registry

/** Все темы в плоском виде: { blockId, themeId, path } */
export function getAllThemes() {
  const out: { blockId: string; themeId: string; path: string }[] = []
  for (const block of contentRegistry.blocks) {
    for (const themeId of block.themes) {
      out.push({
        blockId: block.id,
        themeId,
        path: `${block.id}/${themeId}`,
      })
    }
  }
  return out
}

/** Все блоки (категории) отсортированные по order */
export function getBlocks() {
  return [...contentRegistry.blocks].sort((a, b) => a.order - b.order)
}

/** Найти блок по id темы */
export function findBlockByTheme(themeId: string) {
  return contentRegistry.blocks.find((b) => b.themes.includes(themeId))
}
