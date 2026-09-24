import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Markdown, { MarkdownIt, type RenderRules, type ASTNode } from 'react-native-markdown-display'
import { palette } from '../lib/palette'
import { useTheme } from '../lib/theme'
import type { CodeBlock } from '../generated/content'
import { ChevronRightIcon } from './icons'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

/** Хеш для поиска подсветки кода (djb2) — совпадает с content-bundle.mjs. */
function codeHash(lang: string, code: string): number {
  let h = 5381
  const s = lang + '\n' + code
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h
}

type Unit =
  | { type: 'block'; content: string }
  | { type: 'sub'; heading: string; content: string }

function splitSubsections(source: string): Unit[] {
  const lines = source.split('\n')
  const units: Unit[] = []
  let block: string[] = []
  let sub: { heading: string; body: string[] } | null = null
  let inFence = false

  const flushBlock = () => {
    if (block.length) {
      units.push({ type: 'block', content: block.join('\n') })
      block = []
    }
  }
  const flushSub = () => {
    if (sub) {
      units.push({ type: 'sub', heading: sub.heading, content: sub.body.join('\n') })
      sub = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('```')) inFence = !inFence

    if (!inFence) {
      const m = /^(#{1,3})\s+(.*)$/.exec(trimmed)
      if (m) {
        if (m[1].length === 3) {
          flushBlock()
          flushSub()
          sub = { heading: m[2], body: [] }
          continue
        }
        flushBlock()
        flushSub()
        block = [line]
        continue
      }
    }

    if (sub) sub.body.push(line)
    else block.push(line)
  }
  flushBlock()
  flushSub()
  return units.filter((u) => (u.type === 'block' ? u.content.trim() !== '' : true))
}

function CollapsibleSub({
  heading,
  content,
  codeBlocks,
}: {
  heading: string
  content: string
  codeBlocks?: Record<string, CodeBlock>
}) {
  const { dark } = useTheme()
  const c = palette(dark)
  const [open, setOpen] = useState(false)

  return (
    <View style={[styles.subWrap, { borderColor: c.border, backgroundColor: c.card }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.subSummary}
        aria-expanded={open}
      >
        <Text style={[styles.subHeading, { color: c.foreground }]} numberOfLines={2}>
          {heading}
        </Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color={c.mutedForeground} size={16} />
        </View>
      </Pressable>
      {open && (
        <View style={[styles.subBody, { borderTopColor: c.border }]}>
          <MarkdownBody source={content} codeBlocks={codeBlocks} />
        </View>
      )}
    </View>
  )
}

type FenceNode = ASTNode & { sourceInfo?: string }

function MarkdownBody({
  source,
  codeBlocks,
}: {
  source: string
  codeBlocks?: Record<string, CodeBlock>
}) {
  const { dark } = useTheme()
  const c = palette(dark)

  const rules = useMemo<RenderRules>(
    () => ({
      fence: (node: ASTNode, _ch, _parent, styles) => {
        const fence = node as FenceNode
        const lang = (fence.sourceInfo ?? '').trim().split(/\s+/)[0]
        const key = codeHash(lang, node.content)
        const tokens = codeBlocks?.[key]
        return <HighlightedCode key={node.key} code={node.content} lang={lang} tokens={tokens} />
      },
    }),
    [codeBlocks],
  )

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: c.foreground,
          fontSize: 15,
          lineHeight: 24,
        },
        heading1: {
          color: c.foreground,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.5,
          marginTop: 0,
          marginBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingBottom: 8,
        },
        heading2: {
          color: c.foreground,
          fontSize: 23,
          fontWeight: '600',
          letterSpacing: -0.3,
          marginTop: 40,
          marginBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingBottom: 8,
        },
        heading3: {
          color: c.foreground,
          fontSize: 20,
          fontWeight: '600',
          letterSpacing: -0.3,
          marginTop: 32,
          marginBottom: 6,
        },
        heading4: {
          color: c.foreground,
          fontSize: 18,
          fontWeight: '600',
          marginTop: 24,
          marginBottom: 4,
        },
        paragraph: {
          color: c.foreground,
          fontSize: 15,
          lineHeight: 24,
          marginTop: 8,
          marginBottom: 8,
        },
        strong: {
          fontWeight: '700',
          color: c.foreground,
        },
        em: { fontStyle: 'italic' },
        s: { textDecorationLine: 'line-through' },
        link: { color: c.primary, textDecorationLine: 'underline' },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: c.mutedForeground,
          paddingLeft: 12,
          backgroundColor: c.muted,
          paddingVertical: 8,
          paddingRight: 8,
          borderRadius: 6,
          marginVertical: 12,
        },
        code_inline: {
          backgroundColor: c.muted,
          color: c.foreground,
          fontFamily: 'monospace',
          fontSize: 13,
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 4,
        },
        code_block: {
          backgroundColor: c.card,
          padding: 12,
          borderRadius: 8,
          marginVertical: 12,
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 18,
          color: c.mutedForeground,
          borderWidth: 1,
          borderColor: c.border,
        },
        fence: {
          backgroundColor: c.card,
          padding: 12,
          borderRadius: 8,
          marginVertical: 12,
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 18,
          color: c.mutedForeground,
          borderWidth: 1,
          borderColor: c.border,
        },
        table: {
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 6,
          marginVertical: 16,
        },
        th: {
          padding: 8,
          backgroundColor: c.muted,
          color: c.foreground,
          fontWeight: '600',
          fontSize: 14,
        },
        td: {
          padding: 8,
          color: c.foreground,
          fontSize: 14,
          borderWidth: 1,
          borderColor: c.border,
        },
        bullet_list: { marginVertical: 8, marginLeft: 4 },
        ordered_list: { marginVertical: 8, marginLeft: 4 },
        list_item: {
          marginVertical: 4,
          color: c.foreground,
          flexDirection: 'row',
        },
        hr: {
          marginVertical: 24,
          backgroundColor: c.border,
          height: 1,
        },
      }),
    [c],
  )

  return (
    <Markdown style={styles} markdownit={md} rules={rules}>
      {`${source}\n`}
    </Markdown>
  )
}

