import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { QuizQuestion } from '../generated/content'

export function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  if (questions.length === 0) return null

  const score = questions.filter(
    (q) => submitted[q.id] && answers[q.id] === q.correctIndex,
  ).length

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Вопросы для проверки</Text>
        <Text style={styles.score}>
          {score}/{questions.length}
        </Text>
      </View>

      {questions.map((q, qi) => {
        const selected = answers[q.id]
        const isSubmitted = submitted[q.id]
        return (
          <View key={q.id} style={styles.card}>
            <View style={styles.qHeader}>
              <Text style={styles.qId}>{qi + 1}</Text>
              <Text style={styles.prompt}>{q.prompt}</Text>
              {q.draft && <Text style={styles.draft}>draft</Text>}
            </View>

            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.correctIndex
              const isChosen = selected === idx
              let style = styles.opt
              if (isSubmitted) {
                if (isCorrect) style = { ...styles.opt, ...styles.optCorrect }
                else if (isChosen) style = { ...styles.opt, ...styles.optWrong }
                else style = { ...styles.opt, ...styles.optDim }
              } else if (isChosen) {
                style = { ...styles.opt, ...styles.optChosen }
              }
              return (
                <Pressable
                  key={idx}
                  disabled={isSubmitted}
                  onPress={() =>
                    setAnswers((a) => ({ ...a, [q.id]: idx }))
                  }
                  style={style}
                >
                  <Text style={styles.optLetter}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                  <Text style={styles.optText}>{opt}</Text>
                </Pressable>
              )
            })}

            {isSubmitted && q.explanation !== '' && (
              <View style={styles.expl}>
                <Text style={styles.explText}>{q.explanation}</Text>
              </View>
            )}

            {!isSubmitted && (
              <Pressable
                style={[
                  styles.btn,
                  selected === undefined && styles.btnDisabled,
                ]}
                disabled={selected === undefined}
                onPress={() => setSubmitted((s) => ({ ...s, [q.id]: true }))}
              >
                <Text style={styles.btnText}>Проверить</Text>
              </Pressable>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { marginTop: 28, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  score: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 14,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  qId: { color: '#64748b', fontSize: 13, fontWeight: '700', marginTop: 2 },
  prompt: { color: '#e2e8f0', fontSize: 15, fontWeight: '500', flex: 1 },
  draft: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#92400e',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  optChosen: { borderColor: '#3b82f6', backgroundColor: '#172554' },
  optCorrect: { borderColor: '#059669', backgroundColor: '#064e3b' },
  optWrong: { borderColor: '#dc2626', backgroundColor: '#7f1d1d' },
  optDim: { opacity: 0.5 },
  optLetter: { color: '#64748b', fontSize: 12, fontVariant: ['tabular-nums'] },
  optText: { color: '#e2e8f0', fontSize: 14, flex: 1 },
  expl: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    padding: 12,
  },
  explText: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  btn: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})