import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import versionData from '../../../../package.json'
import { contentRegistry, contentTitles, themes } from '../generated/content'
import { useProgress } from '../lib/progress'
import { palette } from '../lib/palette'
import { searchThemes } from '../lib/search'
import { useTheme } from '../lib/theme'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import {
  BookmarkIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from './icons'

const version = versionData.version

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Подсветка совпадений запроса — аналог <mark> из web (amber-фон). */
function Highlight({
  text,
  query,
  dark,
}: {
  text: string
  query: string
  dark: boolean
}) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2)
  if (!words.length) return <>{text}</>
  const re = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(re)
  const markBg = dark ? '#f59e0b4d' : '#fde68acc'
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text
            key={i}
            style={{ backgroundColor: markBg, borderRadius: 3, paddingHorizontal: 1 }}
          >
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </>
  )
}

interface SidebarProps {
  width?: number
  activeBlock?: string
  activeTheme?: string
  onClose?: () => void
}

export function Sidebar({ width, activeBlock, activeTheme, onClose }: SidebarProps) {
  const router = useRouter()
  const { dark, toggle } = useTheme()
  const { progress } = useProgress()
  const c = palette(dark)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const q = query.trim().toLowerCase()
  const searchActive = q.length >= 2
  const results = useMemo(
    () => (searchActive ? searchThemes(q) : []),
    [searchActive, q],
  )

  const toggleBlock = useCallback((blockId: string) => {
    setCollapsed((prev) => ({ ...prev, [blockId]: !prev[blockId] }))
  }, [])

  const openTheme = (blockId: string, themeId: string) => {
    onClose?.()
    router.push(`/${blockId}/${themeId}`)
  }

  const openBlock = (blockId: string) => {
    onClose?.()
    router.push(`/${blockId}`)
  }

  const openBookmarks = () => {
    onClose?.()
    router.push('/bookmarks')
  }

  const totalDone = useMemo(
    () =>
      Object.values(progress).filter((p) => p.status === 'done').length,
    [progress],
  )

  return (
    <View
      style={[
        width ? { width, flex: 1 } : StyleSheet.flatten(styles.aside),
        {
          backgroundColor: c.sidebar,
          borderRightColor: c.sidebarBorder,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: c.sidebarBorder }]}>
        <Pressable
          onPress={() => {
            onClose?.()
            router.push('/')
          }}
        >
          <Text style={[styles.brand, { color: c.sidebarForeground }]}>
            Fullstack Core
          </Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Button variant="ghost" size="icon" onPress={toggle} aria-label="Переключить тему">
            {dark ? <SunIcon color={c.sidebarForeground} /> : <MoonIcon color={c.sidebarForeground} />}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onPress={onClose} aria-label="Закрыть меню">
              <XIcon color={c.sidebarForeground} size={20} />
            </Button>
          )}
        </View>
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: c.sidebarBorder }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: 'transparent',
              borderColor: c.input,
            },
          ]}
        >
          <SearchIcon color={c.mutedForeground} size={15} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск по темам..."
            placeholderTextColor={c.mutedForeground}
            style={[styles.searchInput, { color: c.sidebarForeground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} aria-label="Очистить поиск">
              <XIcon color={c.mutedForeground} size={15} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={{ padding: 8 }}>
        {searchActive ? (
          <SearchResultsBlock results={results} onOpen={openTheme} dark={dark} query={q} />
        ) : (
          <NavTree
            collapsed={collapsed}
            onToggle={toggleBlock}
            activeBlock={activeBlock}
            activeTheme={activeTheme}
            progress={progress}
            onOpenTheme={openTheme}
            onOpenBlock={openBlock}
            onOpenBookmarks={openBookmarks}
            dark={dark}
            totalDone={totalDone}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.sidebarBorder }]}>
        <Badge variant="outline">v {version}</Badge>
      </View>
    </View>
  )
}

