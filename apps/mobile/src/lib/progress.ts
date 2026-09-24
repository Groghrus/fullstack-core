import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

const PROGRESS_KEY = 'fullstack-core:progress'

export interface ThemeProgress {
  themeId: string
  status: 'new' | 'in_progress' | 'done'
  bookmarked: boolean
  lastReadAt?: number
}

type ProgressMap = Record<string, ThemeProgress>

let cache: ProgressMap = {}
let loaded = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

async function loadOnce() {
  if (loaded) return
  loaded = true
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY)
    if (raw) cache = JSON.parse(raw) as ProgressMap
  } catch (e) {
    console.warn('[progress] битые данные в AsyncStorage, начинаем с пустого:', e)
  }
  emit()
}

function persist() {
  AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(cache)).catch((e) =>
    console.error('[progress] failed to save:', e),
  )
}

function update(themeId: string, patch: Partial<Omit<ThemeProgress, 'themeId'>>) {
  const prev = cache[themeId]
  const next: ThemeProgress = {
    ...prev,
    ...patch,
    themeId,
    status: patch.status ?? prev?.status ?? 'in_progress',
    bookmarked: patch.bookmarked ?? prev?.bookmarked ?? false,
    lastReadAt: patch.lastReadAt ?? prev?.lastReadAt ?? Date.now(),
  }
  cache = { ...cache, [themeId]: next }
  persist()
  emit()
}

export function markDone(themeId: string, done: boolean) {
  update(themeId, { status: done ? 'done' : 'in_progress', lastReadAt: Date.now() })
}

export function toggleBookmark(themeId: string) {
  const prev = cache[themeId]
  update(themeId, {
    bookmarked: !prev?.bookmarked,
    status: prev?.status ?? 'in_progress',
  })
}

export function markRead(themeId: string) {
  const prev = cache[themeId]
  if (prev?.status === 'done') return
  if (!prev || prev.status === 'new') {
    update(themeId, { status: 'in_progress', lastReadAt: Date.now() })
  }
}

export function getProgress(): ProgressMap {
  return cache
}

export function isDone(themeId: string): boolean {
  return cache[themeId]?.status === 'done'
}

export function isBookmarked(themeId: string): boolean {
  return !!cache[themeId]?.bookmarked
}

/** React-хук: подписка на изменения прогресса (аналог web use-progress). */
export function useProgress() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    loadOnce()
    const listener = () => forceUpdate((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  return {
    progress: cache,
    markDone,
    toggleBookmark,
    markRead,
    refresh,
  }
}
