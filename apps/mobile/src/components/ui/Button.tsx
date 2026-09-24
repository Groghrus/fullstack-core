import type { ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native'
import { palette } from '../../lib/palette'
import { useTheme } from '../../lib/theme'

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export function Button({
  variant = 'default',
  size = 'default',
  children,
  onPress,
  disabled,
  style,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
}) {
  const { dark } = useTheme()
  const c = palette(dark)

  let bg: string
  let tint: string
  let borderWidth = 0
  let borderColor: string | undefined
  if (variant === 'default') {
    bg = c.primary
    tint = c.primaryForeground
  } else if (variant === 'outline') {
    bg = c.card
    tint = c.foreground
    borderWidth = 1
    borderColor = c.input
  } else if (variant === 'secondary') {
    bg = c.secondary
    tint = c.secondaryForeground
  } else {
    bg = 'transparent'
    tint = c.foreground
  }

  const sizeStyle =
    size === 'sm'
      ? styles.sizeSm
      : size === 'lg'
        ? styles.sizeLg
        : size === 'icon'
          ? styles.sizeIcon
          : styles.sizeDefault

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        { backgroundColor: bg, borderColor, borderWidth },
        disabled && styles.disabled,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: tint }]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 8,
  },
  sizeDefault: { height: 36, paddingHorizontal: 16 },
  sizeSm: { height: 32, paddingHorizontal: 12 },
  sizeLg: { height: 40, paddingHorizontal: 24 },
  sizeIcon: { width: 36, height: 36 },
  disabled: { opacity: 0.4 },
  text: { fontSize: 14, fontWeight: '500' },
})