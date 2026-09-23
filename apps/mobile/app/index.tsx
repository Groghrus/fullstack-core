import { Stack, useRouter } from 'expo-router'
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { contentRegistry } from '../src/generated/content'
import { palette } from '../src/lib/palette'
import { useTheme } from '../src/lib/theme'
import { Badge } from '../src/components/ui/Badge'
import { Card, CardContent } from '../src/components/ui/Card'
import { BookOpenIcon } from '../src/components/icons'
import { Pressable } from 'react-native'


export default function IndexScreen() {
  const router = useRouter()
  const { dark } = useTheme()
  const c = palette(dark)

  const blocks = contentRegistry.blocks
  const totalThemes = blocks.reduce((n, b) => n + b.themes.length, 0)


  return (
    <>
      <Stack.Screen options={{ title: 'Fullstack Core' }} />
      <ScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: `${c.primary}14` }]}>
            <BookOpenIcon color={c.primary} size={13} />
            <Text style={[styles.heroBadgeText, { color: c.primary }]}>
              Интерактивный справочник и тренажёр
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: c.foreground }]}>
            Fullstack Core
          </Text>
          <Text style={[styles.heroText, { color: c.mutedForeground }]}>
            {`Фундаментальные знания по архитектуре, бэкенду, распределённым системам и безопасности.
Каждая тема содержит теорию, практические примеры на `}
            <Text style={{ color: c.foreground, fontWeight: '600' }}>
              TypeScript / Go / Java
            </Text>
            {`, диаграммы Mermaid и проверочные квизы.`}
          </Text>

          <View style={[styles.stats, { borderTopColor: c.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: c.foreground }]}>
                {totalThemes}
              </Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>
                Темы и статьи
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: c.foreground }]}>
                {blocks.length}
              </Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>
                Тематических блоков
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: c.foreground, fontSize: 19 }]}>
                TS / Go / Java
              </Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>
                Мультистековые примеры
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>
            Учебные блоки
          </Text>
          <Text style={[styles.sectionHint, { color: c.mutedForeground }]}>
            Выберите тему для изучения
          </Text>
        </View>

        {blocks.map((block) => (
          <Pressable key={block.id} onPress={() => router.push(`/${block.id}`)}>
            <Card style={styles.blockCard}>
              <CardContent style={styles.blockCardContent}>
                <View style={styles.blockRow}>
                  <Text
                    style={[styles.blockTitle, { color: c.foreground }]}
                    numberOfLines={1}
                  >
                    {block.order}. {block.title}
                  </Text>
                  <Badge variant="secondary" style={styles.blockCount}>
                    {block.themes.length} тем
                  </Badge>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 48 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '500' },
  heroTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    color: undefined,
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 24,
    gap: 16,
  },
  stat: { flexBasis: '45%', flexGrow: 1 },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  sectionHint: { fontSize: 12 },
  blockCard: { marginBottom: 12 },
  blockCardContent: { padding: 16 },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  blockTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  blockCount: { flexShrink: 0 },
})
