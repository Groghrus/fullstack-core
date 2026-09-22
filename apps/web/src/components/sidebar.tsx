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
import { useProgress } from '@/hooks/use-progress'
import versionData from '../../../../package.json'
const version = versionData.version
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
    Object.fromEntries(
      blocks.map((b) => [b.id, false]) // все раскрыты по умолчанию
    ),
  )
  const [results, setResults] = useState<SearchResultItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    }, 200)
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [q])

  const byBlock = (blockId: string) => themes.filter((t) => t.blockId === blockId)

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
          {showSearch ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Результаты поиска
                {searching && (
                  <Loader2 className="inline ml-1 size-3 animate-spin" />
                )}
              </div>
              {results === null && !searching ? (
                // Локальный фоллбэк по названиям тем
                themes
                  .filter((t) =>
                    getThemeTitle(t.themeId).toLowerCase().includes(q),
                  )
                  .map((t) => (
                    <Link
                      key={`${t.blockId}-${t.themeId}`}
                      href={`/themes/${t.path}`}
                      className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="font-medium">
                        {highlight(getThemeTitle(t.themeId), q, t.themeId)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.blockId}
                      </div>
                    </Link>
                  ))
              ) : results && results.length > 0 ? (
                results.map((r) => (
                  <Link
                    key={`${r.blockId}-${r.themeId}`}
                    href={`/themes/${r.path}`}
                    className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="font-medium">
                      {highlight(r.title, q, r.themeId)}
                    </div>
                    {r.snippet && (
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {highlight(r.snippet, q, `${r.themeId}-snip`)}
                      </div>
                    )}
                  </Link>
                ))
              ) : !searching ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Ничего не найдено
                </div>
              ) : null}
            </div>
          ) : (
            <nav className="space-y-1">
              {/* Ссылка на закладки */}
              <Link
                href="/bookmarks"
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
                  activeTheme === 'bookmarks' && 'bg-accent text-accent-foreground',
                )}
              >
                <Bookmark className="size-4 text-amber-500" />
                <span>Закладки</span>
              </Link>

              <div className="my-2 border-t" />

              {/* Список блоков и тем */}
              {blocks
                .filter((block) => {
                  const blockThemes = byBlock(block.id)
                  const hasQ =
                    block.title.toLowerCase().includes(q) ||
                    blockThemes.some(
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
                  const countDone = mounted
                    ? blockThemes.filter(
                        (t) => progress[t.themeId]?.status === 'done',
                      ).length
                    : 0

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
                        {mounted && countDone > 0 && countDone === blockThemes.length ? (
                          <span className="text-xs text-emerald-500">✓</span>
                        ) : mounted && countDone > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {countDone}/{blockThemes.length}
                          </span>
                        ) : null}
                      </button>

                      {open && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
                          {blockThemes.map((t) => {
                            const p = progress[t.themeId]
                            const done = mounted && p?.status === 'done'
                            const started = mounted && p
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
                                  {done ? '✅' : started ? '📖' : ''}
                                </span>
                                <span className="min-w-0 flex-1 break-words">
                                  {title}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </nav>
          )}
        </div>
      </ScrollArea>

      {/* Футер сайдбара */}
      <div className="border-t p-3 flex items-center gap-2 space-x-2 space-y-2">
          <div className="text-l font-normal text-muted-foreground">
              v{version}
          </div>

          <GitHubButton />
          <DownloadApkButton />
      </div>
    </aside>
  )
}
