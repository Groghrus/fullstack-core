'use client'

import Link from 'next/link'
import { getBlocks, getAllThemes } from '@core/content'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { DownloadApkButton } from '@/components/ui/download-apk-button'
import { GitHubButton } from '@/components/ui/github-button'

export default function Home() {
  const blocks = getBlocks()
  const themes = getAllThemes()

  const countByBlock = (blockId: string) =>
    themes.filter((t) => t.blockId === blockId).length

  const totalThemes = themes.length

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Hero / Описание проекта */}
      <header className="mb-10 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          <BookOpen className="size-3.5" /> Интерактивный справочник & тренажёр
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Fullstack Core
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Фундаментальные знания по архитектуре, бэкенду, распределённым системам и безопасности.
          Каждая тема содержит теорию, практические примеры на <span className="font-semibold text-foreground">TypeScript / Go / Java</span>, диаграммы Mermaid и проверочные квизы.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DownloadApkButton className="gap-2" />
          <GitHubButton className="gap-2" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-bold">{totalThemes}</div>
            <div className="text-xs text-muted-foreground">Темы и статьи</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{blocks.length}</div>
            <div className="text-xs text-muted-foreground">Тематических блоков</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold">TS / Go / Java</div>
            <div className="text-xs text-muted-foreground">Мультистековые примеры</div>
          </div>
        </div>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Учебные блоки</h2>
        <span className="text-xs text-muted-foreground">Выберите тему для изучения</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => (
          <Link key={block.id} href={`/blocks/${block.id}`} className="block">
            <Card className="h-full transition-colors hover:border-primary hover:bg-accent/50">
              <CardContent className="p-4">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold" title={block.title}>
                    {block.order}. {block.title}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {countByBlock(block.id)} тем
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
