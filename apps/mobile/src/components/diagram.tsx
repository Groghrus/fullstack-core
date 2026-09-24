import { useMemo } from 'react'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { palette } from '../lib/palette'
import { useTheme } from '../lib/theme'

function parseViewBox(svg: string): { x: number; y: number; w: number; h: number } | null {
  const m = svg.match(/viewBox="(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)"/)
  if (!m) return null
  return { x: parseFloat(m[1]), y: parseFloat(m[2]), w: parseFloat(m[3]), h: parseFloat(m[4]) }
}

function svgStyle(svg: string): string {
  const m = svg.match(/<svg[^>]*style="([^"]*)"/)
  return m ? m[1] : ''
}

export function Diagram({ svg }: { svg: string }) {
  const { dark } = useTheme()
  const c = palette(dark)
  const { width } = useWindowDimensions()
  const inner = Math.min(width - 36, 900)

  const vb = useMemo(() => parseViewBox(svg), [svg])
  const ratio = vb ? vb.h / vb.w : 0.5

  const html = useMemo(
    () => `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html,body { margin:0; padding:0; background:#0f172a; }
  .wrap { display:flex; justify-content:center; align-items:center; }
  svg { max-width:100%; height:auto; display:block; background:#0f172a; }
</style></head>
<body><div class="wrap">${svg}</div></body></html>`,
    [svg],
  )

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
        <div
          className="diagram-svg"
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </View>
    )
  }

  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ width: inner, height: Math.max(60, inner * ratio) }}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
})