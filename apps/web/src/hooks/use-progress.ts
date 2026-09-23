'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeProgress } from '@core/config'

export const STORAGE_KEY = 'fullstack-core:progress'

type ProgressMap = Record<string, ThemeProgress>
type Listener = () => void

const EMPTY: ProgressMap = Object.freeze({})

let cache: ProgressMap = EMPTY
const listeners = new Set<Listener>()
let loaded = false

function emit() {
  listeners.forEach((l) => l())
}

function readFromStorage(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : EMPTY
  } catch (error) {
    console.warn('[progress] повреждённый localStorage, начинаем с пустого:', error)
    return EMPTY
  }
}

function setAndPersist(nextMap: ProgressMap) {
  cache = nextMap
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
  } catch (error) {
    console.error('[progress] failed to save:', error)
  }
  emit()
}

export function useProgress() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!loaded) {
      loaded = true
      cache = readFromStorage()
      emit()
    }

const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          cache = JSON.parse(e.newValue) as ProgressMap
          emit()
        } catch (error) {
          console.warn('[progress] битые данные из другой вкладки, пропущено:', error)
        }
      }
    }

    const listener: Listener = () => forceUpdate((n) => n + 1)
    listeners.add(listener)
    window.addEventListener('storage', handleStorage)

    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const update = useCallback(
    (themeId: string, patch: Partial<Omit<ThemeProgress, 'themeId'>>) => {
      const prev = cache[themeId]
      const next: ThemeProgress = {
        ...prev,
        ...patch,
        themeId,
        status: patch.status ?? prev?.status ?? 'in_progress',
        bookmarked: patch.bookmarked ?? prev?.bookmarked ?? false,
        lastReadAt: patch.lastReadAt ?? prev?.lastReadAt ?? Date.now(),
      }
      setAndPersist({
        ...cache,
        [themeId]: next,
      })
    },
    [],
  )

  const markDone = useCallback(
    (themeId: string, done: boolean) => {
      update(themeId, {
        status: done ? 'done' : 'in_progress',
        lastReadAt: Date.now(),
      })
    },
    [update],
  )

  const toggleBookmark = useCallback((themeId: string) => {
    const prev = cache[themeId]
    const next: ThemeProgress = {
      ...prev,
      themeId,
      bookmarked: !prev?.bookmarked,
      status: prev?.status ?? 'in_progress',
      lastReadAt: prev?.lastReadAt ?? Date.now(),
    }
    setAndPersist({
      ...cache,
      [themeId]: next,
    })
  }, [])

  const markRead = useCallback((themeId: string) => {
    const prev = cache[themeId]
    if (prev?.status === 'done') {
      return
    }

    if (!prev || prev.status === 'new') {
      const next: ThemeProgress = {
        ...prev,
        themeId,
        status: 'in_progress',
        bookmarked: prev?.bookmarked ?? false,
        lastReadAt: Date.now(),
      }
      setAndPersist({
        ...cache,
        [themeId]: next,
      })
    }
  }, [])

  return {
    progress: cache,
    markDone,
    toggleBookmark,
    markRead,
    update,
  }
}
