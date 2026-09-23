'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const KEY = 'fullstack-core:theme'

function readStoredTheme(): boolean {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return stored === 'dark'
  } catch (error) {
    console.warn('[theme] повреждённый localStorage, читаем системную тему:', error)
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch (error) {
    console.warn('[theme] не удалось определить системную тему:', error)
    return false
  }
}

export function ThemeProvider() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(readStoredTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    // Не трогаем <html> до монтажа: сразу применяем только head-скрипт в layout,
    // чтобы не было вспышки и разночтений с сервером при гидрации.
    if (!mounted) return
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch (error) {
      console.warn('[theme] не удалось сохранить тему:', error)
    }
    window.dispatchEvent(
      new CustomEvent('theme-change', { detail: { dark } }),
    )
  }, [dark, mounted])

  return (
    <Button
      className="cursor-pointer"
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
      aria-label="Переключить тему"
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {mounted && dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
