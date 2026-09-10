'use client'

import Link from 'next/link'
import { Check, Bookmark } from 'lucide-react'
import { getThemeTitle } from '@core/content'
import { useProgress } from '@/hooks/use-progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BlockThemeListProps {
  blockId: string
  themes: { blockId: string; themeId: string; path: string }[]
}

export function BlockThemeList({ blockId, themes }: BlockThemeListProps) {
  const { progress } = useProgress()

  return (
    <div className="space-y-2">
      {themes.map((t) => {
        const p = progress[t.themeId]
        const done = p?.status === 'done'
        const started = !!p && !done
        const title = getThemeTitle(t.themeId)

        return (
          <Link key={t.themeId} href={`/themes/${t.path}`} className="block">
            <Card
              className={cn(
                'h-full cursor-pointer transition-colors hover:border-primary hover:bg-accent/40',
              )}
            >
              <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-sm">
                  {done ? (
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : started ? (
                    <Bookmark className="size-4" />
                  ) : (
                    <span className="text-muted-foreground">•</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium" title={title}>
                    {title}
                  </div>
                  <div className="hidden truncate text-xs text-muted-foreground sm:block">
                    {t.themeId}
                  </div>
                </div>
                {done ? (
                  <Badge className="shrink-0 whitespace-nowrap bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <span className="hidden sm:inline">изучено</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                ) : started ? (
                  <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
                    <span className="hidden sm:inline">открыто</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 whitespace-nowrap">
                    <span className="hidden sm:inline">новое</span>
                    <span className="sm:hidden">•</span>
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
