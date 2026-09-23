import { Link, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { contentRegistry, contentTitles, themes } from '../../src/generated/content'
import { loadProgress } from '../../src/lib/progress'

export default function BlockScreen() {
  const { block } = useLocalSearchParams<{ block: string }>()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'
  const [done, setDone] = useState<Set<string>>(new Set())

  const blockMeta = contentRegistry.blocks.find((b) => b.id === block)

  useEffect(() => {
    loadProgress().then((p) => setDone(new Set(p)))
  }, [])

  if (!blockMeta) {
    return <Text style={styles.missing}>Блок не найден</Text>
  }

  const items = blockMeta.themes
    .map((themeId) => ({
      themeId,
      title:
        themes[themeId]?.title ||
        contentTitles[themeId] ||
        themeId,
    }))
    .filter((t) => themes[t.themeId])

  return (
    <>
      <Stack.Screen options={{ title: blockMeta.title }} />
      <FlatList
        data={items}
        keyExtractor={(t) => t.themeId}
        contentContainerStyle={styles.root}
        renderItem={({ item, index }) => {
          const isDone = done.has(item.themeId)
          return (
            <Link href={`/${block}/${item.themeId}`} asChild>
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.card,
                  dark && styles.darkCard,
                ])}
              >
                <Text style={styles.order}>{index + 1}</Text>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[styles.title, dark && styles.darkText]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {isDone && (
                      <Text style={styles.doneBadge}>✓ прочитано</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40 },
  missing: { padding: 20, color: '#64748b' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 8,
  },
  darkCard: { borderColor: '#1e293b', backgroundColor: '#0d1526' },
  order: { fontSize: 15, fontWeight: '700', color: '#64748b', width: 24 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '500', color: '#0f172a', flex: 1 },
  darkText: { color: '#e2e8f0' },
  doneBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
})