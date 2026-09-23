import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { palette } from '../../lib/palette'
import { useTheme } from '../../lib/theme'

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success'

export function Badge({
  variant = 'secondary',
  children,
  style,
  textStyle,
}: {
  variant?: BadgeVariant
  children: ReactNode
  style?: ViewStyle
  textStyle?: object
}) {
  const { dark } = useTheme()
  const c = palette(dark)

  let bg: string
  let color: string
  let borderWidth = 0
  let borderColor: string | undefined
  if (variant === 'default') {
    bg = c.primary
    color = c.primaryForeground
  } else if (variant === 'outline') {
    bg = 'transparent'
    color = c.foreground
    borderWidth = 1
    borderColor = c.border
  } else if (variant === 'destructive') {
    bg = c.destructiveBg
    color = c.destructive
  } else if (variant === 'success') {
    bg = c.successBg
    color = c.successFg
  } else {
    bg = c.secondary
    color = c.secondaryForeground
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor, borderWidth },
        style,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  text: { fontSize: 12, fontWeight: '500', flexShrink: 1 },
})