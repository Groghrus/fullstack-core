import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { contentRegistry } from '../src/generated/content'
import { loadProgress } from '../src/lib/progress'

export default function IndexScreen() {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadProgress().then((p) => setDone(new Set(p)))
  }, [])

  const blocks = contentRegistry.blocks

  return (
    <FlatList
      data={blocks}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.root}
      ListHeaderComponent={
        <Text style={[styles.h1, dark && styles.darkText]}>Каталог тем</Text>
      }
      renderItem={({ item, index }) => {
        const doneCount = item.themes.filter((t) => done.has(t)).length
        return (
          <Link href={`/${item.id}`} asChild>
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.card,
                dark && styles.darkCard,
              ])}
            >
              <Text style={styles.blockOrder}>{index + 1}</Text>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, dark && styles.darkText]}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {doneCount}/{item.themes.length} тем
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  darkText: { color: '#f1f5f9' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 10,
  },
  darkCard: {
    borderColor: '#1e293b',
    backgroundColor: '#0d1526',
  },
  blockOrder: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    width: 30,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
})