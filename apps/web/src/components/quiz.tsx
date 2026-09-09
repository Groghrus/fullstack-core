'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ParsedQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  draft: boolean
}

function parseQuiz(source: string): ParsedQuestion[] {
  // Ищем секцию ## Вопросы
  const match = source.match(/^##\s+Вопросы[\s\S]*$/m)
  if (!match) return []
  const section = match[0]

  const questions: ParsedQuestion[] = []
  const qBlocks = section.split(/^###\s+/m).slice(1)

  for (const raw of qBlocks) {
    const lines = raw.split('\n')
    const idLine = lines[0]?.trim() || 'Q'
    const id = idLine

    // prompt: первая строка после ### — это **...** (иногда с (draft))
    const body = lines.slice(1)
    const promptMatch = body.join('\n').match(/^\s*\*\*(.+?)\*\*/)
    const prompt = promptMatch ? promptMatch[1] : body[0] || ''
    const draft = /\(draft\)/.test(body.slice(0, 5).join('\n'))

    const options: string[] = []
    let correctIndex = -1
    const optionLines = body.filter((l) =>
      /^\s*[-*]\s+\[[ xX]\]/.test(l),
    )
    optionLines.forEach((l, i) => {
      const checked = /\[[xX]\]/.test(l)
      const text = l.replace(/^\s*[-*]\s+\[[ xX]\]\s*/, '')
      options.push(text)
      if (checked) correctIndex = i
    })

    const explMatch = body
      .join('\n')
      .match(/Пояснение:\s*(.+)/i)
    const explanation = explMatch ? explMatch[1].trim() : ''

    if (options.length > 0) {
      questions.push({
        id,
        prompt,
        options,
        correctIndex,
        explanation,
        draft,
      })
    }
  }
  return questions
}

export function Quiz({ source }: { source: string }) {
  const questions = useMemo(() => parseQuiz(source), [source])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  if (questions.length === 0) return null

  const score = questions.filter(
    (q) => answers[q.id] === q.correctIndex && submitted[q.id],
  ).length

  return (
    <div className="mt-12 border-t pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Вопросы для проверки</h2>
        <Badge variant="outline">
          {score}/{questions.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const selected = answers[q.id]
          const isSubmitted = submitted[q.id]

          return (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start gap-2">
                  <span className="text-sm font-semibold">{q.id}</span>
                  <span className="font-medium">{q.prompt}</span>
                  {q.draft && <Badge variant="secondary">draft</Badge>}
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === q.correctIndex
                    const isChosen = selected === idx
                    const showState = isSubmitted

                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [q.id]: idx }))
                        }
                        disabled={isSubmitted}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                          showState && isCorrect &&
                            'border-emerald-500 bg-emerald-500/10 text-emerald-500',
                          showState && isChosen && !isCorrect &&
                            'border-destructive bg-destructive/10 text-destructive',
                          showState && !isChosen && !isCorrect &&
                            'opacity-60',
                          !showState && isChosen &&
                            'border-primary bg-accent',
                          !showState && !isChosen &&
                            'hover:bg-accent',
                        )}
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {isSubmitted && q.explanation && (
                  <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                    {q.explanation}
                  </p>
                )}

                {!isSubmitted && (
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={selected === undefined}
                    onClick={() =>
                      setSubmitted((s) => ({ ...s, [q.id]: true }))
                    }
                  >
                    Проверить
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
