'use client'

import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { Mermaid } from './mermaid'

function HighlightedCode({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: 'github-dark',
    })
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {
        // язык не поддерживается — показать как обычный код
        if (!cancelled) setHtml('')
      })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return (
    <div className="my-4">
      <div className="flex items-center justify-between rounded-t-md border border-b-0 bg-muted px-3 py-1.5 text-xs text-muted-foreground">
        <span>{lang || 'code'}</span>
      </div>
      {html ? (
        <div
          className="overflow-auto rounded-b-md border p-3 text-sm [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-auto rounded-b-md border bg-black/40 p-3 text-sm text-foreground">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

export { HighlightedCode }
