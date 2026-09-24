import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'

const KEY = 'fullstack-core:theme'

interface ThemeCtx {
  dark: boolean
  toggle: () => void
  /** true после загрузки из AsyncStorage (чтобы не мигало дефолтом) */
  ready: boolean
}

const Ctx = createContext<ThemeCtx>({
  dark: false,
  toggle: () => {},
  ready: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [dark, setDark] = useState(system === 'dark')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (cancelled) return
        if (stored) setDark(stored === 'dark')
      })
      .catch(() => {})
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      AsyncStorage.setItem(KEY, next ? 'dark' : 'light').catch(() => {})
      return next
    })
  }

  return <Ctx.Provider value={{ dark, toggle, ready }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}
