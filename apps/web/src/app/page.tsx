import Link from 'next/link'
import { getBlocks, getAllThemes } from '@core/content'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const blocks = getBlocks()
  const themes = getAllThemes()

  const countByBlock = (blockId: string) =>
    themes.filter((t) => t.blockId === blockId).length

  const totalThemes = themes.length

  return (
    <div className="mx-auto max-w-4xl px-2 py-2 sm:px-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Fullstack Core
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          Личный тренажёр и учебник: backend, system design, языки (
          TypeScript / Go / Java ). {totalThemes} тем в 15 блоках.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => (
          <Link key={block.id} href={`/blocks/${block.id}`} className="block">
            <Card className="h-full transition-colors hover:border-primary hover:bg-accent/50">
              <CardContent className="p-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold" title={block.title}>
                    {block.order}. {block.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {countByBlock(block.id)}
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
