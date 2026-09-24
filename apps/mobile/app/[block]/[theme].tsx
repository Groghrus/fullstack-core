import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  contentRegistry,
  contentTitles,
  themes,
  type ThemeData,
  type Unit,
} from '../../src/generated/content'
import { MarkdownView } from '../../src/components/markdown'
import { Diagram } from '../../src/components/diagram'
import { QuizView } from '../../src/components/quiz'
import { Badge } from '../../src/components/ui/Badge'
import { Button } from '../../src/components/ui/Button'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  CircleIcon,
} from '../../src/components/icons'
import { palette } from '../../src/lib/palette'
import { markDone, markRead, toggleBookmark, useProgress } from '../../src/lib/progress'
import { useTheme } from '../../src/lib/theme'

function renderUnit(u: Unit, data: ThemeData, key: number) {
  if (u.type === 'md') {
    const bodyWithoutHeading = u.content.replace(/^\s*#\s+.*(?:\r?\n|$)/, '')
    return (
      <MarkdownView key={key} source={bodyWithoutHeading} codeBlocks={data.codeBlocks} />
    )
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
  return <Diagram key={key} code={diag.code} />
}

export default function ThemeScreen() {
  const { block, theme } = useLocalSearchParams<{ block: string; theme: string }>()
  const router = useRouter()
  const { dark } = useTheme()
  const c = palette(dark)
  const { progress } = useProgress()

  const data = theme ? themes[theme] : undefined
  const done = theme ? progress[theme]?.status === 'done' : false
  const bookmarked = theme ? !!progress[theme]?.bookmarked : false

  useEffect(() => {
    if (theme) markRead(theme)
  }, [theme])

  if (!data) {
    return <Text style={styles.missing}>Тема не найдена</Text>
  }

  const blockMeta = contentRegistry.blocks.find((b) => b.id === block)
  const themeId = theme ?? ''

  const diffText =
    data.frontmatter.difficulty === 'beginner'
      ? 'Начальный'
      : data.frontmatter.difficulty === 'advanced'
        ? 'Продвинутый'
        : 'Средний'
  const wellDone = data.frontmatter.status === 'done'

  const ids = (blockMeta?.themes ?? []) as readonly string[]
  const idx = ids.indexOf(themeId)
  const prevId = idx > 0 ? ids[idx - 1] : null
  const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null

  return (
    <>
      <Stack.Screen
        options={{
          title:
            data.title.length > 34
              ? data.title.slice(0, 34) + '…'
              : data.title,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backLink} onPress={() => router.push('/')} hitSlop={8}>
          <ArrowLeftIcon color={c.mutedForeground} size={15} />
          <Text style={[styles.backText, { color: c.mutedForeground }]}>
            Каталог
          </Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.badgeRow}>
            {blockMeta && <Badge variant="outline">{blockMeta.title}</Badge>}
            <Badge variant="secondary">{diffText}</Badge>
            {wellDone ? (
              <Badge variant="success" style={styles.statusBadge}>
                расписана
              </Badge>
            ) : (
              <Badge variant="secondary">черновик</Badge>
            )}
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>{data.title}</Text>
        </View>

        <View style={styles.actionRow}>
          <Button
            variant={done ? 'default' : 'outline'}
            size="sm"
            onPress={() => theme && markDone(theme, !done)}
          >
            {done ? (
              <CheckIcon color={c.primaryForeground} size={15} />
            ) : (
              <CircleIcon color={c.foreground} size={15} />
            )}
            <Text
              style={{
                color: done ? c.primaryForeground : c.foreground,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              {done ? 'Изучено' : 'Отметить изученным'}
            </Text>
          </Button>
          <Button
            variant={bookmarked ? 'default' : 'outline'}
            size="sm"
            onPress={() => theme && toggleBookmark(theme)}
          >
            <BookmarkIcon
              color={bookmarked ? c.primaryForeground : c.foreground}
              size={15}
              filled={bookmarked}
            />
            <Text
              style={{
                color: bookmarked ? c.primaryForeground : c.foreground,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              {bookmarked ? 'В закладках' : 'В закладки'}
            </Text>
          </Button>
        </View>

        <View style={styles.content}>
          {data.units.map((u, i) => renderUnit(u, data, i))}
        </View>

        <QuizView questions={data.quiz} />

        {(prevId || nextId) && (
          <View style={[styles.nav, { borderTopColor: c.border }]}>
            {prevId ? (
              <PrevNextCard
                side="prev"
                title={contentTitles[prevId] || prevId}
                onPress={() => router.push(`/${block}/${prevId}`)}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {nextId ? (
              <PrevNextCard
                side="next"
                title={contentTitles[nextId] || nextId}
                onPress={() => router.push(`/${block}/${nextId}`)}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        )}
      </ScrollView>
    </>
  )
}

function PrevNextCard({
  side,
  title,
  onPress,
}: {
  side: 'prev' | 'next'
  title: string
  onPress: () => void
}) {
  const { dark } = useTheme()
  const c = palette(dark)
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.navCard,
        { borderColor: c.input, backgroundColor: c.card },
        side === 'next' && styles.navCardNext,
      ]}
    >
      <View style={styles.navLabelRow}>
        {side === 'prev' && <ArrowLeftIcon color={c.mutedForeground} size={15} />}
        <Text style={[styles.navLabel, { color: c.mutedForeground }]}>
          {side === 'prev' ? 'Предыдущая' : 'Следующая'}
        </Text>
        {side === 'next' && <ArrowRightIcon color={c.mutedForeground} size={15} />}
      </View>
      <Text
        style={[styles.navTitle, { color: c.foreground }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingBottom: 64,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  missing: { padding: 20, color: '#64748b' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backText: { fontSize: 14 },
  header: { marginBottom: 24 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {},
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  content: {},
  diagramError: {
    marginVertical: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#450a0a',
  },
  diagramErrorText: { color: '#fca5a5', fontSize: 13 },
  nav: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    marginTop: 56,
    paddingTop: 24,
  },
  navCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  navCardNext: { alignItems: 'flex-end' },
  navLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 12 },
  navTitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
})