'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, ChevronDown, ChevronRight, Bookmark } from 'lucide-react'
import type { Block } from '@core/content'
import { getThemeTitle } from '@core/content'
import type { ThemeProgress } from '@core/config'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/theme-provider'

interface SidebarProps {
  blocks: Block[]
  themes: { blockId: string; themeId: string; path: string }[]
  progress: Record<string, ThemeProgress>
  activeBlock?: string
  activeTheme?: string
}

export function Sidebar({
  blocks,
  themes,
  progress,
  activeBlock,
  activeTheme,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [bookmarksOnly, setBookmarksOnly] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(
      blocks.map((b) => [b.id, false]) // все раскрыты по умолчанию
    ),
  )

  const q = query.trim().toLowerCase()

  const byBlock = (blockId: string) =>
    themes.filter((t) => t.blockId === blockId)

  const bookmarkedIds = new Set(
    Object.values(progress)
      .filter((p) => p.bookmarked)
      .map((p) => p.themeId),
  )

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Поиск */}
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск темы..."
              className="pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                aria-label="Сбросить поиск"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <span className="text-base leading-none">×</span>
              </button>
            )}
          </div>
          <ThemeProvider />
        </div>
        <Button
          variant={bookmarksOnly ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={() => setBookmarksOnly((v) => !v)}
        >
          <Bookmark className="mr-1 size-4" />
          Закладки ({bookmarkedIds.size})
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2">
          {blocks
            .filter((b) => {
              if (!q) return true
              const bTitle = b.title.toLowerCase()
              const hasQ =
                bTitle.includes(q) ||
                byBlock(b.id).some(
                  (t) =>
                    t.themeId.toLowerCase().includes(q) ||
                    getThemeTitle(t.themeId).toLowerCase().includes(q),
                )
              return hasQ
            })
            .map((block) => {
              const isActive = block.id === activeBlock
              const open = collapsed[block.id]
              const blockThemes = byBlock(block.id).filter((t) =>
                bookmarksOnly ? bookmarkedIds.has(t.themeId) : true,
              )
              const countDone = byBlock(block.id).filter(
                (t) => progress[t.themeId]?.status === 'done',
              ).length

              return (
                <div key={block.id} className="mb-1">
                  <button
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [block.id]: !c[block.id] }))
                    }
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
                      isActive && !q ? 'bg-accent text-accent-foreground' : '',
                    )}
                  >
                    {open ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-left">
                      {block.order}. {block.title}
                    </span>
                    {countDone > 0 && countDone === blockThemes.length ? (
                      <span className="text-xs text-emerald-500">✓</span>
                    ) : countDone > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {countDone}/{blockThemes.length}
                      </span>
                    ) : null}
                  </button>

                  {open && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
                      {blockThemes.map((t) => {
                        const p = progress[t.themeId]
                        const done = p?.status === 'done'
                        const title = getThemeTitle(t.themeId)
                        const isActiveTheme =
                          t.themeId === activeTheme && !q
                        return (
                          <Link
                            key={t.themeId}
                            href={`/themes/${t.path}`}
                            className={cn(
                              'block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              isActiveTheme && 'bg-accent text-accent-foreground',
                            )}
                          >
                            <span className="mr-1.5">
                              {done ? '✅' : p ? '📖' : ''}
                            </span>
                            {title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
