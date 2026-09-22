'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Block } from '@core/content'
import { getThemeTitle } from '@core/content'
import type { ThemeProgress } from '@core/config'
import { cn } from '@/lib/utils'

export interface SidebarTheme {
  blockId: string
  themeId: string
  path: string
}

interface ThemeLinkProps {
  theme: SidebarTheme
  done: boolean
  started: boolean
  isActive: boolean
}

export function ThemeLink({ theme, done, started, isActive }: ThemeLinkProps) {
  return (
    <Link
      href={`/themes/${theme.path}`}
      className={cn(
        'flex items-start gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <span className="shrink-0 leading-snug">{done ? '✅' : started ? '📖' : ''}</span>
      <span className="min-w-0 flex-1 break-words">{getThemeTitle(theme.themeId)}</span>
    </Link>
  )
}

interface BlockSectionProps {
  block: Block
  themes: SidebarTheme[]
  progress: Record<string, ThemeProgress>
  isActive: boolean
  activeTheme?: string
  collapsed: boolean
  onToggle: () => void
}

export function BlockSection({
  block,
  themes,
  progress,
  isActive,
  activeTheme,
  collapsed,
  onToggle,
}: BlockSectionProps) {
  const open = !collapsed
  const countDone = themes.filter((t) => progress[t.themeId]?.status === 'done').length
  const total = themes.length

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
          isActive ? 'bg-accent text-accent-foreground' : '',
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
        {countDone > 0 && countDone === total ? (
          <span className="text-xs text-emerald-500">✓</span>
        ) : countDone > 0 ? (
          <span className="text-xs text-muted-foreground">
            {countDone}/{total}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
          {themes.map((t) => (
            <ThemeLink
              key={t.themeId}
              theme={t}
              done={progress[t.themeId]?.status === 'done'}
              started={!!progress[t.themeId]}
              isActive={t.themeId === activeTheme}
            />
          ))}
        </div>
      )}
    </div>
  )
}