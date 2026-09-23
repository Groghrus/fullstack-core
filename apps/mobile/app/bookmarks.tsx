import { Stack, useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { contentRegistry, contentTitles } from '../src/generated/content'
import { palette } from '../src/lib/palette'
import { toggleBookmark, useProgress } from '../src/lib/progress'
import { useTheme } from '../src/lib/theme'
import { Badge } from '../src/components/ui/Badge'
import { Button } from '../src/components/ui/Button'
import { Card, CardContent } from '../src/components/ui/Card'
import { BookmarkIcon, CheckIcon, XIcon } from '../src/components/icons'

export default function BookmarksScreen() {
  const router = useRouter()
  const { dark } = useTheme()
  const c = palette(dark)
  const { progress } = useProgress()

  const groups = contentRegistry.blocks
    .map((block) => ({
      block,
      items: block.themes.filter((t) => progress[t]?.bookmarked),
    }))
    .filter((g) => g.items.length > 0)

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <>
      <Stack.Screen options={{ title: 'Закладки' }} />
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
        {total === 0 ? (
          <View style={styles.empty}>
            <BookmarkIcon color={`${c.mutedForeground}66`} size={44} />
            <View style={styles.emptyTextWrap}>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>
                Закладок пока нет
              </Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                Добавляйте темы в закладки кнопкой на странице темы — они будут
                копиться здесь.
              </Text>
            </View>
            <Button variant="outline" onPress={() => router.push('/')}>
              <Text style={{ color: c.foreground, fontSize: 14, fontWeight: '500' }}>
                К каталогу тем
              </Text>
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: c.foreground }]}>
                Закладки
              </Text>
              <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
                {total} тем сохранено
              </Text>
            </View>

            <View style={styles.sections}>
              {groups.map(({ block, items }) => (
                <View key={block.id} style={styles.section}>
                  <Text style={[styles.blockTitle, { color: c.mutedForeground }]}>
                    {block.order}. {block.title}
                  </Text>
                  <View style={styles.sectionCards}>
                    {items.map((themeId) => {
                      const done = progress[themeId]?.status === 'done'
                      const title = contentTitles[themeId]
                      return (
                        <Card key={themeId}>
                          <CardContent style={styles.themeRow}>
                            <Pressable
                              style={styles.open}
                              onPress={() => router.push(`/${block.id}/${themeId}`)}
                            >
                              <View
                                style={[
                                  styles.iconBox,
                                  { borderColor: c.border, backgroundColor: c.muted },
                                ]}
                              >
                                {done ? (
                                  <CheckIcon color={c.successFg} size={15} />
                                ) : (
                                  <Text style={{ color: c.amber, fontSize: 14 }}>
                                    ★
                                  </Text>
                                )}
                              </View>
                              <View style={styles.themeBody}>
                                <View style={styles.themeTitleWrap}>
                                  <Text
                                    style={[styles.themeTitle, { color: c.foreground }]}
                                    numberOfLines={1}
                                  >
                                    {title}
                                  </Text>
                                </View>
                                <Text
                                  style={[styles.themeId, { color: c.mutedForeground }]}
                                  numberOfLines={1}
                                >
                                  {themeId}
                                </Text>
                              </View>
                            </Pressable>
                            {done ? (
                              <Badge variant="success" style={styles.themeBadge}>
                                изучено
                              </Badge>
                            ) : null}
                            <Pressable
                              onPress={() => toggleBookmark(themeId)}
                              hitSlop={8}
                              style={styles.removeBtn}
                              aria-label="Убрать из закладок"
                            >
                              <XIcon color={c.mutedForeground} size={16} />
                            </Pressable>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 56 },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 64,
  },
  emptyTextWrap: { alignItems: 'center', gap: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { fontSize: 15, marginTop: 8 },
  sections: { gap: 32 },
  section: {},
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCards: { gap: 8 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  themeBody: { flex: 1, minWidth: 0 },
  themeTitleWrap: {},
  themeTitle: { fontSize: 15, fontWeight: '500' },
  themeId: { fontSize: 12, marginTop: 1 },
  themeBadge: { flexShrink: 0 },
  removeBtn: { padding: 4, flexShrink: 0 },
})