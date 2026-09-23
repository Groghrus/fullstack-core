import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'

export default function RootLayout() {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: dark ? '#0f172a' : '#f8fafc' },
          headerTintColor: dark ? '#f1f5f9' : '#0f172a',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: dark ? '#0f172a' : '#f8fafc' },
        }}
      />
    </>
  )
}