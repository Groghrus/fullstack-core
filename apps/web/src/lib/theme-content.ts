export interface ParsedTheme {
  frontmatter: Record<string, string>
  body: string
  quiz: string | null
}

/** Разделяет markdown на frontmatter, тело и секцию «Вопросы» */
export function splitTheme(content: string): ParsedTheme {
  let body = content
  const frontmatter: Record<string, string> = {}

  // frontmatter --- ... ---
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (fmMatch) {
    for (const line of fmMatch[1].split('\n')) {
      const mm = line.match(/^([^:]+):\s*(.*)$/)
      if (mm) frontmatter[mm[1].trim()] = mm[2].trim()
    }
    body = content.slice(fmMatch[0].length)
  }

  // секция ## Вопросы (и всё после неё)
  const quizMatch = body.match(/^##\s+Вопросы[\s\S]*$/m)
  let quiz: string | null = null
  if (quizMatch) {
    quiz = quizMatch[0]
    body = body.slice(0, quizMatch.index)
  }

  return { frontmatter, body, quiz }
}
