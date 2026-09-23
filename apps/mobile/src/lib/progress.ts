import AsyncStorage from '@react-native-async-storage/async-storage'

const PROGRESS_KEY = 'learn:progress:v1'

export async function loadProgress(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export async function toggleTheme(themeId: string): Promise<string[]> {
  const cur = await loadProgress()
  const next = cur.includes(themeId)
    ? cur.filter((id) => id !== themeId)
    : [...cur, themeId]
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
  return next
}

export async function isThemeDone(themeId: string): Promise<boolean> {
  return (await loadProgress()).includes(themeId)
}