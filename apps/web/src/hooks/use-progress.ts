'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeProgress } from '@core/config'

export const STORAGE_KEY = 'fullstack-core:progress'

type ProgressMap = Record<string, ThemeProgress>

export function useProgress() {
    const [progress, setProgress] = useState<ProgressMap>(() => {
        if (typeof window === 'undefined') return {}
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? (JSON.parse(raw) as ProgressMap) : {}
        } catch {
            return {}
        }
    })

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    setProgress(JSON.parse(e.newValue))
                } catch {
                    /* ignore */
                }
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    const update = useCallback(
        (
            themeId: string,
            patch: Partial<Omit<ThemeProgress, 'themeId'>>,
        ) => {
            setProgress((current) => {
                const previous = current[themeId]

                // Если статус уже 'done', а новый патч пытается поставить 'in_progress' без явного приказа,
                // либо если это автоматический markRead — защищаем статус 'done'.
                let targetStatus = patch.status
                if (previous?.status === 'done' && targetStatus === 'in_progress') {
                    // Если статус уже done, не даем перезаписать на in_progress через автоматические вызовы (например, markRead)
                    targetStatus = 'done'
                }

                const next: ThemeProgress = {
                    ...previous,
                    ...patch,
                    themeId,
                    status: targetStatus ?? previous?.status ?? 'in_progress',
                    bookmarked: patch.bookmarked ?? previous?.bookmarked ?? false,
                    lastReadAt: patch.lastReadAt ?? previous?.lastReadAt ?? Date.now(),
                }

                const nextMap = {
                    ...current,
                    [themeId]: next,
                }

                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(nextMap),
                    )
                } catch (error) {
                    console.error('[progress] failed to save:', error)
                }

                return nextMap
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

    const toggleBookmark = useCallback(
        (themeId: string) => {
            setProgress((current) => {
                const prevTheme = current[themeId]
                const nextBookmarked = !prevTheme?.bookmarked
                const next: ThemeProgress = {
                    ...prevTheme,
                    themeId,
                    bookmarked: nextBookmarked,
                    status: prevTheme?.status ?? 'in_progress',
                    lastReadAt: prevTheme?.lastReadAt ?? Date.now(),
                }
                const nextMap = {
                    ...current,
                    [themeId]: next,
                }
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
                } catch {
                    /* ignore */
                }
                return nextMap
            })
        },
        [],
    )

    const markRead = useCallback(
        (themeId: string) => {
            setProgress((current) => {
                const prevTheme = current[themeId]
                // КРИТИЧЕСКИ ВАЖНО: Если тема уже 'done', НИКОГДА не перезаписываем её статус на 'in_progress'
                if (prevTheme?.status === 'done') {
                    return current
                }

                if (!prevTheme || prevTheme.status === 'new') {
                    const next: ThemeProgress = {
                        ...prevTheme,
                        themeId,
                        status: 'in_progress',
                        bookmarked: prevTheme?.bookmarked ?? false,
                        lastReadAt: Date.now(),
                    }
                    const nextMap = {
                        ...current,
                        [themeId]: next,
                    }
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
                    } catch {
                        /* ignore */
                    }
                    return nextMap
                }
                return current
            })
        },
        [],
    )

    return {
        progress,
        markDone,
        toggleBookmark,
        markRead,
        update,
    }
}