function NavTree({
  collapsed,
  onToggle,
  activeBlock,
  activeTheme,
  progress,
  onOpenTheme,
  onOpenBlock,
  onOpenBookmarks,
  dark,
  totalDone,
}: {
  collapsed: Record<string, boolean>
  onToggle: (blockId: string) => void
  activeBlock?: string
  activeTheme?: string
  progress: Record<string, { status: string; bookmarked: boolean }>
  onOpenTheme: (blockId: string, themeId: string) => void
  onOpenBlock: (blockId: string) => void
  onOpenBookmarks: () => void
  dark: boolean
  totalDone: number
}) {
  const c = palette(dark)

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={onOpenBookmarks}
        style={styles.navRow}
      >
        <BookmarkIcon color={c.amber} size={16} />
        <Text style={[styles.navRowText, { color: c.sidebarForeground }]}>
          Закладки
        </Text>
      </Pressable>

      <View style={[styles.divider, { borderBottomColor: c.sidebarBorder }]} />

      {contentRegistry.blocks.map((block) => {
        const open = !collapsed[block.id]
        const isActiveBlock = block.id === activeBlock
        const countDone = block.themes.filter(
          (t) => progress[t]?.status === 'done',
        ).length
        const total = block.themes.length
        const allDone = countDone > 0 && countDone === total

        return (
          <View key={block.id} style={{ marginBottom: 4 }}>
            <Pressable
              onPress={() => onToggle(block.id)}
              style={[
                styles.navRow,
                isActiveBlock && { backgroundColor: c.sidebarAccent },
              ]}
            >
              <Text style={{ color: c.mutedForeground, fontSize: 11 }}>
                {open ? '▾' : '▸'}
              </Text>
              <Text
                style={[
                  styles.navRowText,
                  {
                    color: c.sidebarForeground,
                    flex: 1,
                  },
                ]}
                numberOfLines={2}
              >
                {block.order}. {block.title}
              </Text>
              {countDone > 0 ? (
                <Text
                  style={{
                    color: allDone ? c.successFg : c.mutedForeground,
                    fontSize: 11,
                    fontWeight: allDone ? '600' : '400',
                  }}
                >
                  {allDone ? '✓' : `${countDone}/${total}`}
                </Text>
              ) : null}
            </Pressable>

            {open && (
              <View style={[styles.subtree, { borderLeftColor: c.sidebarBorder }]}>
                {block.themes.map((themeId) => {
                  const p = progress[themeId]
                  const done = p?.status === 'done'
                  const started = !!p && !done
                  const isActive = themeId === activeTheme
                  const title =
                    contentTitles[themeId] || themes[themeId]?.title || themeId
                  return (
                    <Pressable
                      key={themeId}
                      onPress={() => onOpenTheme(block.id, themeId)}
                      style={[
                        styles.themeRow,
                        isActive && {
                          backgroundColor: c.sidebarAccent,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12, width: 16 }}>
                        {done ? (
                          <Text style={{ color: c.successFg }}>✓</Text>
                        ) : started ? (
                          <Text style={{ color: c.amber }}>★</Text>
                        ) : (
                          ''
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.themeRowText,
                          {
                            color: isActive
                              ? c.accentForeground
                              : c.sidebarForeground,
                          },
                        ]}
                        numberOfLines={3}
                      >
                        {title}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

function SearchResultsBlock({
  results,
  onOpen,
  dark,
  query,
}: {
  results: ReturnType<typeof searchThemes>
  onOpen: (blockId: string, themeId: string) => void
  dark: boolean
  query: string
}) {
  const c = palette(dark)
  if (results.length === 0) {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 16 }}>
        <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
          Ничего не найдено
        </Text>
      </View>
    )
  }
  return (
    <View>
      <Text
        style={{
          color: c.mutedForeground,
          fontSize: 12,
          fontWeight: '600',
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        Результаты поиска
      </Text>
      {results.map((r) => (
        <Pressable
          key={r.themeId}
          onPress={() => onOpen(r.blockId, r.themeId)}
          style={styles.resultRow}
        >
          <Text
            style={{ color: c.sidebarForeground, fontSize: 14, fontWeight: '500' }}
            numberOfLines={1}
          >
            <Highlight text={r.title} query={query} dark={dark} />
          </Text>
          <Text
            style={{ color: c.mutedForeground, fontSize: 12 }}
            numberOfLines={2}
          >
            <Highlight text={r.snippet} query={query} dark={dark} />
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  aside: {
    width: 320,
    height: '100%',
    flex: 1,
    borderRightWidth: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  brand: { fontSize: 16, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  searchWrap: { padding: 12, borderBottomWidth: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  nav: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 6,
  },
  navRowText: { fontSize: 14, fontWeight: '500' },
  divider: {
    marginVertical: 8,
    borderBottomWidth: 1,
  },
  subtree: {
    marginLeft: 14,
    borderLeftWidth: 1,
    paddingLeft: 6,
    marginTop: 2,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
  },
  themeRowText: { fontSize: 13, flex: 1, lineHeight: 17 },
  resultRow: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 2,
  },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
})