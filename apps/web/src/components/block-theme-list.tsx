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
              <CardContent className="flex items-center gap-3 p-4">
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
                  <div className="truncate font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground">{t.themeId}</div>
                </div>
                {done ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    изучено
                  </Badge>
                ) : started ? (
                  <Badge variant="secondary">открыто</Badge>
                ) : (
                  <Badge variant="outline">новое</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
