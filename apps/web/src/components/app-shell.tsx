'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, PanelLeftOpen } from 'lucide-react'
import type { Block } from '@core/content'
import { getThemeTitle } from '@core/content'
import { useProgress } from '@/hooks/use-progress'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppShellProps {
  blocks: Block[]
  themes: { blockId: string; themeId: string; path: string }[]
  children: React.ReactNode
}

export function AppShell({ blocks, themes, children }: AppShellProps) {
  const pathname = usePathname()
  const { progress } = useProgress()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // закрываем drawer при переходе по ссылке
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // определить активную тему/блок из URL
  const pathSegments = pathname.split('/').filter(Boolean)
  const activeTheme =
    pathSegments[0] === 'themes' && pathSegments[2] ? pathSegments[2] : undefined
  const activeBlock =
    (pathSegments[0] === 'themes' && pathSegments[1]) ||
    (pathSegments[0] === 'blocks' && pathSegments[1]) ||
    undefined

  const pageTitle =
    pathSegments[0] === 'blocks' && pathSegments[1]
      ? blocks.find((b) => b.id === pathSegments[1])?.title
      : pathSegments[0] === 'themes' && pathSegments[2]
        ? getThemeTitle(pathSegments[2])
        : undefined

  const sidebarProps = {
    blocks,
    themes,
    progress,
    activeBlock,
    activeTheme,
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Десктопный сайдбар (сворачиваемый) */}
      {sidebarCollapsed ? (
        <div className="hidden w-14 shrink-0 flex-col items-center gap-2 border-r py-3 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Показать меню"
            title="Показать меню"
            onClick={() => setSidebarCollapsed(false)}
          >
            <PanelLeftOpen className="size-5" />
          </Button>
        </div>
      ) : (
        <div className="hidden lg:block">
          <Sidebar
            {...sidebarProps}
            onCollapse={() => setSidebarCollapsed(true)}
          />
        </div>
      )}

      {/* Мобильный drawer-сайдбар */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          menuOpen ? '' : 'pointer-events-none',
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex h-full w-80 max-w-[85vw] shadow-xl transition-transform duration-200',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar {...sidebarProps} onClose={() => setMenuOpen(false)} />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Мобильный хедер */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Открыть меню"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="truncate text-sm font-medium text-foreground">
            {pageTitle ?? 'Fullstack Core'}
          </span>
        </header>
        {children}
      </main>
    </div>
  )
}