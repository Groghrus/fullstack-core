'use client'

import { usePathname } from 'next/navigation'
import type { Block } from '@core/content'
import { useProgress } from '@/hooks/use-progress'
import { Sidebar } from './sidebar'

interface AppShellProps {
  blocks: Block[]
  themes: { blockId: string; themeId: string; path: string }[]
  children: React.ReactNode
}

export function AppShell({ blocks, themes, children }: AppShellProps) {
  const pathname = usePathname()
  const { progress } = useProgress()

  // определить активную тему/блок из URL
  const pathSegments = pathname.split('/').filter(Boolean)
  const activeTheme =
    pathSegments[0] === 'themes' && pathSegments[2] ? pathSegments[2] : undefined
  const activeBlock =
    (pathSegments[0] === 'themes' && pathSegments[1]) ||
    (pathSegments[0] === 'blocks' && pathSegments[1]) ||
    undefined

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        blocks={blocks}
        themes={themes}
        progress={progress}
        activeBlock={activeBlock}
        activeTheme={activeTheme}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
