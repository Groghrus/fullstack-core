/**
 * Общие типы проекта fullstack-core.
 * Используются веб- и мобильным клиентом, а также контентом.
 */

/** Язык, для которого пишется пример кода в теме */
export type CodeLanguage = 'typescript' | 'go' | 'java'

/** Сложность темы */
export type Difficulty = 'beginner' | 'medium' | 'advanced'

/** Статус готовности темы */
export type ThemeStatus = 'draft' | 'done'

/** Frontmatter-метаданные каждой темы */
export interface ThemeMeta {
  id: string
  title: string
  block: string
  tags: string[]
  order: number
  related: string[]
  difficulty: Difficulty
  languages: CodeLanguage[]
  status: ThemeStatus
}

/** Вопрос из секции ## Вопросы (quiz) */
export interface QuizQuestion {
  question: string
  // 0-based индекс правильного варианта в массиве options
  correctIndex: number
  options: string[]
  explanation?: string
  draft?: boolean
}

/** Прогресс пользователя по теме (хранится в localStorage) */
export interface ThemeProgress {
  themeId: string
  status: 'new' | 'in_progress' | 'done'
  bookmarked: boolean
  lastReadAt?: number
  quizScore?: number
  quizMax?: number
}
