import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { codeToTokens } from 'shiki'

const MONOREPO_ROOT = path.resolve(import.meta.dirname, '../../..')
const THEMES_ROOT = path.join(MONOREPO_ROOT, 'packages', 'content', 'themes')
const REGISTRY_PATH = path.join(MONOREPO_ROOT, 'packages', 'content', 'registry.json')
const TITLES_PATH = path.join(MONOREPO_ROOT, 'packages', 'content', 'titles.json')
const OUT_DIR = path.join(import.meta.dirname, '..', 'src', 'generated')
const OUT_FILE = path.join(OUT_DIR, 'content.ts')

const MF_THEME = process.env.MF_THEME || 'dark'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true,
})
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.CSSStyleSheet = dom.window.CSSStyleSheet
globalThis.SVGElement = dom.window.SVGElement
globalThis.Node = dom.window.Node
globalThis.Element = dom.window.Element

dom.window.SVGElement.prototype.getBBox = function () {
  // JSDOM не рендерит SVG, поэтому имитируем измерение текста: длинные подписи
  // переносятся по ширине ~200px (как браузерный mermaid с htmlLabels),
  // отчего узел становится выше, а не бесконечно шире.
  const text = (this.textContent || '').replace(/[{}\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
  const { w, h } = measureText(text)
  return { x: 0, y: 0, width: w, height: h }
}

/** imitates browser text measuring done by mermaid's htmlLabels (max-width: 200px). */
function measureText(text) {
  const charW = 7.2
  const padW = 16
  const padH = 12
  const lineH = 24
  const maxInnerW = 200 - padW
  const raw = (text || '').length * charW
  const lines = Math.max(1, Math.ceil(raw / maxInnerW))
  const w = Math.min(raw, maxInnerW) + padW
  const h = lines * lineH + padH
  return { w: Math.round(w), h: Math.round(h) }
}

const mermaid = (await import('mermaid')).default

globalThis.btoa = (s) => Buffer.from(s, 'utf8').toString('base64')
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('latin1')

mermaid.initialize({
  startOnLoad: false,
  theme: MF_THEME,
  securityLevel: 'strict',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
})

function parseFrontmatter(content) {
  const fm = {}
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([^:]+):\s*(.*)$/)
      if (kv) {
        let v = kv[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        fm[kv[1].trim()] = v
      }
    }
  }
  return fm
}

