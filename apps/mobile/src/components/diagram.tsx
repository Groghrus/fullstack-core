import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { palette } from '../lib/palette'
import { useTheme } from '../lib/theme'
import { MermaidLib } from '../generated/mermaid-lib'

const MERMAID_INIT = `{
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
  themeVariables: {
    background: 'transparent',
  },
}`

function buildHtml(code: string): string {
  const codeJson = JSON.stringify(code)
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html,body { margin:0; padding:0; background:#0f172a; }
  #mmd { width:100%; }
  #mmd svg { max-width:100%; height:auto; display:block; }
  #err { color:#fca5a5; font:13px system-ui,sans-serif; padding:10px; }
</style></head>
<body><div id="mmd"></div><script>
${MermaidLib}
</script>
<script>
(function () {
  try {
    const mermaid = globalThis.mermaid;
    mermaid.initialize(${MERMAID_INIT});
    const code = ${codeJson};
    mermaid.render('mmd-' + Math.random().toString(36).slice(2), code).then(function (res) {
      var holder = document.getElementById('mmd');
      holder.innerHTML = res.svg;
      var h = holder.scrollHeight || 0;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ ok: true, height: Math.ceil(h) }));
      }
    }).catch(function (err) {
      var errEl = document.getElementById('err');
      if (errEl) errEl.textContent = 'Ошибка рендера диаграммы: ' + (err && err.message ? err.message : err);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
      }
    });
  } catch (err) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, error: String(err) }));
    }
  }
})();
</script></body></html>`
}

/** Гарантирует, что mermaid подключён на странице (web-режим RN). */
let mermaidScriptInjected = false
function ensureMermaid(): boolean {
  if ((globalThis as { mermaid?: unknown }).mermaid) return true
  if (mermaidScriptInjected) return false
  mermaidScriptInjected = true
  try {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.textContent = MermaidLib
    document.head.appendChild(script)
    return !!(globalThis as { mermaid?: unknown }).mermaid
  } catch {
    return false
  }
}

function WebDiagram({ code, bg, border }: { code: string; bg: string; border: string }) {
  const host = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        if (!ensureMermaid()) {
          if (!cancelled) setError('Библиотека mermaid не загрузилась')
          return
        }
        const mermaid = (
          globalThis as unknown as {
            mermaid: {
              initialize: (o: unknown) => void
              render: (id: string, code: string) => Promise<{ svg: string }>
            }
          }
        ).mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
          themeVariables: { background: 'transparent' },
        })
        const id = 'mmd-' + Math.random().toString(36).slice(2)
        const { svg } = await mermaid.render(id, code)
        if (!cancelled && host.current) {
          host.current.innerHTML = svg
        }
      } catch (e) {
        if (!cancelled) setError(String((e as Error)?.message ?? e))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: border }]}>
      {error ? (
        <div style={{ color: '#fca5a5', fontSize: 13, fontFamily: 'system-ui, sans-serif', padding: 10 }}>
          Ошибка рендера диаграммы: {error}
        </div>
      ) : (
        <div
          ref={host}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        />
      )}
    </View>
  )
}

export function Diagram({ code }: { code: string }) {
  const { dark } = useTheme()
  const c = palette(dark)
  const { width } = useWindowDimensions()
  const inner = Math.min(width - 36, 900)
  const [height, setHeight] = useState<number>(200)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<WebView>(null)

  const html = useMemo(() => buildHtml(code), [code])

  useEffect(() => {
    setHeight(200)
    setError(null)
  }, [code])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.ok && typeof msg.height === 'number' && msg.height > 0) {
        setHeight(msg.height)
      } else if (!msg.ok) {
        setError(msg.error || 'Неизвестная ошибка')
      }
    } catch {
      // ignore malformed messages
    }
  }, [])

  if (Platform.OS === 'web') {
    return <WebDiagram code={code} bg={c.card} border={c.border} />
  }

  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
      {error ? (
        <View style={styles.errorWrap}>
          <div style={{ color: '#fca5a5', fontSize: 13, fontFamily: 'system-ui, sans-serif', padding: 10 }}>
            Ошибка рендера диаграммы: {error}
          </div>
        </View>
      ) : (
        <WebView
          ref={ref}
          originWhitelist={['*']}
          source={{ html }}
          style={{ width: inner, height }}
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          onMessage={onMessage}
        />
      )}
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
  errorWrap: {
    minHeight: 60,
    justifyContent: 'center',
  },
})