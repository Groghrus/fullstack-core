'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, Check, Circle } from 'lucide-react'
import { useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { getThemeTitle } from '@core/content'

interface ThemeActionsProps {
  themeId: string
  blockId: string
  prevId?: string | null
  nextId?: string | null
}

export function ThemeActions({
  themeId,
  blockId,
  prevId,
  nextId,
}: ThemeActionsProps) {
  const { progress, markDone, toggleBookmark, markRead } = useProgress()

  useEffect(() => {
    markRead(themeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId])

  const p = progress[themeId]
  const done = p?.status === 'done'
  const bookmarked = p?.bookmarked

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant={done ? 'default' : 'outline'}
          size="sm"
          onClick={() => markDone(themeId, !done)}
        >
          {done ? <Check className="mr-1 size-4" /> : <Circle className="mr-1 size-4" />}
          {done ? 'Изучено' : 'Отметить изученным'}
        </Button>
        <Button
          variant={bookmarked ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleBookmark(themeId)}
        >
          <Bookmark className="mr-1 size-4" />
          {bookmarked ? 'В закладках' : 'В закладки'}
        </Button>
      </div>

      <nav className="mt-14 grid grid-cols-2 gap-3 border-t pt-6">
        {prevId ? (
          <Link
            href={`/themes/${blockId}/${prevId}`}
            className="min-w-0 rounded-lg border p-3 text-sm hover:bg-accent"
          >
            <div className="truncate text-xs text-muted-foreground">← Предыдущая</div>
            <div className="mt-1 truncate font-medium">
              {getThemeTitle(prevId)}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextId ? (
          <Link
            href={`/themes/${blockId}/${nextId}`}
            className="min-w-0 rounded-lg border p-3 text-right text-sm hover:bg-accent"
          >
            <div className="truncate text-xs text-muted-foreground">Следующая →</div>
            <div className="mt-1 truncate font-medium">
              {getThemeTitle(nextId)}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </>
  )
}
