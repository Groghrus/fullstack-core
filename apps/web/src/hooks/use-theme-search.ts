'use client'

import { useEffect, useState } from 'react'

export interface ThemeSearchResult {
  themeId: string
  blockId: string
  title: string
  path: string
  snippet: string
  score: number
}

export function useThemeSearch(query: string) {
  const [results, setResults] = useState<ThemeSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const q = query.trim().toLowerCase()
  const active = q.length >= 2

  useEffect(() => {
    if (!active) {
      setResults(null)
      setSearching(false)
      return
    }
    const ctrl = new AbortController()
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setResults(data.results ?? [])
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return
        setResults(null)
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 200)
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [q, active])

  return { results, searching, active, q }
}