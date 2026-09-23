import { useMemo } from 'react'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { WebView } from 'react-native-webview'

function parseViewBox(svg: string): { w: number; h: number } | null {
  const m = svg.match(/viewBox="(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)"/)
  if (!m) return null
  return { w: parseFloat(m[3]), h: parseFloat(m[4]) }
}

export function Diagram({ svg }: { svg: string }) {
  const { width } = useWindowDimensions()
  const inner = Math.min(width - 36, 900)

  const ratio = useMemo(() => {
    const vb = parseViewBox(svg)
    return vb ? vb.h / vb.w : 0.5
  }, [svg])

  const html = useMemo(
    () => `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html,body { margin:0; padding:0; background:#0f172a; }
  .wrap { display:flex; justify-content:center; }
  svg { max-width:100%; height:auto; display:block; background:#0f172a; }
</style></head>
<body><div class="wrap">${svg}</div></body></html>`,
    [svg],
  )

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
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
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
})