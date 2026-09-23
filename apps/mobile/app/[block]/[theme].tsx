import { Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import {
  themes,
  type ThemeData,
  type Unit,
} from '../../src/generated/content'
import { MarkdownView } from '../../src/components/markdown'
import { Diagram } from '../../src/components/diagram'
import { QuizView } from '../../src/components/quiz'
import {
  loadProgress,
  toggleTheme,
} from '../../src/lib/progress'

function renderUnit(u: Unit, data: ThemeData, key: number) {
  if (u.type === 'md') {
    return <MarkdownView key={key} source={u.content} />
  }
  if (u.type === 'diagram-error') {
    return (
      <View key={key} style={styles.diagramError}>
        <Text style={styles.diagramErrorText}>Ошибка рендера диаграммы</Text>
      </View>
    )
  }
  const diag = data.diagrams.find((d) => d.id === u.id)
  if (!diag) return null
  return <Diagram key={key} svg={diag.svg} />
}

export default function ThemeScreen() {
  const { block, theme } = useLocalSearchParams<{ block: string; theme: string }>()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'
  const [done, setDone] = useState<Set<string>>(new Set())

  const data = theme ? themes[theme] : undefined
  const isDone = theme ? done.has(theme) : false

  useEffect(() => {
    loadProgress().then((p) => setDone(new Set(p)))
  }, [theme])

  const onToggle = useCallback(async () => {
    if (!theme) return
    const next = await toggleTheme(theme)
    setDone(new Set(next))
  }, [theme])

  if (!data) {
    return <Text style={styles.missing}>Тема не найдена</Text>
  }

  const diffText =
    data.frontmatter.difficulty === 'beginner'
      ? 'Начальный'
      : data.frontmatter.difficulty === 'advanced'
        ? 'Продвинутый'
        : 'Средний'

  return (
    <>
      <Stack.Screen
        options={{
          title: data.title.length > 34
            ? data.title.slice(0, 34) + '…'
            : data.title,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <Text style={styles.badge}>{data.blockId}</Text>
          <Text style={styles.badgeMuted}>{diffText}</Text>
        </View>

        <Text style={[styles.title, dark && styles.darkTitle]}>
          {data.title}
        </Text>

        <Pressable
          onPress={onToggle}
          style={[styles.doneBtn, isDone && styles.doneBtnOn]}
        >
          <Text
            style={[styles.doneBtnText, isDone && styles.doneBtnTextOn]}
          >
            {isDone ? '✓ Прочитано' : 'Отметить прочитанным'}
          </Text>
        </Pressable>

        {data.units.map((u, i) => renderUnit(u, data, i))}

        <View style={styles.quizWrap}>
          <QuizView questions={data.quiz} />
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { padding: 18, paddingBottom: 60 },
  missing: { padding: 20, color: '#64748b' },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeMuted: {
    color: '#64748b',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
    lineHeight: 32,
  },
  darkTitle: { color: '#f1f5f9' },
  doneBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  doneBtnOn: {
    borderColor: '#059669',
    backgroundColor: '#064e3b',
  },
  doneBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  doneBtnTextOn: { color: '#34d399' },
  quizWrap: { marginTop: 8 },
  diagramError: {
    marginVertical: 10,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#450a0a',
  },
  diagramErrorText: { color: '#fca5a5', fontSize: 13 },
})