import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

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
  const text = this.textContent || ''
  return { x: 0, y: 0, width: text.length ? text.length * 7 + 16 : 60, height: 30 }
}

const mermaid = (await import('mermaid')).default

globalThis.btoa = (s) => Buffer.from(s, 'utf8').toString('base64')
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('utf8')

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

async function renderDiagram(code, index) {
  const { svg } = await mermaid.render(`diagram-${index}-${Date.now()}`, code)
  return svg
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
          unitMeta.push({ type: 'md', content: u.content })
        }
      }

      const quizData = parseQuiz(quiz, themeId)
      themes[themeId] = {
        blockId,
        frontmatter,
        title: frontmatter.title || titles[themeId] || themeId,
        units: unitMeta,
        diagrams,
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
export interface ThemeData {
  blockId: string
  title: string
  frontmatter: Record<string, string>
  units: Unit[]
  diagrams: Diagram[]
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