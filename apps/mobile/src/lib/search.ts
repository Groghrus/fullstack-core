import { contentRegistry, themes } from '../generated/content'

export interface ThemeSearchResult {
  themeId: string
  blockId: string
  title: string
  path: string
  snippet: string
  score: number
}

const STOPWORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все',
  'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по',
  'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему',
  'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть',
  'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом',
  'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для',
  'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз',
  'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого',
  'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой', 'тем', 'чтобы',
  'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'никогда', 'можно',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her', 'was',
  'one', 'our', 'out', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
  'old', 'see', 'two', 'way', 'who', 'did', 'its', 'let', 'put', 'say', 'she',
  'too', 'use', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know',
  'want', 'been', 'good', 'much', 'some', 'time', 'only', 'into', 'than', 'them', 'when',
  'make', 'many', 'then', 'these', 'like', 'long', 'look', 'more', 'most', 'other',
  'such', 'also', 'does', 'each', 'just', 'what', 'which', 'where', 'would', 'could',
  'should', 'about', 'there', 'their', 'those', 'because', 'between', 'before',
  'after', 'over', 'under', 'again', 'further', 'once', 'here',
])

const MIN_WORD = 3

const RU_SUFFIXES = [
  'аться', 'ться', 'уется', 'ировать', 'овать', 'евать', 'ывать',
  'ение', 'ние', 'ство', 'ость', 'ание',
  'ются', 'ется', 'ешь', 'ишь', 'ами', 'ями', 'ого', 'его', 'ому', 'ему',
  'ыми', 'ими', 'ых', 'их', 'ая', 'яя', 'ые', 'ие', 'ый', 'ий', 'ое', 'ее',
  'ов', 'ев', 'ей', 'ым', 'ом', 'ем', 'ать', 'ять', 'еть', 'ить', 'ут', 'ют',
]

function stem(word: string): string {
  for (const s of RU_SUFFIXES) {
    if (word.endsWith(s) && word.length - s.length >= MIN_WORD) {
      return word.slice(0, word.length - s.length)
    }
  }
  if (/ing$/.test(word) && word.length > 6) return word.slice(0, -3)
  if (/(ed|er|ly)$/.test(word) && word.length > 5) return word.slice(0, -2)
  if (/es$/.test(word) && word.length > 4) return word.slice(0, -2)
  if (/s$/.test(word) && word.length > 4) return word.slice(0, -1)
  return word
}

export function tokenize(text: string): string[] {
  const out: string[] = []
  const lower = text.toLowerCase()
  for (const m of lower.matchAll(/[\p{L}\p{N}]+/gu)) {
    const w = stem(m[0])
    if (w.length >= MIN_WORD && !STOPWORDS.has(w)) out.push(w)
  }
  return out
}

interface Doc {
  id: string
  blockId: string
  path: string
  title: string
  text: string
}

interface Index {
  docs: Doc[]
  words: Record<string, { d: number; tf: number; inTitle: boolean }[]>
}

let cachedIndex: Index | null = null

function buildIndex(): Index {
  if (cachedIndex) return cachedIndex
  const docs: Doc[] = []
  for (const block of contentRegistry.blocks) {
    for (const themeId of block.themes) {
      const theme = themes[themeId]
      if (!theme) continue
      docs.push({
        id: themeId,
        blockId: block.id,
        path: `${block.id}/${themeId}`,
        title: theme.title,
        text: theme.searchText,
      })
    }
  }
  const words: Index['words'] = {}
  docs.forEach((doc, d) => {
    const counts: Record<string, number> = {}
    for (const t of tokenize(doc.text)) counts[t] = (counts[t] ?? 0) + 1
    const keyTokens = new Set([...tokenize(doc.title), ...tokenize(doc.id)])
    for (const t of keyTokens) counts[t] = (counts[t] ?? 0) + 2
    for (const t of Object.keys(counts)) {
      ;(words[t] ??= []).push({ d, tf: counts[t], inTitle: keyTokens.has(t) })
    }
  })
  cachedIndex = { docs, words }
  return cachedIndex
}

function makeSnippet(text: string, qTokens: string[]): string {
  const lower = text.toLowerCase()
  let best = -1
  for (const t of qTokens) {
    const i = lower.indexOf(t)
    if (i >= 0 && (best === -1 || i < best)) best = i
  }
  const WINDOW = 70
  if (best === -1) {
    return text.length > 140 ? text.slice(0, 140).trim() + '…' : text.trim()
  }
  let start = Math.max(0, best - WINDOW)
  let end = Math.min(text.length, best + WINDOW)
  while (start > 0 && !/\s/.test(text[start - 1])) start--
  while (end < text.length && !/\s/.test(text[end])) end++
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '')
}

export function searchThemes(query: string, limit = 15): ThemeSearchResult[] {
  const index = buildIndex()
  const qTokens = tokenize(query)
  if (!qTokens.length) return []
  const scores = new Map<number, number>()
  for (const t of qTokens) {
    const entry = index.words[t]
    if (!entry) continue
    for (const { d, tf, inTitle } of entry) {
      const boost = inTitle ? 3 : 1
      scores.set(d, (scores.get(d) ?? 0) + boost * (1 + Math.log(tf)))
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([d, score]) => {
      const doc = index.docs[d]
      return {
        themeId: doc.id,
        blockId: doc.blockId,
        title: doc.title,
        path: doc.path,
        snippet: makeSnippet(doc.text, qTokens),
        score,
      }
    })
}