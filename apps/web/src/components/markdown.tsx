'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { Mermaid } from './mermaid'
import { HighlightedCode } from './code-block'

type Unit =
  | { type: 'block'; content: string }
  | { type: 'sub'; heading: string; content: string }

function splitSubsections(source: string): Unit[] {
  const lines = source.split('\n')
  const units: Unit[] = []
  let block: string[] = []
  let sub: { heading: string; body: string[] } | null = null
  let inFence = false

  const flushBlock = () => {
    if (block.length) {
      units.push({ type: 'block', content: block.join('\n') })
      block = []
    }
  }
  const flushSub = () => {
    if (sub) {
      units.push({ type: 'sub', heading: sub.heading, content: sub.body.join('\n') })
      sub = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('```')) inFence = !inFence

    if (!inFence) {
      const m = /^(#{1,3})\s+(.*)$/.exec(trimmed)
      if (m) {
        if (m[1].length === 3) {
          flushBlock()
          flushSub()
          sub = { heading: m[2], body: [] }
          continue
        }
        flushBlock()
        flushSub()
        block = [line]
        continue
      }
    }

    if (sub) sub.body.push(line)
    else block.push(line)
  }
  flushBlock()
  flushSub()
  return units.filter((u) => u.type === 'block' ? u.content.trim() !== '' : true)
}

export function Markdown({ source }: { source: string }) {
  const units = useMemo(() => splitSubsections(source), [source])

  const components = useMemo<Components>(
    () => ({
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '')
        const lang = match?.[1]
        const isInline = !match

        if (isInline) {
          return (
            <code
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
              {...props}
            >
              {children}
            </code>
          )
        }

        const code = String(children).replace(/\n$/, '')

        if (lang === 'mermaid') {
          return (
            <Mermaid
              code={code}
              id={String(Math.random().toString(36).slice(2, 8))}
            />
          )
        }

        return <HighlightedCode code={code} lang={lang || 'text'} />
      },
      h1: (props) => (
        <h1
          className="mt-0 scroll-m-20 border-b pb-2 text-3xl font-bold tracking-tight"
          {...props}
        />
      ),
      h2: (props) => (
        <h2
          className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight"
          {...props}
        />
      ),
      h3: (props) => (
        <h3 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight" {...props} />
      ),
      h4: (props) => (
        <h4 className="mt-6 scroll-m-20 text-lg font-semibold" {...props} />
      ),
      p: (props) => <p className="leading-7 [&:not(:first-child)]:mt-5" {...props} />,
      ul: (props) => (
        <ul className="my-5 list-disc pl-6 [&>li]:mt-2" {...props} />
      ),
      ol: (props) => (
        <ol className="my-5 list-decimal pl-6 [&>li]:mt-2" {...props} />
      ),
      li: (props) => <li className="leading-7" {...props} />,
      a: (props) => (
        <a
          className="font-medium underline underline-offset-4 hover:decoration-2"
          target="_blank"
          rel="noreferrer"
          {...props}
        />
      ),
      table: (props) => (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm" {...props} />
        </div>
      ),
      th: (props) => (
        <th className="border bg-muted px-3 py-2 text-left font-semibold" {...props} />
      ),
      td: (props) => (
        <td className="border px-3 py-2 align-top" {...props} />
      ),
      input: ({ type, ...props }) =>
        type === 'checkbox' ? (
          <input type="checkbox" className="mr-2" disabled {...props} />
        ) : (
          <input {...props} />
        ),
    }),
    [],
  )

  return (
    <div className="prose-none max-w-none">
      {units.map((unit, i) =>
        unit.type === 'sub' ? (
          <details
            key={i}
            className="group my-4 overflow-hidden rounded-lg border border-border bg-card"
          >
            <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              {unit.heading}
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {unit.content}
              </ReactMarkdown>
            </div>
          </details>
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={components}>
            {unit.content}
          </ReactMarkdown>
        ),
      )}
    </div>
  )
}
