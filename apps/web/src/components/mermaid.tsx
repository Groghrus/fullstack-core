'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false
const svgCache = new Map<string, string>()

export function Mermaid({ code, id }: { code: string; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const cached = svgCache.get(code)
    if (cached) {
      setSvg(cached)
      return () => {
        cancelled = true
      }
    }

    async function render() {
      if (!initialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        })
        initialized = true
      }
      try {
        const { svg: result } = await mermaid.render(`mermaid-${id}`, code)
        if (!cancelled) {
          svgCache.set(code, result)
          setSvg(result)
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <div className="my-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        Ошибка рендера диаграммы: {error}
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-4 flex min-h-24 items-center justify-center rounded-lg border bg-card p-3 text-xs text-muted-foreground">
        Загрузка диаграммы…
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-auto rounded-lg border bg-card p-3 text-card-foreground dark:[&_.node_text]:!fill-white dark:[&_.edgeLabel_text]:!fill-white [&_.node_text]:!fill-slate-900 [&_.edgeLabel_text]:!fill-slate-800 [&_.node_label]:!text-slate-900 dark:[&_.node_label]:!text-white"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
