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
                    const parsed = JSON.parse(e.newValue)
                    setTimeout(() => setProgress(parsed), 0)
                } catch {
                    /* ignore */
                }
            }
        }

        const handleCustomProgress = (e: Event) => {
            const customEvent = e as CustomEvent<ProgressMap>
            if (customEvent.detail) {
                const detail = customEvent.detail
                setTimeout(() => setProgress(detail), 0)
            }
        }

        window.addEventListener('storage', handleStorage)
        window.addEventListener('progress-update', handleCustomProgress as EventListener)

        return () => {
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('progress-update', handleCustomProgress as EventListener)
        }
    }, [])

    const dispatchChange = (nextMap: ProgressMap) => {
        setProgress(nextMap)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('progress-update', { detail: nextMap }))
            }, 0)
        } catch (error) {
            console.error('[progress] failed to save:', error)
        }
    }

    const update = useCallback(
        (
            themeId: string,
            patch: Partial<Omit<ThemeProgress, 'themeId'>>,
        ) => {
            setProgress((current) => {
                const previous = current[themeId]
                let targetStatus = patch.status

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

                dispatchChange(nextMap)
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
                dispatchChange(nextMap)
                return nextMap
            })
        },
        [],
    )

    const markRead = useCallback(
        (themeId: string) => {
            setProgress((current) => {
                const prevTheme = current[themeId]
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
                    dispatchChange(nextMap)
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
