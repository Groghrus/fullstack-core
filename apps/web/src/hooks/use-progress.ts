'use client'

import { useSyncExternalStore } from 'react'
import type { ThemeProgress } from '@core/config'

export const STORAGE_KEY = 'fullstack-core:progress'

type ProgressMap = Record<string, ThemeProgress>
type Listener = () => void

let cache: ProgressMap | null = null
const listeners = new Set<Listener>()

function read(): ProgressMap {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? (JSON.parse(raw) as ProgressMap) : {}
  } catch {
    cache = {}
  }
  return cache
}

function write(next: ProgressMap) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return read()
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  function update(themeId: string, patch: Partial<Omit<ThemeProgress, 'themeId'>>) {
    const current = progress[themeId]
    const next: ThemeProgress = {
      ...current,
      ...patch,
      themeId: themeId,
    }
    next.status = next.status ?? 'in_progress'
    next.bookmarked = next.bookmarked ?? false
    next.lastReadAt = next.lastReadAt ?? Date.now()
    write({ ...progress, [themeId]: next })
  }

  function markDone(themeId: string, done: boolean) {
    update(themeId, {
      status: done ? 'done' : 'in_progress',
      lastReadAt: Date.now(),
    })
  }

  function toggleBookmark(themeId: string) {
    update(themeId, { bookmarked: !progress[themeId]?.bookmarked })
  }

  function markRead(themeId: string) {
    const current = progress[themeId]
    if (!current || current.status === 'new') {
      update(themeId, { status: 'in_progress', lastReadAt: Date.now() })
    }
  }

  return { progress, markDone, toggleBookmark, markRead, update }
}
