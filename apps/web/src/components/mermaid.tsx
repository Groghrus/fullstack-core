'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let initialized = false

export function Mermaid({ code, id }: { code: string; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

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
        if (!cancelled) setSvg(result)
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

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-auto rounded-lg border bg-card p-3"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}