function splitTheme(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  let body = content
  if (fmMatch) body = content.slice(fmMatch[0].length)
  const quizMatch = body.match(/^##\s+Вопросы[\s\S]*$/m)
  let quiz = null
  if (quizMatch) {
    quiz = quizMatch[0]
    body = body.slice(0, quizMatch.index)
  }
  return { body, quiz }
}

function parseQuiz(section, themeId) {
  if (!section) return []
  const questions = []
  const blocks = section.split(/^###\s+/m).slice(1)
  for (const raw of blocks) {
    const lines = raw.split('\n')
    const idLine = lines[0]?.trim() || 'Q'
    const id = themeId ? `${themeId}-${idLine}` : idLine
    const body = lines.slice(1)
    const promptMatch = body.join('\n').match(/^\s*\*\*(.+?)\*\*/)
    const prompt = promptMatch ? promptMatch[1] : body[0] || ''
    const draft = /\(draft\)/.test(body.slice(0, 5).join('\n'))
    const options = []
    let correctIndex = -1
    body
      .filter((l) => /^\s*[-*]\s+\[[ xX]\]/.test(l))
      .forEach((l, i) => {
        const checked = /\[[xX]\]/.test(l)
        options.push(l.replace(/^\s*[-*]\s+\[[ xX]\]\s*/, ''))
        if (checked) correctIndex = i
      })
    const explMatch = body.join('\n').match(/Пояснение:\s*(.+)/i)
    if (options.length) {
      questions.push({
        id,
        prompt,
        options,
        correctIndex,
        explanation: explMatch ? explMatch[1].trim() : '',
        draft,
      })
    }
  }
  return questions
}

/** Разбивает markdown на части: чистый md и mermaid-блоки (рендерятся в SVG). */
function splitUnits(body) {
  const units = []
  const re = /^```mermaid\s*\n([\s\S]*?)```\s*$/gm
  let last = 0
  for (const m of body.matchAll(re)) {
    if (m.index > last) units.push({ type: 'md', content: body.slice(last, m.index) })
    units.push({ type: 'diagram', code: m[1].trim() })
    last = m.index + m[0].length
  }
  if (last < body.length) units.push({ type: 'md', content: body.slice(last) })
  return units.filter((u) => u.type !== 'md' || u.content.trim())
}

/** Убирает первый `# Заголовок` из тела — заголовок показывает шапка страницы. */
function stripFirstHeading(body) {
  return body.replace(/^\s*#\s+.*(?:\r?\n|$)/, '')
}

const FENCE_RE = /```(\w+)\s*\n([\s\S]*?)```/g

/** Хеш для поиска подсветки кода (djb2) — должен совпадать с реализацией в app. */
function codeHash(lang, code) {
  let h = 5381
  const s = lang + '\n' + code
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h
}

/** Извлекает fenced-блоки кода из markdown-портации и подсвечивает их (Shiki, github-dark). */
let highlightWarned = false
async function highlightCode(mdContent) {
  const hits = []
  let m
  const re = new RegExp(FENCE_RE.source, 'g')
  while ((m = re.exec(mdContent)) !== null) {
    const lang = m[1].toLowerCase()
    const code = m[2]
    let tokens = null
    try {
      const r = await codeToTokens(code, { lang, theme: 'github-dark' })
      tokens = r.tokens.map((line) =>
        line.map((t) => [t.content, t.color]),
      )
    } catch (e) {
      if (!highlightWarned) {
        highlightWarned = true
        console.log('FIRST CODE TOKENS ERROR:', String(e).slice(0, 400))
      }
      tokens = null
    }
    hits.push({ key: codeHash(lang, code), tokens })
  }
  return hits
}

/** Извлекает читаемый текст из markdown (для оффлайн-поиска): без frontmatter, кода, служебных символов. */
function extractText(md) {
  let s = md
  s = s.replace(/^---\r?\n[\s\S]*?\r?\n---/, ' ')
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/`[^`]*`/g, ' ')
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/[*_~]{1,3}/g, ' ')
  s = s.replace(/^\s{0,3}>\s?/gm, '')
  s = s.replace(/^\s{0,3}(?:[-*]|\d+\.)\s+/gm, '')
  s = s.replace(/[|]/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * JSDOM не измеряет текст, поэтому для flowchart mermaid оставляет foreignObject
 * размером 0 и miscalculates viewBox (берётся из mock getBBox корня <svg>).
 * После рендера пересчитываем размеры узлов по длине подписи и восстанавливаем viewBox.
 */
function postProcessSvg(svg) {
  const doc = new dom.window.DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const nodes = root.querySelectorAll('g.node')
  const clusters = root.querySelectorAll('g.cluster')
  if (!nodes.length && !clusters.length) return svg
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let touched = 0

  // Кластеры (subgraph): включаем их рамки с подписями в границы viewBox.
  for (const g of clusters) {
    const rect = g.querySelector(':scope > rect')
    if (!rect) continue
    const x = parseFloat(rect.getAttribute('x') || '0')
    const y = parseFloat(rect.getAttribute('y') || '0')
    const w = parseFloat(rect.getAttribute('width') || '0')
    const h = parseFloat(rect.getAttribute('height') || '0')
    if (!(w > 0) || !(h > 0)) continue
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + w)
    maxY = Math.max(maxY, y + h)
    touched++
    // Расширить высоту кластера под заголовок (он рисуется чуть выше rect).
    const label = g.querySelector('.cluster-label')
    if (label) {
      const tm = label.getAttribute('transform')?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
      if (tm) {
        const ty = parseFloat(tm[2])
        minY = Math.min(minY, ty - 3)
      }
    }
  }

  for (const g of nodes) {
    const tm = g.getAttribute('transform')?.match(/translate\(([-\d.]+), ?([-\d.]+)\)/)
    if (!tm) continue
    const tx = parseFloat(tm[1])
    const ty = parseFloat(tm[2])
    const label = (g.textContent || '').replace(/<\s*style[^>]*>[\s\S]*?<\/?style>/gi, '').replace(/\s+/g, ' ').trim()
    const { w: nodeW, h: nodeH } = measureText(label)
    const rect = g.querySelector('rect.basic, rect[class*="container"]')
    if (rect) {
      rect.setAttribute('x', String(-nodeW / 2))
      rect.setAttribute('y', String(-nodeH / 2))
      rect.setAttribute('width', String(nodeW))
      rect.setAttribute('height', String(nodeH))
      touched++
    }
    const fo = g.querySelector('foreignObject')
    if (fo) {
      fo.setAttribute('width', String(nodeW - 4))
      fo.setAttribute('height', String(nodeH - 4))
    }
    minX = Math.min(minX, tx - nodeW / 2)
    minY = Math.min(minY, ty - nodeH / 2)
    maxX = Math.max(maxX, tx + nodeW / 2)
    maxY = Math.max(maxY, ty + nodeH / 2)
  }

  // Подписи рёбер и кластеров: foreignObject без размеров должен показывать текст.
  for (const fo of root.querySelectorAll('foreignObject')) {
    if (parseFloat(fo.getAttribute('width') || '0') > 0) continue
    const text = (fo.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const { w, h } = measureText(text)
    fo.setAttribute('width', String(w))
    fo.setAttribute('height', String(h))
  }

  if (touched && isFinite(minX)) {
    const pad = 8
    const vbW = maxX - minX + pad * 2
    const vbH = maxY - minY + pad * 2
    root.setAttribute('viewBox', `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`)
    const style = root.getAttribute('style') || ''
    root.setAttribute('style', style.replace(/max-width:\s*[\d.]+\s*px/, `max-width: ${vbW.toFixed(1)}px`))
  }
  return new dom.window.XMLSerializer().serializeToString(root)
}

async function renderDiagram(code, index) {
  const { svg } = await mermaid.render(`diagram-${index}-${Date.now()}`, code)
  return postProcessSvg(svg)
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'))
  const titles = JSON.parse(fs.readFileSync(TITLES_PATH, 'utf8'))

  const themes = {}
  const stats = { files: 0, diagrams: 0, errors: [] }

  const blockDirs = fs.readdirSync(THEMES_ROOT)
  for (const blockId of blockDirs.sort()) {
    const blockDir = path.join(THEMES_ROOT, blockId)
    if (!fs.statSync(blockDir).isDirectory()) continue
    for (const file of fs.readdirSync(blockDir)) {
      if (!file.endsWith('.md')) continue
      const themeId = file.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(blockDir, file), 'utf8')
      const frontmatter = parseFrontmatter(raw)
      const { body, quiz } = splitTheme(raw)
      const units = splitUnits(stripFirstHeading(body))

      const diagrams = []
      const unitMeta = []
      const codeHits = []
      for (const u of units) {
        if (u.type === 'diagram') {
          try {
            const svg = await renderDiagram(u.code, stats.diagrams)
            stats.diagrams++
            const id = `d${stats.diagrams - 1}`
            diagrams.push({ id, svg })
            unitMeta.push({ type: 'diagram', id })
          } catch (e) {
            stats.errors.push(`${blockId}/${themeId}: ${String(e).slice(0, 200)}`)
            if (stats.errors.length === 1) {
              console.log('FIRST ERROR STACK:\n' + e.stack.split('\n').slice(0, 15).join('\n'))
            }
            unitMeta.push({ type: 'diagram', id: null, error: String(e).slice(0, 200) })
          }
        } else {
          codeHits.push(...(await highlightCode(u.content)))
          unitMeta.push({ type: 'md', content: u.content })
        }
      }

      const codeBlocks = {}
      for (const h of codeHits) {
        if (!(h.key in codeBlocks)) codeBlocks[h.key] = h.tokens
      }

      const quizData = parseQuiz(quiz, themeId)
      themes[themeId] = {
        blockId,
        frontmatter,
        title: frontmatter.title || titles[themeId] || themeId,
        searchText: extractText(raw),
        units: unitMeta,
        diagrams,
        codeBlocks,
        quiz: quizData,
      }
      stats.files++
    }
  }

  const out = `// Автогенерация: npm run bundle:content (apps/mobile)
// Источник: packages/content/themes — НЕ РЕДАКТИРОВАТЬ ВРУЧНУЮ.
export interface Diagram { id: string; svg: string }
export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  draft: boolean
}
export type Unit =
  | { type: 'md'; content: string }
  | { type: 'diagram'; id: string }
  | { type: 'diagram-error'; error: string }
export type CodeLine = [string, string | null][]
export type CodeBlock = CodeLine[] | null
export interface ThemeData {
  blockId: string
  title: string
  frontmatter: Record<string, string>
  searchText: string
  units: Unit[]
  diagrams: Diagram[]
  codeBlocks: Record<string, CodeBlock>
  quiz: QuizQuestion[]
}
export const contentRegistry = ${JSON.stringify(registry, null, 2)} as const
export const contentTitles: Record<string, string> = ${JSON.stringify(titles, null, 2)}
export const themes: Record<string, ThemeData> = ${JSON.stringify(themes).replace(/</g, '\\u003c')}
export const generatedAt = new Date(${Date.now()})\n`

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_FILE, out, 'utf8')

  const mb = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2)
  console.log(`files=${stats.files} diagrams=${stats.diagrams} errors=${stats.errors.length}`)
  console.log(`output: ${OUT_FILE} (${mb} MB)`)
  if (stats.errors.length) {
    console.log('--- diagram errors ---')
    for (const e of stats.errors) console.log(e)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})