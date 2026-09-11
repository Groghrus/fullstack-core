import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { getAllThemes, getBlocks, getThemeTitle } from '@core/content'
import { Markdown } from '@/components/markdown'
import { Quiz } from '@/components/quiz'
import { splitTheme } from '@/lib/theme-content'
import { ThemeActions } from '@/components/theme-actions'
import { Badge } from '@/components/ui/badge'
import { CONTENT_ROOT } from '@/lib/content-root'
import {ArrowLeft} from 'lucide-react';

export function generateStaticParams() {
  return getAllThemes().map((t) => ({
    block: t.blockId,
    theme: t.themeId,
  }))
}

interface PageProps {
  params: Promise<{ block: string; theme: string }>
}

export default async function ThemePage({ params }: PageProps) {
  const { block, theme } = await params
  const blocks = getBlocks()
  const blockMeta = blocks.find((b) => b.id === block)
  if (!blockMeta || !blockMeta.themes.includes(theme)) {
    notFound()
  }

  let raw = ''
  try {
    raw = await readFile(path.join(CONTENT_ROOT, block, `${theme}.md`), 'utf-8')
  } catch {
    notFound()
  }

  const { frontmatter, body, quiz } = splitTheme(raw)
  const title = frontmatter.title || getThemeTitle(theme)
  const difficulty = frontmatter.difficulty || 'medium'
  const status = frontmatter.status || 'draft'

  // Заголовок уже выводится в <h1> шапки — убираем дублирующий первый
  // `# Заголовок` из markdown, чтобы на странице не было двух H1.
  const bodyWithoutHeading = body.replace(/^\s*#\s+.*(?:\r?\n|$)/, '')

  // соседние темы в блоке: предыдущая/следующая
  const idx = blockMeta.themes.indexOf(theme)
  const prevId = idx > 0 ? blockMeta.themes[idx - 1] : null
  const nextId =
    idx < blockMeta.themes.length - 1 ? blockMeta.themes[idx + 1] : null

  const diffText =
    difficulty === 'beginner'
      ? 'Начальный'
      : difficulty === 'advanced'
        ? 'Продвинутый'
        : 'Средний'

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
          <ArrowLeft size="16"/>
          Каталог
      </Link>

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{blockMeta.title}</Badge>
          <Badge variant="secondary">{diffText}</Badge>
          {status === 'done' ? (
            <Badge className="bg-emerald-500/15 text-emerald-500">
              расписана
            </Badge>
          ) : (
            <Badge variant="secondary">черновик</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </header>

      <ThemeActions
        themeId={theme}
        blockId={block}
        prevId={prevId}
        nextId={nextId}
      />

      <div>
        <Markdown source={bodyWithoutHeading} />
      </div>

      {quiz && <Quiz source={quiz} />}
    </article>
  )
}
