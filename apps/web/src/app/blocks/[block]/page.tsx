import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlocks, getAllThemes } from '@core/content'
import { BlockThemeList } from '@/components/block-theme-list'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ block: string }>
}

export function generateStaticParams() {
  return getBlocks().map((b) => ({ block: b.id }))
}

export default async function BlockPage({ params }: PageProps) {
  const { block } = await params
  const blocks = getBlocks()
  const blockMeta = blocks.find((b) => b.id === block)
  if (!blockMeta) notFound()

  const themes = getAllThemes().filter((t) => t.blockId === block)

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Каталог
      </Link>

      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">Блок {blockMeta.order}</Badge>
          <span className="text-sm text-muted-foreground">
            {themes.length} тем
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{blockMeta.title}</h1>
      </header>

      <BlockThemeList blockId={block} themes={themes} />

      <p className="mt-8 text-sm text-muted-foreground">
        Навигация также доступна через сайдбар слева.
      </p>
    </div>
  )
}
