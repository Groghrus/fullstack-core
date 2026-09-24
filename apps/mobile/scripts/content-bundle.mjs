import fs from 'node:fs'
import path from 'node:path'
import { codeToTokens } from 'shiki'

const MONOREPO_ROOT = path.resolve(import.meta.dirname, '../../..')
const THEMES_ROOT = path.join(MONOREPO_ROOT, 'packages', 'content', 'themes')
const REGISTRY_PATH = path.join(MONOREPO_ROOT, 'packages', 'content', 'registry.json')
const TITLES_PATH = path.join(MONOREPO_ROOT, 'packages', 'content', 'titles.json')
const OUT_DIR = path.join(import.meta.dirname, '..', 'src', 'generated')
const OUT_FILE = path.join(OUT_DIR, 'content.ts')
const MERMAID_LIB_FILE = path.join(OUT_DIR, 'mermaid-lib.ts')

/**
 * Диаграммы НЕ пре-рендерятся в SVG на этапе сборки: в JSDOM нет движка вёрстки,
 * поэтому метки узлов измерялись неточно и схемы выходили сломанными.
 * В бандл кладётся ИСХОДНИК mermaid-кода, а рендер выполняется на устройстве
 * в WebView (настоящий браузер) тем же mermaid-движком, что и в вебе.
 */

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

/** Mermaid-исходник кладём в бандл как есть — рендер происходит в WebView на устройстве. */
function renderDiagram(code) {
  return code.trim()
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
          const code = renderDiagram(u.code)
          if (!code) {
            stats.errors.push(`${blockId}/${themeId}: пустая mermaid-диаграмма`)
            unitMeta.push({ type: 'diagram', id: null, error: 'пустой mermaid-блок' })
            continue
          }
          stats.diagrams++
          const id = `d${stats.diagrams - 1}`
          diagrams.push({ id, code })
          unitMeta.push({ type: 'diagram', id })
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
export interface Diagram { id: string; code: string }
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

  // mermaid.min.js как строка: WebView рендерит диаграммы на устройстве тем же движком, что и веб.
  const libSource = fs.readFileSync(
    path.join(MONOREPO_ROOT, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
    'utf8',
  )
  const chunkSize = 64 * 1024
  const chunks = []
  for (let i = 0; i < libSource.length; i += chunkSize) {
    chunks.push(JSON.stringify(libSource.slice(i, i + chunkSize)))
  }
  const libOut = `// Автогенерация: npm run bundle:content (apps/mobile)
// mermaid.min.js (v${JSON.parse(fs.readFileSync(path.join(MONOREPO_ROOT, 'node_modules', 'mermaid', 'package.json'), 'utf8')).version}) — НЕ РЕДАКТИРОВАТЬ ВРУЧНУЮ.
export const MermaidLib = [
${chunks.map((c) => `  ${c},`).join('\n')}
].join('')\n`
  fs.writeFileSync(MERMAID_LIB_FILE, libOut, 'utf8')

  const mb = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2)
  const libMb = (fs.statSync(MERMAID_LIB_FILE).size / 1024 / 1024).toFixed(2)
  console.log(`files=${stats.files} diagrams=${stats.diagrams} errors=${stats.errors.length}`)
  console.log(`output: ${OUT_FILE} (${mb} MB)`)
  console.log(`mermaid lib: ${MERMAID_LIB_FILE} (${libMb} MB)`)
  if (stats.errors.length) {
    console.log('--- diagram errors ---')
    for (const e of stats.errors) console.log(e)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})