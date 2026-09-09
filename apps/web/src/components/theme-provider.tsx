'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const KEY = 'fullstack-core:theme'

export function ThemeProvider() {
  const [dark, setDark] = useState(true) // по умолчанию тёмная

  useEffect(() => {
    // читаем сохранённую или системную тему
    let stored: string | null = null
    try {
      stored = localStorage.getItem(KEY)
    } catch {
      /* ignore */
    }
    const initial = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(initial)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    // синхронизация между вкладками
    window.dispatchEvent(
      new CustomEvent('theme-change', { detail: { dark } }),
    )
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
      aria-label="Переключить тему"
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
