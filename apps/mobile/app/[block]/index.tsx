import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { contentRegistry, contentTitles, themes } from '../../src/generated/content'
import { palette } from '../../src/lib/palette'
import { useProgress } from '../../src/lib/progress'
import { useTheme } from '../../src/lib/theme'
import { Badge } from '../../src/components/ui/Badge'
import { Card, CardContent } from '../../src/components/ui/Card'
import { ArrowLeftIcon, BookmarkIcon, CheckIcon } from '../../src/components/icons'

export default function BlockScreen() {
  const { block } = useLocalSearchParams<{ block: string }>()
  const router = useRouter()
  const { dark } = useTheme()
  const c = palette(dark)
  const { progress } = useProgress()

  const blockMeta = contentRegistry.blocks.find((b) => b.id === block)

  if (!blockMeta) {
    return <Text style={styles.missing}>Блок не найден</Text>
  }

  const items = blockMeta.themes
    .map((themeId) => ({
      themeId,
      title: themes[themeId]?.title || contentTitles[themeId] || themeId,
    }))
    .filter((t) => themes[t.themeId])

  return (
    <>
      <Stack.Screen options={{ title: blockMeta.title }} />
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/')}
          style={styles.backLink}
          hitSlop={8}
        >
          <ArrowLeftIcon color={c.mutedForeground} size={15} />
          <Text style={[styles.backText, { color: c.mutedForeground }]}>
            Каталог
          </Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Badge variant="outline">Блок {blockMeta.order}</Badge>
            <Text style={[styles.headerCount, { color: c.mutedForeground }]}>
              {items.length} тем
            </Text>
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>
            {blockMeta.title}
          </Text>
        </View>

        <View style={styles.list}>
          {items.map((item) => {
            const p = progress[item.themeId]
            const done = p?.status === 'done'
            const started = !!p && !done
            return (
              <Pressable
                key={item.themeId}
                onPress={() => router.push(`/${block}/${item.themeId}`)}
              >
                <Card style={styles.themeCard}>
                  <CardContent style={styles.themeCardContent}>
                    <View style={[styles.iconBox, { borderColor: c.border, backgroundColor: c.muted }]}>
                      {done ? (
                        <CheckIcon color={c.successFg} size={15} />
                      ) : started ? (
                        <BookmarkIcon color={c.foreground} size={14} />
                      ) : (
                        <Text style={{ color: c.mutedForeground, fontSize: 15 }}>
                          •
                        </Text>
                      )}
                    </View>
                    <View style={styles.themeBody}>
                      <Text style={[styles.themeTitle, { color: c.foreground }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                    {done ? (
                      <Badge variant="success" style={styles.themeBadge}>
                        ✓
                      </Badge>
                    ) : started ? (
                      <Badge variant="secondary" style={styles.themeBadge}>
                        открыто
                      </Badge>
                    ) : (
                      <Badge variant="outline" style={styles.themeBadge}>
                        новое
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Pressable>
            )
          })}
        </View>

        <Text style={[styles.footnote, { color: c.mutedForeground }]}>
          Навигация также доступна через сайдбар слева.
        </Text>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 56 },
  missing: { padding: 20, color: '#64748b' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backText: { fontSize: 14 },
  header: { marginBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headerCount: { fontSize: 14 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  list: { gap: 8 },
  themeCard: {},
  themeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBody: { flex: 1, minWidth: 0 },
  themeTitle: { fontSize: 15, fontWeight: '500' },
  themeBadge: { flexShrink: 0 },
  footnote: {
    fontSize: 14,
    marginTop: 32,
    textAlign: 'center',
  },
})