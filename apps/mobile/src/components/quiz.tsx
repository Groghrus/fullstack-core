import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import type { QuizQuestion } from '../generated/content'
import { palette } from '../lib/palette'
import { useTheme } from '../lib/theme'

export function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const { dark } = useTheme()
  const c = palette(dark)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  if (questions.length === 0) return null

  const score = questions.filter(
    (q) => submitted[q.id] && answers[q.id] === q.correctIndex,
  ).length

  return (
    <View style={[styles.root, { borderTopColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>
          Вопросы для проверки
        </Text>
        <Badge variant="outline">
          {score}/{questions.length}
        </Badge>
      </View>

      <View style={styles.stack}>
        {questions.map((q) => {
          const selected = answers[q.id]
          const isSubmitted = submitted[q.id]

          return (
            <Card key={q.id}>
              <CardContent style={styles.cardContent}>
                <View style={styles.qHeader}>
                  <Text style={[styles.qId, { color: c.foreground }]}>{q.id}</Text>
                  <Text style={[styles.prompt, { color: c.foreground }]}>
                    {q.prompt}
                  </Text>
                  {q.draft && <Badge variant="secondary">draft</Badge>}
                </View>

                <View style={styles.opts}>
                  {q.options.map((opt, idx) => {
                    const isCorrect = idx === q.correctIndex
                    const isChosen = selected === idx
                    const showState = isSubmitted

                    let optionStyle;
                    if (showState && isCorrect) {
                      optionStyle = { borderColor: '#059669', backgroundColor: `${c.successBg}`, }
                    } else if (showState && isChosen && !isCorrect) {
                      optionStyle = { borderColor: c.destructive, backgroundColor: c.destructiveBg }
                    } else if (showState && !isChosen && !isCorrect) {
                      optionStyle = { opacity: 0.6 }
                    } else if (!showState && isChosen) {
                      optionStyle = { borderColor: c.primary, backgroundColor: c.accent }
                    } else {
                      optionStyle = null
                    }

                    return (
                      <Pressable
                        key={idx}
                        disabled={isSubmitted}
                        onPress={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                        style={[
                          styles.opt,
                          { borderColor: c.input },
                          optionStyle,
                        ]}
                      >
                        <Text style={[styles.optLetter, { color: c.mutedForeground }]}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                        <Text style={[styles.optText, { color: c.foreground }]}>
                          {opt}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                {isSubmitted && q.explanation !== '' && (
                  <View style={[styles.expl, { backgroundColor: c.muted }]}>
                    <Text style={[styles.explText, { color: c.mutedForeground }]}>
                      {q.explanation}
                    </Text>
                  </View>
                )}

                {!isSubmitted && (
                  <Pressable
                    style={[
                      styles.btn,
                      selected === undefined && styles.btnDisabled,
                      { backgroundColor: c.primary },
                    ]}
                    disabled={selected === undefined}
                    onPress={() => setSubmitted((s) => ({ ...s, [q.id]: true }))}
                  >
                    <Text style={[styles.btnText, { color: c.primaryForeground }]}>
                      Проверить
                    </Text>
                  </Pressable>
                )}
              </CardContent>
            </Card>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { marginTop: 48, borderTopWidth: 1, paddingTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '600' },
  stack: { gap: 16 },
  cardContent: { padding: 16 },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  qId: { fontSize: 14, fontWeight: '600' },
  prompt: { fontSize: 14, fontWeight: '500', flex: 1 },
  opts: { gap: 6 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optLetter: { fontFamily: 'monospace', fontSize: 12 },
  optText: { fontSize: 14, flex: 1 },
  expl: {
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
  },
  explText: { fontSize: 14, lineHeight: 20 },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 14, fontWeight: '600' },
})