function HighlightedCode({
  code,
  lang,
  tokens,
}: {
  code: string
  lang: string
  tokens: CodeBlock | undefined
}) {
  const { dark } = useTheme()
  const c = palette(dark)

  if (!tokens || tokens.length === 0) {
    return (
      <View style={[styles.codeBlock, { backgroundColor: c.codeBg, borderColor: c.border }]}>
        {lang ? (
          <Text style={[styles.codeLang, { color: c.mutedForeground }]}>{lang}</Text>
        ) : null}
        <Text style={[styles.codeText, { color: c.foreground }]}>
          {code.replace(/\n$/, '')}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.codeBlock, { backgroundColor: c.codeBg, borderColor: c.border }]}>
      {lang ? (
        <Text style={[styles.codeLang, { color: c.mutedForeground }]}>{lang}</Text>
      ) : null}
      {tokens.map((line, i) => (
        <Text key={i} style={styles.codeLine}>
          {line.map(([text, color], j) => (
            <Text key={j} style={color ? { color } : undefined}>
              {text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  )
}

export function MarkdownView({
  source,
  codeBlocks,
}: {
  source: string
  codeBlocks?: Record<string, CodeBlock>
}) {
  const units = useMemo(() => splitSubsections(source), [source])

  return (
    <View>
      {units.map((u, i) =>
        u.type === 'sub' ? (
          <View key={i} style={styles.unitWrap}>
            <CollapsibleSub heading={u.heading} content={u.content} codeBlocks={codeBlocks} />
          </View>
        ) : (
          <View key={i}>
            <MarkdownBody source={u.content} codeBlocks={codeBlocks} />
          </View>
        ),
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  subWrap: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeBlock: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  codeLang: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  codeLine: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    lineHeight: 18,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    lineHeight: 18,
  },
  subSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subHeading: { fontSize: 16, fontWeight: '600', flex: 1 },
  subBody: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unitWrap: { marginVertical: 6 },
})