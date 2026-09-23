/**
 * Цветовые токены — точная копия дизайн-токенов веб-версии (Tailwind/shadcn, OKLCH).
 * Светлая тема — тёплая (stone), тёмная — нейтральная (zinc).
 */
export interface Palette {
  background: string
  foreground: string
  card: string
  cardForeground: string
  accent: string
  accentForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  primary: string
  primaryForeground: string
  border: string
  input: string
  sidebar: string
  sidebarForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  /** фон диаграммы (mermaid) */
  diagramBg: string
  /** фон блока кода (github-dark) */
  codeBg: string
  success: string
  successBg: string
  successFg: string
  amber: string
  amberBg: string
  danger: string
  dangerBg: string
  destructive: string
  destructiveBg: string
}

export const lightPalette: Palette = {
  background: '#faf7f0',
  foreground: '#3b3126',
  card: '#fdfaf4',
  cardForeground: '#3b3126',
  accent: '#f2ebda',
  accentForeground: '#000000',
  secondary: '#f5f0e4',
  secondaryForeground: '#4c4030',
  muted: '#f5f0e4',
  mutedForeground: '#7a6f5c',
  primary: '#6b4a2b',
  primaryForeground: '#faebda',
  border: '#e3d9c1',
  input: '#e3d9c1',
  sidebar: '#f6f1e4',
  sidebarForeground: '#2f2820',
  sidebarAccent: '#ede4cf',
  sidebarAccentForeground: '#000000',
  sidebarBorder: '#e3d9c1',
  diagramBg: '#0f172a',
  codeBg: '#0d1117',
  success: '#059669',
  successBg: '#05966926',
  successFg: '#047857',
  amber: '#f59e0b',
  amberBg: '#f59e0b1a',
  danger: '#dc2626',
  dangerBg: '#7f1d1d',
  destructive: '#dc2626',
  destructiveBg: '#dc26261a',
}

export const darkPalette: Palette = {
  background: '#252525',
  foreground: '#fafafa',
  card: '#333333',
  cardForeground: '#fafafa',
  accent: '#404040',
  accentForeground: '#fafafa',
  secondary: '#3f3f3f',
  secondaryForeground: '#fafafa',
  muted: '#3f3f3f',
  mutedForeground: '#b3b3b3',
  primary: '#e8e8e8',
  primaryForeground: '#2c2c2c',
  border: '#ffffff1a',
  input: '#ffffff26',
  sidebar: '#343434',
  sidebarForeground: '#fafafa',
  sidebarAccent: '#404040',
  sidebarAccentForeground: '#fafafa',
  sidebarBorder: '#ffffff1a',
  diagramBg: '#0f172a',
  codeBg: '#0d1117',
  success: '#059669',
  successBg: '#05966926',
  successFg: '#6ee7b7',
  amber: '#f59e0b',
  amberBg: '#f59e0b1a',
  danger: '#dc2626',
  dangerBg: '#7f1d1d',
  destructive: '#f87171',
  destructiveBg: '#dc26261a',
}

export function palette(dark: boolean): Palette {
  return dark ? darkPalette : lightPalette
}