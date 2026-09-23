import { Stack, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { Sidebar } from '../src/components/Sidebar'
import { MenuIcon, MoonIcon, SunIcon } from '../src/components/icons'
import { palette } from '../src/lib/palette'
import { ThemeProvider, useTheme } from '../src/lib/theme'

function RootNavigator() {
  const { dark, toggle } = useTheme()
  const c = palette(dark)
  const pathname = usePathname()
  const { width: winWidth, height: winHeight } = useWindowDimensions()
  const drawerWidth = Math.min(320, Math.round(winWidth * 0.85))
  const [menuOpen, setMenuOpen] = useState(false)
  const slide = useRef(new Animated.Value(-drawerWidth)).current
  const fade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: menuOpen ? 0 : -drawerWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: menuOpen ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [menuOpen, slide, fade, drawerWidth])

  const segments = pathname.split('/').filter(Boolean)
  const activeBlock = segments[0] ?? undefined
  const activeTheme = segments[1] ?? undefined

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.foreground,
          headerTitleStyle: { fontWeight: '600', fontSize: 15 },
          headerShadowVisible: false,
          headerTitle: () => null,
          contentStyle: { backgroundColor: c.background },
          headerLeft: () => (
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={10}
              style={styles.headerBtn}
              aria-label="Открыть меню"
            >
              <MenuIcon color={c.foreground} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <Pressable
                onPress={toggle}
                hitSlop={10}
                style={styles.headerBtn}
                aria-label="Переключить тему"
              >
                {dark ? <SunIcon color={c.foreground} /> : <MoonIcon color={c.foreground} />}
              </Pressable>
            </View>
          ),
        }}
      />

      {menuOpen && (
        <View style={styles.overlay}>
          <Animated.View
            style={[styles.backdrop, { opacity: fade }]}
            pointerEvents={menuOpen ? 'auto' : 'none'}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setMenuOpen(false)}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              { width: drawerWidth, backgroundColor: c.sidebar },
              { transform: [{ translateX: slide }] },
            ]}
          >
            <Sidebar
              width={drawerWidth}
              onClose={() => setMenuOpen(false)}
              activeBlock={activeBlock}
              activeTheme={activeTheme}
            />
          </Animated.View>
        </View>
      )}
    </View>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000066',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    height: '100%',
  },
})