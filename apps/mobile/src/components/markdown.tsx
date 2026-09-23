import { StyleSheet, Text, View, useColorScheme } from 'react-native'
import Markdown, { MarkdownIt } from 'react-native-markdown-display'
import { useMemo } from 'react'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export function MarkdownView({ source }: { source: string }) {
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: dark ? '#e2e8f0' : '#1e293b',
          fontSize: 15,
          lineHeight: 23,
        },
        heading1: {
          color: dark ? '#f8fafc' : '#0f172a',
          fontSize: 26,
          fontWeight: '700',
          marginTop: 20,
          marginBottom: 10,
        },
        heading2: {
          color: dark ? '#f1f5f9' : '#0f172a',
          fontSize: 21,
          fontWeight: '700',
          marginTop: 24,
          marginBottom: 8,
        },
        heading3: {
          color: dark ? '#e2e8f0' : '#1e293b',
          fontSize: 18,
          fontWeight: '600',
          marginTop: 18,
          marginBottom: 6,
        },
        heading4: {
          color: dark ? '#e2e8f0' : '#1e293b',
          fontSize: 16,
          fontWeight: '600',
          marginTop: 14,
          marginBottom: 4,
        },
        paragraph: {
          color: dark ? '#e2e8f0' : '#1e293b',
          fontSize: 15,
          lineHeight: 23,
          marginTop: 8,
          marginBottom: 8,
        },
        strong: {
          fontWeight: '700',
          color: dark ? '#f8fafc' : '#0f172a',
        },
        em: { fontStyle: 'italic' },
        s: { textDecorationLine: 'line-through' },
        link: { color: '#3b82f6' },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: dark ? '#475569' : '#cbd5e1',
          paddingLeft: 12,
          backgroundColor: dark ? '#1e293b' : '#f1f5f9',
          paddingVertical: 8,
          paddingRight: 8,
          borderRadius: 6,
          marginVertical: 8,
        },
        code_inline: {
          backgroundColor: dark ? '#0f172a' : '#e2e8f0',
          color: dark ? '#93c5fd' : '#1d4ed8',
          fontFamily: 'monospace',
          fontSize: 13,
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 4,
        },
        code_block: {
          backgroundColor: dark ? '#0f172a' : '#1e293b',
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 18,
          color: dark ? '#cbd5e1' : '#e2e8f0',
        },
        fence: {
          backgroundColor: dark ? '#0f172a' : '#1e293b',
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 18,
          color: dark ? '#cbd5e1' : '#e2e8f0',
        },
        table: {
          borderWidth: 1,
          borderColor: dark ? '#334155' : '#cbd5e1',
          borderRadius: 6,
          marginVertical: 8,
        },
        tr: {
          borderBottomWidth: 1,
          borderBottomColor: dark ? '#334155' : '#e2e8f0',
        },
        th: {
          padding: 8,
          backgroundColor: dark ? '#1e293b' : '#f1f5f9',
          color: dark ? '#f1f5f9' : '#0f172a',
          fontWeight: '600',
        },
        td: {
          padding: 8,
          color: dark ? '#e2e8f0' : '#1e293b',
        },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: {
          marginVertical: 3,
          color: dark ? '#e2e8f0' : '#1e293b',
        },
        hr: {
          marginVertical: 16,
          backgroundColor: dark ? '#334155' : '#e2e8f0',
          height: 1,
        },
      }),
    [dark],
  )

  return (
    <Markdown style={styles} markdownit={md}>
      {`${source}\n`}
    </Markdown>
  )
}