'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { Search, Bookmark, X, PanelLeftClose } from 'lucide-react'
import { GitHubButton } from '@/components/ui/github-button'
import { DownloadApkButton } from '@/components/ui/download-apk-button'
import type { Block } from '@core/content'
import { getThemeTitle } from '@core/content'
import { useProgress } from '@/hooks/use-progress'
import { useThemeSearch } from '@/hooks/use-theme-search'
import { BlockSection } from '@/components/sidebar-block'
import type { SidebarTheme } from '@/components/sidebar-block'
import { SearchResults } from '@/components/sidebar-search'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/theme-provider'
import versionData from '../../../../package.json'
import {Badge} from '@/components/ui/badge';

const version = versionData.version

interface SidebarProps {
  blocks: Block[]
  themes: SidebarTheme[]
  activeBlock?: string
  activeTheme?: string
  onClose?: () => void
  onCollapse?: () => void
}

export function Sidebar({
  blocks,
  themes,
  activeBlock,
  activeTheme,
  onClose,
  onCollapse,
}: SidebarProps) {
  const { progress } = useProgress()
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(blocks.map((b) => [b.id, false])),
  )
  const { results, searching, active: searchActive, q } = useThemeSearch(query)

  const themesByBlock = useMemo(() => {
    const map = new Map<string, SidebarTheme[]>()
    for (const t of themes) {
      const list = map.get(t.blockId)
      if (list) list.push(t)
      else map.set(t.blockId, [t])
    }
    return map
  }, [themes])

  const localMatches = useMemo(() => {
    if (q.length < 2) return []
    return themes.filter((t) => getThemeTitle(t.themeId).toLowerCase().includes(q))
  }, [themes, q])

  const visibleBlocks = useMemo(() => {
    if (!searchActive) return blocks
    return blocks.filter((block) => {
      const blockThemes = themesByBlock.get(block.id) ?? []
      return (
        block.title.toLowerCase().includes(q) ||
        blockThemes.some(
          (t) =>
            t.themeId.toLowerCase().includes(q) ||
            getThemeTitle(t.themeId).toLowerCase().includes(q),
        )
      )
    })
  }, [blocks, themesByBlock, searchActive, q])

  const toggleBlock = useCallback((blockId: string) => {
    setCollapsed((c) => ({ ...c, [blockId]: !c[blockId] }))
  }, [])

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Шапка сайдбара */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>Fullstack Core</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeProvider />
          {onCollapse && (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              aria-label="Свернуть меню"
              title="Свернуть меню"
              onClick={onCollapse}
            >
              <PanelLeftClose className="size-5" />
            </Button>
          )}
          {onClose && (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              aria-label="Закрыть меню"
              title="Закрыть меню"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Поиск */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по темам..."
            className="pl-9 pr-8 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Навигация / Список тем */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {searchActive ? (
            <SearchResults
              results={results}
              searching={searching}
              localMatches={localMatches}
              q={q}
            />
          ) : (
            <nav className="space-y-1">
              <Link
                href="/bookmarks"
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
                  activeTheme === 'bookmarks' &&
                    'bg-accent text-accent-foreground',
                )}
              >
                <Bookmark className="size-4 text-amber-500" />
                <span>Закладки</span>
              </Link>

              <div className="my-2 border-t" />

              {visibleBlocks.map((block) => (
                <BlockSection
                  key={block.id}
                  block={block}
                  themes={themesByBlock.get(block.id) ?? []}
                  progress={progress}
                  isActive={block.id === activeBlock}
                  activeTheme={activeTheme}
                  collapsed={collapsed[block.id]}
                  onToggle={() => toggleBlock(block.id)}
                />
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>

      {/* Футер сайдбара */}
      <div className="border-t p-3 flex items-center justify-center gap-2">
        <Badge variant="outline">v {version}</Badge>
        <GitHubButton />
        <DownloadApkButton />
      </div>
    </aside>
  )
}
