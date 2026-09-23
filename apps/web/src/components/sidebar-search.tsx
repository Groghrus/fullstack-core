'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getThemeTitle } from '@core/content'
import type { ThemeSearchResult } from '@/hooks/use-theme-search'
import type { SidebarTheme } from '@/components/sidebar-block'

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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

interface SearchResultsProps {
  results: ThemeSearchResult[] | null
  searching: boolean
  localMatches: SidebarTheme[]
  q: string
}

function NoMatches() {
  return (
    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
      Ничего не найдено
    </div>
  )
}

function LocalMatchLink({ theme, q }: { theme: SidebarTheme; q: string }) {
  return (
    <Link
      key={`${theme.blockId}-${theme.themeId}`}
      href={`/themes/${theme.path}`}
      className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
    >
      <div className="font-medium">
        {highlight(getThemeTitle(theme.themeId), q, theme.themeId)}
      </div>
      <div className="text-xs text-muted-foreground">{theme.blockId}</div>
    </Link>
  )
}

function ServerResultLink({ result, q }: { result: ThemeSearchResult; q: string }) {
  return (
    <Link
      key={`${result.blockId}-${result.themeId}`}
      href={`/themes/${result.path}`}
      className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
    >
      <div className="font-medium">
        {highlight(result.title, q, result.themeId)}
      </div>
      {result.snippet && (
        <div className="line-clamp-2 text-xs text-muted-foreground">
          {highlight(result.snippet, q, `${result.themeId}-snip`)}
        </div>
      )}
    </Link>
  )
}

export function SearchResults({ results, searching, localMatches, q }: SearchResultsProps) {
  let body: React.ReactNode = null

  if (results === null && !searching) {
    body =
      localMatches.length === 0 ? (
        <NoMatches />
      ) : (
        localMatches.map((t) => <LocalMatchLink key={`${t.blockId}-${t.themeId}`} theme={t} q={q} />)
      )
  } else if (results && results.length > 0) {
    body = results.map((r) => <ServerResultLink key={`${r.blockId}-${r.themeId}`} result={r} q={q} />)
  } else if (!searching) {
    body = <NoMatches />
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
        Результаты поиска
        {searching && <Loader2 className="inline ml-1 size-3 animate-spin" />}
      </div>
      {body}
    </div>
  )
}