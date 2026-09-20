'use client'

import {useEffect, useState} from 'react';
import Link from 'next/link'
import {ArrowLeft, ArrowRight, Bookmark, Check, Circle} from 'lucide-react';
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
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        markRead(themeId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, themeId])

    const p = mounted ? progress[themeId] : undefined
    const done = mounted && p?.status === 'done'
    const bookmarked = mounted && p?.bookmarked

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
            className="w-fit max-w-full min-w-0 justify-self-start rounded-lg border p-3 text-sm hover:bg-accent"
          >
              <div className="flex items-center justify-start">
                  <ArrowLeft size="16"/>
                  <div className="truncate text-s text-muted-foreground">Предыдущая</div>
              </div>
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
            className="w-fit max-w-full min-w-0 justify-self-end rounded-lg border p-3 text-right text-sm hover:bg-accent"
          >
              <div className="flex items-center justify-end">
                  <div className="truncate text-s text-muted-foreground">Следующая</div>
                  <ArrowRight size="16"/>
              </div>

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
