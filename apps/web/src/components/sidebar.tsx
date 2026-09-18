'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Bookmark,
  X,
  PanelLeftClose,
  Loader2,
} from 'lucide-react'
import { GitHubButton } from '@/components/ui/github-button'
import { DownloadApkButton } from '@/components/ui/download-apk-button'
import type { Block } from '@core/content'
import { getThemeTitle } from '@core/content'
import type { ThemeProgress } from '@core/config'
import { version } from '../../../../package.json'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/theme-provider'

interface SearchResultItem {
  themeId: string
  blockId: string
  title: string
  path: string
  snippet: string
  score: number
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Подсвечивает вхождения слов запроса (через split(re) нечётные части — совпадения) */
function highlight(text: string, query: string, keyPrefix: string) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2)
  if (!words.length) return text
  const re = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')
  return text
    .split(re)
    .map((part, i) =>
      i % 2 === 1 ? (
        <mark
          key={`${keyPrefix}-${i}`}
          className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30"
        >
          {part}
        </mark>
      ) : (
        <span key={`${keyPrefix}-${i}`}>{part}</span>
      ),
    )
}

interface SidebarProps {
  blocks: Block[]
  themes: { blockId: string; themeId: string; path: string }[]
  progress: Record<string, ThemeProgress>
  activeBlock?: string
  activeTheme?: string
  onClose?: () => void
  onCollapse?: () => void
}

export function Sidebar({
  blocks,
  themes,
  progress,
  activeBlock,
  activeTheme,
  onClose,
  onCollapse,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(
      blocks.map((b) => [b.id, false]) // все раскрыты по умолчанию
    ),
  )
  const [results, setResults] = useState<SearchResultItem[] | null>(null)
  const [searching, setSearching] = useState(false)

  const q = query.trim().toLowerCase()
  const showSearch = q.length >= 2

  // Полнотекстовый поиск по контенту тем (серверный индекс). При неудаче
  // (нет индекса/сети) автоматически остаёмся на локальном фильтре названий.
  useEffect(() => {
    if (q.length < 2) {
      setResults(null)
      setSearching(false)
      return
    }
    const ctrl = new AbortController()
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setResults(data.results ?? [])
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return
        setResults(null)
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [q])

  const byBlock = (blockId: string) =>
    themes.filter((t) => t.blockId === blockId)

  const bookmarkedIds = new Set(
    Object.values(progress)
      .filter((p) => p.bookmarked)
      .map((p) => p.themeId),
  )

  return (
    <aside className="flex h-full w-80 flex-col border-r bg-sidebar text-sidebar-foreground">
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
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Свернуть меню"
              title="Свернуть меню"
              onClick={onCollapse}
              className="hidden lg:inline-flex"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Закрыть меню"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Link
          href="/bookmarks"
          className={cn(
            'flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent',
          )}
        >
          <Bookmark className="size-4" />
          Закладки
          <span className="ml-auto text-xs text-muted-foreground">
            {bookmarkedIds.size}
          </span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2">
          {showSearch && results === null && searching ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Поиск…
            </div>
          ) : showSearch && results !== null ? (
            results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Ничего не найдено
              </p>
            ) : (
              <div className="space-y-0.5">
                {results.map((r) => {
                  const block = blocks.find((b) => b.id === r.blockId)
                  return (
                    <Link
                      key={r.themeId}
                      href={`/themes/${r.path}`}
                      className="block rounded-md px-2 py-1.5 hover:bg-accent"
                    >
                      <span className="block break-words text-sm font-medium">
                        {highlight(r.title, q, `t-${r.themeId}`)}
                      </span>
                      <span className="block break-words text-xs text-muted-foreground">
                        {block?.order}. {block?.title}
                      </span>
                      {r.snippet && (
                        <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                          {highlight(r.snippet, q, `s-${r.themeId}`)}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          ) : (
            blocks
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
              const blockThemes = byBlock(block.id)
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
                    <span className="min-w-0 flex-1 break-words text-left">
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
                              'flex items-start gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              isActiveTheme && 'bg-accent text-accent-foreground',
                            )}
                          >
                            <span className="shrink-0 leading-snug">
                              {done ? '✅' : p ? '📖' : ''}
                            </span>
                            <span className="min-w-0 flex-1 break-words leading-snug">
                              {title}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>
      </ScrollArea>

      <footer className="border-t p-3 space-y-2">
        <div className="flex items-center gap-1">
            <DownloadApkButton size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8 px-2">
                APK
            </DownloadApkButton>
          <GitHubButton size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8 px-2">
            GitHub
          </GitHubButton>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">v {version}</p>
      </footer>
    </aside>
  )
}
