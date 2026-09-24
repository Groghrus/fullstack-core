import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { palette } from '../../lib/palette'
import { useTheme } from '../../lib/theme'

export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  const { dark } = useTheme()
  const c = palette(dark)
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function CardContent({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  return <View style={[styles.content, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  content: { paddingHorizontal: 16, paddingVertical: 12 },
})