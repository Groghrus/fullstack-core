'use client'

import Link from 'next/link'
import { Bookmark, Check, X } from 'lucide-react'
import { getBlocks, getAllThemes, getThemeTitle } from '@core/content'
import { useProgress } from '@/hooks/use-progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function BookmarksPage() {
  const { progress, toggleBookmark } = useProgress()
  const blocks = getBlocks()
  const themes = getAllThemes()

  const groups = blocks
    .map((block) => ({
      block,
      items: themes.filter(
        (t) => t.blockId === block.id && progress[t.themeId]?.bookmarked,
      ),
    }))
    .filter((g) => g.items.length > 0)

  const total = groups.reduce((sum, g) => sum + g.items.length, 0)

  if (total === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Bookmark className="size-12 text-muted-foreground/40" />
          <div>
            <h1 className="text-xl font-semibold">Закладок пока нет</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Добавляйте темы в закладки кнопкой на странице темы — они будут
              копиться здесь.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">К каталогу тем</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Закладки
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {total} тем сохранено в localStorage
        </p>
      </header>

      <div className="space-y-8">
        {groups.map(({ block, items }) => (
          <section key={block.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {block.order}. {block.title}
            </h2>
            <div className="space-y-2">
              {items.map((t) => {
                const p = progress[t.themeId]
                const done = p?.status === 'done'
                const title = getThemeTitle(t.themeId)
                return (
                  <Card key={t.themeId}>
                    <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
                      <Link
                        href={`/themes/${t.path}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-sm">
                          {done ? (
                            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-amber-500">★</span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium" title={title}>
                            {title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {t.themeId}
                          </span>
                        </span>
                      </Link>
                      {done ? (
                        <Badge className="shrink-0 whitespace-nowrap bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          изучено
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 cursor-pointer"
                        aria-label="Убрать из закладок"
                        title="Убрать из закладок"
                        onClick={() => toggleBookmark(t.themeId)}
                      >
                        <X className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
